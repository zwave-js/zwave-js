import { ZWaveErrorCodes, assertZWaveError } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import { RCPMessage } from "../../message/RCPMessages.js";
import {
	AbortBeamRequest,
	AbortBeamResponse,
	TransmitBeamCallback,
	TransmitBeamRequest,
	type TransmitBeamRequestOptions,
	TransmitBeamResponse,
} from "./TransmitBeamMessages.js";
import {
	TransmitCallbackStatus,
	TransmitResponseStatus,
} from "./TransmitMessages.js";

/** Serializes a raw message with the given type, function type and payload, then parses it back */
async function roundtrip(
	type: RCPMessageType,
	functionType: RCPFunctionType,
	payload: Bytes,
): Promise<RCPMessage> {
	const frame = await new RCPMessage({ type, functionType, payload })
		.serialize({});
	return RCPMessage.parse(frame, {});
}

function createBeamRequest(
	options: Partial<TransmitBeamRequestOptions> = {},
): TransmitBeamRequest {
	return new TransmitBeamRequest({
		txPower: -3,
		numFragments: 5,
		fragmentDurationMs: 1000,
		fragmentPeriodMs: 1100,
		channels: [0, 1, 2],
		data: Bytes.from([0x55, 0x66]),
		...options,
	});
}

describe("TransmitBeamRequest", () => {
	test("serializes the beam parameters and channel list before the data", async () => {
		await expect(createBeamRequest().serialize({})).resolves.toStrictEqual(
			Bytes.from([
				0x01, // SOF
				0x10, // length
				0x00, // Request
				0x05, // TransmitBeam
				0xff,
				0xe2, // TX power: -30 deci-dBm
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
				0x62, // checksum
			]),
		);
	});

	test("uses the sentinel TX power when none is given", async () => {
		const serialized = await createBeamRequest({ txPower: undefined })
			.serialize({});
		expect(serialized[4]).toBe(0x7f);
		expect(serialized[5]).toBe(0xff);
	});

	test("encodes fractional TX power in steps of 0.1 dBm", async () => {
		const serialized = await createBeamRequest({ txPower: -3.5 })
			.serialize({});
		expect(serialized.readInt16BE(4)).toBe(-35);
	});

	test("the callback timeout covers the entire beam", () => {
		expect(createBeamRequest().getCallbackTimeout()).toBe(5 * 1100 + 1000);
	});

	test.each([
		["TX power", { txPower: 30.1 }],
		["number of fragments", { numFragments: 0 }],
		["fragment duration", { fragmentDurationMs: 70000 }],
		["fragment period", { fragmentPeriodMs: -1 }],
		["channel list length", { channels: [] }],
		["channel", { channels: [256] }],
		["channel", { channels: [-1] }],
	])("throws when the %s is out of range", async (_name, options) => {
		const msg = createBeamRequest(options);
		await assertZWaveError(expect, () => msg.serialize({}), {
			errorCode: ZWaveErrorCodes.Argument_Invalid,
		});
	});
});

describe("TransmitBeamResponse", () => {
	test("is parsed from a TransmitBeam response frame", async () => {
		const msg = await roundtrip(
			RCPMessageType.Response,
			RCPFunctionType.TransmitBeam,
			Bytes.from([TransmitResponseStatus.Busy]),
		);

		expect(msg).toBeInstanceOf(TransmitBeamResponse);
		expect((msg as TransmitBeamResponse).status).toBe(
			TransmitResponseStatus.Busy,
		);
		expect((msg as TransmitBeamResponse).isOK()).toBe(false);
	});

	test("only the Queued status is OK", async () => {
		const msg = await roundtrip(
			RCPMessageType.Response,
			RCPFunctionType.TransmitBeam,
			Bytes.from([TransmitResponseStatus.Queued]),
		);

		expect((msg as TransmitBeamResponse).isOK()).toBe(true);
	});
});

describe("TransmitBeamCallback", () => {
	test("is parsed from a TransmitBeam callback frame", async () => {
		const msg = await roundtrip(
			RCPMessageType.Callback,
			RCPFunctionType.TransmitBeam,
			Bytes.from([TransmitCallbackStatus.Completed]),
		);

		expect(msg).toBeInstanceOf(TransmitBeamCallback);
		expect((msg as TransmitBeamCallback).status).toBe(
			TransmitCallbackStatus.Completed,
		);
		expect((msg as TransmitBeamCallback).isOK()).toBe(true);
	});

	test("an aborted beam is not OK", async () => {
		const msg = await roundtrip(
			RCPMessageType.Callback,
			RCPFunctionType.TransmitBeam,
			Bytes.from([TransmitCallbackStatus.Aborted]),
		);

		expect((msg as TransmitBeamCallback).isOK()).toBe(false);
	});
});

describe("AbortBeam", () => {
	test("the request has an empty payload and expects no callback", async () => {
		const msg = new AbortBeamRequest();

		await expect(msg.serialize({})).resolves.toStrictEqual(
			Bytes.from([
				0x01, // SOF
				0x03, // length
				0x00, // Request
				0x06, // AbortBeam
				0xfa, // checksum
			]),
		);
		expect(msg.expectsCallback()).toBe(false);
	});

	test.each([[0x01, true], [0x00, false]])(
		"the response byte %i indicates success %s",
		async (byte, success) => {
			const msg = await roundtrip(
				RCPMessageType.Response,
				RCPFunctionType.AbortBeam,
				Bytes.from([byte]),
			);

			expect(msg).toBeInstanceOf(AbortBeamResponse);
			expect((msg as AbortBeamResponse).success).toBe(success);
			expect((msg as AbortBeamResponse).isOK()).toBe(success);
		},
	);
});
