// @ts-check

// Sanitizes the chat model's answer text before it is posted as a GitHub
// comment. Only the model-generated portion passes through this module;
// trusted documentation and related-post links are appended afterwards.

/** @param {string} text */
function neutralizeMentions(text) {
	return text.replace(/@/g, "@\u200b");
}

/**
 * Removes HTML comments and tags with a delimiter scanner so malformed or
 * overlapping delimiters cannot leave executable markup behind
 * @param {string} text
 */
function stripHtml(text) {
	let result = "";
	let offset = 0;
	while (offset < text.length) {
		if (text.startsWith("<!--", offset)) {
			const end = text.indexOf("-->", offset + 4);
			if (end === -1) break;
			offset = end + 3;
		} else if (text[offset] === "<") {
			const end = text.indexOf(">", offset + 1);
			offset = end === -1 ? offset + 1 : end + 1;
		} else {
			result += text[offset];
			offset++;
		}
	}
	return result;
}

/** @param {string} text */
function stripImages(text) {
	return text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
}

/** @param {string} text */
function stripLinks(text) {
	return text
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^[ \t]*\[[^\]]+\]:\s*\S+.*$/gm, "")
		.replaceAll("[", String.raw`\[`)
		.replaceAll("]", String.raw`\]`);
}

/** @param {string} text */
function neutralizeRawUrls(text) {
	return text.replace(/\b(https?:\/\/|www\.)/gi, "$1\u200b");
}

/** @param {string} text */
function sanitizeModelAnswer(text) {
	let result = text;
	result = stripHtml(result);
	result = stripImages(result);
	result = stripLinks(result);
	result = neutralizeRawUrls(result);
	result = neutralizeMentions(result);
	return result.trim();
}

module.exports = {
	sanitizeModelAnswer,
	neutralizeMentions,
	stripHtml,
	stripImages,
	stripLinks,
	neutralizeRawUrls,
};
