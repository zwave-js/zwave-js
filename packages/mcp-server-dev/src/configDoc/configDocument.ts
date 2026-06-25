import { resolveTemplateImport } from "@zwave-js/config";
import { readTextFile } from "@zwave-js/shared";
import type { ReadFile, ReadFileSystemInfo } from "@zwave-js/shared/bindings";
import { pathToFileURL } from "node:url";
import {
	type ASTNode,
	type JSONDocument,
	type SymbolInformation,
	getLanguageService,
} from "vscode-json-languageservice";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
	getPropertyValueFromNode,
	nodeIsPropertyNameOrValue,
} from "./astUtils.js";

const ls = getLanguageService({});

export interface ParsedSymbols {
	/** The text document the JSON document is based on */
	document: TextDocument;
	/** The parsed JSON document */
	json: JSONDocument;
	/** All symbols in the document */
	symbols: SymbolInformation[];
}

/** Parses a config/template file's text into a JSON AST and its symbols */
export function parseSymbols(filename: string, text: string): ParsedSymbols {
	const document = TextDocument.create(
		pathToFileURL(filename).toString(),
		"jsonc",
		1,
		text,
	);
	const json = ls.parseJSONDocument(document);
	const symbols = ls.findDocumentSymbols(document, json);
	return { document, json, symbols };
}

/**
 * Headless equivalent of the config editor extension's ConfigDocument: parsed
 * JSON AST plus the resolved templates referenced via `$import`. Built from a
 * file on disk instead of a vscode.TextDocument.
 */
export class ConfigDocument {
	public constructor(
		/** The text document the JSON document is based on */
		public readonly text: TextDocument,
		/** The parsed JSON document */
		public readonly json: JSONDocument,
		/** Resolved template imports (specifier => template) */
		public readonly templates: Record<string, Record<string, unknown>>,
		/** All symbols in the document */
		public readonly symbols: SymbolInformation[],
	) {}

	public getNodeFromSymbol(symbol: SymbolInformation): ASTNode | undefined {
		return this.json.getNodeFromOffset(
			this.text.offsetAt(symbol.location.range.start),
		);
	}
}

/**
 * Parses the given config file and resolves all referenced templates.
 * `text` may be passed to analyze in-memory content instead of reading from
 * disk (the on-disk file is still used to resolve template imports).
 */
export async function parseConfigDocument(
	fs: ReadFileSystemInfo & ReadFile,
	filename: string,
	rootDirs?: string | string[],
	text?: string,
): Promise<ConfigDocument> {
	const fileContent = text ?? await readTextFile(fs, filename, "utf8");
	const {
		document: textDoc,
		json: jsonDoc,
		symbols,
	} = parseSymbols(filename, fileContent);

	// Collect the distinct $import specifiers in the document
	const importSpecifiers = new Set(
		symbols
			.filter((s) => s.name === "$import")
			.map((s) =>
				jsonDoc.getNodeFromOffset(
					textDoc.offsetAt(s.location.range.start),
				)
			)
			.filter((n): n is ASTNode => !!n)
			.map((n) =>
				nodeIsPropertyNameOrValue(n)
					? getPropertyValueFromNode(n)
					: undefined
			)
			.filter((s): s is string => typeof s === "string"),
	);

	const templates: Record<string, Record<string, unknown>> = {};
	await Promise.all(
		[...importSpecifiers].map(async (spec) => {
			try {
				templates[spec] = await resolveTemplateImport(
					fs,
					filename,
					spec,
					rootDirs,
				);
			} catch {
				// Unresolvable imports are simply absent from the map; the
				// diagnostics skip any specifier without a resolved template.
			}
		}),
	);

	return new ConfigDocument(textDoc, jsonDoc, templates, symbols);
}
