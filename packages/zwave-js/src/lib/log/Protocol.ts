import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	type LogPayload,
	type MPDU,
	type MPDULogContext,
	ZWaveLoggerBase,
	formatLogPayload,
	getDirectionPrefix,
	logText,
	tagify,
	toLogPayload,
} from "@zwave-js/core";

export const PROTOCOL_LABEL = "PROTCL";
const MSG_LOGLEVEL = "info";
const MPDU_LOGLEVEL = "verbose";

export interface ProtocolLogContext extends LogContext<"protocol"> {
	direction?: DataDirection;
}

export class ProtocolLogger extends ZWaveLoggerBase<ProtocolLogContext> {
	constructor(
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
	): void {
		if (!this.isMPDULogVisible()) return;

		const logEntry = mpdu.toLogEntry(logContext);

		const nested: LogPayload[] = [];
		if (logEntry.message) {
			nested.push(toLogPayload(logEntry.message));
		}

		try {
			const msg = formatLogPayload(
				logText([], { tags: logEntry.tags, nested }),
			);

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
