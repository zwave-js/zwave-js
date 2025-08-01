export interface ValidatorContext {
    kind: "parameter" | "item" | "object" | "property";
    name: string;
}
export type ValidatorFunction = (value: any) => ValidatorResult;
type ErrorElaboration = ValidatorContext & {
    optional?: boolean;
    index?: number;
} & ({
    type: "primitive";
    expected: "string" | "number" | "boolean" | "null" | "undefined";
    actual: string;
} | {
    type: "literal";
    expected: string;
    actual: string;
} | {
    type: "date";
    actual: string;
} | {
    type: "uint8array";
    actual: string;
} | {
    type: "union";
    typeName: string | undefined;
    actual: string;
    actualType: string;
    nested: ErrorElaboration[];
} | {
    type: "intersection";
    typeName: string | undefined;
    actual: string;
    nested: ErrorElaboration[];
} | {
    type: "array";
    itemType: string;
    actual: string;
    nested?: ErrorElaboration[];
} | {
    type: "tuple";
    tupleType: string;
    actual: string;
    nested?: ErrorElaboration[];
} | {
    type: "object";
    objectType: string;
    actual: string;
    nested?: ErrorElaboration[];
} | {
    type: "enum";
    enum: string;
    actual: string;
} | {
    type: "class";
    class: string;
    actual: string;
} | {
    type: "missing";
});
export type ValidatorResult = {
    success: true;
    elaboration?: undefined;
} | {
    success: false;
    elaboration: ErrorElaboration;
};
export declare const primitive: (ctx: ValidatorContext, expected: "string" | "number" | "boolean") => (value: any) => ValidatorResult;
export declare const literal: (ctx: ValidatorContext, expected: string | number | boolean) => (value: any) => ValidatorResult;
declare const enm: (ctx: ValidatorContext, name: string, values?: number[]) => (value: any) => ValidatorResult;
export { enm as enum };
export declare const undef: (ctx: ValidatorContext) => (value: any) => ValidatorResult;
export { undef as undefined };
export declare const nul: (ctx: ValidatorContext) => (value: any) => ValidatorResult;
export { nul as null };
export declare const date: (ctx: ValidatorContext) => (value: any) => ValidatorResult;
export declare const array: (ctx: ValidatorContext, itemType: string, item: ValidatorFunction) => (value: any) => ValidatorResult;
export declare const tuple: (ctx: ValidatorContext, tupleType: string, ...items: ValidatorFunction[]) => (value: any) => ValidatorResult;
export declare const object: (ctx: ValidatorContext, objectType: string, properties: Record<string, ValidatorFunction>) => (value: any) => ValidatorResult;
declare const klass: (ctx: ValidatorContext, name: string, klass: new (...args: any[]) => any) => (value: any) => ValidatorResult;
export { klass as class };
export declare const uint8array: (ctx: ValidatorContext) => (value: any) => ValidatorResult;
export declare const optional: (ctx: ValidatorContext, otherwise: ValidatorFunction) => (value: any) => ValidatorResult;
export declare const oneOf: (ctx: ValidatorContext, typeName: string | undefined, ...nested: ValidatorFunction[]) => (value: any) => ValidatorResult;
export declare const allOf: (ctx: ValidatorContext, typeName: string | undefined, ...nested: ValidatorFunction[]) => (value: any) => ValidatorResult;
export declare function assert(...results: ValidatorResult[]): void;
//# sourceMappingURL=validation.d.ts.map