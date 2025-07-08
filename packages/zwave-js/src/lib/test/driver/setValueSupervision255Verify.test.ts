import {
	MultilevelSwitchCCGet,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCValues,
} from "@zwave-js/cc";
import { CommandClasses, type MaybeUnknown } from "@zwave-js/core";
import type { MockNodeBehavior } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"successful supervised setValue(255): expect verify GET",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses["Multilevel Switch"],
				CommandClasses.Supervision,
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			{
				let call = 0;
				const responses: [
					target: number,
					current: MaybeUnknown<number>,
				][] = [
					// during interview
					[20, 20],
					// change verification (`verifyChanges`)
					[50, 50],
				];
				const respondToMultilevelSwitchGet: MockNodeBehavior = {
					handleCC(controller, self, receivedCC) {
						if (receivedCC instanceof MultilevelSwitchCCGet) {
							const [targetValue, currentValue] = responses[call];
							const cc = new MultilevelSwitchCCReport({
								nodeId: controller.ownNodeId,
								targetValue,
								currentValue,
							});

							call += 1;

							return { action: "sendCC", cc };
						}
					},
				};
				mockNode.defineBehavior(respondToMultilevelSwitchGet);
			}
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			{
				const currentValue = node.getValue(
					MultilevelSwitchCCValues.currentValue.id,
				);
				t.expect(currentValue, "should be initial value").toBe(20);
			}

			await node.setValue(MultilevelSwitchCCValues.targetValue.id, 255);

			{
				const currentValue = node.getValue(
					MultilevelSwitchCCValues.currentValue.id,
				);
				t.expect(currentValue, "should be updated value").toBe(50);
			}
		},
	},
);
