import { type EventListener, type TypedEventTarget } from "@zwave-js/shared";

export interface MACLayerEventCallbacks {
	[others: string]: EventListener;
}

export type PHYLayerEvents = Extract<keyof MACLayerEventCallbacks, string>;

/** Defines functionality that must be provided by the MAC layer */
export interface MACLayer extends TypedEventTarget<MACLayerEventCallbacks> {
	/**
	 * The home ID of the node controlled by the MAC layer.
	 * Used to decide how to handle incoming frames.
	 */
	ownHomeId: number | undefined;

	/**
	 * The node ID of the node controlled by the MAC layer.
	 * Used to decide how to handle incoming frames.
	 */
	ownNodeId: number | undefined;

	/**
	 * Whether ACKs should be sent for frames addressed to the node
	 * controlled by the MAC layer.
	 */
	autoAck: boolean;
}
