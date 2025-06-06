import {
	type JSONObject,
	hexToUint8Array,
	isUint8Array,
	uint8ArrayToHex,
} from "@zwave-js/shared";
import { isArray, isObject } from "alcalzone-shared/typeguards";
import { Duration } from "./Duration.js";
import type { ValueMetadata } from "./Metadata.js";
import type { ValueID } from "./_Types.js";

// export type SerializableValue = number | string | boolean | Map<string | number, any> | JSONObject;
export type SerializedValue =
	| number
	| string
	| boolean
	| JSONObject
	| undefined;

export interface CacheValue
	extends Pick<ValueID, "endpoint" | "property" | "propertyKey">
{
	value: SerializedValue;
}

export interface CacheMetadata
	extends Pick<ValueID, "endpoint" | "property" | "propertyKey">
{
	metadata: ValueMetadata;
}

const SPECIAL_TYPE_KEY = "$$type$$";

/** Serializes a value so it can be stored in a JSON object (and later on disk) */
export function serializeCacheValue(value: unknown): SerializedValue {
	if (value instanceof Map) {
		// We mark maps with a special key, so they can be detected by the deserialization routine
		return {
			...Object.fromEntries(
				[...value.entries()].map(([k, v]) => [
					k,
					serializeCacheValue(v),
				]),
			),
			[SPECIAL_TYPE_KEY]: "map",
		};
	} else if (Duration.isDuration(value)) {
		const valueAsJSON = value.toJSON();
		return {
			...(typeof valueAsJSON === "string"
				? { unit: valueAsJSON }
				: valueAsJSON),
			[SPECIAL_TYPE_KEY]: "duration",
		};
	} else if (isUint8Array(value)) {
		return {
			[SPECIAL_TYPE_KEY]: "buffer",
			data: uint8ArrayToHex(value),
		};
	} else if (
		typeof value === "number"
		|| typeof value === "string"
		|| typeof value === "boolean"
		|| isObject(value)
		|| isArray(value)
	) {
		return value;
	}
}

/** Deserializes a value that was serialized by serializeCacheValue */
export function deserializeCacheValue(value: SerializedValue): unknown {
	if (isObject(value)) {
		const specialType = (value as Record<any, SerializedValue>)[
			SPECIAL_TYPE_KEY
		];
		// Convert objects which used to be a map back to a Map
		if (specialType === "map") {
			const { [SPECIAL_TYPE_KEY]: _, ...rest } = value as Record<
				any,
				SerializedValue
			>;
			return new Map<unknown, unknown>(
				Object.entries(rest)
					// We assume that all keys that resemble a number should be a number
					.map(([k, v]) => [/^\d+$/.test(k) ? parseInt(k, 10) : k, v])
					// recursively deserialize the value
					.map(([k, v]) => [k, deserializeCacheValue(v)]),
			);
		} else if (specialType === "duration") {
			return new Duration(value.value ?? 1, value.unit);
		} else if (specialType === "buffer") {
			return hexToUint8Array(value.data);
		}
	}
	return value;
}
