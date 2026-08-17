import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import { RCPMessage } from "../../message/RCPMessages.js";
import {
	RadioCapability,
	SetupRadioCommand,
	SetupRadio_GetCapabilitiesResponse,
	type SetupRadio_GetTxPowerRangeResponse,
} from "./SetupRadioMessages.js";

/** Serializes a raw SetupRadio response with the given payload, then parses it back */
async function parseResponse(
	command: SetupRadioCommand,
	payload: number[],
): Promise<RCPMessage> {
	const frame = await new RCPMessage({
		type: RCPMessageType.Response,
		functionType: RCPFunctionType.SetupRadio,
		payload: Bytes.from([command, ...payload]),
	}).serialize({});
	return RCPMessage.parse(frame, {});
}

describe("SetupRadio_GetCapabilitiesResponse", () => {
	test("parses the capability bitmask", async () => {
		const msg = await parseResponse(SetupRadioCommand.GetCapabilities, [
			1, // bitmask length
			0b1, // TransmitReplacements
		]) as SetupRadio_GetCapabilitiesResponse;

		expect(msg).toBeInstanceOf(SetupRadio_GetCapabilitiesResponse);
		expect(msg.capabilities).toStrictEqual([
			RadioCapability.TransmitReplacements,
		]);
	});

	test("parses an empty capability list", async () => {
		const msg = await parseResponse(SetupRadioCommand.GetCapabilities, [
			1,
			0b0,
		]) as SetupRadio_GetCapabilitiesResponse;

		expect(msg.capabilities).toStrictEqual([]);
	});
});

describe("SetupRadio_GetTxPowerRangeResponse", () => {
	test("parses a range with a negative minimum", async () => {
		// -10.0 dBm and 30.0 dBm as int16 BE deci-dBm
		const msg = await parseResponse(SetupRadioCommand.GetTxPowerRange, [
			0xff,
			0x9c,
			0x01,
			0x2c,
		]) as SetupRadio_GetTxPowerRangeResponse;

		expect(msg.minTxPower).toBe(-10);
		expect(msg.maxTxPower).toBe(30);
	});
});
