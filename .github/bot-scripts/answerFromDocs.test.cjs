// @ts-check

import { describe, expect, it } from "vitest";
import {
	DOCS_ANSWER_COMMENT_TAG,
	alreadyAnswered,
	checkSuppression,
	validateJudgeResponse,
} from "./answerFromDocs.cjs";

/**
 * @param {any[]} comments
 * @param {any[]} events
 */
function mockGithub(comments, events) {
	return /** @type {any} */ ({
		paginate: (/** @type {any} */ route, /** @type {any} */ params) =>
			route(params),
		rest: {
			issues: {
				listComments: () => comments,
				listEventsForTimeline: () => events,
			},
		},
	});
}

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

	it("ignores answers inherited from a transferred issue", async () => {
		const events = [{
			event: "transferred",
			created_at: "2026-01-02T00:00:00Z",
		}];
		const inherited = {
			created_at: "2026-01-01T00:00:00Z",
			body: DOCS_ANSWER_COMMENT_TAG,
		};
		const own = {
			created_at: "2026-01-03T00:00:00Z",
			body: DOCS_ANSWER_COMMENT_TAG,
		};
		/** @param {any[]} comments */
		const param = (comments) => ({
			github: mockGithub(comments, events),
			context: /** @type {any} */ ({
				repo: { owner: "zwave-js", repo: "zwave-js" },
			}),
		});

		expect(await alreadyAnswered(param([inherited]), { number: 1 }, false))
			.toBe(false);
		expect(
			await alreadyAnswered(
				param([inherited, own]),
				{ number: 1 },
				false,
			),
		).toBe(true);
	});
});
