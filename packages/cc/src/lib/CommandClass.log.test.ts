import { formatLogPayload, logDict, logText } from "@zwave-js/core";
import { test } from "vitest";
import { BinarySwitchCCSet } from "../cc/BinarySwitchCC.js";
import { MultiChannelCCCommandEncapsulation } from "../cc/MultiChannelCC.js";
import { SupervisionCCGet } from "../cc/SupervisionCC.js";
import { ccToLogPayload } from "./CommandClass.js";

test("a single CC renders as a tree child with its dict content", (t) => {
	const cc = new BinarySwitchCCSet({ nodeId: 7, targetValue: true });
	const payload = logText([], {
		tags: ["REQ", "SendData"],
		nested: ccToLogPayload(cc),
	});
	t.expect(formatLogPayload(payload)).toStrictEqual([
		"[REQ] [SendData]",
		"└─[BinarySwitchCCSet]",
		"    target value: true",
	]);
});

test("encapsulated CCs render as a nested tree with gutters", (t) => {
	const binarySwitch = new BinarySwitchCCSet({
		nodeId: 7,
		targetValue: true,
	});
	const multiChannel = new MultiChannelCCCommandEncapsulation({
		nodeId: 7,
		destination: 2,
		encapsulated: binarySwitch,
	});
	const supervision = new SupervisionCCGet({
		nodeId: 7,
		requestUpdates: false,
		encapsulated: multiChannel,
	});
	t.expect(formatLogPayload(ccToLogPayload(supervision))).toStrictEqual([
		"[SupervisionCCGet]",
		"└─[MultiChannelCCCommandEncapsulation]",
		"  │ source:      0",
		"  │ destination: 2",
		"  └─[BinarySwitchCCSet]",
		"      target value: true",
	]);
});

test("payloads nested in the message dict become tree siblings of encapsulated CCs", (t) => {
	const binarySwitch = new BinarySwitchCCSet({
		nodeId: 7,
		targetValue: true,
	});
	// Emulates a CC like Security2CCMessageEncapsulation whose message dict
	// carries extension payloads
	const fakeEncap = Object.create(SupervisionCCGet.prototype);
	Object.assign(fakeEncap, { encapsulated: binarySwitch });
	fakeEncap.toLogEntry = () => ({
		tags: ["FakeEncapCC"],
		message: logDict(
			{ "sequence number": 7 },
			logText([], {
				tags: ["SPAN"],
				nested: logDict({ "sender EI": "0x1234" }),
			}),
		),
	});

	t.expect(formatLogPayload(ccToLogPayload(fakeEncap))).toStrictEqual([
		"[FakeEncapCC]",
		"│ sequence number: 7",
		"├─[SPAN]",
		"│   sender EI: 0x1234",
		"└─[BinarySwitchCCSet]",
		"    target value: true",
	]);
});
