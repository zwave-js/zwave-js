import {
	MultilevelSwitchCCReport,
	MultilevelSwitchCCValues,
	WindowCoveringCCValues,
} from "@zwave-js/cc";
import { CommandClasses, UNKNOWN_STATE } from "@zwave-js/core";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"MultilevelSwitchCCReport should map to WindowCovering values when both CCs are supported",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Multilevel Switch"],
					isSupported: true,
					version: 4,
				},
				{
					ccId: CommandClasses["Window Covering"],
					isSupported: true,
					version: 1,
				},
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Initial values should be undefined (not yet known)
			const mlsCurrentValueId = MultilevelSwitchCCValues.currentValue.id;
			const mlsTargetValueId = MultilevelSwitchCCValues.targetValue.id;
			const wcCurrentValueId = WindowCoveringCCValues.currentValue(1).id; // Parameter 1 = "Outbound Left"
			const wcTargetValueId = WindowCoveringCCValues.targetValue(1).id;

			t.expect(node.getValue(mlsCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(mlsTargetValueId)).toBeUndefined();
			t.expect(node.getValue(wcCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(wcTargetValueId)).toBeUndefined();

			// Send a MultilevelSwitchCCReport
			const cc = new MultilevelSwitchCCReport({
				nodeId: mockController.ownNodeId,
				currentValue: 75,
				targetValue: 80,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);

			// wait a bit for the change to propagate
			await wait(100);

			// MultilevelSwitch values should NOT be set (mapped to Window Covering instead)
			t.expect(node.getValue(mlsCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(mlsTargetValueId)).toBeUndefined();

			// Window Covering values should be set
			t.expect(node.getValue(wcCurrentValueId)).toBe(75);
			t.expect(node.getValue(wcTargetValueId)).toBe(80);
		},
	},
);

integrationTest(
	"MultilevelSwitchCCReport should persist normally when WindowCovering is NOT supported",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Multilevel Switch"],
					isSupported: true,
					version: 4,
				},
				// No Window Covering CC support
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Get initial values (might be set during interview)
			const mlsCurrentValueId = MultilevelSwitchCCValues.currentValue.id;
			const mlsTargetValueId = MultilevelSwitchCCValues.targetValue.id;

			const initialCurrentValue = node.getValue(mlsCurrentValueId);
			const initialTargetValue = node.getValue(mlsTargetValueId);

			// Send a MultilevelSwitchCCReport
			const cc = new MultilevelSwitchCCReport({
				nodeId: mockController.ownNodeId,
				currentValue: 60,
				targetValue: 70,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);

			// wait a bit for the change to propagate
			await wait(100);

			// MultilevelSwitch values should be set normally
			t.expect(node.getValue(mlsCurrentValueId)).toBe(60);
			t.expect(node.getValue(mlsTargetValueId)).toBe(70);
		},
	},
);