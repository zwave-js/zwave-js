// @ts-check

import { describe, expect, it } from "vitest";
import {
	computeStaleness,
	indexHasContent,
	selectArtifact,
} from "./restoreBotIndex.cjs";

describe("restoreBotIndex", () => {
	describe("indexHasContent", () => {
		it("accepts a docs index with chunks", () => {
			expect(indexHasContent({ chunks: [{}] })).toBe(true);
		});

		it("accepts a posts index with posts", () => {
			expect(indexHasContent({ posts: [{}, {}] })).toBe(true);
		});

		it("rejects an empty or missing collection", () => {
			expect(indexHasContent({ chunks: [] })).toBe(false);
			expect(indexHasContent({ posts: [] })).toBe(false);
			expect(indexHasContent({})).toBe(false);
			expect(indexHasContent(null)).toBe(false);
			expect(indexHasContent(undefined)).toBe(false);
		});

		it("rejects a non-array collection", () => {
			expect(indexHasContent({ chunks: "nope" })).toBe(false);
		});
	});

	describe("selectArtifact", () => {
		const onBranch = (overrides = {}) => ({
			expired: false,
			created_at: "2026-01-01T00:00:00Z",
			workflow_run: {
				id: 1,
				head_branch: "master",
				head_repository_id: 42,
				repository_id: 42,
			},
			...overrides,
		});

		it("returns undefined when nothing qualifies", () => {
			expect(selectArtifact([], "master")).toBeUndefined();
		});

		it("skips expired artifacts", () => {
			expect(selectArtifact([onBranch({ expired: true })], "master"))
				.toBeUndefined();
		});

		it("skips artifacts from another branch", () => {
			const fork = onBranch({
				workflow_run: {
					id: 2,
					head_branch: "master",
					head_repository_id: 99,
					repository_id: 42,
				},
			});
			expect(selectArtifact([fork], "master")).toBeUndefined();
		});

		it("skips artifacts not built on the default branch", () => {
			const feature = onBranch({
				workflow_run: {
					id: 3,
					head_branch: "feature",
					head_repository_id: 42,
					repository_id: 42,
				},
			});
			expect(selectArtifact([feature], "master")).toBeUndefined();
		});

		it("picks the newest qualifying artifact", () => {
			const older = onBranch({ created_at: "2026-01-01T00:00:00Z" });
			const newer = onBranch({
				created_at: "2026-02-01T00:00:00Z",
				workflow_run: {
					id: 7,
					head_branch: "master",
					head_repository_id: 42,
					repository_id: 42,
				},
			});
			expect(selectArtifact([older, newer], "master").workflow_run.id)
				.toBe(7);
		});
	});

	describe("computeStaleness", () => {
		const now = Date.UTC(2026, 0, 10);

		it("is fresh when the newest artifact is within the limit", () => {
			const r = computeStaleness({
				artifactCreated: "2026-01-09T00:00:00Z",
				searched: true,
				maxAgeDays: 3,
				now,
			});
			expect(r.stale).toBe(false);
			expect(r.ageDays).toBe("1");
			expect(r.warning).toBeUndefined();
		});

		it("is stale and warns when the artifact is at or over the limit", () => {
			const r = computeStaleness({
				artifactCreated: "2026-01-05T00:00:00Z",
				searched: true,
				maxAgeDays: 3,
				now,
			});
			expect(r.stale).toBe(true);
			expect(r.ageDays).toBe("5");
			expect(r.warning).toMatch(/nightly rebuild may be failing/);
		});

		it("is stale on an unreadable timestamp", () => {
			const r = computeStaleness({
				artifactCreated: "not a date",
				searched: true,
				maxAgeDays: 3,
				now,
			});
			expect(r.stale).toBe(true);
			expect(r.ageDays).toBe("");
			expect(r.warning).toMatch(/Unreadable upload timestamp/);
		});

		it("is stale when the API answered with no artifact", () => {
			const r = computeStaleness({
				searched: true,
				maxAgeDays: 3,
				now,
			});
			expect(r.stale).toBe(true);
			expect(r.warning).toMatch(/published nothing/);
		});

		it("is stale when the API could not be reached", () => {
			const r = computeStaleness({
				searched: false,
				maxAgeDays: 3,
				now,
			});
			expect(r.stale).toBe(true);
			expect(r.warning).toMatch(/publication state unknown/);
		});
	});
});
