import { padVersion } from "@zwave-js/shared";
import { type RulesLogic, add_operation, apply } from "json-logic-js";
import * as semver from "semver";
import { parse } from "./LogicParser";

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
	tryOr((a, b) => semver.gte(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver >",
	tryOr((a, b) => semver.gt(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver <=",
	tryOr((a, b) => semver.lte(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver <",
	tryOr((a, b) => semver.lt(padVersion(a), padVersion(b)), false),
);
add_operation(
	"ver ===",
	tryOr((a, b) => semver.eq(padVersion(a), padVersion(b)), false),
);

export function parseLogic(logic: string): RulesLogic {
	try {
		// The generated types for the version comparisons are not compatible with the RulesLogic type
		return parse(logic) as unknown as RulesLogic;
	} catch (e: any) {
		throw new Error(`Invalid logic: ${logic}\n${e.message}`);
	}
}

export function evaluate(
	logic: string,
	context: unknown,
): string | number | boolean {
	const rules = parseLogic(logic);
	return apply(rules, context);
}
