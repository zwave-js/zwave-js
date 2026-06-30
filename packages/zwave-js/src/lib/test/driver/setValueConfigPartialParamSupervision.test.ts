import {
	ConfigurationCCSet,
	ConfigurationCCValues,
	SupervisionCommand,
} from "@zwave-js/cc";
import {
	BasicDeviceClass,
	CommandClasses,
	ConfigValueFormat,
} from "@zwave-js/core";
import { type MockNodeBehavior, ccCaps } from "@zwave-js/testing";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"setValue with supervised partial config parameter on a slow device class updates cached value",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			basicDeviceClass: BasicDeviceClass["End Node"],
			genericDeviceClass: 0x11, // Multilevel Switch
			specificDeviceClass: 0x06, // Motor Control Class B

			commandClasses: [
				CommandClasses.Supervision,
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
				ccCaps({
					ccId: CommandClasses.Configuration,
					isSupported: true,
					version: 1,
					parameters: [
						{
							"#": 1,
							valueSize: 1,
							name: "Partial Params",
							format: ConfigValueFormat.UnsignedInteger,
							minValue: 0,
							maxValue: 255,
							defaultValue: 0,
						},
					],
				}),
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/configurationPartialParamSupervision",
				),
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			// Track the current value for parameter 1
			let paramValue = 0;

			const respondToConfigSet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC.isEncapsulatedWith(
							CommandClasses.Supervision,
							SupervisionCommand.Get,
						)
						&& receivedCC instanceof ConfigurationCCSet
					) {
						paramValue = receivedCC.value!;
					}
				},
			};
			mockNode.defineBehavior(respondToConfigSet);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Read the initial value for all partial params (should be 0)
			const bit0Id = ConfigurationCCValues.paramInformation(1, 0x01).id;
			const bit1Id = ConfigurationCCValues.paramInformation(1, 0x02).id;
			const bit2Id = ConfigurationCCValues.paramInformation(1, 0x04).id;
			const bit3Id = ConfigurationCCValues.paramInformation(1, 0x08).id;

			t.expect(node.getValue(bit0Id)).toBe(0);
			t.expect(node.getValue(bit1Id)).toBe(0);
			t.expect(node.getValue(bit2Id)).toBe(0);
			t.expect(node.getValue(bit3Id)).toBe(0);

			// Set bit 2 to 1 via supervised command
			await node.setValue(bit2Id, 1);

			// The value should be updated in the cache
			t.expect(
				node.getValue(bit2Id),
				"Partial param bit 2 should be updated to 1",
			).toBe(1);

			// Other bits should remain unchanged
			t.expect(
				node.getValue(bit0Id),
				"Partial param bit 0 should remain 0",
			).toBe(0);
			t.expect(
				node.getValue(bit1Id),
				"Partial param bit 1 should remain 0",
			).toBe(0);
			t.expect(
				node.getValue(bit3Id),
				"Partial param bit 3 should remain 0",
			).toBe(0);
		},
	},
);
