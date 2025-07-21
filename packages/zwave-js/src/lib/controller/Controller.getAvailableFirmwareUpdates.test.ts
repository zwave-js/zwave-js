import { ManufacturerSpecificCCValues } from "@zwave-js/cc/ManufacturerSpecificCC";
import { VersionCCValues } from "@zwave-js/cc/VersionCC";
import { CommandClasses, RFRegion } from "@zwave-js/core";
import { test as baseTest } from "vitest";
import type { Driver } from "../driver/Driver.js";
import { ZWaveNode } from "../node/Node.js";
import { createEmptyMockDriver } from "../test/mocks.js";
import { ZWaveController } from "./Controller.js";
import * as FirmwareUpdateServiceModule from "./FirmwareUpdateService.js";

interface LocalTestContext {
	context: {
		fakeDriver: Driver;
		controller: ZWaveController;
		node: ZWaveNode;
		getAvailableFirmwareUpdatesSpy: any;
	};
}

const test = baseTest.extend<LocalTestContext>({
	context: [
		async ({}, use) => {
			// Setup
			const fakeDriver = createEmptyMockDriver() as unknown as Driver;
			fakeDriver.registerRequestHandler = () => {};
			// Mock the getUserAgentStringWithComponents method
			(fakeDriver as any).getUserAgentStringWithComponents = () => "test-user-agent";
			await fakeDriver.configManager.loadAll();

			const controller = new ZWaveController(fakeDriver);
			const node = new ZWaveNode(1, fakeDriver);
			
			// Add Manufacturer Specific CC to the node
			node.addCC(CommandClasses["Manufacturer Specific"], {
				isSupported: true,
				version: 1,
			});
			
			// Add Version CC to the node  
			node.addCC(CommandClasses["Version"], {
				isSupported: true,
				version: 1,
			});
			
			// Set up node properties required for firmware update check via valueDB
			node.valueDB.setValue(ManufacturerSpecificCCValues.manufacturerId.id, 0x0123);
			node.valueDB.setValue(ManufacturerSpecificCCValues.productType.id, 0x4567);
			node.valueDB.setValue(ManufacturerSpecificCCValues.productId.id, 0x89ab);
			node.valueDB.setValue(VersionCCValues.firmwareVersions.id, ["1.0"]);

			controller["_nodes"].set(1, node);
			(fakeDriver as any).controller = controller;

			// Mock the firmware update service function
			const getAvailableFirmwareUpdatesSpy = await import("vitest").then(v => 
				v.vi.spyOn(FirmwareUpdateServiceModule, "getAvailableFirmwareUpdates")
					.mockResolvedValue([])
			);

			// Run tests
			await use({ 
				fakeDriver, 
				controller, 
				node,
				getAvailableFirmwareUpdatesSpy 
			});

			// Teardown
			getAvailableFirmwareUpdatesSpy.mockRestore();
		},
		{ auto: true },
	],
});

test("should use controller RF region when available", async ({ context, expect }) => {
	const { controller, getAvailableFirmwareUpdatesSpy } = context;
	
	// Set controller RF region
	controller["_rfRegion"] = RFRegion.Europe;
	
	await controller.getAvailableFirmwareUpdates(1);

	expect(getAvailableFirmwareUpdatesSpy).toHaveBeenCalledWith(
		expect.objectContaining({
			rfRegion: RFRegion.Europe,
		}),
		expect.any(Object)
	);
});

test("should use options RF region when controller region is not available", async ({ context, expect }) => {
	const { controller, getAvailableFirmwareUpdatesSpy } = context;
	
	// Ensure controller RF region is not set
	controller["_rfRegion"] = undefined;
	
	await controller.getAvailableFirmwareUpdates(1, { rfRegion: RFRegion.USA });

	expect(getAvailableFirmwareUpdatesSpy).toHaveBeenCalledWith(
		expect.objectContaining({
			rfRegion: RFRegion.USA,
		}),
		expect.any(Object)
	);
});

test("should use driver options RF region as fallback when controller and options region are not available", async ({ context, expect }) => {
	const { fakeDriver, controller, getAvailableFirmwareUpdatesSpy } = context;
	
	// Ensure controller RF region is not set
	controller["_rfRegion"] = undefined;
	
	// Set driver options RF region
	fakeDriver.options.rf = { region: RFRegion["Australia/New Zealand"] };
	
	await controller.getAvailableFirmwareUpdates(1);

	expect(getAvailableFirmwareUpdatesSpy).toHaveBeenCalledWith(
		expect.objectContaining({
			rfRegion: RFRegion["Australia/New Zealand"],
		}),
		expect.any(Object)
	);
});

test("should prioritize controller region over options and driver regions", async ({ context, expect }) => {
	const { fakeDriver, controller, getAvailableFirmwareUpdatesSpy } = context;
	
	// Set all three sources of RF region
	controller["_rfRegion"] = RFRegion.Europe;
	fakeDriver.options.rf = { region: RFRegion.USA };
	
	await controller.getAvailableFirmwareUpdates(1, { rfRegion: RFRegion.China });

	expect(getAvailableFirmwareUpdatesSpy).toHaveBeenCalledWith(
		expect.objectContaining({
			rfRegion: RFRegion.Europe, // Controller region should take priority
		}),
		expect.any(Object)
	);
});

test("should prioritize options region over driver region when controller region is not available", async ({ context, expect }) => {
	const { fakeDriver, controller, getAvailableFirmwareUpdatesSpy } = context;
	
	// Ensure controller RF region is not set
	controller["_rfRegion"] = undefined;
	
	// Set both options and driver regions
	fakeDriver.options.rf = { region: RFRegion.USA };
	
	await controller.getAvailableFirmwareUpdates(1, { rfRegion: RFRegion.China });

	expect(getAvailableFirmwareUpdatesSpy).toHaveBeenCalledWith(
		expect.objectContaining({
			rfRegion: RFRegion.China, // Options region should take priority over driver region
		}),
		expect.any(Object)
	);
});

test("should pass undefined rfRegion when no region sources are available", async ({ context, expect }) => {
	const { fakeDriver, controller, getAvailableFirmwareUpdatesSpy } = context;
	
	// Ensure no RF region is set anywhere
	controller["_rfRegion"] = undefined;
	fakeDriver.options.rf = undefined;
	
	await controller.getAvailableFirmwareUpdates(1);

	expect(getAvailableFirmwareUpdatesSpy).toHaveBeenCalledWith(
		expect.objectContaining({
			rfRegion: undefined,
		}),
		expect.any(Object)
	);
});