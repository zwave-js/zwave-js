import {
	type MultilevelSwitchCC,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCStartLevelChange,
	MultilevelSwitchCCStopLevelChange,
	MultilevelSwitchCCValues,
	MultilevelSwitchCommand,
	type PersistValuesContext,
	WindowCoveringCCValues,
} from "@zwave-js/cc";
import { CommandClasses, type LogNode } from "@zwave-js/core";
import type { ZWaveNode } from "../Node.js";

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
	} else if (command instanceof MultilevelSwitchCCReport) {
		// Handle MultilevelSwitchCCReport manually to enable mapping to Window Covering CC
		const supportsWindowCovering = endpoint.supportsCC(CommandClasses["Window Covering"]);
		
		if (supportsWindowCovering) {
			// Map MultilevelSwitch values to Window Covering CC values
			// Use parameter 1 ("Outbound Left") as the primary position parameter
			const windowCoveringParameter = 1;
			
			ctx.logNode(node.id, {
				endpoint: command.endpointIndex,
				message: "mapping MultilevelSwitchCCReport to Window Covering CC values",
			});

			if (command.currentValue !== undefined) {
				node.valueDB.setValue(
					WindowCoveringCCValues.currentValue(windowCoveringParameter).endpoint(
						command.endpointIndex,
					),
					command.currentValue,
				);
			}
			
			if (command.targetValue !== undefined) {
				node.valueDB.setValue(
					WindowCoveringCCValues.targetValue(windowCoveringParameter).endpoint(
						command.endpointIndex,
					),
					command.targetValue,
				);
			}
			
			if (command.duration !== undefined) {
				node.valueDB.setValue(
					WindowCoveringCCValues.duration(windowCoveringParameter).endpoint(
						command.endpointIndex,
					),
					command.duration,
				);
			}
		} else {
			// No Window Covering CC support - persist MultilevelSwitch values normally
			ctx.logNode(node.id, {
				endpoint: command.endpointIndex,
				message: "persisting MultilevelSwitchCCReport values normally",
			});
			command.persistMultilevelSwitchValues(ctx);
		}
	}
}
