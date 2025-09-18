import type { ToolHandler } from "./types.js";

export class McpToolRegistry {
	private tools = new Map<string, ToolHandler>();

	register<TArgs = any>(tool: ToolHandler<TArgs>): void {
		this.tools.set(tool.name, tool);
	}

	getAll(): ToolHandler[] {
		return Array.from(this.tools.values());
	}

	get(name: string): ToolHandler | undefined {
		return this.tools.get(name);
	}
}
