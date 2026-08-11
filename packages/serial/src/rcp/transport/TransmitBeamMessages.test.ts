import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import { TransmitBeamRequest } from "./TransmitBeamMessages.js";
import { TransmitRequest } from "./TransmitMessages.js";

describe("TransmitRequest", () => {
	test("serializes channel, TX power and flags before the data", async () => {
		const msg = new TransmitRequest({
			channel: 2,
			txPower: -10,
			withCCA: true,
			data: Bytes.from([0xaa, 0xbb]),
		});

		const serialized = await msg.serialize({});
		// SOF, length, type, function type, then the payload
		expect(serialized.subarray(4, -1)).toStrictEqual(
			Bytes.from([0x02, 0xf6, 0x01, 0xaa, 0xbb]),
		);
	});

	test("clears the CCA flag when CCA is disabled", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			txPower: 14,
			withCCA: false,
			data: Bytes.from([]),
		});

		const serialized = await msg.serialize({});
		expect(serialized.subarray(4, -1)).toStrictEqual(
			Bytes.from([0x00, 0x0e, 0x00]),
		);
	});
});

describe("TransmitBeamRequest", () => {
	test("serializes the beam parameters and channel list before the data", async () => {
		const msg = new TransmitBeamRequest({
			txPower: -3,
			numFragments: 5,
			fragmentDurationMs: 1000,
			fragmentPeriodMs: 1100,
			channels: [0, 1, 2],
			data: Bytes.from([0x55, 0x66]),
		});

		const serialized = await msg.serialize({});
		expect(serialized.subarray(4, -1)).toStrictEqual(
			Bytes.from([
				0xfd, // TX power
				0x05, // no. of fragments
				0x03,
				0xe8, // fragment duration
				0x04,
				0x4c, // fragment period
				0x03, // no. of channels
				0x00,
				0x01,
				0x02,
				0x55,
				0x66,
			]),
		);
	});
});
