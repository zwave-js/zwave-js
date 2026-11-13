import {
	type MessageOrCCLogEntry,
	MessagePriority,
	ZWaveError,
	ZWaveErrorCodes,
	mergeLogDict,
	validatePayload,
} from "@zwave-js/core";
import { createSimpleReflectionDecorator } from "@zwave-js/core/reflection";
import {
	FunctionType,
	Message,
	type MessageBaseOptions,
	type MessageConstructor,
	type MessageEncodingContext,
	MessageOrigin,
	type MessageParsingContext,
	type MessageRaw,
	MessageType,
	type SuccessIndicator,
	expectedCallback,
	expectedResponse,
	messageTypes,
	priority,
} from "@zwave-js/serial";
import {
	Bytes,
	type BytesView,
	getEnumMemberName,
	num2hex,
} from "@zwave-js/shared";

// Implementation based on the Z-Wave Host API Specification, Firmware Update Command (0x3E)

export enum FirmwareUpdateSubCommand {
	Prepare = 0x00,
	WriteChunk = 0x01,
	Perform = 0x02,
}

export enum FirmwareUpdateCommandStatus {
	OK = 0x00,
	/** The chunk is outside of the permitted range */
	Error_TooBig = 0x01,
	Error_FirmwareUpdateNotSupported = 0x02,
	Error_BootloaderUpdateNotSupported = 0x03,
	Error_WrongChecksum = 0x04,
	Error_InvalidHeader = 0x05,
	Error_InvalidSignatureOrKey = 0x06,
	/** The file does not match this product */
	Error_FirmwareMismatch = 0x07,
	Error_HardwareVersionMismatch = 0x08,
	Error_DowngradeNotSupported = 0x09,
	Error_UnsupportedTarget = 0x0a,
	Error_PrepareFailed = 0x0b,
	Error_SubCommandNotSupported = 0xff,
}

/** Which part of the Z-Wave module's software an OTW firmware update replaces */
export enum OTWFirmwareUpdateTarget {
	Firmware = 0x01,
	Bootloader = 0x02,
}

/**
 * The maximum number of data bytes in a Write Chunk command.
 * The Serial API receive buffer holds 180 bytes including SOF, length, type and command ID,
 * which leaves 176 bytes for the payload. The sub command, offset, length and session ID take 8 of them.
 */
export const FIRMWARE_UPDATE_MAX_CHUNK_SIZE = 168;

const {
	decorator: subCommandRequest,
	lookupConstructor: getSubCommandRequestConstructor,
	lookupValue: getSubCommandForRequest,
} = createSimpleReflectionDecorator<
	typeof FirmwareUpdateRequest,
	[subCommand: FirmwareUpdateSubCommand],
	MessageConstructor<FirmwareUpdateRequest>
>({
	name: "subCommandRequest",
});

@messageTypes(MessageType.Request, FunctionType.FirmwareUpdate)
@priority(MessagePriority.Controller)
export class FirmwareUpdateRequestBase extends Message {
	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): FirmwareUpdateRequestBase {
		if (ctx.origin === MessageOrigin.Host) {
			return FirmwareUpdateRequest.from(raw, ctx);
		} else {
			return FirmwareUpdateCallback.from(raw, ctx);
		}
	}
}

function testResponseForFirmwareUpdateRequest(
	sent: Message,
	received: Message,
): boolean {
	if (!(received instanceof FirmwareUpdateResponse)) return false;
	return (sent as FirmwareUpdateRequest).subCommand === received.subCommand;
}

export interface FirmwareUpdateRequestOptions {
	subCommand?: FirmwareUpdateSubCommand;
}

@expectedResponse(testResponseForFirmwareUpdateRequest)
@expectedCallback(FunctionType.FirmwareUpdate)
export class FirmwareUpdateRequest extends FirmwareUpdateRequestBase {
	public constructor(
		options: FirmwareUpdateRequestOptions & MessageBaseOptions = {},
	) {
		super(options);
		this.subCommand = options.subCommand ?? getSubCommandForRequest(this)!;
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): FirmwareUpdateRequest {
		validatePayload(raw.payload.length >= 1);
		const subCommand: FirmwareUpdateSubCommand = raw.payload[0];
		const payload = raw.payload.subarray(1);

		const CommandConstructor = getSubCommandRequestConstructor(subCommand);
		if (CommandConstructor) {
			return CommandConstructor.from(
				raw.withPayload(payload),
				ctx,
			) as FirmwareUpdateRequest;
		}

		const ret = new FirmwareUpdateRequest({ subCommand });
		ret.payload = payload;
		return ret;
	}

	public subCommand: FirmwareUpdateSubCommand;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([[this.subCommand], this.payload]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"sub command": getEnumMemberName(
					FirmwareUpdateSubCommand,
					this.subCommand,
				),
				"callback id": this.callbackId ?? "(not set)",
			},
		};
	}
}

// =============================================================================

@subCommandRequest(FirmwareUpdateSubCommand.Prepare)
export class FirmwareUpdate_PrepareRequest extends FirmwareUpdateRequest {
	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): FirmwareUpdate_PrepareRequest {
		validatePayload(raw.payload.length >= 1);
		const callbackId = raw.payload[0];

		return new this({ callbackId });
	}

	public override getCallbackTimeout(): number | undefined {
		// Preparing erases the whole storage slot
		return 10000;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		this.payload = Bytes.from([this.callbackId]);
		return super.serialize(ctx);
	}
}

// =============================================================================

export interface FirmwareUpdate_WriteChunkRequestOptions {
	offset: number;
	data: BytesView;
}

@subCommandRequest(FirmwareUpdateSubCommand.WriteChunk)
export class FirmwareUpdate_WriteChunkRequest extends FirmwareUpdateRequest {
	public constructor(
		options: FirmwareUpdate_WriteChunkRequestOptions & MessageBaseOptions,
	) {
		super(options);
		if (options.data.length > FIRMWARE_UPDATE_MAX_CHUNK_SIZE) {
			throw new ZWaveError(
				`A firmware update chunk must not be larger than ${FIRMWARE_UPDATE_MAX_CHUNK_SIZE} bytes`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		this.offset = options.offset;
		this.data = options.data;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): FirmwareUpdate_WriteChunkRequest {
		validatePayload(raw.payload.length >= 7);
		const offset = raw.payload.readUInt32BE(0);
		const length = raw.payload.readUInt16BE(4);
		validatePayload(raw.payload.length >= 7 + length);
		const data = raw.payload.subarray(6, 6 + length);
		const callbackId = raw.payload[6 + length];

		return new this({ offset, data, callbackId });
	}

	public offset: number;
	public data: BytesView;

	public override getCallbackTimeout(): number | undefined {
		return 5000;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		const header = new Bytes(6);
		header.writeUInt32BE(this.offset, 0);
		header.writeUInt16BE(this.data.length, 4);
		this.payload = Bytes.concat([header, this.data, [this.callbackId]]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = super.toLogEntry();
		return {
			...ret,
			message: mergeLogDict(ret.message, {
				offset: num2hex(this.offset),
				length: this.data.length,
			}),
		};
	}
}

// =============================================================================

export interface FirmwareUpdate_PerformRequestOptions {
	target: OTWFirmwareUpdateTarget;
}

@subCommandRequest(FirmwareUpdateSubCommand.Perform)
export class FirmwareUpdate_PerformRequest extends FirmwareUpdateRequest {
	public constructor(
		options: FirmwareUpdate_PerformRequestOptions & MessageBaseOptions,
	) {
		super(options);
		this.target = options.target;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): FirmwareUpdate_PerformRequest {
		validatePayload(raw.payload.length >= 2);
		const target: OTWFirmwareUpdateTarget = raw.payload[0];
		const callbackId = raw.payload[1];

		return new this({ target, callbackId });
	}

	public target: OTWFirmwareUpdateTarget;

	public override getCallbackTimeout(): number | undefined {
		// Performing the update verifies the whole image first
		return 10000;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		this.payload = Bytes.from([this.target, this.callbackId]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = super.toLogEntry();
		return {
			...ret,
			message: mergeLogDict(ret.message, {
				target: getEnumMemberName(OTWFirmwareUpdateTarget, this.target),
			}),
		};
	}
}

// =============================================================================

export interface FirmwareUpdateResponseOptions {
	subCommand: FirmwareUpdateSubCommand;
	accepted: boolean;
}

// The Response Status field follows the generic definition in the Host API spec:
// A non-zero value accepts the command and a callback follows. 0x00 rejects it without a callback.
@messageTypes(MessageType.Response, FunctionType.FirmwareUpdate)
export class FirmwareUpdateResponse
	extends Message
	implements SuccessIndicator
{
	public constructor(
		options: FirmwareUpdateResponseOptions & MessageBaseOptions,
	) {
		super(options);
		this.subCommand = options.subCommand;
		this.accepted = options.accepted;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): FirmwareUpdateResponse {
		validatePayload(raw.payload.length >= 2);
		const subCommand: FirmwareUpdateSubCommand = raw.payload[0];
		const accepted = raw.payload[1] !== 0;

		return new this({ subCommand, accepted });
	}

	public readonly subCommand: FirmwareUpdateSubCommand;
	public readonly accepted: boolean;

	public isOK(): boolean {
		return this.accepted;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([this.subCommand, this.accepted ? 0x01 : 0]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"sub command": getEnumMemberName(
					FirmwareUpdateSubCommand,
					this.subCommand,
				),
				accepted: this.accepted,
			},
		};
	}
}

// =============================================================================

export interface FirmwareUpdateCallbackOptions {
	status: FirmwareUpdateCommandStatus;
}

export class FirmwareUpdateCallback
	extends FirmwareUpdateRequestBase
	implements SuccessIndicator
{
	public constructor(
		options: FirmwareUpdateCallbackOptions & MessageBaseOptions,
	) {
		super(options);
		this.callbackId = options.callbackId;
		this.status = options.status;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): FirmwareUpdateCallback {
		validatePayload(raw.payload.length >= 2);
		const callbackId = raw.payload[0];
		const status: FirmwareUpdateCommandStatus = raw.payload[1];

		return new this({ callbackId, status });
	}

	public readonly status: FirmwareUpdateCommandStatus;

	public isOK(): boolean {
		return this.status === FirmwareUpdateCommandStatus.OK;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		this.payload = Bytes.from([this.callbackId, this.status]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId ?? "(not set)",
				status: getEnumMemberName(
					FirmwareUpdateCommandStatus,
					this.status,
				),
			},
		};
	}
}
