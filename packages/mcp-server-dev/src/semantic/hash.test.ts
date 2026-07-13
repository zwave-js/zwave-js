import { describe, expect, it } from "vitest";
import { semanticHash, sha256Hex, stableStringify } from "./hash.js";

describe("stableStringify", () => {
	it("produces the same output regardless of object key order", () => {
		const a = stableStringify({ foo: 1, bar: 2 });
		const b = stableStringify({ bar: 2, foo: 1 });
		expect(a).toBe(b);
	});

	it("recursively canonicalizes nested objects and arrays", () => {
		const a = stableStringify({
			outer: { z: 1, a: [{ y: 2, x: 1 }] },
		});
		const b = stableStringify({
			outer: { a: [{ x: 1, y: 2 }], z: 1 },
		});
		expect(a).toBe(b);
	});

	it("preserves array element order (arrays are not sorted)", () => {
		const a = stableStringify([1, 2, 3]);
		const b = stableStringify([3, 2, 1]);
		expect(a).not.toBe(b);
	});
});

describe("sha256Hex", () => {
	it("is deterministic for the same input", () => {
		expect(sha256Hex("hello")).toBe(sha256Hex("hello"));
	});

	it("differs for different input", () => {
		expect(sha256Hex("hello")).not.toBe(sha256Hex("world"));
	});

	it("returns a 64-character lowercase hex digest", () => {
		expect(sha256Hex("hello")).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe("semanticHash", () => {
	it("is case- and whitespace-insensitive", () => {
		expect(semanticHash("Ramp Rate")).toBe(semanticHash("  ramp rate  "));
	});

	it("differs for different semantic text", () => {
		expect(semanticHash("Ramp Rate")).not.toBe(
			semanticHash("Battery Report Interval"),
		);
	});
});
