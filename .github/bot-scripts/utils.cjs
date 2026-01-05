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
	extractLogfileSection,
	extractLogfileUrl,
	extractLogfileContent,
	AUTO_ANALYSIS_COMMENT_TAG,
	AUTO_ANALYSIS_START_TAG,
	AUTO_ANALYSIS_END_TAG,
};
