import { RFRegion } from "@zwave-js/core";
import { SerialAPISetupCommand } from "@zwave-js/serial";
import { test as baseTest } from "vitest";
import type { Driver } from "../driver/Driver.js";
import { createEmptyMockDriver } from "../test/mocks.js";
import { ZWaveController } from "./Controller.js";

interface LocalTestContext {
	context: {
		fakeDriver: Driver;
		controller: ZWaveController;
	};
}

const test = baseTest.extend<LocalTestContext>({
	context: [
		async ({}, use) => {
			// Setup
			const fakeDriver = createEmptyMockDriver() as unknown as Driver;
			fakeDriver.registerRequestHandler = () => {};
			await fakeDriver.configManager.loadAll();

			const controller = new ZWaveController(fakeDriver);
			(fakeDriver as any).controller = controller;

			// Run tests
			await use({ fakeDriver, controller });

			// Teardown
		},
		{ auto: true },
	],
});

test("should populate _supportedRegions using fallback when GetSupportedRegions is not supported", async ({ context, expect }) => {
	const { controller } = context;

	// Setup: Simulate a 800-series controller with SDK 7.22.0 (which has EU_LR support but no GetSupportedRegions)
	controller["_zwaveChipType"] = "EFR32ZG23 / ZGM230S"; // Use the exact chip string
	controller["_sdkVersion"] = "7.22.0";

	// Mock isSerialAPISetupCommandSupported to return false for GetSupportedRegions but true for SetNodeIDType
	const originalIsSupported = controller.isSerialAPISetupCommandSupported.bind(controller);
	controller.isSerialAPISetupCommandSupported = (command: SerialAPISetupCommand) => {
		if (command === SerialAPISetupCommand.GetSupportedRegions) {
			return false;
		}
		if (command === SerialAPISetupCommand.SetNodeIDType) {
			return true; // Enable Long Range capability
		}
		// Return false for other setup commands to avoid actual network calls
		return false;
	};

	// Mock getRFRegion to return Europe
	controller.getRFRegion = () => Promise.resolve(RFRegion.Europe);
	controller["_rfRegion"] = RFRegion.Europe;

	// Call the method under test
	await controller.queryAndConfigureRF();

	// Verify that _supportedRegions is populated
	expect(controller["_supportedRegions"]).toBeDefined();
	expect(controller["_supportedRegions"]!.size).toBeGreaterThan(0);

	// Verify that EU_LR is included in supported regions for 800-series with SDK 7.22+
	const euLrInfo = controller["_supportedRegions"]!.get(RFRegion["Europe (Long Range)"]);
	expect(euLrInfo).toBeDefined();
	expect(euLrInfo!.supportsLongRange).toBe(true);
	expect(euLrInfo!.includesRegion).toBe(RFRegion.Europe);

	// Verify that USA_LR is also included
	const usLrInfo = controller["_supportedRegions"]!.get(RFRegion["USA (Long Range)"]);
	expect(usLrInfo).toBeDefined();
	expect(usLrInfo!.supportsLongRange).toBe(true);
	expect(usLrInfo!.includesRegion).toBe(RFRegion.USA);
});

test("should upgrade Europe to EU_LR when supported", async ({ context, expect }) => {
	const { controller } = context;

	// Setup: Simulate a 800-series controller with SDK 7.22.0
	controller["_zwaveChipType"] = "EFR32ZG23 / ZGM230S"; // Use the exact chip string
	controller["_sdkVersion"] = "7.22.0";

	// Mock Long Range capability
	controller.isSerialAPISetupCommandSupported = (command: SerialAPISetupCommand) => {
		if (command === SerialAPISetupCommand.SetNodeIDType) {
			return true; // Enable Long Range capability
		}
		return false;
	};

	// Test tryGetLRCapableRegion directly
	const result = controller["tryGetLRCapableRegion"](RFRegion.Europe);
	expect(result).toBe(RFRegion["Europe (Long Range)"]);
});

test("should upgrade USA to US_LR when supported", async ({ context, expect }) => {
	const { controller } = context;

	// Mock Long Range capability
	controller.isSerialAPISetupCommandSupported = (command: SerialAPISetupCommand) => {
		if (command === SerialAPISetupCommand.SetNodeIDType) {
			return true; // Enable Long Range capability
		}
		return false;
	};

	// Test tryGetLRCapableRegion directly
	const result = controller["tryGetLRCapableRegion"](RFRegion.USA);
	expect(result).toBe(RFRegion["USA (Long Range)"]);
});

test("should not upgrade Europe to EU_LR for non-800-series chips", async ({ context, expect }) => {
	const { controller } = context;

	// Setup: Simulate a 700-series controller (no EU_LR support)
	controller["_zwaveChipType"] = "EFR32ZG14 / ZGM130S"; // Use the exact chip string
	controller["_sdkVersion"] = "7.18.3";

	// Mock Long Range capability 
	controller.isSerialAPISetupCommandSupported = (command: SerialAPISetupCommand) => {
		if (command === SerialAPISetupCommand.SetNodeIDType) {
			return true; // Enable Long Range capability
		}
		return false;
	};

	// Test tryGetLRCapableRegion directly
	const result = controller["tryGetLRCapableRegion"](RFRegion.Europe);
	expect(result).toBe(RFRegion.Europe); // Should not upgrade
});

test("should not upgrade Europe to EU_LR for SDK versions below 7.22", async ({ context, expect }) => {
	const { controller } = context;

	// Setup: Simulate a 800-series controller with SDK 7.21 (before EU_LR support)
	controller["_zwaveChipType"] = "EFR32ZG23 / ZGM230S"; // Use the exact chip string
	controller["_sdkVersion"] = "7.21.0";

	// Mock Long Range capability
	controller.isSerialAPISetupCommandSupported = (command: SerialAPISetupCommand) => {
		if (command === SerialAPISetupCommand.SetNodeIDType) {
			return true; // Enable Long Range capability
		}
		return false;
	};

	// Test tryGetLRCapableRegion directly
	const result = controller["tryGetLRCapableRegion"](RFRegion.Europe);
	expect(result).toBe(RFRegion.Europe); // Should not upgrade
});