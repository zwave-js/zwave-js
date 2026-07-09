import { type CommandClass, ccToLogPayload } from "@zwave-js/cc";
import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	type LogPayload,
	type MessageOrCCLogEntry,
	type MessageRecord,
	type RSSI,
	ZWaveLoggerBase,
	formatLogPayload,
	getDirectionPrefix,
	logText,
	rssiToString,
	tagify,
	toLogPayload,
	znifferProtocolDataRateToString,
} from "@zwave-js/core";
import type { ZnifferDataMessage } from "@zwave-js/serial";
import { buffer2hex, num2hex } from "@zwave-js/shared";
import type {
	BeamStop,
	LongRangeBeamStart,
	LongRangeMPDU,
	ZWaveBeamStart,
	ZWaveMPDU,
} from "../zniffer/MPDU.js";
import type { Zniffer } from "../zniffer/Zniffer.js";

export const ZNIFFER_LABEL = "ZNIFFR";
const ZNIFFER_LOGLEVEL = "info";

export interface ZnifferLogContext extends LogContext<"zniffer"> {
	direction?: DataDirection;
}

export class ZnifferLogger extends ZWaveLoggerBase<ZnifferLogContext> {
	constructor(
		private readonly zniffer: Zniffer,
		loggers: LogContainer,
	) {
		super(loggers, ZNIFFER_LABEL);
	}

	private isLogVisible(): boolean {
		return this.container.isLoglevelVisible(ZNIFFER_LOGLEVEL);
	}

	/**
	 * Logs a message
	 * @param msg The message to output
	 */
	public print(
		message: string | LogPayload | MessageRecord,
		level?: "debug" | "verbose" | "warn" | "error" | "info",
	): void {
		const actualLevel = level || ZNIFFER_LOGLEVEL;
		if (!this.container.isLoglevelVisible(actualLevel)) return;

		this.logger.log({
			level: actualLevel,
			message: typeof message === "string"
				? message
				: formatLogPayload(message),
			direction: getDirectionPrefix("none"),
			context: { source: "zniffer", direction: "none" },
		});
	}

	public crcError(
		frame: ZnifferDataMessage,
		rssi?: RSSI,
	): void {
		if (!this.isLogVisible()) return;

		const logEntry: MessageOrCCLogEntry = {
			tags: ["CRC ERROR"],
			message: {
				channel: frame.channel,
				"protocol/data rate": znifferProtocolDataRateToString(
					frame.protocolDataRate,
				),
				RSSI: rssi != undefined
					? rssiToString(rssi)
					: frame.rssiRaw.toString(),
				payload: buffer2hex(frame.payload),
			},
		};

		const msg = formatLogPayload(logText([], {
			tags: logEntry.tags,
			nested: toLogPayload(logEntry.message!),
		}));

		try {
			// If possible, include information about the CCs
			this.logger.log({
				level: "warn",
				message: msg,
				direction: getDirectionPrefix("inbound"),
				context: { source: "zniffer", direction: "inbound" },
			});
		} catch {}
	}

	public mpdu(
		mpdu: ZWaveMPDU | LongRangeMPDU,
		payloadCC?: CommandClass,
	): void {
		if (!this.isLogVisible()) return;

		const logEntry = mpdu.toLogEntry();

		const nested: LogPayload[] = [];
		if (logEntry.message) {
			let messagePayload = toLogPayload(logEntry.message);
			// The raw payload is superseded by the rendered CC tree
			if (payloadCC && messagePayload.type === "dict") {
				messagePayload = {
					...messagePayload,
					entries: messagePayload.entries.filter(
						([key]) => key !== "payload",
					),
				};
			}
			nested.push(messagePayload);
		}

		try {
			// If possible, include information about the CCs
			if (payloadCC) {
				nested.push(ccToLogPayload(payloadCC, this.zniffer as any));
			}

			const msg = formatLogPayload(
				logText([], { tags: logEntry.tags, nested }),
			);

			const homeId = mpdu.homeId.toString(16).padStart(8, "0")
				.toLowerCase();

			this.logger.log({
				level: ZNIFFER_LOGLEVEL,
				secondaryTags: tagify([homeId]),
				message: msg,
				direction: getDirectionPrefix("inbound"),
				context: { source: "zniffer", direction: "inbound" },
			});
		} catch {}
	}

	public beam(
		beam: ZWaveBeamStart | LongRangeBeamStart | BeamStop,
	): void {
		if (!this.isLogVisible()) return;

		const logEntry = beam.toLogEntry();

		const msg = formatLogPayload(logText([], {
			tags: logEntry.tags,
			nested: logEntry.message && toLogPayload(logEntry.message),
		}));

		try {
			// If possible, include information about the CCs
			let secondaryTags: string | undefined;
			if ("homeIdHash" in beam && beam.homeIdHash) {
				secondaryTags = tagify([`hash: ${num2hex(beam.homeIdHash)}`]);
			}

			this.logger.log({
				level: ZNIFFER_LOGLEVEL,
				secondaryTags,
				message: msg,
				direction: getDirectionPrefix("inbound"),
				context: { source: "zniffer", direction: "inbound" },
			});
		} catch {}
	}
}
