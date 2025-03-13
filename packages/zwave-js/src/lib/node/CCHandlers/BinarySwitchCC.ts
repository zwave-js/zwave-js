import {
	type BinarySwitchCC,
	BinarySwitchCCSet,
	BinarySwitchCCValues,
	type PersistValuesContext,
} from "@zwave-js/cc";
import { type LogNode } from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

/** Handles the receipt of a BinarySwitchCC Set */
export function handleBinarySwitchCommand(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: BinarySwitchCC,
): void {
	if (
		command instanceof BinarySwitchCCSet
		&& node.deviceConfig?.compat?.treatSetAsReport?.has(
			command.constructor.name,
		)
	) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message: "treating BinarySwitchCC::Set as a report",
		});
		node.valueDB.setValue(
			BinarySwitchCCValues.currentValue.endpoint(
				command.endpointIndex,
			),
			command.targetValue,
		);
	}
}
