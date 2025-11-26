import type { CCEncodingContext, CommandClass } from "@zwave-js/cc";
import {
	type GetNode,
	type MessageOrCCLogEntry,
	MessagePriority,
	type NodeId,
	type SerializableTXReport,
	type SinglecastCC,
	type SupportsCC,
	type TXReport,
	TransmitStatus,
	ZWaveError,
	ZWaveErrorCodes,
	encodeNodeID,
	parseNodeID,
} from "@zwave-js/core";
import {
	ApplicationCommandRequest,
	BridgeApplicationCommandRequest,
	FunctionType,
	Message,
	type MessageBaseOptions,
	type MessageEncodingContext,
	MessageOrigin,
	type MessageParsingContext,
	type MessageRaw,
	MessageType,
	type SuccessIndicator,
	containsCC,
	expectedCallback,
	expectedResponse,
	messageTypes,
	priority,
} from "@zwave-js/serial";
import {
	Bytes,
	type BytesView,
	buffer2hex,
	getEnumMemberName,
} from "@zwave-js/shared";
import { clamp } from "alcalzone-shared/math";
import { MAX_SEND_ATTEMPTS } from "./SendDataMessages.js";
import {
	encodeTXReport,
	parseTXReport,
	serializableTXReportToTXReport,
	txReportToMessageRecord,
} from "./SendDataShared.js";

import type { MessageWithCC } from "../utils.js";

export type SendProtocolDataRequestOptions<
	CCType extends CommandClass = CommandClass,
> =
	& (
		| { command: CCType }
		| {
			nodeId: number;
			serializedCC: BytesView;
		}
	)
	& {
		protocolMetadata: BytesView;
		maxSendAttempts?: number;
	};

@messageTypes(MessageType.Request, FunctionType.SendProtocolData)
@priority(MessagePriority.ControllerImmediate)
export class SendProtocolDataRequestBase extends Message {
	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): SendProtocolDataRequestBase {
		if (ctx.origin === MessageOrigin.Host) {
			return SendProtocolDataRequest.from(raw, ctx);
		} else {
			return SendProtocolDataRequestTransmitReport.from(raw, ctx);
		}
	}
}

@expectedResponse(FunctionType.SendProtocolData)
@expectedCallback(FunctionType.SendProtocolData)
export class SendProtocolDataRequest<CCType extends CommandClass = CommandClass>
	extends SendProtocolDataRequestBase
	implements MessageWithCC
{
	public constructor(
		options: SendProtocolDataRequestOptions<CCType> & MessageBaseOptions,
	) {
		super(options);

		if ("command" in options) {
			if (!options.command.isSinglecast()) {
				throw new ZWaveError(
					`SendProtocolDataRequest can only be used for singlecast CCs`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			this.command = options.command;
			this._nodeId = this.command.nodeId;
		} else {
			this._nodeId = options.nodeId;
			this.serializedCC = options.serializedCC;
		}

		this.protocolMetadata = options.protocolMetadata;
		if (options.maxSendAttempts != undefined) {
			this.maxSendAttempts = options.maxSendAttempts;
		}
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): SendProtocolDataRequest {
		let offset = 0;
		const { nodeId, bytesRead: nodeIdBytes } = parseNodeID(
			raw.payload,
			ctx.nodeIdType,
			offset,
		);
		offset += nodeIdBytes;

		const serializedCCLength = raw.payload[offset++];
		const serializedCC = raw.payload.subarray(
			offset,
			offset + serializedCCLength,
		);
		offset += serializedCCLength;

		const protocolMetadataLength = raw.payload[offset++];
		const protocolMetadata = raw.payload.subarray(
			offset,
			offset + protocolMetadataLength,
		);
		offset += protocolMetadataLength;

		const callbackId = raw.payload[offset++];

		return new this({
			nodeId,
			serializedCC,
			protocolMetadata,
			callbackId,
		});
	}

	/** The command this message contains */
	public command: SinglecastCC<CCType> | undefined;

	private _nodeId: number;
	public override getNodeId(): number | undefined {
		return this.command?.nodeId ?? this._nodeId;
	}

	public serializedCC: BytesView | undefined;
	public async serializeCC(ctx: CCEncodingContext): Promise<BytesView> {
		if (!this.serializedCC) {
			if (!this.command) {
				throw new ZWaveError(
					`Cannot serialize a ${this.constructor.name} without a command`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			this.serializedCC = await this.command.serialize(ctx);
		}
		return this.serializedCC;
	}

	public protocolMetadata: BytesView;

	private _maxSendAttempts: number = 1;
	/** The number of times the driver may try to send this message */
	public get maxSendAttempts(): number {
		return this._maxSendAttempts;
	}
	public set maxSendAttempts(value: number) {
		this._maxSendAttempts = clamp(value, 1, MAX_SEND_ATTEMPTS);
	}

	public prepareRetransmission(): void {
		this.command?.prepareRetransmission();
		this.serializedCC = undefined;
		this.callbackId = undefined;
	}

	public async serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		const nodeId = encodeNodeID(
			this.command?.nodeId ?? this._nodeId,
			ctx.nodeIdType,
		);
		const serializedCC = await this.serializeCC(ctx);
		this.payload = Bytes.concat([
			nodeId,
			Bytes.from([serializedCC.length]),
			serializedCC,
			Bytes.from([this.protocolMetadata.length]),
			this.protocolMetadata,
			Bytes.from([this.callbackId]),
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId ?? "(not set)",
				"payload metadata": buffer2hex(this.protocolMetadata),
			},
		};
	}

	public expectsNodeUpdate(ctx: GetNode<NodeId & SupportsCC>): boolean {
		return (
			// We can only answer this if the command is known
			this.command != undefined
			// Only true singlecast commands may expect a response
			&& this.command.isSinglecast()
			// ... and only if the command expects a response
			&& this.command.expectsCCResponse(ctx)
		);
	}

	public isExpectedNodeUpdate(
		ctx: GetNode<NodeId & SupportsCC>,
		msg: Message,
	): boolean {
		return (
			// We can only answer this if the command is known
			this.command != undefined
			&& (msg instanceof ApplicationCommandRequest
				|| msg instanceof BridgeApplicationCommandRequest)
			&& containsCC(msg)
			&& this.command.isExpectedCCResponse(ctx, msg.command)
		);
	}
}

export interface SendProtocolDataRequestTransmitReportOptions {
	transmitStatus: TransmitStatus;
	txReport?: SerializableTXReport;
}

export class SendProtocolDataRequestTransmitReport
	extends SendProtocolDataRequestBase
	implements SuccessIndicator
{
	public constructor(
		options:
			& SendProtocolDataRequestTransmitReportOptions
			& MessageBaseOptions,
	) {
		super(options);

		this.callbackId = options.callbackId;
		this.transmitStatus = options.transmitStatus;
		this.txReport = options.txReport
			&& serializableTXReportToTXReport(options.txReport);
	}

	public transmitStatus: TransmitStatus;
	public txReport: TXReport | undefined;

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): SendProtocolDataRequestTransmitReport {
		const callbackId = raw.payload[0];
		const transmitStatus: TransmitStatus = raw.payload[1];

		// TODO: Consider NOT parsing this for transmit status other than OK or NoACK
		const txReport = parseTXReport(
			transmitStatus !== TransmitStatus.NoAck,
			raw.payload.subarray(2),
		);

		return new this({
			callbackId,
			transmitStatus,
			txReport,
		});
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		this.payload = Bytes.from([
			this.callbackId,
			this.transmitStatus,
		]);
		if (this.txReport) {
			this.payload = Bytes.concat([
				this.payload,
				encodeTXReport(this.txReport),
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
				// Show TX report fields for OK and NoAck (NoAck still provides useful routing info)
				...(this.txReport && (this.transmitStatus === TransmitStatus.OK
						|| this.transmitStatus === TransmitStatus.NoAck)
					? txReportToMessageRecord(this.txReport)
					: {}),
			},
		};
	}
}

export interface SendProtocolDataResponseOptions {
	wasSent: boolean;
}

@messageTypes(MessageType.Response, FunctionType.SendProtocolData)
export class SendProtocolDataResponse extends Message
	implements SuccessIndicator
{
	public constructor(
		options: SendProtocolDataResponseOptions & MessageBaseOptions,
	) {
		super(options);
		this.wasSent = options.wasSent;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): SendProtocolDataResponse {
		const wasSent = raw.payload[0] !== 0;

		return new this({
			wasSent,
		});
	}

	public wasSent: boolean;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([this.wasSent ? 1 : 0]);
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
