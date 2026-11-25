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
	type MockNodeBehavior,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { vi } from "vitest";

import { ControllerGate } from "../../driver/ControllerGate.js";
import { DriverMode } from "../../driver/DriverMode.js";
import { integrationTest } from "../integrationTestSuite.js";
import {
	type MockGeckoBootloader,
	createMockGeckoBootloader,
} from "../mockGeckoBootloader.js";

/** Commands the driver sends to restore the controller state after a soft reset */
function isRestoreCommand(msg: Message): boolean {
	return (
		msg instanceof SerialAPISetup_SetNodeIDTypeRequest
		|| msg instanceof GetControllerVersionRequest
		|| msg instanceof StartWatchdogRequest
	);
}

integrationTest.sequential(
	"A soft reset aborts the active command and keeps back all other commands until the controller state is restored",
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
			// The first SendData never gets a callback, so it is still active when the reset starts
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

			// Ping the node and wait until its SendData is active
			mockController.clearReceivedHostMessages();

			const normal = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SendDataBridgeRequest,
			);
			// Waits at the Serial API queue behind the active command of the ping
			const immediate = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);
			// Soft-reset while the ping is active
			await wait(50);

			await driver.softReset();
			// Commands queued during the reset must wait until it is done
			const afterReset = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);

			// All three commands succeed
			t.expect(await normal).toBe(true);
			await t.expect(immediate).resolves.toBeDefined();
			await t.expect(afterReset).resolves.toBeDefined();

			// Find the first command after the restore step
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
			// The aborted command and the one queued later are each sent once, after the restore step
			const noOperationIndexes = messages
				.map((msg, index) =>
					msg instanceof SendDataRequest
					&& msg.command instanceof NoOperationCC
						? index
						: -1,
				)
				.filter((index) => index !== -1);
			t.expect(noOperationIndexes).toHaveLength(2);
			t.expect(
				noOperationIndexes.every((index) => index > resetIndex),
			).toBe(true);
		},
	},
);

integrationTest.sequential(
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

// A controller that can switch the node ID type
const setNodeIDTypeCapabilities = {
	supportedFunctionTypes: [
		...getDefaultSupportedFunctionTypes(),
		FunctionType.SerialAPISetup,
	],
	supportedSerialAPISetupCommands: [SerialAPISetupCommand.SetNodeIDType],
};

integrationTest.sequential(
	"Commands queued while the driver restores the controller state after a soft reset wait until the restore is done",
	{
		// debug: true,

		controllerCapabilities: setNodeIDTypeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Hold back the response to SetNodeIDType until the test lets it go
			const restoreStarted = createDeferredPromise<void>();
			const finishRestore = createDeferredPromise<void>();
			const delaySetNodeIDType: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SerialAPISetup_SetNodeIDTypeRequest) {
						restoreStarted.resolve();
						await finishRestore;
					}
					return false;
				},
			};
			mockController.defineBehavior(delaySetNodeIDType);

			// Soft-reset and wait until the restore step sends SetNodeIDType
			const resetPromise = driver.softReset();
			await restoreStarted;
			// Queue an immediate command during the restore step
			mockController.clearReceivedHostMessages();
			const immediate = driver.sendMessage(
				new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				}),
				{ priority: MessagePriority.Immediate },
			);
			await wait(100);
			// The command must wait for the restore step
			t.expect(mockController.receivedHostMessages).toHaveLength(0);

			// Finish the restore step, so the reset and then the command complete
			finishRestore.resolve();
			await resetPromise;
			await t.expect(immediate).resolves.toBeDefined();
		},
	},
);

integrationTest.sequential(
	"When the controller restarts but its ACK for the soft reset is lost, the controller state is restored",
	{
		// debug: true,

		controllerCapabilities: setNodeIDTypeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.ack = 200;
			driver.options.attempts.controller = 1;

			// Let the controller restart without acknowledging the soft reset
			mockController.autoAckHostMessages = false;
			const loseSoftResetACK: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						controller.autoAckHostMessages = true;
					}
					return false;
				},
			};
			mockController.defineBehavior(loseSoftResetACK);
			// Soft-reset the controller
			mockController.clearReceivedHostMessages();

			await driver.softReset();

			// The driver must still restore the node ID type after the reset
			const messages = mockController.receivedHostMessages;
			const resetIndex = messages.findIndex(
				(msg) => msg instanceof SoftResetRequest,
			);
			t.expect(
				messages
					.slice(resetIndex + 1)
					.some(
						(msg) =>
							msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
					),
			).toBe(true);
		},
	},
);

integrationTest.sequential(
	"softResetAndRestart() keeps all other commands away from the controller until the old controller instance is destroyed",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Record whether the gate is closed when the controller instance is destroyed
			const gateClosedOnDestroy: boolean[] = [];
			const destroyController = driver["destroyController"].bind(driver);
			driver["destroyController"] = (...args) => {
				gateClosedOnDestroy.push(driver["controllerGate"].isClosed);
				return destroyController(...args);
			};
			// Restart the driver and wait until it is ready
			const ready = new Promise<void>((resolve) =>
				driver.once("driver ready", () => resolve()),
			);

			await driver.softResetAndRestart();
			await ready;

			// The gate must still be closed at that point
			t.expect(gateClosedOnDestroy).toStrictEqual([true]);
		},
	},
);

integrationTest.sequential(
	"softResetAndRestart() rejects when the Serial API does not come back after the reset",
	{
		// debug: true,

		additionalDriverOptions: {
			timeouts: {
				// Shorten the timeouts to speed up the test
				ack: 400,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Simulate a controller that answers nothing after the reset
			const ignoreCommands: MockControllerBehavior = {
				onHostMessage() {
					return true;
				},
			};
			mockController.defineBehavior(ignoreCommands);
			mockController.autoAckHostMessages = false;

			// Jump over the waits between the polls of the Serial API
			vi.useFakeTimers({
				toFake: ["setTimeout", "clearTimeout"],
				shouldAdvanceTime: true,
			});
			try {
				// Restart and move the fake clock forward until the restart ends
				const result = driver.softResetAndRestart().then(
					() => "resolved",
					(e: { code?: number }) => e.code,
				);
				for (let i = 0; i < 30; i++) {
					const outcome = await Promise.race([
						result,
						vi.advanceTimersByTimeAsync(5000).then(() => undefined),
					]);
					if (outcome !== undefined) break;
				}

				// The restart fails, and the driver is destroyed
				t.expect(await result).toBe(ZWaveErrorCodes.Driver_Failed);
				t.expect(driver["wasDestroyed"]).toBe(true);
			} finally {
				vi.useRealTimers();
			}
		},
	},
);

integrationTest.sequential(
	"An operation with exclusive access that outlives its controller instance cannot send to the next instance",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Take exclusive access that sends a command once the test lets it
			const destroyed = createDeferredPromise<void>();
			const access = driver.withExclusiveControllerAccess(
				async (send) => {
					await destroyed;
					return send(new GetControllerVersionRequest());
				},
			);
			// Give the operation time to acquire the gate
			await wait(10);

			// Like destroying the controller instance and creating the next one,
			// but the Serial API queue stays usable
			driver["controllerGate"].seal(new Error("sealed"));
			driver["controllerGate"] = new ControllerGate();
			// Let the old operation send its command
			mockController.clearReceivedHostMessages();
			destroyed.resolve();

			// The command must fail and never reach the controller
			await t.expect(access).rejects.toThrow();
			await wait(50);
			t.expect(mockController.receivedHostMessages).toHaveLength(0);
		},
	},
);

let bootloader: MockGeckoBootloader;
integrationTest.sequential(
	"Leaving the bootloader into a Serial API that sends no SerialAPIStarted probes it and initializes the controller",
	{
		// debug: true,

		additionalDriverOptions: {
			bootloaderMode: "stay",
		},

		customSetup: async (driver, mockController) => {
			bootloader = createMockGeckoBootloader({
				startInBootloader: true,
				sendsSerialAPIStarted: false,
			});
			mockController.defineBehavior(bootloader.behavior);
		},

		testBody: async (t, driver, node, mockController) => {
			t.onTestFinished(() => bootloader.destroy());
			// The driver starts in a bootloader whose Serial API does not report its start
			t.expect(driver.mode).toBe(DriverMode.Bootloader);
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.serialAPIStarted = 100;

			// Remember the queue that sends the probe
			let probeQueue: unknown;
			mockController.defineBehavior({
				onHostMessage(controller, msg) {
					if (msg instanceof GetControllerVersionRequest) {
						probeQueue ??= driver["serialAPIQueue"];
					}
					return false;
				},
			});

			// Leave the bootloader, so the driver probes the Serial API
			await driver.leaveBootloader();

			// The probe found the Serial API
			t.expect(driver.mode).toBe(DriverMode.SerialAPI);
			t.expect(probeQueue).toBeDefined();
			// The new controller instance keeps the queue of the probe
			t.expect(driver["serialAPIQueue"]).toBe(probeQueue);
			// A command works afterwards
			await t
				.expect(
					driver.sendMessage(new GetControllerVersionRequest(), {
						supportCheck: false,
					}),
				)
				.resolves.toBeDefined();
		},
	},
);
