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
	decodeSignedVarint,
	encodeFixed32Field,
	encodeLengthDelimitedField,
	encodeSignedVarintField,
	parseProtobufMessage,
	skipField,
} from "./ProtobufHelpers.js";

export interface ExecuteServiceArgument {
	intArray?: number[];
}

export interface ExecuteServiceRequestOptions
	extends ESPHomeMessageBaseOptions
{
	key: number;
	args: ExecuteServiceArgument[];
}

@messageType(ESPHomeMessageType.ExecuteServiceRequest)
export class ExecuteServiceRequest extends ESPHomeMessage {
	public constructor(options: ExecuteServiceRequestOptions) {
		super(options);
		this.key = options.key;
		this.args = options.args;
	}

	public static from(raw: ESPHomeMessageRaw): ExecuteServiceRequest {
		let key = 0;
		const args: ExecuteServiceArgument[] = [];

		parseProtobufMessage(
			raw.payload,
			(fieldNumber, wireType, data, offset) => {
				switch (fieldNumber) {
					case 1: // key (fixed32)
						if (wireType !== WireType.Fixed32) {
							throw new ZWaveError(
								"Invalid wire type for key",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						// Read fixed32 as little-endian
						key = Bytes.view(data).readUInt32LE(offset);
						return offset + 4;

					case 2: // args (repeated ExecuteServiceArgument)
						if (wireType !== WireType.LengthDelimited) {
							throw new ZWaveError(
								"Invalid wire type for args",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						const argResult = decodeLengthDelimitedField(
							data,
							offset,
						);
						args.push(
							decodeExecuteServiceArgument(argResult.value),
						);
						return offset + argResult.bytesRead;

					default:
						return skipField(data, offset, wireType);
				}
			},
		);

		return new this({
			key,
			args,
		});
	}

	public key: number;
	public args: ExecuteServiceArgument[];

	public serialize(): Bytes {
		const parts: (Uint8Array | number[])[] = [];

		// Field 1: key (fixed32)
		parts.push(encodeFixed32Field(1, this.key));

		// Field 2: args (repeated ExecuteServiceArgument)
		for (const arg of this.args) {
			const argData = encodeExecuteServiceArgument(arg);
			parts.push(encodeLengthDelimitedField(2, argData));
		}

		this.payload = Bytes.concat(parts);
		return super.serialize();
	}
}

/**
 * Decodes an ExecuteServiceArgument message
 */
function decodeExecuteServiceArgument(
	data: Uint8Array,
): ExecuteServiceArgument {
	const result: ExecuteServiceArgument = {};

	parseProtobufMessage(data, (fieldNumber, wireType, data, offset) => {
		switch (fieldNumber) {
			case 7: // int_array (repeated sint32)
				if (wireType !== WireType.Varint) {
					throw new ZWaveError(
						"Invalid wire type for intArray",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				// Initialize array if it doesn't exist
				if (!result.intArray) {
					result.intArray = [];
				}
				const valueResult = decodeSignedVarint(data, offset);
				result.intArray.push(valueResult.value);
				return offset + valueResult.bytesRead;

			default:
				return skipField(data, offset, wireType);
		}
	});

	return result;
}

/**
 * Encodes an ExecuteServiceArgument message
 */
function encodeExecuteServiceArgument(arg: ExecuteServiceArgument): Uint8Array {
	const parts: (Uint8Array | number[])[] = [];

	// Field 7: int_array (repeated sint32)
	if (arg.intArray) {
		for (const value of arg.intArray) {
			parts.push(encodeSignedVarintField(7, value));
		}
	}

	return Bytes.concat(parts);
}
