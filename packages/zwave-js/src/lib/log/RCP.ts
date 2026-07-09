import {
	type DataDirection,
	type LogContainer,
	type LogContext,
	ZWaveLoggerBase,
	getDirectionPrefix,
	messageRecordToLines,
	tagify,
} from "@zwave-js/core";
import type { RCPMessage } from "@zwave-js/serial";
import type { RCPHost } from "../rcp/RCPHost.js";

export const RCP_LABEL = "DRIVER";
const MSG_LOGLEVEL = "info";
const RCP_LOGLEVEL = "debug";

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
			// Used to relate this log message to a node
			// nodeId,
			secondaryTags,
			direction = "none",
		}: {
			// nodeId?: number;
			secondaryTags?: string[];
			direction?: DataDirection;
		} = {},
	): void {
		if (!this.isRCPLogVisible()) return;
		// if (nodeId == undefined) nodeId = message.getNodeId();
		// if (
		// 	nodeId != undefined && !this.container.isNodeLoggingVisible(nodeId)
		// ) {
		// 	return;
		// }

		const isCCContainer = false; // containsCC(message);
		const logEntry = message.toLogEntry();

		const msg: string[] = [tagify(logEntry.tags)];
		if (logEntry.message) {
			msg.push(
				...messageRecordToLines(logEntry.message).map(
					(line) => (isCCContainer ? "│ " : "  ") + line,
				),
			);
		}

		try {
			// If possible, include information about the CCs
			// if (isCCContainer) {
			// 	// Remove the default payload message and draw a bracket
			// 	msg = msg.filter((line) => !line.startsWith("│ payload:"));

			// 	const logCC = (cc: CommandClass, indent: number = 0) => {
			// 		const isEncapCC = isEncapsulatingCommandClass(cc)
			// 			|| isMultiEncapsulatingCommandClass(cc);
			// 		const loggedCC = cc.toLogEntry(this.driver);
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

			// 	logCC(message.command);
			// }

			this.logger.log({
				level: RCP_LOGLEVEL,
				secondaryTags: secondaryTags && secondaryTags.length > 0
					? tagify(secondaryTags)
					: undefined,
				message: msg,
				// Since we are programming a controller, responses are always inbound
				// (not to confuse with the message type, which may be Request or Response)
				direction: getDirectionPrefix(direction),
				context: { source: "rcp", direction },
			});
		} catch {}
	}
}
