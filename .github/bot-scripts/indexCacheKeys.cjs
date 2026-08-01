// @ts-check

// Single owner of the Actions cache key prefixes for the docs and posts
// embeddings indexes. Workflows and the restore-bot-index action read these
// via `node -p` so the version suffix lives in one place: bumping an index
// version namespaces its cache afresh and no stale entry is prefix-matched.

const { DOCS_INDEX_VERSION } = require("./docsIndex.cjs");
const { POSTS_INDEX_VERSION } = require("./postsIndex.cjs");

// The "-index-" key family is distinct from the retired "-embeddings-"
// prefixes, so no version number can collide with an old cache generation
const DOCS_CACHE_PREFIX = `docs-index-v${DOCS_INDEX_VERSION}-`;
const POSTS_CACHE_PREFIX = `posts-index-v${POSTS_INDEX_VERSION}-`;

module.exports = {
	DOCS_CACHE_PREFIX,
	POSTS_CACHE_PREFIX,
};
