import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";
import {
	LICENSE_BLOCK_SIZE,
	ZWaveMeLicenseFlag,
	ZWaveMeLicenseSubcommand,
	buildCommandBlock,
	buildLicenseBlob,
	parseCommandBlock,
	parseLicenseBlob,
} from "./License.js";

test("buildLicenseBlob() / parseLicenseBlob() round-trip", (t) => {
	const blob = buildLicenseBlob({
		vendorId: 0x0115,
		maxNodes: 232,
		flags: [ZWaveMeLicenseFlag.LongRange, ZWaveMeLicenseFlag.BackupRestore],
		countSupport: 5,
	});
	t.expect(blob.length).toBe(32);

	const parsed = parseLicenseBlob(blob);
	t.expect(parsed.vendorId).toBe(0x0115);
	t.expect(parsed.maxNodes).toBe(232);
	t.expect(parsed.countSupport).toBe(5);
	t.expect(parsed.flags).toContain(ZWaveMeLicenseFlag.LongRange);
	t.expect(parsed.flags).toContain(ZWaveMeLicenseFlag.BackupRestore);
	t.expect(parsed.flags).not.toContain(ZWaveMeLicenseFlag.PromiscuousMode);
});

test("buildCommandBlock() produces a 48-byte block with a valid CRC", (t) => {
	const block = buildCommandBlock(
		ZWaveMeLicenseSubcommand.Get,
		// simulate a response block: status OK + payload
		Bytes.from([0x00, 0xaa, 0xbb]),
	);
	t.expect(block.length).toBe(LICENSE_BLOCK_SIZE);

	const parsed = parseCommandBlock(block);
	t.expect(parsed.subCommand).toBe(ZWaveMeLicenseSubcommand.Get);
	t.expect(parsed.status).toBe(0x00);
	t.expect(parsed.payload[0]).toBe(0xaa);
	t.expect(parsed.payload[1]).toBe(0xbb);
});

test("parseCommandBlock() rejects a block with a bad CRC", (t) => {
	const block = buildCommandBlock(ZWaveMeLicenseSubcommand.Nonce);
	block[1] ^= 0xff; // corrupt a payload byte, leaving the CRC intact
	t.expect(() => parseCommandBlock(block)).toThrow();
});
