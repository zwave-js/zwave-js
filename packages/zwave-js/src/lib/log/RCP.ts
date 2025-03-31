import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	ZWaveLoggerBase,
	getDirectionPrefix,
} from "@zwave-js/core";

import { type RCPHost } from "../rcp/RCPHost.js";

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
}
