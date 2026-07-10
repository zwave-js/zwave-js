import { describe, expect, it } from "vitest";
import { SemanticEnvError, parseSemanticEnv } from "./env.js";

describe("parseSemanticEnv", () => {
	it("defaults to enabled with an interactive download policy", () => {
		const config = parseSemanticEnv({});
		expect(config.enabled).toBe(true);
		expect(config.downloadPolicy).toBe("ask");
	});

	it("supports disabling semantic tools", () => {
		const config = parseSemanticEnv({
			ZWAVE_DEV_SEMANTIC_ENABLED: "false",
		});
		expect(config.enabled).toBe(false);
	});

	it("throws a SemanticEnvError for an invalid enabled value", () => {
		expect(() => parseSemanticEnv({ ZWAVE_DEV_SEMANTIC_ENABLED: "maybe" }))
			.toThrow(SemanticEnvError);
	});

	it("throws a SemanticEnvError for an invalid local download policy", () => {
		expect(() =>
			parseSemanticEnv({
				ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD: "maybe",
			})
		).toThrow(SemanticEnvError);
	});

	it("supports overriding the cache dir and consent file paths", () => {
		const config = parseSemanticEnv({
			ZWAVE_DEV_SEMANTIC_MODEL_CACHE_DIR: "/custom/model-cache",
			ZWAVE_DEV_SEMANTIC_INDEX_CACHE_DIR: "/custom/index-cache",
			ZWAVE_DEV_SEMANTIC_CONSENT_FILE: "/custom/consent.json",
		});
		expect(config.modelCacheDir).toBe("/custom/model-cache");
		expect(config.indexCacheDir).toBe("/custom/index-cache");
		expect(config.consentFile).toBe("/custom/consent.json");
	});
});
