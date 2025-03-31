import {
	type LogConfig,
	type LogContainer,
	ZWaveError,
	ZWaveErrorCodes,
	isZWaveError,
} from "@zwave-js/core";
import {
	MessageHeaders,
	type RCPFunctionType,
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
	GetFirmwareInfoRequest,
	type GetFirmwareInfoResponse,
} from "@zwave-js/serial/rcp";
import {
	AsyncQueue,
	type DeepPartial,
	type Expand,
	type Timer,
	TypedEventTarget,
	cloneDeep,
	isAbortError,
	mergeDeep,
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
		ack: number; // >=1, default: 200 ms

		/**
		 * How long to wait for a controller response. Usually this should never elapse, but when it does,
		 * the driver will abort the transmission and try to recover the controller if it is unresponsive.
		 */
		response: number; // [100...10000], default: 500 ms

		callback: number; // [500...10000], default: 1000 ms
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
		ack: 200,
		response: 500,
		callback: 1000,
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

	private supportedFunctionTypes: RCPFunctionType[] = [];

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
		if (typeof this.port === "string") {
			if (
				typeof this.bindings.serial.createFactoryByPath === "function"
			) {
				this.rcpLog.print(`opening serial port ${this.port}`);
				binding = await this.bindings.serial.createFactoryByPath(
					this.port,
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

		await this.interview();

		this.emit("ready");
	}

	private async interview(): Promise<void> {
		const firmwareInfo = await this.getFirmwareInfo();
		console.dir(firmwareInfo);
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
					// this.rcpLog.logMessage(msg, {
					// 	direction: "outbound",
					// });

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
	public async sendMessage<TResponse extends RCPMessage = RCPMessage>(
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
		firmwareType: number;
		firmwareVersion: string;
		supportedFunctionTypes: RCPFunctionType[];
	}> {
		const msg = new GetFirmwareInfoRequest();
		const result = await this.sendMessage<GetFirmwareInfoResponse>(msg);

		return pick(result, [
			"firmwareType",
			"firmwareVersion",
			"supportedFunctionTypes",
		]);
	}

	// #region RCPMessage handling

	/**
	 * Is called when a message is received that does not belong to any ongoing transactions
	 * @param msg The decoded message
	 */
	private async handleReceivedMessage(msg: RCPMessage): Promise<void> {
		// FIXME: Rename this - msg might not be unsolicited
		// This is a message we might have registered handlers for
		try {
			if (msg.type === RCPMessageType.Request) {
				await this.handleRequest(msg);
			} else {
				await this.handleResponse(msg);
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
