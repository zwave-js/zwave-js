import { Bytes } from "@zwave-js/shared";
/** Indicates that value is not known (yet). */
export declare const NOT_KNOWN: undefined;
export type NOT_KNOWN = typeof NOT_KNOWN;
/** Indicates that something is (known to be) in an unknown state. */
export declare const UNKNOWN_STATE: null;
export type UNKNOWN_STATE = typeof UNKNOWN_STATE;
/** Helper type to preserve the names of an alternative type */
export type Either<T, Or> = T | Or;
export type MaybeNotKnown<T> = Either<T, NOT_KNOWN>;
export type MaybeUnknown<T> = Either<T, UNKNOWN_STATE>;
/**
 * Parses a boolean that is encoded as a single byte and might also be {@link UNKNOWN_STATE} (`null`).
 * Returns `undefined` if the value canot be parsed.
 */
export declare function parseMaybeBoolean(val: number): MaybeUnknown<boolean> | undefined;
/** Parses a boolean that is encoded as a single byte */
export declare function parseBoolean(val: number): boolean | undefined;
/** Encodes a boolean that is encoded as a single byte */
export declare function encodeBoolean(val: boolean): number;
/** Encodes a boolean that is encoded as a single byte and might also be {@link UNKNOWN_STATE} (`null`) */
export declare function encodeMaybeBoolean(val: MaybeUnknown<boolean>): number;
/** Parses a single-byte number from 0 to 99, which might also be {@link UNKNOWN_STATE} (`null`) */
export declare function parseMaybeNumber(val: number): MaybeUnknown<number> | undefined;
/** Parses a single-byte number from 0 to 99 */
export declare function parseNumber(val: number): number | undefined;
/** Stringifies a value that is potentially unknown */
export declare function maybeUnknownToString<T>(val: MaybeUnknown<T>, ifNotUnknown?: (val: NonNullable<T>) => string): string;
/**
 * Parses a floating point value with a scale from a buffer.
 */
export declare function parseFloatWithScale(payload: Uint8Array, allowEmpty?: false): {
    value: number;
    scale: number;
    bytesRead: number;
};
/**
 * Parses a floating point value with a scale from a buffer.
 * @param allowEmpty Whether empty floats (precision = scale = size = 0 no value) are accepted
 */
export declare function parseFloatWithScale(payload: Uint8Array, allowEmpty: true): {
    value?: number;
    scale?: number;
    bytesRead: number;
};
/** The minimum and maximum values that can be stored in each numeric value type */
export declare const IntegerLimits: Readonly<{
    UInt8: Readonly<{
        min: 0;
        max: 255;
    }>;
    UInt16: Readonly<{
        min: 0;
        max: 65535;
    }>;
    UInt24: Readonly<{
        min: 0;
        max: 16777215;
    }>;
    UInt32: Readonly<{
        min: 0;
        max: 4294967295;
    }>;
    Int8: Readonly<{
        min: -128;
        max: 127;
    }>;
    Int16: Readonly<{
        min: -32768;
        max: 32767;
    }>;
    Int24: Readonly<{
        min: -8388608;
        max: 8388607;
    }>;
    Int32: Readonly<{
        min: -2147483648;
        max: 2147483647;
    }>;
}>;
export declare function getMinIntegerSize(value: number, signed: boolean): 1 | 2 | 4 | undefined;
export declare function getIntegerLimits(size: 1 | 2 | 3 | 4, signed: boolean): {
    min: number;
    max: number;
};
export interface FloatParameters {
    precision: number;
    size: number;
}
export interface FloatParametersWithValue extends FloatParameters {
    roundedValue: number;
}
export declare function getFloatParameters(value: number): FloatParametersWithValue;
/**
 * Encodes a floating point value with a scale into a buffer
 * @param override can be used to overwrite the automatic computation of precision and size with fixed values
 */
export declare function encodeFloatWithScale(value: number, scale: number, override?: {
    size?: number;
    precision?: number;
}): Bytes;
/** Parses a bit mask into a numeric array */
export declare function parseBitMask(mask: Uint8Array | ArrayLike<number>, startValue?: number, numBits?: number): number[];
/** Serializes a numeric array with a given maximum into a bit mask */
export declare function encodeBitMask(values: readonly number[], maxValue?: number, startValue?: number): Bytes;
export declare function parseNodeBitMask(mask: Uint8Array): number[];
export declare function parseLongRangeNodeBitMask(mask: Uint8Array | ArrayLike<number>, startValue: number): number[];
export declare function encodeNodeBitMask(nodeIDs: readonly number[]): Bytes;
export declare function encodeLongRangeNodeBitMask(nodeIDs: readonly number[], startValue: number): Bytes;
/**
 * Parses a partial value from a "full" value. Example:
 * ```txt
 *   Value = 01110000
 *   Mask  = 00110000
 *   ----------------
 *             11     => 3 (unsigned) or -1 (signed)
 * ```
 *
 * @param value The full value the partial should be extracted from
 * @param bitMask The bit mask selecting the partial value
 * @param signed Whether the partial value should be interpreted as signed
 */
export declare function parsePartial(value: number, bitMask: number, signed: boolean): number;
/**
 * Encodes a partial value into a "full" value. Example:
 * ```txt
 *   Value   = 01··0000
 * + Partial =   10     (2 or -2 depending on signed interpretation)
 *   Mask    = 00110000
 *   ------------------
 *             01100000
 * ```
 *
 * @param fullValue The full value the partial should be merged into
 * @param partialValue The partial to be merged
 * @param bitMask The bit mask selecting the partial value
 */
export declare function encodePartial(fullValue: number, partialValue: number, bitMask: number): number;
//# sourceMappingURL=Primitive.d.ts.map