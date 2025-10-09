// @ts-check

/// <reference path="types.d.ts" />

const { extractLogfileSection, extractLogfileUrl } = require("./utils.cjs");

/**
 * @param {{github: Github, context: Context}} param
 */
async function main(param) {
	const { context } = param;

	const discussion = context.payload.discussion;
	if (!discussion) {
		throw new Error("No discussion found in context");
	}

	const logfileSection = extractLogfileSection(discussion.body);
	return extractLogfileUrl(logfileSection);
}

module.exports = main;
