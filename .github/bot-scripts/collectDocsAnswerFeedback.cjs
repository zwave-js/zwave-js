// @ts-check

// Collects reactions to the docs answer bot's comments in issues and
// discussions and computes a weighted feedback score per answer.
// Reactions are the source of truth, so each run rescans the last
// FEEDBACK_WINDOW_DAYS and recomputes everything from scratch.
//
// Usage: node collectDocsAnswerFeedback.cjs <index-file> <feedback-out> <records-out>
// Requires GITHUB_TOKEN and GITHUB_REPOSITORY in the environment.
//
// <feedback-out> receives the suppression list (downvoted questions with
// embeddings) consumed by answerFromDocs.cjs, <records-out> the full
// feedback records consumed by updateDocsFeedbackIssue.cjs.

const fs = require("node:fs/promises");
const path = require("node:path");
const {
	cleanQuestion,
	DOCS_ANSWER_COMMENT_TAG,
	DOCS_ANSWER_METADATA_TAG,
	DOCS_ANSWER_METADATA_VERSION,
	DOCS_BASE_URL,
} = require("./answerFromDocs.cjs");
const { embed } = require("./modelsApi.cjs");
const { authorizedUsers } = require("./users.cjs");

const BOT_USER = "zwave-js-bot";
const SCAN_WINDOW_DAYS = Number(process.env.FEEDBACK_WINDOW_DAYS || "180");

// Maintainers know best whether an answer is correct,
// the post's author knows best whether it helped
const MAINTAINER_WEIGHT = 5;
const AUTHOR_WEIGHT = 2;
const DEFAULT_WEIGHT = 1;

// A single drive-by downvote does not suppress future answers,
// a maintainer downvote or the author plus one other person does
const SUPPRESS_SCORE = -3;

// Reaction contents in REST ("+1") and GraphQL ("THUMBS_UP") notation
/** @type {Record<string, number>} */
const REACTION_SIGNS = {
	"+1": 1,
	heart: 1,
	hooray: 1,
	rocket: 1,
	"-1": -1,
	confused: -1,
	THUMBS_UP: 1,
	HEART: 1,
	HOORAY: 1,
	ROCKET: 1,
	THUMBS_DOWN: -1,
	CONFUSED: -1,
};

const API_BASE = "https://api.github.com";

/**
 * @param {string} pathAndQuery
 * @param {string} token
 * @returns {Promise<any>}
 */
async function ghGet(pathAndQuery, token) {
	const response = await fetch(`${API_BASE}${pathAndQuery}`, {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${token}`,
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	if (!response.ok) {
		throw new Error(
			`GitHub API request ${pathAndQuery} failed with status ${response.status}: ${await response
				.text()
				.catch(() => "")}`,
		);
	}
	return response.json();
}

/**
 * @param {string} query
 * @param {object} variables
 * @param {string} token
 * @returns {Promise<any>}
 */
async function ghGraphql(query, variables, token) {
	const response = await fetch(`${API_BASE}/graphql`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});
	const result = await response.json();
	if (!response.ok || result.errors) {
		throw new Error(
			`GitHub GraphQL request failed: ${
				JSON.stringify(result.errors ?? result)
			}`,
		);
	}
	return result.data;
}

/**
 * Extracts the metadata the bot embeds in its answer comments.
 * Comments from before the metadata tag existed fall back to
 * parsing the doc links from the comment body.
 * @param {string} body
 * @returns {{style: string, confidence: number | null, sections: string[]}}
 */
function parseAnswerMetadata(body) {
	const match = body.match(
		new RegExp(`<!-- ${DOCS_ANSWER_METADATA_TAG} (\\{.*?\\}) -->`),
	);
	if (match) {
		try {
			const metadata = JSON.parse(match[1]);
			// Fields of unknown metadata versions may not mean the same
			if (metadata.v === DOCS_ANSWER_METADATA_VERSION) {
				return {
					style: metadata.style ?? "answer",
					confidence: metadata.confidence ?? null,
					sections: metadata.sections ?? [],
				};
			}
		} catch {
			// Fall through to link parsing
		}
	}

	/** @type {string[]} */
	const sections = [];
	const linkRegex = new RegExp(
		`\\]\\(${DOCS_BASE_URL}/([^)?]*)(?:\\?id=([^)]*))?\\)`,
		"g",
	);
	for (const link of body.matchAll(linkRegex)) {
		// chunkUrl() strips (README|index).md, assume README.md for bare paths
		const file = link[1].endsWith("/") || link[1] === ""
			? `${link[1]}README.md`
			: `${link[1]}.md`;
		sections.push(`${file}#${link[2] ?? ""}`);
	}
	return { style: "answer", confidence: null, sections };
}

/**
 * @param {string} login
 * @param {string} postAuthor
 */
function reactionWeight(login, postAuthor) {
	if (
		authorizedUsers.some((u) => u.toLowerCase() === login.toLowerCase())
	) {
		return MAINTAINER_WEIGHT;
	}
	if (login.toLowerCase() === postAuthor.toLowerCase()) {
		return AUTHOR_WEIGHT;
	}
	return DEFAULT_WEIGHT;
}

/**
 * Turns raw reactions into weighted votes and a net score
 * @param {{user: string, content: string}[]} reactions
 * @param {string} postAuthor
 */
function scoreReactions(reactions, postAuthor) {
	const votes = [];
	let score = 0;
	for (const { user, content } of reactions) {
		const sign = REACTION_SIGNS[content];
		if (!sign || !user || user.endsWith("[bot]")) continue;
		const weight = reactionWeight(user, postAuthor);
		votes.push({ user, content, weight: sign * weight });
		score += sign * weight;
	}
	return { votes, score };
}

/**
 * @typedef {object} FeedbackRecord
 * @property {"issue" | "discussion"} type
 * @property {string} postUrl
 * @property {string} commentUrl
 * @property {string} title
 * @property {string} author
 * @property {string} question
 * @property {string} style
 * @property {number | null} confidence
 * @property {string[]} sections
 * @property {{user: string, content: string, weight: number}[]} votes
 * @property {number} score
 */

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} since yyyy-mm-dd
 * @param {string} token
 * @returns {Promise<FeedbackRecord[]>}
 */
async function collectFromIssues(owner, repo, since, token) {
	/** @type {FeedbackRecord[]} */
	const records = [];

	const query = encodeURIComponent(
		`repo:${owner}/${repo} is:issue commenter:${BOT_USER} updated:>=${since}`,
	);
	/** @type {any[]} */
	const issues = [];
	for (let page = 1;; page++) {
		const result = await ghGet(
			`/search/issues?q=${query}&per_page=100&page=${page}`,
			token,
		);
		issues.push(...result.items);
		if (issues.length >= result.total_count || result.items.length === 0) {
			break;
		}
	}

	for (const issue of issues) {
		/** @type {any[]} */
		const comments = await ghGet(
			`/repos/${owner}/${repo}/issues/${issue.number}/comments?per_page=100`,
			token,
		);
		const answers = comments.filter((c) =>
			c.user?.login === BOT_USER
			&& c.body?.includes(DOCS_ANSWER_COMMENT_TAG)
		);
		for (const answer of answers) {
			/** @type {{user: string, content: string}[]} */
			let reactions = [];
			if (answer.reactions?.total_count > 0) {
				/** @type {any[]} */
				const raw = await ghGet(
					`/repos/${owner}/${repo}/issues/comments/${answer.id}/reactions?per_page=100`,
					token,
				);
				reactions = raw.map((r) => ({
					user: r.user?.login ?? "",
					content: r.content,
				}));
			}
			const author = issue.user?.login ?? "";
			const { votes, score } = scoreReactions(reactions, author);
			records.push({
				type: "issue",
				postUrl: issue.html_url,
				commentUrl: answer.html_url,
				title: issue.title,
				author,
				question: cleanQuestion(issue.title, issue.body ?? ""),
				...parseAnswerMetadata(answer.body),
				votes,
				score,
			});
		}
	}

	return records;
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} since yyyy-mm-dd
 * @param {string} token
 * @returns {Promise<FeedbackRecord[]>}
 */
async function collectFromDiscussions(owner, repo, since, token) {
	/** @type {FeedbackRecord[]} */
	const records = [];

	const searchQuery =
		`repo:${owner}/${repo} commenter:${BOT_USER} updated:>=${since}`;
	let cursor = null;
	for (;;) {
		const data = await ghGraphql(
			`
			query search($searchQuery: String!, $cursor: String) {
				search(type: DISCUSSION, query: $searchQuery, first: 25, after: $cursor) {
					pageInfo { hasNextPage endCursor }
					nodes {
						... on Discussion {
							title
							body
							url
							author { login }
							comments(first: 50) {
								nodes {
									body
									url
									author { login }
									reactions(first: 100) {
										nodes {
											content
											user { login }
										}
									}
								}
							}
						}
					}
				}
			}
			`,
			{ searchQuery, cursor },
			token,
		);

		for (const discussion of data.search.nodes) {
			const answers = (discussion.comments?.nodes ?? []).filter(
				(/** @type {any} */ c) =>
					c.author?.login === BOT_USER
					&& c.body?.includes(DOCS_ANSWER_COMMENT_TAG),
			);
			for (const answer of answers) {
				const reactions = (answer.reactions?.nodes ?? []).map(
					(/** @type {any} */ r) => ({
						user: r.user?.login ?? "",
						content: r.content,
					}),
				);
				const author = discussion.author?.login ?? "";
				const { votes, score } = scoreReactions(reactions, author);
				records.push({
					type: "discussion",
					postUrl: discussion.url,
					commentUrl: answer.url,
					title: discussion.title,
					author,
					question: cleanQuestion(
						discussion.title,
						discussion.body ?? "",
					),
					...parseAnswerMetadata(answer.body),
					votes,
					score,
				});
			}
		}

		if (!data.search.pageInfo.hasNextPage) break;
		cursor = data.search.pageInfo.endCursor;
	}

	return records;
}

/**
 * Collects all feedback on bot answers within the scan window
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @returns {Promise<FeedbackRecord[]>}
 */
async function collectFeedback(owner, repo, token) {
	const since = new Date(Date.now() - SCAN_WINDOW_DAYS * 86_400_000)
		.toISOString()
		.slice(0, 10);
	console.log(`Collecting feedback on bot answers since ${since}...`);

	const records = [
		...await collectFromIssues(owner, repo, since, token),
		...await collectFromDiscussions(owner, repo, since, token),
	];
	console.log(
		`Found ${records.length} bot answers, ${
			records.filter((r) => r.votes.length > 0).length
		} with feedback`,
	);
	return records;
}

async function main() {
	const [indexFile, feedbackOut, recordsOut] = process.argv.slice(2);
	if (!indexFile || !feedbackOut || !recordsOut) {
		console.error(
			"Usage: node collectDocsAnswerFeedback.cjs <index-file> <feedback-out> <records-out>",
		);
		process.exit(1);
	}
	const token = process.env.GITHUB_TOKEN;
	const repository = process.env.GITHUB_REPOSITORY;
	if (!token || !repository) {
		console.error(
			"GITHUB_TOKEN and GITHUB_REPOSITORY environment variables are required",
		);
		process.exit(1);
	}
	const [owner, repo] = repository.split("/");

	const index = JSON.parse(await fs.readFile(indexFile, "utf8"));
	const records = await collectFeedback(owner, repo, token);

	await fs.mkdir(path.dirname(recordsOut), { recursive: true });
	await fs.writeFile(recordsOut, JSON.stringify(records, undefined, "\t"));

	// The suppression list makes answerFromDocs.cjs demote responses
	// to questions similar to these. Embed with the same model as the
	// docs index so the runtime similarity comparison is valid.
	const downvoted = records.filter((r) => r.score <= SUPPRESS_SCORE);
	const embeddings = downvoted.length > 0
		? await embed(downvoted.map((r) => r.question), token, index.model)
		: [];
	const feedback = {
		createdAt: new Date().toISOString(),
		model: index.model,
		suppressed: downvoted.map((r, i) => ({
			question: r.question,
			embedding: embeddings[i],
			style: r.style,
			score: r.score,
			url: r.commentUrl,
		})),
	};
	await fs.mkdir(path.dirname(feedbackOut), { recursive: true });
	await fs.writeFile(feedbackOut, JSON.stringify(feedback));
	console.log(
		`Wrote ${downvoted.length} suppression entries to ${feedbackOut}`,
	);
}

if (require.main === module) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}

module.exports = {
	collectFeedback,
	parseAnswerMetadata,
	scoreReactions,
	SUPPRESS_SCORE,
	SCAN_WINDOW_DAYS,
};
