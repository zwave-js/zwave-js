// @ts-check

import { gzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { lastTransferTime, maybeDecompressLogfile } from "./utils.cjs";

describe("lastTransferTime", () => {
	it("returns 0 when the issue was never transferred", () => {
		expect(lastTransferTime([
			{ event: "labeled", created_at: "2026-01-01T00:00:00Z" },
			{ event: "committed" },
		])).toBe(0);
	});

	it("returns the transfer timestamp", () => {
		expect(lastTransferTime([
			{ event: "labeled", created_at: "2026-01-01T00:00:00Z" },
			{ event: "transferred", created_at: "2026-01-02T00:00:00Z" },
		])).toBe(new Date("2026-01-02T00:00:00Z").getTime());
	});

	it("returns the newest of multiple transfers, regardless of order", () => {
		expect(lastTransferTime([
			{ event: "transferred", created_at: "2026-01-03T00:00:00Z" },
			{ event: "transferred", created_at: "2026-01-02T00:00:00Z" },
		])).toBe(new Date("2026-01-03T00:00:00Z").getTime());
	});
});

describe("maybeDecompressLogfile", () => {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const logContent =
		"2025-06-13 13:20:33.397 CNTRLR   Querying configured RF region...";

	it("extracts the single logfile from a zip", () => {
		const zipped = zipSync({
			"zwavejs_2025.log": encoder.encode(logContent),
		});
		expect(decoder.decode(maybeDecompressLogfile(zipped))).toBe(logContent);
	});

	it("leaves zips with multiple ambiguous logfiles alone", () => {
		const zipped = zipSync({
			"one.log": encoder.encode(logContent),
			"two.log": encoder.encode(logContent),
		});
		expect(maybeDecompressLogfile(zipped)).toBe(zipped);
	});

	it("ignores macOS resource-fork entries", () => {
		const zipped = zipSync({
			"zwavejs_2025.log": encoder.encode(logContent),
			"__MACOSX/._zwavejs_2025.log": encoder.encode("junk"),
		});
		expect(decoder.decode(maybeDecompressLogfile(zipped))).toBe(logContent);
	});

	it("prefers the driver log over other bundled logs", () => {
		const zipped = zipSync({
			"z-ui_2025.log": encoder.encode("ui log"),
			"zwavejs_2025.log": encoder.encode(logContent),
		});
		expect(decoder.decode(maybeDecompressLogfile(zipped))).toBe(logContent);
	});

	it("prefers the active driver log over rotated ones", () => {
		const zipped = zipSync({
			"zwavejs_2025-08-26.log": encoder.encode("old"),
			"zwavejs_current.log": encoder.encode(logContent),
		});
		expect(decoder.decode(maybeDecompressLogfile(zipped))).toBe(logContent);
	});

	it("leaves zips without logfiles alone", () => {
		const zipped = zipSync({ "firmware.bin": encoder.encode("nope") });
		expect(maybeDecompressLogfile(zipped)).toBe(zipped);
	});

	it("decompresses gzipped logfiles", () => {
		const gzipped = gzipSync(encoder.encode(logContent));
		expect(decoder.decode(maybeDecompressLogfile(gzipped))).toBe(
			logContent,
		);
	});

	it("leaves plain text alone", () => {
		const plain = encoder.encode(logContent);
		expect(maybeDecompressLogfile(plain)).toBe(plain);
	});

	it("leaves corrupted archives alone", () => {
		const corrupted = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
		expect(maybeDecompressLogfile(corrupted)).toBe(corrupted);
	});
});
