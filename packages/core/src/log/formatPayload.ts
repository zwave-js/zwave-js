import {
	type LogPayload,
	type LogPayloadDict,
	type LogPayloadText,
	type MessageRecord,
	toLogPayload,
} from "./LogPayload.js";
import { tagify } from "./shared.js";

const INDENT = "  ";

/** Renders a log payload into the individual lines of a log message */
export function formatLogPayload(
	payload: LogPayload | MessageRecord,
): string[] {
	const ret: string[] = [];
	renderPayload(toLogPayload(payload), 0, false, ret);
	return ret;
}

function asArray(
	nested: LogPayload | LogPayload[] | undefined,
): LogPayload[] {
	if (nested == undefined) return [];
	return Array.isArray(nested) ? nested : [nested];
}

/** Tagged texts are rendered as tree children ("└─[TAG]"), everything else as indented content */
function isTaggedText(payload: LogPayload): payload is LogPayloadText {
	return payload.type === "text" && !!payload.tags?.length;
}

function renderPayload(
	payload: LogPayload,
	indent: number,
	isNested: boolean,
	out: string[],
): void {
	switch (payload.type) {
		case "text":
			renderText(payload, indent, isNested, out);
			break;
		case "dict":
			renderDict(payload, indent, out);
			renderNested(asArray(payload.nested), indent, out);
			break;
		case "list": {
			const pad = INDENT.repeat(indent);
			out.push(...payload.items.map((item) => `${pad}· ${item}`));
			break;
		}
	}
}

function renderNested(
	nested: LogPayload[],
	indent: number,
	out: string[],
): void {
	for (const payload of nested) {
		renderPayload(payload, indent, isTaggedText(payload), out);
	}
}

function renderText(
	text: LogPayloadText,
	indent: number,
	isNested: boolean,
	out: string[],
): void {
	const pad = INDENT.repeat(indent);
	const nested = asArray(text.nested);

	if (!text.tags?.length) {
		for (const line of text.lines) {
			out.push(...line.split("\n").map((l) => pad + l));
		}
		renderNested(nested, indent, out);
		return;
	}

	out.push(pad + (isNested ? "└─" : "") + tagify(text.tags));

	// Nested tree children align with the content of their parent
	const contentIndent = isNested ? indent + 1 : indent;
	const contentPad = INDENT.repeat(contentIndent);
	// Draw a bracket alongside the content when tree children follow below
	const gutter = nested.some(isTaggedText) ? "│ " : "  ";

	const prefixContent = (lines: string[]) =>
		out.push(...lines.map((l) => (contentPad + gutter + l).trimEnd()));

	prefixContent(text.lines.flatMap((line) => line.split("\n")));

	for (const payload of nested) {
		if (isTaggedText(payload)) {
			renderText(payload, contentIndent, true, out);
		} else {
			const content: string[] = [];
			renderPayload(payload, 0, false, content);
			prefixContent(content);
		}
	}
}

function renderDict(
	dict: LogPayloadDict,
	indent: number,
	out: string[],
): void {
	const { entries } = dict;
	if (!entries.length) return;

	const pad = INDENT.repeat(indent);
	const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
	for (const [key, value] of entries) {
		if (typeof value === "string") {
			const [first, ...rest] = value.split("\n");
			out.push(
				(pad
					+ key
					+ ":"
					+ " ".repeat(maxKeyLength - key.length + 1)
					+ first).trimEnd(),
			);
			out.push(...rest.map((line) => (pad + line).trimEnd()));
		} else {
			out.push(pad + key + ":");
			out.push(...value.items.map((item) => `${pad}${INDENT}· ${item}`));
		}
	}
}
