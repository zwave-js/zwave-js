import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { decodeVarInt, encodeVarInt } from "./ProtobufHelpers.js";

/**
 * ESPHome message types enum
 */
export enum ESPHomeMessageType {
	// Connection messages
	HelloRequest = 1,
	HelloResponse = 2,
	DisconnectRequest = 5,
	DisconnectResponse = 6,
	PingRequest = 7,
	PingResponse = 8,
	DeviceInfoRequest = 9,
	DeviceInfoResponse = 10,

	// Z-Wave proxy
	ZWaveProxyFrameFromDevice = 128,
	ZWaveProxyFrameToDevice = 129,
	ZWaveProxySubscribeRequest = 130,
	ZWaveProxyUnsubscribeRequest = 131,
}

/**
 * Represents a raw ESPHome message with minimal parsing
 */
export class ESPHomeMessageRaw {
	public constructor(
		public readonly messageType: ESPHomeMessageType,
		public readonly payload: Bytes,
	) {}

	/**
	 * Parses a raw ESPHome frame into a MessageRaw instance
	 */
	public static parse(data: Uint8Array): ESPHomeMessageRaw {
		if (data.length < 3) {
			throw new ZWaveError(
				"Frame too short",
				ZWaveErrorCodes.PacketFormat_Truncated,
			);
		}

		let offset = 0;

		// Check indicator byte
		if (data[offset] !== 0x00) {
			throw new ZWaveError(
				`Invalid frame indicator: expected 0x00, got 0x${
					data[offset].toString(16).padStart(2, "0")
				}`,
				ZWaveErrorCodes.PacketFormat_Invalid,
			);
		}
		offset++;

		// Decode payload size
		const payloadSize = decodeVarInt(data, offset);
		offset += payloadSize.bytesRead;

		// Decode message type
		const messageType = decodeVarInt(data, offset);
		offset += messageType.bytesRead;

		// Extract payload
		if (offset + payloadSize.value > data.length) {
			throw new ZWaveError(
				"Could not deserialize the message because it was truncated",
				ZWaveErrorCodes.PacketFormat_Truncated,
			);
		}

		const payload = Bytes.view(
			data.slice(offset, offset + payloadSize.value),
		);

		return new ESPHomeMessageRaw(messageType.value, payload);
	}
}

/**
 * Base interface for ESPHome message options
 */
export interface ESPHomeMessageBaseOptions {
	messageType?: ESPHomeMessageType;
}

/**
 * Interface for message options including payload
 */
export interface ESPHomeMessageOptions extends ESPHomeMessageBaseOptions {
	payload?: Bytes;
}

export type ESPHomeMessageConstructor<T extends ESPHomeMessage> =
	& typeof ESPHomeMessage
	& {
		new (options: ESPHomeMessageBaseOptions): T;
	};

/**
 * Base class for all ESPHome messages
 */
export class ESPHomeMessage {
	public constructor(options: ESPHomeMessageOptions = {}) {
		const messageType = options.messageType ?? getMessageType(this);

		if (messageType == undefined) {
			throw new ZWaveError(
				"An ESPHome message must have a given or predefined message type",
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		this.messageType = messageType;
		this.payload = options.payload ?? new Bytes();
	}

	public messageType: ESPHomeMessageType;
	public payload: Bytes;

	/**
	 * Parses a raw ESPHome message and returns the appropriate message instance
	 */
	public static parse(data: Uint8Array): ESPHomeMessage {
		const raw = ESPHomeMessageRaw.parse(data);
		const Constructor = getESPHomeMessageConstructor(raw.messageType)
			?? ESPHomeMessage;
		return Constructor.from(raw);
	}

	/**
	 * Creates an instance of the message that is serialized in the given raw message
	 */
	public static from(raw: ESPHomeMessageRaw): ESPHomeMessage {
		return new this({
			messageType: raw.messageType,
			payload: raw.payload,
		});
	}

	/**
	 * Serializes this message into an ESPHome frame
	 */
	public serialize(): Bytes {
		return Bytes.concat([
			Bytes.from([0x00]), // Indicator byte
			encodeVarInt(this.payload.length),
			encodeVarInt(this.messageType),
			this.payload,
		]);
	}
}

// Storage for message type decorators
const MESSAGE_TYPE_STORAGE = new Map<any, ESPHomeMessageType>();
const MESSAGE_CONSTRUCTOR_STORAGE = new Map<
	ESPHomeMessageType,
	ESPHomeMessageConstructor<ESPHomeMessage>
>();

/**
 * Decorator to set the message type for a message class
 */
export function messageType(type: ESPHomeMessageType) {
	return function(target: any): any {
		MESSAGE_TYPE_STORAGE.set(target, type);
		MESSAGE_CONSTRUCTOR_STORAGE.set(type, target);
		return target;
	};
}

/**
 * Gets the message type for a message instance/class
 */
function getMessageType(msg: any): ESPHomeMessageType | undefined {
	return MESSAGE_TYPE_STORAGE.get(msg.constructor);
}

/**
 * Looks up the message constructor for a given ESPHome message type
 */
function getESPHomeMessageConstructor(
	messageType: ESPHomeMessageType,
): ESPHomeMessageConstructor<ESPHomeMessage> | undefined {
	return MESSAGE_CONSTRUCTOR_STORAGE.get(messageType);
}
