import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Default cache root, following the XDG base directory convention on
 * platforms that set `XDG_CACHE_HOME`, falling back to `~/.cache` otherwise.
 * Individual cache directories (model artifacts, the semantic index, and the
 * download consent file) are overridable independently via env vars, see
 * `env.ts`.
 */
export function defaultCacheRoot(env: NodeJS.ProcessEnv = process.env): string {
	const xdg = env.XDG_CACHE_HOME;
	const base = xdg && xdg.trim().length > 0 ? xdg : join(homedir(), ".cache");
	return join(base, "zwave-js-mcp-server-dev");
}

export function defaultModelCacheDir(
	env: NodeJS.ProcessEnv = process.env,
): string {
	return join(defaultCacheRoot(env), "models");
}

export function defaultIndexCacheDir(
	env: NodeJS.ProcessEnv = process.env,
): string {
	return join(defaultCacheRoot(env), "semantic-index");
}

export function defaultConsentFile(
	env: NodeJS.ProcessEnv = process.env,
): string {
	// Kept outside of the model cache dir so wiping downloaded model
	// artifacts (e.g. to free disk space) does not also discard the user's
	// consent decision, and vice versa.
	return join(defaultCacheRoot(env), "model-download-consent.json");
}
