import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { globSync } from "./nodeFsGlob.js";

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempDirs.splice(0).map((dir) =>
			rm(dir, { recursive: true, force: true })
		),
	);
});

test("globSync returns relative file matches", async () => {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), "zwave-js-glob-"));
	tempDirs.push(rootDir);
	await mkdir(path.join(rootDir, "nested"), { recursive: true });
	await writeFile(path.join(rootDir, "top.md"), "");
	await writeFile(path.join(rootDir, "nested", "page.md"), "");
	await writeFile(path.join(rootDir, "nested", "note.txt"), "");

	expect(globSync("**/*.md", { cwd: rootDir }).toSorted()).toStrictEqual([
		"nested/page.md",
		"top.md",
	]);
});

test("globSync supports withFileTypes for file-only filtering", async () => {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), "zwave-js-glob-"));
	tempDirs.push(rootDir);
	await mkdir(path.join(rootDir, "nested", "deeper"), { recursive: true });
	await writeFile(path.join(rootDir, "nested", "page.md"), "");
	await writeFile(path.join(rootDir, "nested", "deeper", "note.txt"), "");

	const files = globSync("**/*", {
		cwd: rootDir,
		withFileTypes: true,
	})
		.filter((entry) => entry.isFile())
		.map((entry) =>
			path.relative(rootDir, path.join(entry.parentPath, entry.name)),
		)
		.toSorted();

	expect(files).toStrictEqual(["nested/deeper/note.txt", "nested/page.md"]);
});
