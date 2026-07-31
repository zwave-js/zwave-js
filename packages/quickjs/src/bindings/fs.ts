import {
	Bytes,
	type BytesView,
	fileHandleToReadableStream,
	fileHandleToWritableStream,
} from "@zwave-js/shared";
import type {
	FSStats,
	FileHandle,
	FileSystem,
} from "@zwave-js/shared/bindings";

function hasErrorCode(e: unknown, code: string): boolean {
	return typeof e === "object" && e !== null && (e as any).code === code;
}

function toFSStats(stat: tjs.StatResult): FSStats {
	return {
		// txiki exposes these as boolean properties, while the bindings expect methods
		isDirectory: () => stat.isDirectory,
		isFile: () => stat.isFile,
		// The timestamp fields are named after struct stat, not after Node.js
		mtime: stat.mtim,
		size: stat.size,
	};
}

/** An implementation of the FileSystem bindings for txiki.js */
export const fs: FileSystem = {
	async readDir(path: string): Promise<string[]> {
		const ret: string[] = [];
		// readDir resolves to the async iterable, it is not one itself
		for await (const entry of await tjs.readDir(path)) {
			ret.push(entry.name);
		}
		return ret;
	},

	async readFile(path: string): Promise<BytesView> {
		// tjs types the result against ArrayBufferLike, BytesView requires ArrayBuffer
		return Bytes.view(await tjs.readFile(path));
	},

	writeFile(path: string, data: BytesView): Promise<void> {
		return tjs.writeFile(path, toUint8Array(data));
	},

	copyFile(source: string, dest: string): Promise<void> {
		return tjs.copyFile(source, dest);
	},

	async ensureDir(path: string): Promise<void> {
		try {
			await tjs.makeDir(path, { recursive: true });
		} catch (e) {
			// Unlike Node.js, recursive mkdir still fails if the leaf already exists
			if (!hasErrorCode(e, "EEXIST")) throw e;
		}
	},

	async deleteDir(path: string): Promise<void> {
		try {
			await tjs.remove(path);
		} catch (e) {
			// Match the `force` semantics the bindings are specified with
			if (!hasErrorCode(e, "ENOENT")) throw e;
		}
	},

	async stat(path: string): Promise<FSStats> {
		return toFSStats(await tjs.stat(path));
	},

	async open(
		path: string,
		flags: {
			read: boolean;
			write: boolean;
			create: boolean;
			truncate: boolean;
		},
	): Promise<FileHandle> {
		if (!flags.truncate && !flags.read) {
			throw new Error(
				"Cannot open a file writeonly without truncating it",
			);
		}
		if (!flags.write && flags.create) {
			throw new Error("Cannot open a file readonly with create flag");
		}

		let mode = "";
		if (flags.read && !flags.write) {
			mode = "r";
		} else if (flags.read && flags.write && !flags.create) {
			mode = "r+";
		} else if (flags.write && flags.create && flags.truncate) {
			mode = flags.read ? "w+" : "w";
		}

		return new TxikiFileHandle(
			await tjs.open(path, mode),
			{ read: flags.read, write: flags.write },
		);
	},

	async makeTempDir(prefix: string): Promise<string> {
		// The template must contain XXXXXX, and only an absolute template yields an absolute result
		return tjs.makeTempDir(`${tjs.tmpDir}/${prefix}XXXXXX`);
	},
};

function toUint8Array(data: BytesView): Uint8Array<ArrayBuffer> {
	return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

class TxikiFileHandle implements FileHandle {
	public constructor(
		handle: tjs.FileHandle,
		flags: { read: boolean; write: boolean },
	) {
		this.#handle = handle;
		this.#flags = flags;
	}

	#open = true;
	#handle: tjs.FileHandle;
	#flags: { read: boolean; write: boolean };
	#readable?: ReadableStream<BytesView>;
	#writable?: WritableStream<BytesView>;

	public get readable(): ReadableStream<BytesView> {
		if (!this.#flags.read) {
			throw new Error("File is not readable");
		}
		this.#readable ??= fileHandleToReadableStream(this);
		return this.#readable;
	}

	public get writable(): WritableStream<BytesView> {
		if (!this.#flags.write) {
			throw new Error("File is not writable");
		}
		this.#writable ??= fileHandleToWritableStream(this);
		return this.#writable;
	}

	public async close(): Promise<void> {
		if (!this.#open) return;
		this.#open = false;
		await this.#handle.close();
	}

	public async read(
		position?: number | null,
		length: number = 16 * 1024,
	): Promise<{ data: BytesView; bytesRead: number }> {
		if (!this.#open) throw new Error("File is not open");
		const buffer = new Uint8Array(length);
		const bytesRead = await this.#handle.read(
			buffer,
			position ?? undefined,
		) ?? 0;
		return { data: buffer.subarray(0, bytesRead), bytesRead };
	}

	public async write(
		data: BytesView,
		position?: number | null,
	): Promise<{ bytesWritten: number }> {
		if (!this.#open) throw new Error("File is not open");
		const bytesWritten = await this.#handle.write(
			toUint8Array(data),
			position ?? undefined,
		);
		return { bytesWritten };
	}

	public async stat(): Promise<FSStats> {
		if (!this.#open) throw new Error("File is not open");
		return toFSStats(await this.#handle.stat());
	}
}
