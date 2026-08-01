// @ts-check

import { gzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { lastTransferTime, readLogfileTail } from "./utils.cjs";

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

describe("readLogfileTail", () => {
	const encoder = new TextEncoder();
	const logContent =
		"2025-06-13 13:20:33.397 CNTRLR   Querying configured RF region...";

	/** @param {Uint8Array | string} body */
	function tailOf(body) {
		return readLogfileTail(new Response(body));
	}

	it("extracts the single logfile from a zip", async () => {
		const zipped = zipSync({
			"zwavejs_2025.log": encoder.encode(logContent),
		});
		expect(await tailOf(zipped)).toBe(logContent);
	});

	it("reports zips with multiple ambiguous logfiles as binary", async () => {
		const zipped = zipSync({
			"one.log": encoder.encode(logContent),
			"two.log": encoder.encode(logContent),
		});
		expect(await tailOf(zipped)).toMatch(/^PK\x03\x04/);
	});

	it("ignores macOS resource-fork entries", async () => {
		const zipped = zipSync({
			"zwavejs_2025.log": encoder.encode(logContent),
			"__MACOSX/._zwavejs_2025.log": encoder.encode("junk"),
		});
		expect(await tailOf(zipped)).toBe(logContent);
	});

	it("prefers the driver log over other bundled logs", async () => {
		const zipped = zipSync({
			"z-ui_2025.log": encoder.encode("ui log"),
			"zwavejs_2025.log": encoder.encode(logContent),
		});
		expect(await tailOf(zipped)).toBe(logContent);
	});

	it("prefers the active driver log over rotated ones", async () => {
		const zipped = zipSync({
			"zwavejs_2025-08-26.log": encoder.encode("old"),
			"zwavejs_current.log": encoder.encode(logContent),
		});
		expect(await tailOf(zipped)).toBe(logContent);
	});

	it("reports zips without logfiles as binary", async () => {
		const zipped = zipSync({ "firmware.bin": encoder.encode("nope") });
		expect(await tailOf(zipped)).toMatch(/^PK\x03\x04/);
	});

	it("decompresses gzipped logfiles", async () => {
		expect(await tailOf(gzipSync(encoder.encode(logContent)))).toBe(
			logContent,
		);
	});

	it("passes plain text through", async () => {
		expect(await tailOf(logContent)).toBe(logContent);
	});

	it("reports corrupted archives as binary", async () => {
		const corrupted = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
		expect(await tailOf(corrupted)).toMatch(/^PK\x03\x04/);
	});

	it("keeps only the last 250 lines", async () => {
		const lines = Array.from({ length: 400 }, (_, i) => `line ${i}`);
		const tail = await tailOf(lines.join("\n"));
		expect(tail.split("\n")).toHaveLength(250);
		expect(tail.split("\n")[249]).toBe("line 399");
	});

	it("keeps only the last 250 lines of a zipped logfile", async () => {
		const lines = Array.from({ length: 400 }, (_, i) => `line ${i}`);
		const zipped = zipSync({
			"zwavejs_current.log": encoder.encode(lines.join("\n")),
		});
		const tail = await tailOf(zipped);
		expect(tail.split("\n")).toHaveLength(250);
		expect(tail.split("\n")[249]).toBe("line 399");
	});
});
