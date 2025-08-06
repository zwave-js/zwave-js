import type { DataDirection } from "@zwave-js/core";
import type { Transformer } from "node:stream/web";

const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/;

export type UnformattedLogInfo = {
	timestamp: string;
	label: string;
	direction: DataDirection;
	primaryTags?: string[];
	message: string | LogInfoPayload;
	secondaryTags?: string;
};

export type LogInfoPayload = {
	message: string;
	attributes?: Record<string, string | number | boolean>;
	nested?: LogInfoPayload;
};

export enum SemanticLogKind {
	IncomingCommand = "INCOMING_COMMAND",
	SendDataRequest = "SEND_DATA_REQUEST",
	SendDataResponse = "SEND_DATA_RESPONSE",
	SendDataCallback = "SEND_DATA_CALLBACK",
	Request = "REQUEST",
	Response = "RESPONSE",
	Callback = "CALLBACK",
	Other = "OTHER",
}

export type SemanticLogInfo =
	& {
		timestamp: string;
	}
	& (
		| {
			kind: SemanticLogKind.IncomingCommand;
			nodeId: number;
			rssi?: string;
			payload: LogInfoPayload;
		}
		| {
			kind: SemanticLogKind.SendDataRequest;
			nodeId: number;
			transmitOptions: string;
			callbackId: number;
			payload: LogInfoPayload;
		}
		| {
			kind: SemanticLogKind.SendDataResponse;
			success: boolean;
		}
		| {
			kind: SemanticLogKind.SendDataCallback;
			callbackId: number;
			attributes: Record<string, string | number | boolean>;
		}
		// Used for all log entries where we know the general kind, but not what it is
		| ({
			kind:
				| SemanticLogKind.Request
				| SemanticLogKind.Response
				| SemanticLogKind.Callback;
		} & Omit<UnformattedLogInfo, "label">)
		// Used for all log entries that have not been classified
		| ({
			kind: SemanticLogKind.Other;
		} & UnformattedLogInfo)
	);

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

				// The first line may start with several primary tags, which are surrounded by square brackets
				// and separated by spaces
				const primaryTags: string[] = [];
				const tagRegex = /^\[([^\]]+)\]\s?/;
				let match: RegExpExecArray | null;
				while ((match = tagRegex.exec(restOfFirstLine)) !== null) {
					primaryTags.push(match[1]);
					restOfFirstLine = restOfFirstLine.slice(match[0].length);
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

				// We don't want to treat the last/only tag as a primary tag, though, e.g.:
				// [ACK]
				// [Node 257] [REQ] [BridgeApplicationCommand]
				if (primaryTags.length > 0 && !restOfFirstLine) {
					restOfFirstLine = `[${primaryTags.pop()}]`;
				}

				// The rest of the first line, and the unindented remaining lines are the message
				const indentation = timestamp.length + 1 + label.length + 3; // timestamp + label + direction arrows
				const message = [
					restOfFirstLine,
					...otherLines.map((line) => line.slice(indentation)),
				]
					.filter((line) => line.length > 0)
					.join("\n");

				const info: UnformattedLogInfo = {
					timestamp,
					label,
					direction,
					message,
					...(primaryTags?.length ? { primaryTags } : {}),
					...(secondaryTags ? { secondaryTags } : {}),
				};

				controller.enqueue(info);
			},
		};

		super(transformer);
	}
}

/** Parses (nested) structures from log entrie */
export class ParseNestedStructures extends TransformStream<
	UnformattedLogInfo,
	UnformattedLogInfo
> {
	constructor() {
		function parseNestedStructure(
			lines: string[],
		): LogInfoPayload | undefined {
			// Nested structures have a recursive definition.
			// The initial line is always in square brackets

			if (
				lines.length < 1
				|| !lines[0].startsWith("[")
				|| !lines[0].endsWith("]")
			) {
				// Not a nested structure
				return;
			}

			const message = lines.shift()!;
			// Attributes are always in their own line, starting with two spaces
			// or "│ ". In some cases, they are too long to fit the rest of the line
			// and mess up the indentation, so we always search for the next indentation
			// indicator.
			const attributesRaw: string[] = [];
			let nested: LogInfoPayload | undefined;

			while (lines.length > 0) {
				const line = lines.shift()!;
				if (line.startsWith("  ") || line.startsWith("│ ")) {
					// This is an attribute line
					attributesRaw.push(line.slice(2));
				} else if (line.startsWith("└─")) {
					// This marks the beginning of a new nested structure
					const unindented = [line, ...lines].map((l) => l.slice(2));
					nested = parseNestedStructure(unindented);
					break;
				} else if (attributesRaw.length > 0) {
					// This is a continuation of the last attribute line
					attributesRaw[attributesRaw.length - 1] += line;
				}
			}

			// FIXME:
			// parse lists
			// 1)
			// │ extensions:
			// │ · type: SPAN  sender EI: 0x68261583f3da6dc8149c8334def0cca4
			//
			// 2)
			// └─[AssociationGroupInfoCCCommandListReport]
			//     group id: 1
			//     commands:
			//     · Clock: 0x06
			//     · Meter: 0x02
			//     · Thermostat Setpoint: 0x03
			//     · Thermostat Operating State: 0x03
			//     · Thermostat Mode: 0x03
			//     · Thermostat Fan Mode: 0x03
			//     · Thermostat Fan State: 0x03
			//     · Multilevel Sensor: 0x05
			//     · Device Reset Locally: 0x01
			//     · Indicator: 0x03
			//
			// 3)
			// └─[AssociationGroupInfoCCInfoReport]
			//     is list mode:     false
			//     has dynamic info: false
			//     groups:
			//     · Group #6
			//       mode:       0
			//       profile:    8197
			//       event code: 0

			const attributes = Object.fromEntries(
				attributesRaw.map((attr) => {
					const colonIndex = attr.indexOf(":");
					if (colonIndex === -1) {
						// No colon found, treat the whole line as a key
						return [attr.trim(), ""];
					}

					const key = attr.slice(0, colonIndex).trim();
					const rawValue = attr.slice(colonIndex + 1).trim();

					// Parse the value into a number, or boolean where applicable
					let value: string | number | boolean = rawValue;
					if (/^\d+$/.test(rawValue)) {
						value = parseInt(rawValue, 10);
					} else if (/^(true|false)$/.test(rawValue)) {
						value = rawValue === "true";
					}
					return [key, value];
				}),
			);

			const ret: LogInfoPayload = {
				message,
			};
			if (attributesRaw.length > 0) {
				ret.attributes = attributes;
			}
			if (nested) {
				ret.nested = nested;
			}

			return ret;
		}

		const transformer: Transformer<UnformattedLogInfo, UnformattedLogInfo> =
			{
				transform(chunk, controller) {
					// Nested structures only appear for Serial API commands,
					// which are indicated by a multiline message
					// with the first line in square brackets
					if (
						typeof chunk.message !== "string"
						|| !chunk.message.includes("\n")
					) {
						controller.enqueue(chunk);
						return;
					}

					const lines = chunk.message.split("\n");
					if (
						lines.length < 2
						|| !lines[0].startsWith("[")
						|| !lines[0].endsWith("]")
					) {
						controller.enqueue(chunk);
						return;
					}

					const nested = parseNestedStructure(lines);
					if (nested) {
						chunk.message = nested;
					}

					controller.enqueue(chunk);
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
						&& typeof chunk.message === "string"
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

					// Ignore SILLY level logs
					if (
						chunk.label === "CNTRLR"
						&& ((
							typeof chunk.message === "string"
							&& chunk.message.includes("translateValueEvent:")
						)
							|| chunk.primaryTags?.some((tag) =>
								tag.includes("translateValueEvent")
							))
					) {
						return;
					}
					if (
						chunk.label === "CNTRLR"
						&& chunk.primaryTags?.includes("setValue")
					) {
						return;
					}

					// Keep all other entries
					controller.enqueue(chunk);
				},
			};

		super(transformer);
	}
}

/** Assigns semantic meaning to log entries */
export class ClassifyLogEntry extends TransformStream<
	UnformattedLogInfo,
	SemanticLogInfo
> {
	constructor() {
		function extractAttribute<T extends string | number | boolean>(
			info: LogInfoPayload,
			key: string,
		): T | undefined {
			if (info.attributes && key in info.attributes) {
				let ret = info.attributes[key] as T | undefined;
				if (
					typeof ret !== "string"
					&& typeof ret !== "number"
					&& typeof ret !== "boolean"
				) {
					ret = undefined;
				}
				delete info.attributes[key];
				if (Object.keys(info.attributes).length === 0) {
					delete info.attributes;
				}
				return ret;
			}
			return undefined;
		}

		const transformer: Transformer<UnformattedLogInfo, SemanticLogInfo> = {
			transform(chunk, controller) {
				// Find incoming commands
				if (
					chunk.label === "DRIVER"
					&& chunk.direction === "inbound"
					&& chunk.primaryTags?.includes("REQ")
					&& chunk.primaryTags.some((t) => t.startsWith("Node "))
					&& typeof chunk.message !== "string"
					&& chunk.message.message.endsWith("ApplicationCommand]")
					&& chunk.message.nested
				) {
					// {
					//   timestamp: '2025-08-01 14:17:53.987',
					//   label: 'DRIVER',
					//   direction: 'inbound',
					//   message: {
					//     message: '[BridgeApplicationCommand]',
					//     attributes: { RSSI: '-108 dBm' },
					//     nested: {
					//       message: '[Security2CCNonceGet]',
					//       attributes: { 'sequence number': 93 }
					//     }
					//   },
					//   primaryTags: [ 'Node 257', 'REQ' ]
					// }

					const nodeId = parseInt(
						chunk.primaryTags.find((t) => t.startsWith("Node "))!
							.slice(5),
						10,
					);
					const rssi = extractAttribute<string>(
						chunk.message,
						"RSSI",
					);

					controller.enqueue({
						kind: SemanticLogKind.IncomingCommand,
						timestamp: chunk.timestamp,
						nodeId,
						rssi,
						payload: chunk.message.nested,
					});
					return;
				}

				if (
					chunk.label === "DRIVER"
					&& chunk.direction === "outbound"
					&& chunk.primaryTags?.includes("REQ")
					&& chunk.primaryTags.some((t) => t.startsWith("Node "))
					&& typeof chunk.message !== "string"
					&& chunk.message.message.startsWith("[SendData")
					&& chunk.message.nested
				) {
					//   timestamp: '2025-08-01 14:17:53.991',
					//   label: 'DRIVER',
					//   direction: 'outbound',
					//   message: {
					//     message: '[SendDataBridge]',
					//     attributes: {
					//       'source node id': 1,
					//       'transmit options': '0x05',
					//       'callback id': 81
					//     },
					//     nested: {
					//       message: '[Security2CCNonceReport]',
					//       attributes: {
					//         'sequence number': 95,
					//         SOS: true,
					//         MOS: false,
					//         'receiver entropy': '0xf2f72b832d33ff0d0eccd73c75296f4e'
					//       }
					//     }
					//   },
					//   primaryTags: [ 'Node 257', 'REQ' ]

					const nodeId = parseInt(
						chunk.primaryTags.find((t) => t.startsWith("Node "))!
							.slice(5),
						10,
					);
					const transmitOptions = extractAttribute<string>(
						chunk.message,
						"transmit options",
					);
					const callbackId = extractAttribute<number>(
						chunk.message,
						"callback id",
					);
					// ignore source node ID, as it is always the controller
					extractAttribute<number>(chunk.message, "source node id");

					if (callbackId == undefined) {
						console.warn(
							"Found SendData request without callback ID at ",
							chunk.timestamp,
						);
					}

					controller.enqueue({
						kind: SemanticLogKind.SendDataRequest,
						timestamp: chunk.timestamp,
						nodeId,
						transmitOptions: transmitOptions!,
						callbackId: callbackId!,
						payload: chunk.message.nested,
					});
					return;
				}

				if (
					chunk.label === "DRIVER"
					&& chunk.direction === "inbound"
					&& chunk.primaryTags?.includes("RES")
					&& typeof chunk.message !== "string"
					&& chunk.message.message.startsWith("[SendData")
				) {
					// {
					//   timestamp: '2025-08-01 14:17:54.004',
					//   label: 'DRIVER',
					//   direction: 'inbound',
					//   message: { message: '[SendDataBridge]', attributes: { 'was sent': true } },
					//   primaryTags: [ 'RES' ]
					// }

					const success = !!extractAttribute<boolean>(
						chunk.message,
						"was sent",
					);

					controller.enqueue({
						kind: SemanticLogKind.SendDataResponse,
						timestamp: chunk.timestamp,
						success,
					});
					return;
				}

				if (
					chunk.label === "DRIVER"
					&& chunk.direction === "inbound"
					&& chunk.primaryTags?.includes("REQ")
					&& typeof chunk.message !== "string"
					&& chunk.message.message.startsWith("[SendData")
				) {
					// {
					//   timestamp: '2025-08-01 14:17:54.019',
					//   label: 'DRIVER',
					//   direction: 'inbound',
					//   message: {
					//     message: '[SendDataBridge]',
					//     attributes: {
					//       'callback id': 81,
					//       'transmit status': 'OK, took 10 ms',
					//       'routing attempts': 1,
					//       'protocol & route speed': 'Z-Wave Long Range, 100 kbit/s',
					//       'routing scheme': 'Resort to Direct',
					//       'ACK RSSI': '-105 dBm',
					//       'ACK channel no.': 3,
					//       'TX channel no.': 3,
					//       'TX power': '14 dBm',
					//       'measured noise floor': '-101 dBm',
					//       'ACK TX power by destination': '14 dBm',
					//       'measured RSSI of ACK from destination': '-99 dBm',
					//       'measured noise floor by destination': '-99 dBm'
					//     }
					//   },
					//   primaryTags: [ 'REQ' ]
					// }

					const callbackId = extractAttribute<number>(
						chunk.message,
						"callback id",
					);
					if (callbackId == undefined) {
						console.warn(
							"Found SendData callback without callback ID at ",
							chunk.timestamp,
						);
					}

					controller.enqueue({
						kind: SemanticLogKind.SendDataCallback,
						timestamp: chunk.timestamp,
						callbackId: callbackId!,
						attributes: chunk.message.attributes ?? {},
					});
					return;
				}

				// Classify unspecified requests/responses/callbacks
				if (
					chunk.label === "DRIVER"
					&& chunk.direction !== "none"
					&& chunk.primaryTags?.length
				) {
					let classified: SemanticLogInfo | undefined;
					if (
						chunk.direction === "outbound"
						&& chunk.primaryTags.includes("REQ")
					) {
						// This is a request
						classified = {
							kind: SemanticLogKind.Request,
							...chunk,
						};
					} else if (
						chunk.direction === "inbound"
						&& chunk.primaryTags.includes("RES")
					) {
						// This is a response
						classified = {
							kind: SemanticLogKind.Response,
							...chunk,
						};
					} else if (
						chunk.direction === "inbound"
						&& chunk.primaryTags.includes("REQ")
					) {
						// This is a callback
						classified = {
							kind: SemanticLogKind.Callback,
							...chunk,
						};
					}

					if (classified) {
						const stopWorryingTypeScript = classified as any;

						delete stopWorryingTypeScript.label;
						stopWorryingTypeScript.primaryTags =
							stopWorryingTypeScript.primaryTags?.filter(
								(tag: string) => tag !== "REQ" && tag !== "RES",
							);
						if (stopWorryingTypeScript.primaryTags.length === 0) {
							delete stopWorryingTypeScript.primaryTags;
						}

						controller.enqueue(classified);
						return;
					}
				}

				// Treat all other entries as "other"

				controller.enqueue({
					kind: SemanticLogKind.Other,
					...chunk,
				});
			},
		};

		super(transformer);
	}
}
