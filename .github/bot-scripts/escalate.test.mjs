// @ts-check

import { describe, expect, it, vi } from "vitest";

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

describe("escalate", () => {
	/**
	 * @param {boolean} isAnswerable
	 */
	function createMocks(isAnswerable) {
		/** @type {string[]} */
		const mutations = [];
		const github = {
			graphql: vi.fn(async (/** @type {string} */ query) => {
				const mutation = query.match(/mutation (\w+)/)?.[1];
				if (mutation) {
					mutations.push(mutation);
					if (
						mutation === "markDiscussionCommentAsAnswer"
						&& !isAnswerable
					) {
						throw new Error(
							"does not belong to a discussion in a category that supports answers",
						);
					}
					return {
						addDiscussionComment: { comment: { id: "C_1" } },
					};
				}
				return {
					repository: {
						discussion: {
							closed: false,
							category: { isAnswerable },
							comments: { nodes: [] },
						},
					},
				};
			}),
			rest: {
				issues: {
					create: vi.fn(async () => ({
						data: { number: 2, html_url: "https://example.com/2" },
					})),
					createComment: vi.fn(),
				},
			},
		};
		const context = {
			repo: { owner: "zwave-js", repo: "zwave-js" },
			payload: {
				discussion: {
					number: 1,
					node_id: "D_1",
					title: "Title",
					body: "Body",
					user: { login: "someone" },
					category: { slug: "ideas" },
				},
			},
		};
		const core = { info: vi.fn(), error: vi.fn(), setFailed: vi.fn() };
		return { github, context, core, mutations };
	}

	it("closes the discussion without marking an answer in a category without answers", async () => {
		const { github, context, core, mutations } = createMocks(false);
		await escalate(/** @type {any} */ ({ github, context, core }));

		expect(github.rest.issues.create).toHaveBeenCalledOnce();
		expect(mutations).toEqual(["addDiscussionComment", "closeDiscussion"]);
		expect(core.setFailed).not.toHaveBeenCalled();
	});

	it("marks the escalation comment as the answer in an answerable category", async () => {
		const { github, context, core, mutations } = createMocks(true);
		await escalate(/** @type {any} */ ({ github, context, core }));

		expect(mutations).toEqual([
			"addDiscussionComment",
			"markDiscussionCommentAsAnswer",
			"closeDiscussion",
		]);
		expect(core.setFailed).not.toHaveBeenCalled();
	});
});
