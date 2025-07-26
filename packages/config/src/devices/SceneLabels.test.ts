import { test } from "vitest";
import { ConditionalDeviceConfig } from "./DeviceConfig.js";

test("parses a device config with sceneLabels", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Scene Device",
		description: "Test device with custom scene labels",
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
		sceneLabels: {
			"1": "Single Press",
			"2": "Double Press",
			"3": "Triple Press",
			"4": "Hold",
			"5": "Release",
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	
	// Ensure the scene labels are parsed correctly
	t.expect(condConfig.sceneLabels).toBeDefined();
	t.expect(condConfig.sceneLabels!.size).toBe(5);
	t.expect(condConfig.sceneLabels!.get(1)).toBe("Single Press");
	t.expect(condConfig.sceneLabels!.get(2)).toBe("Double Press");
	t.expect(condConfig.sceneLabels!.get(3)).toBe("Triple Press");
	t.expect(condConfig.sceneLabels!.get(4)).toBe("Hold");
	t.expect(condConfig.sceneLabels!.get(5)).toBe("Release");

	// Ensure evaluating the conditional config works
	const deviceConfig = condConfig.evaluate();
	t.expect(deviceConfig.sceneLabels).toBeDefined();
	t.expect(deviceConfig.sceneLabels!.size).toBe(5);
	t.expect(deviceConfig.sceneLabels!.get(1)).toBe("Single Press");
});

test("parses a device config without sceneLabels", (t) => {
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
	
	// Ensure sceneLabels is undefined when not provided
	t.expect(condConfig.sceneLabels).toBeUndefined();

	// Ensure evaluating works correctly
	const deviceConfig = condConfig.evaluate();
	t.expect(deviceConfig.sceneLabels).toBeUndefined();
});

test("throws for invalid sceneLabels - non-object", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scene labels",
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
		sceneLabels: "invalid",
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("sceneLabels is not an object");
});

test("throws for invalid sceneLabels - non-numeric scene number", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scene labels",
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
		sceneLabels: {
			"abc": "Invalid Label",
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow('found non-numeric scene number "abc" in sceneLabels');
});

test("throws for invalid sceneLabels - scene number 0", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scene labels",
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
		sceneLabels: {
			"0": "Invalid Scene Zero",
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("scene number 0 must be between 1 and 255");
});

test("throws for invalid sceneLabels - scene number > 255", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scene labels",
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
		sceneLabels: {
			"256": "Invalid Scene Number",
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("scene number 256 must be between 1 and 255");
});

test("throws for invalid sceneLabels - non-string label", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid scene labels",
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
		sceneLabels: {
			"1": 123,
		},
	};

	t.expect(() => new ConditionalDeviceConfig("test.json", true, json))
		.toThrow("scene label for scene 1 must be a string");
});

test("accepts valid scene numbers at boundaries", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with boundary scene numbers",
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
		sceneLabels: {
			"1": "First Scene",
			"255": "Last Scene",
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	
	t.expect(condConfig.sceneLabels).toBeDefined();
	t.expect(condConfig.sceneLabels!.size).toBe(2);
	t.expect(condConfig.sceneLabels!.get(1)).toBe("First Scene");
	t.expect(condConfig.sceneLabels!.get(255)).toBe("Last Scene");
});