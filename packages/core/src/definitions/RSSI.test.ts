import { expect, test } from "vitest";
import { RssiError, averageRSSI } from "./RSSI.js";

test("averageRSSI should calculate exponential moving average correctly", () => {
	// First measurement should return the RSSI value itself
	const first = averageRSSI(undefined, -50, 0.9);
	expect(first).toBe(-50);

	// Second measurement should calculate moving average
	const second = averageRSSI(first, -60, 0.9);
	// Expected: -50 * 0.9 + (-60) * 0.1 = -51
	expect(second).toBe(-51);

	// Third measurement should use the previous average
	const third = averageRSSI(second, -40, 0.9);
	// Expected: -51 * 0.9 + (-40) * 0.1 = -49.9
	expect(third).toBe(-49.9);
});

test("averageRSSI should handle RSSI errors correctly", () => {
	// Test with NotAvailable error - should return current accumulator
	expect(averageRSSI(-50, RssiError.NotAvailable, 0.9)).toBe(-50);
	expect(averageRSSI(undefined, RssiError.NotAvailable, 0.9)).toBe(0);

	// Test with ReceiverSaturated error - should treat as 0 dBm
	expect(averageRSSI(-50, RssiError.ReceiverSaturated, 0.9)).toBe(
		-50 * 0.9 + 0 * 0.1,
	);

	// Test with NoSignalDetected error - should treat as -128 dBm
	expect(averageRSSI(-50, RssiError.NoSignalDetected, 0.9)).toBe(
		-50 * 0.9 + (-128) * 0.1,
	);
});

test("averageRSSI should work with different weights", () => {
	const result = averageRSSI(-40, -60, 0.5);
	// Expected: -40 * 0.5 + (-60) * 0.5 = -50
	expect(result).toBe(-50);

	const result2 = averageRSSI(-40, -60, 0.1);
	// Expected: -40 * 0.1 + (-60) * 0.9 = -58
	expect(result2).toBe(-58);
});

test("averageRSSI should maintain precision without rounding", () => {
	// Repro for #8023: Repeatedly updating -94 with -90 readings did nothing due to rounding
	let avg = averageRSSI(undefined, -94, 0.9);
	expect(avg).toBe(-94);

	avg = averageRSSI(avg, -90, 0.9);
	expect(avg).toBeCloseTo(-93.6);

	avg = averageRSSI(avg, -90, 0.9);
	expect(avg).toBeCloseTo(-93.24);

	// After several iterations, should be clearly moving toward -90
	for (let i = 0; i < 50; i++) {
		avg = averageRSSI(avg, -90, 0.9);
	}
	expect(avg).toBeCloseTo(-90, 0.1);
});
