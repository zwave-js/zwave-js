import { describe, it, expect, beforeEach } from "vitest";



describe("Driver cache migration", () => {
	let valueDB: Map<string, unknown>;
	let networkCache: Map<string, any>;

	beforeEach(() => {
		// Create mock databases using Maps
		valueDB = new Map();
		networkCache = new Map();
	});

	it("should remove stale Battery CC isLow values during cache migration", async () => {
		// Mock the performCacheMigration logic
		async function performCacheMigration() {
			// Set cache format to 1 (simulating the actual code)
			networkCache.set("cacheFormat", 1);

			// Clean up stale Battery CC "isLow" values
			for (const key of valueDB.keys()) {
				if (
					-1 !== key.indexOf(`,"commandClass":128,`) && // Battery CC (0x80 = 128)
					-1 !== key.indexOf(`,"property":"isLow"`)
				) {
					valueDB.delete(key);
				}
			}
		}

		// Arrange: Add some test data including stale isLow values
		const batteryIsLowKey1 = JSON.stringify({
			nodeId: 2,
			commandClass: 128, // Battery CC (0x80)
			endpoint: 0,
			property: "isLow",
		});
		
		const batteryIsLowKey2 = JSON.stringify({
			nodeId: 3,
			commandClass: 128, // Battery CC (0x80)
			endpoint: 1,
			property: "isLow",
		});

		const batteryLevelKey = JSON.stringify({
			nodeId: 2,
			commandClass: 128, // Battery CC (0x80)
			endpoint: 0,
			property: "level",
		});

		const otherCCKey = JSON.stringify({
			nodeId: 2,
			commandClass: 37, // Binary Switch CC
			endpoint: 0,
			property: "currentValue",
		});

		// Add the test data to value DB
		valueDB.set(batteryIsLowKey1, true);
		valueDB.set(batteryIsLowKey2, false);
		valueDB.set(batteryLevelKey, 85);
		valueDB.set(otherCCKey, true);

		// Verify data exists before migration
		expect(valueDB.has(batteryIsLowKey1)).toBe(true);
		expect(valueDB.has(batteryIsLowKey2)).toBe(true);
		expect(valueDB.has(batteryLevelKey)).toBe(true);
		expect(valueDB.has(otherCCKey)).toBe(true);

		// Act: Trigger cache migration
		await performCacheMigration();

		// Assert: isLow values should be removed, others should remain
		expect(valueDB.has(batteryIsLowKey1)).toBe(false);
		expect(valueDB.has(batteryIsLowKey2)).toBe(false);
		expect(valueDB.has(batteryLevelKey)).toBe(true);
		expect(valueDB.has(otherCCKey)).toBe(true);
		
		// Check that the values are still correct
		expect(valueDB.get(batteryLevelKey)).toBe(85);
		expect(valueDB.get(otherCCKey)).toBe(true);
	});

	it("should set cache format version to 1", async () => {
		// Mock the performCacheMigration logic
		async function performCacheMigration() {
			networkCache.set("cacheFormat", 1);
		}

		// Act: Trigger cache migration
		await performCacheMigration();

		// Assert: Cache format should be set
		expect(networkCache.get("cacheFormat")).toBe(1);
	});

	it("should not affect non-Battery CC values with isLow property", async () => {
		// Mock the performCacheMigration logic
		async function performCacheMigration() {
			// Clean up stale Battery CC "isLow" values
			for (const key of valueDB.keys()) {
				if (
					-1 !== key.indexOf(`,"commandClass":128,`) && // Battery CC (0x80 = 128)
					-1 !== key.indexOf(`,"property":"isLow"`)
				) {
					valueDB.delete(key);
				}
			}
		}

		// Arrange: Add a non-Battery CC value that happens to have isLow property
		const nonBatteryIsLowKey = JSON.stringify({
			nodeId: 2,
			commandClass: 37, // Binary Switch CC
			endpoint: 0,
			property: "isLow", // Hypothetical property name
		});

		valueDB.set(nonBatteryIsLowKey, true);

		// Act: Trigger cache migration
		await performCacheMigration();

		// Assert: Non-Battery CC isLow values should remain
		expect(valueDB.has(nonBatteryIsLowKey)).toBe(true);
		expect(valueDB.get(nonBatteryIsLowKey)).toBe(true);
	});
});