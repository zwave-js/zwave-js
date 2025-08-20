import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { decodeVarInt, encodeVarInt } from "./ESPHomeProtocol.js";

/**
 * Simple protobuf wire format implementation for ESPHome messages
 */

// Standard ESPHome API message types
export const enum ESPHomeMessageType {
	// Connection messages
	HelloRequest = 1,
	HelloResponse = 2,
	DisconnectRequest = 5,
	DisconnectResponse = 6,
	PingRequest = 7,
	PingResponse = 8,

	// Service discovery
	ListEntitiesRequest = 11,
	ListEntitiesDoneResponse = 19,
	ListEntitiesServicesResponse = 41,
	ExecuteServiceRequest = 42,
}

// Service argument types
export const enum ServiceArgType {
	BOOL = 0,
	INT = 1,
	FLOAT = 2,
	STRING = 3,
	BOOL_ARRAY = 4,
	INT_ARRAY = 5,
	FLOAT_ARRAY = 6,
	STRING_ARRAY = 7,
}

// Message interfaces
export interface HelloRequest {
	clientInfo: string;
	apiVersionMajor: number;
	apiVersionMinor: number;
}

export interface HelloResponse {
	apiVersionMajor: number;
	apiVersionMinor: number;
	serverInfo: string;
	name: string;
}

export type DisconnectRequest = Record<string, never>;

export type DisconnectResponse = Record<string, never>;

export type ListEntitiesRequest = Record<string, never>;

export type ListEntitiesDoneResponse = Record<string, never>;

export interface ListEntitiesServicesArgument {
	name: string;
	type: ServiceArgType;
}

export interface ListEntitiesServicesResponse {
	name: string;
	key: number;
	args: ListEntitiesServicesArgument[];
}

export interface ExecuteServiceArgument {
	intArray?: number[];
}

export interface ExecuteServiceRequest {
	key: number;
	args: ExecuteServiceArgument[];
}

// Legacy interfaces for backward compatibility
export interface SendFrameRequest {
	frame: number[];
}

export interface SendFrameResponse {
	success: boolean;
	errorMessage?: string;
}

export interface FrameData {
	frame: number[];
	timestamp?: number;
}

/**
 * Encodes a HelloRequest message
 */
export function encodeHelloRequest(request: HelloRequest): Uint8Array {
	const parts: Uint8Array[] = [];

	// Field 1: client_info (string)
	if (request.clientInfo) {
		parts.push(encodeVarInt((1 << 3) | 2)); // Field 1, wire type 2 (length-delimited)
		const clientInfoBytes = new TextEncoder().encode(request.clientInfo);
		parts.push(encodeVarInt(clientInfoBytes.length));
		parts.push(clientInfoBytes);
	}

	// Field 2: api_version_major (uint32)
	parts.push(encodeVarInt((2 << 3) | 0)); // Field 2, wire type 0 (varint)
	parts.push(encodeVarInt(request.apiVersionMajor));

	// Field 3: api_version_minor (uint32)
	parts.push(encodeVarInt((3 << 3) | 0)); // Field 3, wire type 0 (varint)
	parts.push(encodeVarInt(request.apiVersionMinor));

	return concatenateUint8Arrays(parts);
}

/**
 * Decodes a HelloResponse message
 */
export function decodeHelloResponse(data: Uint8Array): HelloResponse {
	const result: Partial<HelloResponse> = {};
	let pos = 0;

	while (pos < data.length) {
		const tag = decodeVarInt(data, pos);
		pos += tag.bytesRead;

		const fieldNumber = tag.value >>> 3;
		const wireType = tag.value & 0x7;

		switch (fieldNumber) {
			case 1: // api_version_major
				if (wireType !== 0) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const major = decodeVarInt(data, pos);
				pos += major.bytesRead;
				result.apiVersionMajor = major.value;
				break;

			case 2: // api_version_minor
				if (wireType !== 0) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const minor = decodeVarInt(data, pos);
				pos += minor.bytesRead;
				result.apiVersionMinor = minor.value;
				break;

			case 3: // server_info
				if (wireType !== 2) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const serverInfoLen = decodeVarInt(data, pos);
				pos += serverInfoLen.bytesRead;
				result.serverInfo = new TextDecoder().decode(
					data.slice(pos, pos + serverInfoLen.value),
				);
				pos += serverInfoLen.value;
				break;

			case 4: // name
				if (wireType !== 2) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const nameLen = decodeVarInt(data, pos);
				pos += nameLen.bytesRead;
				result.name = new TextDecoder().decode(
					data.slice(pos, pos + nameLen.value),
				);
				pos += nameLen.value;
				break;

			default:
				pos = skipField(data, pos, wireType);
		}
	}

	return result as HelloResponse;
}

/**
 * Encodes a ListEntitiesRequest message
 */
export function encodeListEntitiesRequest(): Uint8Array {
	// Empty message
	return new Uint8Array(0);
}

/**
 * Decodes a ListEntitiesDoneResponse message
 */
export function decodeListEntitiesDoneResponse(): ListEntitiesDoneResponse {
	// Empty message
	return {};
}

/**
 * Decodes a ListEntitiesServicesResponse message
 */
export function decodeListEntitiesServicesResponse(
	data: Uint8Array,
): ListEntitiesServicesResponse {
	const result: Partial<ListEntitiesServicesResponse> = { args: [] };
	let pos = 0;

	while (pos < data.length) {
		const tag = decodeVarInt(data, pos);
		pos += tag.bytesRead;

		const fieldNumber = tag.value >>> 3;
		const wireType = tag.value & 0x7;

		switch (fieldNumber) {
			case 1: // name
				if (wireType !== 2) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const nameLen = decodeVarInt(data, pos);
				pos += nameLen.bytesRead;
				result.name = new TextDecoder().decode(
					data.slice(pos, pos + nameLen.value),
				);
				pos += nameLen.value;
				break;

			case 2: // key
				if (wireType !== 5) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				// Fixed32 - read 4 bytes as little-endian
				const keyBytes = Bytes.view(data);
				result.key = keyBytes.readUInt32LE(pos);
				pos += 4;
				break;

			case 3: // args (repeated ListEntitiesServicesArgument)
				if (wireType !== 2) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const argLen = decodeVarInt(data, pos);
				pos += argLen.bytesRead;
				const argData = data.slice(pos, pos + argLen.value);
				pos += argLen.value;
				result.args!.push(decodeListEntitiesServicesArgument(argData));
				break;

			default:
				pos = skipField(data, pos, wireType);
		}
	}

	return result as ListEntitiesServicesResponse;
}

/**
 * Decodes a ListEntitiesServicesArgument message
 */
function decodeListEntitiesServicesArgument(
	data: Uint8Array,
): ListEntitiesServicesArgument {
	const result: Partial<ListEntitiesServicesArgument> = {};
	let pos = 0;

	while (pos < data.length) {
		const tag = decodeVarInt(data, pos);
		pos += tag.bytesRead;

		const fieldNumber = tag.value >>> 3;
		const wireType = tag.value & 0x7;

		switch (fieldNumber) {
			case 1: // name
				if (wireType !== 2) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const nameLen = decodeVarInt(data, pos);
				pos += nameLen.bytesRead;
				result.name = new TextDecoder().decode(
					data.slice(pos, pos + nameLen.value),
				);
				pos += nameLen.value;
				break;

			case 2: // type
				if (wireType !== 0) {
					throw new ZWaveError(
						"Invalid wire type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const type = decodeVarInt(data, pos);
				pos += type.bytesRead;
				result.type = type.value as ServiceArgType;
				break;

			default:
				pos = skipField(data, pos, wireType);
		}
	}

	return result as ListEntitiesServicesArgument;
}

/**
 * Encodes an ExecuteServiceRequest message
 */
export function encodeExecuteServiceRequest(
	request: ExecuteServiceRequest,
): Uint8Array {
	const parts: Uint8Array[] = [];

	// Field 1: key (fixed32)
	parts.push(encodeVarInt((1 << 3) | 5)); // Field 1, wire type 5 (fixed32)
	const keyBytes = new Uint8Array(4);
	keyBytes[0] = request.key & 0xff;
	keyBytes[1] = (request.key >>> 8) & 0xff;
	keyBytes[2] = (request.key >>> 16) & 0xff;
	keyBytes[3] = (request.key >>> 24) & 0xff;
	parts.push(keyBytes);

	// Field 2: args (repeated ExecuteServiceArgument)
	for (const arg of request.args) {
		parts.push(encodeVarInt((2 << 3) | 2)); // Field 2, wire type 2 (length-delimited)
		const argData = encodeExecuteServiceArgument(arg);
		parts.push(encodeVarInt(argData.length));
		parts.push(argData);
	}

	return concatenateUint8Arrays(parts);
}

/**
 * Encodes an ExecuteServiceArgument message
 */
function encodeExecuteServiceArgument(arg: ExecuteServiceArgument): Uint8Array {
	const parts: Uint8Array[] = [];

	// Field 7: int_array (repeated sint32)
	if (arg.intArray) {
		for (const value of arg.intArray) {
			parts.push(encodeVarInt((7 << 3) | 0)); // Field 7, wire type 0 (varint)
			// Encode as signed integer using zigzag encoding
			const zigzag = (value << 1) ^ (value >> 31);
			parts.push(encodeVarInt(zigzag));
		}
	}

	return concatenateUint8Arrays(parts);
}

/**
 * Encodes a DisconnectRequest message
 */
export function encodeDisconnectRequest(): Uint8Array {
	// Empty message
	return new Uint8Array(0);
}

/**
 * Encodes a SendFrameRequest message (legacy)
 */
export function encodeSendFrameRequest(request: SendFrameRequest): Uint8Array {
	const parts: Uint8Array[] = [];

	// Field 1: repeated uint32 frame
	for (const frameValue of request.frame) {
		// Field number 1, wire type 0 (varint)
		parts.push(encodeVarInt((1 << 3) | 0));
		parts.push(encodeVarInt(frameValue));
	}

	return concatenateUint8Arrays(parts);
}

/**
 * Decodes a SendFrameResponse message (legacy)
 */
export function decodeSendFrameResponse(data: Uint8Array): SendFrameResponse {
	const result: SendFrameResponse = { success: false };
	let pos = 0;

	while (pos < data.length) {
		const tag = decodeVarInt(data, pos);
		pos += tag.bytesRead;

		const fieldNumber = tag.value >>> 3;
		const wireType = tag.value & 0x7;

		switch (fieldNumber) {
			case 1: // success (bool)
				if (wireType !== 0) {
					throw new ZWaveError(
						"Invalid wire type for success field",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const success = decodeVarInt(data, pos);
				pos += success.bytesRead;
				result.success = success.value !== 0;
				break;

			case 2: // error_message (string)
				if (wireType !== 2) {
					throw new ZWaveError(
						"Invalid wire type for error_message field",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const length = decodeVarInt(data, pos);
				pos += length.bytesRead;
				result.errorMessage = new TextDecoder().decode(
					data.slice(pos, pos + length.value),
				);
				pos += length.value;
				break;

			default:
				pos = skipField(data, pos, wireType);
		}
	}

	return result;
}

/**
 * Decodes a FrameData message (legacy)
 */
export function decodeFrameData(data: Uint8Array): FrameData {
	const result: FrameData = { frame: [] };
	let pos = 0;

	while (pos < data.length) {
		const tag = decodeVarInt(data, pos);
		pos += tag.bytesRead;

		const fieldNumber = tag.value >>> 3;
		const wireType = tag.value & 0x7;

		switch (fieldNumber) {
			case 1: // frame (repeated uint32)
				if (wireType !== 0) {
					throw new ZWaveError(
						"Invalid wire type for frame field",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const frameValue = decodeVarInt(data, pos);
				pos += frameValue.bytesRead;
				result.frame.push(frameValue.value);
				break;

			case 2: // timestamp (uint64)
				if (wireType !== 0) {
					throw new ZWaveError(
						"Invalid wire type for timestamp field",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const timestamp = decodeVarInt(data, pos);
				pos += timestamp.bytesRead;
				result.timestamp = timestamp.value;
				break;

			default:
				pos = skipField(data, pos, wireType);
		}
	}

	return result;
}

/**
 * Helper function to skip unknown fields
 */
function skipField(data: Uint8Array, pos: number, wireType: number): number {
	switch (wireType) {
		case 0: // varint
			const varint = decodeVarInt(data, pos);
			return pos + varint.bytesRead;
		case 1: // 64-bit fixed
			return pos + 8;
		case 2: // length-delimited
			const length = decodeVarInt(data, pos);
			return pos + length.bytesRead + length.value;
		case 5: // 32-bit fixed
			return pos + 4;
		default:
			throw new ZWaveError(
				`Unsupported wire type: ${wireType}`,
				ZWaveErrorCodes.Argument_Invalid,
			);
	}
}

/**
 * Helper function to concatenate Uint8Arrays
 */
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}
