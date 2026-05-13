import nodeFs from "node:fs";

interface GlobSyncDirent {
	name: string;
	parentPath: string;
	isFile(): boolean;
}

interface GlobSyncOptions {
	cwd?: string;
}

interface GlobSync {
	(
		pattern: string,
		options?: GlobSyncOptions,
	): string[];
	(
		pattern: string,
		options: GlobSyncOptions & { withFileTypes: true },
	): GlobSyncDirent[];
}

export const globSync = (nodeFs as typeof nodeFs & { globSync: GlobSync })
	.globSync;

export function splitGlobPath(file: string): string[] {
	return file.replaceAll("\\", "/").split("/");
}
