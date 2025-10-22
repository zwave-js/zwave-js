import { BytesView } from "@zwave-js/shared";
import type { MessageHeaders } from "../message/MessageHeaders.js";

export type ZWaveSerialChunk =
	| MessageHeaders.ACK
	| MessageHeaders.NAK
	| MessageHeaders.CAN
	| BytesView;

export enum ZWaveSerialMode {
	// Controller or end device Serial API
	SerialAPI,
	// OTW Bootloader
	Bootloader,
	// Text-based SoC end device CLI
	CLI,
}
