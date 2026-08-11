import type { MessageOrCCLogEntry } from "@zwave-js/core";
import { Bytes, type BytesView, getEnumMemberName } from "@zwave-js/shared";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import {
	RCPMessage,
	type RCPMessageBaseOptions,
	type RCPMessageEncodingContext,
	type RCPMessageParsingContext,
	type RCPMessageRaw,
	expectedRCPCallback,
	expectedRCPResponse,
	rcpMessageTypes,
} from "../../message/RCPMessages.js";
import type { SuccessIndicator } from "../../message/SuccessIndicator.js";
import {
	TransmitCallbackStatus,
	TransmitResponseStatus,
} from "./TransmitMessages.js";

export interface TransmitBeamRequestOptions {
	/** The transmit power in dBm */
	txPower: number;
	numFragments: number;
	fragmentDurationMs: number;
	fragmentPeriodMs: number;
	/** The channels the beam fragments are transmitted on, in order */
	channels: number[];
	data: BytesView;
}

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.TransmitBeam)
@expectedRCPResponse(RCPFunctionType.TransmitBeam)
@expectedRCPCallback(RCPFunctionType.TransmitBeam)
export class TransmitBeamRequest extends RCPMessage {
	public constructor(
		options: TransmitBeamRequestOptions & RCPMessageBaseOptions,
	) {
		super(options);

		this.txPower = options.txPower;
		this.numFragments = options.numFragments;
		this.fragmentDurationMs = options.fragmentDurationMs;
		this.fragmentPeriodMs = options.fragmentPeriodMs;
		this.channels = options.channels;
		this.data = options.data;
	}

	public txPower: number;
	public numFragments: number;
	public fragmentDurationMs: number;
	public fragmentPeriodMs: number;
	public channels: number[];
	public data: BytesView;

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		const header = new Bytes(7 + this.channels.length);
		header.writeInt8(this.txPower, 0);
		header[1] = this.numFragments;
		header.writeUInt16BE(this.fragmentDurationMs, 2);
		header.writeUInt16BE(this.fragmentPeriodMs, 4);
		header[6] = this.channels.length;
		header.set(this.channels, 7);

		this.payload = Bytes.concat([
			header,
			this.data,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"TX power": `${this.txPower} dBm`,
				"no. of fragments": this.numFragments,
				"fragment duration": `${this.fragmentDurationMs} ms`,
				"fragment period": `${this.fragmentPeriodMs} ms`,
				channels: this.channels.join(", "),
				data: `(${this.data.length} bytes)`,
			},
		};
	}
}

export interface TransmitBeamResponseOptions {
	status: TransmitResponseStatus;
}

@rcpMessageTypes(RCPMessageType.Response, RCPFunctionType.TransmitBeam)
export class TransmitBeamResponse extends RCPMessage
	implements SuccessIndicator
{
	public constructor(
		options: TransmitBeamResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.status = options.status;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): TransmitBeamResponse {
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

export interface TransmitBeamCallbackOptions {
	status: TransmitCallbackStatus;
}

@rcpMessageTypes(RCPMessageType.Callback, RCPFunctionType.TransmitBeam)
export class TransmitBeamCallback extends RCPMessage
	implements SuccessIndicator
{
	public constructor(
		options: TransmitBeamCallbackOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.status = options.status;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): TransmitBeamCallback {
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

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.AbortBeam)
@expectedRCPResponse(RCPFunctionType.AbortBeam)
export class AbortBeamRequest extends RCPMessage {}

export interface AbortBeamResponseOptions {
	success: boolean;
}

@rcpMessageTypes(RCPMessageType.Response, RCPFunctionType.AbortBeam)
export class AbortBeamResponse extends RCPMessage implements SuccessIndicator {
	public constructor(
		options: AbortBeamResponseOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.success = options.success;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): AbortBeamResponse {
		const success = raw.payload[0] !== 0;

		return new this({
			success,
		});
	}

	public success: boolean;

	isOK(): boolean {
		return this.success;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				success: this.success,
			},
		};
	}
}
