// @ts-check

// Single owner of the Actions cache key prefixes for the docs and posts
// embeddings indexes. Workflows and the restore-bot-index action read these
// via `node -p` so the version suffix lives in one place: bumping an index
// version namespaces its cache afresh and no stale entry is prefix-matched.

const { DOCS_INDEX_VERSION } = require("./docsIndex.cjs");
const { POSTS_INDEX_VERSION } = require("./postsIndex.cjs");

// The +2/+1 offsets carry over the cache generations that predate index
// versioning, so a version bump moves the prefix forward by the same step.
const DOCS_CACHE_PREFIX = `docs-embeddings-v${DOCS_INDEX_VERSION + 2}-`;
const POSTS_CACHE_PREFIX = `posts-embeddings-v${POSTS_INDEX_VERSION + 1}-`;

module.exports = {
	DOCS_CACHE_PREFIX,
	POSTS_CACHE_PREFIX,
};
