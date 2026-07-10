import { expect, test } from "vitest";
import {
	type Expression,
	Operator,
	SyntaxKind,
	type Token,
	TokenKind,
	parse,
	tokenize,
} from "./LogicParser.js";

test("tokenize, happy path 1", () => {
	const input = "a && b || ((c == d === e != f)) !== g < h <= i > j >= k";
	const actual: Omit<Token, "start">[] = Array.from(tokenize(input)).map(
		(token) => {
			const { start, ...rest } = token;
			return rest;
		},
	);
	const expected: Omit<Token, "start">[] = [
		{ kind: TokenKind.Identifier, value: "a" },
		{ kind: TokenKind.AmpAmp },
		{ kind: TokenKind.Identifier, value: "b" },
		{ kind: TokenKind.BarBar },
		{ kind: TokenKind.LeftParen },
		{ kind: TokenKind.LeftParen },
		{ kind: TokenKind.Identifier, value: "c" },
		{ kind: TokenKind.EqualsEquals },
		{ kind: TokenKind.Identifier, value: "d" },
		{ kind: TokenKind.EqualsEqualsEquals },
		{ kind: TokenKind.Identifier, value: "e" },
		{ kind: TokenKind.ExclamationEquals },
		{ kind: TokenKind.Identifier, value: "f" },
		{ kind: TokenKind.RightParen },
		{ kind: TokenKind.RightParen },
		{ kind: TokenKind.ExclamationEqualsEquals },
		{ kind: TokenKind.Identifier, value: "g" },
		{ kind: TokenKind.LessThan },
		{ kind: TokenKind.Identifier, value: "h" },
		{ kind: TokenKind.LessThanEquals },
		{ kind: TokenKind.Identifier, value: "i" },
		{ kind: TokenKind.GreaterThan },
		{ kind: TokenKind.Identifier, value: "j" },
		{ kind: TokenKind.GreaterThanEquals },
		{ kind: TokenKind.Identifier, value: "k" },
	];
	expect(actual).toEqual(expected);
});

test("tokenize, happy path 2", () => {
	const input =
		"firmwareVersion>= 1.2.3 && (productType == 0x1234 || productId !== 5)";
	const actual: Omit<Token, "start">[] = Array.from(tokenize(input)).map(
		(token) => {
			const { start, ...rest } = token;
			return rest;
		},
	);
	const expected: Omit<Token, "start">[] = [
		{ kind: TokenKind.Identifier, value: "firmwareVersion" },
		{ kind: TokenKind.GreaterThanEquals },
		{ kind: TokenKind.NumberLiteral, value: "1" },
		{ kind: TokenKind.Dot },
		{ kind: TokenKind.NumberLiteral, value: "2" },
		{ kind: TokenKind.Dot },
		{ kind: TokenKind.NumberLiteral, value: "3" },
		{ kind: TokenKind.AmpAmp },
		{ kind: TokenKind.LeftParen },
		{ kind: TokenKind.Identifier, value: "productType" },
		{ kind: TokenKind.EqualsEquals },
		{ kind: TokenKind.NumberLiteral, value: "0x1234" },
		{ kind: TokenKind.BarBar },
		{ kind: TokenKind.Identifier, value: "productId" },
		{ kind: TokenKind.ExclamationEqualsEquals },
		{ kind: TokenKind.NumberLiteral, value: "5" },
		{ kind: TokenKind.RightParen },
	];
	expect(actual).toEqual(expected);
});

test("tokenize, with illegal characters", () => {
	const input = "a + b - c * d / e % f";
	expect(() => Array.from(tokenize(input))).toThrowError(
		/Unexpected character '\+' at index 2/,
	);
});

test("parse, simple comparison", () => {
	const input = "abc == 5";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Comparison,
		operator: Operator.Equal,
		left: {
			kind: SyntaxKind.Identifier,
			name: "abc",
		},
		right: {
			kind: SyntaxKind.NumberLiteral,
			value: 5,
		},
	};
	expect(actual).toEqual(expected);
});

test("parse, illegal comparison", () => {
	const input = "a == b";
	expect(() => parse(input)).toThrowError(
		/Right-hand side of comparisons must be a version or number literal/,
	);
});

test("parse, version comparison", () => {
	const input = "firmwareVersion >= 1.2.3";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Comparison,
		operator: Operator.GreaterThanOrEqual,
		left: {
			kind: SyntaxKind.Identifier,
			name: "firmwareVersion",
		},
		right: {
			kind: SyntaxKind.Version,
			value: "1.2.3",
		},
	};
	expect(actual).toEqual(expected);
});

test("parse, OR chain", () => {
	const input = "a > 2 || b < 0x1234 || c === 1.0";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Or,
		operands: [
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.GreaterThan,
				left: {
					kind: SyntaxKind.Identifier,
					name: "a",
				},
				right: {
					kind: SyntaxKind.NumberLiteral,
					value: 2,
				},
			},
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.LessThan,
				left: {
					kind: SyntaxKind.Identifier,
					name: "b",
				},
				right: {
					kind: SyntaxKind.NumberLiteral,
					value: 0x1234,
				},
			},
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.Equal,
				left: {
					kind: SyntaxKind.Identifier,
					name: "c",
				},
				right: {
					kind: SyntaxKind.Version,
					value: "1.0",
				},
			},
		],
	};
	expect(actual).toEqual(expected);
});

test("parse, grouped AND/OR with operator precendence", () => {
	const input = "(a <= 5 || b >= 10) && c != 0x1A2B || d === 3.4.5";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Or,
		operands: [
			{
				kind: SyntaxKind.And,
				operands: [
					{
						kind: SyntaxKind.Or,
						operands: [
							{
								kind: SyntaxKind.Comparison,
								operator: Operator.LessThanOrEqual,
								left: {
									kind: SyntaxKind.Identifier,
									name: "a",
								},
								right: {
									kind: SyntaxKind.NumberLiteral,
									value: 5,
								},
							},
							{
								kind: SyntaxKind.Comparison,
								operator: Operator.GreaterThanOrEqual,
								left: {
									kind: SyntaxKind.Identifier,
									name: "b",
								},
								right: {
									kind: SyntaxKind.NumberLiteral,
									value: 10,
								},
							},
						],
					},
					{
						kind: SyntaxKind.Comparison,
						operator: Operator.NotEqual,
						left: {
							kind: SyntaxKind.Identifier,
							name: "c",
						},
						right: {
							kind: SyntaxKind.NumberLiteral,
							value: 0x1a2b,
						},
					},
				],
			},
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.Equal,
				left: {
					kind: SyntaxKind.Identifier,
					name: "d",
				},
				right: {
					kind: SyntaxKind.Version,
					value: "3.4.5",
				},
			},
		],
	};
	expect(actual).toEqual(expected);
});

test("parse, weird, but valid expression", () => {
	const input = "((((a > 1)) || b <= 2))";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Or,
		operands: [
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.GreaterThan,
				left: {
					kind: SyntaxKind.Identifier,
					name: "a",
				},
				right: {
					kind: SyntaxKind.NumberLiteral,
					value: 1,
				},
			},
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.LessThanOrEqual,
				left: {
					kind: SyntaxKind.Identifier,
					name: "b",
				},
				right: {
					kind: SyntaxKind.NumberLiteral,
					value: 2,
				},
			},
		],
	};
	expect(actual).toEqual(expected);
});

test("tokenize, param references", () => {
	const input = "#71 == 1 && #9[0x0f] > -1";
	const actual: Omit<Token, "start">[] = Array.from(tokenize(input)).map(
		(token) => {
			const { start, ...rest } = token;
			return rest;
		},
	);
	const expected: Omit<Token, "start">[] = [
		{ kind: TokenKind.ParamReference, value: "71" },
		{ kind: TokenKind.EqualsEquals },
		{ kind: TokenKind.NumberLiteral, value: "1" },
		{ kind: TokenKind.AmpAmp },
		{ kind: TokenKind.ParamReference, value: "9[0x0f]" },
		{ kind: TokenKind.GreaterThan },
		{ kind: TokenKind.Minus },
		{ kind: TokenKind.NumberLiteral, value: "1" },
	];
	expect(actual).toEqual(expected);
});

test("tokenize, # without a parameter number", () => {
	expect(() => Array.from(tokenize("# == 1"))).toThrowError(
		/Expected a parameter number after '#' at index 0/,
	);
});

test("parse, param reference comparison", () => {
	const input = "#71 == 1";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Comparison,
		operator: Operator.Equal,
		left: {
			kind: SyntaxKind.ParamReference,
			parameter: 71,
			valueBitMask: undefined,
		},
		right: {
			kind: SyntaxKind.NumberLiteral,
			value: 1,
		},
	};
	expect(actual).toEqual(expected);
});

test("parse, param reference with bitmask and negative comparand", () => {
	const input = "#9[0x0f] >= -2";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.Comparison,
		operator: Operator.GreaterThanOrEqual,
		left: {
			kind: SyntaxKind.ParamReference,
			parameter: 9,
			valueBitMask: 0x0f,
		},
		right: {
			kind: SyntaxKind.NumberLiteral,
			value: -2,
		},
	};
	expect(actual).toEqual(expected);
});

test("parse, param reference combined with other conditions", () => {
	const input = "#40 >= 2 && firmwareVersion >= 1.7";
	const actual = parse(input);
	const expected: Expression = {
		kind: SyntaxKind.And,
		operands: [
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.GreaterThanOrEqual,
				left: {
					kind: SyntaxKind.ParamReference,
					parameter: 40,
					valueBitMask: undefined,
				},
				right: {
					kind: SyntaxKind.NumberLiteral,
					value: 2,
				},
			},
			{
				kind: SyntaxKind.Comparison,
				operator: Operator.GreaterThanOrEqual,
				left: {
					kind: SyntaxKind.Identifier,
					name: "firmwareVersion",
				},
				right: {
					kind: SyntaxKind.Version,
					value: "1.7",
				},
			},
		],
	};
	expect(actual).toEqual(expected);
});

test("parse, param reference compared with a version", () => {
	expect(() => parse("#71 >= 1.2")).toThrowError(
		/Parameter references can only be compared with number literals/,
	);
});

test("parse, param reference on the right-hand side", () => {
	expect(() => parse("1 == #71")).toThrowError();
});

test("parse, invalid param reference", () => {
	expect(() => parse("#9[0xzz] == 1")).toThrowError(
		/Expected a parameter number after '#'|Invalid parameter reference/,
	);
});
