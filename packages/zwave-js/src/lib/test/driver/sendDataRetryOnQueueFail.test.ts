import { FunctionType } from "@zwave-js/serial";
import { SendDataRequest, SendDataResponse } from "@zwave-js/serial/serialapi";
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

let shouldFail = false;

const controllerCapabilitiesNoBridge: MockControllerCapabilities = {
	// No support for Bridge API:
	...getDefaultMockControllerCapabilities(),
	supportedFunctionTypes: getDefaultSupportedFunctionTypes().filter(
		(ft) =>
			ft !== FunctionType.SendDataBridge
			&& ft !== FunctionType.SendDataMulticastBridge,
	),
};

integrationTest(
	"SendData commands are retried up to 3 times if the frame was not queued",
	{
		// debug: true,
		// provisioningDirectory: path.join(
		// 	__dirname,
		// 	"__fixtures/supervision_binary_switch",
		// ),

		controllerCapabilities: controllerCapabilitiesNoBridge,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			// Return a TX status of Fail when desired
			const handleSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SendDataRequest) {
						if (!shouldFail) {
							// Defer to the default behavior
							return false;
						}

						// Check if this command is legal right now
						const state = controller.state.get(
							MockControllerStateKeys.CommunicationState,
						) as MockControllerCommunicationState | undefined;
						if (
							state != undefined
							&& state !== MockControllerCommunicationState.Idle
						) {
							throw new Error(
								"Received SendDataRequest while not idle",
							);
						}

						// Notify the host that the message was NOT sent
						const res = new SendDataResponse({
							wasSent: false,
						});
						await controller.sendMessageToHost(res);

						return true;
					}
				},
			};
			controller.defineBehavior(handleSendData);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			shouldFail = true;
			const promise = node.ping();
			t.expect(await promise).toBe(false);

			const pingAttempts = mockController.receivedHostMessages.filter(
				(msg) => msg instanceof SendDataRequest,
			);
			t.expect(pingAttempts.length).toBe(3);
		},
	},
);

integrationTest(
	"When queuing eventually succeeds, finish the transaction normally",
	{
		// debug: true,
		// provisioningDirectory: path.join(
		// 	__dirname,
		// 	"__fixtures/supervision_binary_switch",
		// ),

		controllerCapabilities: controllerCapabilitiesNoBridge,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			// Return a TX status of Fail when desired
			const handleSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SendDataRequest) {
						if (!shouldFail) {
							// Defer to the default behavior
							return false;
						}

						// Check if this command is legal right now
						const state = controller.state.get(
							MockControllerStateKeys.CommunicationState,
						) as MockControllerCommunicationState | undefined;
						if (
							state != undefined
							&& state !== MockControllerCommunicationState.Idle
						) {
							throw new Error(
								"Received SendDataRequest while not idle",
							);
						}

						// Notify the host that the message was NOT sent
						const res = new SendDataResponse({
							wasSent: false,
						});
						await controller.sendMessageToHost(res);

						return true;
					}
				},
			};
			controller.defineBehavior(handleSendData);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			shouldFail = true;
			const promise = node.ping();
			setTimeout(() => {
				// Simulate that the queueing eventually succeeds
				shouldFail = false;
			}, 250);
			t.expect(await promise).toBe(true);

			const pingAttempts = mockController.receivedHostMessages.filter(
				(msg) => msg instanceof SendDataRequest,
			);
			t.expect(pingAttempts.length).toBe(2);
		},
	},
);
