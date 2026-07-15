// @ts-check

import { describe, expect, it } from "vitest";
import { checkSuppression, validateJudgeResponse } from "./answerFromDocs.cjs";

describe("answerFromDocs", () => {
	it("accepts a valid judge response", () => {
		expect(validateJudgeResponse({
			confidence: 85,
			answer: "Use the documented API.",
			relatedExcerpts: [0, 2],
		})).toEqual({
			confidence: 85,
			answer: "Use the documented API.",
			relatedExcerpts: [0, 2],
		});
	});

	it("rejects invalid confidence and response shapes", () => {
		for (
			const response of [
				null,
				[],
				{ confidence: -1 },
				{ confidence: 101 },
				{ confidence: Number.NaN },
				{ confidence: "80" },
			]
		) {
			expect(validateJudgeResponse(response)).toEqual({
				confidence: 0,
				answer: null,
				relatedExcerpts: [],
			});
		}
	});

	it("filters invalid excerpt indexes and answer types", () => {
		expect(validateJudgeResponse({
			confidence: 50,
			answer: 42,
			relatedExcerpts: [0, -1, 1.5, "2", 3],
		})).toEqual({
			confidence: 50,
			answer: null,
			relatedExcerpts: [0, 3],
		});
	});

	it("demotes and suppresses similar downvoted answers", () => {
		const embedding = [1, 0, 0];
		expect(checkSuppression(embedding, {
			model: "model",
			suppressed: [{
				embedding,
				style: "answer",
				url: "https://example.com/1",
			}],
		}, "model")).toBe("linksOnly");
		expect(checkSuppression(embedding, {
			model: "model",
			suppressed: [{
				embedding,
				style: "links",
				url: "https://example.com/2",
			}],
		}, "model")).toBe("silent");
	});
});
