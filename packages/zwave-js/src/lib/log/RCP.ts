import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	ZWaveLoggerBase,
	getDirectionPrefix,
	messageRecordToLines,
	tagify,
} from "@zwave-js/core";

import { type CommandClass } from "@zwave-js/cc";
import { type RCPHost } from "../rcp/RCPHost.js";
import { type LongRangeMPDU, type ZWaveMPDU } from "../zniffer/MPDU.js";

export const RCP_LABEL = "DRIVER";
const RCP_LOGLEVEL = "info";

export interface RCPLogContext extends LogContext<"rcp"> {
	direction?: DataDirection;
}

export class RCPLogger extends ZWaveLoggerBase<RCPLogContext> {
	constructor(
		private readonly driver: RCPHost,
		loggers: LogContainer,
	) {
		super(loggers, RCP_LABEL);
	}

	private isLogVisible(): boolean {
		return this.container.isLoglevelVisible(RCP_LOGLEVEL);
	}

	/**
	 * Logs a message
	 * @param msg The message to output
	 */
	public print(
		message: string,
		level?: "debug" | "verbose" | "warn" | "error" | "info",
	): void {
		const actualLevel = level || RCP_LOGLEVEL;
		if (!this.container.isLoglevelVisible(actualLevel)) return;

		this.logger.log({
			level: actualLevel,
			message,
			direction: getDirectionPrefix("none"),
			context: { source: "rcp", direction: "none" },
		});
	}

	public mpdu(
		mpdu: ZWaveMPDU | LongRangeMPDU,
		payloadCC?: CommandClass,
	): void {
		if (!this.isLogVisible()) return;

		const hasPayload = !!payloadCC || mpdu.payload.length > 0;
		const logEntry = mpdu.toLogEntry();

		const msg: string[] = [tagify(logEntry.tags)];
		if (logEntry.message) {
			msg.push(
				...messageRecordToLines(logEntry.message).map(
					(line) => (hasPayload ? "│ " : "  ") + line,
				),
			);
		}

		try {
			// // If possible, include information about the CCs
			// if (!!payloadCC) {
			// 	// Remove the default payload message and draw a bracket
			// 	msg = msg.filter((line) => !line.startsWith("│ payload:"));

			// 	const logCC = (cc: CommandClass, indent: number = 0) => {
			// 		const isEncapCC = isEncapsulatingCommandClass(cc)
			// 			|| isMultiEncapsulatingCommandClass(cc);
			// 		const loggedCC = cc.toLogEntry(this.zniffer as any);
			// 		msg.push(
			// 			" ".repeat(indent * 2) + "└─" + tagify(loggedCC.tags),
			// 		);

			// 		indent++;
			// 		if (loggedCC.message) {
			// 			msg.push(
			// 				...messageRecordToLines(loggedCC.message).map(
			// 					(line) =>
			// 						`${" ".repeat(indent * 2)}${
			// 							isEncapCC ? "│ " : "  "
			// 						}${line}`,
			// 				),
			// 			);
			// 		}
			// 		// If this is an encap CC, continue
			// 		if (isEncapsulatingCommandClass(cc)) {
			// 			logCC(cc.encapsulated, indent);
			// 		} else if (isMultiEncapsulatingCommandClass(cc)) {
			// 			for (const encap of cc.encapsulated) {
			// 				logCC(encap, indent);
			// 			}
			// 		}
			// 	};

			// 	logCC(payloadCC);
			// }

			const homeId = mpdu.homeId.toString(16).padStart(8, "0")
				.toLowerCase();

			this.logger.log({
				level: RCP_LOGLEVEL,
				secondaryTags: tagify([homeId]),
				message: msg,
				direction: getDirectionPrefix("inbound"),
				context: { source: "rcp", direction: "inbound" },
			});
		} catch {}
	}
}
