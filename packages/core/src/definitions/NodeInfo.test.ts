import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import { ZWaveErrorCodes } from "../error/ZWaveError.js";
import { assertZWaveError } from "../test/assertZWaveError.js";

import { CommandClasses } from "./CommandClasses.js";
import { NodeIDType } from "./NodeID.js";
import {
	encodeNodeID,
	parseApplicationNodeInformation,
	parseNodeUpdatePayload,
} from "./NodeInfo.js";

test("parseApplicationNodeInformation() should parse correctly", (t) => {
	const payload = Bytes.from([
		0x01, // Remote Controller
		0x02, // Portable Scene Controller
		// Supported CCs
		CommandClasses["Multi Channel"],
		CommandClasses["Multilevel Toggle Switch"],
		0xef, // ======
		// Controlled CCs
		CommandClasses["Scene Activation"],
	]);
	const eif = parseApplicationNodeInformation(payload);

	t.expect(eif.genericDeviceClass).toBe(0x01);
	t.expect(eif.specificDeviceClass).toBe(0x02);
	t.expect(eif.supportedCCs).toStrictEqual([
		CommandClasses["Multi Channel"],
		CommandClasses["Multilevel Toggle Switch"],
	]);
	t.expect(eif.controlledCCs).toStrictEqual([
		CommandClasses["Scene Activation"],
	]);
});

test("parseNodeUpdatePayload() should parse correctly", (t) => {
	const payload = Bytes.from([
		5, // NodeID
		5, // remaining length
		0x03, // Slave
		0x01, // Remote Controller
		0x02, // Portable Scene Controller
		// Supported CCs
		CommandClasses["Multi Channel"],
		CommandClasses["Multilevel Toggle Switch"],
	]);
	const nup = parseNodeUpdatePayload(payload);

	t.expect(nup.nodeId).toBe(5);
	t.expect(nup.basicDeviceClass).toBe(3);
	t.expect(nup.genericDeviceClass).toBe(1);
	t.expect(nup.specificDeviceClass).toBe(2);

	t.expect(nup.supportedCCs).toStrictEqual([
		CommandClasses["Multi Channel"],
		CommandClasses["Multilevel Toggle Switch"],
	]);
});

test("parseNodeUpdatePayload() parses extended CCs correctly", (t) => {
	const payload = Bytes.from([
		5, // NodeID
		9, // remaining length
		0x03,
		0x01,
		0x02, // Portable Scene Controller
		// Supported CCs
		// --> Security Mark
		0xf1,
		0x00,
		CommandClasses["Sensor Configuration"],
		CommandClasses.Supervision,
		// --> some hypothetical CC
		0xfe,
		0xdc,
	]);

	const nup = parseNodeUpdatePayload(payload);
	t.expect(nup.supportedCCs).toStrictEqual([
		CommandClasses["Security Mark"],
		CommandClasses["Sensor Configuration"],
		CommandClasses.Supervision,
		0xfedc,
	]);
});

test("encodeNodeID() rejects node IDs above 255 with 8-bit node IDs", (t) => {
	t.expect(encodeNodeID(255, NodeIDType.Short)).toStrictEqual(
		Bytes.from([0xff]),
	);
	t.expect(encodeNodeID(293, NodeIDType.Long)).toStrictEqual(
		Bytes.from([0x01, 0x25]),
	);
	assertZWaveError(t.expect, () => encodeNodeID(293, NodeIDType.Short), {
		errorCode: ZWaveErrorCodes.Argument_Invalid,
	});
});
