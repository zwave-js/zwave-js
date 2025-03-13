import {
	DoorLockCCValues,
	DoorLockMode,
	LockCCValues,
	type NotificationCCReport,
	NotificationCCValues,
	type PersistValuesContext,
	getEffectiveCCVersion,
} from "@zwave-js/cc";
import {
	getNotificationEnumBehavior,
	getNotificationStateValueWithEnum,
	getNotificationValueMetadata,
} from "@zwave-js/cc/NotificationCC";
import {
	CommandClasses,
	type GetSupportedCCVersion,
	type LogNode,
	type NodeId,
	type Notification,
	type NotificationState,
	type ValueID,
	type ValueMetadataNumeric,
	getNotification,
	getNotificationValue,
	valueIdToString,
} from "@zwave-js/core";
import {
	type Timer,
	isUint8Array,
	setTimer,
	stringify,
} from "@zwave-js/shared";
import { type ZWaveNode } from "../Node.js";
import { type NodeValues } from "../mixins/40_Values.js";

export interface NotificationHandlerStore {
	idleTimeouts: Map<string, Timer>;
}

export function getDefaultNotificationHandlerStore(): NotificationHandlerStore {
	return {
		idleTimeouts: new Map(),
	};
}

/** Handles the receipt of a Notification Report */
export function handleNotificationReport(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: NotificationCCReport,
	store: NotificationHandlerStore,
): void {
	if (command.notificationType == undefined) {
		if (command.alarmType == undefined) {
			ctx.logNode(node.id, {
				message: `received unsupported notification ${
					stringify(
						command,
					)
				}`,
				direction: "inbound",
			});
		}
		return;
	}

	const ccVersion = getEffectiveCCVersion(ctx, command);

	// Look up the received notification in the config
	const notification = getNotification(command.notificationType);

	if (notification) {
		// This is a notification (status or event) with a known type
		const notificationName = notification.name;

		ctx.logNode(node.id, {
			message:
				`[handleNotificationReport] notificationName: ${notificationName}`,
			level: "silly",
		});

		/** Returns a single notification state to idle */
		const setStateIdle = (prevValue: number): void => {
			manuallyIdleNotificationValueInternal(
				ctx,
				node,
				store,
				notification,
				prevValue,
				command.endpointIndex,
			);
		};

		const setUnknownStateIdle = (prevValue?: number) => {
			// Find the value for the unknown notification variable bucket
			const unknownNotificationVariableValueId = NotificationCCValues
				.unknownNotificationVariable(
					command.notificationType!,
					notificationName,
				).endpoint(command.endpointIndex);
			const currentValue = node.valueDB.getValue(
				unknownNotificationVariableValueId,
			);
			// ... and if it exists
			if (currentValue == undefined) return;
			// ... reset it to idle
			if (prevValue == undefined || currentValue === prevValue) {
				node.valueDB.setValue(
					unknownNotificationVariableValueId,
					0, /* idle */
				);
			}
		};

		const value = command.notificationEvent!;
		if (value === 0) {
			// Generic idle notification, this contains a value to be reset
			if (
				isUint8Array(command.eventParameters)
				&& command.eventParameters.length
			) {
				// The target value is the first byte of the event parameters
				setStateIdle(command.eventParameters[0]);
				setUnknownStateIdle(command.eventParameters[0]);
			} else {
				// Reset all values to idle
				const nonIdleValues = node.valueDB
					.getValues(CommandClasses.Notification)
					.filter(
						(v) =>
							(v.endpoint || 0) === command.endpointIndex
							&& v.property === notificationName
							&& typeof v.value === "number"
							&& v.value !== 0,
					);
				for (const v of nonIdleValues) {
					setStateIdle(v.value as number);
				}
				setUnknownStateIdle();
			}
			return;
		}

		// Find out which property we need to update
		const valueConfig = getNotificationValue(notification, value);

		if (valueConfig) {
			ctx.logNode(node.id, {
				message: `[handleNotificationReport] valueConfig:
  label: ${valueConfig.label}
  ${
					valueConfig.type === "event"
						? "type: event"
						: `type: state
  variableName: ${valueConfig.variableName}`
				}`,
				level: "silly",
			});
		} else {
			ctx.logNode(node.id, {
				message: `[handleNotificationReport] valueConfig: undefined`,
				level: "silly",
			});
		}

		// Perform some heuristics on the known notification
		handleKnownNotification(node, command);

		let allowIdleReset: boolean;
		if (!valueConfig) {
			// We don't know what this notification refers to, so we don't force a reset
			allowIdleReset = false;
		} else if (valueConfig.type === "state") {
			allowIdleReset = valueConfig.idle;
		} else {
			// This is an event
			const endpoint = node.getEndpoint(command.endpointIndex)
				?? node;
			node.emit(
				"notification",
				endpoint,
				CommandClasses.Notification,
				{
					type: command.notificationType,
					event: value,
					label: notification.name,
					eventLabel: valueConfig.label,
					parameters: command.eventParameters,
				},
			);

			// We may need to reset some linked states to idle
			if (valueConfig.idleVariables?.length) {
				for (const variable of valueConfig.idleVariables) {
					setStateIdle(variable);
				}
			}
			return;
		}

		// Now that we've gathered all we need to know, update the value in our DB
		let valueId: ValueID;
		if (valueConfig) {
			valueId = NotificationCCValues.notificationVariable(
				notificationName,
				valueConfig.variableName,
			).endpoint(command.endpointIndex);

			extendNotificationValueMetadata(
				ctx,
				node,
				valueId,
				notification,
				valueConfig,
			);
		} else {
			// Collect unknown values in an "unknown" bucket
			const unknownValue = NotificationCCValues
				.unknownNotificationVariable(
					command.notificationType,
					notificationName,
				);
			valueId = unknownValue.endpoint(command.endpointIndex);

			if (ccVersion >= 2) {
				if (!node.valueDB.hasMetadata(valueId)) {
					node.valueDB.setMetadata(valueId, unknownValue.meta);
				}
			}
		}
		if (typeof command.eventParameters === "number") {
			// This notification contains an enum value. Depending on how the enum behaves,
			// we may need to set "fake" values for these to distinguish them
			// from states without enum values
			const enumBehavior = valueConfig
				? getNotificationEnumBehavior(
					notification,
					valueConfig,
				)
				: "extend";

			const valueWithEnum = enumBehavior === "replace"
				? command.eventParameters
				: getNotificationStateValueWithEnum(
					value,
					command.eventParameters,
				);
			node.valueDB.setValue(valueId, valueWithEnum);
		} else {
			node.valueDB.setValue(valueId, value);
		}

		// Nodes before V8 (and some misbehaving V8 ones) don't necessarily reset the notification to idle.
		// The specifications advise to auto-reset the variables, but it has been found that this interferes
		// with some motion sensors that don't refresh their active notification. Therefore, we set a fallback
		// timer if the `forceNotificationIdleReset` compat flag is set.
		if (
			allowIdleReset
			&& !!node.deviceConfig?.compat?.forceNotificationIdleReset
		) {
			ctx.logNode(node.id, {
				message: `[handleNotificationReport] scheduling idle reset`,
				level: "silly",
			});
			scheduleNotificationIdleReset(
				store,
				valueId,
				() => setStateIdle(value),
			);
		}
	} else {
		// This is an unknown notification
		const unknownValue = NotificationCCValues.unknownNotificationType(
			command.notificationType,
		);
		const valueId = unknownValue.endpoint(command.endpointIndex);

		// Make sure the metdata exists
		if (ccVersion >= 2) {
			if (!node.valueDB.hasMetadata(valueId)) {
				node.valueDB.setMetadata(valueId, unknownValue.meta);
			}
		}

		// And set its value
		node.valueDB.setValue(valueId, command.notificationEvent);
		// We don't know what this notification refers to, so we don't force a reset
	}
}

function handleKnownNotification(
	node: ZWaveNode,
	command: NotificationCCReport,
): void {
	const lockEvents = [0x01, 0x03, 0x05, 0x09];
	const unlockEvents = [0x02, 0x04, 0x06];
	const doorStatusEvents = [
		// Actual status
		0x16,
		0x17,
		// Synthetic status with enum
		0x1600,
		0x1601,
	];
	if (
		// Access Control, manual/keypad/rf/auto (un)lock operation
		command.notificationType === 0x06
		&& (lockEvents.includes(command.notificationEvent as number)
			|| unlockEvents.includes(command.notificationEvent as number))
		&& (node.supportsCC(CommandClasses["Door Lock"])
			|| node.supportsCC(CommandClasses.Lock))
	) {
		// The Door Lock Command Class is constrained to the S2 Access Control key,
		// while the Notification Command Class, in the same device, could use a
		// different key. This way the device can notify devices which don't belong
		// to the S2 Access Control key group of changes in its state.

		const isLocked = lockEvents.includes(
			command.notificationEvent as number,
		);

		// Update the current lock status
		if (node.supportsCC(CommandClasses["Door Lock"])) {
			node.valueDB.setValue(
				DoorLockCCValues.currentMode.endpoint(
					command.endpointIndex,
				),
				isLocked ? DoorLockMode.Secured : DoorLockMode.Unsecured,
			);
		}
		if (node.supportsCC(CommandClasses.Lock)) {
			node.valueDB.setValue(
				LockCCValues.locked.endpoint(command.endpointIndex),
				isLocked,
			);
		}
	} else if (
		command.notificationType === 0x06
		&& doorStatusEvents.includes(command.notificationEvent as number)
	) {
		// https://github.com/zwave-js/zwave-js/pull/5394 added support for
		// notification enums. Unfortunately, there's no way to discover which nodes
		// actually support them, which makes working with the Door state variable
		// very cumbersome. Also, this is currently the only notification where the enum values
		// extend the state value.

		// To work around this, we hard-code a notification value for the door status
		// which only includes the "legacy" states for open/closed.
		node.valueDB.setValue(
			NotificationCCValues.doorStateSimple.endpoint(
				command.endpointIndex,
			),
			command.notificationEvent === 0x17 ? 0x17 : 0x16,
		);

		// In addition to that, we also hard-code a notification value for only the tilt status.
		// This will only be created after receiving a notification for the tilted state.
		// Only after it exists, it will be updated. Otherwise, we'd get phantom
		// values, since some devices send the enum value, even when they don't support tilt.
		const tiltValue = NotificationCCValues.doorTiltState;
		const tiltValueId = tiltValue.endpoint(command.endpointIndex);
		let tiltValueWasCreated = node.valueDB.hasMetadata(tiltValueId);
		if (command.eventParameters === 0x01 && !tiltValueWasCreated) {
			node.valueDB.setMetadata(tiltValueId, tiltValue.meta);
			tiltValueWasCreated = true;
		}
		if (tiltValueWasCreated) {
			node.valueDB.setValue(
				tiltValueId,
				command.eventParameters === 0x01 ? 0x01 : 0x00,
			);
		}
	}
}

/** Manually resets a single notification value to idle */
export function manuallyIdleNotificationValueInternal(
	ctx: GetSupportedCCVersion,
	node: NodeId & NodeValues,
	store: NotificationHandlerStore,
	notification: Notification,
	prevValue: number,
	endpointIndex: number,
): void {
	const valueConfig = getNotificationValue(notification, prevValue);
	// Only known variables may be reset to idle
	if (!valueConfig || valueConfig.type !== "state") return;
	// Some properties may not be reset to idle
	if (!valueConfig.idle) return;

	const notificationName = notification.name;
	const variableName = valueConfig.variableName;
	const valueId = NotificationCCValues.notificationVariable(
		notificationName,
		variableName,
	).endpoint(endpointIndex);

	// Make sure the value is actually set to the previous value
	if (node.valueDB.getValue(valueId) !== prevValue) return;

	// Since the node has reset the notification itself, we don't need the idle reset
	clearNotificationIdleReset(store, valueId);
	extendNotificationValueMetadata(
		ctx,
		node,
		valueId,
		notification,
		valueConfig,
	);
	node.valueDB.setValue(valueId, 0 /* idle */);
}

/** Schedules a notification value to be reset */
function scheduleNotificationIdleReset(
	store: NotificationHandlerStore,
	valueId: ValueID,
	handler: () => void,
): void {
	clearNotificationIdleReset(store, valueId);
	const key = valueIdToString(valueId);
	store.idleTimeouts.set(
		key,
		// Unref'ing long running timeouts allows to quit the application before the timeout elapses
		setTimer(handler, 5 * 60 * 1000 /* 5 minutes */).unref(),
	);
}

/** Removes a scheduled notification reset */
function clearNotificationIdleReset(
	store: NotificationHandlerStore,
	valueId: ValueID,
): void {
	const key = valueIdToString(valueId);
	if (store.idleTimeouts.has(key)) {
		store.idleTimeouts.get(key)?.clear();
		store.idleTimeouts.delete(key);
	}
}

// Fallback for V2 notifications that don't allow us to predefine the metadata during the interview.
// Instead of defining useless values for each possible notification event, we build the metadata on demand
function extendNotificationValueMetadata(
	ctx: GetSupportedCCVersion,
	node: NodeId & NodeValues,
	valueId: ValueID,
	notification: Notification,
	valueConfig: NotificationState,
) {
	const ccVersion = ctx.getSupportedCCVersion(
		CommandClasses.Notification,
		node.id,
		node.index,
	);
	if (ccVersion === 2 || !node.valueDB.hasMetadata(valueId)) {
		const metadata = getNotificationValueMetadata(
			node.valueDB.getMetadata(valueId) as
				| ValueMetadataNumeric
				| undefined,
			notification,
			valueConfig,
		);
		node.valueDB.setMetadata(valueId, metadata);
	}
}
