import {
	type BasicWindowCoveringCC,
	BasicWindowCoveringCCStartLevelChange,
	BasicWindowCoveringCCStopLevelChange,
	BasicWindowCoveringCommand,
} from "@zwave-js/cc";
import { CommandClasses, type LogNode } from "@zwave-js/core";

import type { ZWaveNode } from "../Node.js";

/** Handles the receipt of a Basic Window Covering Start or Stop Level Change */
export function handleBasicWindowCoveringCommand(
	ctx: LogNode,
	node: ZWaveNode,
	command: BasicWindowCoveringCC,
): void {
	const endpoint = node.getEndpoint(command.endpointIndex ?? 0) ?? node;

	if (command instanceof BasicWindowCoveringCCStartLevelChange) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message:
				"treating BasicWindowCoveringCC::StartLevelChange as a notification",
		});
		node.emit(
			"notification",
			endpoint,
			CommandClasses["Basic Window Covering"],
			{
				eventType: BasicWindowCoveringCommand.StartLevelChange,
				eventTypeLabel: "Start level change",
				direction: command.direction,
			},
		);
	} else if (command instanceof BasicWindowCoveringCCStopLevelChange) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message:
				"treating BasicWindowCoveringCC::StopLevelChange as a notification",
		});
		node.emit(
			"notification",
			endpoint,
			CommandClasses["Basic Window Covering"],
			{
				eventType: BasicWindowCoveringCommand.StopLevelChange,
				eventTypeLabel: "Stop level change",
			},
		);
	}
}
