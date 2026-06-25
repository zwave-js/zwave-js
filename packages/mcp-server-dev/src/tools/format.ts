import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import spawn from "nano-spawn";
import { REPO_ROOT } from "../configEnv.js";
import type { ToolHandler } from "../types.js";

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
