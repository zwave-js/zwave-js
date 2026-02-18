import { CommandClasses, type ConfigurationMetadata } from "@zwave-js/core";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

// The cache was populated with the "before" device config:
//   Param 1: label="Param to be updated", min=0, max=100, default=50, unit="seconds"
//   Param 2: label="Param to be removed" (visible)
//   Param 3: label="Param to be hidden" (visible)
//   Param 4: label="Param staying visible"
//   Param 5: hidden=true
//   Param 6: not in config (device-reported only)
//
// The "after" device config (loaded at runtime) changes:
//   Param 1: label="Updated label", description="Updated description", min=10, max=200, default=75, unit="minutes"
//   Param 2: removed from config entirely
//   Param 3: now hidden=true
//   Param 4: unchanged
//   Param 5: now visible (hidden removed), label="Previously hidden param"
//   Param 6: newly added, label="Newly added param", min=0, max=99, default=42

integrationTest(
	"Cached config parameter metadata (v3 hash) is dynamically updated from device config without re-interview",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xfffe,
			productType: 0x0002,
			productId: 0x0002,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
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
							defaultValue: 0,
							valueSize: 1,
						},
						{
							"#": 4,
							defaultValue: 100,
							valueSize: 2,
						},
						{
							"#": 5,
							defaultValue: 5,
							valueSize: 1,
						},
						{
							"#": 6,
							defaultValue: 42,
							valueSize: 1,
						},
					],
				},
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
			],
		},

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/dynamicConfigMetadata",
		),

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/dynamicConfigMetadata",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const CC = CommandClasses.Configuration;

			// Despite all the param changes, the device config should not be
			// considered changed (only compat/associations/proprietary matter)
			t.expect(
				node.hasDeviceConfigChanged(),
				"device config should not be considered changed",
			).toBeFalsy();

			// --- Param 1: metadata updated ---
			const meta1 = node.getValueMetadata({
				commandClass: CC,
				property: 1,
			}) as ConfigurationMetadata;
			t.expect(meta1.label).toBe("Updated label");
			t.expect(meta1.description).toBe("Updated description");
			t.expect(meta1.min).toBe(10);
			t.expect(meta1.max).toBe(200);
			t.expect(meta1.default).toBe(75);
			t.expect(meta1.unit).toBe("minutes");
			// Value should still be available (was queried during original interview)
			t.expect(node.getValue({
				commandClass: CC,
				property: 1,
			})).toBe(50);

			// --- Param 2: removed from config ---
			const meta2 = node.getValueMetadata({
				commandClass: CC,
				property: 2,
			}) as ConfigurationMetadata;
			// Metadata should be gone (label is undefined for the default metadata)
			t.expect(
				meta2.label,
				"removed param should have no label",
			).toBeUndefined();
			// Value should also be gone
			t.expect(
				node.getValue({ commandClass: CC, property: 2 }),
				"removed param should have no value",
			).toBeUndefined();

			// --- Param 3: now hidden ---
			const meta3 = node.getValueMetadata({
				commandClass: CC,
				property: 3,
			}) as ConfigurationMetadata;
			t.expect(
				meta3.label,
				"hidden param should have no label",
			).toBeUndefined();
			t.expect(
				node.getValue({ commandClass: CC, property: 3 }),
				"hidden param should have no value",
			).toBeUndefined();

			// --- Param 4: unchanged ---
			const meta4 = node.getValueMetadata({
				commandClass: CC,
				property: 4,
			}) as ConfigurationMetadata;
			t.expect(meta4.label).toBe("Param staying visible");
			t.expect(meta4.max).toBe(1000);
			t.expect(node.getValue({
				commandClass: CC,
				property: 4,
			})).toBe(100);

			// --- Param 5: was hidden, now visible ---
			const meta5 = node.getValueMetadata({
				commandClass: CC,
				property: 5,
			}) as ConfigurationMetadata;
			t.expect(meta5.label).toBe("Previously hidden param");
			t.expect(meta5.min).toBe(0);
			t.expect(meta5.max).toBe(10);
			// Value is undefined since the param was hidden during original interview
			// and no value was queried for it
			t.expect(
				node.getValue({ commandClass: CC, property: 5 }),
				"unhidden param should have no value yet",
			).toBeUndefined();

			// --- Param 6: newly added in config (was device-reported only) ---
			const meta6 = node.getValueMetadata({
				commandClass: CC,
				property: 6,
			}) as ConfigurationMetadata;
			t.expect(meta6.label).toBe("Newly added param");
			t.expect(meta6.min).toBe(0);
			t.expect(meta6.max).toBe(99);
			t.expect(meta6.default).toBe(42);
			// This param was device-reported during original interview, so
			// valueSize and format should be preserved from the device report
			t.expect(meta6.valueSize).toBe(1);
		},
	},
);

// Same scenario as above, but starting from a v4 cache.
// This tests pure dynamic metadata application without cross-version hash upgrade.

integrationTest(
	"Cached config parameter metadata (v4 hash) is dynamically updated without re-interview",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xfffe,
			productType: 0x0002,
			productId: 0x0002,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
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
							defaultValue: 0,
							valueSize: 1,
						},
						{
							"#": 4,
							defaultValue: 100,
							valueSize: 2,
						},
						{
							"#": 5,
							defaultValue: 5,
							valueSize: 1,
						},
						{
							"#": 6,
							defaultValue: 42,
							valueSize: 1,
						},
					],
				},
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
			],
		},

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/dynamicConfigMetadataV4",
		),

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/dynamicConfigMetadataV4",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const CC = CommandClasses.Configuration;

			// With a v4 hash, param-only changes should not flag re-interview
			t.expect(
				node.hasDeviceConfigChanged(),
				"device config should not be considered changed",
			).toBeFalsy();

			// --- Param 1: metadata updated ---
			const meta1 = node.getValueMetadata({
				commandClass: CC,
				property: 1,
			}) as ConfigurationMetadata;
			t.expect(meta1.label).toBe("Updated label");
			t.expect(meta1.description).toBe("Updated description");
			t.expect(meta1.min).toBe(10);
			t.expect(meta1.max).toBe(200);
			t.expect(meta1.default).toBe(75);
			t.expect(meta1.unit).toBe("minutes");
			// Value should still be available from the original interview
			t.expect(node.getValue({
				commandClass: CC,
				property: 1,
			})).toBe(50);

			// --- Param 2: removed from config ---
			const meta2 = node.getValueMetadata({
				commandClass: CC,
				property: 2,
			}) as ConfigurationMetadata;
			t.expect(meta2.label).toBeUndefined();
			t.expect(
				node.getValue({ commandClass: CC, property: 2 }),
			).toBeUndefined();

			// --- Param 3: now hidden ---
			const meta3 = node.getValueMetadata({
				commandClass: CC,
				property: 3,
			}) as ConfigurationMetadata;
			t.expect(meta3.label).toBeUndefined();
			t.expect(
				node.getValue({ commandClass: CC, property: 3 }),
			).toBeUndefined();

			// --- Param 4: unchanged ---
			const meta4 = node.getValueMetadata({
				commandClass: CC,
				property: 4,
			}) as ConfigurationMetadata;
			t.expect(meta4.label).toBe("Param staying visible");
			t.expect(meta4.max).toBe(1000);
			t.expect(node.getValue({
				commandClass: CC,
				property: 4,
			})).toBe(100);

			// --- Param 5: was hidden, now visible ---
			const meta5 = node.getValueMetadata({
				commandClass: CC,
				property: 5,
			}) as ConfigurationMetadata;
			t.expect(meta5.label).toBe("Previously hidden param");
			t.expect(meta5.max).toBe(10);

			// --- Param 6: newly added in config (was device-reported only) ---
			const meta6 = node.getValueMetadata({
				commandClass: CC,
				property: 6,
			}) as ConfigurationMetadata;
			t.expect(meta6.label).toBe("Newly added param");
			t.expect(meta6.max).toBe(99);
			t.expect(meta6.default).toBe(42);
			// valueSize preserved from device report
			t.expect(meta6.valueSize).toBe(1);
		},
	},
);
