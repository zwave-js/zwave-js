import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SemanticSearchService } from "../semantic/service.js";
import type { ToolHandler } from "../types.js";
import { clampLimit, invalidArgument, jsonResult } from "./results.js";
import { handleSemanticError } from "./semanticErrors.js";

export const TOOL_NAME = "find_similar_parameters";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface FindSimilarParametersArgs {
	filename?: string;
	parameter?: number;
	valueBitMask?: number;
	firmwareVersion?: string;
	limit?: number;
}

/**
 * Creates the `find_similar_parameters` tool handler, bound to a shared
 * `SemanticSearchService` instance.
 */
export function createFindSimilarParametersTool(
	service: SemanticSearchService,
): ToolHandler<FindSimilarParametersArgs> {
	async function handle(
		args: FindSimilarParametersArgs = {},
	): Promise<CallToolResult> {
		const { filename, parameter, valueBitMask, firmwareVersion } = args;
		if (!filename) {
			return invalidArgument("filename argument is required");
		}
		if (typeof parameter !== "number") {
			return invalidArgument("parameter (number) argument is required");
		}

		const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);

		try {
			const result = await service.findSimilar(
				filename,
				parameter,
				valueBitMask,
				firmwareVersion,
				limit,
			);
			return jsonResult(result);
		} catch (error) {
			return handleSemanticError(error);
		}
	}

	return {
		name: TOOL_NAME,
		description:
			"Finds device config parameters and reusable templates that are "
			+ "semantically and structurally similar to a specific existing "
			+ "parameter. Use this while authoring or reviewing a device config "
			+ "parameter to check how equivalent parameters are worded/typed "
			+ "elsewhere, to discover a template that could be imported instead "
			+ "of duplicating fields, or to get evidence-based $purpose tag "
			+ "suggestions. Returns structural differences (value size, range, "
			+ "options, etc.) against each match, and never includes the query "
			+ "parameter itself in its own results. Uses the bundled local embedding "
			+ "model; the response may report "
			+ "model_download_consent_required instead of results if the local "
			+ "model needs a one-time download that the client cannot confirm.",
		inputSchema: {
			type: "object",
			properties: {
				filename: {
					type: "string",
					description: "Absolute path to the device config file",
				},
				parameter: {
					type: "number",
					description: "The parameter number to compare against",
				},
				valueBitMask: {
					type: "number",
					description:
						"Optional value bitmask for partial parameters (as a "
						+ "number, e.g. 255 for 0xff)",
				},
				firmwareVersion: {
					type: "string",
					description:
						"Optional firmware version (e.g. \"1.5\") to disambiguate "
						+ "which $if-conditional variant of the parameter to use "
						+ "as the query, fully evaluating conditionals the same "
						+ "way resolve_config_param does",
				},
				limit: {
					type: "number",
					description:
						`Maximum number of similar parameters/templates to return `
						+ `(default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`,
				},
			},
			required: ["filename", "parameter"],
		},
		handler: handle,
	};
}
