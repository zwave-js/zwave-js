import {
	BasicCCValues,
	ZWaveProtocolCCNodeInformationFrame,
	ZWaveProtocolCCRequestNodeInformationFrame,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Basic CC force-added via compat flag should be interviewed even when maySupportBasicCC returns false",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			// Notification Sensor - device class that has maySupportBasicCC: false
			genericDeviceClass: 0x07,
			specificDeviceClass: 0x01,
			commandClasses: [
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
				CommandClasses.Basic,
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/forceAddBasicCC",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Verify that Basic CC is supported (not just controlled)
			t.expect(node.supportsCC(CommandClasses.Basic)).toBe(true);

			// Verify that Basic CC values are exposed
			const valueIDs = node.getDefinedValueIDs();
			t.expect(
				valueIDs.some((v) => BasicCCValues.currentValue.is(v)),
				"Basic CC currentValue should be exposed when force-added via compat",
			).toBe(true);
		},
	},
);
