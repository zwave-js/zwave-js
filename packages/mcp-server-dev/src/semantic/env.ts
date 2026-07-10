import {
	defaultConsentFile,
	defaultIndexCacheDir,
	defaultModelCacheDir,
} from "./paths.js";

/** Pinned local embedding model. Update deliberately: changing the
 * revision requires users to re-consent to a new download (see consent.ts).
 */
export const LOCAL_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const LOCAL_MODEL_REVISION = "751bff37182d3f1213fa05d7196b954e230abad9";
export const LOCAL_MODEL_LICENSE = "Apache-2.0";
export const LOCAL_MODEL_SOURCE =
	"https://huggingface.co/Xenova/all-MiniLM-L6-v2";
/** Approximate size of the quantized (q8) ONNX weights plus tokenizer metadata */
export const LOCAL_MODEL_APPROX_SIZE_MB = 24;
export const LOCAL_MODEL_DIMENSIONS = 384;

/** Bump when the embedding cache entry shape or the corpus normalization changes */
export const EMBEDDING_SCHEMA_VERSION = 2;

export type LocalDownloadPolicy = "ask" | "allow" | "deny";

export interface SemanticEnvConfig {
	enabled: boolean;
	downloadPolicy: LocalDownloadPolicy;
	modelCacheDir: string;
	indexCacheDir: string;
	consentFile: string;
}

function parseBoolean(
	envVar: string,
	value: string | undefined,
	fallback: boolean,
): boolean {
	if (value == undefined || value === "") return fallback;
	if (value === "true") return true;
	if (value === "false") return false;
	throw new SemanticEnvError(
		`Invalid value "${value}" for ${envVar}. Expected true or false.`,
	);
}

export class SemanticEnvError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SemanticEnvError";
	}
}

function parseEnum<T extends string>(
	envVar: string,
	value: string | undefined,
	allowed: readonly T[],
	fallback: T,
): T {
	if (value == undefined || value === "") return fallback;
	if ((allowed as readonly string[]).includes(value)) return value as T;
	throw new SemanticEnvError(
		`Invalid value "${value}" for ${envVar}. Expected one of: ${
			allowed.join(", ")
		}`,
	);
}

/**
 * Parses the `ZWAVE_DEV_SEMANTIC_*` environment variables into a validated
 * config object. This is pure (besides reading its `env` argument) so it can
 * be unit tested without touching the network or filesystem.
 */
export function parseSemanticEnv(
	env: NodeJS.ProcessEnv = process.env,
): SemanticEnvConfig {
	return {
		enabled: parseBoolean(
			"ZWAVE_DEV_SEMANTIC_ENABLED",
			env.ZWAVE_DEV_SEMANTIC_ENABLED,
			true,
		),
		downloadPolicy: parseEnum(
			"ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD",
			env.ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD,
			["ask", "allow", "deny"] as const,
			"ask",
		),
		modelCacheDir: env.ZWAVE_DEV_SEMANTIC_MODEL_CACHE_DIR?.trim()
			|| defaultModelCacheDir(env),
		indexCacheDir: env.ZWAVE_DEV_SEMANTIC_INDEX_CACHE_DIR?.trim()
			|| defaultIndexCacheDir(env),
		consentFile: env.ZWAVE_DEV_SEMANTIC_CONSENT_FILE?.trim()
			|| defaultConsentFile(env),
	};
}
