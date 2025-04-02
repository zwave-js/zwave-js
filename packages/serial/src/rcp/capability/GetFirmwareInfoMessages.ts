import { encodeBitMask, parseBitMask } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import {
	RCPMessage,
	type RCPMessageBaseOptions,
	type RCPMessageEncodingContext,
	type RCPMessageParsingContext,
	type RCPMessageRaw,
	expectedRcpResponse,
	rcpMessageTypes,
} from "../../message/RCPMessages.js";

export enum RadioLibrary {
	RAIL,
}

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.GetFirmwareInfo)
// @priority(MessagePriority.Normal)
@expectedRcpResponse(RCPFunctionType.GetFirmwareInfo)
export class GetFirmwareInfoRequest extends RCPMessage {}

export interface GetFirmwareInfoResponseOptions {
	rcpFirmwareVersion: string;
	radioLibrary: RadioLibrary;
	radioLibraryVersion: string;
	supportedFunctionTypes: RCPFunctionType[];
}

@rcpMessageTypes(RCPMessageType.Response, RCPFunctionType.GetFirmwareInfo)
export class GetFirmwareInfoResponse extends RCPMessage {
	public constructor(
		options: GetFirmwareInfoResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.rcpFirmwareVersion = options.rcpFirmwareVersion;
		this.radioLibrary = options.radioLibrary;
		this.radioLibraryVersion = options.radioLibraryVersion;
		this.supportedFunctionTypes = options.supportedFunctionTypes;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): GetFirmwareInfoResponse {
		let offset = 0;
		const majorVersion = raw.payload[offset++];
		const minorVersion = raw.payload[offset++];
		const patchVersion = raw.payload[offset++];
		const rcpFirmwareVersion =
			`${majorVersion}.${minorVersion}.${patchVersion}`;

		const radioLibrary = raw.payload[offset++];

		const radioMajorVersion = raw.payload[offset++];
		const radioMinorVersion = raw.payload[offset++];
		const radioPatchVersion = raw.payload[offset++];
		const radioLibraryVersion =
			`${radioMajorVersion}.${radioMinorVersion}.${radioPatchVersion}`;

		const functionTypeBitmaskLength = raw.payload[offset++];
		const supportedFunctionTypes: RCPFunctionType[] = parseBitMask(
			raw.payload.slice(offset, offset + functionTypeBitmaskLength),
		);

		return new this({
			rcpFirmwareVersion,
			radioLibrary,
			radioLibraryVersion,
			supportedFunctionTypes,
		});
	}

	public rcpFirmwareVersion: string;
	public radioLibrary: RadioLibrary;
	public radioLibraryVersion: string;
	public supportedFunctionTypes: RCPFunctionType[];

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		const rcpVersionBytes = this.rcpFirmwareVersion
			.split(".", 2)
			.map((str) => parseInt(str));
		const radioVersionBytes = this.radioLibraryVersion
			.split(".", 2)
			.map((str) => parseInt(str));

		const functionTypeBitmask = encodeBitMask(this.supportedFunctionTypes);

		this.payload = Bytes.concat([
			rcpVersionBytes,
			[this.radioLibrary],
			radioVersionBytes,
			[functionTypeBitmask.length],
			functionTypeBitmask,
		]);

		return super.serialize(ctx);
	}

	// public toLogEntry(): MessageOrCCLogEntry {
	// 	return {
	// 		...super.toLogEntry(),
	// 		message: {
	// 			"firmware version": this.firmwareVersion,
	// 			"supported function types": this.supportedFunctionTypes,
	// 		 },
	// 	};
	// }
}
