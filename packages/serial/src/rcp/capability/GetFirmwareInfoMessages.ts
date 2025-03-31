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

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.GetFirmwareInfo)
// @priority(MessagePriority.Normal)
@expectedRcpResponse(RCPFunctionType.GetFirmwareInfo)
export class GetFirmwareInfoRequest extends RCPMessage {}

export interface GetFirmwareInfoResponseOptions {
	firmwareType: number;
	firmwareVersion: string;
	supportedFunctionTypes: RCPFunctionType[];
}

@rcpMessageTypes(RCPMessageType.Response, RCPFunctionType.GetFirmwareInfo)
export class GetFirmwareInfoResponse extends RCPMessage {
	public constructor(
		options: GetFirmwareInfoResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.firmwareType = options.firmwareType;
		this.firmwareVersion = options.firmwareVersion;
		this.supportedFunctionTypes = options.supportedFunctionTypes;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): GetFirmwareInfoResponse {
		const firmwareType = raw.payload[0];
		const majorVersion = raw.payload[1];
		const minorVersion = raw.payload[2];
		const patchVersion = raw.payload[3];
		const firmwareVersion =
			`${majorVersion}.${minorVersion}.${patchVersion}`;

		const functionTypeBitmaskLength = raw.payload[4];
		const supportedFunctionTypes: RCPFunctionType[] = parseBitMask(
			raw.payload.slice(5, 5 + functionTypeBitmaskLength),
		);

		return new this({
			firmwareType,
			firmwareVersion,
			supportedFunctionTypes,
		});
	}

	public firmwareType: number;
	public firmwareVersion: string;
	public supportedFunctionTypes: RCPFunctionType[];

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		const firmwareBytes = this.firmwareVersion
			.split(".", 2)
			.map((str) => parseInt(str));
		const functionTypeBitmask = encodeBitMask(this.supportedFunctionTypes);

		this.payload = Bytes.concat([
			[1], // firmware type RCP
			firmwareBytes,
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
