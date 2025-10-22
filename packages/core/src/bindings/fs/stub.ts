/* eslint-disable @typescript-eslint/no-unused-vars */
import { BytesView } from "@zwave-js/shared";
import type {
	FSStats,
	FileHandle,
	FileSystem,
} from "@zwave-js/shared/bindings";

function fail(): never {
	throw new Error(
		"The default FS bindings are not available on this platform",
	);
}

export const fs: FileSystem = {
	readFile: function(path: string): Promise<BytesView> {
		fail();
	},
	writeFile: function(path: string, data: BytesView): Promise<void> {
		fail();
	},
	copyFile: function(source: string, dest: string): Promise<void> {
		fail();
	},
	open: function(
		path: string,
		flags: {
			read: boolean;
			write: boolean;
			create: boolean;
			truncate: boolean;
		},
	): Promise<FileHandle> {
		fail();
	},
	readDir: function(path: string): Promise<string[]> {
		fail();
	},
	stat: function(path: string): Promise<FSStats> {
		fail();
	},
	ensureDir: function(path: string): Promise<void> {
		fail();
	},
	deleteDir: function(path: string): Promise<void> {
		fail();
	},
	makeTempDir: function(prefix: string): Promise<string> {
		fail();
	},
};
