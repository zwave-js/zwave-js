import {
	type MessageOrCCLogEntry,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
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

/** TX power value that tells the firmware to keep its current setting */
export const TX_POWER_KEEP_CURRENT = 0x7f;

/** Converts a TX power in dBm to the value to transmit, using the sentinel if none is given */
export function encodeTxPower(txPower: number | undefined): number {
	if (txPower == undefined) return TX_POWER_KEEP_CURRENT;
	if (!Number.isInteger(txPower) || txPower < -128 || txPower > 126) {
		throw new ZWaveError(
			`The TX power must be an integer between -128 and 126 dBm`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
	return txPower;
}

export interface TransmitRequestOptions {
	channel: number;
	/** The transmit power in dBm. If omitted, the firmware keeps its current setting. */
	txPower?: number;
	/** Whether to perform clear channel assessment before transmitting */
	withCCA: boolean;
	data: BytesView;
}

enum TransmitFlags {
	CCA = 0b1,
}

@rcpMessageTypes(RCPMessageType.Request, RCPFunctionType.Transmit)
@expectedRCPResponse(RCPFunctionType.Transmit)
@expectedRCPCallback(RCPFunctionType.Transmit)
export class TransmitRequest extends RCPMessage {
	public constructor(
		options: TransmitRequestOptions & RCPMessageBaseOptions,
	) {
		super(options);

		this.channel = options.channel;
		this.txPower = options.txPower;
		this.withCCA = options.withCCA;
		this.data = options.data;
	}

	public channel: number;
	public txPower: number | undefined;
	public withCCA: boolean;
	public data: BytesView;

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		if (
			!Number.isInteger(this.channel)
			|| this.channel < 0
			|| this.channel > 0xff
		) {
			throw new ZWaveError(
				`The channel must be an integer between 0 and 255`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		const header = new Bytes(3);
		header[0] = this.channel;
		header.writeInt8(encodeTxPower(this.txPower), 1);
		header[2] = this.withCCA ? TransmitFlags.CCA : 0;

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
				channel: this.channel,
				"TX power": this.txPower != undefined
					? `${this.txPower} dBm`
					: "unchanged",
				CCA: this.withCCA,
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
