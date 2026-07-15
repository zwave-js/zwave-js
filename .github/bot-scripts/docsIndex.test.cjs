// @ts-check

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	DOCS_INDEX_VERSION,
	isValidChunk,
	loadDocsIndex,
} from "./docsIndex.cjs";

function chunk(overrides = {}) {
	return {
		file: "guide.md",
		anchor: "install",
		title: "Install",
		breadcrumbs: ["Guide", "Install"],
		text: "Install the package.",
		embedding: [1, 0, 0],
		...overrides,
	};
}

describe("docsIndex", () => {
	/** @type {string | undefined} */
	let directory;

	afterEach(async () => {
		if (directory) await rm(directory, { recursive: true, force: true });
		directory = undefined;
	});

	it("validates finite, non-empty, non-zero embeddings", () => {
		expect(isValidChunk(chunk())).toBe(true);
		for (
			const embedding of [
				[],
				[0, 0],
				[1, Number.NaN],
				[1, Number.POSITIVE_INFINITY],
				[1, "bad"],
			]
		) {
			expect(isValidChunk(chunk({ embedding }))).toBe(false);
		}
	});

	it("rejects malformed indexes and inconsistent dimensions", async () => {
		directory = await mkdtemp(path.join(tmpdir(), "docs-index-"));
		const file = path.join(directory, "index.json");
		await writeFile(
			file,
			JSON.stringify({
				version: DOCS_INDEX_VERSION,
				model: "model",
				chunks: [chunk(), chunk({ embedding: [1, 0] })],
			}),
		);
		expect(await loadDocsIndex(file)).toBeUndefined();

		await writeFile(
			file,
			JSON.stringify({
				version: DOCS_INDEX_VERSION + 1,
				model: "model",
				chunks: [chunk()],
			}),
		);
		expect(await loadDocsIndex(file)).toBeUndefined();
	});

	it("loads a valid index", async () => {
		directory = await mkdtemp(path.join(tmpdir(), "docs-index-"));
		const file = path.join(directory, "index.json");
		const index = {
			version: DOCS_INDEX_VERSION,
			model: "model",
			createdAt: "2026-01-01T00:00:00.000Z",
			chunks: [chunk()],
		};
		await writeFile(file, JSON.stringify(index));
		expect(await loadDocsIndex(file)).toEqual(index);
	});
});
