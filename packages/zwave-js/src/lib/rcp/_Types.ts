import { type Protocols } from "@zwave-js/core";

export enum RCPTransmitResult {
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

export interface RCPTransmitOptions {
	homeId: number;
	sourceNodeId: number;
	destination: RCPTransmitDestination;
	protocol?: Protocols;
	ackRequested?: boolean;
}

export enum RCPTransmitKind {
	Singlecast,
	Multicast,
	Broadcast,
}

export type RCPTransmitDestination = {
	kind: RCPTransmitKind.Singlecast;
	nodeId: number;
} | {
	kind: RCPTransmitKind.Multicast;
	nodeIds: number[];
} | {
	kind: RCPTransmitKind.Broadcast;
};
