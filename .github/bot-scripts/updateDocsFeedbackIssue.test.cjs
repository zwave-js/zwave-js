// @ts-check

import { describe, expect, it } from "vitest";
import {
	codeFence,
	joinWithinBudget,
	renderEvalCase,
} from "./updateDocsFeedbackIssue.cjs";

describe("updateDocsFeedbackIssue", () => {
	it("uses a fence longer than any backtick run in the content", () => {
		expect(codeFence("plain")).toBe("```");
		expect(codeFence("``` then ``````")).toBe("```````");
		const rendered = renderEvalCase({
			question: "Question with ``` inside",
			sections: ["guide.md#install"],
		});
		const fence = rendered.match(/^(`+)json$/m)?.[1];
		expect(fence).toBeDefined();
		expect(rendered.split(/** @type {string} */ (fence)).length - 1).toBe(
			2,
		);
	});

	it("keeps a priority prefix within the digest budget", () => {
		const result = joinWithinBudget(
			["A".repeat(100), "B".repeat(200), "C".repeat(5)],
			120,
		);
		expect(result).toContain("A".repeat(100));
		expect(result).not.toContain("B".repeat(200));
		expect(result).not.toContain("CCCCC");
		expect(result).toContain("and 2 more");
	});
});
