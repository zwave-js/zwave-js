#!/usr/bin/env node

import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	RootsListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
	type Checkout,
	LAUNCH_ROOT,
	findCheckoutContaining,
	resolveToolCheckout,
} from "./checkout.js";
import { McpToolRegistry } from "./registry.js";
import type { ConsentPrompt, ElicitConsentFn } from "./semantic/embedding.js";
import { SemanticSearchService } from "./semantic/service.js";
import {
	autofixConfigTool,
	createFindSimilarParametersTool,
	createSearchParameterDefinitionsTool,
	createSuggestParameterPurposeTool,
	findTemplateDefinitionTool,
	findTemplateReferencesTool,
	formatTool,
	lintConfigTool,
	resolveImportTool,
	resolveParamTool,
} from "./tools/index.js";
import { errorResult } from "./tools/results.js";

const PATH_ARGUMENTS = ["filename", "templateFile"];

const ROOT_ARGUMENT = {
	type: "string",
	description:
		"Optional path to the zwave-js checkout (e.g. a git worktree) to work "
		+ "in. Defaults to the checkout containing the file argument, then the "
		+ "client's workspace.",
};

class DevMCPServer {
	private server: Server;
	private registry: McpToolRegistry;
	private semanticSearch: SemanticSearchService;
	private workspaceCheckout: Promise<Checkout | undefined> | undefined;

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

		// Elicitation is a *client* capability the server merely requests via
		// server.elicitInput(); it must not be declared in the server's own
		// capabilities above. Whether it's actually supported is only known
		// after the client connects and advertises its capabilities, so this
		// getter is re-evaluated lazily, on the first local model download
		// that actually needs a consent decision.
		this.semanticSearch = new SemanticSearchService({
			getElicit: () => this.getElicitConsentFn(),
		});

		this.registry = new McpToolRegistry();
		this.registerTools();
		this.setupToolHandlers();
	}

	private getElicitConsentFn(): ElicitConsentFn | undefined {
		if (!this.server.getClientCapabilities()?.elicitation) return undefined;
		return async (prompt: ConsentPrompt) => {
			const result = await this.server.elicitInput({
				message:
					`The local semantic search model "${prompt.modelId}" `
					+ `(revision ${prompt.revision}) is not cached yet. Downloading `
					+ `it from ${prompt.source} (license: ${prompt.license}) will `
					+ `fetch approximately ${prompt.approxSizeMb} MB and store it `
					+ `under ${prompt.cacheDir}. Approve the download?`,
				requestedSchema: {
					type: "object",
					properties: {
						decision: {
							type: "string",
							title: "Model download",
							description:
								`Download and cache ${prompt.modelId}@${prompt.revision} `
								+ `(~${prompt.approxSizeMb} MB, ${prompt.license})`,
							enum: ["decline", "approve"],
							enumNames: [
								"Do not download",
								"Download and cache model",
							],
							default: "decline",
						},
					},
					required: ["decision"],
				},
			});
			if (result.action === "cancel") return { decision: "cancel" };
			return {
				decision:
					result.action === "accept"
					&& result.content?.decision === "approve"
						? "approve"
						: "decline",
			};
		};
	}

	/** Returns the first zwave-js checkout among the client's MCP roots */
	private getWorkspaceCheckout(): Promise<Checkout | undefined> {
		this.workspaceCheckout ??= this.findWorkspaceCheckout();
		return this.workspaceCheckout;
	}

	private async findWorkspaceCheckout(): Promise<Checkout | undefined> {
		if (!this.server.getClientCapabilities()?.roots) return undefined;
		let roots: { uri: string }[];
		try {
			({ roots } = await this.server.listRoots(undefined, {
				timeout: 5000,
			}));
		} catch (error) {
			console.error("Failed to list the client's roots:", error);
			// Ask again on the next call
			this.workspaceCheckout = undefined;
			return undefined;
		}
		for (const { uri } of roots) {
			if (!uri.startsWith("file://")) continue;
			const checkout = await findCheckoutContaining(fileURLToPath(uri));
			if (checkout) return checkout;
		}
		return undefined;
	}

	private registerTools() {
		// Register all available tools
		this.registry.register(formatTool);
		this.registry.register(autofixConfigTool);
		this.registry.register(lintConfigTool);
		this.registry.register(resolveParamTool);
		this.registry.register(resolveImportTool);
		this.registry.register(findTemplateDefinitionTool);
		this.registry.register(findTemplateReferencesTool);
		this.registry.register(
			createSearchParameterDefinitionsTool(this.semanticSearch),
		);
		this.registry.register(
			createFindSimilarParametersTool(this.semanticSearch),
		);
		this.registry.register(
			createSuggestParameterPurposeTool(this.semanticSearch),
		);
	}

	private setupToolHandlers() {
		this.server.setNotificationHandler(
			RootsListChangedNotificationSchema,
			() => {
				this.workspaceCheckout = undefined;
			},
		);

		this.server.setRequestHandler(ListToolsRequestSchema, () => {
			return {
				tools: this.registry.getAll().map((tool) => ({
					name: tool.name,
					description: tool.description,
					inputSchema: {
						...tool.inputSchema,
						properties: {
							...tool.inputSchema.properties,
							root: ROOT_ARGUMENT,
						},
					},
					annotations: tool.annotations,
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

				const { root, ...toolArgs } = args ?? {};
				const paths: Record<string, string> = {};
				for (const key of PATH_ARGUMENTS) {
					const value = toolArgs[key];
					if (typeof value === "string" && value) paths[key] = value;
				}

				// Tools must only read and write device config files
				const resolved = await resolveToolCheckout({
					root: typeof root === "string" && root ? root : undefined,
					paths,
					getWorkspaceCheckout: () => this.getWorkspaceCheckout(),
					fallbackRoot: LAUNCH_ROOT,
				});
				if ("error" in resolved) return errorResult(resolved.error);

				return await tool.handler(
					{ ...toolArgs, ...resolved.paths },
					{ checkout: resolved.checkout },
				);
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
