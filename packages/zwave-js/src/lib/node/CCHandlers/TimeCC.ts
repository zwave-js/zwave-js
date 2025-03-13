import {
	type PersistValuesContext,
	type TimeCCDateGet,
	type TimeCCTimeGet,
	type TimeCCTimeOffsetGet,
} from "@zwave-js/cc";
import {
	CommandClasses,
	EncapsulationFlags,
	type LogNode,
	getDSTInfo,
} from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

export async function handleTimeGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: TimeCCTimeGet,
): Promise<void> {
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	const now = new Date();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	try {
		// We are being queried, so the device may actually not support the CC, just control it.
		// Using the commandClasses property would throw in that case
		const api = endpoint
			.createAPI(CommandClasses.Time, false)
			.withOptions({
				// Answer with the same encapsulation as asked, but omit
				// Supervision as it shouldn't be used for Get-Report flows
				encapsulationFlags: command.encapsulationFlags
					& ~EncapsulationFlags.Supervision,
			});
		await api.reportTime(hours, minutes, seconds);
	} catch (e: any) {
		ctx.logNode(node.id, {
			message: e.message,
			level: "error",
		});
		// ignore
	}
}

export async function handleDateGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: TimeCCDateGet,
): Promise<void> {
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const day = now.getDate();

	try {
		// We are being queried, so the device may actually not support the CC, just control it.
		// Using the commandClasses property would throw in that case
		const api = endpoint
			.createAPI(CommandClasses.Time, false)
			.withOptions({
				// Answer with the same encapsulation as asked, but omit
				// Supervision as it shouldn't be used for Get-Report flows
				encapsulationFlags: command.encapsulationFlags
					& ~EncapsulationFlags.Supervision,
			});
		await api.reportDate(year, month, day);
	} catch (e: any) {
		ctx.logNode(node.id, {
			message: e.message,
			level: "error",
		});
		// ignore
	}
}

export async function handleTimeOffsetGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: TimeCCTimeOffsetGet,
): Promise<void> {
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	const timezone = getDSTInfo(new Date());

	try {
		// We are being queried, so the device may actually not support the CC, just control it.
		// Using the commandClasses property would throw in that case
		const api = endpoint
			.createAPI(CommandClasses.Time, false)
			.withOptions({
				// Answer with the same encapsulation as asked, but omit
				// Supervision as it shouldn't be used for Get-Report flows
				encapsulationFlags: command.encapsulationFlags
					& ~EncapsulationFlags.Supervision,
			});
		await api.reportTimezone(timezone);
	} catch {
		// ignore
	}
}
