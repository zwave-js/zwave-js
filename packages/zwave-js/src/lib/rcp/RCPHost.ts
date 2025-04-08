import {
	ChannelConfiguration,
	type LogConfig,
	type LogContainer,
	MAX_NODES,
	MPDU,
	MPDUHeaderType,
	type MPDULogContext,
	type MPDUParsingContext,
	type MaybeNotKnown,
	NODE_ID_BROADCAST,
	NODE_ID_BROADCAST_LR,
	NOT_KNOWN,
	ProtocolHeaderFormat,
	Protocols,
	RFRegion,
	SinglecastLongRangeMPDU,
	SinglecastZWaveMPDU,
	ZWaveError,
	ZWaveErrorCodes,
	convertRawRSSI,
	getProtocolHeaderFormat,
	isZWaveError,
	protocolDataRateToString,
	rfRegionToRadioProtocolMode,
} from "@zwave-js/core";
import {
	MessageHeaders,
	RCPFunctionType,
	RCPMessage,
	RCPMessageType,
	RCPSerialFrameType,
	type RCPSerialStream,
	RCPSerialStreamFactory,
	type ZWaveSerialBindingFactory,
	type ZWaveSerialPortImplementation,
	isSuccessIndicator,
	isZWaveSerialPortImplementation,
	wrapLegacySerialBinding,
} from "@zwave-js/serial";
import {
	type ChannelInfo,
	GetFirmwareInfoRequest,
	type GetFirmwareInfoResponse,
	RadioLibrary,
	ReceiveCallback,
	SetupRadio_GetRegionRequest,
	type SetupRadio_GetRegionResponse,
	TransmitCallback,
	TransmitCallbackStatus,
	TransmitRequest,
	TransmitResponse,
	TransmitResponseStatus,
} from "@zwave-js/serial/rcp";
import {
	AsyncQueue,
	Bytes,
	type DeepPartial,
	type Expand,
	type Timer,
	TypedEventTarget,
	buffer2hex,
	cloneDeep,
	getEnumMemberName,
	isAbortError,
	mergeDeep,
	num2hex,
	pick,
	setTimer,
} from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";
import {
	type SerialAPICommandMachineInput,
	createSerialAPICommandMachine,
} from "../driver/SerialAPICommandMachine.js";
import { serialAPICommandErrorToZWaveError } from "../driver/StateMachineShared.js";
import { type ZWaveOptions } from "../driver/ZWaveOptions.js";
import { RCPLogger } from "../log/RCP.js";
import { RCPTransaction } from "./RCPTransaction.js";
import {
	RCPTransmitKind,
	type RCPTransmitOptions,
	RCPTransmitResult,
} from "./_Types.js";

const logo: string = `
███████╗     ██╗    ██╗  █████╗  ██╗   ██╗ ██████╗   ██████╗   █████╗ ██████╗
╚══███╔╝     ██║    ██║ ██╔══██╗ ██║   ██║ ██╔═══╝   ██╔══██╗ ██╔═══╝ ██╔══██╗
  ███╔╝ ███╗ ██║ █╗ ██║ ███████║ ██║   ██║ █████╗    ██████╔╝ ██║     ██████╔╝
 ███╔╝  ╚══╝ ██║███╗██║ ██╔══██║ ╚██╗ ██╔╝ ██╔══╝    ██╔══██╗ ██║     ██╔═══╝
███████╗     ╚███╔███╔╝ ██║  ██║  ╚████╔╝  ██████╗   ██║  ██║ ╚█████╗ ██║
╚══════╝      ╚══╝╚══╝  ╚═╝  ╚═╝   ╚═══╝   ╚═════╝   ╚═╝  ╚═╝  ╚════╝ ╚═╝
`.trim();

interface AwaitedThing<T> {
	handler: (thing: T) => void;
	timeout?: Timer;
	predicate: (msg: T) => boolean;
	refreshPredicate?: (msg: T) => boolean;
}

type AwaitedMessageHeader = AwaitedThing<MessageHeaders>;
type AwaitedMessageEntry = AwaitedThing<RCPMessage>;
type AwaitedMPDUEntry = AwaitedThing<MPDU>;

export interface RCPHostEventCallbacks {
	ready: () => void;
	error: (err: Error) => void;
	// frame: (frame: Frame, rawData: Uint8Array) => void;
	// "corrupted frame": (err: CorruptedFrame, rawData: Uint8Array) => void;
}

export type RCPHostEvents = Extract<keyof RCPHostEventCallbacks, string>;

export interface RCPHostOptions {
	/**
	 * Optional log configuration
	 */
	logConfig?: Partial<LogConfig>;

	host?: ZWaveOptions["host"];

	/** Specify timeouts in milliseconds */
	timeouts: {
		/** how long to wait for an ACK */
		ack: number; // >=1, default: 500 ms

		/**
		 * How long to wait for a controller response. Usually this should never elapse, but when it does,
		 * the driver will abort the transmission and try to recover the controller if it is unresponsive.
		 */
		response: number; // [100...10000], default: 1000 ms

		callback: number; // [500...10000], default: 2000 ms
	};
}

export type PartialRCPHostOptions = Expand<
	& DeepPartial<
		Omit<
			RCPHostOptions,
			| "logConfig"
			| "host"
		>
	>
	& Partial<
		Pick<
			RCPHostOptions,
			"host"
		>
	>
	& {
		logConfig?: Partial<LogConfig>;
	}
>;

const defaultOptions: RCPHostOptions = {
	timeouts: {
		ack: 500,
		response: 1000,
		callback: 2000,
	},
};

/** Ensures that the options are valid */
function checkOptions(options: RCPHostOptions): void {
	if (options.timeouts.ack < 1) {
		throw new ZWaveError(
			`The ACK timeout must be positive!`,
			ZWaveErrorCodes.Driver_InvalidOptions,
		);
	}
	if (options.timeouts.response < 100 || options.timeouts.response > 10000) {
		throw new ZWaveError(
			`The Response timeout must be between 100 and 10000 milliseconds!`,
			ZWaveErrorCodes.Driver_InvalidOptions,
		);
	}
	if (options.timeouts.callback < 500 || options.timeouts.callback > 10000) {
		throw new ZWaveError(
			`The Callback timeout must be between 500 and 10000 milliseconds!`,
			ZWaveErrorCodes.Driver_InvalidOptions,
		);
	}
}

export class RCPHost extends TypedEventTarget<RCPHostEventCallbacks> {
	public constructor(
		private port:
			| string
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			| ZWaveSerialPortImplementation
			| ZWaveSerialBindingFactory,
		options: PartialRCPHostOptions = {},
	) {
		super();

		// Ensure the given serial port is valid
		if (
			typeof port !== "string"
			&& !isZWaveSerialPortImplementation(port)
		) {
			throw new ZWaveError(
				`The port must be a string or a valid custom serial port implementation!`,
				ZWaveErrorCodes.Driver_InvalidOptions,
			);
		}

		// Finally apply the defaults, without overwriting any existing settings
		this._options = mergeDeep(
			options,
			cloneDeep(defaultOptions),
		) as RCPHostOptions;

		// And make sure they contain valid values
		checkOptions(this._options);
	}

	// #region Definitions and properties

	private _options: RCPHostOptions;

	/**
	 * The host bindings used to access file system etc.
	 */
	// This is set during `start()` and should not be accessed before
	private bindings!: Omit<
		Required<
			NonNullable<ZWaveOptions["host"]>
		>,
		"db"
	>;

	private serialFactory: RCPSerialStreamFactory | undefined;
	/** The serial port instance */
	private serial: RCPSerialStream | undefined;

	private _destroyPromise: DeferredPromise<void> | undefined;
	private get wasDestroyed(): boolean {
		return !!this._destroyPromise;
	}

	// This is set during `start()` and should not be accessed before
	private _logContainer!: LogContainer;
	// This is set during `start()` and should not be accessed before
	private rcpLog!: RCPLogger;

	private queue: AsyncQueue<RCPTransaction> = new AsyncQueue();

	/** A list of awaited message headers */
	private awaitedMessageHeaders: AwaitedMessageHeader[] = [];
	/** A list of awaited messages */
	private awaitedMessages: AwaitedMessageEntry[] = [];
	/** A list of awaited MPDUs */
	private awaitedMPDUs: AwaitedMPDUEntry[] = [];

	private supportedFunctionTypes: MaybeNotKnown<RCPFunctionType[]>;
	private rcpFirmwareVersion: MaybeNotKnown<string>;
	private radioLibraryVersion: MaybeNotKnown<string>;
	private radioLibrary: MaybeNotKnown<RadioLibrary>;

	private region: MaybeNotKnown<RFRegion>;
	private channelConfig: MaybeNotKnown<ChannelConfiguration>;
	private channels: MaybeNotKnown<ChannelInfo[]>;

	private sequenceNumber: number | undefined;

	// #region Initialization

	public async start(): Promise<void> {
		if (this.wasDestroyed) {
			throw new ZWaveError(
				"The RCPHost was destroyed. Create a new instance and initialize that one.",
				ZWaveErrorCodes.Driver_Destroyed,
			);
		}

		// Populate default bindings. This has to happen asynchronously, so the driver does not have a hard dependency
		// on Node.js internals
		this.bindings = {
			fs: this._options.host?.fs
				?? (await import("@zwave-js/core/bindings/fs/node")).fs,
			serial: this._options.host?.serial
				?? (await import("@zwave-js/serial/bindings/node")).serial,
			log: this._options.host?.log
				?? (await import("@zwave-js/core/bindings/log/node")).log,
		};

		// Initialize logging
		this._logContainer = this.bindings.log(this._options.logConfig);
		this.rcpLog = new RCPLogger(this, this._logContainer);

		// Open the serial port
		let binding: ZWaveSerialBindingFactory;
		const baudrate = 460800;
		if (typeof this.port === "string") {
			if (
				typeof this.bindings.serial.createFactoryByPath === "function"
			) {
				this.rcpLog.print(`opening serial port ${this.port}`);
				binding = await this.bindings.serial.createFactoryByPath(
					this.port,
					{ baudrate },
				);
			} else {
				throw new ZWaveError(
					"This platform does not support creating a serial connection by path",
					ZWaveErrorCodes.Driver_Failed,
				);
			}
		} else if (isZWaveSerialPortImplementation(this.port)) {
			this.rcpLog.print(
				"opening serial port using the provided custom implementation",
			);
			this.rcpLog.print(
				"This is deprecated! Switch to the factory pattern instead.",
				"warn",
			);
			binding = wrapLegacySerialBinding(this.port);
		} else {
			this.rcpLog.print(
				"opening serial port using the provided custom factory",
			);
			binding = this.port;
		}
		this.serialFactory = new RCPSerialStreamFactory(
			binding,
			this._logContainer,
		);

		// TODO: Retry - see Driver.ts
		this.serial = await this.serialFactory.createStream();
		void this.handleSerialData(this.serial);

		// Start draining the queue
		void this.drainTransactionQueue();

		this.rcpLog.print(logo, "info");

		// Re-sync communication
		await this.writeHeader(MessageHeaders.NAK);
		await wait(250);

		await this.interview();

		this.emit("ready");
	}

	private async interview(): Promise<void> {
		this.rcpLog.print(`Querying firmware information...`);
		const firmwareInfo = await this.getFirmwareInfo();
		this.rcpFirmwareVersion = firmwareInfo.rcpFirmwareVersion;
		this.radioLibrary = firmwareInfo.radioLibrary;
		this.radioLibraryVersion = firmwareInfo.radioLibraryVersion;
		this.supportedFunctionTypes = firmwareInfo.supportedFunctionTypes;

		this.rcpLog.print(
			`Received firmware information:
  RCP firmware:  v${this.rcpFirmwareVersion}
  radio library: ${
				getEnumMemberName(RadioLibrary, this.radioLibrary)
			} v${this.radioLibraryVersion}
  supported commands: ${
				this.supportedFunctionTypes.map((ft) =>
					`\n  · ${(RCPFunctionType as any)[ft] ?? "unknown"} (${
						num2hex(ft)
					})`
				).join("")
			}`,
		);

		this.rcpLog.print(`Querying region info...`);
		const regionInfo = await this.getRegion();
		this.region = regionInfo.region;
		this.channelConfig = regionInfo.channelConfig;
		this.channels = regionInfo.channels;

		this.rcpLog.print(
			`Received region information:
  region:         ${getEnumMemberName(RFRegion, this.region)}
  channel config: ${
				getEnumMemberName(
					ChannelConfiguration,
					this.channelConfig,
				)
			}
  channels: ${
				this.channels
					.map((ch) =>
						`\n    · ${ch.channel} (${
							(ch.frequency / 1e6).toFixed(2)
						} MHz): ${protocolDataRateToString(ch.dataRate)}`
					).join("")
			}`,
		);
	}

	// #region Serialport interaction

	private async handleSerialData(serial: RCPSerialStream): Promise<void> {
		try {
			for await (const frame of serial.readable) {
				setImmediate(() => {
					if (frame.type === RCPSerialFrameType.RCP) {
						void this.serialport_onData(frame.data);
					} else {
						// Handle discarded data?
					}
				});
			}
		} catch (e) {
			if (isAbortError(e)) {
				return;
			} else if (
				isZWaveError(e) && e.code === ZWaveErrorCodes.Driver_Failed
			) {
				// A disconnection while soft resetting is to be expected.
				// // The soft reset method will handle reopening
				// if (this.isSoftResetting) return;

				void this.destroyWithMessage(e.message);
				return;
			}
			throw e;
		}
	}

	/**
	 * Is called when the serial port has received a single-byte message or a complete message buffer
	 */
	private async serialport_onData(
		data:
			| Uint8Array
			| MessageHeaders.ACK
			| MessageHeaders.NAK,
	): Promise<void> {
		if (typeof data === "number") {
			switch (data) {
				case MessageHeaders.ACK:
				case MessageHeaders.NAK: {
					// check if someone is waiting for this
					for (const entry of this.awaitedMessageHeaders) {
						if (entry.predicate(data)) {
							entry.handler(data);
							break;
						}
					}
					return;
				}
			}
		}

		let msg: RCPMessage | undefined;
		try {
			// Parse the message while remembering potential decoding errors in embedded CCs
			// This way we can log the invalid CC contents
			msg = RCPMessage.parse(
				data,
				{},
			);

			// all good, send ACK
			await this.writeHeader(MessageHeaders.ACK);
		} catch (e: any) {
			try {
				const response = this.handleDecodeError(e, data, msg);
				if (response) await this.writeHeader(response);
			} catch (ee: any) {
				if (ee instanceof Error) {
					if (/serial port is not open/.test(ee.message)) {
						this.emit("error", ee);
						void this.destroy();
						return;
					}
					// Print something, so we know what is wrong
					this.rcpLog.print(ee.stack ?? ee.message, "error");
				}
			}
			// Don't keep handling the message
			msg = undefined;
		}

		if (msg) {
			void this.handleReceivedMessage(msg);
		}
	}

	/** Handles a decoding error and returns the desired reply to the stick */
	private handleDecodeError(
		e: Error,
		_data: Uint8Array,
		_msg: RCPMessage | undefined,
	): MessageHeaders | undefined {
		if (isZWaveError(e)) {
			switch (e.code) {
				case ZWaveErrorCodes.PacketFormat_Invalid:
				case ZWaveErrorCodes.PacketFormat_Checksum:
				case ZWaveErrorCodes.PacketFormat_Truncated:
					this.rcpLog.print(
						`Dropping message because it contains invalid data`,
						"warn",
					);
					return MessageHeaders.NAK;

				case ZWaveErrorCodes.Deserialization_NotImplemented:
				case ZWaveErrorCodes.CC_NotImplemented:
					this.rcpLog.print(
						`Dropping message because it could not be deserialized: ${e.message}`,
						"warn",
					);
					return MessageHeaders.ACK;

				case ZWaveErrorCodes.Driver_NotReady:
					this.rcpLog.print(
						`Dropping message because the driver is not ready to handle it yet.`,
						"warn",
					);
					return MessageHeaders.ACK;

					// case ZWaveErrorCodes.PacketFormat_InvalidPayload:
					// 	if (msg) {
					// 		this.rcpLog.print(
					// 			`Dropping message with invalid payload`,
					// 			"warn",
					// 		);
					// 		try {
					// 			this.rcpLog.logMessage(msg, {
					// 				direction: "inbound",
					// 			});
					// 		} catch (e) {
					// 			// We shouldn't throw just because logging a message fails
					// 			this.rcpLog.print(
					// 				`Logging a message failed: ${
					// 					getErrorMessage(
					// 						e,
					// 					)
					// 				}`,
					// 			);
					// 		}
					// 	} else {
					// 		this.rcpLog.print(
					// 			`Dropping message with invalid payload${
					// 				typeof e.context === "string"
					// 					? ` (Reason: ${e.context})`
					// 					: ""
					// 			}:\n${buffer2hex(data)}`,
					// 			"warn",
					// 		);
					// 	}
					// 	return MessageHeaders.ACK;
			}
		} else {
			if (/database is not open/.test(e.message)) {
				// The JSONL-DB is not open yet
				this.rcpLog.print(
					`Dropping message because the driver is not ready to handle it yet.`,
					"warn",
				);
				return MessageHeaders.ACK;
			}
		}
		// Pass all other errors through
		throw e;
	}

	/**
	 * Sends a low-level message like ACK, NAK or CAN immediately
	 * @param header The low-level message to send
	 */
	private writeHeader(header: MessageHeaders): Promise<void> {
		// ACK, CAN, NAK
		return this.writeSerial(Uint8Array.from([header]));
	}

	/** Sends a raw datagram to the serialport (if that is open) */
	private async writeSerial(data: Uint8Array): Promise<void> {
		return this.serial?.writeAsync(data);
	}

	// #region Command queue

	/** Handles sequencing of queued Serial API commands */
	private async drainTransactionQueue(): Promise<void> {
		for await (const transaction of this.queue) {
			// Attempt the command multiple times if necessary
			attempts: for (let attempt = 1;; attempt++) {
				try {
					const ret = await this.executeSerialAPICommand(
						transaction.message,
						transaction.stack,
					);
					transaction.promise.resolve(ret);
				} catch (e) {
					if (
						isZWaveError(e)
						&& e.code === ZWaveErrorCodes.Controller_MessageDropped
						&& e.context === "CAN"
						&& attempt < 3
					) {
						// Retry up to 3 times if there are serial collisions
						await wait(100);
						continue attempts;
					}

					// In all other cases, reject the transaction
					transaction.promise.reject(e as Error);
				}
				break attempts;
			}
		}
	}

	/**
	 * Executes a Serial API command and returns or throws the result.
	 * This method should not be called outside of {@link drainSerialAPIQueue}.
	 */
	private async executeSerialAPICommand(
		msg: RCPMessage,
		transactionSource?: string,
	): Promise<RCPMessage | undefined> {
		// // Give the command a callback ID if it needs one
		// if (msg.needsCallbackId() && !msg.hasCallbackId()) {
		// 	msg.callbackId = this.getNextCallbackId();
		// }

		const machine = createSerialAPICommandMachine(msg);
		const abortController = new AbortController();

		let nextInput: SerialAPICommandMachineInput<RCPMessage> | undefined = {
			value: "start",
		};

		while (!machine.done) {
			if (nextInput == undefined) {
				// We should not be in a situation where we have no input for the state machine
				throw new Error(
					"Serial API Command machine is in an invalid state: no input provided",
				);
			}
			const transition = machine.next(nextInput);
			if (transition == undefined) {
				// We should not be in a situation where the state machine does not transition
				throw new Error(
					"Serial API Command machine is in an invalid state: no transition taken",
				);
			}

			// The input was used
			nextInput = undefined;

			// Transition to the new state
			machine.transition(transition.newState);

			// Now check what needs to be done in the new state
			switch (machine.state.value) {
				case "initial":
					// This should never happen
					throw new Error(
						"Serial API Command machine is in an invalid state: transitioned to initial state",
					);

				case "sending": {
					this.rcpLog.logMessage(msg, {
						direction: "outbound",
					});

					// Mark the message as sent immediately before actually sending
					msg.markAsSent();
					const data = await msg.serialize({});
					await this.writeSerial(data);
					nextInput = { value: "message sent" };
					break;
				}

				case "waitingForACK": {
					const controlFlow = await this.waitForMessageHeader(
						() => true,
						this._options.timeouts.ack,
					).catch(() => "timeout" as const);

					if (controlFlow === "timeout") {
						nextInput = { value: "timeout" };
					} else if (controlFlow === MessageHeaders.ACK) {
						nextInput = { value: "ACK" };
					} else if (controlFlow === MessageHeaders.CAN) {
						nextInput = { value: "CAN" };
					} else if (controlFlow === MessageHeaders.NAK) {
						nextInput = { value: "NAK" };
					}

					break;
				}

				case "waitingForResponse": {
					const response = await Promise.race([
						this.waitForMessage(
							(resp) => msg.isExpectedResponse(resp),
							msg.getResponseTimeout()
								?? this._options.timeouts.response,
							undefined,
							abortController.signal,
						).catch(() => "timeout" as const),
					]);

					if (response instanceof Error) {
						// The command was aborted from the outside
						// Remove the pending wait entry
						abortController.abort();
						throw response;
					}

					if (response === "timeout") {
						nextInput = { value: "timeout" };
					} else if (
						isSuccessIndicator(response) && !response.isOK()
					) {
						nextInput = { value: "response NOK", response };
					} else {
						nextInput = { value: "response", response };
					}

					break;
				}

				case "waitingForCallback": {
					const callback = await Promise.race([
						this.waitForMessage(
							(resp) => msg.isExpectedCallback(resp),
							msg.getCallbackTimeout()
								?? this._options.timeouts.callback,
							undefined,
							abortController.signal,
						).catch(() => "timeout" as const),
					]);

					if (callback instanceof Error) {
						// The command was aborted from the outside
						// Remove the pending wait entry
						abortController.abort();
						throw callback;
					}

					if (callback === "timeout") {
						nextInput = { value: "timeout" };
					} else if (
						isSuccessIndicator(callback) && !callback.isOK()
					) {
						nextInput = { value: "callback NOK", callback };
					} else {
						nextInput = { value: "callback", callback };
					}

					break;
				}

				case "success": {
					return machine.state.result;
				}

				case "failure": {
					const { reason, result } = machine.state;
					throw serialAPICommandErrorToZWaveError(
						reason,
						msg,
						result,
						transactionSource,
					);
				}
			}
		}
	}

	/**
	 * Sends a message to the Firmware
	 * @param msg The message to send
	 * @param options (optional) Options regarding the message transmission
	 */
	public async queueSerialApiCommand<
		TResponse extends RCPMessage = RCPMessage,
	>(
		msg: RCPMessage,
		_options: unknown = {},
	): Promise<TResponse> {
		// this.ensureReady();

		// if (options.supportCheck == undefined) options.supportCheck = true;
		// if (
		// 	options.supportCheck
		// 	&& this._controller != undefined
		// 	&& !this._controller.isFunctionSupported(msg.functionType)
		// ) {
		// 	throw new ZWaveError(
		// 		`Your hardware does not support the ${
		// 			FunctionType[msg.functionType]
		// 		} function`,
		// 		ZWaveErrorCodes.Driver_NotSupported,
		// 	);
		// }

		const resultPromise = createDeferredPromise<TResponse>();

		// Create the transaction
		const transaction = new RCPTransaction({
			message: msg,
			// priority: options.priority,
			// parts: generator,
			promise: resultPromise,
			// listener: options.onProgress,
		});

		// And queue it
		this.queue.add(transaction);

		// // If the transaction should expire, start the timeout
		// let expirationTimeout: Timer | undefined;
		// if (options.expire) {
		// 	expirationTimeout = setTimer(() => {
		// 		this.reduceQueues((t, _source) => {
		// 			if (t === transaction) {
		// 				return {
		// 					type: "reject",
		// 					message: `The message has expired`,
		// 					code: ZWaveErrorCodes.Controller_MessageExpired,
		// 				};
		// 			}
		// 			return { type: "keep" };
		// 		});
		// 	}, options.expire).unref();
		// }

		try {
			return await resultPromise;
		} catch (e) {
			if (isZWaveError(e)) {
				// Enrich errors with the transaction's stack instead of the internal stack
				if (!e.transactionSource) {
					throw new ZWaveError(
						e.message,
						e.code,
						e.context,
						transaction.stack,
					);
				}
			}
			throw e;
		} finally {
			// The transaction was handled, so it can no longer expire
			// expirationTimeout?.clear();
		}
	}

	// #region RCP Serial API methods

	private async getFirmwareInfo(): Promise<{
		rcpFirmwareVersion: string;
		radioLibrary: RadioLibrary;
		radioLibraryVersion: string;
		supportedFunctionTypes: RCPFunctionType[];
	}> {
		const msg = new GetFirmwareInfoRequest();
		const result = await this.queueSerialApiCommand<
			GetFirmwareInfoResponse
		>(msg);

		return pick(result, [
			"rcpFirmwareVersion",
			"radioLibrary",
			"radioLibraryVersion",
			"supportedFunctionTypes",
		]);
	}

	private async getRegion(): Promise<{
		region: RFRegion;
		channelConfig: ChannelConfiguration;
		channels: ChannelInfo[];
	}> {
		const msg = new SetupRadio_GetRegionRequest();
		const result = await this.queueSerialApiCommand<
			SetupRadio_GetRegionResponse
		>(
			msg,
		);

		return pick(result, [
			"region",
			"channelConfig",
			"channels",
		]);
	}

	/**
	 * Transmits an MPDU on the given channel and returns whether the transmit has successfully been executed.
	 * Does not wait for an ACK or anything else.
	 */
	public async transmitMPDU(
		mpdu: MPDU,
		channel: number,
	): Promise<TransmitResponseStatus | TransmitCallbackStatus> {
		if (this.region == undefined) {
			throw new ZWaveError(
				`The current region is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		const protocolDataRate = this.channels?.find((ch) =>
			ch.channel === channel
		)?.dataRate;
		if (protocolDataRate == undefined) {
			throw new ZWaveError(
				`The channel ${channel} is not supported in the current region`,
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}

		const logCtx: MPDULogContext = {
			channel,
			protocolDataRate,
			region: this.region,
		};

		this.rcpLog.mpdu(mpdu, logCtx, "outbound");

		const data = mpdu.serialize({
			channel,
			protocolDataRate,
			region: this.region,
		});

		const msg = new TransmitRequest({
			channel,
			data,
		});
		try {
			const result = await this.queueSerialApiCommand<TransmitCallback>(
				msg,
			);
			// Successful transmission
			return result.status;
		} catch (e) {
			if (isZWaveError(e)) {
				if (e.context instanceof TransmitResponse) {
					// The transmission failed
					return e.context.status;
				} else if (e.context instanceof TransmitCallback) {
					return e.context.status;
				}
			}

			// Unexpected error
			throw e;
		}
	}

	// #region RCPMessage handling

	/**
	 * Is called when a message is received that does not belong to any ongoing transactions
	 * @param msg The decoded message
	 */
	private async handleReceivedMessage(msg: RCPMessage): Promise<void> {
		// This is a message we might have registered handlers for
		try {
			this.rcpLog.logMessage(msg, {
				direction: "inbound",
			});

			if (msg.type === RCPMessageType.Request) {
				await this.handleRequest(msg);
			} else if (msg.type === RCPMessageType.Response) {
				await this.handleResponse(msg);
			} else if (msg.type === RCPMessageType.Callback) {
				await this.handleCallback(msg);
			}
		} catch (e) {
			if (
				isZWaveError(e)
				&& e.code === ZWaveErrorCodes.Driver_NotReady
			) {
				this.rcpLog.print(
					`Cannot handle message because the driver is not ready to handle it yet.`,
					"warn",
				);
			} else {
				throw e;
			}
		}
	}

	/**
	 * Is called when a Response-type message was received
	 */
	private handleResponse(msg: RCPMessage): Promise<void> {
		// Check if we have a dynamic handler waiting for this message
		for (const entry of this.awaitedMessages) {
			if (entry.predicate(msg)) {
				// We do
				entry.handler(msg);
				return Promise.resolve();
			}
		}

		// this.rcpLog.transactionResponse(msg, undefined, "unexpected");
		this.rcpLog.print("unexpected response, discarding...", "warn");

		return Promise.resolve();
	}

	/**
	 * Is called when a Callback-type message was received
	 */
	private handleCallback(msg: RCPMessage): Promise<void> {
		// Check if we have a dynamic handler waiting for this message
		for (const entry of this.awaitedMessages) {
			if (entry.predicate(msg)) {
				// We do
				entry.handler(msg);
				return Promise.resolve();
			}
		}

		if (msg instanceof ReceiveCallback) {
			return this.handleReceiveCallback(msg);
		}

		// this.rcpLog.transactionResponse(msg, undefined, "unexpected");
		this.rcpLog.print(
			`TODO: Handle callback: ${buffer2hex(msg.payload)}`,
			"warn",
		);

		return Promise.resolve();
	}

	private async handleReceiveCallback(msg: ReceiveCallback): Promise<void> {
		if (this.channelConfig == NOT_KNOWN) {
			this.rcpLog.print(
				`Cannot parse received frame: The current channel configuration is not known yet.`,
				"error",
			);
			return;
		}

		const protocolDataRate = this.channels?.find((ch) =>
			ch.channel === msg.channel
		)?.dataRate;
		if (protocolDataRate == undefined) {
			this.rcpLog.print(
				`Cannot parse received frame: The channel ${msg.channel} is not supported in the current region.`,
				"error",
			);
			return;
		}

		if (this.region == NOT_KNOWN) {
			this.rcpLog.print(
				`Cannot parse received frame: The region is not known yet.`,
				"error",
			);
			return;
		}

		const ctx: MPDUParsingContext = {
			channel: msg.channel,
			protocolDataRate,
			region: this.region,
		};

		const mpdu = MPDU.parse(Bytes.view(msg.data), ctx);
		const rssi = convertRawRSSI(msg.rssi, this.channelConfig, msg.channel);

		// Check if we have a dynamic handler waiting for this mpdu
		for (const entry of this.awaitedMPDUs) {
			if (entry.predicate(mpdu)) {
				// We do
				this.rcpLog.mpdu(
					mpdu,
					{ ...ctx, rssi },
					"inbound",
				);
				entry.handler(mpdu);
				return Promise.resolve();
			}
		}

		// We don't...
		this.rcpLog.print(
			`TODO: Handle received frame:`,
			"warn",
		);
		this.rcpLog.mpdu(
			mpdu,
			{ ...ctx, rssi },
			"inbound",
		);

		return Promise.resolve();
	}

	/**
	 * Is called when a Request-type message was received
	 */
	private handleRequest(msg: RCPMessage): Promise<void> {
		// Check if we have a dynamic handler waiting for this message
		for (const entry of this.awaitedMessages) {
			if (entry.predicate(msg)) {
				// We do
				entry.handler(msg);
				return Promise.resolve();
			}
		}

		this.rcpLog.print(
			"No handlers for received request - discarding...",
			"warn",
		);

		return Promise.resolve();
	}

	/**
	 * Waits until a matching message header is received or a timeout has elapsed. Returns the received message.
	 *
	 * @param timeout The number of milliseconds to wait. If the timeout elapses, the returned promise will be rejected
	 * @param predicate A predicate function to test all incoming message headers.
	 */
	public waitForMessageHeader(
		predicate: (header: MessageHeaders) => boolean,
		timeout: number,
	): Promise<MessageHeaders> {
		return new Promise<MessageHeaders>((resolve, reject) => {
			const promise = createDeferredPromise<MessageHeaders>();
			const entry: AwaitedMessageHeader = {
				predicate,
				handler: (msg) => promise.resolve(msg),
				timeout: undefined,
			};
			this.awaitedMessageHeaders.push(entry);
			const removeEntry = () => {
				entry.timeout?.clear();
				const index = this.awaitedMessageHeaders.indexOf(entry);
				if (index !== -1) this.awaitedMessageHeaders.splice(index, 1);
			};
			// When the timeout elapses, remove the wait entry and reject the returned Promise
			entry.timeout = setTimer(() => {
				removeEntry();
				reject(
					new ZWaveError(
						`Received no matching serial frame within the provided timeout!`,
						ZWaveErrorCodes.Controller_Timeout,
					),
				);
			}, timeout);
			// When the promise is resolved, remove the wait entry and resolve the returned Promise
			void promise.then((cc) => {
				removeEntry();
				resolve(cc);
			});
		});
	}

	/**
	 * Waits until an unsolicited serial message is received or a timeout has elapsed. Returns the received message.
	 * @param timeout The number of milliseconds to wait. If the timeout elapses, the returned promise will be rejected
	 * @param predicate A predicate function to test all incoming messages.
	 * @param refreshPredicate A predicate function to test partial messages. If this returns `true` for a message, the timer will be restarted.
	 */
	public waitForMessage<T extends RCPMessage>(
		predicate: (msg: RCPMessage) => boolean,
		timeout: number,
		refreshPredicate?: (msg: RCPMessage) => boolean,
		abortSignal?: AbortSignal,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const promise = createDeferredPromise<RCPMessage>();
			const entry: AwaitedMessageEntry = {
				predicate,
				refreshPredicate,
				handler: (msg) => promise.resolve(msg),
				timeout: undefined,
			};
			this.awaitedMessages.push(entry);
			const removeEntry = () => {
				entry.timeout?.clear();
				const index = this.awaitedMessages.indexOf(entry);
				if (index !== -1) this.awaitedMessages.splice(index, 1);
			};
			// When the timeout elapses, remove the wait entry and reject the returned Promise
			entry.timeout = setTimer(() => {
				removeEntry();
				reject(
					new ZWaveError(
						`Received no matching message within the provided timeout!`,
						ZWaveErrorCodes.Controller_Timeout,
					),
				);
			}, timeout);
			// When the promise is resolved, remove the wait entry and resolve the returned Promise
			void promise.then((cc) => {
				removeEntry();
				resolve(cc as T);
			});
			// When the abort signal is used, silently remove the wait entry
			abortSignal?.addEventListener("abort", () => {
				removeEntry();
			});
		});
	}

	/**
	 * Waits until an MPDU matching the predicate is received or a timeout has elapsed. Returns the received message.
	 * @param timeout The number of milliseconds to wait. If the timeout elapses, the returned promise will be rejected
	 * @param predicate A predicate function to test all incoming messages.
	 * @param refreshPredicate A predicate function to test partial messages. If this returns `true` for a message, the timer will be restarted.
	 */
	public waitForMPDU<T extends MPDU>(
		predicate: (mpdu: MPDU) => boolean,
		timeout: number,
		abortSignal?: AbortSignal,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const promise = createDeferredPromise<MPDU>();
			const entry: AwaitedMPDUEntry = {
				predicate,
				handler: (msg) => promise.resolve(msg),
				timeout: undefined,
			};
			this.awaitedMPDUs.push(entry);
			const removeEntry = () => {
				entry.timeout?.clear();
				const index = this.awaitedMPDUs.indexOf(entry);
				if (index !== -1) this.awaitedMPDUs.splice(index, 1);
			};
			// When the timeout elapses, remove the wait entry and reject the returned Promise
			entry.timeout = setTimer(() => {
				removeEntry();
				reject(
					new ZWaveError(
						`Received no matching message within the provided timeout!`,
						ZWaveErrorCodes.Controller_Timeout,
					),
				);
			}, timeout);
			// When the promise is resolved, remove the wait entry and resolve the returned Promise
			void promise.then((cc) => {
				removeEntry();
				resolve(cc as T);
			});
			// When the abort signal is used, silently remove the wait entry
			abortSignal?.addEventListener("abort", () => {
				removeEntry();
			});
		});
	}

	// #region MAC Layer

	private nextSequenceNumber(headerFormat: ProtocolHeaderFormat): number {
		if (headerFormat === ProtocolHeaderFormat.Classic2Channel) {
			// 4 bits, 0x01..0x0f
			this.sequenceNumber ??= 0x00;
			this.sequenceNumber++;
			if (this.sequenceNumber > 0x0f) {
				this.sequenceNumber = 0x01;
			}
			return this.sequenceNumber;
		} else {
			// 8 bits, 0x00..0xff
			this.sequenceNumber ??= 0xff;
			this.sequenceNumber = (this.sequenceNumber + 1) & 0xff;
			return this.sequenceNumber;
		}
	}

	private async waitBeforeRetransmit(): Promise<void> {
		// Before retransmitting, we must wait for
		// aMacMinRetransmitDelay (10ms) .. aMacMaxRetransmitDelay (40 ms)
		const delay = 10 + Math.round(Math.random() * 30);
		await wait(delay);
	}

	public async transmit(
		data: Uint8Array,
		options: RCPTransmitOptions,
	): Promise<RCPTransmitResult> {
		if (this.region == undefined) {
			throw new ZWaveError(
				`The current region is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		const radioProtocolMode = rfRegionToRadioProtocolMode(this.region);

		// If no protocol is specified, make an assumption based on the node ID
		let protocol: Protocols | undefined = options.protocol;
		if (protocol == undefined) {
			switch (options.destination.kind) {
				case RCPTransmitKind.Singlecast: {
					const nodeId = options.destination.nodeId;
					if (nodeId <= MAX_NODES || nodeId === NODE_ID_BROADCAST) {
						protocol = Protocols.ZWave;
					} else if (nodeId >= 256) {
						protocol = Protocols.ZWaveLongRange;
					} else {
						throw new ZWaveError(
							`Unable to determine protocol for node ID ${nodeId}`,
							ZWaveErrorCodes.Argument_Invalid,
						);
					}
					break;
				}
				case RCPTransmitKind.Multicast: {
					throw new Error("No multicast support yet!");
				}
				case RCPTransmitKind.Broadcast: {
					throw new ZWaveError(
						`The protocol must be specified for broadcast transmissions`,
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
			}
		}

		let initialChannel: number;
		if (protocol === Protocols.ZWave) {
			initialChannel = 0;
		} else {
			// TODO: Figure out if this is correct for LR-only configurations
			initialChannel = 3;
		}

		const headerFormat = getProtocolHeaderFormat(
			radioProtocolMode,
			initialChannel,
		);

		const sequenceNumber = this.nextSequenceNumber(headerFormat);

		let mpdu: MPDU;
		if (protocol == Protocols.ZWave) {
			switch (options.destination.kind) {
				case RCPTransmitKind.Singlecast: {
					mpdu = new SinglecastZWaveMPDU({
						homeId: options.homeId,
						ackRequested: options.ackRequested ?? true,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: options.destination.nodeId,
						sequenceNumber,
						speedModified: false,
					});
					break;
				}
				case RCPTransmitKind.Multicast: {
					throw new Error("No multicast support yet!");
				}
				case RCPTransmitKind.Broadcast: {
					mpdu = new SinglecastZWaveMPDU({
						homeId: options.homeId,
						ackRequested: false,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: NODE_ID_BROADCAST,
						sequenceNumber,
						speedModified: false,
					});
					break;
				}
			}
		} else {
			// Long Range
			switch (options.destination.kind) {
				case RCPTransmitKind.Singlecast: {
					mpdu = new SinglecastLongRangeMPDU({
						homeId: options.homeId,
						ackRequested: options.ackRequested ?? true,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: options.destination.nodeId,
						sequenceNumber,

						// FIXME: Measure those:
						txPower: -6,
						noiseFloor: -110,
					});
					break;
				}
				case RCPTransmitKind.Multicast: {
					throw new Error("No multicast support yet!");
				}
				case RCPTransmitKind.Broadcast: {
					mpdu = new SinglecastLongRangeMPDU({
						homeId: options.homeId,
						ackRequested: false,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: NODE_ID_BROADCAST_LR,
						sequenceNumber,

						// FIXME: Measure those:
						txPower: -6,
						noiseFloor: -110,
					});
					break;
				}
			}
		}

		// FIXME: Find a good heuristic
		let maxAttempts: number;
		let settingsForAttempt: {
			channel: number;
			speedModified: boolean;
		}[] | undefined;
		switch (headerFormat) {
			case ProtocolHeaderFormat.Classic2Channel:
				// FIXME: aMacMaxFrameRetries = 2, we retry 3x
				// Try twice on channel 0,
				// once with speed modified (ch. 1)
				// once with speed modified (ch. 2)
				// FIXME: Skip attempts if we start on another channel
				maxAttempts = 4;
				settingsForAttempt = [
					{
						channel: 0,
						speedModified: false,
					},
					{
						channel: 0,
						speedModified: false,
					},
					{
						channel: 1,
						speedModified: true,
					},
					{
						channel: 2,
						speedModified: true,
					},
				];
				break;
			case ProtocolHeaderFormat.Classic3Channel:
				throw new Error("3-channel regions are not supported yet");
			case ProtocolHeaderFormat.LongRange:
				// Try 3 times on the same channel
				maxAttempts = 3;
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				throw new Error(`Unsupported header format ${headerFormat}`);
		}

		attempts: for (let attempt = 0; attempt < maxAttempts; attempt++) {
			// Serializing an MPDU changes its payload property, so we set it here
			// to the original data
			mpdu.payload = Bytes.view(data);

			// Update MPDU settings if necessary
			const { speedModified, channel } = settingsForAttempt?.[attempt]
				?? {
					channel: initialChannel,
					speedModified: false,
				};
			if ("speedModified" in mpdu) {
				mpdu.speedModified = speedModified;
			}

			const result = await this.transmitMPDU(mpdu, channel);

			switch (result) {
				case TransmitCallbackStatus.Completed:
					// TODO: Wait for ACK
					break;

				case TransmitCallbackStatus.ChannelBusy:
					// TODO: Wait for channel to be free, try again
					return RCPTransmitResult.ChannelBusy;

				case TransmitResponseStatus.Busy:
					return RCPTransmitResult.Error_QueueBusy;

				case TransmitResponseStatus.Overflow:
				case TransmitCallbackStatus.Underflow:
					return RCPTransmitResult.Error_FrameLength;

				case TransmitCallbackStatus.Aborted:
					return RCPTransmitResult.Error_Aborted;

				case TransmitCallbackStatus.Blocked:
					// This one should not happen, since we're not blocking TX
				case TransmitResponseStatus.InvalidChannel:
				case TransmitResponseStatus.InvalidParam:
					// These two should not happen, since we're checking it all beforehand
				case TransmitCallbackStatus.UnknownError:
				default:
					return RCPTransmitResult.Error_Unknown;
			}

			// Transmit was successful
			if (!mpdu.ackRequested) return RCPTransmitResult.OK;

			// Wait for the ACK.
			// If an Ack MPDU is received within the random backoﬀ period (10..40ms)
			// and contains the correct HomeID, source NodeID and a matching sequence number,
			// the transmission is considered successful.
			const ackTimeout = 10 + Math.round(Math.random() * 30);

			const ack = await this.waitForMPDU(
				(m) =>
					m.headerType === MPDUHeaderType.Acknowledgement
					&& m.homeId === mpdu.homeId
					// TODO: This cast is not sound
					&& m.sourceNodeId
						=== (mpdu as SinglecastZWaveMPDU).destinationNodeId
					&& (m.sequenceNumber === mpdu.sequenceNumber
						// For 2-channel configurations, seq-no 0 must also be accepted
						|| (m.sequenceNumber === 0
							&& headerFormat
								=== ProtocolHeaderFormat.Classic2Channel)),
				ackTimeout,
			).then(() => true, () => false);

			if (ack) return RCPTransmitResult.OK;
		}

		return RCPTransmitResult.NoAck;
	}

	// #region destroy()

	private async destroyWithMessage(message: string): Promise<void> {
		this.rcpLog.print(message, "error");

		const error = new ZWaveError(
			message,
			ZWaveErrorCodes.Driver_Failed,
		);
		this.emit("error", error);

		await this.destroy();
	}

	/**
	 * Terminates the RCPHost instance and closes the underlying serial connection.
	 * Must be called under any circumstances.
	 */
	public async destroy(): Promise<void> {
		// Ensure this is only called once and all subsequent calls block
		if (this._destroyPromise) return this._destroyPromise;
		this._destroyPromise = createDeferredPromise();

		this.rcpLog.print("Destroying RCP host...");

		// if (this._active) {
		// 	await this.stop().catch(noop);
		// }

		if (this.serial != undefined) {
			// Avoid spewing errors if the port was in the middle of receiving something
			if (this.serial.isOpen) await this.serial.close();
			this.serial = undefined;
		}

		// Remove all timeouts
		for (
			const timeout of [
				...this.awaitedMPDUs.map((m) => m.timeout),
				...this.awaitedMessages.map((m) => m.timeout),
				...this.awaitedMessageHeaders.map((h) => h.timeout),
			]
		) {
			timeout?.clear();
		}

		this.rcpLog.print("RCP host destroyed");

		// destroy loggers as the very last thing
		this._logContainer.destroy();

		this._destroyPromise.resolve();
	}
}
