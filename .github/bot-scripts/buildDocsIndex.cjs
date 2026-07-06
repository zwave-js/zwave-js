// @ts-check

// Builds a semantic search index over the documentation by chunking all
// markdown files and embedding the chunks using GitHub Models.
// Usage: node buildDocsIndex.cjs <docs-dir> <output-file>
// Requires GITHUB_TOKEN with models:read permission.

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const EMBEDDINGS_URL = "https://models.github.ai/inference/embeddings";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL
	|| "openai/text-embedding-3-small";
const INDEX_VERSION = 1;

// Stay well below the 64K tokens/request limit for embedding requests
const MAX_BATCH_TOKENS = 40_000;
const MAX_BATCH_INPUTS = 128;
// The free tier allows 15 requests/minute
const THROTTLE_MS = 4500;

// Chunks shorter than this are unlikely to contain useful information
const MIN_CHUNK_LENGTH = 50;
// Truncate huge chunks to stay below the per-input token limit
const MAX_CHUNK_LENGTH = 6000;

/** @param {string} str */
function estimateTokens(str) {
	return Math.ceil(str.length / 4);
}

/**
 * Removes HTML tags, repeating to avoid leaving partial tags behind
 * @param {string} str
 */
function stripHtmlTags(str) {
	let prev;
	do {
		prev = str;
		str = str.replace(/<[^>]*>/g, "");
	} while (str !== prev);
	return str;
}

/**
 * Approximates docsify's heading anchor slugs
 * @param {string} heading
 */
function slugify(heading) {
	return stripHtmlTags(heading.toLowerCase().trim())
		.replace(/[\s\n\t]+/g, "-")
		.replace(/[<>"'|?*!:@#$%^&()[\]{},;+=~`’“”…]/g, "");
}

/**
 * Splits a markdown file into chunks by heading, tracking breadcrumbs and anchors
 * @param {string} file Repo-relative path of the file
 * @param {string} content
 */
function chunkMarkdown(file, content) {
	const lines = content.split("\n");
	/** @type {{file: string, anchor: string, title: string, breadcrumbs: string[], text: string}[]} */
	const chunks = [];

	/** @type {{level: number, title: string}[]} */
	const headingStack = [];
	/** @type {string[]} */
	let currentLines = [];
	let currentTitle = path.basename(file, ".md");
	let currentAnchor = "";
	let inCodeFence = false;

	const pushChunk = () => {
		const text = currentLines.join("\n").trim();
		if (text.length >= MIN_CHUNK_LENGTH) {
			chunks.push({
				file,
				anchor: currentAnchor,
				title: currentTitle,
				breadcrumbs: headingStack.map((h) => h.title),
				text: text.slice(0, MAX_CHUNK_LENGTH),
			});
		}
	};

	for (const line of lines) {
		if (/^\s*(```|~~~)/.test(line)) {
			inCodeFence = !inCodeFence;
			currentLines.push(line);
			continue;
		}
		const heading = !inCodeFence && line.match(/^(#{1,4})\s+(.+?)\s*$/);
		if (heading) {
			pushChunk();
			const level = heading[1].length;
			const title = stripHtmlTags(heading[2]).trim();
			while (
				headingStack.length
				&& headingStack[headingStack.length - 1].level >= level
			) {
				headingStack.pop();
			}
			headingStack.push({ level, title });
			currentTitle = title;
			currentAnchor = slugify(title);
			currentLines = [];
		} else {
			currentLines.push(line);
		}
	}
	pushChunk();

	return chunks;
}

/** @param {string} dir */
async function* walkMarkdownFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name.startsWith("_") || entry.name.startsWith(".")) {
				continue;
			}
			yield* walkMarkdownFiles(full);
		} else if (
			entry.isFile()
			&& entry.name.endsWith(".md")
			&& !entry.name.startsWith("_")
		) {
			yield full;
		}
	}
}

/**
 * @param {string[]} inputs
 * @param {string} token
 * @returns {Promise<number[][]>}
 */
async function embed(inputs, token) {
	const response = await fetch(EMBEDDINGS_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			model: EMBEDDING_MODEL,
			input: inputs,
		}),
	});
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(
			`Embedding request failed with status ${response.status}: ${text}`,
		);
	}
	const result = await response.json();
	return result.data
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.index - b.index)
		.map((/** @type {any} */ d) => d.embedding);
}

async function main() {
	const [docsDir, outputFile] = process.argv.slice(2);
	if (!docsDir || !outputFile) {
		console.error(
			"Usage: node buildDocsIndex.cjs <docs-dir> <output-file>",
		);
		process.exit(1);
	}
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		console.error("GITHUB_TOKEN environment variable is required");
		process.exit(1);
	}

	// Reuse embeddings from a previous index for unchanged chunks
	/** @type {Map<string, number[]>} */
	const previousEmbeddings = new Map();
	try {
		const previous = JSON.parse(await fs.readFile(outputFile, "utf8"));
		if (
			previous.version === INDEX_VERSION
			&& previous.model === EMBEDDING_MODEL
		) {
			for (const chunk of previous.chunks) {
				previousEmbeddings.set(chunk.hash, chunk.embedding);
			}
			console.log(
				`Found previous index with ${previousEmbeddings.size} chunks`,
			);
		}
	} catch {
		// No previous index available, embed everything
	}

	/** @type {any[]} */
	const allChunks = [];
	for await (const file of walkMarkdownFiles(docsDir)) {
		const content = await fs.readFile(file, "utf8");
		const relative = path
			.relative(docsDir, file)
			.replaceAll(path.sep, "/");
		for (const chunk of chunkMarkdown(relative, content)) {
			const embeddedText = [
				...chunk.breadcrumbs,
				chunk.text,
			].join("\n");
			const hash = crypto
				.createHash("sha256")
				.update(embeddedText)
				.digest("hex");
			allChunks.push({
				...chunk,
				hash,
				embeddedText,
				embedding: previousEmbeddings.get(hash),
			});
		}
	}
	console.log(`Collected ${allChunks.length} chunks`);

	const pending = allChunks.filter((c) => !c.embedding);
	console.log(`${pending.length} chunks need new embeddings`);

	// Batch the pending chunks, respecting per-request limits
	let cursor = 0;
	let requestCount = 0;
	while (cursor < pending.length) {
		const batch = [];
		let batchTokens = 0;
		while (
			cursor < pending.length
			&& batch.length < MAX_BATCH_INPUTS
		) {
			const tokens = estimateTokens(pending[cursor].embeddedText);
			if (batch.length > 0 && batchTokens + tokens > MAX_BATCH_TOKENS) {
				break;
			}
			batch.push(pending[cursor]);
			batchTokens += tokens;
			cursor++;
		}

		if (requestCount > 0) {
			await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
		}
		console.log(
			`Embedding batch of ${batch.length} chunks (~${batchTokens} tokens)...`,
		);
		const embeddings = await embed(
			batch.map((c) => c.embeddedText),
			token,
		);
		requestCount++;
		for (let i = 0; i < batch.length; i++) {
			// Round to reduce index size, this has no measurable impact on similarity
			batch[i].embedding = embeddings[i].map(
				(x) => Math.round(x * 1e5) / 1e5,
			);
		}
	}
	console.log(`Done, used ${requestCount} embedding requests`);

	const index = {
		version: INDEX_VERSION,
		model: EMBEDDING_MODEL,
		createdAt: new Date().toISOString(),
		chunks: allChunks.map(({ embeddedText, ...chunk }) => chunk),
	};
	await fs.mkdir(path.dirname(outputFile), { recursive: true });
	await fs.writeFile(outputFile, JSON.stringify(index));
	console.log(`Wrote index with ${allChunks.length} chunks to ${outputFile}`);
}

if (require.main === module) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}

module.exports = { chunkMarkdown, slugify };
