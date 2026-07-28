// @ts-check

// Deterministic classifier for uploaded logfiles, deciding whether a
// post contains a Z-Wave JS driver log on loglevel "debug".
// The log formats are fully distinguishable by their line patterns, so
// no AI is involved. Validated against a benchmark of real uploads,
// where it outperformed LLM classifiers including the previously used
// gpt-4o-mini.

const CLASSIFICATION = Object.freeze({
	CORRECT_LOG_LEVEL: "Z-Wave JS: correct log level",
	WRONG_LOG_LEVEL: "Z-Wave JS: wrong log level",
	Z_UI: "Z-Wave JS UI",
	HA_ONLY: "Home Assistant: No Z-Wave JS",
	HA_WITH_ZJS: "Home Assistant: Includes Z-Wave JS",
	BINARY: "Binary or compressed file",
	UNRELATED: "Unrelated",
	UNKNOWN: "Unknown",
});

// Log lines may carry ANSI color codes when copied from a terminal
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

// Timestamp variants seen in the wild: "2025-06-13 13:20:33.397",
// ISO "2025-03-23T18:49:45.763Z", and bare "14:51:36.782" from
// console exports
const TIMESTAMP = /(?:\d{4}-\d{2}-\d{2}[ T])?\d{2}:\d{2}:\d{2}\.\d{3}Z?/
	.source;

// Z-Wave JS driver log: timestamp, uppercase tag, optional direction arrow
const ZJS_LINE = new RegExp(
	`${TIMESTAMP}\\s+(DRIVER|CNTRLR|SERIAL|SERIALAPI|CONFIG|BOOTLDR|NDECTRL|NODE)\\b`,
);
// SERIAL lines with direction arrows only appear on loglevel "debug"
const ZJS_SERIAL_LINE = new RegExp(`${TIMESTAMP}\\s+SERIAL\\s+[»«]`);
// Z-Wave JS UI: timestamp, loglevel, uppercase tag with a colon, no arrows
const ZUI_LINE = new RegExp(
	`${TIMESTAMP}\\s+(INFO|DEBUG|WARN|ERROR|SILLY|VERBOSE)\\s+[A-Z][A-Z-]*:`,
);
// Home Assistant: python-style logger paths
const HA_LINE =
	/\[(homeassistant\.|custom_components\.|zwave_js_server|aio\w+)/;

/**
 * Detects compressed or otherwise binary uploads. Decoding those as text
 * yields replacement characters and control bytes, so classifying their
 * "lines" is meaningless.
 * @param {string} content
 */
function looksBinary(content) {
	const sample = content.slice(0, 8192);
	if (sample.startsWith("PK\x03\x04") || sample.startsWith("\x1f\x8b")) {
		return true;
	}
	let suspicious = 0;
	for (const char of sample) {
		const code = char.codePointAt(0) ?? 0;
		if (
			(code < 0x20 && char !== "\t" && char !== "\n" && char !== "\r")
			|| code === 0xfffd
		) {
			suspicious++;
		}
	}
	return suspicious / sample.length > 0.05;
}

/**
 * Classifies an extracted logfile. Returns one of:
 * - CLASSIFICATION.CORRECT_LOG_LEVEL
 * - CLASSIFICATION.WRONG_LOG_LEVEL
 * - CLASSIFICATION.Z_UI
 * - CLASSIFICATION.HA_ONLY
 * - CLASSIFICATION.HA_WITH_ZJS
 * - CLASSIFICATION.BINARY
 * - CLASSIFICATION.UNRELATED
 * - CLASSIFICATION.UNKNOWN
 * @param {string} content
 */
function classifyLogfile(content) {
	// Strip ANSI colors first so their escape bytes don't count as binary
	content = content.replace(ANSI_REGEX, "");
	if (looksBinary(content)) return CLASSIFICATION.BINARY;

	const lines = content.split("\n");

	let zjs = 0;
	let zjsSerial = 0;
	let zui = 0;
	let ha = 0;
	let nonEmpty = 0;
	for (const line of lines) {
		if (!line.trim()) continue;
		nonEmpty++;
		if (ZJS_SERIAL_LINE.test(line)) {
			zjs++;
			zjsSerial++;
		} else if (ZJS_LINE.test(line)) {
			zjs++;
		} else if (HA_LINE.test(line)) {
			ha++;
		} else if (ZUI_LINE.test(line)) {
			zui++;
		}
	}

	if (nonEmpty === 0) return CLASSIFICATION.UNRELATED;

	// Multiline log entries only match on their first line, so decide on
	// absolute counts rather than the share of matching lines
	if (zjs >= 5) {
		if (zjsSerial >= 2) {
			return ha >= 5
				? CLASSIFICATION.HA_WITH_ZJS
				: CLASSIFICATION.CORRECT_LOG_LEVEL;
		}
		// Only stray driver lines inside a log that is clearly Z-Wave JS UI
		if (zui >= 5 * zjs) return CLASSIFICATION.Z_UI;
		return CLASSIFICATION.WRONG_LOG_LEVEL;
	}
	if (ha >= 5) return CLASSIFICATION.HA_ONLY;
	if (zui >= 5) return CLASSIFICATION.Z_UI;
	if (zjs + zui + ha >= 3) return CLASSIFICATION.UNKNOWN;
	return CLASSIFICATION.UNRELATED;
}

/**
 * Maps a classification to the feedback code understood by
 * ensureLogfileFeedback and ensureLogfileFeedbackInDiscussion
 * @param {string} classification
 */
function classificationToFeedback(classification) {
	switch (classification) {
		case CLASSIFICATION.CORRECT_LOG_LEVEL:
		case CLASSIFICATION.HA_WITH_ZJS:
			return "OK";
		case CLASSIFICATION.WRONG_LOG_LEVEL:
			return "WRONG_LOG_LEVEL";
		case CLASSIFICATION.Z_UI:
			return "Z_UI";
		case CLASSIFICATION.HA_ONLY:
			return "HA_ONLY";
		case CLASSIFICATION.BINARY:
			return "BINARY";
		default:
			return "UNKNOWN";
	}
}

module.exports = {
	CLASSIFICATION,
	classifyLogfile,
	classificationToFeedback,
};
