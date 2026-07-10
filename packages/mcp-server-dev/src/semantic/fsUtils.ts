import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Atomic write: write to a sibling temp file, then rename over the target */
export async function writeFileAtomic(
	filePath: string,
	contents: string,
): Promise<void> {
	await mkdir(dirname(filePath), { recursive: true });
	const tmpPath = `${filePath}.${randomUUID()}.tmp`;
	await writeFile(tmpPath, contents, "utf8");
	await rename(tmpPath, filePath);
}
