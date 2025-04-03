import { type MessageOrCCLogEntry } from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import {
	RCPMessage,
	type RCPMessageBaseOptions,
	type RCPMessageEncodingContext,
	type RCPMessageParsingContext,
	type RCPMessageRaw,
	expectedRcpCallback,
	expectedRcpResponse,
	rcpMessageTypes,
} from "../../message/RCPMessages.js";
import { type SuccessIndicator } from "../../message/SuccessIndicator.js";

export enum TransmitResponseStatus {
	// The frame was successfully queued for transmission
	Queued = 0x00,
	// The TX FIFO is busy, cannot queue the frame
	Busy = 0x01,
	// The frame is too long to be transmitted
	Overflow = 0x02,
	// Invalid TX channel selected
	InvalidChannel = 0x03,
	// Other invalid parameters were passed
	InvalidParam = 0x04,
}

export enum TransmitCallbackStatus {
	// Underlying radio errors
	Aborted = 0xf0,
	Blocked = 0xf1,
	Underflow = 0xf2,
	ChannelBusy = 0xf3,
	UnknownError = 0xfe,

	// Transmission completed
	Completed = 0xff,
}

export interface TransmitRequestOptions {
	channel: number;
	data: Uint8Array;
}

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.Transmit)
// @priority(MessagePriority.Normal)
@expectedRcpResponse(RCPFunctionType.Transmit)
@expectedRcpCallback(RCPFunctionType.Transmit)
export class TransmitRequest extends RCPMessage {
	public constructor(
		options: TransmitRequestOptions & RCPMessageBaseOptions,
	) {
		super(options);

		this.channel = options.channel;
		this.data = options.data;
	}

	public channel: number;
	public data: Uint8Array;

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([
			[this.channel],
			this.data,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				channel: this.channel,
				data: `(${this.data.length} bytes)`,
			},
		};
	}
}

export interface TransmitResponseOptions {
	status: TransmitResponseStatus;
}

@rcpMessageTypes(RCPMessageType.Response, RCPFunctionType.Transmit)
export class TransmitResponse extends RCPMessage implements SuccessIndicator {
	public constructor(
		options: TransmitResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.status = options.status;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): TransmitResponse {
		const status = raw.payload[0];

		return new this({
			status,
		});
	}

	public status: TransmitResponseStatus;

	isOK(): boolean {
		// A successful response is indicated by the "Queued" status
		return this.status === TransmitResponseStatus.Queued;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				status: getEnumMemberName(TransmitResponseStatus, this.status),
			},
		};
	}
}

export interface TransmitCallbackOptions {
	status: TransmitCallbackStatus;
}

@rcpMessageTypes(RCPMessageType.Callback, RCPFunctionType.Transmit)
export class TransmitCallback extends RCPMessage implements SuccessIndicator {
	public constructor(
		options: TransmitCallbackOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.status = options.status;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): TransmitCallback {
		const status = raw.payload[0];

		return new this({
			status,
		});
	}

	public status: TransmitCallbackStatus;

	isOK(): boolean {
		return this.status === TransmitCallbackStatus.Completed;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				status: getEnumMemberName(TransmitCallbackStatus, this.status),
			},
		};
	}
}
