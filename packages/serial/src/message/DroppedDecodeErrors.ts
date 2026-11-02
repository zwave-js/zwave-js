import { ZWaveErrorCodes } from "@zwave-js/core/error";

import { MessageHeaders } from "./MessageHeaders.js";

/**
 * Error codes for which a received message that fails to decode is dropped,
 * mapped to the response that is sent to the controller.
 * Decode errors with any other code are re-thrown, so parsers must not throw them.
 */
export const droppedDecodeErrors: ReadonlyMap<
	ZWaveErrorCodes,
	MessageHeaders.ACK | MessageHeaders.NAK
> = new Map([
	// These indicate a transmission problem, so the controller should retransmit
	[ZWaveErrorCodes.PacketFormat_Invalid, MessageHeaders.NAK],
	[ZWaveErrorCodes.PacketFormat_Checksum, MessageHeaders.NAK],
	[ZWaveErrorCodes.PacketFormat_Truncated, MessageHeaders.NAK],
	// The message was received correctly, but cannot be handled
	[ZWaveErrorCodes.PacketFormat_InvalidPayload, MessageHeaders.ACK],
	[ZWaveErrorCodes.Deserialization_NotImplemented, MessageHeaders.ACK],
	[ZWaveErrorCodes.CC_NotImplemented, MessageHeaders.ACK],
	[ZWaveErrorCodes.Driver_NotReady, MessageHeaders.ACK],
	[ZWaveErrorCodes.Driver_NoSecurity, MessageHeaders.ACK],
	[ZWaveErrorCodes.Security2CC_NotInitialized, MessageHeaders.ACK],
	[ZWaveErrorCodes.Controller_NodeNotFound, MessageHeaders.ACK],
]);
