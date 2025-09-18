import { ZWaveProtocolCCSetNWIMode } from "@zwave-js/cc";
import { ZnifferDataMessage } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";
import { parseZLFEntry } from "../../zniffer/ZLFEntry.js";
import { Zniffer } from "../../zniffer/Zniffer.js";

test("parse complete command frame", async (t) => {
	const rawMsg = Bytes.from("1f95cd4d13addd888103000000230500fe", "hex");
	const parsed = parseZLFEntry(rawMsg, 0);
	t.expect(parsed.complete).toBe(true);
	const rawData = [...parsed.entries[0]?.capture?.rawData ?? []];
	t.expect(rawData).toEqual([0x23, 0x5, 0x00]);
});

test("parse incomplete command frame", async (t) => {
	let rawMsg = Bytes.from("e9e2cd4d13addd88010100000023fe", "hex");
	let parsed = parseZLFEntry(rawMsg, 0);
	t.expect(parsed.complete).toBe(false);
	t.expect(parsed.bytesRead).toBe(rawMsg.length);
	const accumulated = [...parsed.accumulator?.rawData ?? []];
	t.expect(accumulated).toEqual([0x23]);

	rawMsg = Bytes.from("3b0ace4d13addd8801020000000500fe", "hex");
	parsed = parseZLFEntry(rawMsg, 0, parsed.accumulator);
	t.expect(parsed.complete).toBe(true);
	const rawData = [...parsed.entries[0]?.capture?.rawData ?? []];
	t.expect(rawData).toEqual([0x23, 0x5, 0x00]);
});

test("parse complete data frame", async (t) => {
	const rawMsg = Bytes.from(
		"8013fa7c93addd88011600000021010000020b2c21030cc4dae60701410a0c02008f68fe",
		"hex",
	);
	const parsed = parseZLFEntry(rawMsg, 0);
	t.expect(parsed.complete).toBe(true);
	t.expect(parsed.entries[0].msg).toBeInstanceOf(ZnifferDataMessage);
});

test("parse incomplete data frame", async (t) => {
	let rawMsg = Bytes.from("0c0b3e6713addd88010100000021fe", "hex");
	let parsed = parseZLFEntry(rawMsg, 0);
	t.expect(parsed.complete).toBe(false);
	t.expect(parsed.bytesRead).toBe(rawMsg.length);
	const accumulated = [...parsed.accumulator?.rawData ?? []];
	t.expect(accumulated).toEqual([0x21]);

	rawMsg = Bytes.from(
		"0c0b3e6713addd88011f000000010000210b2d210316c4dae60701050116ff2000fa40000000000122010054fe",
		"hex",
	);
	parsed = parseZLFEntry(rawMsg, 0, parsed.accumulator);
	t.expect(parsed.complete).toBe(true);
	const rawData = [...parsed.entries[0]?.capture?.rawData ?? []];
	t.expect(rawData.at(-1)).toBe(0x54);

	const mockZniffer = new Zniffer("/dev/mock");
	const frame = await mockZniffer["parseFrame"](
		parsed.entries[0].msg as ZnifferDataMessage,
	);
	t.expect(frame.cc).toBeInstanceOf(ZWaveProtocolCCSetNWIMode);
});
