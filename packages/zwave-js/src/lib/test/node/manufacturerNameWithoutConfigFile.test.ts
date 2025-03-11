import { CommandClasses } from "@zwave-js/core";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Nodes without a config file but known manufacturer ID have a manufacturer name",
	{
		nodeCapabilities: {
			manufacturerId: 0x0000,
			productType: 0xdead,
			productId: 0xbeef,

			commandClasses: [
				CommandClasses["Manufacturer Specific"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.manufacturer).toBe("Silicon Labs");
		},
	},
);
