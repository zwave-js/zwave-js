import { padVersion } from "@zwave-js/shared";
import { isArray, isObject } from "alcalzone-shared/typeguards";
import semverEq from "semver/functions/eq.js";
import semverGt from "semver/functions/gt.js";
import semverGte from "semver/functions/gte.js";
import semverLt from "semver/functions/lt.js";
import semverLte from "semver/functions/lte.js";
import type { ConditionalConfigContext } from "./devices/shared.js";

// The types are not correct:
import { type RulesLogic, default as JsonLogic } from "json-logic-js";
import { parse, toRulesLogic } from "./LogicParser.js";
const { add_operation, apply } = JsonLogic;

function tryOr<T extends (...args: any[]) => any>(
	operation: T,
	onError: ReturnType<T>,
): T {
	return ((...args: any[]) => {
		try {
			return operation(...args);
		} catch {
			return onError;
		}
	}) as any as T;
}

add_operation(
	"ver >=",
	tryOr((a, b) => semverGte(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver >",
	tryOr((a, b) => semverGt(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver <=",
	tryOr((a, b) => semverLte(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver <",
	tryOr((a, b) => semverLt(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver ===",
	tryOr((a, b) => semverEq(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver !==",
	tryOr((a, b) => !semverEq(padVersion(a), padVersion(b)), false),
);

function paramComparison(compare: (a: number, b: number) => boolean) {
	// Must be a function expression, so json-logic passes the data context as `this`
	return function(
		this: unknown,
		parameter: number,
		bitMask: number | null,
		comparand: number,
	): boolean {
		const context = this as ConditionalConfigContext | undefined;
		// Contexts evaluated outside an endpoint scope resolve against the root device
		const value = context?.getScopedParamValue
			? context.getScopedParamValue(parameter, bitMask ?? undefined)
			: context?.getCachedParamValue?.(
				0,
				parameter,
				bitMask ?? undefined,
			);
		// Comparisons involving unknown parameter values evaluate as if they didn't exist
		if (value == undefined) return true;
		return compare(value, comparand);
	};
}

add_operation("param ===", paramComparison((a, b) => a === b));
add_operation("param !==", paramComparison((a, b) => a !== b));
add_operation("param <", paramComparison((a, b) => a < b));
add_operation("param <=", paramComparison((a, b) => a <= b));
add_operation("param >", paramComparison((a, b) => a > b));
add_operation("param >=", paramComparison((a, b) => a >= b));

// Conditions repeat heavily across config files, so cache the parse results
const logicCache = new Map<string, RulesLogic>();

export function parseLogic(input: string): RulesLogic {
	let ret = logicCache.get(input);
	if (!ret) {
		const expr = parse(input);
		if (!expr) {
			throw new Error(`Failed to parse expression: ${input}`);
		}
		ret = toRulesLogic(expr);
		logicCache.set(input, ret);
	}
	return ret;
}

export type ParamValueComparisonOperator =
	| "==="
	| "!=="
	| "<"
	| "<="
	| ">"
	| ">=";

export interface ParamValueReference {
	parameter: number;
	valueBitMask?: number;
	operator: ParamValueComparisonOperator;
	comparand: number;
}

/** Returns which config parameter values the given logic references */
export function collectParamValueReferences(
	logic: RulesLogic,
): ParamValueReference[] {
	const ret: ParamValueReference[] = [];
	const walk = (rules: RulesLogic): void => {
		if (!isObject(rules)) return;
		for (const [key, args] of Object.entries(rules)) {
			if (key.startsWith("param ") && isArray(args)) {
				const [parameter, bitMask, comparand] = args as [
					number,
					number | null,
					number,
				];
				ret.push({
					parameter,
					valueBitMask: bitMask ?? undefined,
					operator: key.slice(
						"param ".length,
					) as ParamValueComparisonOperator,
					comparand,
				});
			} else if (isArray(args)) {
				for (const arg of args) walk(arg as RulesLogic);
			}
		}
	};
	walk(logic);
	return ret;
}

export function evaluate(
	logic: string,
	context: unknown,
): string | number | boolean {
	const rules = parseLogic(logic);
	return apply(rules, context);
}
