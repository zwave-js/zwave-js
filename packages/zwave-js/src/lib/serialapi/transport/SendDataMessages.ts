import { CommandClass, type ICommandClassContainer } from "@zwave-js/cc";
import {
	MAX_NODES,
	type MessageOrCCLogEntry,
	MessagePriority,
	type MulticastCC,
	type MulticastDestination,
	NODE_ID_BROADCAST,
	type SerializableTXReport,
	type SinglecastCC,
	type TXReport,
	TransmitOptions,
	TransmitStatus,
	ZWaveError,
	ZWaveErrorCodes,
	encodeNodeID,
	parseNodeID,
} from "@zwave-js/core";
import type { CCEncodingContext } from "@zwave-js/host";
import {
	FunctionType,
	Message,
	type MessageBaseOptions,
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
import { getEnumMemberName, num2hex } from "@zwave-js/shared";
import { clamp } from "alcalzone-shared/math";
import { ApplicationCommandRequest } from "../application/ApplicationCommandRequest";
import { BridgeApplicationCommandRequest } from "../application/BridgeApplicationCommandRequest";
import {
	encodeTXReport,
	parseTXReport,
	txReportToMessageRecord,
} from "./SendDataShared";

export const MAX_SEND_ATTEMPTS = 5;

@messageTypes(MessageType.Request, FunctionType.SendData)
@priority(MessagePriority.Normal)
export class SendDataRequestBase extends Message {
	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): SendDataRequestBase {
		if (ctx.origin === MessageOrigin.Host) {
			return SendDataRequest.from(raw, ctx);
		} else {
			return SendDataRequestTransmitReport.from(raw, ctx);
		}
	}
}

export interface SendDataRequestOptions<
	CCType extends CommandClass = CommandClass,
> {
	command: CCType;
	transmitOptions?: TransmitOptions;
	maxSendAttempts?: number;
}

@expectedResponse(FunctionType.SendData)
@expectedCallback(FunctionType.SendData)
export class SendDataRequest<CCType extends CommandClass = CommandClass>
	extends SendDataRequestBase
	implements ICommandClassContainer
{
	public constructor(
		options: SendDataRequestOptions<CCType> & MessageBaseOptions,
	) {
		super(options);

		if (
			!options.command.isSinglecast()
			&& !options.command.isBroadcast()
		) {
			throw new ZWaveError(
				`SendDataRequest can only be used for singlecast and broadcast CCs`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		this.command = options.command;
		this._nodeId = this.command.nodeId;
		this.transmitOptions = options.transmitOptions
			?? TransmitOptions.DEFAULT;
		if (options.maxSendAttempts != undefined) {
			this.maxSendAttempts = options.maxSendAttempts;
		}
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): SendDataRequest {
		let offset = 0;
		const { nodeId, bytesRead: nodeIdBytes } = parseNodeID(
			raw.payload,
			ctx.nodeIdType,
			offset,
		);
		offset += nodeIdBytes;
		const serializedCCLength = raw.payload[offset++];
		const transmitOptions: TransmitOptions =
			raw.payload[offset + serializedCCLength];
		const callbackId = raw.payload[offset + 1 + serializedCCLength];

		const ccPayload = raw.payload.subarray(
			offset,
			offset + serializedCCLength,
		);

		let command: SinglecastCC<CCType>;

		if (options.parseCCs !== false) {
			command = CommandClass.parse(ccPayload, {
				sourceNodeId: nodeId,
				...ctx,
			}) as SinglecastCC<CCType>;
		} else {
			// Little hack for testing with a network mock. This will be parsed in the next step.
			command = undefined as any;
		}

		return new SendDataRequest({
			transmitOptions,
			callbackId,
			command,
		});
	}

	/** The command this message contains */
	public command: SinglecastCC<CCType>;
	/** Options regarding the transmission of the message */
	public transmitOptions: TransmitOptions;

	private _maxSendAttempts: number = 1;
	/** The number of times the driver may try to send this message */
	public get maxSendAttempts(): number {
		return this._maxSendAttempts;
	}
	public set maxSendAttempts(value: number) {
		this._maxSendAttempts = clamp(value, 1, MAX_SEND_ATTEMPTS);
	}

	private _nodeId: number;
	public override getNodeId(): number | undefined {
		return this._nodeId;
	}

	// Cache the serialized CC, so we can check if it needs to be fragmented
	private _serializedCC: Buffer | undefined;
	/** @internal */
	public serializeCC(ctx: CCEncodingContext): Buffer {
		if (!this._serializedCC) {
			this._serializedCC = this.command.serialize(ctx);
		}
		return this._serializedCC;
	}

	public prepareRetransmission(): void {
		this.command.prepareRetransmission();
		this._serializedCC = undefined;
		this.callbackId = undefined;
	}

	public serialize(ctx: MessageEncodingContext): Buffer {
		this.assertCallbackId();
		const nodeId = encodeNodeID(this.command.nodeId, ctx.nodeIdType);
		const serializedCC = this.serializeCC(ctx);
		this.payload = Buffer.concat([
			nodeId,
			Buffer.from([serializedCC.length]),
			serializedCC,
			Buffer.from([this.transmitOptions, this.callbackId]),
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"transmit options": num2hex(this.transmitOptions),
				"callback id": this.callbackId ?? "(not set)",
			},
		};
	}

	public expectsNodeUpdate(): boolean {
		return (
			// Only true singlecast commands may expect a response
			this.command.isSinglecast()
			// ... and only if the command expects a response
			&& this.command.expectsCCResponse()
		);
	}

	public isExpectedNodeUpdate(msg: Message): boolean {
		return (
			(msg instanceof ApplicationCommandRequest
				|| msg instanceof BridgeApplicationCommandRequest)
			&& this.command.isExpectedCCResponse(msg.command)
		);
	}
}

export interface SendDataRequestTransmitReportOptions {
	transmitStatus: TransmitStatus;
	txReport?: SerializableTXReport;
}

export class SendDataRequestTransmitReport extends SendDataRequestBase
	implements SuccessIndicator
{
	public constructor(
		options: SendDataRequestTransmitReportOptions & MessageBaseOptions,
	) {
		super(options);

		this.callbackId = options.callbackId;
		this.transmitStatus = options.transmitStatus;
		this.txReport = options.txReport;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): SendDataRequestTransmitReport {
		const callbackId = raw.payload[0];
		const transmitStatus: TransmitStatus = raw.payload[1];

		// TODO: Consider NOT parsing this for transmit status other than OK or NoACK
		const txReport = parseTXReport(
			transmitStatus !== TransmitStatus.NoAck,
			raw.payload.subarray(2),
		);

		return new SendDataRequestTransmitReport({
			callbackId,
			transmitStatus,
			txReport,
		});
	}

	public transmitStatus: TransmitStatus;
	// FIXME: wat?
	private _txReport: SerializableTXReport | undefined;
	public txReport: TXReport | undefined;

	public serialize(ctx: MessageEncodingContext): Buffer {
		this.assertCallbackId();
		this.payload = Buffer.from([
			this.callbackId,
			this.transmitStatus,
		]);
		if (this._txReport) {
			this.payload = Buffer.concat([
				this.payload,
				encodeTXReport(this._txReport),
			]);
		}

		return super.serialize(ctx);
	}

	public isOK(): boolean {
		return this.transmitStatus === TransmitStatus.OK;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId ?? "(not set)",
				"transmit status":
					getEnumMemberName(TransmitStatus, this.transmitStatus)
					+ (this.txReport
						? `, took ${this.txReport.txTicks * 10} ms`
						: ""),
				...(this.txReport
					? txReportToMessageRecord(this.txReport)
					: {}),
			},
		};
	}
}

export interface SendDataResponseOptions {
	wasSent: boolean;
}

@messageTypes(MessageType.Response, FunctionType.SendData)
export class SendDataResponse extends Message implements SuccessIndicator {
	public constructor(
		options: SendDataResponseOptions & MessageBaseOptions,
	) {
		super(options);
		this.wasSent = options.wasSent;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): SendDataResponse {
		const wasSent = raw.payload[0] !== 0;

		return new SendDataResponse({
			wasSent,
		});
	}

	public wasSent: boolean;

	public serialize(ctx: MessageEncodingContext): Buffer {
		this.payload = Buffer.from([this.wasSent ? 1 : 0]);
		return super.serialize(ctx);
	}

	isOK(): boolean {
		return this.wasSent;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: { "was sent": this.wasSent },
		};
	}
}

@messageTypes(MessageType.Request, FunctionType.SendDataMulticast)
@priority(MessagePriority.Normal)
export class SendDataMulticastRequestBase extends Message {
	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): SendDataMulticastRequestBase {
		if (ctx.origin === MessageOrigin.Host) {
			return SendDataMulticastRequest.from(raw, ctx);
		} else {
			return SendDataMulticastRequestTransmitReport.from(raw, ctx);
		}
	}
}

export interface SendDataMulticastRequestOptions<CCType extends CommandClass> {
	command: CCType;
	transmitOptions?: TransmitOptions;
	maxSendAttempts?: number;
}

@expectedResponse(FunctionType.SendDataMulticast)
@expectedCallback(FunctionType.SendDataMulticast)
export class SendDataMulticastRequest<
	CCType extends CommandClass = CommandClass,
> extends SendDataMulticastRequestBase implements ICommandClassContainer {
	public constructor(
		options: SendDataMulticastRequestOptions<CCType> & MessageBaseOptions,
	) {
		super(options);

		if (!options.command.isMulticast()) {
			throw new ZWaveError(
				`SendDataMulticastRequest can only be used for multicast CCs`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		} else if (options.command.nodeId.length === 0) {
			throw new ZWaveError(
				`At least one node must be targeted`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		} else if (
			options.command.nodeId.some((n) => n < 1 || n > MAX_NODES)
		) {
			throw new ZWaveError(
				`All node IDs must be between 1 and ${MAX_NODES}!`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		this.command = options.command;
		this.nodeIds = this.command.nodeId;
		this.transmitOptions = options.transmitOptions
			?? TransmitOptions.DEFAULT;
		if (options.maxSendAttempts != undefined) {
			this.maxSendAttempts = options.maxSendAttempts;
		}
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): SendDataMulticastRequest {
		const numNodeIDs = raw.payload[0];
		let offset = 1;
		const nodeIds: number[] = [];
		for (let i = 0; i < numNodeIDs; i++) {
			const { nodeId, bytesRead } = parseNodeID(
				raw.payload,
				ctx.nodeIdType,
				offset,
			);
			nodeIds.push(nodeId);
			offset += bytesRead;
		}
		const serializedCCLength = raw.payload[offset];
		offset++;
		const serializedCC = raw.payload.subarray(
			offset,
			offset + serializedCCLength,
		);
		offset += serializedCCLength;
		const transmitOptions: TransmitOptions = raw.payload[offset];

		offset++;
		const callbackId: any = raw.payload[offset];

		let command: MulticastCC<CCType>;
		if (options.parseCCs !== false) {
			command = CommandClass.parse(serializedCC, {
				sourceNodeId: NODE_ID_BROADCAST, // FIXME: Unknown?
				...ctx,
			}) as MulticastCC<CCType>;
			command.nodeId = nodeIds;
		} else {
			// Little hack for testing with a network mock. This will be parsed in the next step.
			command = undefined as any;
		}

		return new SendDataMulticastRequest({
			transmitOptions,
			callbackId,
			command,
		});
	}

	/** The command this message contains */
	public command: MulticastCC<CCType>;
	/** Options regarding the transmission of the message */
	public transmitOptions: TransmitOptions;

	private _maxSendAttempts: number = 1;
	/** The number of times the driver may try to send this message */
	public get maxSendAttempts(): number {
		return this._maxSendAttempts;
	}
	public set maxSendAttempts(value: number) {
		this._maxSendAttempts = clamp(value, 1, MAX_SEND_ATTEMPTS);
	}

	public nodeIds: MulticastDestination;
	public override getNodeId(): number | undefined {
		// This is multicast, getNodeId must return undefined here
		return undefined;
	}

	// Cache the serialized CC, so we can check if it needs to be fragmented
	private _serializedCC: Buffer | undefined;
	/** @internal */
	public serializeCC(ctx: CCEncodingContext): Buffer {
		if (!this._serializedCC) {
			this._serializedCC = this.command.serialize(ctx);
		}
		return this._serializedCC;
	}

	public prepareRetransmission(): void {
		this.command.prepareRetransmission();
		this._serializedCC = undefined;
		this.callbackId = undefined;
	}

	public serialize(ctx: MessageEncodingContext): Buffer {
		this.assertCallbackId();
		const serializedCC = this.serializeCC(ctx);
		const destinationNodeIDs = this.command.nodeId.map((id) =>
			encodeNodeID(id, ctx.nodeIdType)
		);
		this.payload = Buffer.concat([
			// # of target nodes, not # of bytes
			Buffer.from([this.command.nodeId.length]),
			...destinationNodeIDs,
			Buffer.from([serializedCC.length]),
			// payload
			serializedCC,
			Buffer.from([this.transmitOptions, this.callbackId]),
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"target nodes": this.command.nodeId.join(", "),
				"transmit options": num2hex(this.transmitOptions),
				"callback id": this.callbackId ?? "(not set)",
			},
		};
	}
}

export interface SendDataMulticastRequestTransmitReportOptions {
	transmitStatus: TransmitStatus;
}

export class SendDataMulticastRequestTransmitReport
	extends SendDataMulticastRequestBase
	implements SuccessIndicator
{
	public constructor(
		options:
			& SendDataMulticastRequestTransmitReportOptions
			& MessageBaseOptions,
	) {
		super(options);

		this.callbackId = options.callbackId;
		this.transmitStatus = options.transmitStatus;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): SendDataMulticastRequestTransmitReport {
		const callbackId = raw.payload[0];
		const transmitStatus: TransmitStatus = raw.payload[1];

		return new SendDataMulticastRequestTransmitReport({
			callbackId,
			transmitStatus,
		});
	}

	public transmitStatus: TransmitStatus;

	public serialize(ctx: MessageEncodingContext): Buffer {
		this.assertCallbackId();
		this.payload = Buffer.from([this.callbackId, this.transmitStatus]);
		return super.serialize(ctx);
	}

	public isOK(): boolean {
		return this.transmitStatus === TransmitStatus.OK;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId ?? "(not set)",
				"transmit status": getEnumMemberName(
					TransmitStatus,
					this.transmitStatus,
				),
			},
		};
	}
}

export interface SendDataMulticastResponseOptions {
	wasSent: boolean;
}

@messageTypes(MessageType.Response, FunctionType.SendDataMulticast)
export class SendDataMulticastResponse extends Message
	implements SuccessIndicator
{
	public constructor(
		options: SendDataMulticastResponseOptions & MessageBaseOptions,
	) {
		super(options);
		this.wasSent = options.wasSent;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): SendDataMulticastResponse {
		const wasSent = raw.payload[0] !== 0;

		return new SendDataMulticastResponse({
			wasSent,
		});
	}

	public wasSent: boolean;

	public serialize(ctx: MessageEncodingContext): Buffer {
		this.payload = Buffer.from([this.wasSent ? 1 : 0]);
		return super.serialize(ctx);
	}

	public isOK(): boolean {
		return this.wasSent;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: { "was sent": this.wasSent },
		};
	}
}

@messageTypes(MessageType.Request, FunctionType.SendDataAbort)
@priority(MessagePriority.Controller)
export class SendDataAbort extends Message {}
