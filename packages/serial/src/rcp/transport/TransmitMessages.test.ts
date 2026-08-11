import { ZWaveErrorCodes, assertZWaveError } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import { TransmitRequest } from "./TransmitMessages.js";

describe("TransmitRequest", () => {
	test("serializes channel, TX power and flags before the data", async () => {
		const msg = new TransmitRequest({
			channel: 2,
			txPower: -10,
			withCCA: true,
			data: Bytes.from([0xaa, 0xbb]),
		});

		await expect(msg.serialize({})).resolves.toStrictEqual(
			Bytes.from([
				0x01, // SOF
				0x09, // length
				0x00, // Request
				0x03, // Transmit
				0x02, // channel
				0xff,
				0x9c, // TX power: -100 deci-dBm
				0x01, // flags: CCA
				0xaa,
				0xbb,
				0x84, // checksum
			]),
		);
	});

	test("encodes fractional TX power in steps of 0.1 dBm", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			txPower: 12.5,
			withCCA: false,
			data: Bytes.from([]),
		});

		const serialized = await msg.serialize({});
		expect(serialized.readInt16BE(5)).toBe(125);
	});

	test("uses the sentinel TX power when none is given", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			withCCA: false,
			data: Bytes.from([]),
		});

		const serialized = await msg.serialize({});
		expect(serialized[5]).toBe(0x7f);
		expect(serialized[6]).toBe(0xff);
		expect(serialized[7]).toBe(0x00);
	});

	test("accepts a TX power of 127 dBm", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			txPower: 127,
			withCCA: false,
			data: Bytes.from([]),
		});

		const serialized = await msg.serialize({});
		expect(serialized.readInt16BE(5)).toBe(1270);
	});

	test.each([
		["collides with the sentinel", 3276.7],
		["exceeds the int16 range", 3300],
		["falls below the int16 range", -3300],
		["is not finite", Number.POSITIVE_INFINITY],
		["is not a number", Number.NaN],
	])("throws when the TX power %s", async (_name, txPower) => {
		const msg = new TransmitRequest({
			channel: 0,
			txPower,
			withCCA: false,
			data: Bytes.from([]),
		});

		await assertZWaveError(expect, () => msg.serialize({}), {
			errorCode: ZWaveErrorCodes.Argument_Invalid,
		});
	});

	test("throws when the channel is out of range", async () => {
		const msg = new TransmitRequest({
			channel: 300,
			withCCA: false,
			data: Bytes.from([]),
		});

		await assertZWaveError(expect, () => msg.serialize({}), {
			errorCode: ZWaveErrorCodes.Argument_Invalid,
		});
	});

	test("throws when the payload exceeds the maximum frame length", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			withCCA: false,
			data: new Bytes(250),
		});

		await assertZWaveError(expect, () => msg.serialize({}), {
			errorCode: ZWaveErrorCodes.Argument_Invalid,
		});
	});
});
