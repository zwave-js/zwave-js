import { gzipSync } from "fflate";
import { expect, test } from "vitest";

import { gunzipSync } from "./compression.js";

test("gunzipSync() decompresses data within the limit", () => {
	const data = new Uint8Array(100_000).fill(0x42);
	const compressed = gzipSync(data);
	expect(new Uint8Array(gunzipSync(compressed, 100_000))).toEqual(data);
	expect(new Uint8Array(gunzipSync(compressed))).toEqual(data);
});

test("gunzipSync() decompresses concatenated gzip members", () => {
	const first = gzipSync(new Uint8Array(5_120).fill(0x01));
	const second = gzipSync(new Uint8Array(5_120).fill(0x02));
	const compressed = new Uint8Array(first.length + second.length);
	compressed.set(first);
	compressed.set(second, first.length);

	const expected = new Uint8Array(10_240).fill(0x01);
	expected.fill(0x02, 5_120);
	expect(new Uint8Array(gunzipSync(compressed, 10_240))).toEqual(expected);
});

test("gunzipSync() throws when the decompressed data exceeds the limit", () => {
	const compressed = gzipSync(new Uint8Array(100_000).fill(0x42));
	expect(() => gunzipSync(compressed, 99_999)).toThrow();
});

test("gunzipSync() throws for empty or truncated input", () => {
	const compressed = gzipSync(new Uint8Array(100_000).fill(0x42));
	for (const data of [
		new Uint8Array(0),
		compressed.subarray(0, 3),
		compressed.subarray(0, 10),
		compressed.subarray(0, 18),
		compressed.subarray(0, -4),
		compressed.subarray(0, -10),
	]) {
		expect(() => gunzipSync(data)).toThrow();
		expect(() => gunzipSync(data, 100_000)).toThrow();
	}
});
