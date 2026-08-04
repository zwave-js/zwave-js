import type { Timer } from "./Timers.js";

/** Enforces that all of the required properties (optional properties may be omitted) or none of the properties exist */
export type AllOrNone<T extends Record<string, any>> =
	| T
	| { [key in keyof T]?: undefined };

export type DeepPartial<T> = { [P in keyof T]+?: DeepPartial<T[P]> };

export type JSONObject = Record<string, any>;

export type Constructor<T = object> = new (...args: any[]) => T;

export type TypedClassDecorator<
	Class extends abstract new (...args: any) => any,
> = (
	target: Class,
	context: ClassDecoratorContext<Class>,
) => Class | void;

export type TypedPropertyDecorator<TTarget extends object> = <
	T extends TTarget,
>(
	target: T,
	propertyKey: string | symbol,
) => void;

export type UnionToIntersection<T> = (
	T extends any ? (x: T) => any : never
) extends (x: infer R) => any ? R
	: never;

export type OnlyMethods<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};
export type MethodsNamesOf<T> = OnlyMethods<T>[keyof T];

export type IsAny<T> = 0 extends 1 & T ? true : false;

/** A registration for something that is awaited out-of-band, e.g. an unsolicited message or command */
export interface AwaitedThing<T> {
	handler: (thing: T) => void;
	timeout?: Timer;
	predicate: (msg: T) => boolean;
	refreshPredicate?: (msg: T) => boolean;
	/** Whether a matching thing is consumed (default) or only observed. */
	consume?: boolean;
}

// expands object types recursively
// dprint-ignore
export type Expand<T> =
	// Expand object types
	T extends object
		? T extends infer O
			? { [K in keyof O]: O[K] }
			: never
		: // Fallback to the type itself if no match
		  T;
