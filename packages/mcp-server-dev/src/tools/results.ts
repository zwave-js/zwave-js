import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function errorResult(text: string): CallToolResult {
	return { content: [{ type: "text", text }], isError: true };
}

export function textResult(text: string): CallToolResult {
	return { content: [{ type: "text", text }] };
}

export function jsonResult(value: unknown): CallToolResult {
	return {
		content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
	};
}

/** Clamps a user-supplied result limit to [1, max], falling back to `def` */
export function clampLimit(
	limit: number | undefined,
	def: number,
	max: number,
): number {
	if (limit == undefined || !Number.isFinite(limit)) return def;
	return Math.max(1, Math.min(max, Math.floor(limit)));
}

export function invalidArgument(message: string): CallToolResult {
	return jsonErrorResult({
		status: "error",
		code: "invalid_argument",
		message,
	});
}

/** Like `jsonResult`, but flagged as an error result so structured, machine-readable
 * error details (e.g. an error `code` an agent can branch on) survive alongside a
 * human-readable message, instead of collapsing to plain text. */
export function jsonErrorResult(value: unknown): CallToolResult {
	return {
		content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
		isError: true,
	};
}
