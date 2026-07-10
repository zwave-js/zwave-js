import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEVICES_DIR } from "../configEnv.js";
import { SemanticSearchService } from "./service.js";

describe("SemanticSearchService", () => {
	it("requires a bit mask when a parameter has multiple partial definitions", async () => {
		const service = new SemanticSearchService();
		const filename = join(DEVICES_DIR, "0x0090", "ged2150.json");

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
