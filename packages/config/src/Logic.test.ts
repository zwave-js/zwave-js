import { test } from "vitest";
import { collectParamValueReferences, evaluate, parseLogic } from "./Logic.js";

/**
 * Builds an evaluation context with parameter values keyed by
 * `endpoint:parameter` or `endpoint:parameter[bitMask]`, exactly as they
 * would be stored in the value DB. Pass `endpointScope` to evaluate like
 * inside that endpoint's config section.
 */
function withParamValues(
	context: Record<string, unknown>,
	paramValues: Record<string, number>,
	endpointScope?: number,
): Record<string, unknown> {
	const lookup = (
		endpoint: number,
		parameter: number,
		bitMask?: number,
	): number | undefined =>
		paramValues[
			`${endpoint}:${parameter}${
				bitMask != undefined
					? `[0x${bitMask.toString(16).padStart(2, "0")}]`
					: ""
			}`
		];
	return {
		...context,
		getCachedParamValue: lookup,
		...(endpointScope != undefined
			? {
				getScopedParamValue: (
					parameter: number,
					bitMask?: number,
				) => lookup(endpointScope, parameter, bitMask),
			}
			: {}),
	};
}

const tests = [
	{
		logic: "firmwareVersion > 1.0",
		context: { firmwareVersion: "1.5" },
		expected: true,
	},
	{
		logic: "firmwareVersion > 1.5",
		context: { firmwareVersion: "1.5" },
		expected: false,
	},
	{
		logic: "a === 0 && b === 0 || a === 1 && b === 1",
		context: { a: 1, b: 1 },
		expected: true,
	},
	{
		logic: "a === 0 && (b === 0 || a === 1) && b === 1",
		context: { a: 1, b: 1 },
		expected: false,
	},
	// Regression tests
	{
		// Missing variable in the context does not throw (1)
		logic: "a > 0 || b === 1",
		context: {},
		expected: false,
	},
	{
		// Missing variable in the context does not throw (2)
		logic: "firmwareVersion > 1.5",
		context: {},
		expected: false,
	},
	{
		logic: "sdkVersion >= 7.0",
		context: { sdkVersion: "7.19.0" },
		expected: true,
	},
	{
		logic: "sdkVersion < 7.19.0",
		context: { sdkVersion: "7.18.0" },
		expected: true,
	},
	{
		logic: "sdkVersion >= 7.19.1",
		context: { sdkVersion: "7.19.0" },
		expected: false,
	},
	{
		logic: "sdkVersion === 7.19.0",
		context: { sdkVersion: "7.19.0" },
		expected: true,
	},
	{
		logic: "sdkVersion >= 7.0 && firmwareVersion >= 1.0",
		context: { sdkVersion: "7.19.0", firmwareVersion: "1.5" },
		expected: true,
	},
	{
		logic: "firmwareVersion !== 20.16",
		context: { firmwareVersion: "20.15" },
		expected: true,
	},
	{
		logic: "firmwareVersion !== 20.16",
		context: { firmwareVersion: "20.16" },
		expected: false,
	},
	// Param value references
	{
		logic: "#71 == 1",
		context: withParamValues({}, { "0:71": 1 }),
		expected: true,
	},
	{
		logic: "#71 == 1",
		context: withParamValues({}, { "0:71": 2 }),
		expected: false,
	},
	{
		logic: "#71 != 1",
		context: withParamValues({}, { "0:71": 2 }),
		expected: true,
	},
	{
		logic: "#71 != 1",
		context: withParamValues({}, { "0:71": 1 }),
		expected: false,
	},
	// Comparisons with unknown parameter values evaluate to true for every operator
	{
		logic: "#71 == 1",
		context: {},
		expected: true,
	},
	{
		logic: "#71 != 1",
		context: withParamValues({}, {}),
		expected: true,
	},
	// ... and behave as if the comparison didn't exist in combined conditions
	{
		logic: "#40 >= 2 && firmwareVersion >= 1.7",
		context: withParamValues({ firmwareVersion: "1.7" }, {}),
		expected: true,
	},
	{
		logic: "#40 >= 2 && firmwareVersion >= 1.7",
		context: withParamValues({ firmwareVersion: "1.6" }, {}),
		expected: false,
	},
	{
		logic: "#40 >= 2 && firmwareVersion >= 1.7",
		context: withParamValues({ firmwareVersion: "1.7" }, { "0:40": 1 }),
		expected: false,
	},
	// An unknown comparison makes an entire || condition true
	{
		logic: "#1 == 0 || #2 == 1",
		context: withParamValues({}, { "0:2": 5 }),
		expected: true,
	},
	{
		logic: "(#1 == 0 || #2 == 1) && firmwareVersion >= 1.7",
		context: withParamValues({ firmwareVersion: "1.6" }, { "0:2": 5 }),
		expected: false,
	},
	// Partial parameters
	{
		logic: "#71[0x0f] == 1",
		context: withParamValues({}, { "0:71[0x0f]": 1 }),
		expected: true,
	},
	{
		logic: "#71[0xf0] == 2",
		context: withParamValues({}, { "0:71[0xf0]": 2 }),
		expected: true,
	},
	// Negative values
	{
		logic: "#9 == -1",
		context: withParamValues({}, { "0:9": -1 }),
		expected: true,
	},
	{
		logic: "#9 < 0",
		context: withParamValues({}, { "0:9": -1 }),
		expected: true,
	},
	// Multi-bit partials are signed by default and stored with their sign
	{
		logic: "#9[0x0f] == -1",
		context: withParamValues({}, { "0:9[0x0f]": -1 }),
		expected: true,
	},
	{
		logic: "#9[0x0f] > -1",
		context: withParamValues({}, { "0:9[0x0f]": -1 }),
		expected: false,
	},
	{
		logic: "#9[0x0f] > -1",
		context: withParamValues({}, { "0:9[0x0f]": 0 }),
		expected: true,
	},
	// References resolve against the endpoint scope in the context
	{
		logic: "#71 == 2",
		context: withParamValues({}, {
			"0:71": 1,
			"2:71": 2,
		}, 2),
		expected: true,
	},
	{
		logic: "#71 == 1",
		context: withParamValues({}, {
			"0:71": 1,
			"2:71": 2,
		}, 2),
		expected: false,
	},
	{
		logic: "#71 == 1",
		context: withParamValues({}, {
			"0:71": 1,
			"2:71": 2,
		}),
		expected: true,
	},
] as const;

for (let i = 1; i <= tests.length; i++) {
	const { logic, context, expected } = tests[i - 1];
	test(
		`Logic parser, test ${i}: ${
			JSON.stringify(
				context,
			)
		} --> ${logic} is ${expected}`,
		(t) => {
			t.expect(evaluate(logic, context)).toBe(expected);
		},
	);
}

test("collectParamValueReferences finds references in all branches", (t) => {
	const refs = collectParamValueReferences(
		parseLogic("#1 == 0 || (#2[0x03] == 1 && firmwareVersion >= 1.0)"),
	);
	t.expect(refs).toMatchObject([
		{ parameter: 1, valueBitMask: undefined },
		{ parameter: 2, valueBitMask: 0x03 },
	]);
});
