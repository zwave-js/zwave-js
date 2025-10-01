import { CommandClasses } from "@zwave-js/core";
import { integrationTest } from "../integrationTestSuite.js";

// Helper function to setup device config with destructive parameters
function setupDestructiveDeviceConfig(driver: any, node: any) {
	const testDeviceConfig = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0x7e57",
		label: "Test Device",
		description: "Test device for destructive parameter testing",
		devices: [{ productType: "0x0001", productId: "0x0001" }],
		firmwareVersion: { min: "0.0", max: "255.255" },
		paramInformation: [
			{
				"#": 1,
				valueSize: 1,
				format: 0,
				minValue: 0,
				maxValue: 255,
				defaultValue: 0,
				options: [],
				label: "Non-destructive Parameter",
				description:
					"A normal parameter that doesn't require confirmation",
			},
			{
				"#": 2,
				valueSize: 1,
				format: 0,
				minValue: 0,
				maxValue: 255,
				defaultValue: 0,
				options: [],
				label: "Destructive Parameter",
				description:
					"A destructive parameter that requires confirmation",
				destructive: true,
			},
		],
	};

	node._deviceConfig = testDeviceConfig;

	// Process device config manually
	const configCCInstance = node.getEndpoint(0)?.createCCInstanceUnsafe(
		CommandClasses.Configuration,
	);
	if (configCCInstance?.deserializeParamInformationFromConfig) {
		const paramInfoMap = new Map();
		for (const param of testDeviceConfig.paramInformation) {
			paramInfoMap.set(
				{ parameter: param["#"], valueBitMask: undefined },
				{
					valueSize: param.valueSize,
					format: param.format,
					minValue: param.minValue,
					maxValue: param.maxValue,
					defaultValue: param.defaultValue,
					options: param.options,
					label: param.label,
					description: param.description,
					destructive: param.destructive,
				},
			);
		}
		configCCInstance.deserializeParamInformationFromConfig(
			driver,
			paramInfoMap,
		);
	}
}

const testOptions = {
	nodeCapabilities: {
		manufacturerId: 0x7e57,
		productType: 0x0001,
		productId: 0x0001,
		commandClasses: [
			CommandClasses.Version,
			CommandClasses["Manufacturer Specific"],
			CommandClasses.Configuration,
		],
	},
};

integrationTest(
	"Non-destructive configuration parameters work without confirmation",
	{
		...testOptions,
		testBody: async (t, driver, node, _mockController, _mockNode) => {
			setupDestructiveDeviceConfig(driver, node);

			// Non-destructive parameter should work without confirm
			await node.commandClasses.Configuration.setValue!(
				{ property: 1 },
				5,
			);
		},
	},
);

integrationTest(
	"Destructive configuration parameters throw error without confirmation",
	{
		...testOptions,
		testBody: async (t, driver, node, _mockController, _mockNode) => {
			setupDestructiveDeviceConfig(driver, node);

			await t.expect(
				node.commandClasses.Configuration.setValue!({ property: 2 }, 5),
			).rejects.toThrow(
				"Setting parameter #2 requires confirmation because it is marked as destructive",
			);
		},
	},
);

integrationTest(
	"Destructive configuration parameters work with confirmation",
	{
		...testOptions,
		testBody: async (t, driver, node, _mockController, _mockNode) => {
			setupDestructiveDeviceConfig(driver, node);

			// Destructive parameter should work with confirm
			await node.commandClasses.Configuration.setValue!(
				{ property: 2 },
				5,
				{ confirm: true },
			);
		},
	},
);

integrationTest(
	"Low-level set API enforces destructive parameter validation",
	{
		...testOptions,
		testBody: async (t, driver, node, _mockController, _mockNode) => {
			setupDestructiveDeviceConfig(driver, node);

			await t.expect(
				node.commandClasses.Configuration.set({
					parameter: 2,
					value: 10,
					valueSize: 1,
					valueFormat: 0,
				}),
			).rejects.toThrow(
				"Setting parameter #2 requires confirmation because it is marked as destructive",
			);
		},
	},
);

integrationTest(
	"Low-level set API accepts confirm option for destructive parameters",
	{
		...testOptions,
		testBody: async (t, driver, node, _mockController, _mockNode) => {
			setupDestructiveDeviceConfig(driver, node);

			// Destructive parameter should work with confirm
			await node.commandClasses.Configuration.set({
				parameter: 2,
				value: 10,
				valueSize: 1,
				valueFormat: 0,
				confirm: true,
			});
		},
	},
);
