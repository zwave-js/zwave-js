import { type BytesView, buffer2hex } from "@zwave-js/shared";

/**
 * Structured log payloads that can be composed at call sites and rendered
 * into consistently formatted, indented log lines by {@link formatLogPayload}.
 */
export type LogPayload = LogPayloadText | LogPayloadDict | LogPayloadList;

/** Free-form text lines, optionally tagged and/or containing a nested payload */
export interface LogPayloadText {
	type: "text";
	/** Tags are rendered as a [bracketed] heading line above the text */
	tags?: string[];
	lines: string[];
	nested?: LogPayload | LogPayload[];
}

/** Key-value pairs, rendered with values aligned to the longest key */
export interface LogPayloadDict {
	type: "dict";
	entries: Array<[key: string, value: string | LogPayloadList]>;
	nested?: LogPayload | LogPayload[];
}

/** A list of items, each rendered with a leading "· " bullet */
export interface LogPayloadList {
	type: "list";
	items: string[];
}

export type LogPayloadDictValue =
	| string
	| number
	| boolean
	| LogPayloadList;

/** Entries with `undefined` values are skipped, so optional entries can be included inline */
export type MessageRecord = Record<
	string,
	LogPayloadDictValue | undefined
>;

export function isLogPayload(value: unknown): value is LogPayload {
	return (
		typeof value === "object"
		&& value != null
		&& "type" in value
		&& (value.type === "text"
			|| value.type === "dict"
			|| value.type === "list")
	);
}

export function logText(
	lines: string | string[],
	options?: {
		tags?: string[];
		nested?: LogPayload | LogPayload[];
	},
): LogPayloadText {
	return {
		type: "text",
		tags: options?.tags,
		lines: typeof lines === "string"
			? (lines ? lines.split("\n") : [])
			: lines,
		nested: options?.nested,
	};
}

export function logDict(
	entries: MessageRecord,
	nested?: LogPayload | LogPayload[],
): LogPayloadDict {
	return {
		type: "dict",
		entries: Object.entries(entries)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [
				key,
				typeof value === "object" ? value : String(value),
			]),
		nested,
	};
}

export function logList(
	items: Iterable<string | number>,
): LogPayloadList {
	return {
		type: "list",
		items: [...items].map(String),
	};
}

/** Formats a buffer as a 0x-prefixed hex dict value, skipping the entry when the buffer is empty */
export function logBuffer(buffer: BytesView): string | undefined {
	if (buffer.length === 0) return undefined;
	return buffer2hex(buffer);
}

/** Normalizes the message of a log entry, which may be given as a bare object literal */
export function toLogPayload(
	message: LogPayload | MessageRecord,
): LogPayload {
	return isLogPayload(message) ? message : logDict(message);
}

/**
 * Merges dict payloads in sequence, e.g. entries inherited from a base class with additional ones.
 * Later entries override earlier ones in place; entries with `undefined` values are removed from the result.
 */
export function mergeLogDict(
	...sources: (LogPayload | MessageRecord | undefined)[]
): LogPayloadDict {
	const entries: LogPayloadDict["entries"] = [];
	let nested: LogPayloadDict["nested"];

	for (const source of sources) {
		if (source == undefined) continue;
		const dict = toLogPayload(source);
		if (dict.type !== "dict") {
			throw new Error("mergeLogDict can only merge dict payloads");
		}
		if (dict.nested) nested = dict.nested;

		// Re-apply the raw entries so undefined markers can remove earlier ones
		const raw = isLogPayload(source)
			? dict.entries
			: Object.entries(source);
		for (const [key, value] of raw) {
			const index = entries.findIndex(([k]) => k === key);
			if (value === undefined) {
				if (index >= 0) entries.splice(index, 1);
				continue;
			}
			const entry: (typeof entries)[number] = [
				key,
				typeof value === "object" ? value : String(value),
			];
			if (index >= 0) {
				entries[index] = entry;
			} else {
				entries.push(entry);
			}
		}
	}
	return { type: "dict", entries, nested };
}
