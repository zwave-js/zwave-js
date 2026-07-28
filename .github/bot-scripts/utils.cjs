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
 * Returns when an issue was last transferred into this repository,
 * or 0 if it was created here.
 * @param {{event?: string, created_at?: string}[]} events - Timeline events
 * @returns {number} Epoch milliseconds
 */
function lastTransferTime(events) {
	let transferredAt = 0;
	for (const event of events) {
		if (event.event !== "transferred" || !event.created_at) continue;
		// Issues may be transferred repeatedly, only the last hop matters
		transferredAt = Math.max(
			transferredAt,
			new Date(event.created_at).getTime(),
		);
	}
	return transferredAt;
}

/**
 * Lists an issue's comments, ignoring those inherited from another repository.
 * Transferring an issue recreates the source repo's comments here with their
 * original creation date, so everything older than the last transfer was
 * written elsewhere.
 *
 * @param {Github} github
 * @param {string} owner
 * @param {string} repo
 * @param {number} issueNumber
 */
async function listCommentsSinceTransfer(github, owner, repo, issueNumber) {
	const comments = await github.paginate(github.rest.issues.listComments, {
		owner,
		repo,
		issue_number: issueNumber,
		per_page: 100,
	});
	// Without comments there is nothing to filter, save the timeline request
	if (comments.length === 0) return comments;

	const events = await github.paginate(
		github.rest.issues.listEventsForTimeline,
		{
			owner,
			repo,
			issue_number: issueNumber,
			per_page: 100,
		},
	);
	const transferredAt = lastTransferTime(events);
	if (!transferredAt) return comments;

	return comments.filter(
		(c) => new Date(c.created_at).getTime() > transferredAt,
	);
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
 * Decompresses zipped or gzipped logfile uploads, following the pattern
 * of tryUnzipFirmwareFile in @zwave-js/core. Returns the data unchanged
 * when it is not compressed or no single logfile can be identified -
 * the logfile classifier then flags it as binary.
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function maybeDecompressLogfile(data) {
	const isZip = data[0] === 0x50
		&& data[1] === 0x4b
		&& data[2] === 0x03
		&& data[3] === 0x04;
	const isGzip = data[0] === 0x1f && data[1] === 0x8b;
	if (!isZip && !isGzip) return data;

	// Lazy import, so bot scripts that never see compressed uploads work
	// without node_modules. Workflows that extract logfiles must install
	// dependencies - a missing module should fail the run, not degrade
	// into "binary file" feedback.
	const { gunzipSync, unzipSync } = require("fflate");
	try {
		if (isZip) {
			const unzipped = unzipSync(data, {
				filter: (file) =>
					/\.(log|txt)$/i.test(file.name)
					// macOS zips contain resource-fork copies of each file
					&& !file.name.startsWith("__MACOSX/")
					&& !file.name.split("/").pop()?.startsWith("._"),
			});
			let names = Object.keys(unzipped);
			if (names.length > 1) {
				// Prefer the driver log when other logs are bundled along,
				// and the active logfile over rotated ones
				const zjsLogs = names.filter((name) => /zwavejs_/.test(name));
				if (zjsLogs.length > 0) names = zjsLogs;
				const current = names.find((name) =>
					name.endsWith("zwavejs_current.log")
				);
				if (current) names = [current];
			}
			if (names.length === 1) return unzipped[names[0]];
		} else {
			return gunzipSync(data);
		}
	} catch (e) {
		// Corrupted or password-protected archives get binary-file feedback
		console.error("Failed to decompress logfile:", e);
	}
	return data;
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
			const data = maybeDecompressLogfile(
				new Uint8Array(await resp.arrayBuffer()),
			);
			const logFile = new TextDecoder().decode(data);
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
	lastTransferTime,
	listCommentsSinceTransfer,
	extractLogfileSection,
	extractLogfileUrl,
	extractLogfileContent,
	maybeDecompressLogfile,
	AUTO_ANALYSIS_COMMENT_TAG,
	AUTO_ANALYSIS_START_TAG,
	AUTO_ANALYSIS_END_TAG,
};
