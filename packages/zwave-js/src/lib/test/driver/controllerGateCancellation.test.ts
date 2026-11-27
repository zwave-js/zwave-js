import { NoOperationCC } from "@zwave-js/cc";
import {
	ControllerStatus,
	TransmitStatus,
	ZWaveError,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import { MessageHeaders } from "@zwave-js/serial";
import {
	GetControllerVersionRequest,
	SendDataAbort,
	SendDataBridgeRequest,
	SendDataBridgeRequestTransmitReport,
	SendDataBridgeResponse,
	SendDataRequest,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import { abortable } from "@zwave-js/shared";
import type { MockControllerBehavior } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";

import { determineNIF } from "../../controller/NodeInformationFrame.js";
import { ControllerGate } from "../../driver/ControllerGate.js";
import { TaskPriority } from "../../driver/Task.js";
import { integrationTest } from "../integrationTestSuite.js";
import {
	type MockGeckoBootloader,
	createMockGeckoBootloader,
} from "../mockGeckoBootloader.js";

function isSendData(msg: unknown): boolean {
	return (
		msg instanceof SendDataRequest || msg instanceof SendDataBridgeRequest
	);
}

integrationTest.sequential(
	"A soft reset whose ACK got lost is not sent again once the controller restarted",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.ack = 200;

			// Simulate a controller that restarts, but whose ACK for the soft reset gets lost
			let softResets = 0;
			mockController.autoAckHostMessages = false;
			const loseFirstACK: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						softResets++;
						setTimeout(() => {
							controller.autoAckHostMessages = true;
						}, 300);
					}
					return false;
				},
			};
			mockController.defineBehavior(loseFirstACK);

			await driver.softReset();
			// The restart notification must stop the retries of the reset command
			t.expect(softResets).toBe(1);
		},
	},
);

integrationTest.sequential(
	"A Serial API command retried after a CAN is not sent while another operation has exclusive access to the controller",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Answer the first SendData with a CAN, so the driver retries it after a short delay
			mockController.autoAckHostMessages = false;
			const canFirstSendData: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (!controller.autoAckHostMessages && isSendData(msg)) {
						controller.mockPort.emitData(
							Uint8Array.from([MessageHeaders.CAN]),
						);
						controller.autoAckHostMessages = true;
						return true;
					}
				},
			};
			mockController.defineBehavior(canFirstSendData);
			// Ping the node and wait until its first SendData got the CAN
			mockController.clearReceivedHostMessages();

			const pingPromise = node.ping();
			await mockController.expectHostMessage(isSendData);
			// Closes the gate during the retry backoff after the CAN
			const release = createDeferredPromise<void>();
			const access = driver.withExclusiveControllerAccess(() => release);
			// The retry must wait while the other operation has exclusive access
			await wait(300);
			t.expect(
				mockController.receivedHostMessages.filter(isSendData),
			).toHaveLength(1);

			// End the exclusive access, so the retry goes out and the ping succeeds
			release.resolve();
			await access;
			t.expect(await pingPromise).toBe(true);
		},
	},
);

integrationTest.sequential(
	"An operation with exclusive access does not report success after its gate was sealed",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Seal the gate while the operation runs. The operation ignores the error of its next command and returns true.
			const access = driver.withExclusiveControllerAccess(
				async (send) => {
					driver["controllerGate"].seal(new Error("sealed"));
					try {
						await send(new GetControllerVersionRequest());
					} catch {
						// Like the restore helpers, which report failures as false
					}
					return true;
				},
			);

			// The exclusive access must still reject with the reason of the sealed gate
			await t.expect(access).rejects.toThrow("sealed");
			// Give the driver a working gate again for the cleanup
			driver["controllerGate"] = new ControllerGate();
		},
	},
);

integrationTest.sequential(
	"Waiting for SerialAPIStarted with an aborted signal does not swallow a later SerialAPIStarted",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Record the warnings of the controller log
			const warnings: string[] = [];
			const print = driver.controllerLog.print.bind(driver.controllerLog);
			driver.controllerLog.print = (message, level) => {
				if (level === "warn" && typeof message === "string") {
					warnings.push(message);
				}
				print(message, level);
			};

			// Wait with a signal that is already aborted
			const aborted = new AbortController();
			aborted.abort(new Error("aborted"));
			t.expect(
				await driver["waitForSerialAPIStarted"](5000, aborted.signal),
			).toBe(false);

			// Let the controller restart within the timeout of that wait
			await mockController.sendMessageToHost(
				new SerialAPIStartedRequest({
					wakeUpReason: SerialAPIWakeUpReason.WatchdogReset,
					watchdogEnabled: false,
					isListening: true,
					...determineNIF(),
					supportsLongRange: false,
				}),
			);
			await wait(100);

			// The driver must handle the notification as an unexpected restart
			t.expect(warnings).toContain("Serial API restarted unexpectedly.");
		},
	},
);

integrationTest.sequential(
	"Destroying the driver while a soft reset waits for SerialAPIStarted rejects the reset with Driver_Destroyed",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Simulate a controller that does not report its restart
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;
			const resetPromise = driver.softReset();
			// The reset is rejected during destroy(), before the assertion runs
			resetPromise.catch(() => {});
			// Wait until the reset command is sent
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
			);

			// Destroy the driver while the reset waits, without waiting for its timeout
			const start = Date.now();
			await driver.destroy();
			t.expect(Date.now() - start).toBeLessThan(500);
			// The reset fails with Driver_Destroyed
			await assertZWaveError(t.expect, () => resetPromise, {
				errorCode: ZWaveErrorCodes.Driver_Destroyed,
			});
		},
	},
);

integrationTest.sequential(
	"Destroying the driver during the probe backoff ends the reset promptly",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.serialAPIStarted = 100;
			driver.options.timeouts.response = 200;
			// Simulate a controller that neither reports its restart nor answers the probe
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;
			const ignoreProbe: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					return msg instanceof GetControllerVersionRequest;
				},
			};
			mockController.defineBehavior(ignoreProbe);

			// Soft-reset and wait for the first probe
			const resetPromise = driver.softReset();
			// The reset is rejected during destroy(), before the assertion runs
			resetPromise.catch(() => {});
			await mockController.expectHostMessage(
				(msg) => msg instanceof GetControllerVersionRequest,
				{ timeout: 5000 },
			);
			// Now in the 2 second backoff before the next probe
			await wait(400);

			// Destroy the driver during the backoff, without waiting for it
			const start = Date.now();
			await driver.destroy();
			t.expect(Date.now() - start).toBeLessThan(500);
			// The reset fails with Driver_Destroyed
			await assertZWaveError(t.expect, () => resetPromise, {
				errorCode: ZWaveErrorCodes.Driver_Destroyed,
			});

			// No probe may follow after the backoff
			mockController.clearReceivedHostMessages();
			await wait(2500);
			t.expect(mockController.receivedHostMessages).toHaveLength(0);
		},
	},
);

integrationTest.sequential(
	"Destroying the driver while a reset reopens the serial port does not use the new port",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Simulate a controller that does not report its restart
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;

			// Stall the reopen of the serial port until the test lets it finish
			const createStreamCalled = createDeferredPromise<void>();
			const finishCreateStream = createDeferredPromise<void>();
			let closedNewStream = false;
			const newStream = {
				isOpen: true,
				readable: (async function* () {})(),
				writeAsync: () => Promise.resolve(),
				close: () => {
					closedNewStream = true;
					return Promise.resolve();
				},
			};
			driver["serialFactory"]!.createStream = async () => {
				createStreamCalled.resolve();
				await finishCreateStream;
				return newStream as any;
			};

			// Soft-reset and wait until the reset command is sent
			const resetPromise = driver.softReset();
			// The reset is rejected during destroy(), before the assertion runs
			resetPromise.catch(() => {});
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
			);
			// Like a USB controller that disconnects during the reset
			await driver["serial"]!.close();
			await createStreamCalled;

			// Destroy the driver while the port is being reopened
			const start = Date.now();
			await driver.destroy();
			t.expect(Date.now() - start).toBeLessThan(500);
			await assertZWaveError(t.expect, () => resetPromise, {
				errorCode: ZWaveErrorCodes.Driver_Destroyed,
			});

			// Let the reopen finish late
			finishCreateStream.resolve();
			await wait(50);
			// The driver must close the new port and not use it
			t.expect(driver["serial"]).not.toBe(newStream);
			t.expect(closedNewStream).toBe(true);
		},
	},
);

integrationTest.sequential(
	"A soft reset waits until the controller acknowledged a pending SendDataAbort",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The controller does not acknowledge the abort, so the driver waits 500 ms for it
			mockController.autoAckHostMessages = false;
			const ignoreAbort: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SendDataAbort) return true;
					controller.ackHostMessage();
					return false;
				},
			};
			mockController.defineBehavior(ignoreAbort);
			// Send an abort and soft-reset right after
			mockController.clearReceivedHostMessages();

			const start = Date.now();
			void driver["abortSendData"]();
			await driver.softReset();

			// If the abort took the ACK of the soft reset, the reset would wait for the 1600 ms ACK timeout
			t.expect(Date.now() - start).toBeLessThan(1200);
			// The reset command must be sent only once
			t.expect(
				mockController.receivedHostMessages.filter(
					(msg) => msg instanceof SoftResetRequest,
				),
			).toHaveLength(1);
		},
	},
);

integrationTest.sequential(
	"Destroying the driver while a soft reset without ACK waits for SerialAPIStarted rejects the reset with Driver_Destroyed",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.ack = 200;
			driver.options.attempts.controller = 1;

			// Let the controller ignore the soft reset, so its ACK times out
			mockController.autoAckHostMessages = false;
			const ignoreSoftReset: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) return true;
					controller.ackHostMessage();
					return false;
				},
			};
			mockController.defineBehavior(ignoreSoftReset);

			// Soft-reset and wait until the reset command is sent
			const resetPromise = driver.softReset();
			// The reset is rejected during destroy(), before the assertion runs
			resetPromise.catch(() => {});
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
			);
			// The ACK timed out. The reset now waits up to 1.5 s for SerialAPIStarted.
			await wait(400);

			// Destroy the driver while the reset waits
			await driver.destroy();
			// The reset fails with Driver_Destroyed
			await assertZWaveError(t.expect, () => resetPromise, {
				errorCode: ZWaveErrorCodes.Driver_Destroyed,
			});
		},
	},
);

for (const { cause, code } of [
	{ cause: "a controller reset", code: ZWaveErrorCodes.Controller_Reset },
	{
		cause: "giving way to exclusive access",
		code: ZWaveErrorCodes.Controller_InExclusiveUse,
	},
]) {
	integrationTest.sequential(
		`A SendData that is sent again after ${cause} is encoded anew, so the node does not discard it as a duplicate`,
		{
			// debug: true,

			testBody: async (t, driver, node, mockController, mockNode) => {
				// Keeps the transaction in the queue
				driver.controller.setStatus(ControllerStatus.Unresponsive);
				// Queue a SendData and take its transaction
				const msg = new SendDataRequest({
					command: new NoOperationCC({ nodeId: node.id }),
				});
				void driver.sendMessage(msg).catch(() => {});
				const transaction = driver["queue"].find(
					(t) => t.message === msg,
				)!;
				// Like the bytes of a command the node has already received
				msg.serializedCC = Uint8Array.from([0x00]);

				// Fail the transaction with the interruption
				driver["handleFailedTransaction"](
					transaction,
					new ZWaveError("The command was interrupted", code),
				);

				// The cached frame must be dropped, so the retry gets a new S2 sequence number
				t.expect(msg.serializedCC).toBeUndefined();
			},
		},
	);
}

let bootloader: MockGeckoBootloader;
integrationTest.sequential(
	"Destroying the driver while it probes the Serial API after leaving the bootloader ends the probe",
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
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.serialAPIStarted = 100;
			driver.options.timeouts.response = 500;
			// Let the Serial API ignore the probe
			const ignoreProbe: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					return msg instanceof GetControllerVersionRequest;
				},
			};
			mockController.defineBehavior(ignoreProbe);

			// Leave the bootloader and wait for the first probe
			const leavePromise = driver.leaveBootloader();
			leavePromise.catch(() => {});
			await mockController.expectHostMessage(
				(msg) => msg instanceof GetControllerVersionRequest,
				{ timeout: 5000 },
			);
			// Now in the 2 second backoff before the next probe
			await wait(700);

			// Destroy the driver during the backoff
			await driver.destroy();
			// Leaving the bootloader must fail with Driver_Destroyed right away
			const result = await Promise.race([
				leavePromise.then(
					() => "resolved",
					(e: ZWaveError) => e.code,
				),
				wait(500).then(() => "still running"),
			]);
			t.expect(result).toBe(ZWaveErrorCodes.Driver_Destroyed);
		},
	},
);

integrationTest.sequential(
	"A command whose transaction expired during another operation's exclusive access is not sent",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Take exclusive access until the test releases it
			const release = createDeferredPromise<void>();
			const access = driver.withExclusiveControllerAccess(
				(send, signal) => abortable(release, signal),
			);
			// Send a command that expires after 300 ms
			mockController.clearReceivedHostMessages();

			const result = driver
				.sendMessage(
					new SendDataRequest({
						command: new NoOperationCC({ nodeId: node.id }),
					}),
					{ expire: 300 },
				)
				.catch((e: ZWaveError) => e);
			// Let the command expire, then end the exclusive access
			await wait(600);
			release.resolve();
			await access;
			// The command must fail as expired and never reach the controller
			await wait(300);

			t.expect(await result).toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageExpired,
			});
			t.expect(mockController.receivedHostMessages.some(isSendData)).toBe(
				false,
			);
		},
	},
);

integrationTest.sequential(
	"A late ACK for an aborted command does not count as the ACK of the soft reset",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.ack = 400;
			driver.options.attempts.controller = 1;

			// The controller acknowledges the SendData late and never the soft reset
			mockController.autoAckHostMessages = false;
			let isFirstSendData = true;
			const lateACK: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (isSendData(msg) && isFirstSendData) {
						isFirstSendData = false;
						setTimeout(() => controller.ackHostMessage(), 200);
						return true;
					}
					if (msg instanceof SoftResetRequest) return true;
					controller.ackHostMessage();
					return false;
				},
			};
			mockController.defineBehavior(lateACK);

			// Ping the node and wait until its SendData is sent
			void node.ping().catch(() => {});
			await mockController.expectHostMessage(isSendData);

			// The late ACK must not count for the soft reset, so the reset times out
			await assertZWaveError(t.expect, () => driver.softReset(), {
				errorCode: ZWaveErrorCodes.Controller_Timeout,
			});
		},
	},
);

integrationTest.sequential(
	"Destroying the driver does not wait for a task whose command waits for exclusive access to end",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Take exclusive access until the driver is destroyed
			const release = createDeferredPromise<void>();
			void driver
				.withExclusiveControllerAccess((send, signal) =>
					abortable(release, signal),
				)
				.catch(() => {});
			// Queue a task whose command waits for the exclusive access to end
			void driver.scheduler
				.queueTask({
					priority: TaskPriority.Normal,
					// The step itself must wait for the command, so the task does not yield
					// oxlint-disable-next-line require-yield
					task: async function* () {
						await driver.sendMessage(
							new SendDataRequest({
								command: new NoOperationCC({ nodeId: node.id }),
							}),
						);
					},
				})
				.catch(() => {});
			// Destroying the driver must not wait for that task
			await wait(100);

			const start = Date.now();
			await driver.destroy();
			t.expect(Date.now() - start).toBeLessThan(1000);
		},
	},
);

integrationTest.sequential(
	"A command whose transaction expired during a retry delay is not sent again",
	{
		// debug: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();
			// The first transmission fails as if the controller is jammed, so the driver waits before it retries
			let isFirstSendData = true;
			const jamOnce: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!isSendData(msg) || !isFirstSendData) return;
					isFirstSendData = false;
					const send = msg as SendDataBridgeRequest;
					await controller.sendMessageToHost(
						new SendDataBridgeResponse({ wasSent: true }),
					);
					await controller.sendMessageToHost(
						new SendDataBridgeRequestTransmitReport({
							callbackId: send.callbackId!,
							transmitStatus: TransmitStatus.Fail,
							txReport: {
								txTicks: 0,
								routeSpeed: 0 as any,
								routingAttempts: 0,
								ackRSSI: 0,
							},
						}),
					);
					return true;
				},
			};
			mockController.defineBehavior(jamOnce);
			// Send a command that expires after 300 ms
			mockController.clearReceivedHostMessages();

			const result = driver
				.sendCommand(new NoOperationCC({ nodeId: node.id }), {
					expire: 300,
				})
				.catch((e: ZWaveError) => e);
			// The retry delay after a jam is 1 second
			await wait(1500);

			// The command must fail as expired without being sent again
			t.expect(await result).toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageExpired,
			});
			t.expect(
				mockController.receivedHostMessages.filter(isSendData),
			).toHaveLength(1);
		},
	},
);
