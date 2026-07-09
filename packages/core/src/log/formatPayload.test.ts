import { test } from "vitest";
import { logDict, logList, logText } from "./LogPayload.js";
import { formatLogPayload } from "./formatPayload.js";

test("formats a flat dict with aligned values", (t) => {
	t.expect(
		formatLogPayload({
			"target value": 99,
			duration: "1s",
			enabled: true,
		}),
	).toStrictEqual([
		"target value: 99",
		"duration:     1s",
		"enabled:      true",
	]);
});

test("skips undefined dict entries", (t) => {
	t.expect(
		formatLogPayload({
			foo: "bar",
			baz: undefined,
		}),
	).toStrictEqual(["foo: bar"]);
});

test("renders list values as indented bullets under their key", (t) => {
	t.expect(
		formatLogPayload(
			logDict({
				"supported types": logList(["Heating", "Cooling"]),
				mode: "auto",
			}),
		),
	).toStrictEqual([
		"supported types:",
		" · Heating",
		" · Cooling",
		"mode:            auto",
	]);
});

test("renders a standalone list with bullets", (t) => {
	t.expect(formatLogPayload(logList(["one", "two"]))).toStrictEqual([
		" · one",
		" · two",
	]);
});

test("renders untagged text lines as-is", (t) => {
	t.expect(
		formatLogPayload(logText(["first line", "second line"])),
	).toStrictEqual(["first line", "second line"]);
});

test("renders text with a nested dict", (t) => {
	t.expect(
		formatLogPayload(
			logText("received secure commands", {
				nested: logList(["Basic", "Binary Switch"]),
			}),
		),
	).toStrictEqual([
		"received secure commands",
		" · Basic",
		" · Binary Switch",
	]);
});

test("renders a tagged text with dict content", (t) => {
	t.expect(
		formatLogPayload(
			logText([], {
				tags: ["RES", "GetControllerVersion"],
				nested: logDict({ payload: "0x1234" }),
			}),
		),
	).toStrictEqual([
		"[RES] [GetControllerVersion]",
		"  payload: 0x1234",
	]);
});

test("renders a CC tree with brackets and tree children", (t) => {
	const payload = logText([], {
		tags: ["REQ", "SendData"],
		nested: [
			logDict({ "transmit options": "0x25", "callback id": 1 }),
			logText([], {
				tags: ["Node 007", "Multi Channel"],
				nested: [
					logDict({ "endpoint index": 2 }),
					logText([], {
						tags: ["Binary Switch", "Set"],
						nested: logDict({ "target value": "true" }),
					}),
				],
			}),
		],
	});
	t.expect(formatLogPayload(payload)).toStrictEqual([
		"[REQ] [SendData]",
		"│ transmit options: 0x25",
		"│ callback id:      1",
		"└─[Node 007] [Multi Channel]",
		"  │ endpoint index: 2",
		"  └─[Binary Switch] [Set]",
		"      target value: true",
	]);
});

test("renders multiple tree children for multi-encapsulation", (t) => {
	const payload = logText([], {
		tags: ["Multi Command"],
		nested: [
			logText([], {
				tags: ["Basic", "Set"],
				nested: logDict({ value: 0 }),
			}),
			logText([], {
				tags: ["Basic", "Get"],
			}),
		],
	});
	t.expect(formatLogPayload(payload)).toStrictEqual([
		"[Multi Command]",
		"└─[Basic] [Set]",
		"    value: 0",
		"└─[Basic] [Get]",
	]);
});

test("aligns continuation lines of multi-line string values under the value column", (t) => {
	t.expect(
		formatLogPayload({
			error: "something failed\nwith more detail",
			ok: true,
		}),
	).toStrictEqual([
		"error: something failed",
		"       with more detail",
		"ok:    true",
	]);
});
