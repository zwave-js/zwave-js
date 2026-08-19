import { Bytes } from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import { DriverMode } from "../../driver/DriverMode.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"driver.ready becomes false when the bootloader is unexpectedly detected",
	{
		// debug: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(driver.ready).toBe(true);

			// Reset the serial parser mode so the mode switch routes
			// subsequent data through bootloader detection
			mockController.serial.mode = undefined;

			mockController.mockPort.emitData(
				Bytes.from(
					`\0\r\nGecko Bootloader v2.05.01\r\n1. upload gbl\r\n2. run\r\n3. ebl info\r\nBL >\0`,
					"ascii",
				),
			);

			await wait(100);

			t.expect(driver.mode).toBe(DriverMode.Bootloader);
			t.expect(driver.ready).toBe(false);
		},
	},
);

integrationTest(
	"driver.ready becomes false when the CLI is unexpectedly detected",
	{
		// debug: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(driver.ready).toBe(true);

			mockController.serial.mode = undefined;

			mockController.mockPort.emitData(
				Bytes.from(">\r\n", "ascii"),
			);

			await wait(100);

			t.expect(driver.mode).toBe(DriverMode.CLI);
			t.expect(driver.ready).toBe(false);
		},
	},
);
