import { NodeIDType } from "@zwave-js/core";
import { FunctionType } from "@zwave-js/serial";
import {
	GetControllerVersionRequest,
	SendDataBridgeRequest,
	SendDataRequest,
	SerialAPISetupCommand,
	SerialAPISetup_CommandUnsupportedResponse,
	SerialAPISetup_SetLongRangeMaximumTxPowerRequest,
	SerialAPISetup_SetPowerlevel16BitRequest,
	SerialAPISetup_SetPowerlevelRequest,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockController,
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultMockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";

import { integrationTest } from "../integrationTestSuite.js";

function controllerCapabilities(
	libraryVersion: string,
): Partial<MockControllerCapabilities> {
	return {
		...getDefaultMockControllerCapabilities(),
		libraryVersion,
		supportedFunctionTypes: [
			...getDefaultSupportedFunctionTypes(),
			FunctionType.SerialAPISetup,
		],
		supportedSerialAPISetupCommands: [SerialAPISetupCommand.SetNodeIDType],
	};
}

/** Resolves with the mock controller's node ID type when the first message after a soft reset arrives */
function recordNodeIdTypeAfterSoftReset(
	mockController: MockController,
): Promise<NodeIDType> {
	const ret = createDeferredPromise<NodeIDType>();
	let wasReset = false;
	const behavior: MockControllerBehavior = {
		onHostMessage(controller, msg) {
			if (msg instanceof SoftResetRequest) {
				wasReset = true;
			} else if (wasReset) {
				ret.resolve(controller.parsingContext.nodeIdType);
			}
			return false;
		},
	};
	mockController.defineBehavior(behavior);
	return ret;
}

integrationTest(
	"The mock controller applies SetNodeIDType to its encoding and parsing",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);
			t.expect(mockController.encodingContext.nodeIdType).toBe(
				NodeIDType.Long,
			);
			t.expect(mockController.parsingContext.nodeIdType).toBe(
				NodeIDType.Long,
			);

			// The mock must parse the destination with 16 bits
			const destination = createDeferredPromise<number | undefined>();
			const recordDestination: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (
						msg instanceof SendDataRequest
						|| msg instanceof SendDataBridgeRequest
					) {
						destination.resolve(msg.getNodeId());
					}
					return false;
				},
			};
			mockController.defineBehavior(recordDestination);

			t.expect(await node.ping()).toBe(true);
			t.expect(await destination).toBe(node.id);
		},
	},
);

integrationTest(
	"The mock controller responds with CommandUnsupported for sub commands it does not advertise",
	{
		// debug: true,

		controllerCapabilities: {
			...controllerCapabilities("Z-Wave 7.19.3"),
			supportedSerialAPISetupCommands: [],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(
				driver.controller.isSerialAPISetupCommandSupported(
					SerialAPISetupCommand.SetNodeIDType,
				),
			).toBe(false);
			await t
				.expect(driver.controller.setNodeIDType(NodeIDType.Long))
				.rejects.toThrow("does not support");
			t.expect(mockController.parsingContext.nodeIdType).toBe(
				NodeIDType.Short,
			);

			for (const request of [
				new SerialAPISetup_SetPowerlevelRequest({
					powerlevel: 0,
					measured0dBm: 0,
				}),
				new SerialAPISetup_SetPowerlevel16BitRequest({
					powerlevel: 0,
					measured0dBm: 0,
				}),
				new SerialAPISetup_SetLongRangeMaximumTxPowerRequest({
					limit: 0,
				}),
			]) {
				t.expect(await driver.sendMessage(request)).toBeInstanceOf(
					SerialAPISetup_CommandUnsupportedResponse,
				);
			}
		},
	},
);

integrationTest(
	"Below SDK 7.21, the mock controller falls back to 8-bit node IDs on soft reset",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);

			const nodeIdType = recordNodeIdTypeAfterSoftReset(mockController);
			await driver.softReset();

			t.expect(await nodeIdType).toBe(NodeIDType.Short);
		},
	},
);

integrationTest(
	"From SDK 7.21 on, the mock controller keeps the node ID type on soft reset",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilities("Z-Wave 7.21.0"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);

			const nodeIdType = recordNodeIdTypeAfterSoftReset(mockController);
			await driver.softReset();

			t.expect(await nodeIdType).toBe(NodeIDType.Long);
		},
	},
);

integrationTest(
	"Without the SerialAPIStarted notification, the driver probes the controller after a soft reset",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.serialAPIStarted = 100;
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;

			mockController.clearReceivedHostMessages();
			await driver.softReset();

			const messages = mockController.receivedHostMessages;
			const resetIndex = messages.findIndex(
				(msg) => msg instanceof SoftResetRequest,
			);
			t.expect(resetIndex).toBeGreaterThanOrEqual(0);
			t.expect(
				messages
					.slice(resetIndex + 1)
					.some((msg) => msg instanceof GetControllerVersionRequest),
			).toBe(true);
		},
	},
);
