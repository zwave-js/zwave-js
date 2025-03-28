import {
	type CCAPI,
	type PersistValuesContext,
	type WakeUpCC,
	WakeUpCCValues,
} from "@zwave-js/cc";
import {
	CommandClasses,
	type LogNode,
	ZWaveErrorCodes,
	isZWaveError,
} from "@zwave-js/core";
import { getErrorMessage } from "@zwave-js/shared";
import { isObject } from "alcalzone-shared/typeguards";
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
		void compatDoWakeupQueries(ctx, node);
	} else if (!node.deviceConfig?.compat?.disableAutoRefresh) {
		// For other devices we may have to refresh their values from time to time
		void node.autoRefreshValues().catch(() => {
			// ignore
		});
	}
}

async function compatDoWakeupQueries(
	ctx: LogNode,
	node: ZWaveNode,
): Promise<void> {
	if (!node.deviceConfig?.compat?.queryOnWakeup) return;
	ctx.logNode(node.id, {
		message: `expects some queries after wake up, so it shall receive`,
		direction: "none",
	});

	for (
		const [ccName, apiMethod, ...args] of node.deviceConfig.compat
			.queryOnWakeup
	) {
		ctx.logNode(node.id, {
			message: `compat query "${ccName}"::${apiMethod}(${
				args
					.map((arg) => JSON.stringify(arg))
					.join(", ")
			})`,
			direction: "none",
		});

		// Try to access the API - if it doesn't work, skip this option
		let API: CCAPI;
		try {
			API = (
				(node.commandClasses as any)[ccName] as CCAPI
			).withOptions({
				// Tag the resulting transactions as compat queries
				tag: "compat",
				// Do not retry them or they may cause congestion if the node is asleep again
				maxSendAttempts: 1,
				// This is for a sleeping node - there's no point in keeping the transactions when the node is asleep
				expire: 10000,
			});
		} catch {
			ctx.logNode(node.id, {
				message: `could not access API, skipping query`,
				direction: "none",
				level: "warn",
			});
			continue;
		}
		if (!API.isSupported()) {
			ctx.logNode(node.id, {
				message: `API not supported, skipping query`,
				direction: "none",
				level: "warn",
			});
			continue;
		} else if (!(API as any)[apiMethod]) {
			ctx.logNode(node.id, {
				message: `method ${apiMethod} not found on API, skipping query`,
				direction: "none",
				level: "warn",
			});
			continue;
		}

		// Retrieve the method
		// eslint-disable-next-line
		const method = (API as any)[apiMethod].bind(API) as Function;
		// And replace "smart" arguments with their corresponding value
		const methodArgs = args.map<unknown>((arg) => {
			if (isObject(arg)) {
				const valueId = {
					commandClass: API.ccId,
					...arg,
				};
				return node.getValue(valueId);
			}
			return arg;
		});

		// Do the API call and ignore/log any errors
		try {
			await method(...methodArgs);
			ctx.logNode(node.id, {
				message: `API call successful`,
				direction: "none",
			});
		} catch (e) {
			ctx.logNode(node.id, {
				message: `error during API call: ${getErrorMessage(e)}`,
				direction: "none",
				level: "warn",
			});
			if (
				isZWaveError(e)
				&& e.code === ZWaveErrorCodes.Controller_MessageExpired
			) {
				// A compat query expired - no point in trying the others too
				return;
			}
		}
	}
}
