import {
	ConsentRequiredError,
	LocalModelUnavailableError,
	decideConsentAction,
	findConsentRecord,
	loadConsentStore,
	persistConsentDecision,
} from "./consent.js";
import type { ConsentDecision } from "./consent.js";
import type { EmbeddingCacheKey } from "./embeddingCache.js";
import {
	EMBEDDING_SCHEMA_VERSION,
	LOCAL_MODEL_APPROX_SIZE_MB,
	LOCAL_MODEL_DIMENSIONS,
	LOCAL_MODEL_ID,
	LOCAL_MODEL_LICENSE,
	LOCAL_MODEL_REVISION,
	LOCAL_MODEL_SOURCE,
	type SemanticEnvConfig,
} from "./env.js";

export interface ConsentPrompt {
	modelId: string;
	revision: string;
	license: string;
	source: string;
	approxSizeMb: number;
	cacheDir: string;
}

export type ElicitConsentFn = (
	prompt: ConsentPrompt,
) => Promise<{ decision: ConsentDecision }>;

export const EMBEDDING_CACHE_KEY: EmbeddingCacheKey = {
	schemaVersion: EMBEDDING_SCHEMA_VERSION,
	model: LOCAL_MODEL_ID,
	revision: LOCAL_MODEL_REVISION,
	dimensions: LOCAL_MODEL_DIMENSIONS,
};

/**
 * Local, in-process embedding model backed by `@huggingface/transformers`.
 * The model is only loaded (and only ever downloaded) the first time `embed()`
 * is called, gated by the configured download policy and, when needed, an
 * interactive consent elicitation.
 */
export class LocalEmbeddingProvider {
	readonly cacheKey = EMBEDDING_CACHE_KEY;
	private extractorPromise: Promise<any> | undefined;

	constructor(
		private readonly config: SemanticEnvConfig,
		/** Getter instead of a plain value: elicitation support is only known
		 * once the MCP client has connected and advertised its capabilities,
		 * which happens after this provider is constructed. */
		private readonly getElicit:
			| (() => ElicitConsentFn | undefined)
			| undefined,
	) {}

	private ensureExtractor(): Promise<any> {
		this.extractorPromise ??= this.loadExtractor().catch((error) => {
			this.extractorPromise = undefined;
			throw error;
		});
		return this.extractorPromise;
	}

	private async loadExtractor(): Promise<any> {
		const store = await loadConsentStore(this.config.consentFile);
		const stored = findConsentRecord(
			store,
			LOCAL_MODEL_ID,
			LOCAL_MODEL_REVISION,
		);
		const action = decideConsentAction(this.config.downloadPolicy, stored);

		if (action.type === "proceed") {
			try {
				return await this.createExtractor(action.localFilesOnly);
			} catch (error) {
				if (!action.localFilesOnly) throw error;
				throw new LocalModelUnavailableError(
					this.config.modelCacheDir,
					this.config.downloadPolicy,
				);
			}
		}

		// Consent is only needed for a download. Probe the local cache first so
		// a pre-fetched model remains usable without prompting.
		try {
			return await this.createExtractor(true);
		} catch {
			// Continue to consent handling below.
		}

		const elicit = this.getElicit?.();
		if (!elicit) {
			throw new ConsentRequiredError(
				this.config.modelCacheDir,
				this.config.consentFile,
			);
		}
		const result = await elicit({
			modelId: LOCAL_MODEL_ID,
			revision: LOCAL_MODEL_REVISION,
			license: LOCAL_MODEL_LICENSE,
			source: LOCAL_MODEL_SOURCE,
			approxSizeMb: LOCAL_MODEL_APPROX_SIZE_MB,
			cacheDir: this.config.modelCacheDir,
		});
		await persistConsentDecision(
			this.config.consentFile,
			LOCAL_MODEL_ID,
			LOCAL_MODEL_REVISION,
			result.decision,
		);
		if (result.decision !== "approve") {
			throw new LocalModelUnavailableError(
				this.config.modelCacheDir,
				this.config.downloadPolicy,
			);
		}

		return this.createExtractor(false);
	}

	private async createExtractor(localFilesOnly: boolean): Promise<any> {
		const { pipeline } = await import("@huggingface/transformers");
		return pipeline("feature-extraction", LOCAL_MODEL_ID, {
			cache_dir: this.config.modelCacheDir,
			local_files_only: localFilesOnly,
			revision: LOCAL_MODEL_REVISION,
			dtype: "q8",
		});
	}

	async embed(texts: string[]): Promise<number[][]> {
		if (texts.length === 0) return [];
		const extractor = await this.ensureExtractor();
		const output = await extractor(texts, {
			pooling: "mean",
			normalize: true,
		});
		const data = output.tolist() as number[][] | number[];
		const vectors: number[][] = Array.isArray(data[0])
			? data as number[][]
			: [data as number[]];

		for (const vector of vectors) {
			if (vector.length !== LOCAL_MODEL_DIMENSIONS) {
				throw new Error(
					`Local embedding model returned ${vector.length}-dimensional `
						+ `vectors, expected ${LOCAL_MODEL_DIMENSIONS}.`,
				);
			}
		}
		return vectors;
	}
}
