// Script to remove unnecessary min/maxValue from config files

import * as JSONC from "comment-json";
import esMain from "es-main";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatWithDprint } from "./dprint.js";
import { globSync } from "./nodeFsGlob.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
	const devicesDir = path.join(__dirname, "../../config/config/devices");

	const configFiles = globSync("**/*.json", { cwd: devicesDir })
		.filter((file) => {
			const normalized = file.replaceAll("\\", "/");
			const segments = normalized.split("/");
			return segments.at(-1) !== "index.json"
				&& !segments.includes("templates");
		})
		.map((file) => path.join(devicesDir, file));

	for (const filename of configFiles) {
		const config = JSONC.parse(
			await fsp.readFile(filename, "utf8"),
		) as JSONC.CommentObject;

		if (!config.paramInformation) continue;
		for (
			const param of config.paramInformation as JSONC.CommentArray<
				JSONC.CommentObject
			>
		) {
			if (
				param.allowManualEntry === false
				// Avoid false positives through imports
				&& !("$import" in param)
				&& param.options
				&& (param.options as any[]).length > 0
			) {
				if (typeof param.minValue === "number") delete param.minValue;
				if (typeof param.maxValue === "number") delete param.maxValue;
			}
		}

		let output = JSONC.stringify(config, null, "\t");
		output = formatWithDprint(filename, output);
		await fsp.writeFile(filename, output, "utf8");
	}
}

if (esMain(import.meta)) {
	void main();
}
