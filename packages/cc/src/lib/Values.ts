import { type GetDeviceConfig } from "@zwave-js/config";
import {
	type CommandClasses,
	type EndpointId,
	type GetValueDB,
	type ValueID,
	type ValueMetadata,
} from "@zwave-js/core/safe";
import {
	type FnOrStatic,
	type ReturnTypeOrStatic,
	evalOrStatic,
} from "@zwave-js/shared/safe";
import type { ValueIDProperties } from "./API.js";

import { CCValues } from "../cc/_CCValues.generated.js";

function defineCCValues<T extends CommandClasses>(
	commandClass: T,
	_: Record<string, CCValueBlueprint | DynamicCCValueBlueprint<any[]>>,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore I know what I'm doing!
): typeof import("../cc/_CCValues.generated.js").CCValues[T] {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore I know what I'm doing!
	return CCValues[commandClass];
}

// HINT: To fully view types for definitions created by this, open
// node_modules/typescript/lib/tsserver.js and change the definition of
// ts.defaultMaximumTruncationLength = 160
// to something higher like
// ts.defaultMaximumTruncationLength = 1000
// Then restart TS Server

export interface CCValueOptions {
	/**
	 * Whether the CC value is internal. Internal values are not exposed to the user.
	 */
	internal?: boolean;
	/**
	 * The minimum CC version required for this value to exist.
	 */
	minVersion?: number;
	/**
	 * Whether this value represents a state (`true`) or a notification/event (`false`). Default: `true`
	 */
	stateful?: boolean;
	/**
	 * Omit this value from value logs. Default: `false`
	 */
	secret?: boolean;

	/** Whether the CC value may exist on endpoints. Default: `true` */
	supportsEndpoints?: boolean;

	/**
	 * Can be used to dynamically decide if this value should be created automatically.
	 * This is ignored for dynamic values and defaults to `true` if not given.
	 */
	autoCreate?:
		| boolean
		| ((
			ctx: GetValueDB & GetDeviceConfig,
			endpoint: EndpointId,
		) => boolean);
}

export const defaultCCValueOptions = {
	internal: false,
	minVersion: 1,
	secret: false,
	stateful: true,
	supportsEndpoints: true,
	autoCreate: true,
} as const;

// expands object types recursively
export type ExpandRecursively<T> =
	// Split functions with properties into the function and object parts
	T extends (...args: infer A) => infer R
		? [keyof T] extends [never] ? (...args: A) => ExpandRecursively<R>
		:
			& ((...args: A) => ExpandRecursively<R>)
			& {
				[P in keyof T]: ExpandRecursively<T[P]>;
			}
		// Expand object types
		: T extends object
			? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> }
			: never
		// Fallback to the type itself if no match
		: T;

export type ExpandRecursivelySkipMeta<T> =
	// Split functions with properties into the function and object parts
	T extends (...args: infer A) => infer R
		? [keyof T] extends [never]
			? (...args: A) => ExpandRecursivelySkipMeta<R>
		:
			& ((...args: A) => ExpandRecursivelySkipMeta<R>)
			& {
				[P in keyof T]: ExpandRecursivelySkipMeta<T[P]>;
			}
		// Ignore the ValueMetadata type
		: T extends ValueMetadata ? T
		// Expand object types
		: T extends object
			? T extends infer O
				? { [K in keyof O]: ExpandRecursivelySkipMeta<O[K]> }
			: never
		// Fallback to the type itself if no match
		: T;

type InferArgs<T extends FnOrStatic<any, any>[]> = T extends [
	(...args: infer A) => any,
	...any,
] ? A
	: T extends [any, ...infer R] ? InferArgs<R>
	: [];

// Namespace for utilities to define CC values
export const V = {
	/** Returns a CC value definition that is named like the value `property` */
	staticProperty<
		TProp extends string | number,
		const TMeta extends ValueMetadata,
		const TOptions extends CCValueOptions,
	>(
		property: TProp,
		meta?: TMeta,
		options?: TOptions,
	): {
		[K in TProp]: {
			property: TProp;
			meta: TMeta;
			options: TOptions;
		};
	} {
		return {
			[property]: {
				property,
				meta,
				options,
			},
		} as any;
	},

	/** Returns a CC value definition with the given name and `property` */
	staticPropertyWithName<
		TName extends string,
		TProp extends string | number,
		const TMeta extends ValueMetadata,
		const TOptions extends CCValueOptions,
	>(
		name: TName,
		property: TProp,
		meta?: TMeta,
		options?: TOptions,
	): {
		[K in TName]: {
			property: TProp;
			meta: TMeta;
			options: TOptions;
		};
	} {
		return {
			[name]: {
				property,
				meta,
				options,
			},
		} as any;
	},

	/** Returns a CC value definition with the given name, `property` and `propertyKey` */
	staticPropertyAndKeyWithName<
		TName extends string,
		TProp extends string | number,
		TKey extends string | number,
		TMeta extends ValueMetadata,
		TOptions extends CCValueOptions,
	>(
		name: TName,
		property: TProp,
		propertyKey: TKey,
		meta?: TMeta,
		options?: TOptions,
	): {
		[K in TName]: {
			property: TProp;
			propertyKey: TKey;
			meta: TMeta;
			options: TOptions;
		};
	} {
		return {
			[name]: {
				property,
				propertyKey,
				meta,
				options,
			},
		} as any;
	},

	/** Returns a CC value definition with the given name and a dynamic `property` */
	dynamicPropertyWithName<
		TName extends string,
		TProp extends FnOrStatic<any[], ValueIDProperties["property"]>,
		TMeta extends FnOrStatic<any[], ValueMetadata> = ValueMetadata,
		TOptions extends CCValueOptions = CCValueOptions,
	>(
		name: TName,
		property: TProp,
		is: PartialCCValuePredicate,
		meta?: TMeta,
		options?: TOptions,
	): {
		[K in TName]: {
			(...args: InferArgs<[TProp, TMeta]>): {
				property: ReturnTypeOrStatic<TProp>;
				meta: ReturnTypeOrStatic<TMeta>;
			};
			is: PartialCCValuePredicate;
			options: TOptions;
		};
	} {
		return {
			[name]: Object.assign(
				(...args: InferArgs<[TProp, TMeta]>) => ({
					property: evalOrStatic(property, ...args),
					meta: evalOrStatic(meta, ...args),
				}),
				{ is, options },
			),
		} as any;
	},

	/** Returns a CC value definition with the given name and a dynamic `property` */
	dynamicPropertyAndKeyWithName<
		TName extends string,
		TProp extends FnOrStatic<any[], ValueIDProperties["property"]>,
		TKey extends FnOrStatic<any[], ValueIDProperties["propertyKey"]>,
		TOptions extends CCValueOptions,
		TMeta extends FnOrStatic<any[], ValueMetadata> = ValueMetadata,
	>(
		name: TName,
		property: TProp,
		propertyKey: TKey,
		is: PartialCCValuePredicate,
		meta?: TMeta,
		options?: TOptions,
	): {
		[K in TName]: {
			(...args: InferArgs<[TProp, TKey, TMeta]>): {
				property: ReturnTypeOrStatic<TProp>;
				propertyKey: ReturnTypeOrStatic<TKey>;
				meta: ReturnTypeOrStatic<TMeta>;
			};
			is: PartialCCValuePredicate;
			options: TOptions;
		};
	} {
		return {
			[name]: Object.assign(
				(...args: any[]) => {
					return {
						property: evalOrStatic(property, ...args),
						propertyKey: evalOrStatic(propertyKey, ...args),
						meta: evalOrStatic(meta, ...args),
					};
				},
				{ is, options },
			),
		} as any;
	},

	defineCCValues,
};

export interface CCValueBlueprint extends Readonly<ValueIDProperties> {
	readonly meta?: Readonly<ValueMetadata>;
	readonly options?: Readonly<CCValueOptions>;
}

export type CCValuePredicate = (valueId: ValueID) => boolean;
export type PartialCCValuePredicate = (
	properties: ValueIDProperties,
) => boolean;

/** A blueprint for a CC value which depends on one or more parameters */
export interface DynamicCCValueBlueprint<TArgs extends any[]> {
	(...args: TArgs): Omit<CCValueBlueprint, "options">;
	is: PartialCCValuePredicate;
	readonly options?: Readonly<CCValueOptions>;
}

/** The common base type of all CC value definitions */
export interface CCValue {
	readonly id: Omit<ValueID, "endpoint">;
	endpoint(endpoint?: number): ValueID;
	readonly meta: ValueMetadata;
}

export interface StaticCCValue extends CCValue {
	/** Whether the given value ID matches this value definition */
	is: CCValuePredicate;
	readonly options: Required<CCValueOptions>;
}

export type DynamicCCValue<TArgs extends any[] = any[]> =
	& ExpandRecursivelySkipMeta<(...args: TArgs) => CCValue>
	& {
		/** Whether the given value ID matches this value definition */
		is: CCValuePredicate;
		readonly options: Required<CCValueOptions>;
	};

export type StaticCCValueFactory<T> = (self: T) => StaticCCValue;
