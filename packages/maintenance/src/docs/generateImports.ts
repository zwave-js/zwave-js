/*!
 * This method returns the original source code for an interface or type so it can be put into documentation
 */

import { fs } from "@zwave-js/core/bindings/fs/node";
import { enumFilesRecursive } from "@zwave-js/shared";
import c from "ansi-colors";
import esMain from "es-main";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread } from "node:worker_threads";
import { Piscina } from "piscina";
import {
	Project,
} from "ts-morph";
import { formatWithDprint } from "../dprint.js";
import {
	projectRoot,
	tsConfigFilePathForDocs as tsConfigFilePath,
} from "../tsAPITools.js";
import {
	findSourceNode,
	getTransformedSource,
	type ImportOptions,
} from "./shared.js";

// Support directly loading this file in a worker
import { register } from "tsx/esm/api";
register();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ImportRange {
	index: number;
	end: number;
	module: string;
	symbol: string;
	import: string;
	options: ImportOptions;
}

const importRegex =
	/(?<import><!-- #import (?<symbol>.*?) from "(?<module>.*?)"(?: with (?<options>[\w\-, ]*?))? -->)(?:[\s\r\n]*(^`{3,4})ts[\r\n]*(?<source>(.|\n)*?)\5)?/gm;

export function findImportRanges(docFile: string): ImportRange[] {
	const matches = [...docFile.matchAll(importRegex)];
	return matches.map((match) => ({
		index: match.index,
		end: match.index + match[0].length,
		module: match.groups!.module,
		symbol: match.groups!.symbol,
		import: match.groups!.import,
		options: {
			comments: !!match.groups!.options?.includes("comments"),
			jsdoc: !match.groups!.options?.includes("no-jsdoc"),
		},
	}));
}

function getImportKey(range: Pick<ImportRange, "module" | "symbol" | "options">): string {
	return JSON.stringify([
		range.module,
		range.symbol,
		!!range.options.comments,
		!!range.options.jsdoc,
	]);
}

type ProcessImportTask =
	| string
	| {
		filename: string;
		transformedSources: Record<string, string>;
	};

export async function processDocFile(
	program: Project | undefined,
	docFile: string,
	transformedSources: Record<string, string> = {},
): Promise<boolean> {
	console.log(`processing ${docFile}...`);
	let fileContent = await fsp.readFile(docFile, "utf8");
	const ranges = findImportRanges(fileContent);
	let hasErrors = false;
	// Replace from back to start so we can reuse the indizes
	for (let i = ranges.length - 1; i >= 0; i--) {
		const range = ranges[i];
		console.log(`  processing import ${range.symbol} from ${range.module}`);
		const importKey = getImportKey(range);
		const source = transformedSources[importKey]
			?? (() => {
				if (!program) return;
				const sourceNode = findSourceNode(
					program,
					`packages/${range.module.replace(/^@zwave-js\//, "")}/src/index.ts`,
					range.symbol,
				);
				if (!sourceNode) return;
				return getTransformedSource(sourceNode, range.options);
			})();
		if (!source) {
			console.error(
				c.red(
					`${docFile}: Cannot find symbol ${range.symbol} in module ${range.module}!`,
				),
			);
			hasErrors = true;
		} else {
			fileContent = `${fileContent.slice(0, range.index)}${range.import}

\`\`\`ts
${source}
\`\`\`${fileContent.slice(range.end)}`;
		}
	}
	console.log(`formatting ${docFile}...`);
	fileContent = fileContent.replaceAll("\r\n", "\n");
	fileContent = formatWithDprint(docFile, fileContent);
	if (!hasErrors) {
		await fsp.writeFile(docFile, fileContent, "utf8");
	}
	return hasErrors;
}

async function collectTransformedSources(
	program: Project,
	files: readonly string[],
): Promise<Map<string, Record<string, string>>> {
	const uniqueImports = new Map<string, ImportRange>();
	const fileImports = new Map<string, Set<string>>();

	for (const file of files) {
		const fileContent = await fsp.readFile(file, "utf8");
		const ranges = findImportRanges(fileContent);
		fileImports.set(file, new Set(ranges.map(getImportKey)));
		for (const range of ranges) {
			uniqueImports.set(getImportKey(range), range);
		}
	}

	const transformedSources = new Map<string, string>();
	for (const [importKey, range] of uniqueImports) {
		const sourceNode = findSourceNode(
			program,
			`packages/${range.module.replace(/^@zwave-js\//, "")}/src/index.ts`,
			range.symbol,
		);
		if (!sourceNode) continue;
		transformedSources.set(
			importKey,
			getTransformedSource(sourceNode, range.options),
		);
	}

	return new Map(
		files.map((file) => [
			file,
			Object.fromEntries(
				[...(fileImports.get(file) ?? [])]
					.map((importKey) => [
						importKey,
						transformedSources.get(importKey),
					])
					.filter((entry): entry is [string, string] => !!entry[1]),
			),
		]),
	);
}

/** Processes all imports, returns true if there was an error */
async function processImports(piscina: Piscina): Promise<boolean> {
	const files = await enumFilesRecursive(
		fs,
		path.join(projectRoot, "docs"),
		(f) =>
			!f.includes("/CCs/") && !f.includes("\\CCs\\") && f.endsWith(".md"),
	);

	const transformedSourcesByFile = await collectTransformedSources(
		getProgram(),
		files,
	);
	const tasks = files.map((f) =>
		piscina.run(
			{
				filename: f,
				transformedSources: transformedSourcesByFile.get(f) ?? {},
			},
			{ name: "processImport" },
		)
	);

	const hasErrors = (await Promise.all(tasks)).some((result) => result);
	return hasErrors;
}

async function main(): Promise<void> {
	const piscina = new Piscina({
		filename: path.join(__dirname, "generateImports.ts"),
		maxThreads: 4,
	});

	const hasErrors = await processImports(piscina);

	if (hasErrors) {
		process.exit(1);
	}
}

// To be able to use this as a worker thread, export the available methods
let _program: Project | undefined;
function getProgram(): Project {
	if (!_program) {
		_program = new Project({ tsConfigFilePath });
	}
	return _program;
}

export function processImport(task: ProcessImportTask): Promise<boolean> {
	if (typeof task === "string") {
		return processDocFile(getProgram(), task);
	}
	return processDocFile(undefined, task.filename, task.transformedSources);
}

// If this is NOT run as a worker thread, execute the main function
if (isMainThread) {
	if (esMain(import.meta)) {
		void main();
	}
}
