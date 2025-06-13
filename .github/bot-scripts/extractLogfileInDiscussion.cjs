// @ts-check

/// <reference path="types.d.ts" />

const markdownLinkRegex = /\[.*\]\((http.*?)\)/;
const codeBlockRegex = /`{3,4}(.*?)`{3,4}/s;

/**
 * @param {{github: Github, context: Context}} param
 */
async function main(param) {
	const { github, context } = param;

	const discussion = context.payload.discussion;
	if (!discussion) return;

	const body = discussion.body;
	const categorySlug = discussion.category.slug;

	console.log("categorySlug:", categorySlug);

	// Only check for logfiles in categories that require one
	if (categorySlug !== "request-support-investigate-issue") return;

	const logfileSectionHeader = "### Upload Logfile";

	console.log("secitonHeader found:", body.includes(logfileSectionHeader));

	// Check if this is a bug report which requires a logfile
	if (!body.includes(logfileSectionHeader)) return;

	const logfileSection = body.slice(
		body.indexOf(logfileSectionHeader) + logfileSectionHeader.length,
	);

	console.log("logfileSection:", logfileSection);

	const link = markdownLinkRegex.exec(logfileSection)?.[1]?.trim();
	const codeBlockContent = codeBlockRegex.exec(logfileSection)?.[1]?.trim();


	console.log("link:", link);
	console.log("codeBlockContent:", codeBlockContent);

	if (link) {
		let logFile;
		try {
			const resp = await fetch(link);
			if (!resp.ok) {
				console.error(
					`Failed to fetch logfile from ${link}:`,
					resp.statusText,
				);
				return "ERROR_FETCH";
			}
			logFile = await resp.text();
		} catch (e) {
			console.error(`Failed to fetch logfile from ${link}:`, e);
			return "ERROR_FETCH";
		}

		// limit to the last 250 lines
		return logFile.split("\n").slice(-250).join("\n");
	} else if (codeBlockContent) {
		if (codeBlockContent.split("\n").length > 20) {
			// This code block is too long and should be a logfile instead
			return "ERROR_CODE_BLOCK_TOO_LONG";
		}

		return codeBlockContent;
	}
}

module.exports = main;
