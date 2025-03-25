import { ZWaveErrorCodes, assertZWaveError } from "@zwave-js/core";
import { MessageHeaders } from "@zwave-js/serial";
import {
	GetControllerIdRequest,
	type GetControllerIdResponse,
} from "@zwave-js/serial/serialapi";
import { type MockControllerBehavior } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

let shouldRespond = true;

integrationTest(
	"Serial API commands that are dropped due to CAN are retried",
	{
		// debug: true,

		async customSetup(driver, mockController, mockNode) {
			const doNotRespond: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (mockController.autoAckHostMessages) {
						return false;
					}

					// After the first message, respond with a CAN, then return to normal operation again
					mockController.mockPort.emitData(Uint8Array.from([
						MessageHeaders.CAN,
					]));
					mockController.autoAckHostMessages = true;
					return true;
				},
			};
			mockController.defineBehavior(doNotRespond);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			shouldRespond = false;
			mockController.autoAckHostMessages = false;

			// This should not throw
			await driver.sendMessage<GetControllerIdResponse>(
				new GetControllerIdRequest(),
				{ supportCheck: false },
			);

			t.expect(mockController.receivedHostMessages.length).toBe(2);
		},
	},
);

integrationTest(
	"Serial API commands that are dropped due to CAN are retried up to 3 times",
	{
		// debug: true,

		async customSetup(driver, mockController, mockNode) {
			const doNotRespond: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (mockController.autoAckHostMessages) {
						return false;
					}

					mockController.mockPort.emitData(Uint8Array.from([
						MessageHeaders.CAN,
					]));
					return true;
				},
			};
			mockController.defineBehavior(doNotRespond);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			shouldRespond = false;
			mockController.autoAckHostMessages = false;

			// This should throw
			await assertZWaveError(
				t.expect,
				() =>
					driver.sendMessage<GetControllerIdResponse>(
						new GetControllerIdRequest(),
						{ supportCheck: false },
					),
				{
					errorCode: ZWaveErrorCodes.Controller_MessageDropped,
					context: "CAN",
				},
			);

			t.expect(mockController.receivedHostMessages.length).toBe(3);
		},
	},
);
