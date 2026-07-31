// @ts-check

const fs = require("node:fs");

const MS_PER_DAY = 86_400_000;

/**
 * Parseable JSON is not enough: a truncated embeddings response or an
 * interrupted write leaves a file that loads fine and retrieves nothing.
 * @param {any} parsed
 */
function indexHasContent(parsed) {
	const chunks = parsed?.chunks ?? parsed?.posts;
	return Array.isArray(chunks) && chunks.length > 0;
}

/**
 * Reads and validates the restored index file.
 * @param {string} file
 * @returns {boolean}
 */
function readIndexFileIsUsable(file) {
	try {
		const stat = fs.statSync(file);
		if (!stat.isFile() || stat.size === 0) return false;
		return indexHasContent(JSON.parse(fs.readFileSync(file, "utf8")));
	} catch {
		return false;
	}
}

/**
 * Picks the newest usable index artifact. Pinned to a non-expired artifact
 * built on the default branch of this repository itself, so neither a fork PR
 * (whose head_branch can also be "master") nor an expired entry can be picked.
 * @param {any[]} artifacts
 * @param {string} branch
 * @returns {any | undefined}
 */
function selectArtifact(artifacts, branch) {
	return artifacts
		.filter((a) =>
			a?.expired === false
			&& a?.workflow_run?.head_branch === branch
			&& a?.workflow_run?.head_repository_id
				=== a?.workflow_run?.repository_id
		)
		.sort((a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		)[0];
}

/**
 * Decides whether a restored index is stale. Staleness is what catches a dead
 * nightly while the cache still serves a usable index. Upload time is the
 * signal, not the index's own createdAt: docs-embeddings skips the rebuild on a
 * cache hit, so unchanged content is still healthy - the nightly re-uploads
 * either way.
 * @param {{artifactCreated?: string, searched: boolean, maxAgeDays: number, now?: number}} param
 * @returns {{stale: boolean, ageDays: string, warning?: string}}
 */
function computeStaleness({ artifactCreated, searched, maxAgeDays, now }) {
	const nowMs = now ?? Date.now();
	if (artifactCreated) {
		const createdMs = new Date(artifactCreated).getTime();
		if (Number.isNaN(createdMs)) {
			return {
				stale: true,
				ageDays: "",
				warning:
					`Unreadable upload timestamp for the index artifact ('${artifactCreated}')`,
			};
		}
		const ageDays = Math.floor((nowMs - createdMs) / MS_PER_DAY);
		if (ageDays >= maxAgeDays) {
			return {
				stale: true,
				ageDays: String(ageDays),
				warning:
					`The newest index artifact is ${ageDays} day(s) old (limit ${maxAgeDays}) - the nightly rebuild may be failing`,
			};
		}
		return { stale: false, ageDays: String(ageDays) };
	}
	if (searched) {
		// The API answered and there is nothing published: an outage, not a gap
		// in our knowledge. Only reachable on a cache hit, since a miss with no
		// artifact cannot produce an index at all.
		return {
			stale: true,
			ageDays: "",
			warning:
				"No unexpired index artifact exists - serving a cached index off a pipeline that has published nothing",
		};
	}
	return {
		stale: true,
		ageDays: "",
		warning:
			"Could not reach the artifacts API - publication state unknown",
	};
}

/**
 * github-script step: reports whether the cache restore yielded a usable index.
 * @param {{core: any}} param
 */
function checkCachedIndex({ core }) {
	const file = process.env.INDEX_FILE;
	const ok = !!file && readIndexFileIsUsable(file);
	core.setOutput("ok", ok ? "true" : "false");
	console.log(
		ok
			? `Cache hit: ${file}`
			: `Cache did not yield a usable ${file}`,
	);
}

/**
 * github-script step: finds the newest usable index artifact. A lookup failure
 * degrades to "no index" for the caller to handle via continue-on-error, it
 * must not take down a job triggered by someone opening an issue.
 * @param {{github: any, context: any, core: any}} param
 */
async function findIndexArtifact({ github, context, core }) {
	const { owner, repo } = context.repo;
	const name = process.env.ARTIFACT;

	// Read the branch pin from an authority that does not vary by trigger:
	// github.event.repository is absent from some payloads and github.ref_name
	// is only usually the default branch - neither belongs in a trust boundary.
	const { data: repoData } = await github.rest.repos.get({ owner, repo });
	const branch = repoData.default_branch;
	if (!branch) {
		core.setFailed(
			"Could not resolve the default branch - refusing to select an artifact",
		);
		return;
	}

	const artifacts = await github.paginate(
		github.rest.actions.listArtifactsForRepo,
		{ owner, repo, name, per_page: 100 },
	);

	// Reaching here at all means the API answered, which is what separates
	// "nothing published" (an outage) from "could not ask" (unknown)
	core.setOutput("searched", "true");

	const newest = selectArtifact(artifacts, branch);
	if (!newest) {
		console.log(`No unexpired ${name} artifact built on ${branch}`);
		return;
	}

	const id = newest.workflow_run?.id ?? "";
	const created = newest.created_at ?? "";
	console.log(
		`Newest usable ${name} artifact comes from run ${id || "?"}, uploaded ${
			created || "unknown"
		}`,
	);
	core.setOutput("id", String(id));
	core.setOutput("created", String(created));
}

/**
 * github-script step: reports what was restored and whether the pipeline
 * behind it looks alive.
 * @param {{core: any}} param
 */
function reportRestore({ core }) {
	const file = /** @type {string} */ (process.env.INDEX_FILE);
	const artifact = process.env.ARTIFACT;
	const fromCache = process.env.FROM_CACHE === "true";
	const artifactRun = process.env.ARTIFACT_RUN;
	const artifactCreated = process.env.ARTIFACT_CREATED || undefined;
	const searched = process.env.SEARCHED === "true";
	const lookup = process.env.LOOKUP || "skipped";
	const download = process.env.DOWNLOAD || "skipped";
	const maxAgeDays = Number(process.env.MAX_AGE_DAYS);

	if (!readIndexFileIsUsable(file)) {
		core.setOutput("found", "false");
		core.setOutput("stale", "true");
		core.setOutput("age-days", "");
		// Name the leg that failed - an expired artifact and a misconfigured
		// lookup look identical from the outside otherwise
		core.warning(
			`No ${file} (cache: miss, artifact lookup: ${lookup}, download: ${download}, run: ${
				artifactRun || "none"
			})`,
		);
		return;
	}

	core.setOutput("found", "true");
	console.log(
		fromCache
			? `Using ${file} from the Actions cache`
			: `Using ${file} from the ${artifact} artifact of run ${artifactRun}`,
	);

	const { stale, ageDays, warning } = computeStaleness({
		artifactCreated,
		searched,
		maxAgeDays,
	});
	if (artifactCreated && ageDays !== "") {
		console.log(
			`Newest ${artifact} artifact uploaded ${artifactCreated} (${ageDays} day(s) ago)`,
		);
	}
	if (warning) core.warning(warning);

	core.setOutput("stale", stale ? "true" : "false");
	core.setOutput("age-days", ageDays);
}

module.exports = {
	indexHasContent,
	selectArtifact,
	computeStaleness,
	checkCachedIndex,
	findIndexArtifact,
	reportRestore,
};
