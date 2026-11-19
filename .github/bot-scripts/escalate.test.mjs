// @ts-check

import { describe, expect, it } from "vitest";

import escalate from "./escalate.cjs";

describe("labelsForCategory", () => {
	it("labels a support discussion as a bug", () => {
		expect(
			escalate.labelsForCategory("request-support-investigate-issue"),
		).toEqual(["bug"]);
	});

	it("labels feature requests and ideas as enhancements", () => {
		expect(escalate.labelsForCategory("feature-requests")).toEqual([
			"enhancement",
		]);
		expect(escalate.labelsForCategory("ideas")).toEqual(["enhancement"]);
	});

	it("leaves other categories without a label", () => {
		expect(escalate.labelsForCategory("general")).toEqual([]);
		expect(escalate.labelsForCategory(undefined)).toEqual([]);
	});
});
