import { describe, expect, it } from "vitest";
import {
	cosineSimilarity,
	diffStructure,
	lexicalSimilarity,
	rankCandidates,
	structuralCompatibility,
	tokenize,
} from "./ranking.js";
import type { CorpusSemantics, CorpusStructure } from "./types.js";

function semantics(overrides: Partial<CorpusSemantics> = {}): CorpusSemantics {
	return { optionLabels: [], ...overrides };
}

function structure(overrides: Partial<CorpusStructure> = {}): CorpusStructure {
	return { options: [], ...overrides };
}

describe("tokenize", () => {
	it("lowercases, splits on non-alphanumerics, and drops stopwords/short tokens", () => {
		expect(tokenize("The Dimming Ramp-Rate, for manual control!")).toEqual([
			"dimming",
			"ramp",
			"rate",
			"manual",
			"control",
		]);
	});
});

describe("lexicalSimilarity", () => {
	it("is 1 for identical text", () => {
		expect(lexicalSimilarity("dimming ramp rate", "dimming ramp rate"))
			.toBe(1);
	});

	it("is 0 when there is no token overlap", () => {
		expect(
			lexicalSimilarity("dimming ramp rate", "battery report interval"),
		)
			.toBe(0);
	});

	it("is 0 when either side has no tokens", () => {
		expect(lexicalSimilarity("", "dimming ramp rate")).toBe(0);
		expect(lexicalSimilarity("the of to", "dimming ramp rate")).toBe(0);
	});

	it("scores partial overlap between 0 and 1", () => {
		const score = lexicalSimilarity(
			"dimming ramp rate",
			"dimming speed and ramp behavior",
		);
		expect(score).toBeGreaterThan(0);
		expect(score).toBeLessThan(1);
	});
});

describe("cosineSimilarity", () => {
	it("is 1 for identical vectors", () => {
		expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
	});

	it("is 0 for orthogonal vectors", () => {
		expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
	});

	it("is -1 for opposite vectors", () => {
		expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
	});

	it("returns 0 for mismatched lengths or empty vectors", () => {
		expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
		expect(cosineSimilarity([], [])).toBe(0);
	});
});

describe("structuralCompatibility", () => {
	it("returns 1 for two parameters with identical structure", () => {
		const a = structure({
			valueSize: 1,
			minValue: 0,
			maxValue: 99,
			allowManualEntry: true,
			unsigned: true,
			options: [{ value: 0, label: "Off" }, { value: 1, label: "On" }],
		});
		const b = structure({ ...a, options: [...a.options] });
		expect(structuralCompatibility(a, b)).toBeCloseTo(1);
	});

	it("returns a lower score when value size and range differ", () => {
		const a = structure({ valueSize: 1, minValue: 0, maxValue: 99 });
		const b = structure({ valueSize: 2, minValue: 100, maxValue: 199 });
		const score = structuralCompatibility(a, b);
		expect(score).toBeLessThan(1);
	});

	it("returns 0.5 when neither side has any comparable structural data", () => {
		expect(structuralCompatibility(structure(), structure())).toBe(0.5);
	});
});

describe("rankCandidates", () => {
	it("ranks higher cosine similarity above lower, all else equal", () => {
		const query = { text: "dimming ramp rate", embedding: [1, 0] };
		const results = rankCandidates(query, [
			{
				record: "far",
				semanticText: "unrelated text",
				semantics: semantics(),
				structure: structure(),
				embedding: [0, 1],
			},
			{
				record: "close",
				semanticText: "unrelated text",
				semantics: semantics(),
				structure: structure(),
				embedding: [1, 0],
			},
		]);
		expect(results[0].record).toBe("close");
		expect(results[0].cosine).toBeCloseTo(1);
		expect(results[1].cosine).toBeCloseTo(0);
	});

	it("boosts, but does not solely rely on, an exact purpose match", () => {
		const query = { text: "ramp rate", purpose: "dimming.ramp_rate" };
		const results = rankCandidates(query, [
			{
				record: "same-purpose-unrelated-text",
				semanticText: "completely different wording",
				semantics: semantics({ purpose: "dimming.ramp_rate" }),
				structure: structure(),
			},
			{
				record: "matching-text-no-purpose",
				semanticText: "ramp rate",
				semantics: semantics(),
				structure: structure(),
			},
		]);
		const samePurpose = results.find((r) =>
			r.record === "same-purpose-unrelated-text"
		)!;
		const matchingText = results.find((r) =>
			r.record === "matching-text-no-purpose"
		)!;
		expect(samePurpose.purposeMatch).toBe(true);
		// Matching wording should still outrank an unrelated-text purpose match.
		expect(matchingText.score).toBeGreaterThan(samePurpose.score);
	});

	it("sorts results by descending score", () => {
		const query = { text: "battery report interval" };
		const results = rankCandidates(query, [
			{
				record: "a",
				semanticText: "completely unrelated",
				semantics: semantics(),
				structure: structure(),
			},
			{
				record: "b",
				semanticText: "battery report interval",
				semantics: semantics(),
				structure: structure(),
			},
		]);
		expect(results[0].record).toBe("b");
		expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
	});
});

describe("diffStructure", () => {
	it("reports no diffs for identical structures", () => {
		const a = structure({ valueSize: 1, minValue: 0, maxValue: 10 });
		expect(diffStructure(a, { ...a })).toEqual([]);
	});

	it("reports each differing scalar field", () => {
		const a = structure({ valueSize: 1, minValue: 0, maxValue: 10 });
		const b = structure({ valueSize: 2, minValue: 0, maxValue: 20 });
		const diffs = diffStructure(a, b);
		const fields = diffs.map((d) => d.field);
		expect(fields).toContain("valueSize");
		expect(fields).toContain("maxValue");
		expect(fields).not.toContain("minValue");
	});

	it("reports an options diff when option labels differ", () => {
		const a = structure({
			options: [{ value: 0, label: "Off" }, { value: 1, label: "On" }],
		});
		const b = structure({
			options: [{ value: 0, label: "Disabled" }, {
				value: 1,
				label: "Enabled",
			}],
		});
		const diffs = diffStructure(a, b);
		expect(diffs.some((d) => d.field === "options")).toBe(true);
	});
});
