import { parsePartial } from "@zwave-js/core";
import { test } from "vitest";
import { evaluate } from "./Logic.js";

/** Builds an evaluation context with parameter values keyed by `endpoint:parameter` */
function withParamValues(
	context: Record<string, unknown>,
	paramValues: Record<string, number>,
): Record<string, unknown> {
	return {
		...context,
		getCachedParamValue: (
			endpoint: number,
			parameter: number,
			bitMask?: number,
		) => {
			const fullValue = paramValues[`${endpoint}:${parameter}`];
			if (fullValue == undefined) return undefined;
			if (bitMask == undefined) return fullValue;
			return parsePartial(fullValue, bitMask, false);
		},
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
	// Partial parameters
	{
		logic: "#71[0x0f] == 1",
		context: withParamValues({}, { "0:71": 0x21 }),
		expected: true,
	},
	{
		logic: "#71[0xf0] == 2",
		context: withParamValues({}, { "0:71": 0x21 }),
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
	{
		logic: "#9[0x0f] == 15",
		context: withParamValues({}, { "0:9": -1 }),
		expected: true,
	},
	// References resolve against the endpoint scope in the context
	{
		logic: "#71 == 2",
		context: withParamValues({ endpoint: 2 }, {
			"0:71": 1,
			"2:71": 2,
		}),
		expected: true,
	},
	{
		logic: "#71 == 1",
		context: withParamValues({ endpoint: 2 }, {
			"0:71": 1,
			"2:71": 2,
		}),
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
