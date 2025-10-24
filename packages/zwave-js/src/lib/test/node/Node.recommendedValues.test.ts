import { CommandClasses } from "@zwave-js/core";
import path from "node:path";
import type { TestContext } from "vitest";
import { integrationTest } from "../integrationTestSuite.js";

// Structure for property expectations
type PropertyExpectation = {
	property: number;
	bitMask?: number;
	expected: number;
};

// Common node capabilities
const nodeCapabilities = {
	// These must match the values in deviceConfig.json
	manufacturerId: 0x1234,
	productType: 0x5678,
	productId: 0x9abc,

	commandClasses: [
		{
			ccId: CommandClasses.Configuration,
			// Configure the CC capabilities with our parameters
			parameters: [
				{
					"#": 1,
					defaultValue: 1,
					valueSize: 1,
				},
				{
					"#": 2,
					defaultValue: 100, // Initial value
					valueSize: 2,
				},
				{
					"#": 7,
					defaultValue: 2, // This will be split into partial parameters: 0x01 (bit 0) = 0, 0x02 (bit 1) = 1
					valueSize: 1,
				},
			],
		},
		CommandClasses.Version,
		CommandClasses["Manufacturer Specific"],
	],
};

const deviceConfigPriorityDir = path.join(
	__dirname,
	"fixtures/recommendedValues",
);

// Helper function to verify that properties match expected values
async function verifyPropertiesMatchExpectedValues(
	t: TestContext,
	properties: PropertyExpectation[],
	node: any,
) {
	for (const { property, bitMask, expected } of properties) {
		const valueId = {
			commandClass: CommandClasses.Configuration,
			property,
			propertyKey: bitMask,
		};

		const value = await node.getValue(valueId);

		const paramName = bitMask
			? `Parameter ${property}[0x${
				bitMask.toString(16).toUpperCase().padStart(2, "0")
			}]`
			: `Parameter ${property}`;

		// Add descriptive message that shows what we're testing
		t.expect(
			value,
			`${paramName} should have value ${expected} but got ${
				String(value)
			}`,
		).toBe(expected);
	}
}

// Tests

integrationTest("Auto apply recommended values during interview", {
	// Enable debug mode to see logs and keep test directory for inspection
	// debug: true,

	nodeCapabilities: nodeCapabilities,

	// Provide the directory containing our custom device config
	additionalDriverOptions: {
		// Enable applying recommended configuration values
		interview: {
			applyConfigurationRecommendedValues: true,
		},
		storage: {
			deviceConfigPriorityDir: deviceConfigPriorityDir,
		},
	},

	async testBody(t, driver, node, mockController, mockNode) {
		// Because applyConfigurationRecommendedValues is enabled, the values should be set to the recommended values

		const propertyToValue: PropertyExpectation[] = [
			{ property: 1, expected: 2 },
			// Current value is different from default, so it should not be changed
			{ property: 2, expected: 100 },
			{ property: 7, bitMask: 0x01, expected: 1 },
			{ property: 7, bitMask: 0x02, expected: 0 },
		];

		await verifyPropertiesMatchExpectedValues(t, propertyToValue, node);
	},
});

integrationTest(
	"Keep existing values during interview when applyConfigurationRecommendedValues is disabled",
	{
		// Enable debug mode to see logs and keep test directory for inspection
		// debug: true,

		nodeCapabilities: nodeCapabilities,

		// Provide the directory containing our custom device config
		additionalDriverOptions: {
			interview: {
				applyConfigurationRecommendedValues: false,
			},
			storage: {
				deviceConfigPriorityDir: deviceConfigPriorityDir,
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Because applyConfigurationRecommendedValues is disabled, the values should remain at their current/default values

			const propertyToValue: PropertyExpectation[] = [
				{ property: 1, expected: 1 },
				{ property: 2, expected: 100 },
				{ property: 7, bitMask: 0x01, expected: 0 },
				{ property: 7, bitMask: 0x02, expected: 1 },
			];

			await verifyPropertiesMatchExpectedValues(t, propertyToValue, node);
		},
	},
);
