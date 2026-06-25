import { ZWaveErrorCodes, assertZWaveError } from "@zwave-js/core";
import { FunctionType } from "@zwave-js/serial";
import {
	GetControllerIdRequest,
	type GetControllerIdResponse,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import type { MockControllerBehavior } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { vi } from "vitest";
import { integrationTest } from "../integrationTestSuite.js";

let shouldRespond = true;

integrationTest(
	"When the controller is unresponsive, retry the command as configured, then soft-reset it to recover",
	{
		// debug: true,

		additionalDriverOptions: {
			timeouts: {
				// Shorten the timeouts to speed up the test
				ack: 400,
			},
			// Attempt communication 2 times before considering the controller unresponsive
			attempts: {
				controller: 2,
			},
		},

		async customSetup(driver, mockController, mockNode) {
			const doNotRespond: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (!shouldRespond) {
						// Soft reset should restore normal operation
						if (msg instanceof SoftResetRequest) {
							// The ACK was not sent, so we need to do it here
							mockController.ackHostMessage();

							shouldRespond = true;
							mockController.autoAckHostMessages = true;

							// Call the original handler
							return false;
						}
						return true;
					}

					return false;
				},
			};
			mockController.defineBehavior(doNotRespond);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			shouldRespond = false;
			mockController.autoAckHostMessages = false;

			const ids = await driver.sendMessage<GetControllerIdResponse>(
				new GetControllerIdRequest(),
				{ supportCheck: false },
			);

			t.expect(ids.ownNodeId).toBe(mockController.ownNodeId);

			// The controller should have tried the command a total of 3 times.
			// Twice before the soft reset, and once after
			const attempts = mockController.receivedHostMessages.filter(
				(msg) => msg.functionType === FunctionType.GetControllerId,
			).length;
			t.expect(attempts).toBe(3);
		},
	},
);

integrationTest(
	"When the controller is still unresponsive after soft reset, re-open the serial port",
	{
		// debug: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
			attempts: {
				// Spend less time waiting
				controller: 1,
			},
		},

		async customSetup(driver, mockController, mockNode) {
			const doNotRespond: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (!shouldRespond) return true;

					return false;
				},
			};
			mockController.defineBehavior(doNotRespond);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			shouldRespond = false;
			mockController.autoAckHostMessages = false;

			const serialPortCloseSpy = vi.spyOn(mockController.serial, "close")
				.mockImplementation(
					async () => {
						shouldRespond = true;
						mockController.autoAckHostMessages = true;
					},
				);

			await wait(1000);

			await assertZWaveError(
				t.expect,
				() =>
					driver.sendMessage<GetControllerIdResponse>(
						new GetControllerIdRequest(),
						{ supportCheck: false },
					),
				{
					errorCode: ZWaveErrorCodes.Controller_Timeout,
					context: "ACK",
				},
			);

			// The serial port should have been closed and reopened
			await wait(100);
			t.expect(serialPortCloseSpy).toHaveBeenCalled();

			// FIXME: When closing the serial port, we lose the connection between the mock port instance and the controller
			// Fix it at some point, then enable the below test.

			// await wait(1000);

			// // Sending a command should work again, assuming the controller is responsive again
			// await t.notThrowsAsync(() =>
			// 	driver.sendMessage<GetControllerIdResponse>(
			// 		new GetControllerIdRequest(driver),
			// 		{ supportCheck: false },
			// 	)
			// );

			// driver.driverLog.print("TEST PASSED");
		},
	},
);

integrationTest(
	"When the serial port cannot be reopened during unresponsive controller recovery, the driver emits an error and destroys itself",
	{
		// debug: true,

		connectViaTCP: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
			timeouts: {
				// Shorten the timeouts to speed up the test
				ack: 400,
			},
			attempts: {
				// Spend less time waiting, but make sure
				// we excercise the loops at least
				controller: 2,
				openSerialPort: 2,
			},
		},

		async customSetup(driver, mockController, mockNode) {
			const doNotRespond: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (!shouldRespond) return true;

					return false;
				},
			};
			mockController.defineBehavior(doNotRespond);
		},

		async testBody(t, driver, node, mockController, mockNode, context) {
			shouldRespond = false;
			mockController.autoAckHostMessages = false;
			// Restore the shared flag, so the following tests in this file
			// start with a responsive controller
			t.onTestFinished(() => {
				shouldRespond = true;
			});

			// Simulate a remote endpoint that lost power: the established
			// connection stays half-open without traffic, but reconnection
			// attempts are refused
			context.tcpServer!.close();

			const errorPromise = new Promise<Error>((resolve) => {
				driver.on("error", resolve);
			});

			// The command fails since the controller is unresponsive
			await assertZWaveError(
				t.expect,
				() =>
					driver.sendMessage<GetControllerIdResponse>(
						new GetControllerIdRequest(),
						{ supportCheck: false },
					),
				{
					errorCode: ZWaveErrorCodes.Controller_Timeout,
					context: "ACK",
				},
			);

			// The recovery via soft reset and reopening the serial port fails.
			// Instead of emitting an unhandled exception, this should be surfaced
			// as a Driver_Failed error.
			const error = await Promise.race([
				errorPromise,
				wait(10000).then(() => {
					throw new Error(
						"The driver did not emit an error event",
					);
				}),
			]);
			assertZWaveError(t.expect, error, {
				errorCode: ZWaveErrorCodes.Driver_Failed,
			});

			// And the driver should be destroyed
			await wait(100);
			t.expect(driver["wasDestroyed"]).toBe(true);
		},
	},
);

integrationTest(
	"The unresponsive controller recovery does not kick in when it was enabled via config",
	{
		// debug: true,

		additionalDriverOptions: {
			attempts: {
				controller: 1,
			},
			features: {
				unresponsiveControllerRecovery: false,
			},
		},

		async customSetup(driver, mockController, mockNode) {
			const doNotRespond: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (!shouldRespond) {
						return true;
					}

					return false;
				},
			};
			mockController.defineBehavior(doNotRespond);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			shouldRespond = false;
			mockController.autoAckHostMessages = false;

			// The command fails
			await assertZWaveError(
				t.expect,
				() =>
					driver.sendMessage<GetControllerIdResponse>(
						new GetControllerIdRequest(),
						{ supportCheck: false },
					),
				{
					errorCode: ZWaveErrorCodes.Controller_Timeout,
					context: "ACK",
				},
			);

			await wait(500);

			// And the controller does not get soft-reset
			t.expect(() =>
				mockController.assertReceivedHostMessage((msg) =>
					msg.functionType === FunctionType.SoftReset
				)
			).toThrow();
		},
	},
);
