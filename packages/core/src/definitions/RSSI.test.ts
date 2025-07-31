import { test, expect } from "vitest";
import { averageRSSI, RssiError } from "./RSSI.js";

test("averageRSSI should calculate exponential moving average correctly", () => {
	// First measurement should return the RSSI value itself
	const first = averageRSSI(undefined, -50, 0.9);
	expect(first).toBe(-50);

	// Second measurement should calculate moving average
	const second = averageRSSI(first, -60, 0.9);
	// Expected: -50 * 0.9 + (-60) * 0.1 = -45 + (-6) = -51
	expect(second).toBe(-51);

	// Third measurement should use the previous average
	const third = averageRSSI(second, -40, 0.9);
	// Expected: -51 * 0.9 + (-40) * 0.1 = -45.9 + (-4) = -49.9
	expect(third).toBe(-49.9);
});

test("averageRSSI should handle RSSI errors correctly", () => {
	// Test with NotAvailable error - should return current accumulator
	expect(averageRSSI(-50, RssiError.NotAvailable, 0.9)).toBe(-50);
	expect(averageRSSI(undefined, RssiError.NotAvailable, 0.9)).toBe(0);

	// Test with ReceiverSaturated error - should treat as 0 dBm
	expect(averageRSSI(-50, RssiError.ReceiverSaturated, 0.9)).toBe(-50 * 0.9 + 0 * 0.1);

	// Test with NoSignalDetected error - should treat as -128 dBm
	expect(averageRSSI(-50, RssiError.NoSignalDetected, 0.9)).toBe(-50 * 0.9 + (-128) * 0.1);
});

test("averageRSSI should work with different weights", () => {
	// With weight 0.5, both values should have equal influence
	const result = averageRSSI(-40, -60, 0.5);
	// Expected: -40 * 0.5 + (-60) * 0.5 = -20 + (-30) = -50
	expect(result).toBe(-50);

	// With weight 0.1, new value should have more influence
	const result2 = averageRSSI(-40, -60, 0.1);
	// Expected: -40 * 0.1 + (-60) * 0.9 = -4 + (-54) = -58
	expect(result2).toBe(-58);
});

test("averageRSSI should maintain precision without rounding", () => {
	// Test the example from the issue: starting at -94, then all -90
	let avg = averageRSSI(undefined, -94, 0.9); // First value
	expect(avg).toBe(-94);

	// Subsequent calls with -90 should gradually converge
	avg = averageRSSI(avg, -90, 0.9);
	expect(avg).toBeCloseTo(-93.6); // -94 * 0.9 + (-90) * 0.1 = -84.6 + (-9) = -93.6

	avg = averageRSSI(avg, -90, 0.9);
	expect(avg).toBeCloseTo(-93.24); // -93.6 * 0.9 + (-90) * 0.1 = -84.24 + (-9) = -93.24

	// After several iterations, should be clearly moving toward -90
	for (let i = 0; i < 50; i++) {
		avg = averageRSSI(avg, -90, 0.9);
	}
	// With exponential moving average weight of 0.9, it takes many iterations to converge
	// but it should definitely be closer to -90 than the starting -94
	expect(avg).toBeCloseTo(-90, 0.1); // Should be very close to -90
	expect(avg).toBeGreaterThan(-91); // Should be closer to -90 than to -94
});