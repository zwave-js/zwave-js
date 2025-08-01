import type { Protocols } from "@zwave-js/core";

export enum MACTransmitResult {
	/** The frame was successfully sent. If an ACK was requested, it was received. */
	OK = 0x00,

	// Expected errors during normal communication
	/** The frame was sent, but no ACK was received from the destination */
	NoAck = 0x01,
	/** The frame could not be sent because the chosen channel was busy */
	ChannelBusy = 0x02,

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

export interface MACTransmitOptions {
	// TODO: Make home id and node id optional
	homeId: number;
	sourceNodeId: number;
	destination: MACTransmitDestination;
	protocol?: Protocols;
	ackRequested?: boolean;
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
