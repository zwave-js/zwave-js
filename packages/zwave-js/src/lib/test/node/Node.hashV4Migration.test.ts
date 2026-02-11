import { CommandClasses } from "@zwave-js/core";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"A v3 device config hash is correctly migrated to v4 without requiring re-interview",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xfffe,
			productType: 0x0001,
			productId: 0x0001,

			commandClasses: [
				{
					ccId: CommandClasses.Configuration,
					parameters: [
						{
							"#": 1,
							defaultValue: 50,
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
			"fixtures/hashV4Migration",
		),

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/hashV4Migration",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// The cache was provisioned with a v3 hash. After loading with
			// the new code (maxHashVersion = 4), the config should not be
			// considered changed since only the hash format differs.
			t.expect(
				node.hasDeviceConfigChanged(),
				"device config should not be considered changed",
			).toBeFalsy();
		},
	},
);
