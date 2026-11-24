import { NoOperationCC } from "@zwave-js/cc";
import { MessagePriority, NodeIDType } from "@zwave-js/core";
import { FunctionType, type Message } from "@zwave-js/serial";
import {
	SendDataAbort,
	SendDataBridgeRequest,
	SendDataBridgeResponse,
	SendDataRequest,
	SendDataResponse,
	SerialAPISetupCommand,
	SerialAPISetup_SetNodeIDTypeRequest,
	SerialAPISetup_SetNodeIDTypeResponse,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockController,
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";

import {
	MockControllerCommunicationState,
	MockControllerStateKeys,
} from "../../controller/MockControllerState.js";
import { determineNIF } from "../../controller/NodeInformationFrame.js";
import { integrationTest } from "../integrationTestSuite.js";

// A controller with the given SDK version that can switch the node ID type
function controllerCapabilities(
	libraryVersion: string,
): Partial<MockControllerCapabilities> {
	return {
		libraryVersion,
		supportedFunctionTypes: [
			...getDefaultSupportedFunctionTypes(),
			FunctionType.SerialAPISetup,
		],
		supportedSerialAPISetupCommands: [SerialAPISetupCommand.SetNodeIDType],
	};
}

function isSendData(
	msg: Message,
): msg is SendDataRequest | SendDataBridgeRequest {
	return (
		msg instanceof SendDataRequest || msg instanceof SendDataBridgeRequest
	);
}

/**
 * Records the destination of every SendData as the mock controller parses it,
 * and the driver's node ID type when the mock receives a SetNodeIDType request.
 */
function recordAfterReset(
	mockController: MockController,
	getDriverNodeIdType: () => NodeIDType,
): { destinations: (number | undefined)[]; driverNodeIdTypes: NodeIDType[] } {
	const ret = {
		destinations: [] as (number | undefined)[],
		driverNodeIdTypes: [] as NodeIDType[],
	};
	const behavior: MockControllerBehavior = {
		onHostMessage(controller, msg) {
			if (isSendData(msg)) {
				ret.destinations.push(msg.getNodeId());
			} else if (msg instanceof SerialAPISetup_SetNodeIDTypeRequest) {
				ret.driverNodeIdTypes.push(getDriverNodeIdType());
			}
			return false;
		},
	};
	mockController.defineBehavior(behavior);
	return ret;
}

/** Returns the messages the mock controller received after the last soft reset */
function messagesAfterReset(mockController: MockController): Message[] {
	const messages = mockController.receivedHostMessages;
	const resetIndex = messages.findLastIndex(
		(msg) => msg instanceof SoftResetRequest,
	);
	return messages.slice(resetIndex + 1) as Message[];
}

integrationTest(
	"After recovering from a missed SendData callback, the node ID type is restored before the next command is sent",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilities("Z-Wave 7.21.0"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;

			// Switch to 16-bit node IDs
			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);

			// Like the default behavior, except that the callback never gets sent
			let shouldTimeOut = true;
			const handleBrokenSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!shouldTimeOut) return false;

					if (isSendData(msg)) {
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Sending,
						);
						await controller.sendMessageToHost(
							msg instanceof SendDataBridgeRequest
								? new SendDataBridgeResponse({ wasSent: true })
								: new SendDataResponse({ wasSent: true }),
						);
						return true;
					} else if (msg instanceof SendDataAbort) {
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);
						return true;
					} else if (msg instanceof SoftResetRequest) {
						shouldTimeOut = false;
						return false;
					}
				},
			};
			mockController.defineBehavior(handleBrokenSendData);
			// Record which node the controller reads from each SendData
			const recorded = recordAfterReset(
				mockController,
				() => driver.controller.nodeIdType,
			);

			// Ping the node and wait until the recovery soft-resets the controller
			mockController.clearReceivedHostMessages();
			const pingPromise = node.ping();

			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
				{ timeout: 3000 },
			);
			recorded.destinations.length = 0;

			// Queue a command that goes out ASAP after the reset, like a Nonce Report
			const immediatePromise = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);

			// Wait for both commands
			await Promise.allSettled([immediatePromise, pingPromise]);

			// SetNodeIDType must come before the first SendData after the reset
			const afterReset = messagesAfterReset(mockController);
			const setNodeIDTypeIndex = afterReset.findIndex(
				(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
			);
			const sendDataIndex = afterReset.findIndex(isSendData);

			t.expect(setNodeIDTypeIndex).toBeGreaterThanOrEqual(0);
			t.expect(sendDataIndex).toBeGreaterThan(setNodeIDTypeIndex);

			// The controller only reads the correct node ID when the command uses 16-bit node IDs
			t.expect(recorded.destinations.length).toBeGreaterThan(0);
			t.expect(recorded.destinations).toStrictEqual(
				recorded.destinations.map(() => node.id),
			);

			// The driver uses 16-bit node IDs again, and both commands succeed
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			t.expect(await immediatePromise).toBeDefined();
			t.expect(await pingPromise).toBe(true);
		},
	},
);

for (const { libraryVersion, assumed } of [
	{ libraryVersion: "Z-Wave 7.19.3", assumed: NodeIDType.Short },
	{ libraryVersion: "Z-Wave 7.21.0", assumed: NodeIDType.Long },
]) {
	integrationTest(
		`With SDK ${libraryVersion.slice(7)}, the driver assumes ${
			assumed === NodeIDType.Short ? 8 : 16
		}-bit node IDs after a soft reset and restores 16-bit node IDs`,
		{
			// debug: true,

			controllerCapabilities: controllerCapabilities(libraryVersion),

			testBody: async (t, driver, node, mockController, mockNode) => {
				// Switch to 16-bit node IDs and record what happens after the reset
				t.expect(
					await driver.controller.trySetNodeIDType(NodeIDType.Long),
				).toBe(true);
				const recorded = recordAfterReset(
					mockController,
					() => driver.controller.nodeIdType,
				);

				// Soft-reset and queue a ping during the reset
				const softReset = driver.softReset();
				// Queued during the reset
				const pingPromise = node.ping();
				await softReset;

				// The driver assumes the type the SDK keeps, until SetNodeIDType restores 16 bit
				t.expect(recorded.driverNodeIdTypes).toStrictEqual([assumed]);
				t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
				t.expect(mockController.parsingContext.nodeIdType).toBe(
					NodeIDType.Long,
				);
				// The ping reaches the right node
				t.expect(await pingPromise).toBe(true);
				t.expect(recorded.destinations).toStrictEqual([node.id]);
			},
		},
	);
}

integrationTest("A failed SetNodeIDType after a soft reset is retried", {
	// debug: true,

	controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

	testBody: async (t, driver, node, mockController, mockNode) => {
		// Switch to 16-bit node IDs
		t.expect(
			await driver.controller.trySetNodeIDType(NodeIDType.Long),
		).toBe(true);

		// Let the controller reject the next two SetNodeIDType requests
		let failures = 2;
		const failSetNodeIDType: MockControllerBehavior = {
			async onHostMessage(controller, msg) {
				if (
					msg instanceof SerialAPISetup_SetNodeIDTypeRequest
					&& failures > 0
				) {
					failures--;
					await controller.sendMessageToHost(
						new SerialAPISetup_SetNodeIDTypeResponse({
							success: false,
						}),
					);
					return true;
				}
			},
		};
		mockController.defineBehavior(failSetNodeIDType);

		// Soft-reset, so the driver restores 16-bit node IDs
		await driver.softReset();

		// The third attempt succeeds
		t.expect(failures).toBe(0);
		t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
		t.expect(await node.ping()).toBe(true);
	},
});

integrationTest(
	"When SetNodeIDType keeps failing after a soft reset, the driver keeps the node ID type the controller falls back to",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Switch to 16-bit node IDs
			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);

			// Let the controller reject every SetNodeIDType request
			const failSetNodeIDType: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SerialAPISetup_SetNodeIDTypeRequest) {
						await controller.sendMessageToHost(
							new SerialAPISetup_SetNodeIDTypeResponse({
								success: false,
							}),
						);
						return true;
					}
				},
			};
			mockController.defineBehavior(failSetNodeIDType);

			// Soft-reset, so the driver tries to restore 16-bit node IDs
			mockController.clearReceivedHostMessages();
			await driver.softReset();

			// The driver tries 3 times, then keeps the 8-bit node IDs of the reset controller
			t.expect(
				mockController.receivedHostMessages.filter(
					(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
				).length,
			).toBe(3);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Short);
			t.expect(await node.ping()).toBe(true);
		},
	},
);

integrationTest(
	"After an unexpected Serial API restart, the node ID type is restored before the next command is sent",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Switch to 16-bit node IDs
			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);
			const recorded = recordAfterReset(
				mockController,
				() => driver.controller.nodeIdType,
			);

			// Simulate a watchdog reset of a controller that loses the node ID type
			mockController.encodingContext.nodeIdType = NodeIDType.Short;
			mockController.parsingContext.nodeIdType = NodeIDType.Short;
			mockController.clearReceivedHostMessages();
			// Report the restart and queue a ping right after
			await mockController.sendMessageToHost(
				new SerialAPIStartedRequest({
					wakeUpReason: SerialAPIWakeUpReason.WatchdogReset,
					watchdogEnabled: false,
					isListening: true,
					...determineNIF(),
					supportsLongRange: false,
				}),
			);
			const pingPromise = node.ping();
			// Wait until the driver restores the node ID type
			await mockController.expectHostMessage(
				(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
			);

			// The ping reaches its node with the restored node ID type
			t.expect(await pingPromise).toBe(true);
			t.expect(recorded.driverNodeIdTypes).toStrictEqual([
				NodeIDType.Short,
			]);
			t.expect(recorded.destinations).toStrictEqual([node.id]);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);

			// SetNodeIDType must come before the ping
			const messages = mockController.receivedHostMessages;
			t.expect(
				messages.findIndex(
					(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
				),
			).toBeLessThan(messages.findIndex(isSendData));
		},
	},
);

integrationTest(
	"The driver uses 16-bit node IDs when the controller can switch, even without Long Range support",
	{
		// debug: true,

		controllerCapabilities: {
			...controllerCapabilities("Z-Wave 7.19.3"),
			supportsLongRange: false,
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The controller has no Long Range support, but uses 16-bit node IDs after startup
			t.expect(driver.controller.supportsLongRange).toBe(false);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			t.expect(mockController.parsingContext.nodeIdType).toBe(
				NodeIDType.Long,
			);
			// Commands reach their node
			t.expect(await node.ping()).toBe(true);
		},
	},
);
