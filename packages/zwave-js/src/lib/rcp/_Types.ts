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
	 * The index of the repeater before the failed hop.
	 */
	failedHop?: number;
	/** Per-repeater RSSI from the routed ack's extension */
	repeaterRSSI?: readonly RSSI[];
}

/**
 * How a FLiRS destination has to be woken. `"250ms"` and `"1000ms"` name the
 * wakeup interval it listens with, `"fragmented"` the beam format that channel
 * configuration 3 and Long Range use instead.
 */
export type MACDestinationWakeup = "250ms" | "1000ms" | "fragmented";

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
	route?: readonly number[];
	/**
	 * Destination FLiRS wakeup interval. Without a route, a wakeup beam precedes
	 * the transmission. With a route, it is carried in the routing header for the
	 * last repeater (not implemented yet).
	 */
	destinationWakeup?: MACDestinationWakeup;
	/**
	 * Radio TX power in dBm. Default: keep the radio's current power for classic
	 * Z-Wave, or the default LR TX power for Long Range.
	 */
	txPower?: number;
	/**
	 * Values to put into the Long Range MPDU. Anything left out is derived from
	 * the radio settings, so setting one here advertises a value that does not
	 * match reality, for testing spec violations.
	 */
	lrMpduOverrides?: {
		/** LR MPDU TX Power field. Default: the radio TX power. */
		txPower?: number;
		/** LR MPDU Noise Floor field. Default: "RSSI not available". */
		noiseFloor?: number;
	};
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
			/** Radio TX power in dBm. Default: the default LR TX power. */
			txPower?: number;
			/**
			 * The RSSI measured while receiving the frame this acknowledges.
			 * Default: "RSSI not available".
			 */
			incomingRSSI?: number;
			/**
			 * Values to put into the ack MPDU. Anything left out is derived from the
			 * radio settings, so setting one here advertises a value that does not
			 * match reality, for testing spec violations.
			 */
			lrMpduOverrides?: {
				/** LR MPDU TX Power field. Default: the radio TX power. */
				txPower?: number;
				/** LR MPDU Noise Floor field. Default: "RSSI not available". */
				noiseFloor?: number;
			};
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
