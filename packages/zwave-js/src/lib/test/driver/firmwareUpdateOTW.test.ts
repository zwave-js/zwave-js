import type { MockControllerOptions } from "@zwave-js/testing";
import type { TestContext } from "vitest";

import type { Driver } from "../../driver/Driver.js";
import { DriverMode } from "../../driver/DriverMode.js";
import type { PartialZWaveOptions } from "../../driver/ZWaveOptions.js";
import { OTWFirmwareUpdateStatus } from "../../driver/_Types.js";
import { integrationTest } from "../integrationTestSuite.js";
import {
	type MockGeckoBootloader,
	type MockGeckoBootloaderOptions,
	createMockGeckoBootloader,
} from "../mockGeckoBootloader.js";

// 5 XMODEM blocks of 128 bytes
const firmware = Uint8Array.from({ length: 640 }, (_, i) => (i * 7) & 0xff);

interface OTWTestOptions {
	bootloader?: MockGeckoBootloaderOptions;
	driver?: PartialZWaveOptions;
	controller?: MockControllerOptions["capabilities"];
}

function otwTest(
	name: string,
	options: OTWTestOptions,
	testBody: (
		t: TestContext,
		driver: Driver,
		bootloader: MockGeckoBootloader,
	) => Promise<void>,
): void {
	let bootloader: MockGeckoBootloader;
	integrationTest(name, {
		additionalDriverOptions: options.driver,
		controllerCapabilities: options.controller,
		async customSetup(driver, mockController) {
			bootloader = createMockGeckoBootloader(options.bootloader);
			mockController.defineBehavior(bootloader.behavior);
		},
		testBody: async (t, driver) => {
			t.onTestFinished(() => bootloader.destroy());
			await testBody(t, driver, bootloader);
		},
	});
}

otwTest("OTW update: a clean transfer succeeds", {}, async (t, driver, bl) => {
	const result = await driver.firmwareUpdateOTW(firmware);

	t.expect(result.status).toBe(OTWFirmwareUpdateStatus.OK);
	t.expect(bl.state.acceptedBlocks).toBe(5);
	t.expect(bl.state.completedUploads).toBe(1);
	t.expect(bl.state.mode).toBe("app");
	t.expect(driver.mode).toBe(DriverMode.SerialAPI);
});

otwTest(
	"OTW update: after a failed transfer, the driver is still in bootloader mode",
	{
		bootloader: {
			injectFault: ({ block }) => (block === 3 ? "drop-ack" : undefined),
		},
		// One attempt, so each call does a single upload
		driver: { attempts: { firmwareUpdateOTW: 1 } },
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.success).toBe(false);
		t.expect(bl.state.mode).toBe("bootloader");
		t.expect(bl.state.appValid).toBe(false);
		t.expect(driver.mode).toBe(DriverMode.Bootloader);
	},
);

otwTest(
	"OTW update: after a failed transfer, a second update succeeds",
	{
		bootloader: {
			injectFault: ({ block, upload }) =>
				block === 3 && upload === 1 ? "drop-ack" : undefined,
		},
		// One attempt, so each call does a single upload
		driver: { attempts: { firmwareUpdateOTW: 1 } },
	},
	async (t, driver, bl) => {
		const first = await driver.firmwareUpdateOTW(firmware);
		t.expect(first.success).toBe(false);

		const second = await driver.firmwareUpdateOTW(firmware);
		t.expect(second.status).toBe(OTWFirmwareUpdateStatus.OK);
		t.expect(bl.state.completedUploads).toBe(1);
		t.expect(bl.state.mode).toBe("app");
	},
);

otwTest(
	"OTW update: a block is sent again when its ACK is lost",
	{
		bootloader: {
			injectFault: ({ block, attempt }) =>
				block === 3 && attempt === 1 ? "drop-ack" : undefined,
		},
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.OK);
		t.expect(bl.state.uploads).toBe(1);
		t.expect(bl.state.completedUploads).toBe(1);
	},
);

otwTest(
	"OTW update: a block is sent again when the bootloader does not respond",
	{
		bootloader: {
			injectFault: ({ block, attempt }) =>
				block === 3 && attempt === 1 ? "drop-ack-and-nak" : undefined,
		},
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.OK);
		t.expect(bl.state.uploads).toBe(1);
		t.expect(bl.state.completedUploads).toBe(1);
	},
);

otwTest(
	"OTW update: a block is sent again when one of its bytes is lost",
	{
		bootloader: {
			injectFault: ({ block, attempt }) =>
				block === 3 && attempt === 1 ? "drop-host-byte" : undefined,
		},
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.OK);
		t.expect(bl.state.uploads).toBe(1);
		t.expect(bl.state.completedUploads).toBe(1);
	},
);

otwTest(
	"OTW update: an ACK that takes longer than 1 s does not fail the update",
	{
		bootloader: {
			injectFault: ({ block }) =>
				block === 3 ? { delayAck: 1500 } : undefined,
		},
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.OK);
		t.expect(bl.state.uploads).toBe(1);
		t.expect(bl.state.completedUploads).toBe(1);
	},
);

otwTest(
	"OTW update: the upload is restarted when a block keeps failing",
	{
		bootloader: {
			injectFault: ({ block, upload }) =>
				block === 3 && upload === 1 ? "drop-ack" : undefined,
		},
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.OK);
		t.expect(bl.state.uploads).toBe(2);
		t.expect(bl.state.completedUploads).toBe(1);
		t.expect(bl.state.mode).toBe("app");
	},
);

otwTest(
	"OTW update: the driver stays in bootloader mode when the upload cannot be cancelled",
	{
		bootloader: {
			ignoreCancel: true,
			injectFault: ({ block }) => (block === 3 ? "drop-ack" : undefined),
		},
		// One attempt, so each call does a single upload
		driver: { attempts: { firmwareUpdateOTW: 1 } },
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.success).toBe(false);
		t.expect(bl.state.mode).toBe("bootloader");
		t.expect(driver.mode).toBe(DriverMode.Bootloader);
	},
);

otwTest(
	"OTW update: file error 0x44 on a ZWA-2 points to the ZWA-2 Toolbox",
	{
		bootloader: {
			injectFault: ({ block }) =>
				block === 1 ? { abort: "file", errorCode: 0x44 } : undefined,
		},
		controller: { manufacturerId: 0x0466 },
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.Error_Aborted);
		t.expect(result.errorCode).toBe(0x44);
		t.expect(result.message).toBe(
			"The bootloader encryption key of this ZWA-2 is probably missing. Restore it with the ZWA-2 Toolbox: https://home-assistant.github.io/zwa2-toolbox/",
		);
		t.expect(bl.state.uploads).toBe(1);
	},
);

otwTest(
	"OTW update: file error 0x44 on other controllers explains the unknown data",
	{
		bootloader: {
			injectFault: ({ block }) =>
				block === 1 ? { abort: "file", errorCode: 0x44 } : undefined,
		},
	},
	async (t, driver, bl) => {
		const result = await driver.firmwareUpdateOTW(firmware);

		t.expect(result.status).toBe(OTWFirmwareUpdateStatus.Error_Aborted);
		t.expect(result.errorCode).toBe(0x44);
		t.expect(result.message).toMatch(/data it cannot parse/);
		t.expect(result.message).not.toMatch(/ZWA-2/);
		t.expect(bl.state.uploads).toBe(1);
	},
);

otwTest(
	"OTW update: file error 0x18 and block error 0x18 have different explanations",
	{
		bootloader: {
			injectFault: ({ block, upload }) =>
				block === 2
					? {
							abort: upload === 1 ? "file" : "block",
							errorCode: 0x18,
						}
					: undefined,
		},
		driver: { attempts: { firmwareUpdateOTW: 1 } },
	},
	async (t, driver) => {
		const fileError = await driver.firmwareUpdateOTW(firmware);
		t.expect(fileError.status).toBe(OTWFirmwareUpdateStatus.Error_Aborted);
		t.expect(fileError.errorCode).toBe(0x18);
		t.expect(fileError.message).toMatch(/rejected the image/);

		const blockError = await driver.firmwareUpdateOTW(firmware);
		t.expect(blockError.status).toBe(OTWFirmwareUpdateStatus.Error_Aborted);
		t.expect(blockError.errorCode).toBe(0x18);
		t.expect(blockError.message).toMatch(/transfer was canceled/);
	},
);
