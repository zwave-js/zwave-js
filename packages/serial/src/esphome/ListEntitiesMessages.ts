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
	decodeFixed32Field,
	decodeLengthDelimitedField,
	decodeStringField,
	decodeVarInt,
	encodeFixed32Field,
	encodeLengthDelimitedField,
	encodeStringField,
	encodeVarintField,
	parseProtobufMessage,
	skipField,
} from "./ProtobufHelpers.js";

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

export interface ListEntitiesServicesArgument {
	name: string;
	type: ServiceArgType;
}

@messageType(ESPHomeMessageType.ListEntitiesRequest)
export class ListEntitiesRequest extends ESPHomeMessage {}

@messageType(ESPHomeMessageType.ListEntitiesDoneResponse)
export class ListEntitiesDoneResponse extends ESPHomeMessage {}

export interface ListEntitiesServicesResponseOptions
	extends ESPHomeMessageBaseOptions
{
	name: string;
	key: number;
	args: ListEntitiesServicesArgument[];
}

@messageType(ESPHomeMessageType.ListEntitiesServicesResponse)
export class ListEntitiesServicesResponse extends ESPHomeMessage {
	public constructor(options: ListEntitiesServicesResponseOptions) {
		super(options);
		this.name = options.name;
		this.key = options.key;
		this.args = options.args;
	}

	public static from(raw: ESPHomeMessageRaw): ListEntitiesServicesResponse {
		let name = "";
		let key = 0;
		const args: ListEntitiesServicesArgument[] = [];

		parseProtobufMessage(
			raw.payload,
			(fieldNumber, wireType, data, offset) => {
				switch (fieldNumber) {
					case 1: // name (string)
						if (wireType !== WireType.LengthDelimited) {
							throw new ZWaveError(
								"Invalid wire type for name",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						const nameResult = decodeStringField(data, offset);
						name = nameResult.value;
						return offset + nameResult.bytesRead;

					case 2: // key (fixed32)
						if (wireType !== WireType.Fixed32) {
							throw new ZWaveError(
								"Invalid wire type for key",
								ZWaveErrorCodes.Argument_Invalid,
							);
						}
						const keyResult = decodeFixed32Field(data, offset);
						key = keyResult.value;
						return offset + keyResult.bytesRead;

					case 3: // args (repeated ListEntitiesServicesArgument)
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
							decodeListEntitiesServicesArgument(argResult.value),
						);
						return offset + argResult.bytesRead;

					default:
						return skipField(data, offset, wireType);
				}
			},
		);

		return new this({
			name,
			key,
			args,
		});
	}

	public name: string;
	public key: number;
	public args: ListEntitiesServicesArgument[];

	public serialize(): Bytes {
		const parts: (Uint8Array | number[])[] = [];

		// Field 1: name (string)
		if (this.name) {
			parts.push(encodeStringField(1, this.name));
		}

		// Field 2: key (fixed32)
		parts.push(encodeFixed32Field(2, this.key));

		// Field 3: args (repeated ListEntitiesServicesArgument)
		for (const arg of this.args) {
			const argData = encodeListEntitiesServicesArgument(arg);
			parts.push(encodeLengthDelimitedField(3, argData));
		}

		this.payload = Bytes.concat(parts);
		return super.serialize();
	}
}

/**
 * Decodes a ListEntitiesServicesArgument message
 */
function decodeListEntitiesServicesArgument(
	data: Uint8Array,
): ListEntitiesServicesArgument {
	let name = "";
	let type = ServiceArgType.BOOL;

	parseProtobufMessage(data, (fieldNumber, wireType, data, offset) => {
		switch (fieldNumber) {
			case 1: // name (string)
				if (wireType !== WireType.LengthDelimited) {
					throw new ZWaveError(
						"Invalid wire type for argument name",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const nameResult = decodeStringField(data, offset);
				name = nameResult.value;
				return offset + nameResult.bytesRead;

			case 2: // type (enum)
				if (wireType !== WireType.Varint) {
					throw new ZWaveError(
						"Invalid wire type for argument type",
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
				const typeResult = decodeVarInt(data, offset);
				type = typeResult.value as ServiceArgType;
				return offset + typeResult.bytesRead;

			default:
				return skipField(data, offset, wireType);
		}
	});

	return { name, type };
}

/**
 * Encodes a ListEntitiesServicesArgument message
 */
function encodeListEntitiesServicesArgument(
	arg: ListEntitiesServicesArgument,
): Uint8Array {
	const parts: (Uint8Array | number[])[] = [];

	// Field 1: name (string)
	if (arg.name) {
		parts.push(encodeStringField(1, arg.name));
	}

	// Field 2: type (enum)
	parts.push(encodeVarintField(2, arg.type));

	return Bytes.concat(parts);
}
