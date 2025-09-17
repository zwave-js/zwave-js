#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { McpToolRegistry } from "./registry.js";
import {
	autofixConfigTool,
	formatTool,
	lintConfigTool,
} from "./tools/index.js";

class DevMCPServer {
	private server: Server;
	private registry: McpToolRegistry;

	constructor() {
		this.server = new Server(
			{
				name: "zwave-dev",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			},
		);

		this.registry = new McpToolRegistry();
		this.registerTools();
		this.setupToolHandlers();
	}

	private registerTools() {
		// Register all available tools
		this.registry.register(formatTool);
		this.registry.register(autofixConfigTool);
		this.registry.register(lintConfigTool);
	}

	private setupToolHandlers() {
		this.server.setRequestHandler(ListToolsRequestSchema, () => {
			return {
				tools: this.registry.getAll().map((tool) => ({
					name: tool.name,
					description: tool.description,
					inputSchema: tool.inputSchema,
				})),
			};
		});

		this.server.setRequestHandler(
			CallToolRequestSchema,
			async (request) => {
				const { name, arguments: args } = request.params;

				const tool = this.registry.get(name);
				if (!tool) {
					throw new Error(`Unknown tool: ${name}`);
				}

				return await tool.handler(args);
			},
		);
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error("Z-Wave Development MCP server running on stdio");
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const server = new DevMCPServer();
	server.run().catch((error) => {
		console.error("Server error:", error);
		process.exit(1);
	});
}
