/**
 * Transforms TypeScript legacy decorators in ESM output files.
 * This is needed because tsgo doesn't transform decorators yet.
 * Run this BEFORE esm2cjs to ensure both ESM and CJS outputs have transformed decorators.
 */

import remapping from "@jridgewell/remapping";
import { transform } from "esbuild";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function* walkDir(dir: string): AsyncGenerator<string> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkDir(fullPath);
		} else if (entry.isFile() && entry.name.endsWith(".js")) {
			yield fullPath;
		}
	}
}

async function transformFile(filePath: string): Promise<boolean> {
	const content = await readFile(filePath, "utf-8");

	// Quick check: skip files without decorators
	if (!content.includes("@")) {
		return false;
	}

	// More precise check: look for decorator pattern at start of line
	if (!/^@\w+/m.test(content)) {
		return false;
	}

	// Try to load existing sourcemap for chaining
	const mapPath = filePath + ".map";
	let inputSourcemap: string | undefined;
	try {
		inputSourcemap = await readFile(mapPath, "utf-8");
	} catch {
		// No existing sourcemap, that's fine
	}

	const result = await transform(content, {
		loader: "ts", // Parse as TypeScript to handle decorator syntax
		format: "esm",
		target: "es2022",
		sourcemap: "external",
		sourcefile: filePath,
	});

	await writeFile(filePath, result.code);

	if (result.map) {
		let outputMap = result.map;

		// Chain sourcemaps if we have an input sourcemap from tsgo
		if (inputSourcemap) {
			const remapped = remapping(
				[result.map, inputSourcemap],
				() => null,
			);
			outputMap = JSON.stringify(remapped);
		}

		await writeFile(mapPath, outputMap);
	}

	return true;
}

async function main() {
	const dir = process.argv[2];
	if (!dir) {
		console.error("Usage: downlevel-decorators <directory>");
		process.exit(1);
	}

	let transformed = 0;
	let skipped = 0;

	for await (const file of walkDir(dir)) {
		if (await transformFile(file)) {
			transformed++;
		} else {
			skipped++;
		}
	}

	if (transformed > 0) {
		console.log(
			`Downleveled decorators in ${transformed} files (${skipped} skipped)`,
		);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
