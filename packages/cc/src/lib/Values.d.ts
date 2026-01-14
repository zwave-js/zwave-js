import type { GetDeviceConfig } from "@zwave-js/config";
import type { CommandClasses, EndpointId, GetValueDB, ValueID, ValueMetadata } from "@zwave-js/core";
import { type FnOrStatic, type ReturnTypeOrStatic } from "@zwave-js/shared";
import type { ValueIDProperties } from "./API.js";
declare function defineCCValues<T extends CommandClasses>(commandClass: T, _: Record<string, CCValueBlueprint | DynamicCCValueBlueprint<any[]>>): typeof import("../cc/_CCValues.generated.js").CCValues[T];
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
    autoCreate?: boolean | ((ctx: GetValueDB & GetDeviceConfig, endpoint: EndpointId) => boolean);
}
export declare const defaultCCValueOptions: {
    readonly internal: false;
    readonly minVersion: 1;
    readonly secret: false;
    readonly stateful: true;
    readonly supportsEndpoints: true;
    readonly autoCreate: true;
};
export type ExpandRecursively<T> = T extends (...args: infer A) => infer R ? [keyof T] extends [never] ? (...args: A) => ExpandRecursively<R> : ((...args: A) => ExpandRecursively<R>) & {
    [P in keyof T]: ExpandRecursively<T[P]>;
} : T extends object ? T extends infer O ? {
    [K in keyof O]: ExpandRecursively<O[K]>;
} : never : T;
export type ExpandRecursivelySkipMeta<T> = T extends (...args: infer A) => infer R ? [keyof T] extends [never] ? (...args: A) => ExpandRecursivelySkipMeta<R> : ((...args: A) => ExpandRecursivelySkipMeta<R>) & {
    [P in keyof T]: ExpandRecursivelySkipMeta<T[P]>;
} : T extends ValueMetadata ? T : T extends object ? T extends infer O ? {
    [K in keyof O]: ExpandRecursivelySkipMeta<O[K]>;
} : never : T;
type InferArgs<T extends FnOrStatic<any, any>[]> = T extends [
    (...args: infer A) => any,
    ...any
] ? A : T extends [any, ...infer R] ? InferArgs<R> : [];
export declare const V: {
    /** Returns a CC value definition that is named like the value `property` */
    staticProperty<TProp extends string | number, const TMeta extends ValueMetadata, const TOptions extends CCValueOptions>(property: TProp, meta?: TMeta, options?: TOptions): { [K in TProp]: {
        property: TProp;
        meta: TMeta;
        options: TOptions;
    }; };
    /** Returns a CC value definition with the given name and `property` */
    staticPropertyWithName<TName extends string, TProp extends string | number, const TMeta extends ValueMetadata, const TOptions extends CCValueOptions>(name: TName, property: TProp, meta?: TMeta, options?: TOptions): { [K in TName]: {
        property: TProp;
        meta: TMeta;
        options: TOptions;
    }; };
    /** Returns a CC value definition with the given name, `property` and `propertyKey` */
    staticPropertyAndKeyWithName<TName extends string, TProp extends string | number, TKey extends string | number, TMeta extends ValueMetadata, TOptions extends CCValueOptions>(name: TName, property: TProp, propertyKey: TKey, meta?: TMeta, options?: TOptions): { [K in TName]: {
        property: TProp;
        propertyKey: TKey;
        meta: TMeta;
        options: TOptions;
    }; };
    /** Returns a CC value definition with the given name and a dynamic `property` */
    dynamicPropertyWithName<TName extends string, TProp extends FnOrStatic<any[], ValueIDProperties["property"]>, TMeta extends FnOrStatic<any[], ValueMetadata> = ValueMetadata, TOptions extends CCValueOptions = CCValueOptions>(name: TName, property: TProp, is: PartialCCValuePredicate, meta?: TMeta, options?: TOptions): { [K in TName]: {
        (...args: InferArgs<[TProp, TMeta]>): {
            property: ReturnTypeOrStatic<TProp>;
            meta: ReturnTypeOrStatic<TMeta>;
        };
        is: PartialCCValuePredicate;
        options: TOptions;
    }; };
    /** Returns a CC value definition with the given name and a dynamic `property` */
    dynamicPropertyAndKeyWithName<TName extends string, TProp extends FnOrStatic<any[], ValueIDProperties["property"]>, TKey extends FnOrStatic<any[], ValueIDProperties["propertyKey"]>, TOptions extends CCValueOptions, TMeta extends FnOrStatic<any[], ValueMetadata> = ValueMetadata>(name: TName, property: TProp, propertyKey: TKey, is: PartialCCValuePredicate, meta?: TMeta, options?: TOptions): { [K in TName]: {
        (...args: InferArgs<[TProp, TKey, TMeta]>): {
            property: ReturnTypeOrStatic<TProp>;
            propertyKey: ReturnTypeOrStatic<TKey>;
            meta: ReturnTypeOrStatic<TMeta>;
        };
        is: PartialCCValuePredicate;
        options: TOptions;
    }; };
    defineCCValues: typeof defineCCValues;
};
export interface CCValueBlueprint extends Readonly<ValueIDProperties> {
    readonly meta?: Readonly<ValueMetadata>;
    readonly options?: Readonly<CCValueOptions>;
}
export type CCValuePredicate = (valueId: ValueID) => boolean;
export type PartialCCValuePredicate = (properties: ValueIDProperties) => boolean;
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
export type DynamicCCValue<TArgs extends any[] = any[]> = ExpandRecursivelySkipMeta<(...args: TArgs) => CCValue> & {
    /** Whether the given value ID matches this value definition */
    is: CCValuePredicate;
    readonly options: Required<CCValueOptions>;
};
export type StaticCCValueFactory<T> = (self: T) => StaticCCValue;
export {};
//# sourceMappingURL=Values.d.ts.map