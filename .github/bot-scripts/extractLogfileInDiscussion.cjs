// @ts-check

/// <reference path="types.d.ts" />

const { extractLogfileSection, extractLogfileContent } = require("./utils.cjs");

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

	console.log("sectionHeader found:", body.includes(logfileSectionHeader));

	// Check if this is a bug report which requires a logfile
	if (!body.includes(logfileSectionHeader)) return;

	try {
		const logfileSection = extractLogfileSection(body);
		return await extractLogfileContent(logfileSection);
	} catch (error) {
		console.error("Error extracting logfile:", error);
		return null;
	}
}

module.exports = main;
