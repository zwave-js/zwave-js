import { Bytes } from "@zwave-js/shared";
import { zipSync } from "fflate";
import { test } from "vitest";

import { ZWaveErrorCodes } from "../error/ZWaveError.js";
import { assertZWaveError } from "../test/assertZWaveError.js";

import { extractFirmware, tryUnzipFirmwareFile } from "./firmware.js";

const hex = ":0400000001020304F2\n:00000001FF\n";

test("extractFirmware() throws a ZWaveError for invalid HEX files", async (t) => {
	for (const invalid of [
		// Wrong checksum
		":0400000001020304F3\n:00000001FF\n",
		// No EOF record
		":0400000001020304F2\n",
		// Data after the EOF record
		hex + ":0400000001020304F2\n",
	]) {
		await assertZWaveError(
			t.expect,
			() => extractFirmware(Bytes.from(invalid, "ascii"), "hex"),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
	}
});

function createGeckoFile(): Bytes {
	const data = new Bytes(64);
	data.writeUInt32BE(0xeb17a603, 0);
	return data;
}

test("tryUnzipFirmwareFile() returns undefined for data that is not a ZIP archive", (t) => {
	t.expect(tryUnzipFirmwareFile(createGeckoFile())).toBeUndefined();
});

test("tryUnzipFirmwareFile() extracts a single firmware file from a ZIP archive", (t) => {
	const gecko = createGeckoFile();
	const zipData = zipSync({ "firmware.gbl": gecko });
	const result = tryUnzipFirmwareFile(zipData);
	t.expect(result?.filename).toBe("firmware.gbl");
	t.expect(result?.format).toBe("gecko");
	t.expect(Bytes.view(result!.rawData).equals(gecko)).toBe(true);
});
