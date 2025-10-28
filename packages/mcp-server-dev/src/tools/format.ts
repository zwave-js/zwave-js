import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import spawn from "nano-spawn";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolHandler } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the repository root (go up from packages/mcp-server-dev/build/tools to root)
const REPO_ROOT = resolve(__dirname, "../../../..");

export const TOOL_NAME = "format";

async function handleFormat(): Promise<CallToolResult> {
	try {
		const result = await spawn("yarn", ["fmt"], {
			cwd: REPO_ROOT,
			stdio: "pipe",
		});

		return {
			content: [
				{
					type: "text",
					text:
						`Code formatting completed successfully.\n\nOutput:\n${result.stdout}${
							result.stderr
								? `\nStderr:\n${result.stderr}`
								: ""
						}`,
				},
			],
		};
	} catch (error: any) {
		return {
			content: [
				{
					type: "text",
					text:
						`Code formatting failed: ${error.message}\n\nOutput:\n${
							error.stdout || ""
						}${
							error.stderr
								? `\nStderr:\n${error.stderr}`
								: ""
						}`,
				},
			],
			isError: true,
		};
	}
}

export const formatTool: ToolHandler = {
	name: TOOL_NAME,
	description: "Format all code according to the project's standards",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
	handler: handleFormat,
};
