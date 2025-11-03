import { BatteryCCReport, BatteryCCValues } from "@zwave-js/cc/BatteryCC";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { vi } from "vitest";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Battery CC Reports with invalid levels are discarded",
	{
		// debug: true,
		provisioningDirectory: path.join(__dirname, "fixtures/batteryCC"),

		testBody: async (t, driver, node, mockController, mockNode) => {
			const batteryLevelValueID = BatteryCCValues.level.id;
			// Set an initial battery level
			node.valueDB.setValue(batteryLevelValueID, 50);

			const spy = vi.fn();
			node.on("value updated", spy);

			// Send a Battery CC Report with invalid level 254
			const cc = new BatteryCCReport({
				nodeId: mockController.ownNodeId,
				level: 254,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);

			// Wait a bit for the value to be processed
			await wait(100);

			// The cached value should not have changed
			t.expect(node.getValue(batteryLevelValueID)).toBe(50);

			t.expect(spy).not.toHaveBeenCalled();
		},
	},
);
