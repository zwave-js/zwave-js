import { NoOperationCC } from "@zwave-js/cc";
import {
	MessagePriority,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import { FunctionType, type Message } from "@zwave-js/serial";
import {
	GetControllerVersionRequest,
	SendDataBridgeRequest,
	SendDataBridgeResponse,
	SendDataRequest,
	SerialAPISetupCommand,
	SerialAPISetup_SetNodeIDTypeRequest,
	SoftResetRequest,
	StartWatchdogRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockControllerBehavior,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";

import { integrationTest } from "../integrationTestSuite.js";

/** Commands the driver sends to restore the controller state after a soft reset */
function isRestoreCommand(msg: Message): boolean {
	return (
		msg instanceof SerialAPISetup_SetNodeIDTypeRequest
		|| msg instanceof GetControllerVersionRequest
		|| msg instanceof StartWatchdogRequest
	);
}

integrationTest(
	"A soft reset waits for active transactions and holds back both queues until the controller state is restored",
	{
		// debug: true,

		controllerCapabilities: {
			supportedFunctionTypes: [
				...getDefaultSupportedFunctionTypes(),
				FunctionType.SerialAPISetup,
			],
			supportedSerialAPISetupCommands: [
				SerialAPISetupCommand.SetNodeIDType,
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The first SendData never gets a callback, so its transaction stays active
			let isFirstSendData = true;
			const swallowFirstCallback: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (
						(msg instanceof SendDataBridgeRequest
							|| msg instanceof SendDataRequest)
						&& isFirstSendData
					) {
						isFirstSendData = false;
						await controller.sendMessageToHost(
							new SendDataBridgeResponse({ wasSent: true }),
						);
						return true;
					}
				},
			};
			mockController.defineBehavior(swallowFirstCallback);

			mockController.clearReceivedHostMessages();

			const normal = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SendDataBridgeRequest,
			);
			// Queued behind the active Serial API command of the ping
			const immediate = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);
			await wait(50);

			await driver.softReset();
			// Commands queued during the reset must wait until it is done
			const afterReset = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);

			t.expect(await normal).toBe(true);
			await t.expect(immediate).resolves.toBeDefined();
			await t.expect(afterReset).resolves.toBeDefined();

			const messages = mockController.receivedHostMessages;
			const resetIndex = messages.findIndex(
				(msg) => msg instanceof SoftResetRequest,
			);
			t.expect(resetIndex).toBeGreaterThan(0);
			const afterResetMessages = messages.slice(resetIndex + 1);
			const firstOther = afterResetMessages.findIndex(
				(msg) => !isRestoreCommand(msg),
			);
			t.expect(firstOther).toBeGreaterThan(0);
			// The restore step must end before anything else is sent
			t.expect(
				afterResetMessages
					.slice(0, firstOther)
					.some(
						(msg) =>
							msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
					),
			).toBe(true);
			t.expect(
				afterResetMessages.slice(firstOther).some(isRestoreCommand),
			).toBe(false);
		},
	},
);

integrationTest(
	"A command queued during a failing soft reset is still sent afterwards",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.ack = 200;
			driver.options.attempts.controller = 1;

			// Let the controller ignore the soft reset
			mockController.autoAckHostMessages = false;
			const swallowSoftReset: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						controller.autoAckHostMessages = true;
						return true;
					}
				},
			};
			mockController.defineBehavior(swallowSoftReset);

			// Start a soft reset that will fail
			const resetPromise = driver.softReset();
			// Queued while the reset has exclusive access to the controller
			const pingPromise = node.ping();
			// The reset fails, and the ping still goes out afterwards
			await assertZWaveError(t.expect, () => resetPromise, {
				errorCode: ZWaveErrorCodes.Controller_Timeout,
			});

			t.expect(await pingPromise).toBe(true);
		},
	},
);
