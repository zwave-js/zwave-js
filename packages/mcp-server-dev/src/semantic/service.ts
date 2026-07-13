import { clearTemplateCache } from "@zwave-js/config";
import { relative, resolve as resolvePath, sep } from "node:path";
import PQueue from "p-queue";
import { DEVICES_DIR } from "../configEnv.js";
import { resolveParamsForFirmware } from "../tools/resolveParam.js";
import {
	buildCorpus,
	buildSemanticText,
	extractSemantics,
	extractStructure,
} from "./corpus.js";
import type { ElicitConsentFn } from "./embedding.js";
import { EMBEDDING_CACHE_KEY, LocalEmbeddingProvider } from "./embedding.js";
import { EmbeddingCache } from "./embeddingCache.js";
import { type SemanticEnvConfig, parseSemanticEnv } from "./env.js";
import {
	type PurposePrototype,
	buildPurposePrototypes,
	purposeConfidence,
} from "./purposePrototypes.js";
import {
	DEFAULT_RANKING_WEIGHTS,
	type RankedResult,
	type RankingCandidate,
	type RankingQuery,
	type StructuralDiffEntry,
	cosineSimilarity,
	diffStructure,
	rankCandidates,
} from "./ranking.js";
import type {
	Corpus,
	CorpusRecord,
	CorpusSemantics,
	CorpusStructure,
	DeviceContext,
	ParameterCorpusRecord,
	TemplateCorpusRecord,
} from "./types.js";

export class SemanticSearchError extends Error {
	constructor(message: string, public readonly code: string) {
		super(message);
		this.name = "SemanticSearchError";
	}
}

export interface SearchFilters {
	manufacturer?: string;
	purpose?: string;
	kind?: "parameter" | "template" | "both";
}

interface RankedScores {
	score: number;
	cosine: number;
	lexical: number;
	structural: number;
	purposeMatch: boolean;
}

/** The embedding model used, so agents can tell which model produced the scores */
export interface ModelInfo {
	model: string;
	revision: string;
}

const MODEL_INFO: ModelInfo = {
	model: EMBEDDING_CACHE_KEY.model,
	revision: EMBEDDING_CACHE_KEY.revision,
};

export type ParameterSearchResult =
	& Omit<ParameterCorpusRecord, "id" | "semanticHash" | "semanticText">
	& RankedScores;

export type TemplateSearchResult =
	& Omit<TemplateCorpusRecord, "id" | "semanticHash" | "semanticText">
	& RankedScores;

export interface SearchResponse {
	query: string;
	provider: ModelInfo;
	parameters: ParameterSearchResult[];
	templates: TemplateSearchResult[];
	corpusWarnings: number;
}

export type SimilarParameterResult = ParameterSearchResult & {
	diffs: StructuralDiffEntry[];
};

export type SimilarTemplateResult = TemplateSearchResult & {
	diffs: StructuralDiffEntry[];
};

export interface TemplateImportSuggestion {
	importSpecifier: string;
	templateFile: string;
	templateName: string;
	evidenceFile: string;
	evidenceScore: number;
}

export interface PurposeSuggestion {
	purpose: string;
	score: number;
	sampleSize: number;
	confidence: "low" | "medium" | "high";
	examples: {
		file: string;
		line: number;
		parameterNumber: number;
		valueBitMask?: number;
		label?: string;
		description?: string;
		unit?: string;
	}[];
}

export interface PurposeSuggestionResponse {
	query:
		| { text: string }
		| {
			file: string;
			relativeFile: string;
			parameterNumber: number;
			valueBitMask?: number;
			label?: string;
			description?: string;
		};
	provider: ModelInfo;
	suggestions: PurposeSuggestion[];
}

export interface FindSimilarResponse {
	query: {
		file: string;
		relativeFile: string;
		parameterNumber: number;
		valueBitMask?: number;
		condition?: string;
		semantics: CorpusSemantics;
		structure: CorpusStructure;
	};
	similarParameters: SimilarParameterResult[];
	similarTemplates: SimilarTemplateResult[];
	templateImportSuggestions: TemplateImportSuggestion[];
	purposeSuggestions: PurposeSuggestion[];
	corpusWarnings: number;
}

const NEIGHBOR_EVIDENCE_LIMIT = 20;
const NEIGHBOR_EVIDENCE_MIN_SCORE = 0.5;

function toResult<T extends CorpusRecord>(
	ranked: RankedResult<T>,
): Omit<T, "id" | "semanticHash" | "semanticText"> & RankedScores {
	const { record, ...scores } = ranked;
	const { id, semanticHash, semanticText, ...rest } = record;
	return { ...scores, ...rest };
}

interface QueryParameter {
	relativeFile: string;
	parameterNumber: number;
	valueBitMask?: number;
	condition?: string;
	semantics: CorpusSemantics;
	structure: CorpusStructure;
	semanticText: string;
	/** Identifies the source corpus record so it can be excluded from results */
	excludeId?: string;
}

function ambiguousPartialParameterError(
	parameter: number,
	filename: string,
): SemanticSearchError {
	return new SemanticSearchError(
		`Parameter #${parameter} in ${filename} has multiple partial `
			+ `parameters. Pass valueBitMask to select one.`,
		"ambiguous_parameter",
	);
}

/**
 * Orchestrates corpus building, embedding-cache-backed model access, and
 * hybrid ranking for the `search_parameter_definitions` and
 * `find_similar_parameters` MCP tools. A single instance is meant to be
 * reused for the lifetime of the server process; model state is built lazily
 * and only on first use. The corpus is rebuilt per
 * tool call so config edits are immediately visible; unchanged embeddings
 * continue to come from the persistent cache.
 */
export class SemanticSearchService {
	private readonly env: SemanticEnvConfig;
	private readonly getElicit: (() => ElicitConsentFn | undefined) | undefined;
	private provider: LocalEmbeddingProvider | undefined;
	private cache: EmbeddingCache | undefined;

	constructor(options: {
		env?: SemanticEnvConfig;
		/** Getter for the elicitation callback: called lazily (only once a local
		 * model download actually needs consent), so it can reflect client
		 * capabilities discovered after this service is constructed. Return
		 * `undefined` if the connected client does not support elicitation. */
		getElicit?: () => ElicitConsentFn | undefined;
	} = {}) {
		this.env = options.env ?? parseSemanticEnv();
		this.getElicit = options.getElicit;
	}

	private getProvider(): LocalEmbeddingProvider {
		if (!this.env.enabled) {
			throw new SemanticSearchError(
				"Semantic parameter search is disabled "
					+ "(ZWAVE_DEV_SEMANTIC_ENABLED=false). Set it to true to enable "
					+ "the semantic parameter tools.",
				"provider_disabled",
			);
		}
		if (!this.provider) {
			this.provider = new LocalEmbeddingProvider(
				this.env,
				this.getElicit,
			);
			this.cache = new EmbeddingCache(
				this.env.indexCacheDir,
				EMBEDDING_CACHE_KEY,
			);
		}
		return this.provider;
	}

	private getCache(): EmbeddingCache {
		this.getProvider();
		return this.cache!;
	}

	/** Ensures the index covers `corpus` and embeds `queryText`, returning its vector */
	private async prepare(
		corpus: Corpus,
		queryText: string,
	): Promise<number[]> {
		const provider = this.getProvider();
		await this.buildIndex(corpus);
		const [queryEmbedding] = await provider.embed([queryText]);
		return queryEmbedding;
	}

	private getPurposePrototypes(corpus: Corpus): Promise<PurposePrototype[]> {
		const cache = this.getCache();
		return buildPurposePrototypes(
			corpus.parameters,
			(hash) => cache.get(hash),
		);
	}

	/** Embeds and caches every corpus record's semantics that isn't already cached */
	private async buildIndex(corpus: Corpus): Promise<void> {
		const provider = this.getProvider();
		const cache = this.getCache();

		const textByHash = new Map<string, string>();
		for (const p of corpus.parameters) {
			textByHash.set(p.semanticHash, p.semanticText);
		}
		for (const t of corpus.templates) {
			textByHash.set(t.semanticHash, t.semanticText);
		}

		// Probe the cache concurrently: with a warm disk cache this is
		// thousands of small reads
		const queue = new PQueue({ concurrency: 64 });
		const probed = await queue.addAll(
			[...textByHash].map(([hash, text]) => async () =>
				(await cache.get(hash)) ? undefined : { hash, text }
			),
		);
		const missing = probed.filter((entry) => entry != undefined);
		if (missing.length === 0) return;

		const batchSize = 32;
		for (let i = 0; i < missing.length; i += batchSize) {
			const batch = missing.slice(i, i + batchSize);
			const vectors = await provider.embed(batch.map((b) => b.text));
			for (let j = 0; j < batch.length; j++) {
				await cache.set(batch[j].hash, vectors[j]);
			}
		}
	}

	private matchesFilters(
		filters: SearchFilters | undefined,
		device: DeviceContext | undefined,
		semantics: CorpusSemantics,
	): boolean {
		if (filters?.manufacturer) {
			const needle = filters.manufacturer.toLowerCase();
			const haystack = `${device?.manufacturer ?? ""} ${
				device?.manufacturerId ?? ""
			}`.toLowerCase();
			if (!haystack.includes(needle)) return false;
		}
		if (filters?.purpose && semantics.purpose !== filters.purpose) {
			return false;
		}
		return true;
	}

	private async rank<T extends CorpusRecord>(
		records: readonly T[],
		query: RankingQuery,
		include?: (record: T) => boolean,
	): Promise<RankedResult<T>[]> {
		const cache = this.getCache();
		const candidates: RankingCandidate<T>[] = [];
		for (const r of records) {
			if (include && !include(r)) continue;
			candidates.push({
				record: r,
				semanticText: r.semanticText,
				semantics: r.semantics,
				structure: r.structure,
				embedding: await cache.get(r.semanticHash),
			});
		}
		return rankCandidates(query, candidates, DEFAULT_RANKING_WEIGHTS);
	}

	async search(
		query: string,
		filters: SearchFilters | undefined,
		limit: number,
	): Promise<SearchResponse> {
		const corpus = await buildCorpus();
		const queryEmbedding = await this.prepare(corpus, query);
		const rankingQuery: RankingQuery = {
			text: query,
			embedding: queryEmbedding,
			purpose: filters?.purpose,
		};

		const [rankedParameters, rankedTemplates] = await Promise.all([
			filters?.kind === "template"
				? []
				: this.rank(
					corpus.parameters,
					rankingQuery,
					(r) => this.matchesFilters(filters, r.device, r.semantics),
				),
			filters?.kind === "parameter"
				? []
				: this.rank(
					corpus.templates,
					rankingQuery,
					(r) => this.matchesFilters(filters, undefined, r.semantics),
				),
		]);

		return {
			query,
			provider: MODEL_INFO,
			parameters: rankedParameters.slice(0, limit).map(toResult),
			templates: rankedTemplates.slice(0, limit).map(toResult),
			corpusWarnings: corpus.warnings.length,
		};
	}

	/** Resolves the parameter a `find_similar_parameters` call refers to, either from
	 * the corpus (conditionals preserved as-is) or, if `firmwareVersion` is given,
	 * fully evaluated the same way `resolve_config_param` does. */
	private async resolveQueryParameter(
		corpus: Corpus,
		filename: string,
		parameter: number,
		valueBitMask: number | undefined,
		firmwareVersion: string | undefined,
	): Promise<QueryParameter> {
		const absFile = resolvePath(filename);
		const relativeFile = relative(DEVICES_DIR, absFile);

		if (firmwareVersion != undefined) {
			clearTemplateCache();
			const matches = await resolveParamsForFirmware(
				absFile,
				parameter,
				valueBitMask,
				firmwareVersion,
			);
			if (matches.length === 0) {
				throw new SemanticSearchError(
					`No parameter #${parameter} found in ${filename} for firmware ${firmwareVersion}.`,
					"parameter_not_found",
				);
			}
			const bitMasks = new Set(matches.map((p) => p.valueBitMask));
			if (valueBitMask == undefined && bitMasks.size > 1) {
				throw ambiguousPartialParameterError(parameter, filename);
			}
			const match = matches[0];
			const semantics: CorpusSemantics = {
				label: match.label,
				description: match.description,
				unit: match.unit,
				purpose: match.purpose,
				optionLabels: match.options.map((o) => o.label),
			};
			const structure: CorpusStructure = {
				valueSize: match.valueSize,
				minValue: match.minValue,
				maxValue: match.maxValue,
				defaultValue: match.defaultValue,
				unsigned: match.unsigned,
				readOnly: match.readOnly,
				writeOnly: match.writeOnly,
				allowManualEntry: match.allowManualEntry,
				options: match.options.map((o) => ({
					value: o.value,
					label: o.label,
				})),
			};
			return {
				relativeFile,
				parameterNumber: parameter,
				valueBitMask: match.valueBitMask,
				semantics,
				structure,
				semanticText: buildSemanticText(semantics),
			};
		}

		const matches = corpus.parameters.filter((p) =>
			p.relativeFile === relativeFile
			&& p.parameterNumber === parameter
			&& (valueBitMask == undefined || p.valueBitMask === valueBitMask)
		);
		if (matches.length === 0) {
			throw new SemanticSearchError(
				`No parameter #${parameter} found in ${filename}. Run `
					+ `resolve_config_param first to confirm the parameter exists.`,
				"parameter_not_found",
			);
		}
		if (matches.length > 1) {
			const bitMasks = new Set(matches.map((m) => m.valueBitMask));
			if (valueBitMask == undefined && bitMasks.size > 1) {
				throw ambiguousPartialParameterError(parameter, filename);
			}
			const conditions = matches.map((m) => m.condition ?? "(none)")
				.join(", ");
			throw new SemanticSearchError(
				`Parameter #${parameter} in ${filename} has ${matches.length} `
					+ `firmware-conditional variants (conditions: ${conditions}). `
					+ `Pass firmwareVersion to disambiguate which one to compare.`,
				"ambiguous_parameter",
			);
		}
		const match = matches[0];
		return {
			relativeFile,
			parameterNumber: parameter,
			valueBitMask: match.valueBitMask,
			condition: match.condition,
			semantics: match.semantics,
			structure: match.structure,
			semanticText: match.semanticText,
			excludeId: match.id,
		};
	}

	async findSimilar(
		filename: string,
		parameter: number,
		valueBitMask: number | undefined,
		firmwareVersion: string | undefined,
		limit: number,
	): Promise<FindSimilarResponse> {
		const corpus = await buildCorpus();
		const queryParam = await this.resolveQueryParameter(
			corpus,
			filename,
			parameter,
			valueBitMask,
			firmwareVersion,
		);
		const queryEmbedding = await this.prepare(
			corpus,
			queryParam.semanticText,
		);
		const rankingQuery: RankingQuery = {
			text: queryParam.semanticText,
			embedding: queryEmbedding,
			purpose: queryParam.semantics.purpose,
			structure: queryParam.structure,
		};

		const [rankedParameters, rankedTemplates] = await Promise.all([
			this.rank(
				corpus.parameters,
				rankingQuery,
				(p) =>
					p.id !== queryParam.excludeId
					&& !(
						p.relativeFile === queryParam.relativeFile
						&& p.parameterNumber === queryParam.parameterNumber
						&& p.valueBitMask === queryParam.valueBitMask
					),
			),
			this.rank(corpus.templates, rankingQuery),
		]);

		const similarParameters: SimilarParameterResult[] = rankedParameters
			.slice(0, limit)
			.map((r) => ({
				...toResult(r),
				diffs: diffStructure(queryParam.structure, r.record.structure),
			}));
		const similarTemplates: SimilarTemplateResult[] = rankedTemplates
			.slice(0, limit)
			.map((r) => ({
				...toResult(r),
				diffs: diffStructure(queryParam.structure, r.record.structure),
			}));

		const neighbors = rankedParameters.slice(0, NEIGHBOR_EVIDENCE_LIMIT)
			.filter((r) => r.score >= NEIGHBOR_EVIDENCE_MIN_SCORE);

		const templateImportSuggestions = this.buildTemplateSuggestions(
			neighbors,
		);
		const purposeSuggestions = this.buildPurposeSuggestions(
			queryEmbedding,
			await this.getPurposePrototypes(corpus),
			queryParam.semantics.purpose,
			5,
		);

		return {
			query: {
				file: resolvePath(filename),
				relativeFile: queryParam.relativeFile,
				parameterNumber: queryParam.parameterNumber,
				valueBitMask: queryParam.valueBitMask,
				condition: queryParam.condition,
				semantics: queryParam.semantics,
				structure: queryParam.structure,
			},
			similarParameters,
			similarTemplates,
			templateImportSuggestions,
			purposeSuggestions,
			corpusWarnings: corpus.warnings.length,
		};
	}

	private buildTemplateSuggestions(
		neighbors: {
			record: ParameterCorpusRecord;
			score: number;
		}[],
	): TemplateImportSuggestion[] {
		const seen = new Set<string>();
		const suggestions: TemplateImportSuggestion[] = [];
		for (const n of neighbors) {
			const { templateFile, templateName } = n.record;
			if (!templateFile || !templateName) continue;
			const key = `${templateFile}#${templateName}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const posixRelative = relative(DEVICES_DIR, templateFile)
				.split(sep)
				.join("/");
			suggestions.push({
				importSpecifier: `~/${posixRelative}#${templateName}`,
				templateFile,
				templateName,
				evidenceFile: n.record.relativeFile,
				evidenceScore: n.score,
			});
			if (suggestions.length >= 5) break;
		}
		return suggestions;
	}

	private buildPurposeSuggestions(
		queryEmbedding: number[],
		prototypes: PurposePrototype[],
		excludePurpose: string | undefined,
		limit: number,
	): PurposeSuggestion[] {
		return prototypes
			.filter((prototype) => prototype.purpose !== excludePurpose)
			.map((prototype) => {
				const score = Math.max(
					0,
					cosineSimilarity(queryEmbedding, prototype.vector),
				);
				return {
					purpose: prototype.purpose,
					score,
					sampleSize: prototype.sampleSize,
					confidence: purposeConfidence(
						score,
						prototype.sampleSize,
					),
					examples: prototype.examples.map((example) => ({
						file: example.relativeFile,
						line: example.line,
						parameterNumber: example.parameterNumber,
						valueBitMask: example.valueBitMask,
						label: example.semantics.label,
						description: example.semantics.description,
						unit: example.semantics.unit,
					})),
				};
			})
			.toSorted((a, b) => b.score - a.score)
			.slice(0, limit);
	}

	async suggestPurposesForText(
		query: string,
		limit: number,
	): Promise<PurposeSuggestionResponse> {
		const corpus = await buildCorpus();
		const queryEmbedding = await this.prepare(corpus, query);
		return {
			query: { text: query },
			provider: MODEL_INFO,
			suggestions: this.buildPurposeSuggestions(
				queryEmbedding,
				await this.getPurposePrototypes(corpus),
				undefined,
				limit,
			),
		};
	}

	async suggestPurposesForParameter(
		filename: string,
		parameter: number,
		valueBitMask: number | undefined,
		firmwareVersion: string | undefined,
		limit: number,
	): Promise<PurposeSuggestionResponse> {
		const corpus = await buildCorpus();
		const query = await this.resolveQueryParameter(
			corpus,
			filename,
			parameter,
			valueBitMask,
			firmwareVersion,
		);
		const queryEmbedding = await this.prepare(corpus, query.semanticText);
		return {
			query: {
				file: resolvePath(filename),
				relativeFile: query.relativeFile,
				parameterNumber: query.parameterNumber,
				valueBitMask: query.valueBitMask,
				label: query.semantics.label,
				description: query.semantics.description,
			},
			provider: MODEL_INFO,
			suggestions: this.buildPurposeSuggestions(
				queryEmbedding,
				await this.getPurposePrototypes(corpus),
				query.semantics.purpose,
				limit,
			),
		};
	}
}

// Re-export the pieces tool handlers need without reaching into internals
export { extractSemantics, extractStructure };
export type { ElicitConsentFn };
