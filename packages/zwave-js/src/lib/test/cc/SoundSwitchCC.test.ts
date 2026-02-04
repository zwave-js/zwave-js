import { SoundSwitchCCValues } from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { describe } from "vitest";
import { integrationTest } from "../integrationTestSuite.js";

describe("SoundSwitchCC", () => {
	integrationTest(
		"When playing a tone with known duration, toneId should auto-reset to 0 after duration elapses",
		{
			nodeCapabilities: {
				commandClasses: [
					ccCaps({
						ccId: CommandClasses["Sound Switch"],
						isSupported: true,
						version: 2,
						tones: [
							{ duration: 2, name: "Short Beep" },
							{ duration: 5, name: "Long Beep" },
						],
					}),
				],
			},

			testBody: async (t, driver, node, mockController, mockNode) => {
				const toneIdValue = SoundSwitchCCValues.toneId.endpoint(0);

				// Play tone 1 (2 second duration)
				await node.setValue(toneIdValue, 1);

				// Verify tone is playing (optimistically updated)
				t.expect(node.getValue(toneIdValue)).toBe(1);

				// Wait for duration to elapse (plus small buffer)
				await wait(2100);

				// Verify tone was auto-reset to 0
				t.expect(node.getValue(toneIdValue)).toBe(0);
			},
		},
	);

	integrationTest(
		"When playing a new tone before the current finishes, the old timer should be cancelled",
		{
			nodeCapabilities: {
				commandClasses: [
					ccCaps({
						ccId: CommandClasses["Sound Switch"],
						isSupported: true,
						version: 2,
						tones: [
							{ duration: 2, name: "Short Beep" },
							{ duration: 5, name: "Long Beep" },
						],
					}),
				],
			},

			testBody: async (t, driver, node, mockController, mockNode) => {
				const toneIdValue = SoundSwitchCCValues.toneId.endpoint(0);

				// Play tone 1 (2 second duration)
				await node.setValue(toneIdValue, 1);
				t.expect(node.getValue(toneIdValue)).toBe(1);

				// After 1 second, play tone 2 (5 second duration)
				// This should cancel tone 1's timer
				await wait(1000);
				await node.setValue(toneIdValue, 2);
				t.expect(node.getValue(toneIdValue)).toBe(2);

				// Wait past when tone 1 would have finished (2s from start)
				// but tone 2 should still be "playing"
				await wait(1500);
				t.expect(node.getValue(toneIdValue)).toBe(2);

				// Wait for tone 2 to finish (5 seconds from when it started + buffer)
				await wait(3600);

				// Should be reset to 0 after tone 2's duration
				t.expect(node.getValue(toneIdValue)).toBe(0);
			},
		},
	);
});
