import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

import type { Checkout } from "./checkout.js";

export interface ToolContext {
	/** The checkout this tool call works in */
	checkout: Checkout;
}

export interface ToolHandler<TArgs = any> {
	name: string;
	description: string;
	inputSchema: Tool["inputSchema"];
	annotations: NonNullable<Tool["annotations"]>;
	handler: (args: TArgs, context: ToolContext) => Promise<CallToolResult>;
}
