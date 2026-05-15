import {
	type LogContainer,
	type LogContext,
	ZWaveLoggerBase,
	getDirectionPrefix,
} from "@zwave-js/core";

export const CONFIG_LABEL = "CONFIG";
export const CONFIG_LOGLEVEL = "debug";

export type ConfigLogContext = LogContext<"config">;

export class ConfigLogger extends ZWaveLoggerBase<ConfigLogContext> {
	constructor(loggers: LogContainer) {
		super(loggers, CONFIG_LABEL);
	}

	/**
	 * Logs a message
	 * @param msg The message to output
	 */
	public print(
		message: string,
		level?: "debug" | "verbose" | "warn" | "error" | "info",
	): void {
		const actualLevel = level || CONFIG_LOGLEVEL;
		if (!this.container.isLoglevelVisible(actualLevel)) return;

		this.logger.log({
			level: actualLevel,
			message,
			direction: getDirectionPrefix("none"),
			context: { source: "config" },
		});
	}
}
