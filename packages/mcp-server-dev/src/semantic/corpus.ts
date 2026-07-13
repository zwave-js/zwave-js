import {
	clearTemplateCache,
	readJsonWithTemplate,
	resolveImportPath,
} from "@zwave-js/config";
import { tryParseParamNumber } from "@zwave-js/core";
import { getErrorMessage, num2hex } from "@zwave-js/shared";
import {
	type Node,
	type ParseError,
	findNodeAtLocation,
	getNodeValue,
	parseTree,
} from "jsonc-parser";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import PQueue from "p-queue";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DEVICES_DIR, fs } from "../configEnv.js";
import { semanticHash } from "./hash.js";
import type {
	Corpus,
	CorpusOption,
	CorpusSemantics,
	CorpusStructure,
	CorpusWarning,
	DeviceContext,
	ParameterCorpusRecord,
	TemplateCorpusRecord,
} from "./types.js";

/** Lists all `.json` files below the devices directory, relative to it */
export async function listConfigFiles(): Promise<string[]> {
	const relativeFiles = await readdir(DEVICES_DIR, { recursive: true });
	return relativeFiles.filter((f) => f.endsWith(".json")).toSorted();
}

function isTemplateFile(relativeFile: string): boolean {
	return relativeFile.split(sep).includes("templates");
}

function toPosixPath(p: string): string {
	return p.split(sep).join("/");
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v != null && typeof v === "object" && !Array.isArray(v);
}

/** Recursively collects every `$import` specifier anywhere in a parsed config/template value */
function collectImportSpecifiers(value: unknown, out: string[]): void {
	if (Array.isArray(value)) {
		for (const v of value) collectImportSpecifiers(v, out);
	} else if (isPlainObject(value)) {
		for (const [key, val] of Object.entries(value)) {
			if (key === "$import" && typeof val === "string") {
				out.push(val);
			} else {
				collectImportSpecifiers(val, out);
			}
		}
	}
}

function extractOptions(resolved: Record<string, unknown>): CorpusOption[] {
	const options = resolved.options;
	if (!Array.isArray(options)) return [];
	const ret: CorpusOption[] = [];
	for (const o of options) {
		if (
			isPlainObject(o)
			&& typeof o.value === "number"
			&& typeof o.label === "string"
		) {
			ret.push({ value: o.value, label: o.label });
		}
	}
	return ret;
}

export function extractSemantics(
	resolved: Record<string, unknown>,
): CorpusSemantics {
	const options = extractOptions(resolved);
	return {
		label: typeof resolved.label === "string" ? resolved.label : undefined,
		description: typeof resolved.description === "string"
			? resolved.description
			: undefined,
		unit: typeof resolved.unit === "string" ? resolved.unit : undefined,
		purpose: typeof resolved["$purpose"] === "string"
			? resolved["$purpose"]
			: undefined,
		optionLabels: options.map((o) => o.label),
	};
}

export function extractStructure(
	resolved: Record<string, unknown>,
): CorpusStructure {
	return {
		valueSize: typeof resolved.valueSize === "number"
			? resolved.valueSize
			: undefined,
		minValue: typeof resolved.minValue === "number"
			? resolved.minValue
			: undefined,
		maxValue: typeof resolved.maxValue === "number"
			? resolved.maxValue
			: undefined,
		defaultValue: typeof resolved.defaultValue === "number"
			? resolved.defaultValue
			: undefined,
		unsigned: typeof resolved.unsigned === "boolean"
			? resolved.unsigned
			: undefined,
		readOnly: resolved.readOnly === true,
		writeOnly: resolved.writeOnly === true,
		allowManualEntry: typeof resolved.allowManualEntry === "boolean"
			? resolved.allowManualEntry
			: undefined,
		options: extractOptions(resolved),
	};
}

/** Builds the text that gets hashed into `semanticHash` and sent to the embedding model.
 * `$purpose` is deliberately excluded so tagged records can teach us the meaning of a
 * purpose instead of making records similar merely because they share its identifier. */
export function buildSemanticText(semantics: CorpusSemantics): string {
	const parts: string[] = [];
	const concept = semantics.label
		? `Parameter concept: ${semantics.label}`
		: undefined;
	// Repeat the label so discriminating words (for example, "minimum" versus
	// "maximum") retain enough influence after mean pooling; long descriptions
	// and option lists otherwise make near-opposite concepts embed too similarly.
	if (concept) parts.push(concept, concept);
	if (semantics.description) parts.push(semantics.description);
	if (semantics.unit) parts.push(`Unit: ${semantics.unit}`);
	if (semantics.optionLabels.length > 0) {
		parts.push(`Options: ${semantics.optionLabels.join(", ")}`);
	}
	if (concept) parts.push(concept);
	return parts.join(". ");
}

interface ParsedFile {
	relativeFile: string;
	tree: Node;
	raw: unknown;
	document: TextDocument;
}

async function parseFile(
	file: string,
	relativeFile: string,
): Promise<ParsedFile | { error: string }> {
	const text = await readFile(file, "utf8");
	const errors: ParseError[] = [];
	const tree = parseTree(text, errors, {
		allowTrailingComma: true,
		disallowComments: false,
	});
	if (!tree || errors.length > 0) {
		return {
			error: `Malformed JSON (${errors.length} syntax error(s))`,
		};
	}
	return {
		relativeFile,
		tree,
		raw: getNodeValue(tree),
		document: TextDocument.create(file, "jsonc", 1, text),
	};
}

/** 1-based line of the node at `path`, or 1 if the path does not exist */
function lineAtLocation(parsed: ParsedFile, path: (string | number)[]): number {
	const node = findNodeAtLocation(parsed.tree, path);
	return node ? parsed.document.positionAt(node.offset).line + 1 : 1;
}

/** Resolves `$import` templates, converting failures into a corpus warning */
async function tryResolveTemplates(
	parsed: ParsedFile,
	file: string,
	warnings: CorpusWarning[],
): Promise<Record<string, unknown> | undefined> {
	try {
		return await readJsonWithTemplate(fs, file, DEVICES_DIR);
	} catch (error) {
		warnings.push({
			file: parsed.relativeFile,
			message: `Failed to resolve $import templates: ${
				getErrorMessage(error)
			}`,
		});
		return undefined;
	}
}

function extractDeviceContext(raw: Record<string, unknown>): DeviceContext {
	const devices = Array.isArray(raw.devices) ? raw.devices : [];
	const firstDevice = isPlainObject(devices[0]) ? devices[0] : undefined;
	return {
		manufacturer: typeof raw.manufacturer === "string"
			? raw.manufacturer
			: undefined,
		manufacturerId: typeof raw.manufacturerId === "string"
			? raw.manufacturerId
			: undefined,
		deviceLabel: typeof raw.label === "string" ? raw.label : undefined,
		deviceDescription: typeof raw.description === "string"
			? raw.description
			: undefined,
		productType: typeof firstDevice?.productType === "string"
			? firstDevice.productType
			: undefined,
		productId: typeof firstDevice?.productId === "string"
			? firstDevice.productId
			: undefined,
	};
}

async function buildParameterRecords(
	parsed: ParsedFile,
	file: string,
	warnings: CorpusWarning[],
	importUsages: { contextFile: string; specifier: string }[],
): Promise<ParameterCorpusRecord[]> {
	const raw = parsed.raw;
	if (!isPlainObject(raw) || !Array.isArray(raw.paramInformation)) {
		return [];
	}

	const device = extractDeviceContext(raw);

	const resolved = await tryResolveTemplates(parsed, file, warnings);
	if (!resolved) return [];

	const rawParams = raw.paramInformation as unknown[];
	const resolvedParams = Array.isArray(resolved.paramInformation)
		? resolved.paramInformation as unknown[]
		: [];
	if (resolvedParams.length !== rawParams.length) {
		warnings.push({
			file: parsed.relativeFile,
			message:
				`paramInformation length changed after resolving templates `
				+ `(${rawParams.length} -> ${resolvedParams.length}); skipping parameter indexing for this file`,
		});
		return [];
	}

	const records: ParameterCorpusRecord[] = [];
	for (let i = 0; i < rawParams.length; i++) {
		const rawEntry = rawParams[i];
		const resolvedEntry = resolvedParams[i];
		if (!isPlainObject(rawEntry) || !isPlainObject(resolvedEntry)) {
			continue;
		}

		const key = rawEntry["#"];
		if (typeof key !== "string") {
			warnings.push({
				file: parsed.relativeFile,
				message:
					`paramInformation[${i}] has no "#" key; skipping entry`,
			});
			continue;
		}
		const parsedKey = tryParseParamNumber(key);
		if (!parsedKey) {
			warnings.push({
				file: parsed.relativeFile,
				message:
					`paramInformation[${i}] has an unparseable "#" key "${key}"; skipping entry`,
			});
			continue;
		}

		const rawImport = typeof rawEntry["$import"] === "string"
			? rawEntry["$import"]
			: undefined;
		const entryImports: string[] = [];
		collectImportSpecifiers(rawEntry, entryImports);
		for (const specifier of new Set(entryImports)) {
			importUsages.push({ contextFile: file, specifier });
		}
		// Conditions are kept verbatim: we never guess which firmware they apply to
		const condition = typeof rawEntry["$if"] === "string"
			? rawEntry["$if"]
			: undefined;

		let templateFile: string | undefined;
		let templateName: string | undefined;
		if (rawImport) {
			const hashIndex = rawImport.indexOf("#");
			templateName = hashIndex >= 0
				? rawImport.slice(hashIndex + 1)
				: undefined;
			try {
				templateFile = await resolveImportPath(
					fs,
					file,
					rawImport,
					DEVICES_DIR,
				);
			} catch (error) {
				warnings.push({
					file: parsed.relativeFile,
					message:
						`Failed to resolve parameter ${key} import "${rawImport}": ${
							getErrorMessage(error)
						}`,
				});
			}
		}

		const semantics = extractSemantics(resolvedEntry);
		const structure = extractStructure(resolvedEntry);
		const semanticText = buildSemanticText(semantics);
		const bitmaskSuffix = parsedKey.valueBitMask != undefined
			? `[${num2hex(parsedKey.valueBitMask)}]`
			: "";

		records.push({
			kind: "parameter",
			id: `${parsed.relativeFile}#${parsedKey.parameter}${bitmaskSuffix}:${i}`,
			file,
			relativeFile: parsed.relativeFile,
			line: lineAtLocation(parsed, ["paramInformation", i]),
			parameterNumber: parsedKey.parameter,
			valueBitMask: parsedKey.valueBitMask,
			condition,
			rawImport,
			templateFile,
			templateName,
			device,
			semantics,
			structure,
			semanticHash: semanticHash(semanticText),
			semanticText,
		});
	}
	return records;
}

async function buildTemplateRecords(
	parsed: ParsedFile,
	file: string,
	warnings: CorpusWarning[],
): Promise<TemplateCorpusRecord[]> {
	const raw = parsed.raw;
	if (!isPlainObject(raw)) return [];

	const resolved = await tryResolveTemplates(parsed, file, warnings);
	if (!resolved) return [];

	const importSpecifierBase = `~/${toPosixPath(parsed.relativeFile)}`;
	const records: TemplateCorpusRecord[] = [];
	for (const templateName of Object.keys(raw)) {
		const rawValue = raw[templateName];
		if (!isPlainObject(rawValue)) continue;
		const resolvedValue = resolved[templateName];
		if (!isPlainObject(resolvedValue)) continue;
		if (!looksLikeParameterDefinition(resolvedValue)) continue;

		const semantics = extractSemantics(resolvedValue);
		const structure = extractStructure(resolvedValue);
		const definitionText = buildSemanticText(semantics);
		const readableName = templateName.replaceAll(/[._-]+/g, " ");
		const semanticText = definitionText
			? `Template: ${readableName}. ${definitionText}`
			: `Template: ${readableName}`;

		records.push({
			kind: "template",
			id: `${parsed.relativeFile}#${templateName}`,
			file,
			relativeFile: parsed.relativeFile,
			line: lineAtLocation(parsed, [templateName]),
			templateName,
			importSpecifier: `${importSpecifierBase}#${templateName}`,
			referenceCount: 0, // filled in by tallyTemplateReferences
			semantics,
			structure,
			semanticHash: semanticHash(semanticText),
			semanticText,
		});
	}
	return records;
}

const PARAMETER_PROPERTIES = new Set([
	"$purpose",
	"allowManualEntry",
	"allowed",
	"defaultValue",
	"description",
	"label",
	"maxValue",
	"minValue",
	"options",
	"readOnly",
	"recommendedValue",
	"unit",
	"unsigned",
	"valueSize",
	"writeOnly",
]);

function looksLikeParameterDefinition(
	definition: Record<string, unknown>,
): boolean {
	return Object.keys(definition).some((key) => PARAMETER_PROPERTIES.has(key));
}

async function tallyTemplateReferences(
	templates: TemplateCorpusRecord[],
	importUsages: { contextFile: string; specifier: string }[],
): Promise<void> {
	if (templates.length === 0 || importUsages.length === 0) return;

	const byKey = new Map<string, TemplateCorpusRecord>();
	for (const t of templates) byKey.set(`${t.file}#${t.templateName}`, t);

	// The same handful of specifiers repeats across thousands of device files
	// and resolution only depends on the containing directory, so memoize it
	const resolved = new Map<string, Promise<string | undefined>>();
	const resolveTarget = (contextFile: string, specifier: string) => {
		const cacheKey = `${dirname(contextFile)}\0${specifier}`;
		let promise = resolved.get(cacheKey);
		if (!promise) {
			promise = resolveImportPath(fs, contextFile, specifier, DEVICES_DIR)
				.catch(() => undefined);
			resolved.set(cacheKey, promise);
		}
		return promise;
	};

	const queue = new PQueue({ concurrency: 32 });
	await queue.addAll(
		importUsages.map(({ contextFile, specifier }) => async () => {
			const hashIndex = specifier.indexOf("#");
			if (hashIndex < 0) return; // whole-file imports don't target a specific template
			const templateName = specifier.slice(hashIndex + 1);
			const target = await resolveTarget(contextFile, specifier);
			if (!target) return;
			const record = byKey.get(`${target}#${templateName}`);
			if (record) record.referenceCount++;
		}),
	);
}

/**
 * Scans every device config and template file under `DEVICES_DIR`, resolving
 * `$import`s to build a flat, normalized corpus of parameter and template
 * records suitable for embedding and lexical/structural search. Individual
 * unresolvable/malformed files are skipped with a warning collected in the
 * result; the whole corpus is only aborted on unexpected (non-file-scoped)
 * errors.
 */
export async function buildCorpus(): Promise<Corpus> {
	clearTemplateCache();
	const files = await listConfigFiles();
	const warnings: CorpusWarning[] = [];
	const parameters: ParameterCorpusRecord[] = [];
	const templates: TemplateCorpusRecord[] = [];
	const importUsages: { contextFile: string; specifier: string }[] = [];

	const queue = new PQueue({ concurrency: 32 });
	await queue.addAll(files.map((relativeFile) => async () => {
		const file = join(DEVICES_DIR, relativeFile);
		let parsed: ParsedFile | { error: string };
		try {
			parsed = await parseFile(file, relativeFile);
		} catch (error) {
			warnings.push({
				file: relativeFile,
				message: `Failed to read file: ${getErrorMessage(error)}`,
			});
			return;
		}
		if ("error" in parsed) {
			warnings.push({ file: relativeFile, message: parsed.error });
			return;
		}

		try {
			if (isTemplateFile(relativeFile)) {
				const records = await buildTemplateRecords(
					parsed,
					file,
					warnings,
				);
				templates.push(...records);
			} else {
				const records = await buildParameterRecords(
					parsed,
					file,
					warnings,
					importUsages,
				);
				parameters.push(...records);
			}
		} catch (error) {
			warnings.push({
				file: relativeFile,
				message: `Unexpected error while indexing: ${
					getErrorMessage(error)
				}`,
			});
		}
	}));

	await tallyTemplateReferences(templates, importUsages);

	parameters.sort((a, b) => a.id.localeCompare(b.id));
	templates.sort((a, b) => a.id.localeCompare(b.id));

	return { parameters, templates, warnings };
}
