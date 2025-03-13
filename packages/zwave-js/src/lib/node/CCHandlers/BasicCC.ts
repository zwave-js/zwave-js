import {
	type BasicCC,
	BasicCCReport,
	BasicCCSet,
	BasicCCValues,
	type CommandClass,
	type PersistValuesContext,
} from "@zwave-js/cc";
import {
	CommandClasses,
	EncapsulationFlags,
	type LogNode,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

/** Handles the receipt of a BasicCC Set or Report */
export function handleBasicCommand(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: BasicCC,
): void {
	// Retrieve the endpoint the command is coming from
	const sourceEndpoint = node.getEndpoint(command.endpointIndex ?? 0)
		?? node;

	// Depending on the generic device class, we may need to map the basic command to other CCs
	let mappedTargetCC: CommandClass | undefined;
	switch (sourceEndpoint.deviceClass?.generic.key) {
		case 0x20: // Binary Sensor
			mappedTargetCC = sourceEndpoint.createCCInstanceUnsafe(
				CommandClasses["Binary Sensor"],
			);
			break;
		case 0x10: // Binary Switch
			mappedTargetCC = sourceEndpoint.createCCInstanceUnsafe(
				CommandClasses["Binary Switch"],
			);
			break;
		case 0x11: // Multilevel Switch
			mappedTargetCC = sourceEndpoint.createCCInstanceUnsafe(
				CommandClasses["Multilevel Switch"],
			);
			break;
		case 0x12: // Remote Switch
			switch (sourceEndpoint.deviceClass.specific.key) {
				case 0x01: // Binary Remote Switch
					mappedTargetCC = sourceEndpoint
						.createCCInstanceUnsafe(
							CommandClasses["Binary Switch"],
						);
					break;
				case 0x02: // Multilevel Remote Switch
					mappedTargetCC = sourceEndpoint
						.createCCInstanceUnsafe(
							CommandClasses["Multilevel Switch"],
						);
					break;
			}
	}

	if (command instanceof BasicCCReport) {
		// By default, map Basic CC Reports to a more appropriate CC, unless stated otherwise in a config file
		const basicReportMapping = node.deviceConfig?.compat?.mapBasicReport
			?? "auto";

		if (basicReportMapping === "Binary Sensor") {
			// Treat the command as a BinarySensorCC Report, regardless of the device class
			mappedTargetCC = sourceEndpoint.createCCInstanceUnsafe(
				CommandClasses["Binary Sensor"],
			);
			if (typeof command.currentValue === "number") {
				if (mappedTargetCC) {
					ctx.logNode(node.id, {
						endpoint: command.endpointIndex,
						message:
							"treating BasicCC::Report as a BinarySensorCC::Report",
					});
					mappedTargetCC.setMappedBasicValue(
						ctx,
						command.currentValue,
					);
				} else {
					ctx.logNode(node.id, {
						endpoint: command.endpointIndex,
						message:
							"cannot treat BasicCC::Report as a BinarySensorCC::Report, because the Binary Sensor CC is not supported",
						level: "warn",
					});
				}
			} else {
				ctx.logNode(node.id, {
					endpoint: command.endpointIndex,
					message:
						"cannot map BasicCC::Report to a different CC, because the current value is unknown",
					level: "warn",
				});
			}
		} else if (
			basicReportMapping === "auto" || basicReportMapping === false
		) {
			// Try to set the mapped value on the target CC
			const didSetMappedValue = typeof command.currentValue === "number"
				// ... unless forbidden
				&& basicReportMapping === "auto"
				&& mappedTargetCC?.setMappedBasicValue(
					ctx,
					command.currentValue,
				);

			// Otherwise fall back to setting it ourselves
			if (!didSetMappedValue) {
				// Store the value in the value DB now
				command.persistValues(ctx);
			}
		}
	} else if (command instanceof BasicCCSet) {
		// By default, map Basic CC Set to Basic CC Report, unless stated otherwise in a config file
		const basicSetMapping = node.deviceConfig?.compat?.mapBasicSet
			?? "report";

		if (basicSetMapping === "event") {
			// Treat BasicCCSet as value events if desired
			ctx.logNode(node.id, {
				endpoint: command.endpointIndex,
				message: "treating BasicCC::Set as a value event",
			});
			node.valueDB.setValue(
				BasicCCValues.compatEvent.endpoint(
					command.endpointIndex,
				),
				command.targetValue,
				{
					stateful: false,
				},
			);
		} else if (basicSetMapping === "Binary Sensor") {
			// Treat the Set command as a BinarySensorCC Report, regardless of the device class
			mappedTargetCC = sourceEndpoint.createCCInstanceUnsafe(
				CommandClasses["Binary Sensor"],
			);
			if (mappedTargetCC) {
				ctx.logNode(node.id, {
					endpoint: command.endpointIndex,
					message:
						"treating BasicCC::Set as a BinarySensorCC::Report",
				});
				mappedTargetCC.setMappedBasicValue(
					ctx,
					command.targetValue,
				);
			} else {
				ctx.logNode(node.id, {
					endpoint: command.endpointIndex,
					message:
						"cannot treat BasicCC::Set as a BinarySensorCC::Report, because the Binary Sensor CC is not supported",
					level: "warn",
				});
			}
		} else if (
			!node.deviceConfig?.compat?.mapBasicSet
			&& !!(command.encapsulationFlags
				& EncapsulationFlags.Supervision)
		) {
			// A controller MUST not support Basic CC per the specifications. While we can interpret its contents,
			// we MUST respond to supervised Basic CC Set with "no support".
			// All known devices that use BasicCCSet for reporting send it unsupervised, so this should be safe to do.
			if (
				command.encapsulationFlags & EncapsulationFlags.Supervision
			) {
				throw new ZWaveError(
					"Basic CC is not supported",
					ZWaveErrorCodes.CC_NotSupported,
				);
			}
		} else if (
			basicSetMapping === "auto" || basicSetMapping === "report"
		) {
			// Some devices send their current state using BasicCCSet to their associations
			// instead of using reports. We still interpret them like reports
			ctx.logNode(node.id, {
				endpoint: command.endpointIndex,
				message: "treating BasicCC::Set as a report",
			});

			// In "auto" mode, try to set the mapped value on the target CC first
			const didSetMappedValue = basicSetMapping === "auto"
				&& !!mappedTargetCC?.setMappedBasicValue(
					ctx,
					command.targetValue,
				);

			// Otherwise handle the command ourselves
			if (!didSetMappedValue) {
				// Basic Set commands cannot store their value automatically, so store the values manually
				node.valueDB.setValue(
					BasicCCValues.currentValue.endpoint(
						command.endpointIndex,
					),
					command.targetValue,
				);
				// Since the node sent us a Basic Set, we are sure that it is at least controlled
				// Add it to the support list, so the information lands in the network cache
				if (!sourceEndpoint.controlsCC(CommandClasses.Basic)) {
					sourceEndpoint.addCC(CommandClasses.Basic, {
						isControlled: true,
					});
				}
			}
		}
	}
}
