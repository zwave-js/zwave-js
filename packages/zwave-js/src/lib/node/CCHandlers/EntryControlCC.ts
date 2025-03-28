import {
	type EntryControlCCNotification,
	EntryControlDataTypes,
	type PersistValuesContext,
	entryControlEventTypeLabels,
} from "@zwave-js/cc";
import { CommandClasses, type LogNode } from "@zwave-js/core";
import { getEnumMemberName, pick } from "@zwave-js/shared";
import { type ZWaveNode } from "../Node.js";

export interface EntryControlHandlerStore {
	recentSequenceNumbers: number[];
}

export function getDefaultEntryControlHandlerStore(): EntryControlHandlerStore {
	return {
		recentSequenceNumbers: [],
	};
}

export function handleEntryControlNotification(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: EntryControlCCNotification,
	store: EntryControlHandlerStore,
): void {
	if (
		!node.deviceConfig?.compat?.disableStrictEntryControlDataValidation
	) {
		if (
			store.recentSequenceNumbers.includes(
				command.sequenceNumber,
			)
		) {
			ctx.logNode(
				node.id,
				`Received duplicate Entry Control Notification (sequence number ${command.sequenceNumber}), ignoring...`,
				"warn",
			);
			return;
		}

		// Keep track of the last 5 sequence numbers
		store.recentSequenceNumbers.unshift(command.sequenceNumber);
		if (store.recentSequenceNumbers.length > 5) {
			store.recentSequenceNumbers.pop();
		}
	}

	// Notify listeners
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	node.emit("notification", endpoint, CommandClasses["Entry Control"], {
		...pick(command, ["eventType", "dataType", "eventData"]),
		eventTypeLabel: entryControlEventTypeLabels[command.eventType],
		dataTypeLabel: getEnumMemberName(
			EntryControlDataTypes,
			command.dataType,
		),
	});
}
