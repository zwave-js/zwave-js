// @ts-check

/// <reference path="types.d.ts" />

const fs = require("fs");
const tmp = require("tmp");

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
		const tempFile = tmp.fileSync();
		fs.writeFileSync(tempFile.name, logContent);
		console.log(`Logfile written to temporary file: ${tempFile.name}`);

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
			const chunk of analyzer.analyzeLogFile(tempFile.name, analysisQuery)
		) {
			analysisResult += chunk;
		}

		// Post the results to discussion comment
		let body = `${analysisResult}\n\n`;
		body += `---\n`;
		body += `_AI can make mistakes. Always check important info._`;

		await github.graphql(
			`
			mutation addDiscussionComment($discussionId: ID!, $body: String!) {
				addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
					comment {
						id
					}
				}
			}
			`,
			{
				discussionId: context.payload.discussion.node_id,
				body: body,
			},
		);
	} catch (error) {
		console.error("Analysis error:", error);
		core.setFailed(`Logfile analysis failed: ${error.message}`);
	}
}

module.exports = main;
