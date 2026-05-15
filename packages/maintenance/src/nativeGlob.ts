import fs from "node:fs";
import fsp from "node:fs/promises";

export interface GlobDirent {
	name: string;
	parentPath: string;
	isDirectory(): boolean;
}

interface NativeGlobOptions {
	cwd?: string;
	exclude?: string[];
}

interface NativeGlobDirentOptions extends NativeGlobOptions {
	withFileTypes: true;
}

type NativeGlob =
	& ((
		pattern: string,
		options?: NativeGlobOptions,
	) => AsyncIterable<string>)
	& ((
		pattern: string,
		options: NativeGlobDirentOptions,
	) => AsyncIterable<GlobDirent>);

const { glob: nativeGlob } = fsp as typeof fsp & {
	glob: NativeGlob;
};

const { globSync: nativeGlobSync } = fs as typeof fs & {
	globSync(pattern: string, options?: NativeGlobOptions): string[];
};

export function globAsArray(
	pattern: string,
	options?: NativeGlobOptions,
): Promise<string[]>;
export function globAsArray(
	pattern: string,
	options: NativeGlobDirentOptions,
): Promise<GlobDirent[]>;
export function globAsArray(
	pattern: string,
	options?: NativeGlobOptions | NativeGlobDirentOptions,
): Promise<string[] | GlobDirent[]> {
	return Array.fromAsync(
		nativeGlob(
			pattern,
			options as NativeGlobOptions & NativeGlobDirentOptions,
		),
	);
}

export function globSync(
	pattern: string,
	options?: NativeGlobOptions,
): string[] {
	return nativeGlobSync(pattern, options);
}
