import { ZWaveErrorCodes, assertZWaveError } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import { RCPMessage } from "../../message/RCPMessages.js";
import {
	MeasureNoiseFloorRequest,
	MeasureNoiseFloorResponse,
} from "./MeasureNoiseFloorMessages.js";

/** Serializes a raw response with the given payload, then parses it back */
async function parseResponse(payload: Bytes): Promise<RCPMessage> {
	const frame = await new RCPMessage({
		type: RCPMessageType.Response,
		functionType: RCPFunctionType.MeasureNoiseFloor,
		payload,
	}).serialize({});
	return RCPMessage.parse(frame, {});
}

describe("MeasureNoiseFloorRequest", () => {
	test("serializes the channel", async () => {
		const serialized = await new MeasureNoiseFloorRequest({ channel: 3 })
			.serialize({});

		expect(serialized[2]).toBe(RCPMessageType.Request);
		expect(serialized[3]).toBe(RCPFunctionType.MeasureNoiseFloor);
		expect(serialized[4]).toBe(3);
	});

	test.each([[-1], [256], [1.5]])(
		"rejects the out-of-range channel %i",
		async (channel) => {
			await assertZWaveError(
				expect,
				() => new MeasureNoiseFloorRequest({ channel }).serialize({}),
				{ errorCode: ZWaveErrorCodes.Argument_Invalid },
			);
		},
	);
});

describe("MeasureNoiseFloorResponse", () => {
	test("parses a negative noise floor", async () => {
		const msg = await parseResponse(
			Bytes.from([0xa0]),
		) as MeasureNoiseFloorResponse;

		expect(msg).toBeInstanceOf(MeasureNoiseFloorResponse);
		expect(msg.noiseFloor).toBe(-96);
	});
});
