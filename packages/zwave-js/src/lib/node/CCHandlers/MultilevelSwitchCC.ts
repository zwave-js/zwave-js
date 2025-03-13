import {
	type MultilevelSwitchCC,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCStartLevelChange,
	MultilevelSwitchCCStopLevelChange,
	MultilevelSwitchCCValues,
	MultilevelSwitchCommand,
	type PersistValuesContext,
} from "@zwave-js/cc";
import { CommandClasses, type LogNode } from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

/** Handles the receipt of a MultilevelCC Set or Report */
export function handleMultilevelSwitchCommand(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: MultilevelSwitchCC,
): void {
	const endpoint = node.getEndpoint(command.endpointIndex ?? 0) ?? node;

	if (command instanceof MultilevelSwitchCCSet) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message: "treating MultiLevelSwitchCCSet::Set as a value event",
		});
		node.valueDB.setValue(
			MultilevelSwitchCCValues.compatEvent.endpoint(
				command.endpointIndex,
			),
			command.targetValue,
			{
				stateful: false,
			},
		);
	} else if (command instanceof MultilevelSwitchCCStartLevelChange) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message:
				"treating MultilevelSwitchCC::StartLevelChange as a notification",
		});
		node.emit(
			"notification",
			endpoint,
			CommandClasses["Multilevel Switch"],
			{
				eventType: MultilevelSwitchCommand.StartLevelChange,
				eventTypeLabel: "Start level change",
				direction: command.direction,
			},
		);
	} else if (command instanceof MultilevelSwitchCCStopLevelChange) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message:
				"treating MultilevelSwitchCC::StopLevelChange as a notification",
		});
		node.emit(
			"notification",
			endpoint,
			CommandClasses["Multilevel Switch"],
			{
				eventType: MultilevelSwitchCommand.StopLevelChange,
				eventTypeLabel: "Stop level change",
			},
		);
	}
}
