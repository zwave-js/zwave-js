// @ts-check

// Builds a semantic search index over GitHub issues and discussions
// by embedding their title + cleaned body using GitHub Models.
// Indexed are open issues, issues closed within the last year, and all
// discussions in the question categories.
// Usage: node buildPostsIndex.cjs <owner/repo> <output-file>
// Requires GITHUB_TOKEN with models:read permission and read access
// to the repository's issues and discussions.

const fs = require("node:fs/promises");
const path = require("node:path");
const { embed, EMBEDDING_MODEL } = require("./modelsApi.cjs");
const {
	POSTS_INDEX_VERSION,
	QUESTION_CATEGORY_SLUGS,
	hashPost,
	postEmbeddingText,
} = require("./postsIndex.cjs");

const GITHUB_API_BASE = "https://api.github.com";

// Closed issues older than this are no longer useful duplicate targets
const CLOSED_ISSUE_MAX_AGE_MS = 365 * 24 * 3600 * 1000;

// Stay well below the 64K tokens/request limit for embedding requests
const MAX_BATCH_TOKENS = 40_000;
const MAX_BATCH_INPUTS = 128;
// The free tier allows 15 requests/minute
const THROTTLE_MS = 4500;

/** @param {string} str */
function estimateTokens(str) {
	return Math.ceil(str.length / 4);
}

/**
 * Fetches all pages of a REST collection endpoint
 * @param {string} url Initial URL including query parameters
 * @param {string} token
 * @returns {Promise<any[]>}
 */
async function ghRestPaginated(url, token) {
	/** @type {any[]} */
	const results = [];
	/** @type {string | undefined} */
	let next = url;
	while (next) {
		const response = await fetch(next, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${token}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
		});
		if (!response.ok) {
			throw new Error(
				`GitHub API request failed with status ${response.status}: ${await response
					.text()
					.catch(() => "")}`,
			);
		}
		results.push(...await response.json());
		next = response.headers
			.get("link")
			?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
	}
	return results;
}

/**
 * @param {string} query
 * @param {object} variables
 * @param {string} token
 * @returns {Promise<any>}
 */
async function ghGraphql(query, variables, token) {
	const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});
	if (!response.ok) {
		throw new Error(
			`GitHub GraphQL request failed with status ${response.status}: ${await response
				.text()
				.catch(() => "")}`,
		);
	}
	const result = await response.json();
	if (result.errors?.length) {
		throw new Error(
			`GitHub GraphQL request failed: ${JSON.stringify(result.errors)}`,
		);
	}
	return result.data;
}

/**
 * Fetches open issues and issues closed within the last year
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 */
async function fetchIssues(owner, repo, token) {
	const closedCutoff = new Date(Date.now() - CLOSED_ISSUE_MAX_AGE_MS);

	const open = await ghRestPaginated(
		`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=open&per_page=100`,
		token,
	);
	// "since" filters on updated_at; closing an issue updates it, so all
	// issues closed within the window are included. Filter on closed_at
	// to drop issues that were merely commented on since the cutoff.
	const closed = await ghRestPaginated(
		`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=closed&since=${closedCutoff.toISOString()}&per_page=100`,
		token,
	);

	// The issues endpoint also returns PRs
	const issues = [
		...open,
		...closed.filter(
			(issue) =>
				issue.closed_at
				&& new Date(issue.closed_at) >= closedCutoff,
		),
	].filter((issue) => !issue.pull_request);

	return issues.map((issue) => ({
		type: /** @type {const} */ ("issue"),
		number: issue.number,
		title: issue.title,
		body: issue.body ?? "",
		url: issue.html_url,
		state: issue.state === "open"
			? /** @type {const} */ ("open")
			: /** @type {const} */ ("closed"),
		createdAt: issue.created_at,
		closedAt: issue.closed_at ?? null,
		labels: (issue.labels ?? []).map((/** @type {any} */ l) => l.name),
	}));
}

/**
 * Fetches all discussions in the question categories
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 */
async function fetchDiscussions(owner, repo, token) {
	const categoryData = await ghGraphql(
		`
		query getCategories($owner: String!, $repo: String!) {
			repository(owner: $owner, name: $repo) {
				discussionCategories(first: 25) {
					nodes { id slug }
				}
			}
		}
		`,
		{ owner, repo },
		token,
	);
	const categoryIds = categoryData.repository.discussionCategories.nodes
		.filter((/** @type {any} */ c) =>
			QUESTION_CATEGORY_SLUGS.includes(c.slug)
		)
		.map((/** @type {any} */ c) => c.id);

	/** @type {any[]} */
	const discussions = [];
	for (const categoryId of categoryIds) {
		/** @type {string | null} */
		let cursor = null;
		do {
			const data = await ghGraphql(
				`
				query getDiscussions($owner: String!, $repo: String!, $categoryId: ID!, $cursor: String) {
					repository(owner: $owner, name: $repo) {
						discussions(categoryId: $categoryId, first: 100, after: $cursor) {
							pageInfo { hasNextPage endCursor }
							nodes {
								number
								title
								body
								url
								closed
								closedAt
								createdAt
								answerChosenAt
							}
						}
					}
				}
				`,
				{ owner, repo, categoryId, cursor },
				token,
			);
			const page = data.repository.discussions;
			discussions.push(...page.nodes);
			cursor = page.pageInfo.hasNextPage
				? page.pageInfo.endCursor
				: null;
		} while (cursor);
	}

	return discussions.map((discussion) => ({
		type: /** @type {const} */ ("discussion"),
		number: discussion.number,
		title: discussion.title,
		body: discussion.body ?? "",
		url: discussion.url,
		state: discussion.answerChosenAt
			? /** @type {const} */ ("answered")
			: discussion.closed
			? /** @type {const} */ ("closed")
			: /** @type {const} */ ("open"),
		createdAt: discussion.createdAt,
		closedAt: discussion.closedAt ?? null,
		labels: [],
	}));
}

async function main() {
	const [repoSlug, outputFile] = process.argv.slice(2);
	const [owner, repo] = repoSlug?.split("/") ?? [];
	if (!owner || !repo || !outputFile) {
		console.error(
			"Usage: node buildPostsIndex.cjs <owner/repo> <output-file>",
		);
		process.exit(1);
	}
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		console.error("GITHUB_TOKEN environment variable is required");
		process.exit(1);
	}

	// Reuse embeddings from a previous index for unchanged posts
	/** @type {Map<string, number[]>} */
	const previousEmbeddings = new Map();
	try {
		const previous = JSON.parse(await fs.readFile(outputFile, "utf8"));
		if (
			previous.version === POSTS_INDEX_VERSION
			&& previous.model === EMBEDDING_MODEL
		) {
			for (const post of previous.posts) {
				previousEmbeddings.set(post.hash, post.embedding);
			}
			console.log(
				`Found previous index with ${previousEmbeddings.size} posts`,
			);
		}
	} catch {
		// No previous index available, embed everything
	}

	const issues = await fetchIssues(owner, repo, token);
	console.log(`Fetched ${issues.length} issues`);
	const discussions = await fetchDiscussions(owner, repo, token);
	console.log(`Fetched ${discussions.length} discussions`);

	const allPosts = [...issues, ...discussions].map(({ body, ...post }) => {
		const embeddedText = postEmbeddingText(post.title, body);
		const hash = hashPost(embeddedText);
		return {
			...post,
			hash,
			embeddedText,
			embedding: previousEmbeddings.get(hash),
		};
	});

	const pending = allPosts.filter((p) => !p.embedding);
	console.log(`${pending.length} posts need new embeddings`);

	// Batch the pending posts, respecting per-request limits
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
			`Embedding batch of ${batch.length} posts (~${batchTokens} tokens)...`,
		);
		const embeddings = await embed(
			batch.map((p) => p.embeddedText),
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
		version: POSTS_INDEX_VERSION,
		model: EMBEDDING_MODEL,
		createdAt: new Date().toISOString(),
		posts: allPosts.map(({ embeddedText, ...post }) => post),
	};
	await fs.mkdir(path.dirname(outputFile), { recursive: true });
	await fs.writeFile(outputFile, JSON.stringify(index));
	console.log(`Wrote index with ${allPosts.length} posts to ${outputFile}`);
}

if (require.main === module) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
