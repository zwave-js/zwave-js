import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import spawn from "nano-spawn";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolHandler } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the repository root (go up from packages/mcp-server-dev/build/tools to root)
const REPO_ROOT = resolve(__dirname, "../../../..");

export const TOOL_NAME = "autofix_config";

interface ESLintMessage {
	ruleId: string;
	severity: number;
	message: string;
	line: number;
	column: number;
	nodeType: string | null;
	messageId: string;
	endLine: number;
	endColumn: number;
	suggestions?: Array<{
		messageId: string;
		data: Record<string, string>;
		fix: {
			range: [number, number];
			text: string;
		};
		desc: string;
	}>;
}

interface ESLintResult {
	filePath: string;
	messages: ESLintMessage[];
	suppressedMessages: unknown[];
	errorCount: number;
	fatalErrorCount: number;
	warningCount: number;
	fixableErrorCount: number;
	fixableWarningCount: number;
	source: string;
	usedDeprecatedRules: unknown[];
}

interface AutofixConfigArgs {
	filename: string;
}

async function handleAutofixConfig(
	args: AutofixConfigArgs,
): Promise<CallToolResult> {
	const { filename } = args;

	if (!filename) {
		return {
			content: [
				{
					type: "text",
					text: "Error: filename argument is required",
				},
			],
			isError: true,
		};
	}

	let eslintResult;
	try {
		// Run ESLint on the file and apply all fixes that ESLint can apply automatically
		eslintResult = await spawn(
			"yarn",
			[
				"workspace",
				"@zwave-js/config",
				"run",
				"lint:config:eslint",
				"-f",
				"json",
				"--fix",
				filename,
			],
			{
				cwd: REPO_ROOT,
				stdio: "pipe",
			},
		);
	} catch (error: any) {
		// ESLint returns non-zero exit code when there are issues,
		// but we still want to parse the output
		eslintResult = error;
	}

	let results: ESLintResult[];
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

	// Now find all messages that have suggestions, which are likely created by @zwave-js/... rules
	// and apply those suggestions to the file
	const fileResult = results[0];
	const errorsWithSuggestions = fileResult.messages.filter(
		(msg) =>
			msg.severity === 2
			&& msg.suggestions
			&& msg.suggestions.length > 0,
	);

	if (errorsWithSuggestions.length === 0) {
		return {
			content: [
				{
					type: "text",
					text:
						`No fixable errors found. Total messages: ${fileResult.messages.length}`,
				},
			],
		};
	}

	// Read the original file
	const originalContent = await readFile(filename, "utf-8");

	// Sort errors by position (last to first) to avoid range shifting
	errorsWithSuggestions.sort((a, b) => {
		if (a.line !== b.line) {
			return b.line - a.line;
		}
		return b.column - a.column;
	});

	let modifiedContent = originalContent;
	const appliedFixes: string[] = [];

	// Apply fixes from last to first
	for (const error of errorsWithSuggestions) {
		const suggestion = error.suggestions![0]; // Use the first suggestion
		const [start, end] = suggestion.fix.range;
		const fixText = suggestion.fix.text;

		// Apply the fix
		modifiedContent = modifiedContent.slice(0, start)
			+ fixText
			+ modifiedContent.slice(end);

		appliedFixes.push(
			`Line ${error.line}: ${error.message} -> ${suggestion.desc}`,
		);
	}

	// Write the modified content back to the file
	await writeFile(filename, modifiedContent, "utf-8");

	return {
		content: [
			{
				type: "text",
				text:
					`Applied ${appliedFixes.length} automatic fixes to ${filename}:\n\n${
						appliedFixes.join("\n")
					}`,
			},
		],
	};
}

export const autofixConfigTool: ToolHandler<AutofixConfigArgs> = {
	name: TOOL_NAME,
	description: "Automatically fix ESLint errors in a configuration file",
	inputSchema: {
		type: "object",
		properties: {
			filename: {
				type: "string",
				description: "Absolute path to the configuration file to fix",
			},
		},
		required: ["filename"],
	},
	handler: handleAutofixConfig,
};
