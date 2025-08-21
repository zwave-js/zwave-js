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
	encodeStringField,
	parseProtobufMessage,
	skipField,
} from "./ProtobufHelpers.js";

export interface ZWaveProxyWriteRequestOptions
	extends ESPHomeMessageBaseOptions
{
	data: Bytes;
}

@messageType(ESPHomeMessageType.ZWaveProxyWriteRequest)
export class ZWaveProxyWriteRequest extends ESPHomeMessage {
	public constructor(options: ZWaveProxyWriteRequestOptions) {
		super(options);
		this.data = options.data;
	}

	public static from(raw: ESPHomeMessageRaw): ZWaveProxyWriteRequest {
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

@messageType(ESPHomeMessageType.ZWaveProxyWriteResponse)
export class ZWaveProxyWriteResponse extends ESPHomeMessage {}
