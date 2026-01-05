const path = require("path");
const repoRoot = path.join(__dirname, "../..");

/**
 * @param {string} filename
 * @param {string} sourceText
 */
function formatWithDprint(filename, sourceText) {
	const { formatWithDprint: format } = require("@zwave-js/fmt");
	return format(repoRoot, filename, sourceText);
}

const urls = {
	styleGuide:
		"https://zwave-js.github.io/zwave-js/#/config-files/style-guide",
};

// Comment tags for bot analysis comments
const AUTO_ANALYSIS_COMMENT_TAG = "<!-- AUTO_ANALYSIS_COMMENT_TAG -->";
const AUTO_ANALYSIS_START_TAG = "<!-- AUTO_ANALYSIS_START_TAG -->";
const AUTO_ANALYSIS_END_TAG = "<!-- AUTO_ANALYSIS_END_TAG -->";

const markdownLinkRegex = /\[.*\]\((http.*?)\)/;
const codeBlockRegex = /`{3,4}(.*?)`{3,4}/s;

/**
 * Check if a PR was modified after a specific comment using the timeline API.
 * This is more robust than timestamp comparisons because it uses GitHub's
 * authoritative event ordering.
 *
 * @param {Github} github
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {number} commentId - The ID of the comment that triggered the workflow
 * @returns {Promise<boolean>} - True if the PR was modified after the comment
 */
async function wasPRModifiedAfterComment(
	github,
	owner,
	repo,
	prNumber,
	commentId,
) {
	// Fetch all timeline events for the PR
	const events = await github.paginate(
		github.rest.issues.listEventsForTimeline,
		{
			owner,
			repo,
			issue_number: prNumber,
			per_page: 100,
		},
	);

	// Events that indicate the PR code was modified
	const modificationEvents = [
		"head_ref_force_pushed",
		"committed",
		"base_ref_changed",
	];

	// Find our triggering comment in the timeline
	const commentIndex = events.findIndex(
		(e) => e.event === "commented" && e.id === commentId,
	);

	if (commentIndex === -1) {
		throw new Error(
			`Could not find comment ${commentId} in PR timeline - aborting...`,
		);
	}

	const commentEvent = events[commentIndex];
	if (!("created_at" in commentEvent)) {
		throw new Error(
			`Comment ${commentId} has no created_at timestamp - aborting...`,
		);
	}
	const commentTime = new Date(commentEvent.created_at);

	// Check 1: Are there any modification events AFTER our comment in the timeline?
	for (let i = commentIndex + 1; i < events.length; i++) {
		if (modificationEvents.includes(events[i].event)) {
			return true;
		}
	}

	// Check 2: Are there any modification events with created_at >= comment time?
	// This is a backup check in case the timeline ordering is not reliable
	for (const event of events) {
		if (
			modificationEvents.includes(event.event)
			&& "created_at" in event
		) {
			const eventTime = new Date(event.created_at);
			if (eventTime >= commentTime) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Extract logfile section from discussion body
 * @param {string} body - Discussion body
 * @returns {string} - Logfile section content
 */
function extractLogfileSection(body) {
	const logfileSectionHeader = "### Upload Logfile";

	if (!body.includes(logfileSectionHeader)) {
		throw new Error("No logfile section found in discussion");
	}

	return body.slice(
		body.indexOf(logfileSectionHeader) + logfileSectionHeader.length,
	);
}

/**
 * Extract and validate URL from logfile section
 * @param {string} logfileSection - Logfile section content
 * @returns {string} - Valid logfile URL
 */
function extractLogfileUrl(logfileSection) {
	const linkMatch = markdownLinkRegex.exec(logfileSection);
	if (!linkMatch || !linkMatch[1]) {
		throw new Error("No valid logfile URL found in discussion");
	}

	const url = linkMatch[1].trim();

	// Validate URL format
	try {
		return new URL(url).toString();
	} catch (error) {
		throw new Error(`Invalid URL format: ${url}`);
	}
}

/**
 * Extract logfile content from logfile section (URL or code block)
 * @param {string} logfileSection - Logfile section content
 * @returns {Promise<string|null>} - Logfile content or error codes
 */
async function extractLogfileContent(logfileSection) {
	const link = markdownLinkRegex.exec(logfileSection)?.[1]?.trim();
	const codeBlockContent = codeBlockRegex.exec(logfileSection)?.[1]?.trim();

	if (link) {
		try {
			const resp = await fetch(link);
			if (!resp.ok) {
				console.error(
					`Failed to fetch logfile from ${link}:`,
					resp.statusText,
				);
				return "ERROR_FETCH";
			}
			const logFile = await resp.text();
			// limit to the last 250 lines
			return logFile.split("\n").slice(-250).join("\n");
		} catch (e) {
			console.error(`Failed to fetch logfile from ${link}:`, e);
			return "ERROR_FETCH";
		}
	} else if (codeBlockContent) {
		if (codeBlockContent.split("\n").length > 20) {
			// This code block is too long and should be a logfile instead
			return "ERROR_CODE_BLOCK_TOO_LONG";
		}
		return codeBlockContent;
	}

	return null;
}

module.exports = {
	formatWithDprint,
	urls,
	wasPRModifiedAfterComment,
	extractLogfileSection,
	extractLogfileUrl,
	extractLogfileContent,
	AUTO_ANALYSIS_COMMENT_TAG,
	AUTO_ANALYSIS_START_TAG,
	AUTO_ANALYSIS_END_TAG,
};
