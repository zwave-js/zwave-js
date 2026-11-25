import { NodeIDType, RFRegion } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import {
	ApplicationRFConfigFile,
	ApplicationRFConfigFileID,
} from "./ApplicationRFConfigFile.js";
import { NVMFile } from "./NVMFile.js";

test("a parsed file keeps its length when serialized", (t) => {
	const data = Bytes.from([
		RFRegion.USA,
		0x0e,
		0x00,
		0x00,
		0x00,
		0x00,
		0x8c,
		0x00,
		NodeIDType.Short,
	]);
	const file = NVMFile.from(
		ApplicationRFConfigFileID,
		data,
		"3.0.1",
	) as ApplicationRFConfigFile;
	file.rfRegion = RFRegion["USA (Long Range)"];

	const serialized = file.serialize().data;
	t.expect(serialized.length).toBe(9);
	t.expect(serialized[0]).toBe(RFRegion["USA (Long Range)"]);
	t.expect(serialized.subarray(1)).toStrictEqual(data.subarray(1));
});

test("a new file uses the layout of its file version", (t) => {
	const options = {
		rfRegion: RFRegion.Europe,
		txPower: 0,
		measured0dBm: 0,
		enablePTI: 0,
		maxTXPower: 14,
	};
	for (const [fileVersion, length] of [
		["7.15.0", 3],
		["7.15.3", 6],
		["7.18.1", 8],
		["7.21.0", 9],
	] as const) {
		const file = new ApplicationRFConfigFile({ ...options, fileVersion });
		t.expect(file.serialize().data.length).toBe(length);
	}
});
