// @ts-check

import { describe, expect, it } from "vitest";
import { reportResults } from "./evalUtils.cjs";

describe("evalUtils", () => {
	it("rejects an evaluation with zero cases", async () => {
		await expect(reportResults(5, 0, [], 0.8)).rejects.toThrow(
			/no eval cases/i,
		);
	});
});
