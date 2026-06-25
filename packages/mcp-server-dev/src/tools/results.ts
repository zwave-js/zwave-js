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
