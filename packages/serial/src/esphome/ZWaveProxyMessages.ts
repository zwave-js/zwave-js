import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import {
	ESPHomeMessage,
	type ESPHomeMessageBaseOptions,
	type ESPHomeMessageRaw,
	ESPHomeMessageType,
	messageType,
} from "./ESPHomeMessage.js";
import {
	WireType,
	decodeLengthDelimitedField,
	decodeVarInt,
	encodeStringField,
	encodeVarintField,
	parseProtobufMessage,
	skipField,
} from "./ProtobufHelpers.js";

export interface ZWaveProxyToDeviceRequestOptions
	extends ESPHomeMessageBaseOptions
{
	data: Bytes;
}

@messageType(ESPHomeMessageType.ZWaveProxyToDeviceRequest)
export class ZWaveProxyToDeviceRequest extends ESPHomeMessage {
	public constructor(options: ZWaveProxyToDeviceRequestOptions) {
		super(options);
		this.data = options.data;
	}

	public static from(raw: ESPHomeMessageRaw): ZWaveProxyToDeviceRequest {
		let data = new Bytes();

		parseProtobufMessage(
			raw.payload,
			(fieldNumber, wireType, dataBuffer, offset) => {
				switch (fieldNumber) {
					case 1: // data (bytes as string on wire)
						if (wireType !== WireType.LengthDelimited) {
							throw new ZWaveError(
								"Invalid wire type for data",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						const dataResult = decodeLengthDelimitedField(
							dataBuffer,
							offset,
						);
						data = Bytes.from(dataResult.value);
						return offset + dataResult.bytesRead;

					default:
						return skipField(dataBuffer, offset, wireType);
				}
			},
		);

		return new this({ data });
	}

	public data: Bytes;

	public serialize(): Bytes {
		const parts: (Uint8Array | number[])[] = [];

		// Field 1: data (bytes encoded as string field on wire)
		if (this.data.length > 0) {
			parts.push(encodeStringField(1, this.data));
		}

		this.payload = Bytes.concat(parts);
		return super.serialize();
	}
}

@messageType(ESPHomeMessageType.ZWaveProxyToDeviceResponse)
export class ZWaveProxyToDeviceResponse extends ESPHomeMessage {}

export interface ZWaveProxyFromDeviceRequestOptions
	extends ESPHomeMessageBaseOptions
{
	data: Bytes;
}

@messageType(ESPHomeMessageType.ZWaveProxyFromDeviceRequest)
export class ZWaveProxyFromDeviceRequest extends ESPHomeMessage {
	public constructor(options: ZWaveProxyFromDeviceRequestOptions) {
		super(options);
		this.data = options.data;
	}

	public static from(raw: ESPHomeMessageRaw): ZWaveProxyFromDeviceRequest {
		let data = new Bytes();

		parseProtobufMessage(
			raw.payload,
			(fieldNumber, wireType, dataBuffer, offset) => {
				switch (fieldNumber) {
					case 1: // data (bytes as string on wire)
						if (wireType !== WireType.LengthDelimited) {
							throw new ZWaveError(
								"Invalid wire type for data",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						const dataResult = decodeLengthDelimitedField(
							dataBuffer,
							offset,
						);
						data = Bytes.from(dataResult.value);
						return offset + dataResult.bytesRead;

					default:
						return skipField(dataBuffer, offset, wireType);
				}
			},
		);

		return new this({ data });
	}

	public data: Bytes;

	public serialize(): Bytes {
		const parts: (Uint8Array | number[])[] = [];

		// Field 1: data (bytes encoded as string field on wire)
		if (this.data.length > 0) {
			parts.push(encodeStringField(1, this.data));
		}

		this.payload = Bytes.concat(parts);
		return super.serialize();
	}
}

@messageType(ESPHomeMessageType.ZWaveProxyFromDeviceResponse)
export class ZWaveProxyFromDeviceResponse extends ESPHomeMessage {}

export interface ZWaveProxySubscribeRequestOptions
	extends ESPHomeMessageBaseOptions
{
	flags?: number;
}

@messageType(ESPHomeMessageType.ZWaveProxySubscribeRequest)
export class ZWaveProxySubscribeRequest extends ESPHomeMessage {
	public constructor(options: ZWaveProxySubscribeRequestOptions = {}) {
		super(options);
		this.flags = options.flags ?? 0;
	}

	public static from(raw: ESPHomeMessageRaw): ZWaveProxySubscribeRequest {
		let flags = 0;

		parseProtobufMessage(
			raw.payload,
			(fieldNumber, wireType, dataBuffer, offset) => {
				switch (fieldNumber) {
					case 1: // flags (uint32)
						if (wireType !== WireType.Varint) {
							throw new ZWaveError(
								"Invalid wire type for flags",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						const flagsResult = decodeVarInt(
							dataBuffer,
							offset,
						);
						flags = flagsResult.value;
						return offset + flagsResult.bytesRead;

					default:
						return skipField(dataBuffer, offset, wireType);
				}
			},
		);

		return new this({ flags });
	}

	public flags: number;

	public serialize(): Bytes {
		const parts: (Uint8Array | number[])[] = [];

		// Field 1: flags (uint32)
		if (this.flags > 0) {
			parts.push(encodeVarintField(1, this.flags));
		}

		this.payload = Bytes.concat(parts);
		return super.serialize();
	}
}

@messageType(ESPHomeMessageType.ZWaveProxyUnsubscribeRequest)
export class ZWaveProxyUnsubscribeRequest extends ESPHomeMessage {}
