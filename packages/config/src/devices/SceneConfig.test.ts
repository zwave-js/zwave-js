import { test } from "vitest";
import { ConditionalDeviceConfig } from "./DeviceConfig.js";

test("parses a device config with scenes", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Scene Device",
		description: "Test device with custom scene configuration",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: {
			1: {
				label: "Single Press",
				description: "Single button press action",
			},
			2: {
				label: "Double Press",
				description: "Double button press action",
			},
			3: {
				label: "Triple Press",
			},
			4: {
				label: "Hold",
				description: "Button held down action",
			},
			5: {
				label: "Release",
			},
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);

	// Ensure the scenes are parsed correctly
	t.expect(condConfig.scenes).toBeDefined();
	t.expect(condConfig.scenes!.size).toBe(5);

	const scene1 = condConfig.scenes!.get(1);
	t.expect(scene1).toBeDefined();
	t.expect(scene1!.label).toBe("Single Press");
	t.expect(scene1!.description).toBe("Single button press action");

	const scene2 = condConfig.scenes!.get(2);
	t.expect(scene2).toBeDefined();
	t.expect(scene2!.label).toBe("Double Press");
	t.expect(scene2!.description).toBe("Double button press action");

	const scene3 = condConfig.scenes!.get(3);
	t.expect(scene3).toBeDefined();
	t.expect(scene3!.label).toBe("Triple Press");
	t.expect(scene3!.description).toBeUndefined();
});

test("parses a device config without scenes", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device without scene labels",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);

	// Ensure scenes is undefined when not provided
	t.expect(condConfig.scenes).toBeUndefined();

	// Ensure evaluating works correctly
	const deviceConfig = condConfig.evaluate();
	t.expect(deviceConfig.scenes).toBeUndefined();
});

test("throws for invalid scenes - non-object", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scenes",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: "invalid",
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("scenes is not an object");
});

test("throws for invalid scenes - non-numeric scene id", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scenes",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: {
			abc: {
				label: "Invalid Label",
			},
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow(
			"invalid scene id \"abc\" in scenes - must be a positive integer (1-255)",
		);
});

test("throws for invalid scenes - scene number 0", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scenes",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: {
			0: {
				label: "Invalid Scene Zero",
			},
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow(
			"invalid scene id \"0\" in scenes - must be a positive integer (1-255)",
		);
});

test("throws for invalid scenes - scene number > 255", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scenes",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: {
			256: {
				label: "Invalid Scene Number",
			},
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("scene number 256 must be between 1 and 255");
});

test("throws for invalid scenes - missing label", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scenes",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: {
			1: {
				description: "Scene with no label",
			},
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("Scene 1 has a non-string label");
});

test("supports conditional scenes", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with conditional scenes",
		devices: [
			{
				productType: "0x0001",
				productId: "0x0001",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		scenes: {
			1: {
				label: "Always Present",
			},
			2: {
				$if: "firmwareVersion >= 2.0",
				label: "Only in v2.0+",
				description: "Available in firmware 2.0 and later",
			},
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);

	// Test with firmware < 2.0 (should only have scene 1)
	const deviceConfigOld = condConfig.evaluate({
		manufacturerId: 0x9999,
		productType: 0x0001,
		productId: 0x0001,
		firmwareVersion: "1.5",
	});

	t.expect(deviceConfigOld.scenes).toBeDefined();
	t.expect(deviceConfigOld.scenes!.size).toBe(1);
	t.expect(deviceConfigOld.scenes!.get(1)!.label).toBe("Always Present");
	t.expect(deviceConfigOld.scenes!.get(2)).toBeUndefined();

	// Test with firmware >= 2.0 (should have both scenes)
	const deviceConfigNew = condConfig.evaluate({
		manufacturerId: 0x9999,
		productType: 0x0001,
		productId: 0x0001,
		firmwareVersion: "2.0",
	});

	t.expect(deviceConfigNew.scenes).toBeDefined();
	t.expect(deviceConfigNew.scenes!.size).toBe(2);
	t.expect(deviceConfigNew.scenes!.get(1)!.label).toBe("Always Present");
	t.expect(deviceConfigNew.scenes!.get(2)!.label).toBe("Only in v2.0+");
	t.expect(deviceConfigNew.scenes!.get(2)!.description).toBe(
		"Available in firmware 2.0 and later",
	);
});
