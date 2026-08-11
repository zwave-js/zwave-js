import { expect, test } from "vitest";
import {
	encodeLongRangeBeamFrame,
	encodeZWaveBeamFrame,
	longRangeBeamPowerToIndex,
	longRangeHomeIdHash,
	zwaveHomeIdHash,
} from "./Beam.js";

test("zwaveHomeIdHash() XORs all home ID bytes into 0xFF", () => {
	// 0xFF ^ 0xDE ^ 0xAD ^ 0xBE ^ 0xEF
	expect(zwaveHomeIdHash(0xdeadbeef)).toBe(0xdd);
	expect(zwaveHomeIdHash(0x00000000)).toBe(0xff);
	expect(zwaveHomeIdHash(0xffffffff)).toBe(0xff);
});

test("zwaveHomeIdHash() increments the wildcard hash values", () => {
	// 0xFF ^ 0xF5 = 0x0A
	expect(zwaveHomeIdHash(0x000000f5)).toBe(0x0b);
	// 0xFF ^ 0xB5 = 0x4A
	expect(zwaveHomeIdHash(0x000000b5)).toBe(0x4b);
	// 0xFF ^ 0xAA = 0x55
	expect(zwaveHomeIdHash(0x000000aa)).toBe(0x56);
});

test("longRangeHomeIdHash() does not adjust the wildcard hash values", () => {
	expect(longRangeHomeIdHash(0xdeadbeef)).toBe(0xdd);
	expect(longRangeHomeIdHash(0x000000f5)).toBe(0x0a);
	expect(longRangeHomeIdHash(0x000000b5)).toBe(0x4a);
	expect(longRangeHomeIdHash(0x000000aa)).toBe(0x55);
});

test("encodeZWaveBeamFrame() omits the home ID hash when it is not given", () => {
	expect([...encodeZWaveBeamFrame({ destinationNodeId: 23 })]).toStrictEqual([
		0x55,
		23,
	]);
});

test("encodeZWaveBeamFrame() appends the home ID hash when given", () => {
	expect([
		...encodeZWaveBeamFrame({
			destinationNodeId: 0xff,
			homeIdHash: 0xdd,
		}),
	]).toStrictEqual([0x55, 0xff, 0xdd]);
});

test("longRangeBeamPowerToIndex() maps the exact levels of Table 6-31", () => {
	const levels = [
		-6,
		-2,
		2,
		6,
		10,
		13,
		16,
		19,
		21,
		23,
		25,
		26,
		27,
		28,
		29,
		30,
	];
	for (let index = 0; index < levels.length; index++) {
		expect(longRangeBeamPowerToIndex(levels[index])).toBe(index);
	}
});

test("longRangeBeamPowerToIndex() rounds up to the next representable level", () => {
	expect(longRangeBeamPowerToIndex(-5)).toBe(1);
	expect(longRangeBeamPowerToIndex(0)).toBe(2);
	expect(longRangeBeamPowerToIndex(11)).toBe(5);
	expect(longRangeBeamPowerToIndex(25.5)).toBe(11);
});

test("longRangeBeamPowerToIndex() clamps out-of-range values", () => {
	expect(longRangeBeamPowerToIndex(-100)).toBe(0);
	expect(longRangeBeamPowerToIndex(-6.5)).toBe(0);
	expect(longRangeBeamPowerToIndex(30.5)).toBe(15);
	expect(longRangeBeamPowerToIndex(100)).toBe(15);
});

test("encodeLongRangeBeamFrame() encodes TX power index and 12-bit node ID", () => {
	expect([
		...encodeLongRangeBeamFrame({
			destinationNodeId: 0x123,
			txPower: 14,
			homeIdHash: 0xdd,
		}),
	]).toStrictEqual([0x55, 0x61, 0x23, 0xdd]);
});

test("encodeLongRangeBeamFrame() encodes the broadcast node ID", () => {
	expect([
		...encodeLongRangeBeamFrame({
			destinationNodeId: 0xfff,
			txPower: -6,
			homeIdHash: 0x0a,
		}),
	]).toStrictEqual([0x55, 0x0f, 0xff, 0x0a]);
});
