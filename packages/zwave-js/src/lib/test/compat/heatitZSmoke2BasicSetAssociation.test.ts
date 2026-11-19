import {
	AssociationCheckResult,
	AssociationGroupInfoCCValues,
	BasicCommand,
} from "@zwave-js/cc";
import { BasicCCGet } from "@zwave-js/cc/BasicCC";
import { CommandClasses } from "@zwave-js/core";
import { type MockNodeBehavior } from "@zwave-js/testing";

import { integrationTest } from "../integrationTestSuiteMulti.js";

const zSmoke2 = {
	manufacturerId: 0x019b,
	productType: 0x0003,
	// Notification Sensor
	genericDeviceClass: 0x07,
	specificDeviceClass: 0x01,
	commandClasses: [
		CommandClasses["Manufacturer Specific"],
		CommandClasses.Version,
	],
};

integrationTest(
	"Heatit Z-Smoke2 detectors can be associated with each other via Basic Set",
	{
		nodeCapabilities: [
			{ id: 2, capabilities: { ...zSmoke2, productId: 0x0027 } },
			{ id: 3, capabilities: { ...zSmoke2, productId: 0x0027 } },
			// Same device without a config file
			{ id: 4, capabilities: { ...zSmoke2, productId: 0xfffe } },
		],

		async customSetup(driver, mockController, mockNodes) {
			// Cover detectors that do not answer Basic Get
			const ignoreBasicGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						return { action: "stop" };
					}
				},
			};
			for (const mockNode of mockNodes) {
				mockNode.defineBehavior(ignoreBasicGet);
			}
		},

		async testBody(t, driver, nodes, mockController, mockNodes) {
			const [source, target, unconfiguredTarget] = nodes;

			// Group 2 "Smoke Basic Set" as reported by AGI
			source.addCC(CommandClasses.Association, {
				isSupported: true,
				version: 2,
			});
			source.addCC(CommandClasses["Multi Channel Association"], {
				isSupported: true,
				version: 3,
			});
			source.addCC(CommandClasses["Association Group Information"], {
				isSupported: true,
				version: 1,
			});
			source.valueDB.setValue(
				AssociationGroupInfoCCValues.commands(2).endpoint(0),
				new Map([[CommandClasses.Basic, [BasicCommand.Set]]]),
			);

			t.expect(target.supportsCC(CommandClasses.Basic)).toBe(true);
			for (const endpoint of [undefined, 0]) {
				t.expect(
					driver.controller.checkAssociation(
						{ nodeId: source.id },
						2,
						{ nodeId: target.id, endpoint },
					),
				).toBe(AssociationCheckResult.OK);
			}

			t.expect(unconfiguredTarget.supportsCC(CommandClasses.Basic)).toBe(
				false,
			);
			t.expect(
				driver.controller.checkAssociation({ nodeId: source.id }, 2, {
					nodeId: unconfiguredTarget.id,
				}),
			).toBe(AssociationCheckResult.Forbidden_NoSupportedCCs);
		},
	},
);
