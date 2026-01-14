import { isArray } from "alcalzone-shared/typeguards";
import { test } from "vitest";
import { ConditionalDeviceConfig } from "./DeviceConfig.js";

test("parses a simple device config", (t) => {
	const json = {
		manufacturer: "Silicon Labs",
		manufacturerId: "0x0000",
		label: "ZST10-700",
		description: "700 Series-based Controller",
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that the config is parsed correctly
	t.expect(condConfig.manufacturer).toBe("Silicon Labs");
	t.expect(condConfig.label).toBe("ZST10-700");
	t.expect(condConfig.description).toBe("700 Series-based Controller");
	t.expect(condConfig.firmwareVersion).toStrictEqual({
		min: "0.0",
		max: "255.255",
	});
});

test("parses a device config with conditional manufacturer, label and description", (t) => {
	const json = {
		manufacturer: [
			{ $if: "firmwareVersion < 1.0", value: "Silicon Labs" },
			"Z-Wave JS",
		],
		manufacturerId: "0x0000",
		label: [
			{ $if: "firmwareVersion < 1.0", value: "ZST10-700" },
			"ZST10-700 rev. 2",
		],
		description: [
			{
				$if: "firmwareVersion < 1.0",
				value: "700 Series-based Controller",
			},
			"815 Series-based Controller",
		],
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that the config is parsed correctly
	t.expect(condConfig.manufacturer.length).toBe(2);
	t.expect(condConfig.label.length).toBe(2);
	t.expect(condConfig.description.length).toBe(2);
	t.expect(condConfig.firmwareVersion).toMatchObject({
		min: "0.0",
		max: "255.255",
	});

	// and that evaluating it works
	const deviceId = {
		manufacturerId: 0x0000,
		productType: 0x0004,
		productId: 0x0004,
	};

	const evaluated1 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "0.5",
	});
	t.expect(evaluated1.manufacturer).toBe("Silicon Labs");
	t.expect(evaluated1.label).toBe("ZST10-700");
	t.expect(evaluated1.description).toBe("700 Series-based Controller");

	const evaluated2 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "1.0",
	});
	t.expect(evaluated2.manufacturer).toBe("Z-Wave JS");
	t.expect(evaluated2.label).toBe("ZST10-700 rev. 2");
	t.expect(evaluated2.description).toBe("815 Series-based Controller");
});

test("parses a device config with conditional metadata", (t) => {
	const json = {
		manufacturer: "Silicon Labs",
		manufacturerId: "0x0000",
		label: "ZST10-700",
		description: "700 Series-based Controller",
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		metadata: {
			reset: [
				{
					$if: "firmwareVersion < 1.0",
					value: "Press any key to continue...",
				},
			],
			comments: [
				{
					$if: "firmwareVersion < 1.0",
					level: "warning",
					text: "Join the dark side!",
				},
				{
					$if: "firmwareVersion >= 1.0",
					level: "info",
					text: "Good, good...",
				},
			],
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that evaluating the config works
	const deviceId = {
		manufacturerId: 0x0000,
		productType: 0x0004,
		productId: 0x0004,
	};

	const evaluated1 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "0.5",
	});
	t.expect(evaluated1.metadata?.reset).toBe("Press any key to continue...");
	t.expect(evaluated1.metadata?.comments).toStrictEqual([
		{
			level: "warning",
			text: "Join the dark side!",
		},
	]);

	const evaluated2 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "1.0",
	});
	t.expect(evaluated2.metadata?.reset).toBeUndefined();
	t.expect(evaluated2.metadata?.comments).toStrictEqual([
		{
			level: "info",
			text: "Good, good...",
		},
	]);
});

test("parses a device config with conditional compat flags", (t) => {
	const json = {
		manufacturer: "Silicon Labs",
		manufacturerId: "0x0000",
		label: "ZST10-700",
		description: "700 Series-based Controller",
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		compat: [
			{
				$if: "firmwareVersion < 1.0",
				mapBasicSet: "auto",
			},
		],
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that evaluating the config works
	const deviceId = {
		manufacturerId: 0x0000,
		productType: 0x0004,
		productId: 0x0004,
	};

	const evaluated1 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "0.5",
	});
	t.expect(evaluated1.compat).toStrictEqual({
		mapBasicSet: "auto",
	});

	const evaluated2 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "1.0",
	});
	t.expect(evaluated2.compat).toBeUndefined();
});

test("parses a device config with conditional config parameter options", (t) => {
	const json = {
		manufacturer: "Silicon Labs",
		manufacturerId: "0x0000",
		label: "ZST10-700",
		description: "700 Series-based Controller",
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		paramInformation: [
			{
				"#": "1",
				label: "This is a parameter",
				valueSize: 1,
				defaultValue: 1,
				allowManualEntry: false,
				options: [
					{
						label: "Yes",
						value: 1,
					},
					{
						label: "No",
						value: 2,
					},
					{
						$if: "firmwareVersion < 1.0",
						label: "Maybe",
						value: 3,
					},
				],
			},
		],
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that evaluating the config works
	const deviceId = {
		manufacturerId: 0x0000,
		productType: 0x0004,
		productId: 0x0004,
	};

	const evaluated1 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "0.5",
	});
	t.expect(evaluated1.paramInformation?.get({ parameter: 1 })?.options)
		.toStrictEqual([
			{
				label: "Yes",
				value: 1,
			},
			{
				label: "No",
				value: 2,
			},
			{
				label: "Maybe",
				value: 3,
			},
		]);

	const evaluated2 = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "1.0",
	});
	t.expect(evaluated2.paramInformation?.get({ parameter: 1 })?.options)
		.toStrictEqual([
			{
				label: "Yes",
				value: 1,
			},
			{
				label: "No",
				value: 2,
			},
		]);
});

test("supports sdkVersion in conditions", (t) => {
	const json = {
		manufacturer: [
			{ $if: "sdkVersion >= 7.0", value: "Z-Wave Alliance" },
			"Legacy Manufacturer",
		],
		manufacturerId: "0x0000",
		label: "ZST10-700",
		description: "700 Series-based Controller",
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		metadata: {
			comments: [
				{
					$if: "sdkVersion >= 7.19.0",
					level: "info",
					text: "This SDK version has feature X",
				},
				{
					$if: "sdkVersion < 7.19.0",
					level: "warning",
					text: "This SDK version lacks feature X",
				},
			],
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that evaluating the config works
	const deviceId = {
		manufacturerId: 0x0000,
		productType: 0x0004,
		productId: 0x0004,
		firmwareVersion: "1.0",
	};

	const evaluatedWithOldSDK = condConfig.evaluate({
		...deviceId,
		sdkVersion: "7.18.0",
	});
	t.expect(evaluatedWithOldSDK.manufacturer).toBe("Z-Wave Alliance");
	t.expect(evaluatedWithOldSDK.metadata?.comments).toStrictEqual([
		{
			level: "warning",
			text: "This SDK version lacks feature X",
		},
	]);

	const evaluatedWithNewSDK = condConfig.evaluate({
		...deviceId,
		sdkVersion: "7.19.0",
	});
	t.expect(evaluatedWithNewSDK.manufacturer).toBe("Z-Wave Alliance");
	t.expect(evaluatedWithNewSDK.metadata?.comments).toStrictEqual([
		{
			level: "info",
			text: "This SDK version has feature X",
		},
	]);

	// Without sdkVersion, should fall back to default
	const evaluatedWithoutSDK = condConfig.evaluate(deviceId);
	t.expect(evaluatedWithoutSDK.manufacturer).toBe("Legacy Manufacturer");
	t.expect(
		isArray(evaluatedWithoutSDK.metadata?.comments)
			&& evaluatedWithoutSDK.metadata?.comments.length,
	).toBe(0);
});

test("supports x.y.z firmware versions", (t) => {
	const json = {
		manufacturer: "Silicon Labs",
		manufacturerId: "0x0000",
		label: "ZST10-700",
		description: "700 Series-based Controller",
		devices: [
			{
				productType: "0x0004",
				productId: "0x0004",
			},
		],
		firmwareVersion: {
			min: "0.0",
			max: "255.255",
		},
		metadata: {
			comments: [
				{
					$if: "firmwareVersion < 7.17.2",
					level: "warning",
					text: "Woah, this is buggy!",
				},
			],
		},
	};

	const condConfig = new ConditionalDeviceConfig("test.json", true, json);
	// Ensure that evaluating the config works
	const deviceId = {
		manufacturerId: 0x0000,
		productType: 0x0004,
		productId: 0x0004,
	};

	const evaluatedXY_warning = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "7.17",
	});
	t.expect(
		isArray(evaluatedXY_warning.metadata?.comments)
			&& evaluatedXY_warning.metadata?.comments.length,
	).toBe(1);

	const evaluatedXY_ok = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "7.18",
	});
	t.expect(
		isArray(evaluatedXY_ok.metadata?.comments)
			&& evaluatedXY_ok.metadata?.comments.length,
	).toBe(0);

	const evaluatedXYZ_warning = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "7.17.1",
	});
	t.expect(
		isArray(evaluatedXYZ_warning.metadata?.comments)
			&& evaluatedXYZ_warning.metadata?.comments.length,
	).toBe(1);

	const evaluatedXYZ_ok = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "7.17.2",
	});
	t.expect(
		isArray(evaluatedXYZ_ok.metadata?.comments)
			&& evaluatedXYZ_ok.metadata?.comments.length,
	).toBe(0);
});

test("parses parameter with allowed field (ranges with gaps)", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with allowed field",
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
		paramInformation: [
			{
				"#": "1",
				label: "Sensitivity",
				description: "1-10: Low, 20-30: Medium, 100: Max",
				valueSize: 1,
				defaultValue: 5,
				unsigned: true,
				allowed: [
					{ range: [1, 10] },
					{ range: [20, 30] },
					{ value: 100 },
				],
			},
			{
				"#": "2",
				label: "Step Example",
				description: "Parameter with step size",
				valueSize: 1,
				defaultValue: 10,
				unsigned: true,
				allowed: [{ range: [0, 60], step: 5 }],
			},
		],
	};

	const condConfig = new ConditionalDeviceConfig(
		"test-allowed.json",
		true,
		json,
	);
	const deviceId = {
		manufacturerId: 0x9999,
		productType: 0x0001,
		productId: 0x0001,
	};

	const evaluated = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "1.0",
	});

	// Check that the parameter was parsed
	const param = evaluated.paramInformation?.get({ parameter: 1 });
	t.expect(param).toBeDefined();
	t.expect(param?.label).toBe("Sensitivity");

	// Check that allowed field is present
	t.expect(param?.allowed).toBeDefined();
	t.expect(param?.allowed?.length).toBe(3);

	// Check envelope was computed correctly (1 to 100)
	t.expect(param?.minValue).toBe(1);
	t.expect(param?.maxValue).toBe(100);

	// Check step parameter
	const param2 = evaluated.paramInformation?.get({ parameter: 2 });
	t.expect(param2).toBeDefined();
	t.expect(param2?.allowed).toBeDefined();
	t.expect(param2?.allowed?.length).toBe(1);
	// Verify the step property is preserved
	if (param2?.allowed?.[0] && "from" in param2.allowed[0]) {
		t.expect(param2.allowed[0].step).toBe(5);
	}
});

test("rejects parameter with both allowed and minValue/maxValue", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Test device with invalid config",
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
		paramInformation: [
			{
				"#": "1",
				label: "Invalid Parameter",
				valueSize: 1,
				minValue: 0,
				maxValue: 255,
				defaultValue: 5,
				allowed: [{ range: [1, 10] }],
			},
		],
	};

	t.expect(() => new ConditionalDeviceConfig("test-invalid.json", true, json))
		.toThrow(/cannot be used together with/);
});

test("legacy config with minValue/maxValue gets allowed set to single range", (t) => {
	const json = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x9999",
		label: "Test Device",
		description: "Legacy device with minValue/maxValue",
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
		paramInformation: [
			{
				"#": "1",
				label: "Legacy Parameter",
				valueSize: 1,
				minValue: 10,
				maxValue: 50,
				defaultValue: 25,
			},
		],
	};

	const condConfig = new ConditionalDeviceConfig(
		"test-legacy.json",
		true,
		json,
	);
	const deviceId = {
		manufacturerId: 0x9999,
		productType: 0x0001,
		productId: 0x0001,
	};

	const evaluated = condConfig.evaluate({
		...deviceId,
		firmwareVersion: "1.0",
	});

	const param = evaluated.paramInformation?.get({ parameter: 1 });
	t.expect(param).toBeDefined();

	// Check that allowed is populated with a single range matching minValue/maxValue
	t.expect(param?.allowed).toBeDefined();
	t.expect(param?.allowed?.length).toBe(1);

	const valueDef = param?.allowed?.[0];
	t.expect(valueDef).toBeDefined();
	if (valueDef && "from" in valueDef) {
		t.expect(valueDef.from).toBe(10);
		t.expect(valueDef.to).toBe(50);
	} else {
		t.expect.fail("Expected a range value definition");
	}
});
