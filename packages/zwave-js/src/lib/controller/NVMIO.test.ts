import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import { trimNVMWriteAtEnd } from "./NVMIO.js";

test("trimNVMWriteAtEnd leaves writes alone that end before the end of the NVM", (t) => {
	const data = Bytes.from([0x01, 0xff, 0xff, 0xff]);
	t.expect(trimNVMWriteAtEnd(0x9fc0, data, 0xa000)).toStrictEqual(data);
});

test("trimNVMWriteAtEnd drops trailing 0xFF bytes from the last write", (t) => {
	const data = new Bytes(64).fill(0xff);
	data[10] = 0x01;
	t.expect(trimNVMWriteAtEnd(0x9fc0, data, 0xa000)).toStrictEqual(
		data.subarray(0, 11),
	);
});

test("trimNVMWriteAtEnd keeps one byte of an all-0xFF last write", (t) => {
	const data = new Bytes(64).fill(0xff);
	t.expect(trimNVMWriteAtEnd(0x9fc0, data, 0xa000)).toStrictEqual(
		data.subarray(0, 1),
	);
});

test("trimNVMWriteAtEnd leaves the last write alone if its last byte is not 0xFF", (t) => {
	const data = new Bytes(64).fill(0xff);
	data[63] = 0x01;
	t.expect(trimNVMWriteAtEnd(0x9fc0, data, 0xa000)).toStrictEqual(data);
});
