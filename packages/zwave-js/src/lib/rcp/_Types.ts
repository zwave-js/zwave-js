import type { Protocols, RSSI } from "@zwave-js/core";

export enum MACTransmitResult {
	/** The frame was successfully sent. If an ACK was requested, it was received. */
	OK = 0x00,

	// Expected errors during normal communication
	/** The frame was sent, but no ACK was received from the destination */
	NoAck = 0x01,
	/** The frame could not be sent because the chosen channel was busy */
	ChannelBusy = 0x02,
	/** The routed frame was sent, but the destination returned no routed acknowledgement */
	NoRoutedAck = 0x03,
	/** A repeater on the route could not reach the next hop */
	RoutedError = 0x04,

	// Low-level radio errors:
	/** The frame could not be queued for transmission */
	Error_QueueBusy = 0xf1,
	/** The frame was too long to be transmitted, or the radio expected more data than provided */
	Error_FrameLength = 0xf2,
	/** The transmit was aborted */
	Error_Aborted = 0xf3,
	/** An unknown radio error has occured */
	Error_Unknown = 0xfe,
}

export interface MACTransmitReport {
	result: MACTransmitResult;
	/**
	 * The hop at which the route failed, taken from a routed error.
	 * NWK:0010.1 numbers the repeater that got no acknowledgement, so the
	 * repeater that could not reach the next hop is `repeaters[failedHop]`.
	 */
	failedHop?: number;
	/** Per-repeater RSSI from the routed ack's extension */
	repeaterRSSI?: readonly RSSI[];
}

export interface MACTransmitOptions {
	// TODO: Make home id and node id optional
	homeId: number;
	sourceNodeId: number;
	destination: MACTransmitDestination;
	protocol?: Protocols;
	ackRequested?: boolean;
	/**
	 * Whether to perform clear channel assessment before transmitting. Default: `true`.
	 * G.9959 requires CCA before transmitting a data frame, but it can be disabled for testing.
	 */
	withCCA?: boolean;
	/**
	 * The source route to send the frame over, classic Z-Wave only.
	 * The repeater list must contain between 1 and 4 node IDs.
	 */
	route?: MACRoute;
}

export interface MACRoute {
	repeaters: readonly number[];
}

export type MACTransmitAckOptions =
	& {
		// TODO: Make home id and node id optional
		homeId: number;
		sourceNodeId: number;
		destinationNodeId: number;
		channel: number;
		sequenceNumber: number;
	}
	& (
		| {
			protocol: Protocols.ZWave;
		}
		| {
			protocol: Protocols.ZWaveLongRange;
			senderTXPower: number;
			senderNoiseFloor: number;
		}
	);

export enum MACTransmitKind {
	Singlecast,
	Multicast,
	Broadcast,
}

export type MACTransmitDestination = {
	kind: MACTransmitKind.Singlecast;
	nodeId: number;
} | {
	kind: MACTransmitKind.Multicast;
	nodeIds: number[];
} | {
	kind: MACTransmitKind.Broadcast;
};
