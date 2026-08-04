import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	type LogPayload,
	ZWaveLoggerBase,
	formatLogPayload,
	getDirectionPrefix,
	logText,
	tagify,
	toLogPayload,
} from "@zwave-js/core";
import type { RCPMessage } from "@zwave-js/serial";

export const RCP_LABEL = "DRIVER";
const MSG_LOGLEVEL = "info";
const RCP_LOGLEVEL = "debug";

export interface RCPLogContext extends LogContext<"rcp"> {
	direction?: DataDirection;
}

export class RCPLogger extends ZWaveLoggerBase<RCPLogContext> {
	constructor(
		loggers: LogContainer,
	) {
		super(loggers, RCP_LABEL);
	}

	private isRCPLogVisible(): boolean {
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
		const actualLevel = level || MSG_LOGLEVEL;
		if (!this.container.isLoglevelVisible(actualLevel)) return;

		this.logger.log({
			level: actualLevel,
			message,
			direction: getDirectionPrefix("none"),
			context: { source: "rcp", direction: "none" },
		});
	}

	public logMessage(
		message: RCPMessage,
		{
			secondaryTags,
			direction = "none",
		}: {
			secondaryTags?: string[];
			direction?: DataDirection;
		} = {},
	): void {
		if (!this.isRCPLogVisible()) return;

		const logEntry = message.toLogEntry();

		const nested: LogPayload[] = [];
		if (logEntry.message) {
			nested.push(toLogPayload(logEntry.message));
		}

		try {
			const msg = formatLogPayload(
				logText([], { tags: logEntry.tags, nested }),
			);

			this.logger.log({
				level: RCP_LOGLEVEL,
				secondaryTags: secondaryTags && secondaryTags.length > 0
					? tagify(secondaryTags)
					: undefined,
				message: msg,
				direction: getDirectionPrefix(direction),
				context: { source: "rcp", direction },
			});
		} catch {}
	}
}
