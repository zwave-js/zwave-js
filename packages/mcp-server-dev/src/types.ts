import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

export interface ToolHandler<TArgs = any> {
	name: string;
	description: string;
	inputSchema: Tool["inputSchema"];
	handler: (args: TArgs) => Promise<CallToolResult>;
}
