import type { LogNode } from "@zwave-js/core";
import { getErrorMessage } from "@zwave-js/shared";

export const MAX_ASSOCIATIONS = 1;

/** Logs an error that occurred while responding to a command from a node */
export function logCommandHandlerError(
	ctx: LogNode,
	nodeId: number,
	e: unknown,
): void {
	ctx.logNode(nodeId, {
		message: `Error handling command from node: ${getErrorMessage(e)}`,
		level: "error",
	});
}
