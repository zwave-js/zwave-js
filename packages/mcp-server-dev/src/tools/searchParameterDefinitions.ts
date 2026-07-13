import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SemanticSearchService } from "../semantic/service.js";
import type { ToolHandler } from "../types.js";
import { clampLimit, invalidArgument, jsonResult } from "./results.js";
import { handleSemanticError } from "./semanticErrors.js";

export const TOOL_NAME = "search_parameter_definitions";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface SearchParameterDefinitionsArgs {
	query?: string;
	manufacturer?: string;
	purpose?: string;
	kind?: "parameter" | "template" | "both";
	limit?: number;
}

/**
 * Creates the `search_parameter_definitions` tool handler, bound to a shared
 * `SemanticSearchService` instance (which owns corpus building, the embedding
 * cache, and provider/consent state).
 */
export function createSearchParameterDefinitionsTool(
	service: SemanticSearchService,
): ToolHandler<SearchParameterDefinitionsArgs> {
	async function handle(
		args: SearchParameterDefinitionsArgs = {},
	): Promise<CallToolResult> {
		const { query, manufacturer, purpose, kind } = args;
		if (!query || typeof query !== "string" || query.trim() === "") {
			return invalidArgument(
				"query (non-empty string) argument is required",
			);
		}
		if (
			kind != undefined
			&& kind !== "parameter"
			&& kind !== "template"
			&& kind !== "both"
		) {
			return invalidArgument(
				`kind must be one of "parameter", "template", "both" (got "${
					String(kind)
				}")`,
			);
		}

		const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);

		try {
			const result = await service.search(
				query,
				{ manufacturer, purpose, kind },
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
			"Semantic search over every device config parameter and reusable "
			+ "template in the Z-Wave JS config database (~17k parameters). Use "
			+ "this when you need to find existing parameters/templates by "
			+ "meaning rather than exact text, e.g. before adding a new "
			+ "parameter (to check for a reusable template or established "
			+ "wording/units/purpose tag), or when researching how similar "
			+ "devices expose a feature. Combines embedding similarity with "
			+ "lexical and structural matching; results for parameters and "
			+ "templates are returned separately. Uses the bundled local embedding "
			+ "model; if it needs a one-time download, the response may report "
			+ "model_download_consent_required instead of results.",
		inputSchema: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description:
						"Free-text description of the parameter/template to find, "
						+ "e.g. \"dimming ramp rate manual control\"",
				},
				manufacturer: {
					type: "string",
					description:
						"Optional filter: only consider parameters from devices "
						+ "whose manufacturer name or ID contains this text",
				},
				purpose: {
					type: "string",
					description:
						"Optional filter: only consider entries with this exact "
						+ "$purpose tag, e.g. \"reporting_interval.temperature\"",
				},
				kind: {
					type: "string",
					enum: ["parameter", "template", "both"],
					description:
						"Restrict results to concrete parameters, reusable "
						+ "templates, or both (default: both)",
				},
				limit: {
					type: "number",
					description:
						`Maximum number of results per kind (default ${DEFAULT_LIMIT}, `
						+ `max ${MAX_LIMIT})`,
				},
			},
			required: ["query"],
		},
		handler: handle,
	};
}
