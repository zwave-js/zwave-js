import { Message } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import { MessageOrigin } from "../../message/Message.js";

import {
	SerialAPISetupCommand,
	SerialAPISetup_GetSupportedCommandsResponse,
	SerialAPISetup_SetLongRangeMaximumTxPowerRequest,
	SerialAPISetup_SetPowerlevel16BitRequest,
	SerialAPISetup_SetPowerlevelRequest,
} from "./SerialAPISetupMessages.js";

test("GetSupportedCommandsResponse with extended bitmask parses correctly (pre-7.19.1 encoding)", async (t) => {
	const data = Bytes.from(
		"0116010b01fe160103000100000001000000000000000109",
		"hex",
	);

	const msg = Message.parse(data, { sdkVersion: "7.19.0" } as any);
	t.expect(msg instanceof SerialAPISetup_GetSupportedCommandsResponse).toBe(
		true,
	);
	const supported = (msg as SerialAPISetup_GetSupportedCommandsResponse)
		.supportedCommands;

	t.expect(supported).toStrictEqual([
		0x01, 0x02, 0x04, 0x08, 0x10, 0x11, 0x20, 0x40, 0x80,
	]);
});

test("GetSupportedCommandsResponse with extended bitmask parses correctly (post-7.19.1 encoding)", async (t) => {
	const data = Bytes.from(
		"0116010b01ff8b8001800000008000000000000000800097",
		"hex",
	);

	const msg = Message.parse(data, { sdkVersion: "7.19.1" } as any);
	t.expect(msg instanceof SerialAPISetup_GetSupportedCommandsResponse).toBe(
		true,
	);
	const supported = (msg as SerialAPISetup_GetSupportedCommandsResponse)
		.supportedCommands;

	t.expect(supported).toStrictEqual([
		0x01, 0x02, 0x04, 0x08, 0x10, 0x11, 0x20, 0x40, 0x80,
	]);
});

for (const sdkVersion of ["7.19.0", "7.19.1"]) {
	test(`GetSupportedCommandsResponse round-trips the extended bitmask with SDK ${sdkVersion}`, async (t) => {
		const supportedCommands = [
			SerialAPISetupCommand.GetSupportedCommands,
			SerialAPISetupCommand.GetLongRangeMaximumPayloadSize,
			SerialAPISetupCommand.SetNodeIDType,
		];
		const data = await new SerialAPISetup_GetSupportedCommandsResponse({
			supportedCommands,
			sdkVersion,
		}).serialize({} as any);

		const msg = Message.parse(data, { sdkVersion } as any);
		t.expect(
			(msg as SerialAPISetup_GetSupportedCommandsResponse)
				.supportedCommands,
		).toStrictEqual(supportedCommands);
	});
}

test("SetPowerlevel requests can be parsed", async (t) => {
	for (const original of [
		new SerialAPISetup_SetPowerlevelRequest({
			powerlevel: -1.5,
			measured0dBm: 3.2,
		}),
		new SerialAPISetup_SetPowerlevel16BitRequest({
			powerlevel: 14.5,
			measured0dBm: -3.2,
		}),
		new SerialAPISetup_SetLongRangeMaximumTxPowerRequest({
			limit: 14.5,
		}),
	]) {
		const data = await original.serialize({} as any);
		const parsed = Message.parse(data, {
			origin: MessageOrigin.Host,
		} as any);
		t.expect(parsed).toBeInstanceOf(original.constructor);
		t.expect(parsed).toMatchObject(
			"limit" in original
				? { limit: original.limit }
				: {
						powerlevel: original.powerlevel,
						measured0dBm: original.measured0dBm,
					},
		);
	}
});
