import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SemanticSearchService } from "../semantic/service.js";
import type { ToolHandler } from "../types.js";
import { clampLimit, invalidArgument, jsonResult } from "./results.js";
import { handleSemanticError } from "./semanticErrors.js";

export const TOOL_NAME = "suggest_parameter_purpose";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

interface SuggestParameterPurposeArgs {
	query?: string;
	filename?: string;
	parameter?: number;
	valueBitMask?: number;
	firmwareVersion?: string;
	limit?: number;
}

export function createSuggestParameterPurposeTool(
	service: SemanticSearchService,
): ToolHandler<SuggestParameterPurposeArgs> {
	async function handle(
		args: SuggestParameterPurposeArgs = {},
	): Promise<CallToolResult> {
		const hasQuery = typeof args.query === "string"
			&& args.query.trim().length > 0;
		const hasParameter = typeof args.filename === "string"
			&& args.filename.length > 0
			&& typeof args.parameter === "number";
		if (hasQuery === hasParameter) {
			return invalidArgument(
				"Provide either a non-empty query or filename plus parameter, but not both.",
			);
		}

		try {
			const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);
			const result = hasQuery
				? await service.suggestPurposesForText(args.query!, limit)
				: await service.suggestPurposesForParameter(
					args.filename!,
					args.parameter!,
					args.valueBitMask,
					args.firmwareVersion,
					limit,
				);
			return jsonResult(result);
		} catch (error) {
			return handleSemanticError(error);
		}
	}

	return {
		name: TOOL_NAME,
		description: "Suggest existing $purpose values from prototypes "
			+ "learned from tagged config parameters. Use this when authoring or "
			+ "reviewing a parameter whose semantic purpose is unknown. Accepts "
			+ "either a free-text description or a concrete config parameter. "
			+ "Returns ranked purposes with similarity, sample size, confidence, "
			+ "and representative parameter definitions; suggestions are evidence "
			+ "for review and are never applied automatically.",
		inputSchema: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description:
						"Free-text parameter meaning, label, description, unit, "
						+ "and notable option labels",
				},
				filename: {
					type: "string",
					description:
						"Absolute device config path; use with parameter instead of query",
				},
				parameter: {
					type: "number",
					description: "Parameter number in filename",
				},
				valueBitMask: {
					type: "number",
					description:
						"Optional numeric bit mask for a partial parameter",
				},
				firmwareVersion: {
					type: "string",
					description:
						"Optional firmware version used to resolve conditional variants",
				},
				limit: {
					type: "number",
					description:
						`Maximum suggestions (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`,
				},
			},
		},
		handler: handle,
	};
}
