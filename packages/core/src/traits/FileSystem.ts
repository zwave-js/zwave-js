// FIXME: Get rid of this once the legacy FS bindings are removed

import { BytesView } from "@zwave-js/shared";

/** Defines which methods must be supported by a replacement filesystem */
export interface FileSystem {
	ensureDir(path: string): Promise<void>;
	writeFile(
		file: string,
		data: string | BytesView,
		options?:
			| { encoding: BufferEncoding }
			| BufferEncoding,
	): Promise<void>;
	readFile(file: string, encoding: BufferEncoding): Promise<string>;
	pathExists(path: string): Promise<boolean>;
}
