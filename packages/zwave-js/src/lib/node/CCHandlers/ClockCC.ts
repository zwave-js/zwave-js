import { type ClockCCReport, type PersistValuesContext } from "@zwave-js/cc";
import { type LogNode } from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

export interface ClockHandlerStore {
	busySettingClock: boolean;
}

export function getDefaultClockHandlerStore(): ClockHandlerStore {
	return {
		busySettingClock: false,
	};
}

/** Handles the receipt of a Clock Report */
export async function handleClockReport(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: ClockCCReport,
	store: ClockHandlerStore,
): Promise<void> {
	if (store.busySettingClock) return;
	const endpoint = node.getEndpoint(command.endpointIndex);
	if (!endpoint) return;

	// A Z-Wave Plus node SHOULD issue a Clock Report Command via the Lifeline Association Group if they
	// suspect to have inaccurate time and/or weekdays (e.g. after battery removal).
	// A controlling node SHOULD compare the received time and weekday with its current time and set the
	// time again at the supporting node if a deviation is observed (e.g. different weekday or more than a
	// minute difference)

	// A sending node knowing the current time with seconds precision SHOULD round its
	// current time to the nearest minute when sending this command.
	let now = new Date();
	const seconds = now.getSeconds();
	if (seconds >= 30) {
		now = new Date(now.getTime() + (60 - seconds) * 1000);
	}

	// Get desired time in local time
	const hours = now.getHours();
	const minutes = now.getMinutes();
	// Sunday is 0 in JS, but 7 in Z-Wave
	let weekday = now.getDay();
	if (weekday === 0) weekday = 7;

	if (
		command.weekday !== weekday
		|| command.hour !== hours
		|| command.minute !== minutes
	) {
		ctx.logNode(
			node.id,
			`detected a deviation of the node's clock, updating it...`,
		);
		try {
			store.busySettingClock = true;
			await endpoint.commandClasses.Clock.set(
				hours,
				minutes,
				weekday,
			);
		} catch {
			// ignore
		} finally {
			store.busySettingClock = false;
		}
	}
}
