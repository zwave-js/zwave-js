import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EmbeddingCache, type EmbeddingCacheKey } from "./embeddingCache.js";

// Package-local scratch directory (never the OS temp dir).
const scratchRoot = join(
	dirname(fileURLToPath(import.meta.url)),
	".test-tmp-embedding-cache",
);

const baseKey: EmbeddingCacheKey = {
	schemaVersion: 1,
	model: "Xenova/all-MiniLM-L6-v2",
	revision: "751bff37182d3f1213fa05d7196b954e230abad9",
	dimensions: 3,
};

describe("EmbeddingCache", () => {
	beforeEach(async () => {
		await mkdir(scratchRoot, { recursive: true });
	});

	afterEach(async () => {
		await rm(scratchRoot, { recursive: true, force: true });
	});

	it("returns undefined for an uncached semantic hash", async () => {
		const cache = new EmbeddingCache(scratchRoot, baseKey);
		expect(await cache.get("nonexistent-hash")).toBeUndefined();
	});

	it("persists and reloads an embedding across separate cache instances", async () => {
		const cache = new EmbeddingCache(scratchRoot, baseKey);
		await cache.set("hash-a", [0.1, 0.2, 0.3]);

		const reopened = new EmbeddingCache(scratchRoot, baseKey);
		expect(await reopened.get("hash-a")).toEqual([0.1, 0.2, 0.3]);
	});

	it("isolates entries by cache key (model/revision/dimensions)", async () => {
		const cache = new EmbeddingCache(scratchRoot, baseKey);
		await cache.set("hash-a", [0.1, 0.2, 0.3]);

		const otherRevision = new EmbeddingCache(scratchRoot, {
			...baseKey,
			revision: "different-revision",
		});
		expect(await otherRevision.get("hash-a")).toBeUndefined();

		const otherModel = new EmbeddingCache(scratchRoot, {
			schemaVersion: 1,
			model: "other-model",
			revision: "revision-1",
			dimensions: 3,
		});
		expect(await otherModel.get("hash-a")).toBeUndefined();
	});

	it("writes cache entries atomically, leaving no stray temp files behind", async () => {
		const cache = new EmbeddingCache(scratchRoot, baseKey);
		await cache.set("hash-atomic", [0.5, 0.5, 0.5]);

		const namespaceDirs = await readdir(scratchRoot);
		expect(namespaceDirs).toHaveLength(1);
		const entries = await readdir(join(scratchRoot, namespaceDirs[0]));
		expect(entries).toEqual(["hash-atomic.json"]);
	});

	it("treats a corrupted cache file as a cache miss instead of throwing", async () => {
		const cache = new EmbeddingCache(scratchRoot, baseKey);
		await cache.set("hash-c", [1, 2, 3]);

		const namespaceDirs = await readdir(scratchRoot);
		const filePath = join(
			scratchRoot,
			namespaceDirs[0],
			"hash-c.json",
		);
		await writeFile(filePath, "{not valid json", "utf8");

		// A fresh cache instance (bypassing the in-memory map) must not throw.
		const reopened = new EmbeddingCache(scratchRoot, baseKey);
		await expect(reopened.get("hash-c")).resolves.toBeUndefined();
	});
});
