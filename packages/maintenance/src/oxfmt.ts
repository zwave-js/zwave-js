import fs from "node:fs/promises";
import path from "node:path";

import globrex from "globrex";
import JSON5 from "json5";
import {
	format,
	type FormatConfig,
	type OxfmtOverrideConfig,
	type Oxfmtrc,
} from "oxfmt";

import { repoRoot } from "./tsAPITools.js";

interface ResolvedConfig {
	options: FormatConfig;
	overrides: Array<{
		files: RegExp[];
		excludeFiles: RegExp[];
		options: FormatConfig;
	}>;
}

const configPromise: Promise<ResolvedConfig> = fs
	.readFile(path.join(repoRoot, ".oxfmtrc.jsonc"), "utf8")
	.then((sourceText) => {
		const {
			ignorePatterns: _ignorePatterns,
			overrides = [],
			...options
		} = JSON5.parse<Oxfmtrc>(sourceText);
		return {
			options,
			overrides: overrides.map(resolveOverride),
		};
	});

function resolveOverride(
	override: OxfmtOverrideConfig,
): ResolvedConfig["overrides"][number] {
	const toRegex = (pattern: string): RegExp =>
		globrex(pattern, { extended: true, globstar: true }).regex;
	return {
		files: override.files.map(toRegex),
		excludeFiles: (override.excludeFiles ?? []).map(toRegex),
		options: override.options ?? {},
	};
}

async function getFormatOptions(filename: string): Promise<FormatConfig> {
	const config = await configPromise;
	const relativeFilename = (
		path.isAbsolute(filename) ? path.relative(repoRoot, filename) : filename
	).replaceAll("\\", "/");
	const options = { ...config.options };

	for (const override of config.overrides) {
		if (
			override.files.some((regex) => regex.test(relativeFilename))
			&& !override.excludeFiles.some((regex) =>
				regex.test(relativeFilename),
			)
		) {
			Object.assign(options, override.options);
		}
	}

	return options;
}

export async function formatWithOxfmt(
	filename: string,
	sourceText: string,
	options?: Partial<FormatConfig>,
): Promise<string> {
	const { code, errors } = await format(filename, sourceText, {
		...(await getFormatOptions(filename)),
		...options,
	});
	if (errors.length) {
		throw new Error(
			errors
				.map((error) => error.codeframe ?? error.message)
				.join("\n\n"),
		);
	}
	return code;
}

export async function formatDeviceConfig(
	filename: string,
	sourceText: string,
): Promise<string> {
	return formatWithOxfmt(filename, sourceText);
}
