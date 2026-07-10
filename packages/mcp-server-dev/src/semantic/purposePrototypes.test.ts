import { describe, expect, it } from "vitest";
import {
	buildPurposePrototypes,
	normalizedCentroid,
	purposeConfidence,
} from "./purposePrototypes.js";
import type { ParameterCorpusRecord } from "./types.js";

function record(
	id: string,
	purpose: string,
	semanticHash: string,
): ParameterCorpusRecord {
	return {
		kind: "parameter",
		id,
		file: `/devices/${id}.json`,
		relativeFile: `${id}.json`,
		line: 1,
		parameterNumber: 1,
		device: {},
		semantics: {
			label: id,
			purpose,
			optionLabels: [],
		},
		structure: { options: [] },
		semanticHash,
		semanticText: id,
	};
}

describe("normalizedCentroid", () => {
	it("averages directions and normalizes the result", () => {
		const centroid = normalizedCentroid([
			[1, 0],
			[0, 1],
		]);
		expect(centroid[0]).toBeCloseTo(Math.SQRT1_2);
		expect(centroid[1]).toBeCloseTo(Math.SQRT1_2);
	});

	it("rejects inconsistent dimensions", () => {
		expect(() => normalizedCentroid([[1, 0], [1]])).toThrow(
			"different dimensions",
		);
	});
});

describe("buildPurposePrototypes", () => {
	it("deduplicates identical semantic definitions within each purpose", async () => {
		const vectors = new Map([
			["same", [1, 0]],
			["other", [0.8, 0.2]],
		]);
		const prototypes = await buildPurposePrototypes(
			[
				record("a", "timer.auto_off", "same"),
				record("b", "timer.auto_off", "same"),
				record("c", "timer.auto_off", "other"),
			],
			async (hash) => vectors.get(hash),
		);
		expect(prototypes).toHaveLength(1);
		expect(prototypes[0].sampleSize).toBe(2);
		expect(prototypes[0].examples.length).toBe(2);
	});
});

describe("purposeConfidence", () => {
	it("requires both similarity and supporting samples", () => {
		expect(purposeConfidence(0.8, 5)).toBe("high");
		expect(purposeConfidence(0.6, 2)).toBe("medium");
		expect(purposeConfidence(0.9, 1)).toBe("low");
	});
});
