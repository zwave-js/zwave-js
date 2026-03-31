import { Bytes } from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import { test } from "vitest";
import { CLIParser } from "./CLIParser.js";
import { CLIChunkType, ZWaveSerialFrameType } from "./ZWaveSerialFrame.js";

test("does not treat argument placeholders as the CLI prompt", async (t) => {
	const parser = new CLIParser();
	const writer = parser.writable.getWriter();
	const received: {
		type: ZWaveSerialFrameType.CLI;
		data:
			| { type: CLIChunkType.Message; message: string }
			| { type: CLIChunkType.Prompt };
	}[] = [];

	const consume = (async () => {
		for await (const frame of parser.readable) {
			if (frame.type !== ZWaveSerialFrameType.CLI) continue;
			if (frame.data.type === CLIChunkType.FlowControl) continue;
			received.push(frame as (typeof received)[number]);
		}
	})();

	await writer.write(Bytes.from(
		`help\r
set_region                    Set the configured region\r
                              [string] <region>\r
set_powerlevel                Set the configured RF power values\r
                              [int16] <iTxPowerLevelMax> <iTxPowe`,
		"ascii",
	));
	await wait(25);
	t.expect(received).toHaveLength(0);

	await writer.write(Bytes.from(
		`rLevelAdjust> <iTxPowerLevelMaxLR>\r
bootloader                    Restart into bootloader\r
> `,
		"ascii",
	));
	await wait(25);

	t.expect(received).toHaveLength(2);
	t.expect(received[0].data.type).toBe(CLIChunkType.Message);
	t.expect(
		(received[0].data as { type: CLIChunkType.Message; message: string })
			.message,
	).toContain(
		"[int16] <iTxPowerLevelMax> <iTxPowerLevelAdjust> <iTxPowerLevelMaxLR>",
	);
	t.expect(
		(received[0].data as { type: CLIChunkType.Message; message: string })
			.message,
	).toContain("bootloader                    Restart into bootloader");
	t.expect(received[1].data.type).toBe(CLIChunkType.Prompt);

	await writer.close();
	await consume;
});
