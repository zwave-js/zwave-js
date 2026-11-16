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
