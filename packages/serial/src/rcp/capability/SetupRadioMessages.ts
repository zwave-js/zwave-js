import {
	ChannelConfiguration,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	type MessageRecord,
	type ProtocolDataRate,
	RFRegion,
	createSimpleReflectionDecorator,
	znifferProtocolDataRateToProtocolDataRate,
} from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import {
	RCPMessage,
	type RCPMessageBaseOptions,
	type RCPMessageConstructor,
	type RCPMessageEncodingContext,
	type RCPMessageParsingContext,
	type RCPMessageRaw,
	expectedRcpResponse,
	rcpMessageTypes,
} from "../../message/RCPMessages.js";
import type { SuccessIndicator } from "../../message/SuccessIndicator.js";

export enum SetupRadioCommand {
	SetRegion = 1,
	GetRegion = 2,
}

export interface ChannelInfo {
	channel: number;
	frequency: number;
	dataRate: ProtocolDataRate;
}

// We need to define the decorators for Requests and Responses separately
const {
	decorator: subCommandRequest,
	lookupConstructor: getSubCommandRequestConstructor,
	lookupValue: getSubCommandForRequest,
} = createSimpleReflectionDecorator<
	typeof SetupRadioRequest,
	[command: SetupRadioCommand],
	RCPMessageConstructor<SetupRadioRequest>
>({
	name: "subCommandRequest",
});

const {
	decorator: subCommandResponse,
	lookupConstructor: getSubCommandResponseConstructor,
	lookupValue: getSubCommandForResponse,
} = createSimpleReflectionDecorator<
	typeof SetupRadioResponse,
	[command: SetupRadioCommand],
	RCPMessageConstructor<SetupRadioResponse>
>({
	name: "subCommandResponse",
});

function testResponseForSetupRadioRequest(
	sent: RCPMessage,
	received: RCPMessage,
) {
	if (!(received instanceof SetupRadioResponse)) return false;
	return (sent as SetupRadioRequest).command === received.command;
}

export interface SetupRadioRequestOptions {
	command?: SetupRadioCommand;
}

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.SetupRadio)
// @priority(MessagePriority.Controller)
@expectedRcpResponse(testResponseForSetupRadioRequest)
export class SetupRadioRequest extends RCPMessage {
	public constructor(
		options: SetupRadioRequestOptions & RCPMessageBaseOptions = {},
	) {
		super(options);
		this.command = options.command ?? getSubCommandForRequest(this)!;
	}

	public static from(
		raw: RCPMessageRaw,
		ctx: RCPMessageParsingContext,
	): SetupRadioRequest {
		const command: SetupRadioCommand = raw.payload[0];
		const payload = raw.payload.subarray(1);

		const CommandConstructor = getSubCommandRequestConstructor(
			command,
		);
		if (CommandConstructor) {
			return CommandConstructor.from(
				raw.withPayload(payload),
				ctx,
			) as SetupRadioRequest;
		}

		const ret = new SetupRadioRequest({
			command,
		});
		ret.payload = payload;
		return ret;
	}

	public command: SetupRadioCommand;

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([
			Bytes.from([this.command]),
			this.payload,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const message: MessageRecord = {
			command: getEnumMemberName(SetupRadioCommand, this.command),
		};
		if (this.payload.length > 0) {
			message.payload = `0x${this.payload.toString("hex")}`;
		}
		return {
			...super.toLogEntry(),
			message,
		};
	}
}

export interface SetupRadioResponseOptions {
	command?: SetupRadioCommand;
}

@rcpMessageTypes(RCPMessageType.Response, RCPFunctionType.SetupRadio)
export class SetupRadioResponse extends RCPMessage {
	public constructor(
		options: SetupRadioResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.command = options.command ?? getSubCommandForResponse(this)!;
	}

	public static from(
		raw: RCPMessageRaw,
		ctx: RCPMessageParsingContext,
	): SetupRadioResponse {
		const command: SetupRadioCommand = raw.payload[0];
		const payload = raw.payload.subarray(1);

		const CommandConstructor = getSubCommandResponseConstructor(
			command,
		);
		if (CommandConstructor) {
			return CommandConstructor.from(
				raw.withPayload(payload),
				ctx,
			) as SetupRadioResponse;
		}

		const ret = new SetupRadioResponse({
			command,
		});
		ret.payload = payload;
		return ret;
	}

	public command: SetupRadioCommand;

	public toLogEntry(): MessageOrCCLogEntry {
		const message: MessageRecord = {
			command: getEnumMemberName(SetupRadioCommand, this.command),
		};
		if (this.payload.length > 0) {
			message.payload = `0x${this.payload.toString("hex")}`;
		}
		return {
			...super.toLogEntry(),
			message,
		};
	}
}

// =============================================================================

@subCommandRequest(SetupRadioCommand.GetRegion)
export class SetupRadio_GetRegionRequest extends SetupRadioRequest {}

export interface SetupRadio_GetRegionResponseOptions {
	region: RFRegion;
	channelConfig: ChannelConfiguration;
	channels: ChannelInfo[];
}

@subCommandResponse(SetupRadioCommand.GetRegion)
export class SetupRadio_GetRegionResponse extends SetupRadioResponse {
	public constructor(
		options: SetupRadio_GetRegionResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.region = options.region;
		this.channelConfig = options.channelConfig;
		this.channels = options.channels;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): SetupRadio_GetRegionResponse {
		const region: RFRegion = raw.payload[0];
		const channelConfig: ChannelConfiguration = raw.payload[1];
		const numChannels = raw.payload[2];
		const channels: ChannelInfo[] = [];
		let offset = 3;
		for (let ch = 0; ch < numChannels; ch++) {
			const frequency = raw.payload.readUInt32BE(offset);
			offset += 4;
			// The firmware uses the RAIL enum internally, which is equivalent to ZnifferProtocolDataRate
			const dataRate = znifferProtocolDataRateToProtocolDataRate(
				raw.payload[offset++],
			);
			channels.push({ channel: ch, frequency, dataRate });
		}

		return new this({
			region,
			channelConfig,
			channels,
		});
	}

	public region: RFRegion;
	public channelConfig: ChannelConfiguration;
	public channels: ChannelInfo[];

	// public toLogEntry(): MessageOrCCLogEntry {
	// 	const ret = { ...super.toLogEntry() };
	// 	const message = ret.message!;
	// 	message.region = getEnumMemberName(RFRegion, this.region);
	// 	message["channel config"] = getEnumMemberName(
	// 		ChannelConfiguration,
	// 		this.channelConfig,
	// 	);
	// 	message.channels = this.channels.map((ch) =>
	// 		`\n  channel ${ch.channel} (${
	// 			(ch.frequency / 1e6).toFixed(2)
	// 		} MHz): ${protocolDataRateToString(ch.dataRate)}`
	// 	).join("");
	// 	delete message.payload;
	// 	return ret;
	// }
}

// =============================================================================

export interface SetupRadio_SetRegionOptions {
	region: RFRegion;
	channelConfig: ChannelConfiguration;
}

@subCommandRequest(SetupRadioCommand.SetRegion)
export class SetupRadio_SetRegionRequest extends SetupRadioRequest {
	public constructor(
		options: SetupRadio_SetRegionOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.region = options.region;
		this.channelConfig = options.channelConfig;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): SetupRadio_SetRegionRequest {
		const region: RFRegion = raw.payload[0];
		const channelConfig: ChannelConfiguration = raw.payload[1];

		return new this({
			region,
			channelConfig,
		});
	}

	public region: RFRegion;
	public channelConfig: ChannelConfiguration;

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([this.region, this.channelConfig]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = { ...super.toLogEntry() };
		const message = ret.message!;
		message.region = getEnumMemberName(RFRegion, this.region);
		message["channel config"] = getEnumMemberName(
			ChannelConfiguration,
			this.channelConfig,
		);
		delete message.payload;
		return ret;
	}
}

export type SetupRadio_SetRegionResponseOptions = {
	success: false;
	channels?: undefined;
} | {
	success: true;
	channels: ChannelInfo[];
};

@subCommandResponse(SetupRadioCommand.SetRegion)
export class SetupRadio_SetRegionResponse extends SetupRadioResponse
	implements SuccessIndicator
{
	public constructor(
		options: SetupRadio_SetRegionResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.success = options.success;
		this.channels = options.channels;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): SetupRadio_SetRegionResponse {
		const success = raw.payload[0] !== 0;
		if (!success) {
			return new this({
				success: false,
			});
		}

		const numChannels = raw.payload[1];
		const channels: ChannelInfo[] = [];
		let offset = 2;
		for (let ch = 0; ch < numChannels; ch++) {
			const frequency = raw.payload.readUInt32BE(offset);
			offset += 4;
			// The firmware uses the RAIL enum internally, which is equivalent to ZnifferProtocolDataRate
			const dataRate = znifferProtocolDataRateToProtocolDataRate(
				raw.payload[offset++],
			);
			channels.push({ channel: ch, frequency, dataRate });
		}

		return new this({
			success,
			channels,
		});
	}

	isOK(): boolean {
		return this.success;
	}

	public success: boolean;
	public channels: MaybeNotKnown<ChannelInfo[]>;

	// public toLogEntry(): MessageOrCCLogEntry {
	// 	const ret = { ...super.toLogEntry() };
	// 	const message = ret.message!;
	// 	message.success = this.success;
	// 	if (this.channels) {
	// 		message.channels = this.channels.map((ch) =>
	// 			`\n  channel ${ch.channel} (${
	// 				(ch.frequency / 1e6).toFixed(2)
	// 			} MHz): ${protocolDataRateToString(ch.dataRate)}`
	// 		).join("");
	// 	}
	// 	delete message.payload;
	// 	return ret;
	// }
}
