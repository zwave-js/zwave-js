import {
	type PersistValuesContext,
	type ThermostatModeCC,
	ThermostatModeCCSet,
	ThermostatModeCCValues,
} from "@zwave-js/cc";
import { type LogNode } from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

/** Handles the receipt of a ThermostatModeCC Set */
export function handleThermostatModeCommand(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: ThermostatModeCC,
): void {
	if (
		command instanceof ThermostatModeCCSet
		&& node.deviceConfig?.compat?.treatSetAsReport?.has(
			command.constructor.name,
		)
	) {
		ctx.logNode(node.id, {
			endpoint: command.endpointIndex,
			message: "treating ThermostatModeCC::Set as a report",
		});
		node.valueDB.setValue(
			ThermostatModeCCValues.thermostatMode.endpoint(
				command.endpointIndex,
			),
			command.mode,
		);
	}
}
