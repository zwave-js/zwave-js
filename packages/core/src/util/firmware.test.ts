import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import { ZWaveErrorCodes } from "../error/ZWaveError.js";
import { assertZWaveError } from "../test/assertZWaveError.js";

import { extractFirmware } from "./firmware.js";

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
