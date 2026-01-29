/**
 * Pretest script that uses runCodegen to transform test fixtures.
 *
 * This replaces the old ts-patch approach with the new runCodegen infrastructure.
 */

import { runCodegen } from "@zwave-js/maintenance/runCodegen";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	createValidateArgsTransformer,
	generateValidateArgsFiles,
} from "../src/validateArgs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.dirname(__dirname);
const fixturesDir = path.join(__dirname, "fixtures");
const buildDir = path.join(__dirname, "build");

async function pretest() {
	// Clean previous output
	await fs.rm(buildDir, { recursive: true, force: true });

	// Delete existing .mjs files from fixtures
	const existingMjs = await fs.readdir(fixturesDir);
	for (const file of existingMjs) {
		if (file.endsWith(".mjs")) {
			await fs.unlink(path.join(fixturesDir, file));
		}
	}

	console.log("Transforming test fixtures...");

	// Run codegen on test fixtures
	await runCodegen({
		packageDir,
		srcDir: "test/fixtures",
		outDir: "test/build",
		tsConfigPath: "tsconfig.test.json",
		fileFilter: (relativePath) => {
			// Include all .mts files
			return relativePath.endsWith(".mts");
		},
		getTransformers: (_filePath, content) => {
			// Apply validateArgs transformer to files importing @zwave-js/transformers
			if (content.includes("from \"@zwave-js/transformers\"")) {
				return [createValidateArgsTransformer()];
			}
			return undefined;
		},
		generateAuxiliaryFiles: [generateValidateArgsFiles],
		unchangedFileHandling: "copy",
	});

	console.log("Compiling transformed fixtures...");

	// Compile transformed .mts files to .mjs using tsc
	const spawn = (await import("nano-spawn")).default;
	await spawn("yarn", ["tsc", "-p", "tsconfig.test.build.json"], {
		cwd: packageDir,
	});

	console.log("Copying compiled files to fixtures...");

	// Copy compiled .mjs files back to fixtures dir
	const compiledFiles = await fs.readdir(buildDir);
	for (const file of compiledFiles) {
		if (file.endsWith(".mjs")) {
			await fs.copyFile(
				path.join(buildDir, file),
				path.join(fixturesDir, file),
			);
		}
	}

	// Clean up build dir
	await fs.rm(buildDir, { recursive: true, force: true });

	console.log("Done!");
}

pretest().catch((e) => {
	console.error(e);
	process.exit(1);
});
