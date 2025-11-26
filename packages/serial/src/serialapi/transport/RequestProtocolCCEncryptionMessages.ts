import {
	type MessageOrCCLogEntry,
	MessagePriority,
	type SerializableTXReport,
	type TXReport,
	TransmitStatus,
	encodeNodeID,
	parseNodeID,
} from "@zwave-js/core";
import {
	FunctionType,
	Message,
	type MessageBaseOptions,
	type MessageEncodingContext,
	MessageOrigin,
	type MessageParsingContext,
	type MessageRaw,
	MessageType,
	encodeTXReport,
	expectedCallback,
	messageTypes,
	parseTXReport,
	priority,
	serializableTXReportToTXReport,
	txReportToMessageRecord,
} from "@zwave-js/serial";
import {
	Bytes,
	type BytesView,
	buffer2hex,
	getEnumMemberName,
} from "@zwave-js/shared";

export enum ProtocolCCEncryptionStatus {
	Started = 0x00,
	NodeNotFound = 0x01,
	NLSNotSupported = 0x02,
	Unknown = 0xff,
}

@messageTypes(MessageType.Request, FunctionType.RequestProtocolCCEncryption)
@priority(MessagePriority.ControllerImmediate)
export class RequestProtocolCCEncryptionRequestBase extends Message {
	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): RequestProtocolCCEncryptionRequestBase {
		// This message has a different direction than usual
		if (ctx.origin !== MessageOrigin.Host) {
			return RequestProtocolCCEncryptionRequest.from(raw, ctx);
		} else {
			return RequestProtocolCCEncryptionCallback.from(raw, ctx);
		}
	}
}

export interface RequestProtocolCCEncryptionRequestOptions {
	destinationNodeId: number;
	plaintext: BytesView;
	protocolMetadata: BytesView;
	useSupervision: boolean;
}

@expectedCallback(FunctionType.RequestProtocolCCEncryption)
export class RequestProtocolCCEncryptionRequest
	extends RequestProtocolCCEncryptionRequestBase
{
	public constructor(
		options: RequestProtocolCCEncryptionRequestOptions & MessageBaseOptions,
	) {
		super(options);

		this.destinationNodeId = options.destinationNodeId;
		this.plaintext = options.plaintext;
		this.protocolMetadata = options.protocolMetadata;
		this.useSupervision = options.useSupervision;
	}

	public destinationNodeId: number;
	public plaintext: BytesView;
	public protocolMetadata: BytesView;
	public useSupervision: boolean;

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): RequestProtocolCCEncryptionRequest {
		const { nodeId: destinationNodeId, bytesRead } = parseNodeID(
			raw.payload,
			ctx.nodeIdType,
			0,
		);
		let offset = bytesRead;

		const plaintextLength = raw.payload[offset++];
		const plaintext = raw.payload.slice(offset, offset + plaintextLength);
		offset += plaintextLength;

		const protocolMetadataLength = raw.payload[offset++];
		const protocolMetadata = raw.payload.slice(
			offset,
			offset + protocolMetadataLength,
		);
		offset += protocolMetadataLength;

		const useSupervision = !!(raw.payload[offset++] & 0x80);
		const callbackId = raw.payload[offset++];

		return new this({
			destinationNodeId,
			plaintext,
			protocolMetadata,
			useSupervision,
			callbackId,
		});
	}

	public async serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.assertCallbackId();
		this.payload = Bytes.concat([
			encodeNodeID(this.destinationNodeId, ctx.nodeIdType),
			[this.plaintext.length],
			this.plaintext,
			[this.protocolMetadata.length],
			this.protocolMetadata,
			[
				this.useSupervision ? 0x80 : 0x00,
				this.callbackId,
			],
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"destination node": this.destinationNodeId,
				"callback id": this.callbackId ?? "(not set)",
				plaintext: buffer2hex(this.plaintext),
				"protocol metadata": buffer2hex(this.protocolMetadata),
				"use supervision": this.useSupervision,
			},
		};
	}
}

export interface RequestProtocolCCEncryptionCallbackOptions {
	transmitStatus: TransmitStatus;
	txReport?: SerializableTXReport;
}

export class RequestProtocolCCEncryptionCallback
	extends RequestProtocolCCEncryptionRequestBase
{
	public constructor(
		options:
			& RequestProtocolCCEncryptionCallbackOptions
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
	): RequestProtocolCCEncryptionCallback {
		const callbackId = raw.payload[0];
		const transmitStatus: TransmitStatus = raw.payload[1];

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

	public async serialize(ctx: MessageEncodingContext): Promise<Bytes> {
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
