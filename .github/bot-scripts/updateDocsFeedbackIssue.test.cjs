// @ts-check

import { describe, expect, it } from "vitest";
import {
	MAX_BODY_LENGTH,
	codeFence,
	joinWithinBudget,
	renderDigest,
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
			200,
		);
		expect(result).toContain("A".repeat(100));
		expect(result).not.toContain("B".repeat(200));
		expect(result).not.toContain("CCCCC");
		expect(result).toContain("and 2 more");
		expect(result.length).toBeLessThanOrEqual(200);
	});

	it("caps a digest containing oversized good and bad entries", () => {
		const record = (score, marker) => ({
			title: `${marker}-${"x".repeat(MAX_BODY_LENGTH)}`,
			postUrl: "https://github.com/zwave-js/zwave-js/issues/1",
			commentUrl:
				"https://github.com/zwave-js/zwave-js/issues/1#issuecomment-1",
			style: "answer",
			confidence: 90,
			sections: ["guide.md#install"],
			question: `${marker} question`,
			votes: [{
				user: "user",
				content: score > 0 ? "+1" : "-1",
				weight: score,
			}],
			score,
		});
		const digest = renderDigest([
			record(-5, "BAD"),
			record(-4, "BAD-SECOND"),
			record(5, "GOOD"),
			record(4, "GOOD-SECOND"),
		]);

		expect(digest.length).toBeLessThanOrEqual(MAX_BODY_LENGTH);
		expect(digest).toContain("## Needs attention");
		expect(digest).toContain("## Confirmed good");
		expect(digest).toContain("omitted to keep this issue");
	});

	it("never exceeds the cap at the entry boundary", () => {
		const records = Array.from({ length: 100 }, (_, index) => ({
			title: `Entry ${index} ${"x".repeat(2000)}`,
			postUrl: `https://example.com/${index}`,
			commentUrl: `https://example.com/${index}#answer`,
			style: "answer",
			confidence: 80,
			sections: ["guide.md#install"],
			question: `Question ${index}`,
			votes: [{ user: `user-${index}`, content: "+1", weight: 1 }],
			score: index % 2 === 0 ? 1 : -1,
		}));
		const digest = renderDigest(records);

		expect(digest.length).toBeLessThanOrEqual(MAX_BODY_LENGTH);
		expect(digest).toContain("omitted to keep this issue");
	});
});
