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
import {
	TransmitCallbackStatus,
	TransmitResponseStatus,
	encodeTxPower,
	formatTxPower,
} from "./TransmitMessages.js";

export interface TransmitBeamRequestOptions {
	/**
	 * The transmit power in dBm, in steps of 0.1 dBm.
	 * If omitted, the firmware keeps its current setting.
	 */
	txPower?: number;
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

	public txPower: number | undefined;
	public numFragments: number;
	public fragmentDurationMs: number;
	public fragmentPeriodMs: number;
	public channels: number[];
	public data: BytesView;

	public getCallbackTimeout(): number | undefined {
		// The firmware only reports back when the entire beam is done.
		// A single fragment has no period, so its duration determines the runtime.
		const fragmentTime = Math.max(
			this.fragmentPeriodMs,
			this.fragmentDurationMs,
		);
		return this.numFragments * fragmentTime + 1000;
	}

	private assertValidOptions(): void {
		if (
			!Number.isInteger(this.numFragments)
			|| this.numFragments < 1
			|| this.numFragments > 0xff
		) {
			throw new ZWaveError(
				`The number of beam fragments must be an integer between 1 and 255`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (
			!Number.isInteger(this.fragmentDurationMs)
			|| this.fragmentDurationMs < 0
			|| this.fragmentDurationMs > 0xffff
		) {
			throw new ZWaveError(
				`The fragment duration must be an integer between 0 and 65535 ms`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (
			!Number.isInteger(this.fragmentPeriodMs)
			|| this.fragmentPeriodMs < 0
			|| this.fragmentPeriodMs > 0xffff
		) {
			throw new ZWaveError(
				`The fragment period must be an integer between 0 and 65535 ms`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		// Back-to-back fragments must not overlap
		if (
			this.numFragments > 1
			&& this.fragmentPeriodMs < this.fragmentDurationMs
		) {
			throw new ZWaveError(
				`The fragment period must be at least as long as the fragment duration`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (this.channels.length < 1 || this.channels.length > 5) {
			throw new ZWaveError(
				`A beam must be transmitted on 1 to 5 channels`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (this.channels.some((c) => !Number.isInteger(c) || c < 0 || c > 4)) {
			throw new ZWaveError(
				`Each channel must be an integer between 0 and 4`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}

	public serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		this.assertValidOptions();

		// TX_POWER (int16 BE, deci-dBm) | NUM_FRAGMENTS | FRAGMENT_DURATION_MS (u16 BE)
		// | FRAGMENT_PERIOD_MS (u16 BE) | NUM_CHANNELS | ...CHANNELS | ...DATA
		const header = new Bytes(8 + this.channels.length);
		header.writeInt16BE(encodeTxPower(this.txPower), 0);
		header[2] = this.numFragments;
		header.writeUInt16BE(this.fragmentDurationMs, 3);
		header.writeUInt16BE(this.fragmentPeriodMs, 5);
		header[7] = this.channels.length;
		header.set(this.channels, 8);

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
				"TX power": formatTxPower(this.txPower),
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
