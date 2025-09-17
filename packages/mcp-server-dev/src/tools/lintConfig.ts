import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { execa } from "execa";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolHandler } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the repository root (go up from packages/mcp-server-dev/build/tools to root)
const REPO_ROOT = resolve(__dirname, "../../../..");
// const CONFIG_PACKAGE_DIR = resolve(REPO_ROOT, "packages/config");

export const TOOL_NAME = "lint_config";

interface LintConfigArgs {
	filename?: string;
}

async function handleLintConfig(args: LintConfigArgs): Promise<CallToolResult> {
	const { filename } = args;

	// Check in two steps:
	// 1. Run the custom linting script
	// 2. If that succeeds, run ESLint on the specific file

	try {
		const result = await execa(
			"yarn",
			[
				"workspace",
				"@zwave-js/config",
				"run",
				"lint:config:custom",
			],
			{
				cwd: REPO_ROOT,
				stdio: "pipe",
				reject: false, // Don't throw on non-zero exit codes
			},
		);

		if (result.exitCode !== 0) {
			return {
				content: [
					{
						type: "text",
						text:
							`Custom linting script failed:\n\n${result.stdout}\n\nStderr:\n${result.stderr}`,
					},
				],
				isError: true,
			};
		}
	} catch (error: any) {
		return {
			content: [
				{
					type: "text",
					text:
						`Semantic check failed: ${error.message}\n\nOutput:\n${
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

	if (!filename) {
		return {
			content: [
				{
					type: "text",
					text: "No filename provided. Skipping ESLint check.",
				},
			],
			isError: false,
		};
	}

	try {
		const eslintResult = await execa(
			"yarn",
			[
				"workspace",
				"@zwave-js/config",
				"run",
				"lint:config:eslint",
				"-f",
				"json",
				filename,
			],
			{
				cwd: REPO_ROOT,
				stdio: "pipe",
				reject: false, // Don't throw on non-zero exit codes
			},
		);

		let results: any[];
		try {
			results = JSON.parse(eslintResult.stdout);
		} catch (parseError) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to parse ESLint output: ${
							String(parseError)
						}\n\nRaw output:\n${eslintResult.stdout}\n\nStderr:\n${eslintResult.stderr}`,
					},
				],
				isError: true,
			};
		}

		if (!results || results.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No ESLint results found for the file.",
					},
				],
			};
		}

		const issues = results.flatMap((result) => result.messages);
		if (issues.length === 0) {
			return {
				content: [
					{
						type: "text",
						text:
							"No linting issues found in the configuration file.",
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Linting issues found in ${filename}:\n\n`
						+ issues.map((issue) => {
							return `- ${issue.message} (line ${issue.line}, column ${issue.column})`;
						}).join("\n"),
				},
			],
			isError: true,
		};
	} catch (error: any) {
		return {
			content: [
				{
					type: "text",
					text: `ESLint check failed: ${error.message}\n\nOutput:\n${
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

export const lintConfigTool: ToolHandler = {
	name: TOOL_NAME,
	description: "Check semantic correctness of configuration files",
	inputSchema: {
		type: "object",
		properties: {
			filename: {
				type: "string",
				description: "Absolute path to the configuration file to lint",
			},
		},
		required: [],
	},
	handler: handleLintConfig,
};
