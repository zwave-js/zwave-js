// @ts-check

/// <reference path="types.d.ts" />

/**
 * @param {{github: Github, context: Context, core: any}} param
 */
async function main(param) {
	const { context, core } = param;

	const body = context.payload.comment?.body;
	if (!body) {
		core.setFailed("No comment body provided");
		return;
	}

	const match =
		/analyze logfile\s+(?<url>https?:\/\/\S+)\s*\n?(?<query>[\s\S]*)/m.exec(
			body,
		);
	if (!match || !match.groups?.url) {
		core.setFailed(
			"No valid URL provided. Please use the format: @zwave-js-bot analyze logfile <url>",
		);
		return;
	}
	return {
		url: match.groups.url.trim(),
		query: (match.groups.query || "").trim(),
	};
}

module.exports = main;
