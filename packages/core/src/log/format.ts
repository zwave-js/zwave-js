import { MESSAGE } from "triple-beam";
import { formatDate } from "../util/date.js";
import {
	CONTROL_CHAR_WIDTH,
	LOG_WIDTH,
	type ZWaveLogInfo,
	calculateFirstLineLength,
	channelPadding,
	directionPrefixPadding,
	messageFitsIntoOneLine,
	messageRecordToLines,
	messageToLines,
	tagify,
	timestampPadding,
	timestampPaddingShort,
} from "./shared.js";

export interface LogFormat {
	transform: (info: ZWaveLogInfo) => ZWaveLogInfo;
}

export function combine(...formats: LogFormat[]): LogFormat {
	return {
		transform: (info) => {
			for (const format of formats) {
				info = format.transform(info);
			}
			return info;
		},
	};
}

export function label(label: string): LogFormat {
	return {
		transform: (info) => {
			info.label = label;
			return info;
		},
	};
}

export function timestamp(format?: string): LogFormat {
	return {
		transform: (info) => {
			if (format) {
				info.timestamp = formatDate(new Date(), format);
			} else {
				info.timestamp = new Date().toISOString();
			}
			return info;
		},
	};
}

/** Formats the log message and calculates the necessary paddings */
export const formatLogMessage: LogFormat = {
	transform: (info: ZWaveLogInfo) => {
		const messageLines = messageToLines(info.message);
		const firstMessageLineLength = messageLines[0].length;
		info.multiline = messageLines.length > 1
			|| !messageFitsIntoOneLine(info, info.message.length);
		// Align postfixes to the right
		if (info.secondaryTags) {
			// Calculate how many spaces are needed to right-align the postfix
			// Subtract 1 because the parts are joined by spaces
			info.secondaryTagPadding = Math.max(
				// -1 has the special meaning that we don't print any padding,
				// because the message takes all the available space
				-1,
				LOG_WIDTH
					- 1
					- calculateFirstLineLength(info, firstMessageLineLength),
			);
		}

		if (info.multiline) {
			// Break long messages into multiple lines
			const lines: string[] = [];
			let isFirstLine = true;
			for (let message of messageLines) {
				while (message.length) {
					const cut = Math.min(
						message.length,
						isFirstLine
							? LOG_WIDTH - calculateFirstLineLength(info, 0) - 1
							: LOG_WIDTH - CONTROL_CHAR_WIDTH,
					);
					isFirstLine = false;
					lines.push(message.slice(0, cut));
					message = message.slice(cut);
				}
			}
			info.message = lines.join("\n");
		}
		return info;
	},
};

/** Prints a formatted and colorized log message */
export function printLogMessage(shortTimestamps: boolean): LogFormat {
	return {
		transform: (info: ZWaveLogInfo) => {
			// The formatter has already split the message into multiple lines
			const messageLines = messageToLines(info.message);
			// Also this can only happen if the user forgot to call the formatter first
			if (info.secondaryTagPadding == undefined) {
				info.secondaryTagPadding = -1;
			}
			// Format the first message line
			let firstLine = [
				info.primaryTags,
				messageLines[0],
				info.secondaryTagPadding < 0
					? undefined
					: " ".repeat(info.secondaryTagPadding),
				// If the secondary tag padding is zero, the previous segment gets
				// filtered out and we have one less space than necessary
				info.secondaryTagPadding === 0 && info.secondaryTags
					? " " + info.secondaryTags
					: info.secondaryTags,
			]
				.filter((item) => !!item)
				.join(" ");
			// The directional arrows and the optional grouping lines must be prepended
			// without adding spaces
			firstLine =
				`${info.timestamp} ${info.label} ${info.direction}${firstLine}`;
			const lines = [firstLine];
			if (info.multiline) {
				// Format all message lines but the first
				lines.push(
					...messageLines.slice(1).map(
						(line) =>
							// Skip the columns for the timestamp and the channel name
							(shortTimestamps
								? timestampPaddingShort
								: timestampPadding)
							+ channelPadding
							// Skip the columns for directional arrows
							+ directionPrefixPadding
							+ line,
					),
				);
			}
			info[MESSAGE as any] = lines.join("\n");
			return info;
		},
	};
}

export type SerialMessageFormatterMode = "human-readable" | "json";

/**
 * Formats serial message hierarchy for human-readable or JSON output.
 * This formatter should be applied BEFORE formatLogMessage.
 */
export function formatSerialMessage(
	mode: SerialMessageFormatterMode,
	driver?: any,
): LogFormat {
	return {
		transform: (info: ZWaveLogInfo) => {
			// Only process messages that have serial message data
			if (!info.serialMessage) {
				return info;
			}

			const { logEntry, isCCContainer, command } = info.serialMessage;

			if (mode === "json") {
				// In JSON mode, stringify the log entry
				info.message = JSON.stringify(logEntry);
			} else {
				// In human-readable mode, render the entire command tree
				let msg = [tagify(logEntry.tags)];

				if (logEntry.message) {
					msg.push(
						...messageRecordToLines(logEntry.message).map(
							(line) => (isCCContainer ? "│ " : "  ") + line,
						),
					);
				}

				try {
					// If possible, include information about the CCs
					if (isCCContainer && command) {
						// Remove the default payload message and draw a bracket
						msg = msg.filter(
							(line) => !line.startsWith("│ payload:"),
						);

						// We need to check if the command has encapsulation methods
						// without importing from @zwave-js/cc to avoid circular dependencies
						const logCC = (
							cc: any,
							indent: number = 0,
						) => {
							const isEncapCC = typeof cc.encapsulated !==
									"undefined"
								|| (Array.isArray(cc.encapsulated)
									&& cc.encapsulated.length > 0);
							const loggedCC = cc.toLogEntry?.(driver) || {
								tags: [],
								message: {},
							};
							msg.push(
								" ".repeat(indent * 2)
									+ "└─"
									+ tagify(loggedCC.tags),
							);

							indent++;
							if (loggedCC.message) {
								msg.push(
									...messageRecordToLines(loggedCC.message)
										.map(
											(line) =>
												`${" ".repeat(indent * 2)}${
													isEncapCC ? "│ " : "  "
												}${line}`,
										),
								);
							}
							// If this is an encap CC, continue
							if (
								cc.encapsulated
								&& !Array.isArray(cc.encapsulated)
							) {
								logCC(cc.encapsulated, indent);
							} else if (Array.isArray(cc.encapsulated)) {
								for (const encap of cc.encapsulated) {
									logCC(encap, indent);
								}
							}
						};

						logCC(command);
					}
				} catch {
					// Ignore errors during CC logging
				}

				info.message = msg;
			}

			// Clean up the raw data after processing
			delete info.serialMessage;

			return info;
		},
	};
}
