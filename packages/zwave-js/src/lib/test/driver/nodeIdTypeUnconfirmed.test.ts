import { NodeIDType, ZWaveDataRate, encodeNodeID } from "@zwave-js/core";
import {
	FunctionType,
	Message,
	MessageHeaders,
	MessageType,
} from "@zwave-js/serial";
import {
	SendDataBridgeRequest,
	SendDataRequest,
	SerialAPISetupCommand,
	SerialAPISetup_SetNodeIDTypeRequest,
	SerialAPISetup_SetNodeIDTypeResponse,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
	SetPriorityRouteRequest,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";
import {
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";

import { determineNIF } from "../../controller/NodeInformationFrame.js";
import { integrationTest } from "../integrationTestSuite.js";

// A controller below SDK 7.21 that can switch the node ID type and set priority routes
const controllerCapabilities: Partial<MockControllerCapabilities> = {
	libraryVersion: "Z-Wave 7.19.3",
	supportedFunctionTypes: [
		...getDefaultSupportedFunctionTypes(),
		FunctionType.SerialAPISetup,
		FunctionType.SetPriorityRoute,
	],
	supportedSerialAPISetupCommands: [SerialAPISetupCommand.SetNodeIDType],
};

// Like 7.xx firmwares, the response is missing the result byte with 16-bit node IDs
const acceptPriorityRoute: MockControllerBehavior = {
	async onHostMessage(controller, msg) {
		if (!(msg instanceof SetPriorityRouteRequest)) return;
		const nodeIdType = controller.parsingContext.nodeIdType;
		const nodeId = encodeNodeID(msg.destinationNodeId, nodeIdType);
		await controller.sendMessageToHost(
			new Message({
				type: MessageType.Response,
				functionType: FunctionType.SetPriorityRoute,
				payload:
					nodeIdType === NodeIDType.Long
						? nodeId
						: Bytes.concat([nodeId, [0x01]]),
			}),
		);
		return true;
	},
};

// Lets the controller reject the SetNodeIDType requests that match the predicate
function rejectSetNodeIDType(
	predicate: (msg: SerialAPISetup_SetNodeIDTypeRequest) => boolean,
): MockControllerBehavior {
	return {
		async onHostMessage(controller, msg) {
			if (
				msg instanceof SerialAPISetup_SetNodeIDTypeRequest
				&& predicate(msg)
			) {
				await controller.sendMessageToHost(
					new SerialAPISetup_SetNodeIDTypeResponse({
						success: false,
					}),
				);
				return true;
			}
		},
	};
}

integrationTest.sequential(
	"When the node ID type cannot be confirmed after a soft reset, the driver sends no node traffic and fails",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Start with 16-bit node IDs
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.response = 200;

			// Let the controller ignore SetNodeIDType after the reset
			const ignoreSetNodeIDType: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					return msg instanceof SerialAPISetup_SetNodeIDTypeRequest;
				},
			};
			mockController.defineBehavior(ignoreSetNodeIDType);
			// Watch for the driver to fail
			const failed = new Promise<Error>((resolve) =>
				driver.once("error", resolve),
			);
			// Soft-reset and queue a ping
			mockController.clearReceivedHostMessages();

			const resetPromise = driver.softReset();
			void node.ping().catch(() => {});
			// The reset fails and the driver destroys itself
			await t.expect(resetPromise).rejects.toThrow();
			await failed;

			// No SendData may follow the reset
			const messages = mockController.receivedHostMessages;
			const resetIndex = messages.findIndex(
				(msg) => msg instanceof SoftResetRequest,
			);
			t.expect(
				messages
					.slice(resetIndex + 1)
					.some(
						(msg) =>
							msg instanceof SendDataRequest
							|| msg instanceof SendDataBridgeRequest,
					),
			).toBe(false);
		},
	},
);

integrationTest(
	"When the controller rejects the temporary switch to 8-bit node IDs, no priority route is sent",
	{
		// debug: true,

		controllerCapabilities,

		customSetup: async (driver, mockController) => {
			mockController.defineBehavior(acceptPriorityRoute);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Let the controller reject the switch to 8-bit node IDs
			mockController.defineBehavior(
				rejectSetNodeIDType(
					(msg) => msg.nodeIdType === NodeIDType.Short,
				),
			);
			// Setting the priority route fails
			mockController.clearReceivedHostMessages();

			t.expect(
				await driver.controller.setPriorityRoute(
					node.id,
					[],
					ZWaveDataRate["100k"],
				),
			).toBe(false);
			// The route command must not be sent, and the node ID type stays 16 bit
			t.expect(
				mockController.receivedHostMessages.some(
					(msg) => msg instanceof SetPriorityRouteRequest,
				),
			).toBe(false);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
		},
	},
);

integrationTest(
	"When the controller rejects the switch back to 16-bit node IDs, setting the priority route fails",
	{
		// debug: true,

		controllerCapabilities,

		customSetup: async (driver, mockController) => {
			mockController.defineBehavior(acceptPriorityRoute);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Record the route command and reject the switch back to 16 bit after it
			let sentRoute = false;
			const recordRoute: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SetPriorityRouteRequest)
						sentRoute = true;
					return false;
				},
			};
			mockController.defineBehavior(
				recordRoute,
				rejectSetNodeIDType(
					(msg) => sentRoute && msg.nodeIdType === NodeIDType.Long,
				),
			);

			// Setting the priority route fails
			t.expect(
				await driver.controller.setPriorityRoute(
					node.id,
					[],
					ZWaveDataRate["100k"],
				),
			).toBe(false);
			// The route command was sent, and the driver keeps the 8-bit node IDs the controller uses
			t.expect(sentRoute).toBe(true);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Short);
		},
	},
);

integrationTest.sequential(
	"The driver stops all other commands before it acknowledges an unexpected Serial API restart",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Record whether the gate is closed when the driver acknowledges the restart notification
			const gateClosedOnACK: boolean[] = [];
			let restartSent = false;
			const writeHeader = driver["writeHeader"].bind(driver);
			driver["writeHeader"] = (header: MessageHeaders) => {
				if (restartSent && header === MessageHeaders.ACK) {
					gateClosedOnACK.push(driver["controllerGate"].isClosed);
					restartSent = false;
				}
				return writeHeader(header);
			};

			// Simulate a restart of a controller that falls back to 8-bit node IDs
			mockController.encodingContext.nodeIdType = NodeIDType.Short;
			mockController.parsingContext.nodeIdType = NodeIDType.Short;
			restartSent = true;
			await mockController.sendMessageToHost(
				new SerialAPIStartedRequest({
					wakeUpReason: SerialAPIWakeUpReason.WatchdogReset,
					watchdogEnabled: false,
					isListening: true,
					...determineNIF(),
					supportsLongRange: false,
				}),
			);

			// The gate must already be closed at the ACK, and commands work afterwards
			t.expect(gateClosedOnACK).toStrictEqual([true]);
			t.expect(await node.ping()).toBe(true);
		},
	},
);
