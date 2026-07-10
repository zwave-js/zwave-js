import {
	CommandClasses,
	type ConfigurationMetadata,
	type ValueID,
} from "@zwave-js/core";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import type { ZWaveNode } from "../../node/Node.js";
import { integrationTest } from "../integrationTestSuite.js";

async function waitForValue(
	node: ZWaveNode,
	valueId: ValueID,
	expected: unknown,
	timeoutMs: number = 2000,
): Promise<void> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (node.getValue(valueId) === expected) return;
		await wait(50);
	}
	throw new Error(
		`Value ${JSON.stringify(valueId)} did not become ${
			String(expected)
		} within ${timeoutMs} ms`,
	);
}

integrationTest(
	"Config params and compat flags gated by param value conditions are re-evaluated when the value changes",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xfffe,
			productType: 0x0003,
			productId: 0x0003,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
					parameters: [
						{
							"#": 1,
							defaultValue: 0,
							valueSize: 1,
						},
						{
							"#": 2,
							defaultValue: 5,
							valueSize: 1,
						},
						{
							"#": 3,
							defaultValue: 7,
							valueSize: 1,
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
					"fixtures/paramValueConditions",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const CC = CommandClasses.Configuration;

			// The value of param 1 (0) was queried during the interview before
			// interpreting the other definitions, so the fallback variant applies
			const meta2Before = node.getValueMetadata({
				commandClass: CC,
				property: 2,
			}) as ConfigurationMetadata;
			t.expect(meta2Before.label).toBe("Basic option");
			t.expect(meta2Before.max).toBe(99);

			// ... the guarded param has no config metadata
			const meta3Before = node.getValueMetadata({
				commandClass: CC,
				property: 3,
			}) as ConfigurationMetadata;
			t.expect(meta3Before.label).toBeUndefined();

			// ... and the guarded compat flag is not active
			t.expect(node.deviceConfig?.compat).toBeUndefined();

			// Switch to Mode B
			await node.commandClasses.Configuration.set({
				parameter: 1,
				value: 1,
			});
			await node.commandClasses.Configuration.get(1);

			// The guarded definitions now apply without a re-interview
			const meta2After = node.getValueMetadata({
				commandClass: CC,
				property: 2,
			}) as ConfigurationMetadata;
			t.expect(meta2After.label).toBe("Advanced option");
			t.expect(meta2After.max).toBe(255);

			const meta3After = node.getValueMetadata({
				commandClass: CC,
				property: 3,
			}) as ConfigurationMetadata;
			t.expect(meta3After.label).toBe("Mode B only");

			t.expect(node.deviceConfig?.compat?.manualValueRefreshDelayMs).toBe(
				1000,
			);

			// The changes are applied dynamically and do not require a re-interview
			t.expect(node.hasDeviceConfigChanged()).toBeFalsy();

			// Switching back also restores the previous definitions
			await node.commandClasses.Configuration.set({
				parameter: 1,
				value: 0,
			});
			await node.commandClasses.Configuration.get(1);

			const meta2Restored = node.getValueMetadata({
				commandClass: CC,
				property: 2,
			}) as ConfigurationMetadata;
			t.expect(meta2Restored.label).toBe("Basic option");
			t.expect(node.deviceConfig?.compat).toBeUndefined();
		},
	},
);

integrationTest(
	"Newly appearing config params are queried automatically and can unlock chained definitions",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xfffe,
			productType: 0x0004,
			productId: 0x0004,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
					version: 2,
					parameters: [
						{
							"#": 1,
							defaultValue: 0,
							valueSize: 1,
						},
						{
							"#": 11,
							defaultValue: 3,
							valueSize: 1,
						},
						{
							"#": 12,
							defaultValue: 0,
							valueSize: 1,
						},
						{
							"#": 13,
							defaultValue: 9,
							valueSize: 1,
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
					"fixtures/paramValueConditionsV2",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const CC = CommandClasses.Configuration;

			// Param 11 is referenced by conditions, so its value was queried
			// during the interview, even though its definition does not apply in Mode A
			t.expect(node.getValue({ commandClass: CC, property: 11 })).toBe(3);
			const meta11Before = node.getValueMetadata({
				commandClass: CC,
				property: 11,
			}) as ConfigurationMetadata;
			t.expect(meta11Before.label).toBeUndefined();

			// ... and the matching variant of param 12 applies
			const meta12Before = node.getValueMetadata({
				commandClass: CC,
				property: 12,
			}) as ConfigurationMetadata;
			t.expect(meta12Before.label).toBe("Chained variant");

			// Param 13 is guarded but not referenced, so it is completely unknown in Mode A
			const meta13Before = node.getValueMetadata({
				commandClass: CC,
				property: 13,
			}) as ConfigurationMetadata;
			t.expect(meta13Before.label).toBeUndefined();
			t.expect(node.getValue({ commandClass: CC, property: 13 }))
				.toBeUndefined();

			// Switch to Mode B, which defines params 11 and 13
			await node.commandClasses.Configuration.set({
				parameter: 1,
				value: 1,
			});
			await node.commandClasses.Configuration.get(1);

			const meta11After = node.getValueMetadata({
				commandClass: CC,
				property: 11,
			}) as ConfigurationMetadata;
			t.expect(meta11After.label).toBe("Unlocked param");

			const meta13After = node.getValueMetadata({
				commandClass: CC,
				property: 13,
			}) as ConfigurationMetadata;
			t.expect(meta13After.label).toBe("Unreferenced guarded param");

			// The unknown value of the newly appearing param is queried automatically
			await waitForValue(
				node,
				{ commandClass: CC, property: 13 },
				9,
			);

			// Changing param 11 to a non-matching value flips param 12 to the fallback variant
			await node.commandClasses.Configuration.set({
				parameter: 11,
				value: 5,
			});
			await node.commandClasses.Configuration.get(11);

			const meta12Fallback = node.getValueMetadata({
				commandClass: CC,
				property: 12,
			}) as ConfigurationMetadata;
			t.expect(meta12Fallback.label).toBe("Default variant");
		},
	},
);

integrationTest(
	"Param value references in endpoint sections resolve against that endpoint's params",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xfffe,
			productType: 0x0005,
			productId: 0x0005,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
					parameters: [
						{
							"#": 1,
							defaultValue: 1,
							valueSize: 1,
						},
					],
				},
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
				CommandClasses["Multi Channel"],
			],
			endpoints: [
				{
					commandClasses: [
						{
							ccId: CommandClasses.Configuration,
							parameters: [
								{
									"#": 1,
									defaultValue: 0,
									valueSize: 1,
								},
								{
									"#": 2,
									defaultValue: 4,
									valueSize: 1,
								},
							],
						},
					],
				},
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/paramValueConditionsEndpoint",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const CC = CommandClasses.Configuration;

			// The root device's param 1 has value 1, but the condition on the
			// endpoint resolves against the endpoint's own param 1 (value 0)
			t.expect(node.getValue({ commandClass: CC, property: 1 })).toBe(1);
			t.expect(
				node.getValue({ commandClass: CC, endpoint: 1, property: 1 }),
			).toBe(0);

			const meta2Before = node.getValueMetadata({
				commandClass: CC,
				endpoint: 1,
				property: 2,
			}) as ConfigurationMetadata;
			t.expect(meta2Before.label).toBeUndefined();

			// Changing the endpoint's param 1 unlocks the guarded param
			const endpoint = node.getEndpoint(1)!;
			await endpoint.commandClasses.Configuration.set({
				parameter: 1,
				value: 1,
			});
			await endpoint.commandClasses.Configuration.get(1);

			const meta2After = node.getValueMetadata({
				commandClass: CC,
				endpoint: 1,
				property: 2,
			}) as ConfigurationMetadata;
			t.expect(meta2After.label).toBe("Endpoint extra");
		},
	},
);
