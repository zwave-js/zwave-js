// @ts-check

// Evaluates the retrieval quality of the related-posts suggestions
// against a golden set of questions with known related issues/discussions.
// Run daily in CI to catch regressions from changes to the cleaning/
// ranking logic or embedding model.
//
// Usage: node evalRelatedPosts.cjs <index-file>
// Requires GITHUB_TOKEN in the environment.

const fs = require("node:fs/promises");
const path = require("node:path");
const { embed } = require("./modelsApi.cjs");
const { rankRelatedPosts } = require("./postsIndex.cjs");

const NUM_RESULTS = 5;
// Allow a small number of misses before failing, retrieval is not exact
const MIN_HIT_RATE = Number(process.env.MIN_HIT_RATE || "0.8");

async function main() {
	const [indexFile] = process.argv.slice(2);
	if (!indexFile) {
		console.error("Usage: node evalRelatedPosts.cjs <index-file>");
		process.exit(1);
	}
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		console.error("GITHUB_TOKEN environment variable is required");
		process.exit(1);
	}

	const index = JSON.parse(await fs.readFile(indexFile, "utf8"));
	/** @type {{question: string, expectedPosts: {type: string, number: number}[]}[]} */
	const allCases = JSON.parse(
		await fs.readFile(
			path.join(__dirname, "relatedPostsEvalCases.json"),
			"utf8",
		),
	);

	// Expected posts can leave the index (closed issues age out after a
	// year), which is not a retrieval regression. Skip those cases.
	const inIndex = (/** @type {{type: string, number: number}} */ p) =>
		index.posts.some(
			(/** @type {any} */ ip) =>
				ip.type === p.type && ip.number === p.number,
		);
	const cases = allCases.filter((c) => {
		if (c.expectedPosts.some(inIndex)) return true;
		console.log(
			`⏭️ ${
				c.question.split("\n")[0]
			} - no expected post in the index anymore, skipping`,
		);
		return false;
	});

	// A single batched request embeds all eval questions at once
	const embeddings = await embed(
		cases.map((c) => c.question),
		token,
		index.model,
	);

	let hits = 0;
	const failures = [];
	for (let i = 0; i < cases.length; i++) {
		const { question, expectedPosts } = cases[i];
		const results = rankRelatedPosts(
			index,
			embeddings[i],
			// Eval questions are not posts themselves, exclude nothing
			{ type: "", number: 0 },
			{ minSimilarity: 0, maxResults: NUM_RESULTS },
		);
		const retrieved = results.map(
			({ post, similarity }) =>
				`${post.type} #${post.number} (cos=${similarity.toFixed(3)})`,
		);
		const hit = expectedPosts.some((e) =>
			results.some(
				({ post }) => post.type === e.type && post.number === e.number,
			)
		);
		const title = question.split("\n")[0];
		const expected = expectedPosts.map((e) => `${e.type} #${e.number}`);
		if (hit) {
			hits++;
			console.log(`✅ ${title}`);
		} else {
			failures.push({ title, expected, retrieved });
			console.log(`❌ ${title}`);
			console.log(`   expected one of: ${expected.join(", ")}`);
			console.log(`   retrieved: ${retrieved.join(", ")}`);
		}
	}

	const hitRate = hits / cases.length;
	console.log(
		`\nhit@${NUM_RESULTS}: ${hits}/${cases.length} (${
			(hitRate * 100).toFixed(1)
		}%), required: ${(MIN_HIT_RATE * 100).toFixed(1)}%`,
	);

	// Write a summary for the workflow to include in the tracking issue
	if (process.env.GITHUB_OUTPUT) {
		const summary = [
			`hit@${NUM_RESULTS}: ${hits}/${cases.length} (${
				(hitRate * 100).toFixed(1)
			}%)`,
			...failures.map((f) =>
				`- ❌ ${f.title}\n  - expected one of: ${
					f.expected.join(", ")
				}\n  - retrieved: ${f.retrieved.join(", ")}`
			),
		].join("\n");
		await fs.appendFile(
			process.env.GITHUB_OUTPUT,
			`summary<<EOF\n${summary}\nEOF\n`,
		);
	}

	if (hitRate < MIN_HIT_RATE) {
		process.exit(1);
	}
}

if (require.main === module) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
