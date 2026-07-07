// @ts-check

/// <reference path="types.d.ts" />

const fs = require("node:fs/promises");
const { retrieve } = require("./docsSearch.cjs");
const { CHAT_MODEL, embed, modelsRequest } = require("./modelsApi.cjs");

const DOCS_BASE_URL = "https://zwave-js.github.io/zwave-js/#";
const DOCS_ANSWER_COMMENT_TAG = "<!-- DOCS_ANSWER_COMMENT_TAG -->";

// Discussion categories where questions are expected
const QUESTION_CATEGORY_SLUGS = [
	"request-support-investigate-issue",
	"q-a",
];
// Users whose posts should never be answered automatically
const EXCLUDED_USERS = ["AlCalzone", "zwave-js-bot"];

const MAX_RETRIEVED_CHUNKS = 5;
// If not even the best dense match reaches this cosine similarity,
// the post is considered off-topic and no chat request is made.
// The real relevance judgment is left to the chat model.
const MIN_SIMILARITY = 0.2;
// Confidence thresholds for the different response styles
const ANSWER_CONFIDENCE = 75;
const LINKS_CONFIDENCE = 40;

// Limit the question size to keep the prompt within the token budget
const MAX_QUESTION_LENGTH = 6000;

/**
 * Reduces template boilerplate and log/code dumps in the post body,
 * which would otherwise dilute the query used for retrieval
 * @param {string} title
 * @param {string} body
 */
function cleanQuestion(title, body) {
	// Template instructions are hidden in HTML comments.
	// Replacements can create new comment sequences, repeat until stable.
	let text = body;
	let previous;
	do {
		previous = text;
		text = text.replace(/<!--[\s\S]*?-->/g, "");
	} while (text !== previous);

	text = text
		// Checked/unchecked checklist items carry no information
		.replace(/^\s*-\s*\[[ xX]\].*$/gm, "")
		// Retrieval matches on prose, not logs. Long code blocks would
		// dilute the embedding and blow the question length budget, so
		// they are shortened to head + tail. This is NOT log analysis -
		// that is the log analyzer's job, this bot only matches the
		// question against the documentation.
		.replace(/(```|~~~)[\s\S]*?\1/g, (block) => {
			const lines = block.split("\n");
			if (lines.length <= 15) return block;
			return [
				...lines.slice(0, 8),
				"...",
				...lines.slice(-4),
			].join("\n");
		})
		.replace(/\n{3,}/g, "\n\n")
		.trim();
	return `${title}\n\n${text}`.slice(0, MAX_QUESTION_LENGTH);
}

/** @param {{file: string, anchor: string}} chunk */
function chunkUrl(chunk) {
	const docPath = chunk.file.replace(/(README|index)?\.md$/, "");
	let url = `${DOCS_BASE_URL}/${docPath}`;
	if (chunk.anchor) url += `?id=${chunk.anchor}`;
	return url;
}

/**
 * Checks whether the bot already answered this post
 * @param {{github: Github, context: Context}} param0
 * @param {any} post
 * @param {boolean} isDiscussion
 */
async function alreadyAnswered({ github, context }, post, isDiscussion) {
	if (isDiscussion) {
		const existing = await github.graphql(
			`
			query getComments($discussionId: ID!) {
				node(id: $discussionId) {
					... on Discussion {
						comments(first: 50) {
							nodes { body }
						}
					}
				}
			}
			`,
			{ discussionId: post.node_id },
		);
		return !!existing.node?.comments?.nodes?.some(
			(/** @type {any} */ c) => c.body.includes(DOCS_ANSWER_COMMENT_TAG),
		);
	} else {
		const { data: comments } = await github.rest.issues.listComments({
			...context.repo,
			issue_number: post.number,
			per_page: 100,
		});
		return comments.some((c) => c.body?.includes(DOCS_ANSWER_COMMENT_TAG));
	}
}

/**
 * Asks the chat model whether the given doc excerpts answer the question
 * @param {string} question
 * @param {{chunk: any}[]} ranked Retrieved chunks, most relevant first
 * @param {string} token
 * @returns {Promise<{confidence: number, answer: string | null, relatedExcerpts: number[]}>}
 */
async function judgeAnswer(question, ranked, token) {
	const excerpts = ranked
		.map((r, i) => `
<excerpt id="${i}" section="${r.chunk.breadcrumbs.join(" > ")}">
${r.chunk.text}
</excerpt>`)
		.join("\n");

	const systemPrompt = `
You are a support assistant for the Z-Wave JS project, a Z-Wave driver library written in TypeScript.
A user has posted a question. You are given excerpts from the project documentation that might answer it.

Determine whether the excerpts actually answer the user's question, and respond with a JSON object with the following fields:
- "confidence": a number between 0 and 100 indicating how confident you are that the excerpts fully answer the question. Use 0 if the post is not a question, or the excerpts are unrelated to it.
- "answer": if the excerpts answer the question, a concise answer (a few sentences, markdown) based ONLY on the excerpts. Otherwise null.
- "relatedExcerpts": an array with the ids (numbers) of the excerpts that are relevant to the question, most relevant first. Leave empty if none are.

Rules:
1. Base your answer solely on the given excerpts. Do not use outside knowledge.
2. Do not mention the excerpts in the answer text.
3. Do not refer to the user's question with phrases like "here's the answer to your question". Just answer directly.
4. Respond with the JSON object only.`.trim();

	const userPrompt = `## User's post

${question}

## Documentation excerpts
${excerpts}`;

	const chatResponse = await modelsRequest("/chat/completions", {
		model: CHAT_MODEL,
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		],
		response_format: { type: "json_object" },
		max_tokens: 1000,
		temperature: 0.2,
	}, token);

	return JSON.parse(chatResponse.choices[0].message.content);
}

/**
 * Answers a user's question in an issue or discussion based on the documentation.
 *
 * Expects the following environment variables:
 * - MODELS_TOKEN: token with models:read permission
 * - DOCS_INDEX_PATH: path to the embeddings index created by buildDocsIndex.cjs
 * - DRY_RUN: if set to "true", log the would-be comment instead of posting it
 *
 * @param {{github: Github, context: Context, core?: any}} param
 */
async function main(param) {
	const { github, context } = param;

	const modelsToken = process.env.MODELS_TOKEN;
	if (!modelsToken) {
		console.log("No MODELS_TOKEN provided, skipping");
		return;
	}
	const dryRun = process.env.DRY_RUN === "true";

	// Figure out where the question comes from
	const isDiscussion = !!context.payload.discussion;
	const post = context.payload.discussion ?? context.payload.issue;
	if (!post) {
		console.log("No issue or discussion in payload, skipping");
		return;
	}

	const author = post.user?.login;
	if (
		!author
		|| EXCLUDED_USERS.includes(author)
		|| post.user?.type === "Bot"
	) {
		console.log(`Skipping post by ${author}`);
		return;
	}

	if (isDiscussion) {
		const categorySlug = context.payload.discussion.category?.slug;
		if (!QUESTION_CATEGORY_SLUGS.includes(categorySlug)) {
			console.log(
				`Skipping discussion in category ${categorySlug}`,
			);
			return;
		}
	} else {
		// Device config requests are not questions the docs can answer
		const labels = (post.labels ?? []).map(
			(/** @type {any} */ l) => l.name,
		);
		if (labels.includes("config ⚙")) {
			console.log("Skipping device config request");
			return;
		}
	}

	// Check for an existing answer before spending any Models API requests.
	// This also makes re-runs on edited posts cheap no-ops.
	if (
		!dryRun
		&& await alreadyAnswered({ github, context }, post, isDiscussion)
	) {
		console.log("Already answered, skipping");
		return;
	}

	// Load the pre-built embeddings index
	const indexPath = process.env.DOCS_INDEX_PATH;
	/** @type {any} */
	let index;
	try {
		index = JSON.parse(await fs.readFile(indexPath, "utf8"));
	} catch {
		console.log(`No docs index found at ${indexPath}, skipping`);
		return;
	}
	console.log(
		`Loaded docs index with ${index.chunks.length} chunks (created ${index.createdAt})`,
	);

	const question = cleanQuestion(post.title, post.body ?? "");

	// Hybrid retrieval: 1 embedding request, then in-process search
	const [questionEmbedding] = await embed(
		[question],
		modelsToken,
		index.model,
	);
	const { results: ranked, bestSimilarity } = retrieve(
		index,
		questionEmbedding,
		question,
		MAX_RETRIEVED_CHUNKS,
	);

	if (bestSimilarity < MIN_SIMILARITY) {
		console.log(
			`Best similarity ${
				bestSimilarity.toFixed(3)
			} below floor, post is likely off-topic`,
		);
		return;
	}

	console.log(
		"Top matches:",
		ranked.map((r) =>
			`cos=${r.similarity.toFixed(3)} bm25=${
				r.lexical.toFixed(1)
			} ${r.chunk.file}#${r.chunk.anchor}`
		),
	);
	if (ranked.length === 0) {
		console.log("No relevant documentation found, skipping");
		return;
	}

	// Ask the model whether the docs answer the question
	/** @type {{confidence: number, answer: string | null, relatedExcerpts: number[]}} */
	let result;
	try {
		result = await judgeAnswer(question, ranked, modelsToken);
	} catch (e) {
		console.log("Failed to parse model response:", e);
		return;
	}
	console.log("Model response:", JSON.stringify(result));

	const related = (result.relatedExcerpts ?? [])
		.map((i) => ranked[i]?.chunk)
		.filter(Boolean);

	if (result.confidence < LINKS_CONFIDENCE || related.length === 0) {
		console.log("Confidence too low, not answering");
		return;
	}

	// When linking to a section, don't also link to its subsections
	const isAncestor = (
		/** @type {any} */ a,
		/** @type {any} */ b,
	) => a.file === b.file
		&& a.breadcrumbs.length < b.breadcrumbs.length
		&& a.breadcrumbs.every(
			(/** @type {string} */ crumb, /** @type {number} */ i) =>
				crumb === b.breadcrumbs[i],
		);
	// Sub-splits of the same section share a URL, only link it once
	/** @type {Set<string>} */
	const seenUrls = new Set();
	const deduped = related.filter((chunk) => {
		if (related.some((other) => isAncestor(other, chunk))) return false;
		const url = chunkUrl(chunk);
		if (seenUrls.has(url)) return false;
		seenUrls.add(url);
		return true;
	});

	// Compose the comment
	const links = deduped
		.map((chunk) => {
			const label = chunk.breadcrumbs.join(" → ");
			return `- [${label}](${chunkUrl(chunk)})`;
		})
		.join("\n");

	let body = `**Beep, boop! 🤖**

_I've tried to answer your question based on the documentation. If this doesn't help, please wait for a human to show up._

`;
	const single = deduped.length === 1;
	if (result.confidence >= ANSWER_CONFIDENCE && result.answer) {
		body += `${result.answer}

${
			single
				? "This section of the documentation has more details:"
				: "These sections of the documentation have more details:"
		}
${links}`;
	} else {
		body += `${
			single
				? "This section of the documentation might answer your question:"
				: "These sections of the documentation might answer your question:"
		}

${links}`;
	}
	body += `

---

_This answer was generated automatically based on the documentation. AI can make mistakes, always check important info._
${DOCS_ANSWER_COMMENT_TAG}`;

	if (dryRun) {
		console.log("DRY RUN - would post the following comment:");
		console.log(body);
		return;
	}

	if (isDiscussion) {
		await github.graphql(
			`
			mutation addDiscussionComment($discussionId: ID!, $body: String!) {
				addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
					comment { id }
				}
			}
			`,
			{ discussionId: post.node_id, body },
		);
	} else {
		await github.rest.issues.createComment({
			...context.repo,
			issue_number: post.number,
			body,
		});
	}
	console.log("Posted docs answer comment");
}

module.exports = main;
module.exports.judgeAnswer = judgeAnswer;
