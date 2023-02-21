import { CommandClass, ICommandClassContainer } from "@zwave-js/cc";
import {
	MAX_NODES,
	MessageOrCCLogEntry,
	MessagePriority,
	MulticastCC,
	NODE_ID_BROADCAST,
	SinglecastCC,
	TransmitOptions,
	TransmitStatus,
	TXReport,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import type { ZWaveHost } from "@zwave-js/host";
import {
	expectedCallback,
	expectedResponse,
	FunctionType,
	gotDeserializationOptions,
	Message,
	MessageBaseOptions,
	MessageDeserializationOptions,
	MessageOptions,
	MessageOrigin,
	MessageType,
	messageTypes,
	priority,
	SuccessIndicator,
} from "@zwave-js/serial";
import { getEnumMemberName, num2hex } from "@zwave-js/shared";
import { clamp } from "alcalzone-shared/math";
import { ApplicationCommandRequest } from "../application/ApplicationCommandRequest";
import { BridgeApplicationCommandRequest } from "../application/BridgeApplicationCommandRequest";
import { parseTXReport, txReportToMessageRecord } from "./SendDataShared";

export const MAX_SEND_ATTEMPTS = 5;

@messageTypes(MessageType.Request, FunctionType.SendData)
@priority(MessagePriority.Normal)
export class SendDataRequestBase extends Message {
	public constructor(host: ZWaveHost, options: MessageOptions) {
		if (gotDeserializationOptions(options)) {
			if (
				options.origin === MessageOrigin.Host &&
				(new.target as any) !== SendDataRequest
			) {
				return new SendDataRequest(host, options);
			} else if (
				options.origin !== MessageOrigin.Host &&
				(new.target as any) !== SendDataRequestTransmitReport
			) {
				return new SendDataRequestTransmitReport(host, options);
			}
		}
		super(host, options);
	}
}

interface SendDataRequestOptions<CCType extends CommandClass = CommandClass>
	extends MessageBaseOptions {
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
		host: ZWaveHost,
		options: MessageDeserializationOptions | SendDataRequestOptions<CCType>,
	) {
		super(host, options);

		if (gotDeserializationOptions(options)) {
			this._nodeId = this.payload[0];
			const serializedCCLength = this.payload[1];
			this.transmitOptions = this.payload[2 + serializedCCLength];
			this.callbackId = this.payload[3 + serializedCCLength];
			this.payload = this.payload.slice(2, 2 + serializedCCLength);

			if (options.parseCCs !== false) {
				this.command = CommandClass.from(host, {
					nodeId: this._nodeId,
					data: this.payload,
					origin: options.origin,
				}) as SinglecastCC<CCType>;
			} else {
				// Little hack for testing with a network mock. This will be parsed in the next step.
				this.command = undefined as any;
			}
		} else {
			if (!options.command.isSinglecast()) {
				throw new ZWaveError(
					`SendDataRequest can only be used for singlecast and broadcast CCs`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			this.command = options.command;
			this._nodeId = this.command.nodeId;
			this.transmitOptions =
				options.transmitOptions ?? TransmitOptions.DEFAULT;
			if (options.maxSendAttempts != undefined) {
				this.maxSendAttempts = options.maxSendAttempts;
			}
		}
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

	public serialize(): Buffer {
		const serializedCC = this.command.serialize();
		this.payload = Buffer.concat([
			Buffer.from([this.command.nodeId, serializedCC.length]),
			serializedCC,
			Buffer.from([this.transmitOptions, this.callbackId]),
		]);

		return super.serialize();
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"transmit options": num2hex(this.transmitOptions),
				"callback id": this.callbackId,
			},
		};
	}

	/** Computes the maximum payload size that can be transmitted with this message */
	public getMaxPayloadLength(): number {
		// From INS13954-7, chapter 4.3.3.1.5
		if (this.transmitOptions & TransmitOptions.Explore) return 46;
		if (this.transmitOptions & TransmitOptions.AutoRoute) return 48;
		return 54;
	}

	public expectsNodeUpdate(): boolean {
		return (
			// Only true singlecast commands may expect a response
			this.command.isSinglecast() &&
			this.command.nodeId !== NODE_ID_BROADCAST &&
			// ... and only if the command expects a response
			this.command.expectsCCResponse()
		);
	}

	public isExpectedNodeUpdate(msg: Message): boolean {
		return (
			(msg instanceof ApplicationCommandRequest ||
				msg instanceof BridgeApplicationCommandRequest) &&
			this.command.isExpectedCCResponse(msg.command)
		);
	}
}

interface SendDataRequestTransmitReportOptions extends MessageBaseOptions {
	transmitStatus: TransmitStatus;
	callbackId: number;
	txReport?: TXReport;
}

export class SendDataRequestTransmitReport
	extends SendDataRequestBase
	implements SuccessIndicator
{
	public constructor(
		host: ZWaveHost,
		options:
			| MessageDeserializationOptions
			| SendDataRequestTransmitReportOptions,
	) {
		super(host, options);

		if (gotDeserializationOptions(options)) {
			this.callbackId = this.payload[0];
			this.transmitStatus = this.payload[1];
			this.txReport = parseTXReport(
				this.transmitStatus !== TransmitStatus.NoAck,
				this.payload.slice(2),
			);
		} else {
			this.callbackId = options.callbackId;
			this.transmitStatus = options.transmitStatus;
		}
	}

	public transmitStatus: TransmitStatus;
	public txReport: TXReport | undefined;

	public serialize(): Buffer {
		this.payload = Buffer.from([
			this.callbackId,
			this.transmitStatus,
			// TODO: Serialize TXReport
		]);

		return super.serialize();
	}

	public isOK(): boolean {
		return this.transmitStatus === TransmitStatus.OK;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId,
				"transmit status":
					getEnumMemberName(TransmitStatus, this.transmitStatus) +
					(this.txReport
						? `, took ${this.txReport.txTicks * 10} ms`
						: ""),
				...(this.txReport
					? txReportToMessageRecord(this.txReport)
					: {}),
			},
		};
	}
}

export interface SendDataResponseOptions extends MessageBaseOptions {
	wasSent: boolean;
}

@messageTypes(MessageType.Response, FunctionType.SendData)
export class SendDataResponse extends Message implements SuccessIndicator {
	public constructor(
		host: ZWaveHost,
		options: MessageDeserializationOptions | SendDataResponseOptions,
	) {
		super(host, options);
		if (gotDeserializationOptions(options)) {
			this.wasSent = this.payload[0] !== 0;
		} else {
			this.wasSent = options.wasSent;
		}
	}

	public wasSent: boolean;

	public serialize(): Buffer {
		this.payload = Buffer.from([this.wasSent ? 1 : 0]);
		return super.serialize();
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
	public constructor(host: ZWaveHost, options: MessageOptions) {
		if (
			gotDeserializationOptions(options) &&
			(new.target as any) !== SendDataMulticastRequestTransmitReport
		) {
			return new SendDataMulticastRequestTransmitReport(host, options);
		}
		super(host, options);
	}
}

interface SendDataMulticastRequestOptions<CCType extends CommandClass>
	extends MessageBaseOptions {
	command: CCType;
	transmitOptions?: TransmitOptions;
	maxSendAttempts?: number;
}

@expectedResponse(FunctionType.SendDataMulticast)
@expectedCallback(FunctionType.SendDataMulticast)
export class SendDataMulticastRequest<
		CCType extends CommandClass = CommandClass,
	>
	extends SendDataMulticastRequestBase
	implements ICommandClassContainer
{
	public constructor(
		host: ZWaveHost,
		options: SendDataMulticastRequestOptions<CCType>,
	) {
		super(host, options);

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
		} else if (options.command.nodeId.some((n) => n < 1 || n > MAX_NODES)) {
			throw new ZWaveError(
				`All node IDs must be between 1 and ${MAX_NODES}!`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		this.command = options.command;
		this.transmitOptions =
			options.transmitOptions ?? TransmitOptions.DEFAULT;
		if (options.maxSendAttempts != undefined) {
			this.maxSendAttempts = options.maxSendAttempts;
		}
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

	public override getNodeId(): number | undefined {
		// This is multicast, getNodeId must return undefined here
		return undefined;
	}

	public serialize(): Buffer {
		// The payload CC must not include the target node ids, so strip the header out
		const serializedCC = this.command.serialize();
		this.payload = Buffer.concat([
			// # of target nodes and nodeIds
			Buffer.from([
				this.command.nodeId.length,
				...this.command.nodeId,
				serializedCC.length,
			]),
			// payload
			serializedCC,
			Buffer.from([this.transmitOptions, this.callbackId]),
		]);

		return super.serialize();
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"target nodes": this.command.nodeId.join(", "),
				"transmit options": num2hex(this.transmitOptions),
				"callback id": this.callbackId,
			},
		};
	}
}

interface SendDataMulticastRequestTransmitReportOptions
	extends MessageBaseOptions {
	transmitStatus: TransmitStatus;
	callbackId: number;
}

export class SendDataMulticastRequestTransmitReport
	extends SendDataMulticastRequestBase
	implements SuccessIndicator
{
	public constructor(
		host: ZWaveHost,
		options:
			| MessageDeserializationOptions
			| SendDataMulticastRequestTransmitReportOptions,
	) {
		super(host, options);

		if (gotDeserializationOptions(options)) {
			this.callbackId = this.payload[0];
			this._transmitStatus = this.payload[1];
			// not sure what bytes 2 and 3 mean
			// the CC seems not to be included in this, but rather come in an application command later
		} else {
			this.callbackId = options.callbackId;
			this._transmitStatus = options.transmitStatus;
		}
	}

	private _transmitStatus: TransmitStatus;
	public get transmitStatus(): TransmitStatus {
		return this._transmitStatus;
	}

	public isOK(): boolean {
		return this._transmitStatus === TransmitStatus.OK;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId,
				"transmit status": getEnumMemberName(
					TransmitStatus,
					this.transmitStatus,
				),
			},
		};
	}
}

@messageTypes(MessageType.Response, FunctionType.SendDataMulticast)
export class SendDataMulticastResponse
	extends Message
	implements SuccessIndicator
{
	public constructor(
		host: ZWaveHost,
		options: MessageDeserializationOptions,
	) {
		super(host, options);
		this._wasSent = this.payload[0] !== 0;
		// if (!this._wasSent) this._errorCode = this.payload[0];
	}

	public isOK(): boolean {
		return this._wasSent;
	}

	private _wasSent: boolean;
	public get wasSent(): boolean {
		return this._wasSent;
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
