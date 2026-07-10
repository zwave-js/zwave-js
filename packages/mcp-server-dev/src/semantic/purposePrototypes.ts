import { cosineSimilarity } from "./ranking.js";
import type { ParameterCorpusRecord } from "./types.js";

export interface PurposePrototype {
	purpose: string;
	vector: number[];
	sampleSize: number;
	examples: ParameterCorpusRecord[];
}

function normalize(vector: number[]): number[] {
	const norm = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
	return norm === 0
		? vector.map(() => 0)
		: vector.map((value) => value / norm);
}

export function normalizedCentroid(vectors: number[][]): number[] {
	if (vectors.length === 0) return [];
	const dimensions = vectors[0].length;
	if (vectors.some((vector) => vector.length !== dimensions)) {
		throw new Error(
			"Cannot combine purpose embeddings with different dimensions.",
		);
	}
	const centroid = Array.from({ length: dimensions }, () => 0);
	for (const vector of vectors) {
		const normalized = normalize(vector);
		for (let i = 0; i < dimensions; i++) {
			centroid[i] += normalized[i];
		}
	}
	return normalize(centroid);
}

/** Builds one prototype per purpose. Repeated uses of an
 * identical semantic definition contribute once, so popular templates do not
 * dominate the inferred meaning. */
export async function buildPurposePrototypes(
	records: ParameterCorpusRecord[],
	getEmbedding: (semanticHash: string) => Promise<number[] | undefined>,
): Promise<PurposePrototype[]> {
	const grouped = new Map<
		string,
		Map<string, { record: ParameterCorpusRecord; vector: number[] }>
	>();
	for (const record of records) {
		const purpose = record.semantics.purpose;
		if (!purpose || !record.semanticText) continue;
		const group = grouped.get(purpose) ?? new Map();
		if (group.has(record.semanticHash)) continue;
		const vector = await getEmbedding(record.semanticHash);
		if (!vector) continue;
		group.set(record.semanticHash, { record, vector });
		grouped.set(purpose, group);
	}

	const prototypes: PurposePrototype[] = [];
	for (const [purpose, samples] of grouped) {
		const values = [...samples.values()];
		const vector = normalizedCentroid(
			values.map((sample) => sample.vector),
		);
		const examples = values
			.map((sample) => ({
				record: sample.record,
				score: cosineSimilarity(sample.vector, vector),
			}))
			.toSorted((a, b) => b.score - a.score)
			.slice(0, 3)
			.map((sample) => sample.record);
		prototypes.push({
			purpose,
			vector,
			sampleSize: values.length,
			examples,
		});
	}
	return prototypes.toSorted((a, b) => a.purpose.localeCompare(b.purpose));
}

export function purposeConfidence(
	score: number,
	sampleSize: number,
): "low" | "medium" | "high" {
	if (score >= 0.75 && sampleSize >= 5) return "high";
	if (score >= 0.55 && sampleSize >= 2) return "medium";
	return "low";
}
