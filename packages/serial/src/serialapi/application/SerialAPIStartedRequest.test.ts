import {
	FunctionType,
	type MessageEncodingContext,
	MessageRaw,
	MessageType,
} from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import {
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
} from "./SerialAPIStartedRequest.js";

describe("SerialAPIStartedRequest", () => {
	test.each([
		{ deviceOption: 0b0000_0001, expected: true },
		{ deviceOption: 0b0000_0011, expected: true },
		{ deviceOption: 0b1000_0000, expected: false },
	])(
		"parses the listening flag from bit 0 of the device option mask",
		({ deviceOption, expected }) => {
			const request = SerialAPIStartedRequest.from(
				new MessageRaw(
					MessageType.Request,
					FunctionType.SerialAPIStarted,
					Bytes.from([
						SerialAPIWakeUpReason.SoftwareReset,
						0,
						deviceOption,
						0x02,
						0x01,
						0,
						0,
					]),
				),
			);

			expect(request.isListening).toBe(expected);
		},
	);

	test("serializes the listening flag in bit 0 of the device option mask", async () => {
		const request = new SerialAPIStartedRequest({
			wakeUpReason: SerialAPIWakeUpReason.SoftwareReset,
			watchdogEnabled: false,
			genericDeviceClass: 0x02,
			specificDeviceClass: 0x01,
			isListening: true,
			supportedCCs: [],
			controlledCCs: [],
			supportsLongRange: true,
		});

		const serialized = await request.serialize(
			{} as MessageEncodingContext,
		);
		const raw = MessageRaw.parse(serialized);

		expect(raw.payload[2]).toBe(0b1);
	});
});
