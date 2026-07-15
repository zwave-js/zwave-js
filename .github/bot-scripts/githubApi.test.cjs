// @ts-check

import { describe, expect, it } from "vitest";
import { getGraphqlRetryDelayMs, getRetryDelayMs } from "./githubApi.cjs";

function response(status, headers = {}, body = "") {
	const normalized = new Map(
		Object.entries(headers).map(([key, value]) => [
			key.toLowerCase(),
			value,
		]),
	);
	return {
		status,
		headers: {
			get: (name) => normalized.get(name.toLowerCase()) ?? null,
		},
		clone() {
			return this;
		},
		async text() {
			return body;
		},
	};
}

describe("githubApi", () => {
	it("retries bounded transient and rate-limit responses", async () => {
		expect(await getRetryDelayMs(response(502), 0)).toBe(1000);
		expect(
			await getRetryDelayMs(response(429, { "retry-after": "3" }), 0),
		).toBe(3000);
		expect(await getRetryDelayMs(response(502), 5)).toBeUndefined();
	});

	it("retries primary rate limits returned as HTTP 403", async () => {
		const reset = Math.floor(Date.now() / 1000) + 5;
		expect(
			await getRetryDelayMs(
				response(403, {
					"x-ratelimit-remaining": "0",
					"x-ratelimit-reset": String(reset),
				}),
				0,
			),
		).toBeGreaterThan(0);
	});

	it("does not retry ambiguous server errors for REST POST requests", async () => {
		expect(await getRetryDelayMs(response(502), 0, "POST")).toBeUndefined();
	});

	it("recognizes secondary rate limits without retrying ordinary 403s", async () => {
		expect(
			await getRetryDelayMs(
				response(403, {}, "You exceeded a secondary rate limit"),
				0,
			),
		).toBeGreaterThan(0);
		expect(
			await getRetryDelayMs(response(403, {}, "Forbidden"), 0),
		).toBeUndefined();
	});

	it("retries HTTP-200 GraphQL rate-limit errors", () => {
		expect(getGraphqlRetryDelayMs(
			response(200, { "retry-after": "2" }),
			[{ type: "RATE_LIMITED", message: "Rate limit exceeded" }],
			0,
		)).toBe(2000);
		expect(getGraphqlRetryDelayMs(
			response(200),
			[{ type: "NOT_FOUND", message: "Missing" }],
			0,
		)).toBeUndefined();
	});
});
