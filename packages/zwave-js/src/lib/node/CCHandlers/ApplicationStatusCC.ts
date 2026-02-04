import type {
	ApplicationStatusCCBusy,
	PersistValuesContext,
} from "@zwave-js/cc";
import type { LogNode } from "@zwave-js/core";
import type { Driver } from "../../driver/Driver.js";
import type { ZWaveNode } from "../Node.js";

/** Handles the receipt of an ApplicationBusy command */
export async function handleApplicationBusy(
	ctx: PersistValuesContext & LogNode,
	driver: Driver,
	node: ZWaveNode,
	command: ApplicationStatusCCBusy,
): Promise<void> {
	// If the wait time is not included, wait 1 second by default
	const waitTimeSeconds = Math.min(command.waitTime ?? 1, 30);

	ctx.logNode(node.id, {
		message:
			`Node is busy, re-queueing commands after ${waitTimeSeconds} second(s)...`,
		direction: "inbound",
	});

	await driver.delayTransactionsForNode(node.id, waitTimeSeconds);
}
