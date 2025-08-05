import type { DataDirection } from "@zwave-js/core";
import type { Transformer } from "node:stream/web";

const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/;

export type UnformattedLogInfo = {
	timestamp: string;
	label: string;
	direction: DataDirection;
	message: string;
	secondaryTags?: string;
};

/** Transforms chunks of a log into individual, complete log entries */
export class CompleteLogEntries extends TransformStream<
	string,
	string
> {
	constructor() {
		const lines: string[] = [];
		let receiveBuffer = "";

		function enqueueCompleteEntries(
			controller: TransformStreamDefaultController<string>,
		): void {
			// Find the indizes of all lines that start with a timestamp.
			// These indicate the start of a new log entry.
			const startIndizes = lines
				.map((line, index) => {
					if (TIMESTAMP_REGEX.test(line)) {
						return index;
					}
					return -1;
				})
				.filter((index) => index >= 0);

			// We can only be sure to have complete log entries if there are at
			// least two timestamps found.
			if (startIndizes.length <= 1) return;

			// For each complete log entry, concatenate all lines that belong to it
			// The last entry is always considered incomplete, so we ignore it here
			for (let i = 0; i < startIndizes.length - 1; i++) {
				const startIndex = startIndizes[i];
				const endIndex = startIndizes[i + 1];
				const entryLines = lines.slice(startIndex, endIndex);
				const entry = entryLines.join("\n");
				controller.enqueue(entry);
			}
			// Remove all lines that have been processed
			lines.splice(0, startIndizes.at(-1));
		}

		const transformer: Transformer<string, string> = {
			transform(chunk, controller) {
				receiveBuffer += chunk;

				// Split the buffer into lines, while ignoring the last incomplete line
				const newLines = receiveBuffer.split("\n");
				if (newLines.length > 1) {
					lines.push(...newLines.slice(0, -1));
					receiveBuffer = newLines.at(-1)!;
				}

				enqueueCompleteEntries(controller);
			},
			flush(controller) {
				// Emit the complete entries that are still in the buffer
				enqueueCompleteEntries(controller);

				// Emit the rest of the lines as a single entry
				if (receiveBuffer.length > 0) {
					lines.push(receiveBuffer);
				}
				if (lines.length > 0) {
					controller.enqueue(lines.join("\n"));
				}
			},
		};

		super(transformer);
	}
}

/** Transforms individual formatted log entries back into structured logging information */
export class UnformatLogEntry extends TransformStream<
	string,
	UnformattedLogInfo
> {
	constructor() {
		const transformer: Transformer<string, UnformattedLogInfo> = {
			transform(chunk, controller) {
				const [firstLine, ...otherLines] = chunk.split("\n");
				const timestamp = firstLine.match(TIMESTAMP_REGEX)?.[0];
				if (!timestamp) return;
				let restOfFirstLine = firstLine.slice(timestamp.length).trim();

				// Find the log label, which is the first word after the timestamp
				const labelEndIndex = restOfFirstLine.indexOf(" ");
				if (labelEndIndex === -1) return;
				const label = restOfFirstLine.slice(0, labelEndIndex);
				restOfFirstLine = restOfFirstLine.slice(labelEndIndex + 1)
					.trim();

				// After the label, we expect optional direction indicator arrows
				let direction: DataDirection = "none";
				if (restOfFirstLine.startsWith("« ")) {
					direction = "inbound";
					restOfFirstLine = restOfFirstLine.slice(2).trim();
				} else if (restOfFirstLine.startsWith("» ")) {
					direction = "outbound";
					restOfFirstLine = restOfFirstLine.slice(2).trim();
				}

				// The first line may end with an optional secondary tag in parentheses
				const secondaryTags = restOfFirstLine.match(/\(([^)]+)\)$/)
					?.[1];
				if (secondaryTags) {
					restOfFirstLine = restOfFirstLine.slice(
						0,
						-secondaryTags.length - 2,
					).trim();
				}

				// The rest of the first line, and the unindented remaining lines are the message
				const indentation = timestamp.length + 1 + label.length + 3; // timestamp + label + direction arrows
				const message = [
					restOfFirstLine,
					...otherLines.map((line) => line.slice(indentation)),
				].join("\n");

				const info: UnformattedLogInfo = {
					timestamp,
					label,
					direction,
					message,
					...(secondaryTags ? { secondaryTags } : {}),
				};

				controller.enqueue(info);
			},
		};

		super(transformer);
	}
}

/** Filters logs that are not interesting for analysis */
export class FilterLogEntries extends TransformStream<
	UnformattedLogInfo,
	UnformattedLogInfo
> {
	constructor() {
		const transformer: Transformer<UnformattedLogInfo, UnformattedLogInfo> =
			{
				transform(chunk, controller) {
					if (
						chunk.label === "DRIVER"
						&& chunk.direction === "none"
						&& (
							chunk.message.endsWith("queues busy")
							|| chunk.message.endsWith("queues idle")
						)
					) {
						// {
						//   timestamp: '2025-08-01 14:17:53.989',
						//   label: 'DRIVER',
						//   direction: 'none',
						//   message: 'one or more queues busy'
						// }
						return;
					}

					if (
						chunk.label === "SERIAL"
					) {
						// The raw serial data is not interesting for automatic analysis
						return;
					}

					// Keep all other entries
					controller.enqueue(chunk);
				},
			};

		super(transformer);
	}
}
