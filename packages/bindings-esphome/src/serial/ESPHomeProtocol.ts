import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";

/**
 * Encodes a VarInt according to the Protocol Buffers specification
 */
export function encodeVarInt(value: number): Uint8Array {
	const bytes: number[] = [];
	while (value >= 0x80) {
		bytes.push((value & 0x7f) | 0x80);
		value >>>= 7;
	}
	bytes.push(value & 0x7f);
	return new Uint8Array(bytes);
}

/**
 * Decodes a VarInt according to the Protocol Buffers specification
 * Returns the decoded value and the number of bytes consumed
 */
export function decodeVarInt(
	data: Uint8Array,
	offset: number = 0,
): { value: number; bytesRead: number } {
	let value = 0;
	let shift = 0;
	let bytesRead = 0;

	while (offset + bytesRead < data.length) {
		const byte = data[offset + bytesRead];
		bytesRead++;

		value |= (byte & 0x7f) << shift;
		if ((byte & 0x80) === 0) {
			return { value, bytesRead };
		}

		shift += 7;
		if (shift >= 35) {
			throw new ZWaveError(
				"VarInt too long",
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}

	throw new ZWaveError(
		"Incomplete VarInt",
		ZWaveErrorCodes.Argument_Invalid,
	);
}

/**
 * Encodes a frame using the ESPHome plaintext protocol format
 */
export function encodeESPHomeFrame(
	messageType: number,
	payload: Uint8Array,
): Uint8Array {
	const payloadSizeBytes = encodeVarInt(payload.length);
	const messageTypeBytes = encodeVarInt(messageType);

	// Calculate header length: indicator (1) + payload size varint + message type varint
	const headerLength = 1 + payloadSizeBytes.length + messageTypeBytes.length;

	// For plaintext protocol, use dynamic positioning with up to 6 bytes of padding
	const maxHeaderBytes = 6;
	const offset = Math.max(0, maxHeaderBytes - headerLength);

	const frame = new Uint8Array(maxHeaderBytes + payload.length);
	let pos = offset;

	// Indicator byte for plaintext protocol
	frame[pos++] = 0x00;

	// Payload size as VarInt
	frame.set(payloadSizeBytes, pos);
	pos += payloadSizeBytes.length;

	// Message type as VarInt
	frame.set(messageTypeBytes, pos);
	pos += messageTypeBytes.length;

	// Payload data
	frame.set(payload, pos);

	// Return the frame without unused padding bytes
	return frame.slice(offset);
}

/**
 * Decodes a frame using the ESPHome plaintext protocol format
 */
export function decodeESPHomeFrame(
	data: Uint8Array,
): { messageType: number; payload: Uint8Array } {
	if (data.length < 3) {
		throw new ZWaveError(
			"Frame too short",
			ZWaveErrorCodes.Argument_Invalid,
		);
	}

	let pos = 0;

	// Check indicator byte
	if (data[pos] !== 0x00) {
		throw new ZWaveError(
			`Invalid frame indicator: expected 0x00, got 0x${
				data[pos].toString(16).padStart(2, "0")
			}`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
	pos++;

	// Decode payload size
	const payloadSize = decodeVarInt(data, pos);
	pos += payloadSize.bytesRead;

	// Decode message type
	const messageType = decodeVarInt(data, pos);
	pos += messageType.bytesRead;

	// Extract payload
	if (pos + payloadSize.value > data.length) {
		throw new ZWaveError(
			"Frame payload extends beyond frame boundary",
			ZWaveErrorCodes.Argument_Invalid,
		);
	}

	const payload = data.slice(pos, pos + payloadSize.value);

	return {
		messageType: messageType.value,
		payload,
	};
}
