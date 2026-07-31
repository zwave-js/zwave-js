// @ts-check

/// <reference path="types.d.ts" />

const fs = require("node:fs/promises");
const path = require("node:path");
const { readAgentOutputItem } = require("./agentOutput.cjs");
const { authorizedUsers } = require("./users.cjs");
const { cosineSimilarity, loadDocsIndex, retrieve } = require(
	"./docsIndex.cjs",
);
const { EMBEDDING_MODEL, embed, indexMatchesModel } = require(
	"./localEmbeddings.cjs",
);
const {
	QUESTION_CATEGORY_SLUGS,
	cleanQuestion,
	loadPostsIndex,
	rankRelatedPosts,
} = require("./postsIndex.cjs");
const { sanitizeModelAnswer } = require("./sanitizeAnswer.cjs");
const { listCommentsSinceTransfer } = require("./utils.cjs");

const DOCS_BASE_URL = "https://zwave-js.github.io/zwave-js/#";
const DOCS_ANSWER_COMMENT_TAG = "<!-- DOCS_ANSWER_COMMENT_TAG -->";
const DOCS_ANSWER_METADATA_TAG = "DOCS_ANSWER_METADATA";
const DOCS_ANSWER_METADATA_VERSION = 1;

// Users whose posts should never be answered automatically
const EXCLUDED_USERS = [...authorizedUsers, "zwave-js-bot"];

const MAX_RETRIEVED_CHUNKS = 5;
// Below this best-match cosine similarity the post is off-topic and the
// judge is not invoked. Calibrated for all-MiniLM-L6-v2: on-topic eval
// questions score >= 0.44, unrelated posts stay <= 0.3
const MIN_SIMILARITY = 0.35;
// Confidence thresholds for the different response styles
const ANSWER_CONFIDENCE = 75;
const LINKS_CONFIDENCE = 40;

// A related post is only suggested above this cosine similarity; kept high
// because a wrong suggestion is worse than a missed one. Calibrated for
// all-MiniLM-L6-v2: known-duplicate eval pairs score 0.52-0.81
const POSTS_MIN_SIMILARITY = 0.6;
const MAX_RELATED_POSTS = 3;
// Cap the answer so a runaway completion cannot 422 the comment API
const MAX_ANSWER_LENGTH = 15000;
// Bound comment pagination so a malformed pageInfo cannot loop to the timeout
const MAX_COMMENT_PAGES = 20;

/**
 * Closes a fenced code block left open when the length cap slices inside one,
 * so the truncation cannot swallow the doc-links list rendered after it.
 * @param {string} text
 */
function balanceCodeFences(text) {
	const fences = text.match(/^[ \t]*(?:`{3,}|~{3,})/gm) ?? [];
	if (fences.length % 2 === 0) return text;
	const marker = fences[fences.length - 1].replace(/^[ \t]+/, "");
	return `${text}\n${marker}`;
}

// Questions at least this similar to a previously downvoted answer
// get a demoted response: full answer -> links only, links only -> silence
const SUPPRESS_SIMILARITY = 0.9;

/** @param {{file: string, anchor: string}} chunk */
function chunkUrl(chunk) {
	const docPath = chunk.file.replace(/(README|index)?\.md$/, "");
	let url = `${DOCS_BASE_URL}/${docPath}`;
	if (chunk.anchor) url += `?id=${chunk.anchor}`;
	return url;
}

/**
 * Checks whether the bot already answered this post, paginating through
 * all comments so a busy post cannot hide an existing answer.
 * @param {{github: Github, context: Context}} param0
 * @param {any} post
 * @param {boolean} isDiscussion
 */
async function alreadyAnswered({ github, context }, post, isDiscussion) {
	if (isDiscussion) {
		// Discussions have no timeline API, so an answer inherited from a
		// transfer cannot be told apart from ours
		/** @type {string | null} */
		let cursor = null;
		// Bound the walk: a null endCursor returned alongside hasNextPage would
		// otherwise reset to page 1 and loop until the job times out
		for (let page = 0; page < MAX_COMMENT_PAGES; page++) {
			const data = await github.graphql(
				`
				query getComments($discussionId: ID!, $cursor: String) {
					node(id: $discussionId) {
						... on Discussion {
							comments(first: 100, after: $cursor) {
								pageInfo { hasNextPage endCursor }
								nodes { body }
							}
						}
					}
				}
				`,
				{ discussionId: post.node_id, cursor },
			);
			const comments = data.node?.comments;
			if (
				comments?.nodes?.some(
					(/** @type {any} */ c) =>
						c.body.includes(DOCS_ANSWER_COMMENT_TAG),
				)
			) {
				return true;
			}
			const pageInfo = comments?.pageInfo;
			if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return false;
			cursor = pageInfo.endCursor;
		}
		console.log(
			`::warning::Stopped scanning discussion comments after ${MAX_COMMENT_PAGES} pages`,
		);
		return false;
	} else {
		const comments = await listCommentsSinceTransfer(
			github,
			context.repo.owner,
			context.repo.repo,
			post.number,
		);
		return comments.some((c) => c.body?.includes(DOCS_ANSWER_COMMENT_TAG));
	}
}

/**
 * Extracts the excerpt ids from the judge's tool argument, which arrives as a
 * string whose ids may be joined by any separator ("2, 0", "1;2")
 * @param {unknown} raw
 * @returns {number[]}
 */
function parseRelatedExcerpts(raw) {
	return [...String(raw ?? "").matchAll(/\d+/g)].map((m) =>
		Number.parseInt(m[0], 10)
	);
}

/**
 * Validates the shape of the judge's verdict, which is untrusted model
 * output: it can contain out-of-range numbers, wrong types, or omit
 * fields entirely. Malformed output degrades to a safe "no answer"
 * result instead of throwing.
 * @param {any} parsed
 * @returns {{confidence: number, answer: string | null, relatedExcerpts: number[]}}
 */
function validateJudgeResponse(parsed) {
	const noAnswer = { confidence: 0, answer: null, relatedExcerpts: [] };
	if (!parsed || typeof parsed !== "object") return noAnswer;

	const { confidence } = parsed;
	if (
		typeof confidence !== "number"
		|| !Number.isFinite(confidence)
		|| confidence < 0
		|| confidence > 100
	) {
		return noAnswer;
	}

	const answer = typeof parsed.answer === "string"
		? balanceCodeFences(parsed.answer.slice(0, MAX_ANSWER_LENGTH))
		: null;

	const relatedExcerpts = Array.isArray(parsed.relatedExcerpts)
		? parsed.relatedExcerpts.filter(
			(/** @type {any} */ i) => Number.isInteger(i) && i >= 0,
		)
		: [];

	return { confidence, answer, relatedExcerpts };
}

/**
 * Determines how the answer to a question must be demoted based on
 * its similarity to previously downvoted answers: a downvoted full
 * answer allows links only, downvoted links mean staying silent
 * @param {number[]} questionEmbedding
 * @param {{model: string, suppressed: {embedding: number[], style: string, url: string}[]} | undefined} feedback
 * @param {string} embeddingModel
 * @returns {"allow" | "linksOnly" | "silent"}
 */
function checkSuppression(questionEmbedding, feedback, embeddingModel) {
	// Embeddings from different models are not comparable
	if (!feedback || feedback.model !== embeddingModel) return "allow";

	/** @type {"allow" | "linksOnly" | "silent"} */
	let result = "allow";
	for (const entry of feedback.suppressed ?? []) {
		// The cache could be stale or corrupted. Skip malformed entries,
		// a mismatched vector length would yield NaN below
		if (
			!Array.isArray(entry.embedding)
			|| entry.embedding.length !== questionEmbedding.length
		) {
			continue;
		}
		const similarity = cosineSimilarity(
			questionEmbedding,
			entry.embedding,
		);
		if (!(similarity >= SUPPRESS_SIMILARITY)) continue;
		console.log(
			`Question is similar (${
				similarity.toFixed(3)
			}) to a downvoted answer: ${entry.url}`,
		);
		if (entry.style === "links") return "silent";
		result = "linksOnly";
	}
	return result;
}

/**
 * Retrieves the documentation chunks that might answer the question
 * @param {string} question
 * @param {number[]} questionEmbedding
 * @param {any} index The docs embeddings index
 * @returns {any[] | undefined} Chunks, most relevant first
 */
function retrieveDocsChunks(question, questionEmbedding, index) {
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
		console.log("No relevant documentation found");
		return;
	}
	return ranked.map((r) => r.chunk);
}

/**
 * Renders the docs part of the comment from the judge's verdict
 * @param {{confidence: number, answer: string | null, relatedExcerpts: number[]}} result A validated judge response
 * @param {any[]} chunks The chunks the judge was given, most relevant first
 * @param {boolean} allowAnswer Render doc links only when false
 * @returns {{text: string, style: "answer" | "links", confidence: number, sections: string[]} | undefined}
 */
function renderDocsSection(result, chunks, allowAnswer) {
	const related = (result.relatedExcerpts ?? [])
		.map((i) => chunks[i])
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

	const links = deduped
		.map((chunk) => {
			// breadcrumbs is normally never empty (buildDocsIndex.cjs falls
			// back to the chunk title for pre-heading content), but an older
			// cached index could still have one - keep the label nonempty
			const label = chunk.breadcrumbs.join(" → ") || chunk.title;
			return `- [${label}](${chunkUrl(chunk)})`;
		})
		.join("\n");

	const sections = deduped.map((chunk) => `${chunk.file}#${chunk.anchor}`);
	const single = deduped.length === 1;
	// The model's answer is untrusted output - sanitize it before it is
	// ever rendered in the comment. The doc links below are generated
	// from our own index data and must NOT be sanitized the same way.
	const sanitizedAnswer = result.answer
		? sanitizeModelAnswer(result.answer)
		: null;
	if (
		allowAnswer && result.confidence >= ANSWER_CONFIDENCE && sanitizedAnswer
	) {
		return {
			text: `${sanitizedAnswer}

${
				single
					? "This section of the documentation has more details:"
					: "These sections of the documentation have more details:"
			}
${links}`,
			style: "answer",
			confidence: result.confidence,
			sections,
		};
	} else {
		return {
			text: `${
				single
					? "This section of the documentation might answer your question:"
					: "These sections of the documentation might answer your question:"
			}

${links}`,
			style: "links",
			confidence: result.confidence,
			sections,
		};
	}
}

/** @param {import("./postsIndex.cjs").IndexedPost} post */
function describePostState(post) {
	if (post.type === "issue") {
		return post.state === "open" ? "open issue" : "closed issue";
	}
	if (post.state === "answered") return "answered discussion";
	if (post.state === "closed") return "closed discussion";
	return "discussion";
}

/**
 * Ranks existing posts by similarity and renders the related-posts part
 * of the comment
 * @param {NonNullable<Awaited<ReturnType<typeof loadPostsIndex>>>} index
 * @param {number[]} questionEmbedding
 * @param {{type: "issue" | "discussion", number: number}} self
 * @returns {string | undefined}
 */
function buildRelatedPostsSection(index, questionEmbedding, self) {
	// Log more candidates than are shown, as tuning signal for the floor
	const candidates = rankRelatedPosts(index, questionEmbedding, self, {
		minSimilarity: 0,
		maxResults: 10,
	});
	console.log(
		"Top related posts:",
		candidates.map((c) =>
			`cos=${c.similarity.toFixed(3)} ${c.post.type} #${c.post.number}`
		),
	);

	const shown = candidates
		.filter((c) => c.similarity >= POSTS_MIN_SIMILARITY)
		.slice(0, MAX_RELATED_POSTS);
	if (shown.length === 0) {
		console.log("No sufficiently similar posts found");
		return;
	}

	const links = shown
		.map(({ post }) => {
			// Backslashes and square brackets in titles would break the markdown link
			const title = post.title.replace(/[\\[\]]/g, "\\$&");
			return `- [${title}](${post.url}) (${describePostState(post)})`;
		})
		.join("\n");

	return `${
		shown.length === 1
			? "This existing post looks similar to yours and might be related — a maintainer will confirm:"
			: "These existing posts look similar to yours and might be related — a maintainer will confirm:"
	}

${links}`;
}

/**
 * Composes the answer comment from its sections and posts it
 * @param {{github: Github, context: Context}} param
 * @param {any} post
 * @param {boolean} isDiscussion
 * @param {{text: string, style: "answer" | "links", confidence: number, sections: string[]} | undefined} docsSection
 * @param {string | undefined} postsSection
 */
async function composeAndPostAnswer(
	{ github, context },
	post,
	isDiscussion,
	docsSection,
	postsSection,
) {
	let body = `**Beep, boop! 🤖**

`;
	if (docsSection) {
		body +=
			`_I've tried to answer your question based on the documentation. If this doesn't help, please wait for a human to show up._

${docsSection.text}`;
		if (postsSection) {
			body += `

---

${postsSection}`;
		}
	} else {
		body +=
			`_I've found existing posts that look similar to yours. If they don't help, please wait for a human to show up._

${postsSection}`;
	}

	// Metadata for collectDocsFeedback.cjs to attribute
	// reactions to doc sections without re-parsing the comment
	const metadata = {
		v: DOCS_ANSWER_METADATA_VERSION,
		style: docsSection?.style ?? "posts",
		confidence: docsSection?.confidence ?? null,
		sections: docsSection?.sections ?? [],
		// Traces a posted comment back to the workflow run that judged it
		run: Number(process.env.GITHUB_RUN_ID) || null,
	};

	body += `

---

_${
		docsSection
			? "This answer was"
			: "These suggestions were"
	} generated automatically${
		docsSection ? " based on the documentation" : ""
	}. AI can make mistakes, always check important info._
_Was this helpful? React with 👍 or 👎 to let us know._
${DOCS_ANSWER_COMMENT_TAG}
<!-- ${DOCS_ANSWER_METADATA_TAG} ${JSON.stringify(metadata)} -->`;

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

/**
 * Extracts the triggering post from the event payload
 * @param {Context} context
 * @returns {{post: any, isDiscussion: boolean}}
 */
function postFromContext(context) {
	const isDiscussion = !!context.payload.discussion;
	const post = context.payload.discussion ?? context.payload.issue;
	return { post, isDiscussion };
}

/**
 * Applies all gates that decide whether a post gets a docs answer.
 * Returns undefined when the post should not be answered.
 * @param {{github: Github, context: Context}} param
 * @returns {Promise<{post: any, isDiscussion: boolean} | undefined>}
 */
async function checkAnswerGates(param) {
	const { context } = param;

	const { post, isDiscussion } = postFromContext(context);
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
			console.log(`Skipping discussion in category ${categorySlug}`);
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

	if (await alreadyAnswered(param, post, isDiscussion)) {
		console.log("Already answered, skipping");
		return;
	}

	return { post, isDiscussion };
}

/**
 * Prepares answering a user's question in an issue or discussion:
 * retrieves documentation excerpts for the agentic judge, and posts
 * related-posts-only suggestions directly when the docs have nothing
 * to offer.
 *
 * Expects the following environment variables:
 * - DOCS_INDEX_PATH: path to the embeddings index created by buildDocsIndex.cjs
 * - POSTS_INDEX_PATH: path to the embeddings index created by buildPostsIndex.cjs
 * - DOCS_FEEDBACK_PATH: path to the suppression list created by collectDocsFeedback.cjs
 * - DOCS_HANDOFF_PATH: where to write the handoff file for the judge
 *
 * @param {{github: Github, context: Context}} param
 * @returns {Promise<boolean>} Whether the agentic judge should run
 */
async function prepareDocsAnswer(param) {
	const gates = await checkAnswerGates(param);
	if (!gates) return false;
	const { post, isDiscussion } = gates;

	// Load the pre-built embeddings indices. Either may be missing,
	// each one enables its part of the comment.
	const docsIndexPath = process.env.DOCS_INDEX_PATH;
	let docsIndex = await loadDocsIndex(docsIndexPath);
	if (docsIndex) {
		console.log(
			`Loaded docs index with ${docsIndex.chunks.length} chunks (created ${docsIndex.createdAt})`,
		);
	} else {
		console.log(`No docs index found at ${docsIndexPath}`);
	}

	let postsIndex = await loadPostsIndex(process.env.POSTS_INDEX_PATH);
	if (postsIndex) {
		console.log(
			`Loaded posts index with ${postsIndex.posts.length} posts (created ${postsIndex.createdAt})`,
		);
	} else {
		console.log(
			`No posts index found at ${process.env.POSTS_INDEX_PATH}`,
		);
	}

	// The question is embedded locally. Similarities are only comparable
	// within one model, so indexes built with a different model are skipped
	// until the nightly rebuild replaces them.
	if (docsIndex && !indexMatchesModel(docsIndex, "docs index")) {
		docsIndex = undefined;
	}
	if (postsIndex && !indexMatchesModel(postsIndex, "posts index")) {
		postsIndex = undefined;
	}
	if (!docsIndex && !postsIndex) return false;

	const question = cleanQuestion(post.title, post.body ?? "");
	const [questionEmbedding] = await embed([question]);

	// Feedback guardrail: check the question against previously
	// downvoted answers collected by collectDocsFeedback.cjs
	let suppression = "allow";
	const feedbackPath = process.env.DOCS_FEEDBACK_PATH;
	if (feedbackPath) {
		/** @type {any} */
		let feedback;
		try {
			feedback = JSON.parse(await fs.readFile(feedbackPath, "utf8"));
		} catch {
			console.log(`No feedback data found at ${feedbackPath}`);
		}
		suppression = checkSuppression(
			questionEmbedding,
			feedback,
			EMBEDDING_MODEL,
		);
	}

	const chunks = docsIndex && suppression !== "silent"
		? retrieveDocsChunks(question, questionEmbedding, docsIndex)
		: undefined;

	const postsSection = postsIndex
		? buildRelatedPostsSection(postsIndex, questionEmbedding, {
			type: isDiscussion ? "discussion" : "issue",
			number: post.number,
		})
		: undefined;

	if (chunks) {
		// Hand off to the agentic judge, which decides whether the docs
		// answer the question. Posting moves to the judge's safe-output job,
		// so the related-posts section survives a low-confidence verdict.
		const handoffPath = process.env.DOCS_HANDOFF_PATH;
		if (!handoffPath) {
			throw new Error(
				"DOCS_HANDOFF_PATH environment variable is required",
			);
		}
		await fs.mkdir(path.dirname(handoffPath), { recursive: true });
		await fs.writeFile(
			handoffPath,
			JSON.stringify({
				question,
				allowAnswer: suppression === "allow",
				chunks,
				postsSection: postsSection ?? null,
			}),
		);
		// The judge only needs the question and the excerpt text - the
		// full chunks carry embedding vectors that would be pure noise
		// in its context
		await fs.writeFile(
			path.join(path.dirname(handoffPath), "judge-input.json"),
			JSON.stringify({
				question,
				excerpts: chunks.map(({ breadcrumbs, text }) => ({
					breadcrumbs,
					text,
				})),
			}),
		);
		console.log(`Wrote handoff for the judge to ${handoffPath}`);
		return true;
	}

	if (postsSection) {
		await composeAndPostAnswer(
			param,
			post,
			isDiscussion,
			undefined,
			postsSection,
		);
		return false;
	}

	console.log("Nothing to answer or suggest, skipping");
	return false;
}

/**
 * Posts the answer comment based on the agentic judge's verdict.
 * Runs as a custom safe-output job after the judge.
 *
 * Expects the following environment variables:
 * - GH_AW_AGENT_OUTPUT: path to the agent output file containing the verdict
 * - DOCS_HANDOFF_PATH: path to the handoff file written by prepareDocsAnswer
 *
 * @param {{github: Github, context: Context}} param
 */
async function postDocsAnswer(param) {
	const { post, isDiscussion } = postFromContext(param.context);
	if (!post) {
		console.log("No issue or discussion in payload, skipping");
		return;
	}

	// The handoff crosses a job boundary as an artifact, so treat its
	// content as data, not trusted structure.
	/** @type {any} */
	let handoff;
	try {
		handoff = JSON.parse(
			await fs.readFile(
				/** @type {string} */ (process.env.DOCS_HANDOFF_PATH),
				"utf8",
			),
		);
	} catch (e) {
		console.log(`::warning::Could not read the handoff: ${e.message}`);
		return;
	}
	if (!Array.isArray(handoff?.chunks)) {
		console.log("::warning::Malformed handoff, skipping");
		return;
	}

	const verdict = await readAgentOutputItem("post_docs_answer");
	if (!verdict) {
		console.log(
			"::warning::The judge did not produce a verdict - no comment is posted",
		);
		return;
	}
	console.log("Judge verdict:", JSON.stringify(verdict));

	const result = validateJudgeResponse({
		confidence: Number(verdict.confidence),
		answer: typeof verdict.answer === "string" && verdict.answer.trim()
			? verdict.answer
			: null,
		relatedExcerpts: parseRelatedExcerpts(verdict.related_excerpts),
	});

	const docsSection = renderDocsSection(
		result,
		handoff.chunks,
		handoff.allowAnswer === true,
	);
	const postsSection = typeof handoff.postsSection === "string"
		? handoff.postsSection
		: undefined;
	if (!docsSection && !postsSection) {
		console.log("Nothing to answer or suggest, skipping");
		return;
	}

	// The judge takes a while, re-check to avoid duplicate answers from
	// overlapping runs on edited posts
	if (await alreadyAnswered(param, post, isDiscussion)) {
		console.log("Already answered, skipping");
		return;
	}

	await composeAndPostAnswer(
		param,
		post,
		isDiscussion,
		docsSection,
		postsSection,
	);
}

module.exports = {
	prepareDocsAnswer,
	postDocsAnswer,
	alreadyAnswered,
	checkAnswerGates,
	composeAndPostAnswer,
	validateJudgeResponse,
	parseRelatedExcerpts,
	balanceCodeFences,
	checkSuppression,
	renderDocsSection,
	buildRelatedPostsSection,
	chunkUrl,
	MIN_SIMILARITY,
	POSTS_MIN_SIMILARITY,
	DOCS_ANSWER_COMMENT_TAG,
	DOCS_ANSWER_METADATA_TAG,
	DOCS_ANSWER_METADATA_VERSION,
	DOCS_BASE_URL,
};
