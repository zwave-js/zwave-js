import { type HailCC, type PersistValuesContext } from "@zwave-js/cc";
import { type LogNode } from "@zwave-js/core";
import { type ZWaveNode } from "../Node.js";

export interface HailHandlerStore {
	busyPolling: boolean;
}

export function getDefaultHailHandlerStore(): HailHandlerStore {
	return {
		busyPolling: false,
	};
}

/** Handles the receipt of a Hail */
export async function handleHail(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	_command: HailCC,
	store: HailHandlerStore,
): Promise<void> {
	// treat this as a sign that the node is awake
	node.markAsAwake();

	if (store.busyPolling) {
		ctx.logNode(node.id, {
			message:
				`Hail received from node, but still busy with previous one...`,
		});
		return;
	}

	ctx.logNode(node.id, {
		message:
			`Hail received from node, refreshing actuator and sensor values...`,
	});
	try {
		store.busyPolling = true;
		await node.refreshValues();
	} catch {
		// ignore
	} finally {
		store.busyPolling = false;
	}
}
