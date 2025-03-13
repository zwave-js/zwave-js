import {
	type PersistValuesContext,
	type WakeUpCC,
	WakeUpCCValues,
} from "@zwave-js/cc";
import { CommandClasses, type LogNode } from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

export interface WakeUpHandlerStore {
	/** The timestamp of the last received wakeup notification */
	lastWakeUp: number | undefined;
}

export function getDefaultWakeUpHandlerStore(): WakeUpHandlerStore {
	return {
		lastWakeUp: undefined,
	};
}

/** Handles the receipt of a Wake Up notification */
export function handleWakeUpNotification(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	_command: WakeUpCC,
	store: WakeUpHandlerStore,
): void {
	ctx.logNode(node.id, {
		message: `received wakeup notification`,
		direction: "inbound",
	});

	// It can happen that the node has not told us that it supports the Wake Up CC
	// https://sentry.io/share/issue/6a681729d7db46d591f1dcadabe8d02e/
	// To avoid a crash, mark it as supported
	if (node.getCCVersion(CommandClasses["Wake Up"]) === 0) {
		node.addCC(CommandClasses["Wake Up"], {
			isSupported: true,
			version: 1,
		});
	}

	node.markAsAwake();

	// From the specs:
	// A controlling node SHOULD read the Wake Up Interval of a supporting node when the delays between
	// Wake Up periods are larger than what was last set at the supporting node.
	const now = Date.now();
	if (store.lastWakeUp) {
		// we've already measured the wake up interval, so we can check whether a refresh is necessary
		const wakeUpInterval =
			node.getValue<number>(WakeUpCCValues.wakeUpInterval.id) ?? 1;
		// The wakeup interval is specified in seconds. Also add 5 minutes tolerance to avoid
		// unnecessary queries since there might be some delay. A wakeup interval of 0 means manual wakeup,
		// so the interval shouldn't be verified
		if (
			wakeUpInterval > 0
			&& (now - store.lastWakeUp) / 1000 > wakeUpInterval + 5 * 60
		) {
			node.commandClasses["Wake Up"].getInterval().catch(() => {
				// Don't throw if there's an error
			});
		}
	}
	store.lastWakeUp = now;

	// Some legacy devices expect us to query them on wake up in order to function correctly
	if (node.deviceConfig?.compat?.queryOnWakeup) {
		void node.compatDoWakeupQueries();
	} else if (!node.deviceConfig?.compat?.disableAutoRefresh) {
		// For other devices we may have to refresh their values from time to time
		void node.autoRefreshValues().catch(() => {
			// ignore
		});
	}
}
