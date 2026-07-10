import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
	ConsentRequiredError,
	LocalModelUnavailableError,
	decideConsentAction,
	emptyConsentStore,
	findConsentRecord,
	loadConsentStore,
	persistConsentDecision,
	persistConsentRecord,
	saveConsentStore,
	withConsentRecord,
} from "./consent.js";

// Deliberately package-local (not the OS temp dir): scratch files created by
// this test suite must stay inside the repository working tree.
const scratchRoot = join(dirname(fileURLToPath(import.meta.url)), ".test-tmp");

describe("decideConsentAction", () => {
	it("allows loading from cache only (no download) when policy is deny, regardless of stored consent", () => {
		expect(decideConsentAction("deny", undefined)).toEqual({
			type: "proceed",
			localFilesOnly: true,
		});
		expect(
			decideConsentAction("deny", {
				modelId: "m",
				revision: "r",
				approved: true,
				decidedAt: "2024-01-01T00:00:00.000Z",
			}),
		).toEqual({ type: "proceed", localFilesOnly: true });
	});

	it("allows downloading when policy is allow, regardless of stored consent", () => {
		expect(decideConsentAction("allow", undefined)).toEqual({
			type: "proceed",
			localFilesOnly: false,
		});
		expect(
			decideConsentAction("allow", {
				modelId: "m",
				revision: "r",
				approved: false,
				decidedAt: "2024-01-01T00:00:00.000Z",
			}),
		).toEqual({ type: "proceed", localFilesOnly: false });
	});

	it("elicits when policy is ask and no stored decision exists", () => {
		expect(decideConsentAction("ask", undefined)).toEqual({
			type: "elicit",
		});
	});

	it("proceeds without downloading when policy is ask and a prior decision declined", () => {
		expect(
			decideConsentAction("ask", {
				modelId: "m",
				revision: "r",
				approved: false,
				decidedAt: "2024-01-01T00:00:00.000Z",
			}),
		).toEqual({ type: "proceed", localFilesOnly: true });
	});

	it("proceeds allowing downloads when policy is ask and a prior decision approved", () => {
		expect(
			decideConsentAction("ask", {
				modelId: "m",
				revision: "r",
				approved: true,
				decidedAt: "2024-01-01T00:00:00.000Z",
			}),
		).toEqual({ type: "proceed", localFilesOnly: false });
	});
});

describe("findConsentRecord / withConsentRecord", () => {
	it("keys records by the exact model id + revision pair", () => {
		let store = emptyConsentStore();
		store = withConsentRecord(store, {
			modelId: "Xenova/all-MiniLM-L6-v2",
			revision: "rev-a",
			approved: true,
			decidedAt: "2024-01-01T00:00:00.000Z",
		});

		expect(
			findConsentRecord(store, "Xenova/all-MiniLM-L6-v2", "rev-a"),
		).toBeDefined();
		// A different revision of the same model id must require its own consent.
		expect(
			findConsentRecord(store, "Xenova/all-MiniLM-L6-v2", "rev-b"),
		).toBeUndefined();
	});

	it("replaces (not duplicates) the record for the same model+revision, and does not mutate the input store", () => {
		const original = withConsentRecord(emptyConsentStore(), {
			modelId: "m",
			revision: "r",
			approved: false,
			decidedAt: "2024-01-01T00:00:00.000Z",
		});
		const updated = withConsentRecord(original, {
			modelId: "m",
			revision: "r",
			approved: true,
			decidedAt: "2024-01-02T00:00:00.000Z",
		});

		expect(original.records[0].approved).toBe(false);
		expect(updated.records).toHaveLength(1);
		expect(updated.records[0].approved).toBe(true);
	});
});

describe("consent store file round-trip", () => {
	afterEach(async () => {
		await rm(scratchRoot, { recursive: true, force: true });
	});

	it("returns an empty store when the file does not exist yet", async () => {
		await mkdir(scratchRoot, { recursive: true });
		const dir = await mkdtemp(join(scratchRoot, "missing-"));
		const store = await loadConsentStore(join(dir, "consent.json"));
		expect(store).toEqual(emptyConsentStore());
	});

	it("round-trips a saved store", async () => {
		await mkdir(scratchRoot, { recursive: true });
		const dir = await mkdtemp(join(scratchRoot, "roundtrip-"));
		const file = join(dir, "nested", "consent.json");
		const store = withConsentRecord(emptyConsentStore(), {
			modelId: "Xenova/all-MiniLM-L6-v2",
			revision: "751bff37182d3f1213fa05d7196b954e230abad9",
			approved: true,
			decidedAt: "2024-01-01T00:00:00.000Z",
		});

		await saveConsentStore(file, store);
		const loaded = await loadConsentStore(file);
		expect(loaded).toEqual(store);
	});

	it("reports a corrupt consent file instead of forgetting the decision", async () => {
		await mkdir(scratchRoot, { recursive: true });
		const file = join(scratchRoot, "corrupt.json");
		await writeFile(file, "{not json", "utf8");
		await expect(loadConsentStore(file)).rejects.toThrow("invalid JSON");
	});

	it("preserves decisions for other model revisions", async () => {
		await mkdir(scratchRoot, { recursive: true });
		const file = join(scratchRoot, "multiple.json");
		await persistConsentRecord(file, {
			modelId: "model-a",
			revision: "revision",
			approved: true,
			decidedAt: "2024-01-01T00:00:00.000Z",
		});
		await persistConsentRecord(file, {
			modelId: "model-b",
			revision: "revision",
			approved: false,
			decidedAt: "2024-01-01T00:00:00.000Z",
		});
		const stored = await loadConsentStore(file);
		expect(stored.records).toHaveLength(2);
	});

	it("does not persist a canceled elicitation", async () => {
		await mkdir(scratchRoot, { recursive: true });
		const file = join(scratchRoot, "canceled.json");
		await persistConsentDecision(file, "model", "revision", "cancel");
		expect(await loadConsentStore(file)).toEqual(emptyConsentStore());
	});
});

describe("ConsentRequiredError", () => {
	it("carries structured fields for the tool's model_download_consent_required response", () => {
		const error = new ConsentRequiredError(
			"/cache/models",
			"/cache/consent.json",
		);
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("ConsentRequiredError");
		expect(error.modelCacheDir).toBe("/cache/models");
		expect(error.consentFile).toBe("/cache/consent.json");
	});

	describe("LocalModelUnavailableError", () => {
		it("carries the cache and policy needed for an actionable tool error", () => {
			const error = new LocalModelUnavailableError(
				"/cache/models",
				"deny",
			);
			expect(error.name).toBe("LocalModelUnavailableError");
			expect(error.modelCacheDir).toBe("/cache/models");
			expect(error.downloadPolicy).toBe("deny");
		});
	});
});
