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
export type LogPayloadDictInput = Record<
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
	entries: LogPayloadDictInput,
	nested?: LogPayload | LogPayload[],
): LogPayloadDict {
	return {
		type: "dict",
		entries: Object.entries(entries)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [
				key,
				typeof value === "object" ? value! : String(value),
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

/** Normalizes the message of a log entry, which may be given as a bare object literal */
export function toLogPayload(
	message: LogPayload | LogPayloadDictInput,
): LogPayload {
	return isLogPayload(message) ? message : logDict(message);
}

/**
 * Merges additional entries into a dict payload, e.g. one inherited from a base class.
 * Entries with `undefined` values are removed from the result.
 */
export function mergeLogDict(
	base: LogPayload | LogPayloadDictInput | undefined,
	extra: LogPayloadDictInput,
): LogPayloadDict {
	const dict = base == undefined
		? logDict({})
		: toLogPayload(base);
	if (dict.type !== "dict") {
		throw new Error("mergeLogDict requires a dict payload as the base");
	}

	const entries = [...dict.entries];
	for (const [key, value] of Object.entries(extra)) {
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
	return { ...dict, entries };
}
