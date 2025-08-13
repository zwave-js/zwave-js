// @ts-check

/// <reference path="types.d.ts" />

const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * @param {{github: Github, context: Context, core: any}} param
 */
async function main(param) {
	const { github, context, core } = param;

	const logfileUrl = new URL(process.env.LOGFILE_URL);
	const query = process.env.QUERY;

	try {
		// Download the logfile using fetch
		console.log(`Downloading logfile from: ${logfileUrl}`);
		const response = await fetch(logfileUrl);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const logContent = await response.text();

		if (!logContent || logContent.trim().length === 0) {
			throw new Error("Downloaded logfile is empty or invalid");
		}

		// Write to temporary file
		const tempFilePath = path.join(
			os.tmpdir(),
			`zwave-log-${Date.now()}.txt`,
		);
		fs.writeFileSync(tempFilePath, logContent);
		console.log(`Logfile written to temporary file: ${tempFilePath}`);

		// Check if API key is available
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			console.error(
				"GEMINI_API_KEY is not configured. Log analysis requires an API key.",
			);
			core.setFailed("GEMINI_API_KEY is not configured");
			return;
		}

		// Import the log analyzer (ESM module)
		const { ZWaveLogAnalyzer } = await import("@zwave-js/log-analyzer");

		// Initialize the analyzer
		const analyzer = new ZWaveLogAnalyzer(apiKey);

		// Run the analysis
		console.log("Analyzing logfile...");
		let analysisResult = "";
		const analysisQuery = query
			|| "Analyze this Z-Wave JS log file and provide insights about any issues, errors, or notable events.";

		for await (
			const chunk of analyzer.analyzeLogFile(tempFilePath, analysisQuery)
		) {
			analysisResult += chunk;
		}

		// Post the results
		let body = `${analysisResult}\n\n`;
		body += `---\n`;
		body += `_AI can make mistakes. Always check important info._`;

		await github.rest.issues.createComment({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.issue.number,
			body: body,
		});
	} catch (error) {
		console.error("Analysis error:", error);

		let errorMessage = "❌ Error: Logfile analysis failed.";
		if (error.message) {
			errorMessage += `\n\n**Error details:**\n${error.message}`;
		}

		await github.rest.issues.createComment({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.issue.number,
			body: errorMessage,
		});
	}
}

module.exports = main;
