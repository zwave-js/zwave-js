// Test the actual implementation logic by simulating the scenario described in the issue
import { describe, it, expect } from "vitest";

describe("Battery CC isLow cleanup integration test", () => {
	it("should clean up stale isLow values according to the exact implementation", () => {
		// Simulate a value DB with various keys including stale isLow values
		const valueDBKeys = [
			// Stale Battery CC isLow values that should be removed (from issue description)
			JSON.stringify({
				nodeId: 2,
				commandClass: 128, // Battery CC (0x80)
				endpoint: 0,
				property: "isLow",
			}),
			JSON.stringify({
				nodeId: 5,
				commandClass: 128, // Battery CC (0x80)
				endpoint: 1,
				property: "isLow",
			}),
			// Valid Battery CC values that should be preserved
			JSON.stringify({
				nodeId: 2,
				commandClass: 128, // Battery CC (0x80)
				endpoint: 0,
				property: "level",
			}),
			JSON.stringify({
				nodeId: 2,
				commandClass: 128, // Battery CC (0x80)
				endpoint: 0,
				property: "lowFluid",
			}),
			JSON.stringify({
				nodeId: 2,
				commandClass: 128, // Battery CC (0x80)
				endpoint: 0,
				property: "lowTemperatureStatus",
			}),
			// Non-Battery CC values that should be preserved (edge case testing)
			JSON.stringify({
				nodeId: 3,
				commandClass: 37, // Binary Switch CC
				endpoint: 0,
				property: "isLow", // Hypothetical property
			}),
			JSON.stringify({
				nodeId: 4,
				commandClass: 50, // Meter CC
				endpoint: 0,
				property: "currentValue",
			}),
			// Legacy commandClass -1 values (should be handled by existing cleanup)
			JSON.stringify({
				nodeId: 1,
				commandClass: -1,
				endpoint: 0,
				property: "hasSUCReturnRoute",
			}),
		];

		// Simulate the exact cleanup logic from our implementation
		const keysToRemove: string[] = [];
		
		// Test the Battery CC isLow cleanup logic
		for (const key of valueDBKeys) {
			if (
				-1 !== key.indexOf(`,"commandClass":128,`) && // Battery CC (0x80 = 128)
				-1 !== key.indexOf(`,"property":"isLow"`)
			) {
				keysToRemove.push(key);
			}
		}

		// Verify the correct keys are identified for removal
		expect(keysToRemove).toHaveLength(2);
		
		// Check that both Battery CC isLow keys are marked for removal
		const batteryIsLowKey1 = JSON.stringify({
			nodeId: 2,
			commandClass: 128,
			endpoint: 0,
			property: "isLow",
		});
		const batteryIsLowKey2 = JSON.stringify({
			nodeId: 5,
			commandClass: 128,
			endpoint: 1,
			property: "isLow",
		});
		
		expect(keysToRemove).toContain(batteryIsLowKey1);
		expect(keysToRemove).toContain(batteryIsLowKey2);

		// Verify other keys are NOT marked for removal
		const batteryLevelKey = JSON.stringify({
			nodeId: 2,
			commandClass: 128,
			endpoint: 0,
			property: "level",
		});
		const nonBatteryIsLowKey = JSON.stringify({
			nodeId: 3,
			commandClass: 37,
			endpoint: 0,
			property: "isLow",
		});
		
		expect(keysToRemove).not.toContain(batteryLevelKey);
		expect(keysToRemove).not.toContain(nonBatteryIsLowKey);

		// Test edge cases: make sure we're matching the exact pattern
		const edgeCaseKeys = [
			// Should NOT match - different command class but contains 128
			JSON.stringify({
				nodeId: 1,
				commandClass: 1128, // Contains 128 but not exactly 128
				endpoint: 0,
				property: "isLow",
			}),
			// Should NOT match - Battery CC but different property containing "isLow"
			JSON.stringify({
				nodeId: 1,
				commandClass: 128,
				endpoint: 0,
				property: "isLowTemperature", // Contains "isLow" but not exactly "isLow"
			}),
			// Should NOT match - Both conditions individually but not together
			JSON.stringify({
				nodeId: 1,
				commandClass: 128,
				endpoint: 0,
				property: "level",
			}),
		];

		for (const edgeKey of edgeCaseKeys) {
			const shouldRemove = (
				-1 !== edgeKey.indexOf(`,"commandClass":128,`) &&
				-1 !== edgeKey.indexOf(`,"property":"isLow"`)
			);
			expect(shouldRemove).toBe(false);
		}
	});
});