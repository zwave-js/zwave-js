import {
	type LogPayload,
	type LogPayloadDict,
	type LogPayloadText,
	type MessageRecord,
	toLogPayload,
} from "./LogPayload.js";
import { CONTROL_CHAR_WIDTH, LOG_WIDTH, tagify } from "./shared.js";

const INDENT = "  ";

/** Renders a log payload into the individual lines of a log message */
export function formatLogPayload(
	payload: LogPayload | MessageRecord,
	// Message lines are wrapped by the log formatter beyond this width
	width: number = LOG_WIDTH - CONTROL_CHAR_WIDTH,
): string[] {
	const ret: string[] = [];
	renderPayload(toLogPayload(payload), 0, false, ret, width);
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
	width: number,
): void {
	switch (payload.type) {
		case "text":
			renderText(payload, indent, isNested, out, width);
			break;
		case "dict":
			renderDict(payload, indent, out, width);
			renderNested(asArray(payload.nested), indent, out, width);
			break;
		case "list": {
			const pad = INDENT.repeat(indent);
			out.push(...payload.items.map((item) => `${pad} · ${item}`));
			break;
		}
	}
}

function renderNested(
	nested: LogPayload[],
	indent: number,
	out: string[],
	width: number,
): void {
	for (const payload of nested) {
		renderPayload(payload, indent, isTaggedText(payload), out, width);
	}
}

function renderText(
	text: LogPayloadText,
	indent: number,
	isNested: boolean,
	out: string[],
	width: number,
): void {
	const pad = INDENT.repeat(indent);
	const nested = asArray(text.nested);

	if (!text.tags?.length) {
		for (const line of text.lines) {
			out.push(...line.split("\n").map((l) => pad + l));
		}
		renderNested(nested, indent, out, width);
		return;
	}

	out.push(pad + (isNested ? "└─" : "") + tagify(text.tags));

	// Nested tree children align with the content of their parent
	const contentIndent = isNested ? indent + 1 : indent;
	const contentPad = INDENT.repeat(contentIndent);
	// Draw a bracket alongside the content while tree children follow below
	const gutter = nested.some(isTaggedText) ? "│ " : "  ";
	const contentWidth = width - contentPad.length - gutter.length;

	// Trim the content only, so blank lines keep the gutter
	const prefixContent = (lines: string[]) =>
		out.push(...lines.map((l) => contentPad + gutter + l.trimEnd()));

	prefixContent(text.lines.flatMap((line) => line.split("\n")));

	const lastTreeIndex = nested.findLastIndex(isTaggedText);
	for (let i = 0; i < nested.length; i++) {
		const payload = nested[i];
		if (isTaggedText(payload)) {
			// Siblings continue the tree with "├─" and a vertical line, only the last child uses "└─"
			const isLast = i === lastTreeIndex;
			const child: string[] = [];
			renderText(payload, 0, true, child, width - contentPad.length);
			out.push(
				contentPad + (isLast ? child[0] : "├─" + child[0].slice(2)),
			);
			out.push(
				...child.slice(1).map((line) =>
					contentPad + (isLast ? line : "│ " + line.slice(2))
				),
			);
		} else {
			const content: string[] = [];
			renderPayload(payload, 0, false, content, contentWidth);
			prefixContent(content);
		}
	}
}

function renderDict(
	dict: LogPayloadDict,
	indent: number,
	out: string[],
	width: number,
): void {
	const { entries } = dict;
	if (!entries.length) return;

	const pad = INDENT.repeat(indent);
	const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
	// All values start in the same column, one space after the longest key
	const valuePad = pad + " ".repeat(maxKeyLength + 2);
	const valueWidth = Math.max(width - valuePad.length, 16);
	for (const [key, value] of entries) {
		if (typeof value === "string") {
			const [first, ...rest] = value
				.split("\n")
				.flatMap((line) => wrap(line, valueWidth));
			out.push(
				(pad
					+ key
					+ ":"
					+ " ".repeat(maxKeyLength - key.length + 1)
					+ first).trimEnd(),
			);
			out.push(...rest.map((line) => (valuePad + line).trimEnd()));
		} else {
			out.push(pad + key + ":");
			out.push(...value.items.map((item) => `${pad} · ${item}`));
		}
	}
}

function wrap(line: string, width: number): string[] {
	if (line.length <= width) return [line];
	const ret: string[] = [];
	for (let i = 0; i < line.length; i += width) {
		ret.push(line.slice(i, i + width));
	}
	return ret;
}
