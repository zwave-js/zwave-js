import { test } from "vitest";
import { evaluate } from "./Logic.js";

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
] as const;

const sdkVersionTests = [
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

for (let i = 1; i <= sdkVersionTests.length; i++) {
	const { logic, context, expected } = sdkVersionTests[i - 1];
	test(
		`Logic parser with sdkVersion, test ${i}: ${
			JSON.stringify(
				context,
			)
		} --> ${logic} is ${expected}`,
		(t) => {
			t.expect(evaluate(logic, context)).toBe(expected);
		},
	);
}
