import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getErrorMessage } from "@zwave-js/shared";
import {
	ConsentRequiredError,
	LocalModelUnavailableError,
} from "../semantic/consent.js";
import {
	LOCAL_MODEL_APPROX_SIZE_MB,
	LOCAL_MODEL_ID,
	LOCAL_MODEL_LICENSE,
	LOCAL_MODEL_REVISION,
	LOCAL_MODEL_SOURCE,
} from "../semantic/env.js";
import { SemanticSearchError } from "../semantic/service.js";
import { jsonErrorResult } from "./results.js";

/**
 * Uniformly translates errors from `SemanticSearchService` into MCP tool
 * results. `ConsentRequiredError` is surfaced as a structured
 * `model_download_consent_required` payload (not a generic failure) so
 * agents can present the consent decision to the user instead of just
 * reporting a broken tool call. No download is attempted in that case.
 */
export function handleSemanticError(error: unknown): CallToolResult {
	if (error instanceof ConsentRequiredError) {
		return jsonErrorResult({
			status: "model_download_consent_required",
			model: LOCAL_MODEL_ID,
			revision: LOCAL_MODEL_REVISION,
			license: LOCAL_MODEL_LICENSE,
			source: LOCAL_MODEL_SOURCE,
			approxSizeMb: LOCAL_MODEL_APPROX_SIZE_MB,
			modelCacheDir: error.modelCacheDir,
			consentFile: error.consentFile,
			message: error.message,
			instructions:
				"The connected MCP client does not support elicitation, so this "
				+ "download cannot be confirmed interactively. Set "
				+ "ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD=allow to consent "
				+ "non-interactively, or =deny / ZWAVE_DEV_SEMANTIC_ENABLED=false to "
				+ "disable local semantic search. To reset a previously saved "
				+ "decision for a different model/revision, delete the consent file.",
		});
	}
	if (error instanceof LocalModelUnavailableError) {
		return jsonErrorResult({
			status: "error",
			code: "local_model_unavailable",
			model: LOCAL_MODEL_ID,
			revision: LOCAL_MODEL_REVISION,
			modelCacheDir: error.modelCacheDir,
			downloadPolicy: error.downloadPolicy,
			message: error.message,
			instructions:
				"Set ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD=allow to permit a "
				+ "headless download, remove the saved decline from the consent "
				+ "file and retry with an elicitation-capable client, or set "
				+ "ZWAVE_DEV_SEMANTIC_ENABLED=false.",
		});
	}
	if (error instanceof SemanticSearchError) {
		return jsonErrorResult({
			status: "error",
			code: error.code,
			message: error.message,
		});
	}
	return jsonErrorResult({
		status: "error",
		code: "unexpected_error",
		message: getErrorMessage(error),
	});
}
