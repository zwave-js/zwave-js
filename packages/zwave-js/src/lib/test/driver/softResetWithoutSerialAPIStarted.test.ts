import {
	GetControllerVersionRequest,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";

import { integrationTest } from "../integrationTestSuite.js";

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
