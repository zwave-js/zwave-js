import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { clearTemplateCache, resolveImportPath } from "@zwave-js/config";
import { readFile } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import PQueue from "p-queue";
import {
	getPropertyValueFromNode,
	nodeIsPropertyNameOrValue,
} from "../configDoc/astUtils.js";
import { parseSymbols } from "../configDoc/configDocument.js";
import { DEVICES_DIR, fs } from "../configEnv.js";
import { listConfigFiles } from "../semantic/corpus.js";
import type { ToolHandler } from "../types.js";
import { errorResult, textResult } from "./results.js";

export const TOOL_NAME = "find_template_references";

interface FindTemplateReferencesArgs {
	templateFile: string;
	templateName: string;
}

async function handleFindTemplateReferences(
	args: FindTemplateReferencesArgs,
): Promise<CallToolResult> {
	const { templateName } = args;
	if (!args.templateFile) {
		return errorResult("Error: templateFile argument is required");
	}
	if (!templateName) {
		return errorResult("Error: templateName argument is required");
	}
	const templateFile = normalize(resolve(args.templateFile));

	clearTemplateCache();

	try {
		const files = (await listConfigFiles())
			.map((f) => join(DEVICES_DIR, f));
		const refs: { file: string; line: number; column: number }[] = [];

		// Reading and parsing the whole device corpus dominates the runtime,
		// so process the files concurrently
		const queue = new PQueue({ concurrency: 32 });
		await queue.addAll(files.map((file) => async () => {
			const text = await readFile(file, "utf8");
			// Cheap pre-filter: skip files that can't reference the template
			if (!text.includes(templateName)) return;

			const { document, json, symbols } = parseSymbols(file, text);
			for (const s of symbols) {
				if (s.name !== "$import") continue;

				const node = json.getNodeFromOffset(
					document.offsetAt(s.location.range.start),
				);
				if (!nodeIsPropertyNameOrValue(node)) continue;
				const value = getPropertyValueFromNode(node);
				if (typeof value !== "string") continue;

				// The selector must match the template name we're looking for
				const hashIndex = value.indexOf("#");
				if (hashIndex < 0) continue;
				if (value.slice(hashIndex + 1) !== templateName) continue;

				// ...and the import must resolve to the template file
				const target = await resolveImportPath(
					fs,
					file,
					value,
					DEVICES_DIR,
				);
				if (!target || normalize(target) !== templateFile) continue;

				refs.push({
					file,
					line: s.location.range.start.line + 1,
					column: s.location.range.start.character + 1,
				});
			}
		}));

		if (refs.length === 0) {
			return textResult(
				`No references to "${templateName}" (${templateFile}) found.`,
			);
		}

		refs.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
		return textResult(
			`${refs.length} reference${
				refs.length === 1 ? "" : "s"
			} to "${templateName}":\n\n`
				+ refs
					.map((r) => `${r.file}:${r.line}:${r.column}`)
					.join("\n"),
		);
	} catch (error: any) {
		return errorResult(`Failed to find references: ${String(error)}`);
	}
}

export const findTemplateReferencesTool: ToolHandler<
	FindTemplateReferencesArgs
> = {
	name: TOOL_NAME,
	description:
		"Find all $import references to a template across every device config "
		+ "file. Given the template file and the top-level template name, "
		+ "returns each importing file with its line/column.",
	inputSchema: {
		type: "object",
		properties: {
			templateFile: {
				type: "string",
				description:
					"Absolute path to the template file defining the template, "
					+ "e.g. .../config/devices/templates/master_template.json",
			},
			templateName: {
				type: "string",
				description:
					"The top-level template key to find references to, e.g. "
					+ "\"base_enable_disable\"",
			},
		},
		required: ["templateFile", "templateName"],
	},
	handler: handleFindTemplateReferences,
};
