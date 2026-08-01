// @ts-check

import { gzipSync, zipSync } from "fflate";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import decompressLogfile from "./decompressLogfile.cjs";

describe("decompressLogfile", () => {
	const encoder = new TextEncoder();
	const logContent =
		"2025-06-13 13:20:33.397 CNTRLR   Querying configured RF region...";

	let dir;
	let path;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "decompress-logfile-test-"));
		path = join(dir, "logfile.log");
		process.env.LOGFILE_PATH = path;
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
		delete process.env.LOGFILE_PATH;
	});

	it("replaces a zip with the logfile it contains", () => {
		writeFileSync(
			path,
			zipSync({
				"driver-logs-2026-08-01T05:05:58.192Z.log": encoder.encode(
					logContent,
				),
			}),
		);
		decompressLogfile();
		expect(readFileSync(path, "utf8")).toBe(logContent);
	});

	it("picks the active driver log out of a bundle", () => {
		writeFileSync(
			path,
			zipSync({
				"logs/z-ui_2025.log": encoder.encode("ui log"),
				"logs/zwavejs_2025-08-26.log": encoder.encode("old"),
				"logs/zwavejs_current.log": encoder.encode(logContent),
			}),
		);
		decompressLogfile();
		expect(readFileSync(path, "utf8")).toBe(logContent);
	});

	it("decompresses gzipped logfiles", () => {
		writeFileSync(path, gzipSync(encoder.encode(logContent)));
		decompressLogfile();
		expect(readFileSync(path, "utf8")).toBe(logContent);
	});

	it("leaves plain logfiles alone", () => {
		writeFileSync(path, logContent);
		decompressLogfile();
		expect(readFileSync(path, "utf8")).toBe(logContent);
	});

	it("fails when no single logfile can be identified", () => {
		writeFileSync(
			path,
			zipSync({
				"one.log": encoder.encode(logContent),
				"two.log": encoder.encode(logContent),
			}),
		);
		expect(() => decompressLogfile()).toThrow("single logfile");
	});
});
