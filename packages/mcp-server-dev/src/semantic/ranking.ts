import type { CorpusSemantics, CorpusStructure } from "./types.js";

const STOPWORDS = new Set([
	"a",
	"an",
	"the",
	"of",
	"to",
	"for",
	"and",
	"or",
	"in",
	"on",
	"is",
	"be",
	"this",
	"that",
	"with",
	"as",
	"at",
	"by",
]);

/** Lowercase word tokenizer shared by lexical scoring and dedupe */
export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Jaccard similarity between the token sets of two free-text strings, in [0, 1] */
export function lexicalSimilarity(a: string, b: string): number {
	return tokenSetSimilarity(new Set(tokenize(a)), b);
}

function tokenSetSimilarity(tokensA: ReadonlySet<string>, b: string): number {
	const tokensB = new Set(tokenize(b));
	if (tokensA.size === 0 || tokensB.size === 0) return 0;
	let intersection = 0;
	for (const t of tokensA) if (tokensB.has(t)) intersection++;
	const union = tokensA.size + tokensB.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

export function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length || a.length === 0) return 0;
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	if (normA === 0 || normB === 0) return 0;
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Structural compatibility in [0, 1]: how similar two parameters' machine-readable
 * shape is (size, range, entry mode, option set), independent of wording.
 */
export function structuralCompatibility(
	a: CorpusStructure,
	b: CorpusStructure,
): number {
	const scores: number[] = [];

	if (a.valueSize != undefined && b.valueSize != undefined) {
		scores.push(a.valueSize === b.valueSize ? 1 : 0);
	}
	if (a.allowManualEntry != undefined && b.allowManualEntry != undefined) {
		scores.push(a.allowManualEntry === b.allowManualEntry ? 1 : 0);
	}
	if (a.unsigned != undefined && b.unsigned != undefined) {
		scores.push(a.unsigned === b.unsigned ? 1 : 0);
	}

	if (a.minValue != undefined && a.maxValue != undefined) {
		scores.push(...rangeOverlapScore(a, b));
	}

	if (a.options.length > 0 || b.options.length > 0) {
		scores.push(optionSimilarity(a.options, b.options));
	}

	if (scores.length === 0) return 0.5; // no comparable structural data either way
	return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function rangeOverlapScore(a: CorpusStructure, b: CorpusStructure): number[] {
	if (b.minValue == undefined || b.maxValue == undefined) return [];
	const aMin = a.minValue!;
	const aMax = a.maxValue!;
	const bMin = b.minValue;
	const bMax = b.maxValue;
	const overlapStart = Math.max(aMin, bMin);
	const overlapEnd = Math.min(aMax, bMax);
	const overlap = Math.max(0, overlapEnd - overlapStart);
	const union = Math.max(aMax, bMax) - Math.min(aMin, bMin);
	if (union <= 0) return [aMin === bMin && aMax === bMax ? 1 : 0];
	return [overlap / union];
}

function optionSimilarity(
	a: readonly { value: number; label: string }[],
	b: readonly { value: number; label: string }[],
): number {
	if (a.length === 0 && b.length === 0) return 1;
	if (a.length === 0 || b.length === 0) return 0;
	const labelsA = new Set(a.map((o) => o.label.toLowerCase()));
	const labelsB = new Set(b.map((o) => o.label.toLowerCase()));
	let intersection = 0;
	for (const l of labelsA) if (labelsB.has(l)) intersection++;
	const union = labelsA.size + labelsB.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

export interface RankingWeights {
	cosine: number;
	lexical: number;
	structural: number;
	purposeBoost: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
	cosine: 0.55,
	lexical: 0.25,
	structural: 0.15,
	purposeBoost: 0.05,
};

export interface RankingQuery {
	text: string;
	embedding?: number[];
	purpose?: string;
	structure?: CorpusStructure;
}

export interface RankingCandidate<T> {
	record: T;
	semanticText: string;
	semantics: CorpusSemantics;
	structure: CorpusStructure;
	embedding?: number[];
}

export interface RankedResult<T> {
	record: T;
	score: number;
	cosine: number;
	lexical: number;
	structural: number;
	purposeMatch: boolean;
}

/**
 * Hybrid ranking combining embedding cosine similarity, lexical token overlap,
 * and structured compatibility. Each component stays visible on the result so
 * callers/agents can see *why* something matched. An exact `$purpose` match is
 * a small boost, not a substitute for the rest of the score, so unrelated
 * fields sharing a purpose tag don't drown out genuinely similar wording.
 */
export function rankCandidates<T>(
	query: RankingQuery,
	candidates: readonly RankingCandidate<T>[],
	weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
): RankedResult<T>[] {
	// Tokenize the query once instead of per candidate
	const queryTokens = new Set(tokenize(query.text));
	const results = candidates.map((candidate) => {
		const cosine = query.embedding && candidate.embedding
			? Math.max(
				0,
				cosineSimilarity(query.embedding, candidate.embedding),
			)
			: 0;
		const lexical = tokenSetSimilarity(queryTokens, candidate.semanticText);
		const structural = query.structure
			? structuralCompatibility(query.structure, candidate.structure)
			: 0;
		const purposeMatch = !!query.purpose
			&& !!candidate.semantics.purpose
			&& query.purpose === candidate.semantics.purpose;

		const score = weights.cosine * cosine
			+ weights.lexical * lexical
			+ weights.structural * structural
			+ (purposeMatch ? weights.purposeBoost : 0);

		return {
			record: candidate.record,
			score,
			cosine,
			lexical,
			structural,
			purposeMatch,
		};
	});

	results.sort((a, b) => b.score - a.score);
	return results;
}

export interface StructuralDiffEntry {
	field: string;
	queryValue: unknown;
	candidateValue: unknown;
}

/** Field-by-field structural diff between a query parameter and a candidate, used
 * so `find_similar_parameters` can explain in what way results differ. */
export function diffStructure(
	query: CorpusStructure,
	candidate: CorpusStructure,
): StructuralDiffEntry[] {
	const diffs: StructuralDiffEntry[] = [];
	const fields: (keyof CorpusStructure)[] = [
		"valueSize",
		"minValue",
		"maxValue",
		"defaultValue",
		"unsigned",
		"readOnly",
		"writeOnly",
		"allowManualEntry",
	];
	for (const field of fields) {
		const a = query[field];
		const b = candidate[field];
		if (a !== b) {
			diffs.push({ field, queryValue: a, candidateValue: b });
		}
	}

	const queryOptionLabels = query.options.map((o) => o.label).toSorted();
	const candidateOptionLabels = candidate.options.map((o) => o.label)
		.toSorted();
	if (queryOptionLabels.join("|") !== candidateOptionLabels.join("|")) {
		diffs.push({
			field: "options",
			queryValue: queryOptionLabels,
			candidateValue: candidateOptionLabels,
		});
	}

	return diffs;
}
