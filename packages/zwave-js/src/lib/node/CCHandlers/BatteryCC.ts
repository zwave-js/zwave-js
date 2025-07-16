import {
	type BatteryCCReport,
	BatteryReplacementStatus,
	type PersistValuesContext,
} from "@zwave-js/cc";
import { CommandClasses, type LogNode } from "@zwave-js/core";
import type { ZWaveNode } from "../Node.js";

/** Handles the receipt of a BatteryCCReport */
export function handleBatteryReport(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: BatteryCCReport,
): void {
	const endpoint = node.getEndpoint(command.endpointIndex ?? 0) ?? node;

	if (command.level === 0xff) {
		// Low battery, treat it as a notification
		node.emit(
			"notification",
			endpoint,
			CommandClasses.Battery,
			{
				eventType: "battery low",
				urgency: command.rechargeOrReplace
					|| BatteryReplacementStatus.Soon,
			},
		);
	}
}
