import {
	type CommandClass,
	isEncapsulatingCommandClass,
	isMultiEncapsulatingCommandClass,
} from "@zwave-js/cc";
import {
	type DataDirection,
	type LogContext,
	type ZWaveLogContainer,
	ZWaveLoggerBase,
	getDirectionPrefix,
	messageRecordToLines,
	tagify,
} from "@zwave-js/core";
import { padStart } from "alcalzone-shared/strings";
import { type LongRangeMPDU, type ZWaveMPDU } from "../zniffer/MPDU";
import { type Zniffer } from "../zniffer/Zniffer";

export const ZNIFFER_LABEL = "ZNIFFR";
const ZNIFFER_LOGLEVEL = "info";

export interface ZnifferLogContext extends LogContext<"zniffer"> {
	direction?: DataDirection;
}

export class ZnifferLogger extends ZWaveLoggerBase<ZnifferLogContext> {
	constructor(private readonly zniffer: Zniffer, loggers: ZWaveLogContainer) {
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
		message: string,
		level?: "debug" | "verbose" | "warn" | "error" | "info",
	): void {
		const actualLevel = level || ZNIFFER_LOGLEVEL;
		if (!this.container.isLoglevelVisible(actualLevel)) return;

		this.logger.log({
			level: actualLevel,
			message,
			direction: getDirectionPrefix("none"),
			context: { source: "zniffer", direction: "none" },
		});
	}

	public mpdu(
		mpdu: ZWaveMPDU | LongRangeMPDU,
		payloadCC?: CommandClass,
	): void {
		if (!this.isLogVisible()) return;

		const hasPayload = !!payloadCC || mpdu.payload.length > 0;
		const logEntry = mpdu.toLogEntry();

		let msg: string[] = [tagify(logEntry.tags)];
		if (logEntry.message) {
			msg.push(
				...messageRecordToLines(logEntry.message).map(
					(line) => (hasPayload ? "│ " : "  ") + line,
				),
			);
		}

		try {
			// If possible, include information about the CCs
			if (!!payloadCC) {
				// Remove the default payload message and draw a bracket
				msg = msg.filter((line) => !line.startsWith("│ payload:"));

				const logCC = (cc: CommandClass, indent: number = 0) => {
					const isEncapCC = isEncapsulatingCommandClass(cc)
						|| isMultiEncapsulatingCommandClass(cc);
					const loggedCC = cc.toLogEntry(this.zniffer as any);
					msg.push(
						" ".repeat(indent * 2) + "└─" + tagify(loggedCC.tags),
					);

					indent++;
					if (loggedCC.message) {
						msg.push(
							...messageRecordToLines(loggedCC.message).map(
								(line) =>
									`${" ".repeat(indent * 2)}${
										isEncapCC ? "│ " : "  "
									}${line}`,
							),
						);
					}
					// If this is an encap CC, continue
					if (isEncapsulatingCommandClass(cc)) {
						logCC(cc.encapsulated, indent);
					} else if (isMultiEncapsulatingCommandClass(cc)) {
						for (const encap of cc.encapsulated) {
							logCC(encap, indent);
						}
					}
				};

				logCC(payloadCC);
			}

			const homeId = padStart(mpdu.homeId.toString(16), 8, "0")
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
}
