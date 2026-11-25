import { NoOperationCC } from "@zwave-js/cc";
import { MessagePriority, NodeIDType } from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import {
	SendDataAbort,
	SendDataRequest,
	SendDataResponse,
	SerialAPISetupCommand,
	SerialAPISetupRequest,
	SerialAPISetup_SetNodeIDTypeRequest,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";
import {
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultMockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";

import {
	MockControllerCommunicationState,
	MockControllerStateKeys,
} from "../../controller/MockControllerState.js";
import { integrationTest } from "../integrationTestSuite.js";

let shouldTimeOut = false;
let wasReset = false;
const sendDataNodeIdsAfterReset: (number | undefined)[] = [];

const controllerCapabilities: MockControllerCapabilities = {
	...getDefaultMockControllerCapabilities(),
	supportedFunctionTypes: [
		...getDefaultSupportedFunctionTypes().filter(
			(ft) =>
				ft !== FunctionType.SendDataBridge
				&& ft !== FunctionType.SendDataMulticastBridge,
		),
		FunctionType.SerialAPISetup,
	],
};

integrationTest(
	"After recovering from a missed SendData callback, the node ID type is restored before the next command is sent",
	{
		// debug: true,

		controllerCapabilities,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, mockController, mockNode) => {
			// The controller keeps the node ID type across soft resets
			const handleSerialAPISetup: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SerialAPISetup_SetNodeIDTypeRequest) {
						controller.encodingContext.nodeIdType = msg.nodeIdType;
						controller.parsingContext.nodeIdType = msg.nodeIdType;
						await controller.sendMessageToHost(
							new Message({
								type: MessageType.Response,
								functionType: FunctionType.SerialAPISetup,
								payload: Bytes.from([
									SerialAPISetupCommand.SetNodeIDType,
									0x01,
								]),
							}),
						);
						return true;
					} else if (msg instanceof SerialAPISetupRequest) {
						// Parsing GetSupportedCommands loses the sub command. It is the
						// only other Serial API Setup command the driver sends here.
						await controller.sendMessageToHost(
							new Message({
								type: MessageType.Response,
								functionType: FunctionType.SerialAPISetup,
								payload: Bytes.from([
									SerialAPISetupCommand.GetSupportedCommands,
									SerialAPISetupCommand.GetSupportedCommands
										| SerialAPISetupCommand.SetNodeIDType,
								]),
							}),
						);
						return true;
					}
				},
			};
			mockController.defineBehavior(handleSerialAPISetup);

			// Like the default behavior, except that the callback never gets sent
			const handleBrokenSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!shouldTimeOut) return false;

					if (msg instanceof SendDataRequest) {
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Sending,
						);
						await controller.sendMessageToHost(
							new SendDataResponse({ wasSent: true }),
						);
						return true;
					} else if (msg instanceof SendDataAbort) {
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);
						return true;
					}
				},
			};
			mockController.defineBehavior(handleBrokenSendData);

			const handleSoftReset: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						shouldTimeOut = false;
						wasReset = true;
						return false;
					} else if (wasReset && msg instanceof SendDataRequest) {
						sendDataNodeIdsAfterReset.push(msg.getNodeId());
						return false;
					}
				},
			};
			mockController.defineBehavior(handleSoftReset);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;

			t.expect(
				await driver.controller.trySetNodeIDType(NodeIDType.Long),
			).toBe(true);
			mockController.clearReceivedHostMessages();

			shouldTimeOut = true;
			const pingPromise = node.ping();

			await mockController.expectHostMessage(
				(msg) => msg.functionType === FunctionType.SoftReset,
				{ timeout: 3000 },
			);

			// Queue a command that goes out ASAP after the reset, like a Nonce Report
			const immediatePromise = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);

			await Promise.allSettled([immediatePromise, pingPromise]);

			const afterReset = mockController.receivedHostMessages.slice(
				mockController.receivedHostMessages.findIndex(
					(msg) => msg instanceof SoftResetRequest,
				) + 1,
			);
			const setNodeIDTypeIndex = afterReset.findIndex(
				(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
			);
			const sendDataIndex = afterReset.findIndex(
				(msg) => msg instanceof SendDataRequest,
			);

			t.expect(setNodeIDTypeIndex).toBeGreaterThanOrEqual(0);
			t.expect(sendDataIndex).toBeGreaterThan(setNodeIDTypeIndex);

			// The controller only reads the correct node ID when the command uses 16-bit node IDs
			t.expect(sendDataNodeIdsAfterReset.length).toBeGreaterThan(0);
			t.expect(sendDataNodeIdsAfterReset).toStrictEqual(
				sendDataNodeIdsAfterReset.map(() => node.id),
			);

			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			t.expect(await immediatePromise).toBeDefined();
			t.expect(await pingPromise).toBe(true);
		},
	},
);
