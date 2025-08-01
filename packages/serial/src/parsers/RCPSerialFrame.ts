import type { Bytes } from "@zwave-js/shared";
import type { MessageHeaders } from "../message/MessageHeaders.js";

export enum RCPSerialFrameType {
	RCP = 0,
	Discarded = 0xff,
}

export type RCPSerialFrame = {
	type: RCPSerialFrameType.RCP;
	data: RCPChunk;
} | {
	type: RCPSerialFrameType.Discarded;
	data: Uint8Array;
};

export type RCPChunk =
	| Bytes
	| MessageHeaders.ACK
	| MessageHeaders.NAK;
// | MessageHeaders.CAN;
