import { CommandClasses } from "@zwave-js/core";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Hidden configuration parameters should not expose values or metadata after interview",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
					// Configure the CC capabilities with our parameters
					parameters: [
						{
							"#": 1,
							defaultValue: 50,
							valueSize: 1,
						},
						{
							"#": 2,
							defaultValue: 0,
							valueSize: 1,
						},
						{
							"#": 3,
							defaultValue: 100,
							valueSize: 2,
						},
					],
				},
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/ConfigurationCC.hidden",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Verify device config is loaded
			t.expect(node.deviceConfig).toBeDefined();
			t.expect(node.deviceConfig?.label).toBe("Test Device");

			// Verify the paramInformation is loaded from device config
			const paramInfo = node.deviceConfig?.paramInformation;
			t.expect(paramInfo).toBeDefined();

			// Hidden parameter is present in config with hidden flag
			const param2Info = paramInfo?.get({ parameter: 2 });
			t.expect(param2Info).toBeDefined();
			t.expect(param2Info?.hidden).toBe(true);

			// But visible parameters should not have hidden flag
			const param1Info = paramInfo?.get({ parameter: 1 });
			t.expect(param1Info?.hidden).toBe(false);

			// Get all value IDs from the node
			const valueIDs = node.getDefinedValueIDs();

			// Filter to Configuration CC value IDs
			const configValueIDs = valueIDs.filter(
				(v) => v.commandClass === CommandClasses.Configuration,
			);

			// Get the property numbers that are exposed
			const exposedProperties = new Set(
				configValueIDs
					.filter((v) => typeof v.property === "number")
					.map((v) => v.property as number),
			);

			// Visible parameters (1 and 3) should be exposed
			t.expect(
				exposedProperties.has(1),
				"Parameter 1 (visible) should be exposed",
			).toBe(true);
			t.expect(
				exposedProperties.has(3),
				"Parameter 3 (visible) should be exposed",
			).toBe(true);

			// Hidden parameter (2) should NOT be exposed
			t.expect(
				exposedProperties.has(2),
				"Parameter 2 (hidden) should NOT be exposed",
			).toBe(false);

			// Also verify values - visible parameters should have values
			const param1Value = node.getValue({
				commandClass: CommandClasses.Configuration,
				property: 1,
			});
			const param3Value = node.getValue({
				commandClass: CommandClasses.Configuration,
				property: 3,
			});
			const param2Value = node.getValue({
				commandClass: CommandClasses.Configuration,
				property: 2,
			});

			t.expect(param1Value, "Parameter 1 should have a value").toBe(50);
			t.expect(param3Value, "Parameter 3 should have a value").toBe(100);
			t.expect(
				param2Value,
				"Parameter 2 (hidden) should not have a value",
			).toBeUndefined();

			// Verify metadata - visible parameters should have metadata
			const param1Meta = node.getValueMetadata({
				commandClass: CommandClasses.Configuration,
				property: 1,
			});
			const param3Meta = node.getValueMetadata({
				commandClass: CommandClasses.Configuration,
				property: 3,
			});
			const param2Meta = node.getValueMetadata({
				commandClass: CommandClasses.Configuration,
				property: 2,
			});

			t.expect(param1Meta.label, "Parameter 1 should have metadata").toBe(
				"Visible Parameter",
			);
			t.expect(param3Meta.label, "Parameter 3 should have metadata").toBe(
				"Another Visible Parameter",
			);
			// Hidden parameter should not have metadata with a label
			t.expect(
				param2Meta.label,
				"Parameter 2 (hidden) should not have metadata with label",
			).toBeUndefined();
		},
	},
);
