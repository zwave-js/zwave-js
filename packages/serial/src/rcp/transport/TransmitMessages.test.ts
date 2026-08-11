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
				0x08, // length
				0x00, // Request
				0x03, // Transmit
				0x02, // channel
				0xf6, // TX power
				0x01, // flags: CCA
				0xaa,
				0xbb,
				0x10, // checksum
			]),
		);
	});

	test("uses the sentinel TX power when none is given", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			withCCA: false,
			data: Bytes.from([]),
		});

		const serialized = await msg.serialize({});
		expect(serialized[5]).toBe(0x7f);
		expect(serialized[6]).toBe(0x00);
	});

	test("throws when the TX power is out of range", async () => {
		const msg = new TransmitRequest({
			channel: 0,
			txPower: 200,
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
