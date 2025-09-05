import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	type MPDU,
	type MPDULogContext,
	ZWaveLoggerBase,
	getDirectionPrefix,
	messageRecordToLines,
	tagify,
} from "@zwave-js/core";

export const PROTOCOL_LABEL = "PROTCL";
const MSG_LOGLEVEL = "info";
const MPDU_LOGLEVEL = "verbose";

export interface ProtocolLogContext extends LogContext<"protocol"> {
	direction?: DataDirection;
}

export class ProtocolLogger extends ZWaveLoggerBase<ProtocolLogContext> {
	constructor(
		// private readonly driver: RCPHost,
		loggers: LogContainer,
	) {
		super(loggers, PROTOCOL_LABEL);
	}

	private isProtocolLogVisible(): boolean {
		return this.container.isLoglevelVisible(PROTOCOL_LABEL);
	}

	private isMPDULogVisible(): boolean {
		return this.container.isLoglevelVisible(MPDU_LOGLEVEL);
	}

	/**
	 * Logs a message
	 * @param msg The message to output
	 */
	public print(
		message: string,
		level?: "debug" | "verbose" | "warn" | "error" | "info",
	): void {
		const actualLevel = level || MSG_LOGLEVEL;
		if (!this.container.isLoglevelVisible(actualLevel)) return;

		this.logger.log({
			level: actualLevel,
			message,
			direction: getDirectionPrefix("none"),
			context: { source: "protocol", direction: "none" },
		});
	}

	public mpdu(
		mpdu: MPDU,
		logContext: MPDULogContext,
		direction: DataDirection,
		// payloadCC?: CommandClass,
	): void {
		if (!this.isMPDULogVisible()) return;

		const hasPayload = false; // !!payloadCC || mpdu.payload.length > 0;
		const logEntry = mpdu.toLogEntry(logContext);

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
				level: MPDU_LOGLEVEL,
				secondaryTags: tagify([homeId]),
				message: msg,
				direction: getDirectionPrefix(direction),
				context: { source: "protocol", direction },
			});
		} catch {}
	}
}
