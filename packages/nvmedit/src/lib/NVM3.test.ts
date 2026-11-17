import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import { NVM3 } from "./NVM3.js";
import { NVMMemoryIO } from "./io/NVMMemoryIO.js";
import { ZWAVE_SHARED_NVM_SIZE } from "./nvm3/consts.js";
import { ApplicationVersionFile800ID } from "./nvm3/files/VersionFiles.js";

// NVM3.init() detects the shared file system by the 800 series application version file
async function createSharedNVM(buffer: Uint8Array): Promise<NVM3> {
	const nvm = new NVM3(new NVMMemoryIO(buffer));
	await nvm.erase({ sharedFileSystem: true });
	await nvm.set(ApplicationVersionFile800ID, Bytes.from([0, 0, 0, 0]));
	return nvm;
}

test("files deleted before init() do not exist after init()", async (t) => {
	const buffer = new Uint8Array(ZWAVE_SHARED_NVM_SIZE);
	const writer = await createSharedNVM(buffer);
	await writer.set(0x50100, Bytes.from([1, 2, 3]));
	await writer.set(0x50101, Bytes.from([4, 5, 6]));
	await writer.delete(0x50100);

	const reader = new NVM3(new NVMMemoryIO(buffer));
	await reader.init();
	t.expect(await reader.has(0x50100)).toBe(false);
	t.expect(await reader.get(0x50100)).toBeUndefined();
	t.expect(await reader.has(0x50101)).toBe(true);
});

test("files re-created after deletion exist after init()", async (t) => {
	const buffer = new Uint8Array(ZWAVE_SHARED_NVM_SIZE);
	const writer = await createSharedNVM(buffer);
	await writer.set(0x50100, Bytes.from([1, 2, 3]));
	await writer.delete(0x50100);
	await writer.set(0x50100, Bytes.from([7, 8, 9]));

	const reader = new NVM3(new NVMMemoryIO(buffer));
	await reader.init();
	t.expect(await reader.has(0x50100)).toBe(true);
	t.expect(await reader.get(0x50100)).toStrictEqual(Bytes.from([7, 8, 9]));
});
