import {
	MultilevelSwitchCCReport,
	MultilevelSwitchCCValues,
	WindowCoveringCCValues,
	WindowCoveringCCSupportedReport,
	WindowCoveringParameter,
} from "@zwave-js/cc";
import { CommandClasses, UNKNOWN_STATE } from "@zwave-js/core";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"MultilevelSwitchCCReport should map to WindowCovering values when both CCs are supported (parameter 1)",
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
			// Simulate Window Covering CC having been interviewed with supported parameters
			// Parameter 1 = "Outbound Left" (odd, has position support)
			const supportedParamsReport = new WindowCoveringCCSupportedReport({
				nodeId: mockController.ownNodeId,
				supportedParameters: [WindowCoveringParameter["Outbound Left"]],
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(supportedParamsReport, {
					ackRequested: false,
				}),
			);
			await wait(100);

			// Initial values should be undefined (not yet known)
			const mlsCurrentValueId = MultilevelSwitchCCValues.currentValue.id;
			const mlsTargetValueId = MultilevelSwitchCCValues.targetValue.id;
			const wcCurrentValueId = WindowCoveringCCValues.currentValue(WindowCoveringParameter["Outbound Left"]).id;
			const wcTargetValueId = WindowCoveringCCValues.targetValue(WindowCoveringParameter["Outbound Left"]).id;

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
	"MultilevelSwitchCCReport should map to first odd parameter when multiple parameters are supported",
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
			// Simulate Window Covering CC having been interviewed with multiple supported parameters
			// Parameter 0 = "Outbound Left (no position)" (even, no position support)
			// Parameter 3 = "Outbound Right" (odd, has position support) - should be selected
			// Parameter 5 = "Inbound Left" (odd, has position support)
			const supportedParamsReport = new WindowCoveringCCSupportedReport({
				nodeId: mockController.ownNodeId,
				supportedParameters: [
					WindowCoveringParameter["Outbound Left (no position)"],
					WindowCoveringParameter["Outbound Right"],
					WindowCoveringParameter["Inbound Left"],
				],
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(supportedParamsReport, {
					ackRequested: false,
				}),
			);
			await wait(100);

			// Initial values should be undefined (not yet known)
			const mlsCurrentValueId = MultilevelSwitchCCValues.currentValue.id;
			const mlsTargetValueId = MultilevelSwitchCCValues.targetValue.id;
			// Should map to parameter 3 (first odd parameter)
			const wcCurrentValueId = WindowCoveringCCValues.currentValue(WindowCoveringParameter["Outbound Right"]).id;
			const wcTargetValueId = WindowCoveringCCValues.targetValue(WindowCoveringParameter["Outbound Right"]).id;

			t.expect(node.getValue(mlsCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(mlsTargetValueId)).toBeUndefined();
			t.expect(node.getValue(wcCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(wcTargetValueId)).toBeUndefined();

			// Send a MultilevelSwitchCCReport
			const cc = new MultilevelSwitchCCReport({
				nodeId: mockController.ownNodeId,
				currentValue: 45,
				targetValue: 55,
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

			// Window Covering values should be set to parameter 3 (first odd parameter)
			t.expect(node.getValue(wcCurrentValueId)).toBe(45);
			t.expect(node.getValue(wcTargetValueId)).toBe(55);
		},
	},
);

integrationTest(
	"MultilevelSwitchCCReport should map to first parameter when only even parameters are supported",
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
			// Simulate Window Covering CC having been interviewed with only even parameters
			// Parameter 4 = "Inbound Left (no position)" (even, no position support) - should be selected as fallback
			const supportedParamsReport = new WindowCoveringCCSupportedReport({
				nodeId: mockController.ownNodeId,
				supportedParameters: [
					WindowCoveringParameter["Inbound Left (no position)"],
				],
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(supportedParamsReport, {
					ackRequested: false,
				}),
			);
			await wait(100);

			// Initial values should be undefined (not yet known)
			const mlsCurrentValueId = MultilevelSwitchCCValues.currentValue.id;
			const mlsTargetValueId = MultilevelSwitchCCValues.targetValue.id;
			// Should map to parameter 4 (first parameter since no odd ones exist)
			const wcCurrentValueId = WindowCoveringCCValues.currentValue(WindowCoveringParameter["Inbound Left (no position)"]).id;
			const wcTargetValueId = WindowCoveringCCValues.targetValue(WindowCoveringParameter["Inbound Left (no position)"]).id;

			t.expect(node.getValue(mlsCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(mlsTargetValueId)).toBeUndefined();
			t.expect(node.getValue(wcCurrentValueId)).toBeUndefined();
			t.expect(node.getValue(wcTargetValueId)).toBeUndefined();

			// Send a MultilevelSwitchCCReport
			const cc = new MultilevelSwitchCCReport({
				nodeId: mockController.ownNodeId,
				currentValue: 30,
				targetValue: 40,
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

			// Window Covering values should be set to parameter 4 (first parameter)
			t.expect(node.getValue(wcCurrentValueId)).toBe(30);
			t.expect(node.getValue(wcTargetValueId)).toBe(40);
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