import { CommandClass, NoOperationCC } from "@zwave-js/cc";
import { TransportServiceCCSubsequentSegment } from "@zwave-js/cc/TransportServiceCC";
import {
	CommandClasses,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import { MessageHeaders } from "@zwave-js/serial";
import {
	GetControllerVersionRequest,
	SendDataBridgeRequest,
	SendDataRequest,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockControllerBehavior,
	MockZWaveFrameType,
	ccCaps,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";

import { determineNIF } from "../../controller/NodeInformationFrame.js";
import { ControllerGate } from "../../driver/ControllerGate.js";
import { integrationTest } from "../integrationTestSuite.js";

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
