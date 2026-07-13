// @ts-check

/// <reference path="types.d.ts" />

const { extractLogfileContent } = require("./utils.cjs");

/**
 * @param {{github: Github, context: Context}} param
 */
async function main(param) {
	const { github, context } = param;

	const body = context.payload.issue.body;

	const logfileSectionHeader = "### Attach Driver Logfile";
	// Check if this is a bug report which requires a logfile
	if (!body.includes(logfileSectionHeader)) return;

	const logfileSection = body.slice(
		body.indexOf(logfileSectionHeader) + logfileSectionHeader.length,
	);

	return extractLogfileContent(logfileSection);
}

module.exports = main;
