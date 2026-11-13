import { FunctionType } from "@zwave-js/serial";
import {
	EnterBootloaderRequest,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";
import type { MockController, MockControllerBehavior } from "@zwave-js/testing";

import { determineNIF } from "../../controller/NodeInformationFrame.js";
import { OTWFirmwareUpdateStatus } from "../../driver/_Types.js";
import { integrationTest } from "../integrationTestSuite.js";

const firmware = new Bytes(256).fill(0xab);

const menu =
	"\0\r\nGecko Bootloader v2.05.02\r\n1. upload gbl\r\n2. run\r\n3. ebl info\r\nBL >\0";

interface MockBootloaderOptions {
	/** How long the bootloader takes to show the menu after EnterBootloader */
	menuDelay?: number;
	/** Install a pending image instead of showing the menu, and restart the app after this many ms */
	pendingImageInstallTime?: number;
	/** How long the app takes to start after "run" */
	runDelay?: number;
}

async function sendSerialAPIStarted(controller: MockController) {
	await controller.sendMessageToHost(
		new SerialAPIStartedRequest({
			wakeUpReason: SerialAPIWakeUpReason.Reset,
			watchdogEnabled: controller.capabilities.watchdogEnabled,
			isListening: true,
			...determineNIF(),
			supportsLongRange: controller.capabilities.supportsLongRange,
		}),
	);
}

/** A Gecko bootloader with XMODEM upload and a storage slot */
function createMockBootloader(
	options: MockBootloaderOptions,
): MockControllerBehavior {
	let state: "app" | "bootloader" | "busy" = "app";

	return {
		onHostMessage(controller, msg) {
			if (!(msg instanceof EnterBootloaderRequest)) return;

			state = "busy";
			if (options.pendingImageInstallTime != undefined) {
				setTimeout(async () => {
					state = "app";
					await sendSerialAPIStarted(controller);
				}, options.pendingImageInstallTime);
			} else {
				setTimeout(() => {
					state = "bootloader";
					controller.mockPort.emitData(Bytes.from(menu, "ascii"));
				}, options.menuDelay ?? 50);
			}
			return true;
		},

		onHostData(controller, data) {
			if (state === "app") return false;
			// The bootloader ignores everything while it is busy
			if (state === "busy") return true;

			const port = controller.mockPort;
			if (data.length === 1 && data[0] === 0x31) {
				// "1": upload gbl
				port.emitData(Bytes.from("\r\nbegin upload\0", "ascii"));
				setTimeout(() => port.emitData(Bytes.from("C", "ascii")), 10);
			} else if (data.length === 133 && data[0] === 0x01) {
				// XMODEM packet
				port.emitData(Bytes.from([0x06]));
			} else if (data.length === 1 && data[0] === 0x04) {
				// EOT
				port.emitData(
					Bytes.from(
						"\r\nSerial upload complete\r\n\0" + menu,
						"ascii",
					),
				);
			} else if (data.length === 1 && data[0] === 0x32) {
				// "2": run
				state = "busy";
				setTimeout(async () => {
					state = "app";
					await sendSerialAPIStarted(controller);
				}, options.runDelay ?? 150);
			}
			return true;
		},
	};
}

integrationTest(
	"XMODEM update: the driver re-initializes the controller after a fast application start",
	{
		additionalDriverOptions: {
			testingHooks: { skipNodeInterview: true },
		},
		customSetup: async (driver, mockController) => {
			mockController.defineBehavior(createMockBootloader({}));
		},
		testBody: async (t, driver, node, mockController) => {
			const start = Date.now();
			const result = await driver.firmwareUpdateOTW(firmware);
			t.expect(result).toStrictEqual({
				success: true,
				status: OTWFirmwareUpdateStatus.OK,
			});
			t.expect(Date.now() - start).toBeLessThan(3000);
			t.expect(driver.controller.sdkVersion).toBeDefined();
		},
	},
);

integrationTest.sequential(
	"XMODEM update: the driver waits for a staging bootloader to install the update after run",
	{
		additionalDriverOptions: {
			testingHooks: { skipNodeInterview: true },
		},
		customSetup: async (driver, mockController) => {
			// Longer than the old 1 s wait plus the fallback in ensureSerialAPI
			mockController.defineBehavior(
				createMockBootloader({ runDelay: 9000 }),
			);
		},
		testBody: async (t, driver, node, mockController) => {
			const result = await driver.firmwareUpdateOTW(firmware);
			t.expect(result.success).toBe(true);
			t.expect(driver.controller.sdkVersion).toBeDefined();
			mockController.assertReceivedHostMessage(
				(msg) => msg.functionType === FunctionType.GetControllerVersion,
			);
		},
	},
);

integrationTest(
	"XMODEM update: the driver waits for a bootloader menu that shows up late",
	{
		additionalDriverOptions: {
			testingHooks: { skipNodeInterview: true },
		},
		customSetup: async (driver, mockController) => {
			mockController.defineBehavior(
				createMockBootloader({ menuDelay: 3600 }),
			);
		},
		testBody: async (t, driver) => {
			const result = await driver.firmwareUpdateOTW(firmware);
			t.expect(result.success).toBe(true);
		},
	},
);

for (const installTime of [500, 11000]) {
	integrationTest.sequential(
		`XMODEM update fails cleanly when entering the bootloader installs a pending image (${installTime} ms)`,
		{
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(
					createMockBootloader({
						pendingImageInstallTime: installTime,
					}),
				);
			},
			testBody: async (t, driver, node, mockController) => {
				const result = await driver.firmwareUpdateOTW(firmware);
				t.expect(result).toStrictEqual({
					success: false,
					status: OTWFirmwareUpdateStatus.Error_Aborted,
				});

				// The controller was initialized again and is usable
				t.expect(driver.controller.sdkVersion).toBeDefined();
				mockController.assertReceivedHostMessage(
					(msg) =>
						msg.functionType === FunctionType.GetControllerVersion,
				);
			},
		},
	);
}
