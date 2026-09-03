import { CommandClasses } from "@zwave-js/core";
import { ccCaps } from "@zwave-js/testing";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("treatAsCover forces cover treatment for MLS endpoints", {
	nodeCapabilities: {
		manufacturerId: 0xdead,
		productType: 0xbeef,
		productId: 0xcafe,

		// Multilevel Power Switch, i.e. a dimmer by device class
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x01,
		commandClasses: [
			CommandClasses.Version,
			CommandClasses["Manufacturer Specific"],
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 4,
				defaultValue: 0,
			}),
		],
	},

	additionalDriverOptions: {
		storage: {
			deviceConfigPriorityDir: path.join(
				__dirname,
				"fixtures/treatAsCover",
			),
		},
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		t.expect(node.covers).toBeDefined();
	},
});
