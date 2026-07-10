import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DEVICES_DIR } from "../configEnv.js";
import { SemanticSearchService } from "./service.js";
import type { ParameterCorpusRecord } from "./types.js";

function partialParam(valueBitMask: number): ParameterCorpusRecord {
	return {
		kind: "parameter",
		id: `test.json#31[${valueBitMask}]:0`,
		file: join(DEVICES_DIR, "test.json"),
		relativeFile: "test.json",
		line: 1,
		parameterNumber: 31,
		valueBitMask,
		device: {},
		semantics: {
			label: `Partial ${valueBitMask}`,
			optionLabels: [],
		},
		structure: { options: [] },
		semanticHash: `hash-${valueBitMask}`,
		semanticText: `Partial ${valueBitMask}`,
	};
}

// Building the real corpus scans the entire device config database, which is
// far too slow for a unit test. Serve a tiny synthetic corpus instead.
vi.mock("./corpus.js", async (importOriginal) => ({
	...(await importOriginal<typeof import("./corpus.js")>()),
	buildCorpus: vi.fn(async () => ({
		parameters: [partialParam(0x01), partialParam(0xf0)],
		templates: [],
		warnings: [],
	})),
}));

vi.mock("../tools/resolveParam.js", () => ({
	resolveParamsForFirmware: vi.fn(async () => [
		{ valueBitMask: 0x01, label: "Partial 1", options: [] },
		{ valueBitMask: 0xf0, label: "Partial 240", options: [] },
	]),
}));

describe("SemanticSearchService", () => {
	it("requires a bit mask when a parameter has multiple partial definitions", async () => {
		const service = new SemanticSearchService();
		const filename = join(DEVICES_DIR, "test.json");

		await expect(
			service.findSimilar(filename, 31, undefined, undefined, 1),
		).rejects.toMatchObject({
			code: "ambiguous_parameter",
			message: expect.stringContaining("valueBitMask"),
		});
		await expect(
			service.findSimilar(filename, 31, undefined, "1.0", 1),
		).rejects.toMatchObject({
			code: "ambiguous_parameter",
			message: expect.stringContaining("valueBitMask"),
		});
	});
});
