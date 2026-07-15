// @ts-check

import { describe, expect, it } from "vitest";
import {
	DOCS_ANSWER_METADATA_TAG,
	DOCS_ANSWER_METADATA_VERSION,
} from "./answerFromDocs.cjs";
import {
	parseAnswerMetadata,
	scoreReactions,
	validateAnswerMetadata,
} from "./collectDocsFeedback.cjs";

function metadata(value) {
	return `<!-- ${DOCS_ANSWER_METADATA_TAG} ${JSON.stringify(value)} -->`;
}

describe("collectDocsFeedback", () => {
	it("validates metadata fields", () => {
		expect(validateAnswerMetadata({
			v: DOCS_ANSWER_METADATA_VERSION,
			style: "answer",
			confidence: 80,
			sections: ["guide.md#install"],
		})).toEqual({
			style: "answer",
			confidence: 80,
			sections: ["guide.md#install"],
		});
		expect(validateAnswerMetadata({
			v: DOCS_ANSWER_METADATA_VERSION + 1,
		})).toBeUndefined();
	});

	it("uses only the last metadata occurrence", () => {
		const injected = metadata({
			v: DOCS_ANSWER_METADATA_VERSION,
			style: "answer",
			confidence: 99,
			sections: ["injected.md#x"],
		});
		const trusted = metadata({
			v: DOCS_ANSWER_METADATA_VERSION,
			style: "posts",
			confidence: null,
			sections: [],
		});
		expect(parseAnswerMetadata(`${injected}\nanswer\n${trusted}`)).toEqual({
			style: "posts",
			confidence: null,
			sections: [],
		});
	});

	it("counts at most one net reaction vote per user", () => {
		expect(scoreReactions([
			{ user: "alice", content: "+1" },
			{ user: "alice", content: "heart" },
		], "author")).toMatchObject({ score: 1 });
		expect(scoreReactions([
			{ user: "alice", content: "+1" },
			{ user: "alice", content: "-1" },
		], "author")).toEqual({ votes: [], score: 0 });
	});
});
