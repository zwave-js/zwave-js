import { test } from "vitest";
import {
	isLogPayload,
	logDict,
	logList,
	logText,
	mergeLogDict,
	toLogPayload,
} from "./LogPayload.js";

test("isLogPayload only accepts branded payloads", (t) => {
	t.expect(isLogPayload(logText("foo"))).toBe(true);
	t.expect(isLogPayload(logDict({}))).toBe(true);
	t.expect(isLogPayload(logList([]))).toBe(true);
	// A plain record may legitimately contain a "type" entry
	t.expect(isLogPayload({ type: "text", value: 1 })).toBe(false);
	t.expect(isLogPayload(undefined)).toBe(false);
	t.expect(isLogPayload("dict")).toBe(false);
});

test("toLogPayload passes payloads through and converts records to dicts", (t) => {
	const payload = logList(["a"]);
	t.expect(toLogPayload(payload)).toBe(payload);

	const converted = toLogPayload({ type: "dict-lookalike", value: 1 });
	t.expect(converted.type).toBe("dict");
	t.expect((converted as any).entries).toStrictEqual([
		["type", "dict-lookalike"],
		["value", "1"],
	]);
});

test("mergeLogDict overrides entries in place and appends new ones", (t) => {
	const merged = mergeLogDict(
		{ a: 1, b: 2 },
		{ b: 3, c: 4 },
	);
	t.expect(merged.entries).toStrictEqual([
		["a", "1"],
		["b", "3"],
		["c", "4"],
	]);
});

test("mergeLogDict removes entries via undefined values", (t) => {
	const merged = mergeLogDict(
		logDict({ command: "foo", payload: "0x1234" }),
		{ payload: undefined, success: true },
	);
	t.expect(merged.entries).toStrictEqual([
		["command", "foo"],
		["success", "true"],
	]);
});

test("mergeLogDict merges any number of sources and skips undefined ones", (t) => {
	const merged = mergeLogDict(
		{ first: "1" },
		undefined,
		logDict({ second: "2" }),
		{ third: "3" },
	);
	t.expect(merged.entries).toStrictEqual([
		["first", "1"],
		["second", "2"],
		["third", "3"],
	]);
});
