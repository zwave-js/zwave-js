// @ts-check

import { beforeEach, describe, expect, it } from "vitest";

const {
	MODEL_CACHE_KEY,
	embed,
	embedBatched,
	indexMatchesModel,
	setExtractor,
	setRetryHooks,
} = require("./localEmbeddings.cjs");

/** @type {string[][]} */
const extractorCalls = [];

beforeEach(() => {
	extractorCalls.length = 0;
	setExtractor(async (/** @type {string[]} */ batch) => {
		extractorCalls.push([...batch]);
		if (batch.includes("bad-shape")) {
			return { dims: [1, batch.length, 3], tolist: () => [] };
		}
		return {
			dims: [batch.length, 3],
			// Encode the input length so tests can verify ordering across
			// batches, plus an unrounded component for the rounding test
			tolist: () =>
				batch.map((text, i) => [text.length, i + 0.123456789, 0]),
		};
	});
});

describe("localEmbeddings", () => {
	it("returns an empty result for empty input without touching the pipeline", async () => {
		expect(await embed([])).toEqual([]);
		expect(extractorCalls.length).toBe(0);
	});

	it("embeds a single input as one 2D batch", async () => {
		const result = await embed(["ab"]);
		expect(result).toEqual([[2, 0.123456789, 0]]);
		expect(extractorCalls.pop()).toEqual(["ab"]);
	});

	it("splits input at the batch size and preserves input order", async () => {
		const inputs = Array.from(
			{ length: 33 },
			(_, i) => "x".repeat(i + 1),
		);
		const result = await embed(inputs);
		expect(result.length).toBe(33);
		// The first vector component is the input length
		expect(result.map((v) => v[0])).toEqual(
			inputs.map((text) => text.length),
		);
		expect(extractorCalls.splice(0).map((b) => b.length)).toEqual([
			32,
			1,
		]);
	});

	it("restores input order after length-sorted batching", async () => {
		const result = await embed(["xxx", "x", "xx"]);
		expect(result.map((v) => v[0])).toEqual([3, 1, 2]);
		expect(extractorCalls.pop()).toEqual(["x", "xx", "xxx"]);
	});

	it("rejects unexpected tensor shapes instead of guessing", async () => {
		await expect(embed(["bad-shape"])).rejects.toThrow(
			/Unexpected embedding tensor shape/,
		);
	});

	it("rounds index embeddings to 5 decimals", async () => {
		const [vector] = await embedBatched(["ab"]);
		expect(vector).toEqual([2, 0.12346, 0]);
	});

	describe("indexMatchesModel", () => {
		it("accepts an index stamped with the current model identity", () => {
			expect(
				indexMatchesModel({ modelKey: MODEL_CACHE_KEY }, "docs index"),
			).toBe(true);
		});

		it("rejects a missing index", () => {
			expect(indexMatchesModel(undefined, "docs index")).toBe(false);
		});

		it("rejects a mismatched model, revision or dtype", () => {
			// A different name, revision or dtype all change MODEL_CACHE_KEY
			for (
				const key of [
					"Xenova_other@rev@q8",
					`${MODEL_CACHE_KEY}-different-revision`,
					MODEL_CACHE_KEY.replace("q8", "fp32"),
				]
			) {
				expect(
					indexMatchesModel(
						{ model: "old", modelKey: key },
						"docs index",
					),
				).toBe(false);
			}
		});

		it("rejects a legacy index that predates the modelKey field", () => {
			expect(
				indexMatchesModel(
					{ model: "Xenova/all-MiniLM-L6-v2" },
					"docs index",
				),
			).toBe(false);
		});
	});

	describe("createExtractor retry", () => {
		it("retries with backoff, skipping the sleep after the final attempt", async () => {
			setExtractor(undefined);
			/** @type {number[]} */
			const sleeps = [];
			let attempts = 0;
			setRetryHooks({
				sleep: async (/** @type {number} */ ms) => {
					sleeps.push(ms);
				},
				pipeline: async () => {
					attempts++;
					if (attempts < 3) throw new Error("boom");
					return async (/** @type {string[]} */ batch) => ({
						dims: [batch.length, 1],
						tolist: () => batch.map(() => [1]),
					});
				},
			});
			const [vector] = await embed(["x"]);
			expect(vector).toEqual([1]);
			expect(attempts).toBe(3);
			// attempt*5000 for attempts 1 and 2, none after the third
			expect(sleeps).toEqual([5000, 10000]);
		});

		it("throws a wrapped error after exhausting retries, sleeping only twice", async () => {
			setExtractor(undefined);
			/** @type {number[]} */
			const sleeps = [];
			setRetryHooks({
				sleep: async (/** @type {number} */ ms) => {
					sleeps.push(ms);
				},
				pipeline: async () => {
					throw new Error("always down");
				},
			});
			await expect(embed(["x"])).rejects.toThrow(
				/Could not load the embedding model/,
			);
			expect(sleeps.length).toBe(2);
		});
	});
});
