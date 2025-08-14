// @ts-check

/// <reference path="types.d.ts" />

const fs = require("fs");
const tmp = require("tmp");

// Add at the top of the file
const AUTO_ANALYSIS_COMMENT_TAG = "<!-- AUTO_ANALYSIS_COMMENT_TAG -->";

/**
 * @param {{github: Github, context: Context, core: any}} param
 */
async function main(param) {
	const { github, context, core } = param;

	const logfileUrl = new URL(process.env.LOGFILE_URL);
	const query = process.env.QUERY;
	const isAutoAnalysis = process.env.IS_AUTO_ANALYSIS === "true";

	// For automatic analysis, check for existing auto-analysis comments
	if (isAutoAnalysis) {
		const existingComment = await findExistingAutoAnalysisComment(
			github,
			context,
		);
		if (existingComment) {
			console.log("Auto-analysis already exists, skipping...");
			return;
		}
	}

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

		let body;
		if (isAutoAnalysis) {
			// For automatic analysis, tell the user why the logfile was analyzed
			body = `
**Beep, boop! 🤖**

I've already taken a first look at your logfile. Maybe this anwers your question?
If you have further questions or think I made a mistake, please wait for a human to show up.

${analysisResult}

---

_AI can make mistakes. Always check important info._
${AUTO_ANALYSIS_COMMENT_TAG}
`.trim();
		} else {
			// Otherwise, just return the analysis result
			body = `${analysisResult}

---
_AI can make mistakes. Always check important info._`;
		}

		// Determine if this is a reply to a comment or a top-level discussion comment
		const mutationInput = {
			discussionId: context.payload.discussion.node_id,
			body,
		};
		if (context.payload.comment && !isAutoAnalysis) {
			// Manual invocation - reply to the comment thread
			mutationInput.replyToId = context.payload.comment.node_id;
		}

		await github.graphql(
			`
			mutation addDiscussionComment($discussionId: ID!, $body: String!, $replyToId: ID) {
				addDiscussionComment(input: {discussionId: $discussionId, body: $body, replyToId: $replyToId}) {
					comment {
						id
					}
				}
			}
			`,
			mutationInput,
		);
	} catch (error) {
		console.error("Analysis error:", error);
		core.setFailed(`Logfile analysis failed: ${error.message}`);
	}
}

// Add helper function for checking existing auto-analysis comments
async function findExistingAutoAnalysisComment(github, context) {
	const queryComments = /* GraphQL */ `
		query Discussion($owner: String!, $repo: String!, $number: Int!) {
			repository(owner: $owner, name: $repo) {
				discussion(number: $number) {
					comments(first: 100) {
						nodes {
							id
							author {
								login
							}
							body
						}
					}
				}
			}
		}
	`;

	const queryVars = {
		owner: context.repo.owner,
		repo: context.repo.repo,
		number: context.payload.discussion.number,
	};

	try {
		const queryResult = await github.graphql(queryComments, queryVars);
		const comments = queryResult.repository.discussion.comments.nodes;

		return comments.some(
			(c) =>
				c.author.login === "zwave-js-bot"
				&& c.body.includes(AUTO_ANALYSIS_COMMENT_TAG),
		);
	} catch (error) {
		console.error(
			"Error checking for existing auto-analysis comment:",
			error,
		);
		return false;
	}
}

module.exports = main;
