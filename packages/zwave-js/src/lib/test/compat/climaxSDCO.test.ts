import {
	BasicCCValues,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Climax SDCO-1-ZW with Basic CC force-added via compat should support Basic CC despite being a Notification Sensor",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0x018e,
			productType: 0x0003,
			productId: 0x001a,

			// Notification Sensor - device class that has maySupportBasicCC: false
			genericDeviceClass: 0x07,
			specificDeviceClass: 0x01,
			commandClasses: [
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
				CommandClasses.Basic,
				CommandClasses.Association,
				CommandClasses["Association Group Information"],
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/climaxSDCO",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Verify that Basic CC is supported (not just controlled)
			t.expect(
				node.supportsCC(CommandClasses.Basic),
				"Basic CC should be supported when force-added via compat flag",
			).toBe(true);

			// Verify that Basic CC values are exposed
			const valueIDs = node.getDefinedValueIDs();
			t.expect(
				valueIDs.some((v) => BasicCCValues.currentValue.is(v)),
				"Basic CC currentValue should be exposed when force-added via compat",
			).toBe(true);
		},
	},
);
