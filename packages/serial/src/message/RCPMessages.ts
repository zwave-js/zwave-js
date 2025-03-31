import {
	type MessageOrCCLogEntry,
	ZWaveError,
	ZWaveErrorCodes,
	createReflectionDecorator,
	highResTimestamp,
} from "@zwave-js/core";
import {
	Bytes,
	type TypedClassDecorator,
	staticExtends,
} from "@zwave-js/shared";
import { RCPFunctionType, RCPMessageType } from "./Constants.js";
import { MessageHeaders } from "./MessageHeaders.js";

export type RCPMessageConstructor<T extends RCPMessage> =
	& typeof RCPMessage
	& {
		new (
			options: RCPMessageOptions,
		): T;
	};

export interface RCPMessageBaseOptions {
	callbackId?: number;
}

export interface RCPMessageOptions extends RCPMessageBaseOptions {
	type?: RCPMessageType;
	functionType?: RCPFunctionType;
	expectedResponse?:
		| RCPFunctionType
		| typeof RCPMessage
		| RCPResponsePredicate;
	expectedCallback?:
		| RCPFunctionType
		| typeof RCPMessage
		| RCPResponsePredicate;
	payload?: Bytes;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RCPMessageParsingContext {
	// Intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RCPMessageEncodingContext {
	// Intentionally empty
}

/** Returns the number of bytes the first message in the buffer occupies */
function getMessageLength(data: Uint8Array): number {
	const remainingLength = data[1];
	return remainingLength + 2;
}

export class RCPMessageRaw {
	public constructor(
		public readonly type: RCPMessageType,
		public readonly functionType: RCPFunctionType,
		public readonly payload: Bytes,
	) {}

	public static parse(data: Uint8Array): RCPMessageRaw {
		// SOF, length, type, commandId and checksum must be present
		if (!data.length || data.length < 5) {
			throw new ZWaveError(
				"Could not deserialize the command because it was truncated",
				ZWaveErrorCodes.PacketFormat_Truncated,
			);
		}
		// the packet has to start with SOF
		if (data[0] !== MessageHeaders.SOF) {
			throw new ZWaveError(
				"Could not deserialize the command because it does not start with SOF",
				ZWaveErrorCodes.PacketFormat_Invalid,
			);
		}
		// check the length again, this time with the transmitted length
		const messageLength = getMessageLength(data);
		if (data.length < messageLength) {
			throw new ZWaveError(
				"Could not deserialize the command because it was truncated",
				ZWaveErrorCodes.PacketFormat_Truncated,
			);
		}
		// check the checksum
		const expectedChecksum = computeChecksum(
			data.subarray(0, messageLength),
		);
		if (data[messageLength - 1] !== expectedChecksum) {
			throw new ZWaveError(
				"Could not deserialize the command because the checksum didn't match",
				ZWaveErrorCodes.PacketFormat_Checksum,
			);
		}

		const type: RCPMessageType = data[2];
		const functionType: RCPFunctionType = data[3];
		const payloadLength = messageLength - 5;
		const payload = Bytes.view(data.subarray(4, 4 + payloadLength));

		return new RCPMessageRaw(type, functionType, payload);
	}

	public withPayload(payload: Bytes): RCPMessageRaw {
		return new RCPMessageRaw(this.type, this.functionType, payload);
	}
}

/**
 * Represents a Z-Wave message for communication with the RCP firmware
 */
export class RCPMessage {
	public constructor(
		options: RCPMessageOptions = {},
	) {
		const {
			// Try to determine the message type if none is given
			type = getRCPMessageType(this),
			// Try to determine the function type if none is given
			functionType = getRcpFunctionType(this),
			// Fall back to decorated response/callback types if none is given
			expectedResponse = getExpectedRcpResponse(this),
			expectedCallback = getExpectedRcpCallback(this),
			payload = new Bytes(),
		} = options;

		if (type == undefined) {
			throw new ZWaveError(
				"A message must have a given or predefined message type",
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (functionType == undefined) {
			throw new ZWaveError(
				"A message must have a given or predefined function type",
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		this.type = type;
		this.functionType = functionType;
		this.expectedResponse = expectedResponse;
		this.expectedCallback = expectedCallback;
		this.payload = payload;
	}

	public static parse(
		data: Uint8Array,
		ctx: RCPMessageParsingContext,
	): RCPMessage {
		const raw = RCPMessageRaw.parse(data);

		const Constructor = getRCPMessageConstructor(raw.type, raw.functionType)
			?? RCPMessage;

		return Constructor.from(raw, ctx);
	}

	/** Creates an instance of the message that is serialized in the given buffer */
	public static from(
		raw: RCPMessageRaw,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		ctx: RCPMessageParsingContext,
	): RCPMessage {
		return new this({
			type: raw.type,
			functionType: raw.functionType,
			payload: raw.payload,
		});
	}

	public type: RCPMessageType;
	public functionType: RCPFunctionType;
	public expectedResponse:
		| RCPFunctionType
		| typeof RCPMessage
		| RCPResponsePredicate
		| undefined;
	public expectedCallback:
		| RCPFunctionType
		| typeof RCPMessage
		| RCPResponsePredicate
		| undefined;
	public payload: Bytes; // TODO: Length limit 255

	/** Used to map requests to callbacks */
	public callbackId: number | undefined;

	protected assertCallbackId(): asserts this is this & {
		callbackId: number;
	} {
		if (this.callbackId == undefined) {
			throw new ZWaveError(
				"Callback ID required but not set",
				ZWaveErrorCodes.PacketFormat_Invalid,
			);
		}
	}

	/** Returns whether the callback ID is set */
	public hasCallbackId(): this is this & { callbackId: number } {
		return this.callbackId != undefined;
	}

	/**
	 * Tests whether this message needs a callback ID to match its response
	 */
	public needsCallbackId(): boolean {
		return true;
	}

	/** Returns the response timeout for this message in case the default settings do not apply. */
	public getResponseTimeout(): number | undefined {
		// Use default timeout
		return;
	}

	/** Returns the callback timeout for this message in case the default settings do not apply. */
	public getCallbackTimeout(): number | undefined {
		// Use default timeout
		return;
	}

	/**
	 * Serializes this message into a Buffer
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
	public async serialize(ctx: RCPMessageEncodingContext): Promise<Bytes> {
		const ret = new Bytes(this.payload.length + 5);
		ret[0] = MessageHeaders.SOF;
		// length of the following data, including the checksum
		ret[1] = this.payload.length + 3;
		// write the remaining data
		ret[2] = this.type;
		ret[3] = this.functionType;
		ret.set(this.payload, 4);
		// followed by the checksum
		ret[ret.length - 1] = computeChecksum(ret);
		return ret;
	}

	/** Generates a representation of this RCPMessage for the log */
	public toLogEntry(): MessageOrCCLogEntry {
		const tags = [
			this.type === RCPMessageType.Request ? "REQ" : "RES",
			RCPFunctionType[this.functionType],
		];
		// const nodeId = this.getNodeId();
		// if (nodeId) tags.unshift(getNodeTag(nodeId));

		return {
			tags,
			message: this.payload.length > 0
				? { payload: `0x${this.payload.toString("hex")}` }
				: undefined,
		};
	}

	private testMessage(
		msg: RCPMessage,
		predicate: RCPMessage["expectedResponse"],
	): boolean {
		if (predicate == undefined) return false;
		if (typeof predicate === "number") {
			return msg.functionType === predicate;
		}
		if (staticExtends(predicate, RCPMessage)) {
			// predicate is a RCPMessage constructor
			return msg instanceof predicate;
		} else {
			// predicate is a ResponsePredicate
			return predicate(this, msg);
		}
	}

	/** Tests whether this message expects an ACK from the controller */
	public expectsAck(): boolean {
		return true;
	}

	/** Tests whether this message expects a response from the controller */
	public expectsResponse(): boolean {
		return !!this.expectedResponse;
	}

	/** Tests whether this message expects a callback from the controller */
	public expectsCallback(): boolean {
		// A message expects a callback...
		return (
			// ...when it has a callback id that is not 0 (no callback)
			((this.hasCallbackId() && this.callbackId !== 0)
				// or the message type does not need a callback id to match the response
				|| !this.needsCallbackId())
			// and the expected callback is defined
			&& !!this.expectedCallback
		);
	}

	/** Checks if a message is an expected response for this message */
	public isExpectedResponse(msg: RCPMessage): boolean {
		return (
			msg.type === RCPMessageType.Response
			&& this.testMessage(msg, this.expectedResponse)
		);
	}

	/** Checks if a message is an expected callback for this message */
	public isExpectedCallback(msg: RCPMessage): boolean {
		if (msg.type !== RCPMessageType.Request) return false;

		// If a received request included a callback id, enforce that the response contains the same
		if (this.callbackId !== msg.callbackId) {
			return false;
		}

		return this.testMessage(msg, this.expectedCallback);
	}

	private _transmissionTimestamp: number | undefined;
	/** The timestamp when this message was (last) transmitted (in nanoseconds) */
	public get transmissionTimestamp(): number | undefined {
		return this._transmissionTimestamp;
	}

	/** Marks this message as sent and sets the transmission timestamp */
	public markAsSent(): void {
		this._transmissionTimestamp = highResTimestamp();
		this._completedTimestamp = undefined;
	}

	private _completedTimestamp: number | undefined;
	public get completedTimestamp(): number | undefined {
		return this._completedTimestamp;
	}

	/** Marks this message as completed and sets the corresponding timestamp */
	public markAsCompleted(): void {
		this._completedTimestamp = highResTimestamp();
	}

	/** Returns the round trip time of this message from transmission until completion. */
	public get rtt(): number | undefined {
		if (this._transmissionTimestamp == undefined) return undefined;
		if (this._completedTimestamp == undefined) return undefined;
		return this._completedTimestamp - this._transmissionTimestamp;
	}
}

/** Computes the checksum for a serialized message as defined in the Z-Wave specs */
function computeChecksum(message: Uint8Array): number {
	let ret = 0xff;
	// exclude SOF and checksum byte from the computation
	for (let i = 1; i < message.length - 1; i++) {
		ret ^= message[i];
	}
	return ret;
}

// =======================
// use decorators to link function types to message classes

export type RCPResponseRole =
	| "unexpected" // a message that does not belong to this transaction
	| "confirmation" // a confirmation response, e.g. controller reporting that a message was sent
	| "final" // a final response (leading to a resolved transaction)
	| "fatal"; // a response from the controller that leads to a rejected transaction

/**
 * A predicate function to test if a received message matches to the sent message
 */
export type RCPResponsePredicate<TSent extends RCPMessage = RCPMessage> = (
	sentMessage: TSent,
	receivedMessage: RCPMessage,
) => boolean;

function getMessageTypeMapKey(
	messageType: RCPMessageType,
	functionType: RCPFunctionType,
): string {
	return JSON.stringify({ messageType, functionType });
}

const rcpMessageTypesDecorator = createReflectionDecorator<
	typeof RCPMessage,
	[messageType: RCPMessageType, functionType: RCPFunctionType],
	{ messageType: RCPMessageType; functionType: RCPFunctionType },
	RCPMessageConstructor<RCPMessage>
>({
	name: "rcpMessageTypes",
	valueFromArgs: (messageType, functionType) => ({
		messageType,
		functionType,
	}),
	constructorLookupKey(target, messageType, functionType) {
		return getMessageTypeMapKey(messageType, functionType);
	},
});

/**
 * Defines the message and function type associated with a Z-Wave message
 */
export const rcpMessageTypes = rcpMessageTypesDecorator.decorator;

/**
 * Retrieves the message type defined for a Z-Wave message class
 */
export function getRCPMessageType<T extends RCPMessage>(
	messageClass: T,
): RCPMessageType | undefined {
	return rcpMessageTypesDecorator.lookupValue(messageClass)?.messageType;
}

/**
 * Retrieves the message type defined for a Z-Wave message class
 */
export function getRCPMessageTypeStatic<
	T extends RCPMessageConstructor<RCPMessage>,
>(
	classConstructor: T,
): RCPMessageType | undefined {
	return rcpMessageTypesDecorator.lookupValueStatic(classConstructor)
		?.messageType;
}

/**
 * Retrieves the function type defined for a Z-Wave message class
 */
export function getRcpFunctionType<T extends RCPMessage>(
	messageClass: T,
): RCPFunctionType | undefined {
	return rcpMessageTypesDecorator.lookupValue(messageClass)?.functionType;
}

/**
 * Retrieves the function type defined for a Z-Wave message class
 */
export function getRcpFunctionTypeStatic<
	T extends RCPMessageConstructor<RCPMessage>,
>(
	classConstructor: T,
): RCPFunctionType | undefined {
	return rcpMessageTypesDecorator.lookupValueStatic(classConstructor)
		?.functionType;
}

/**
 * Looks up the message constructor for a given message type and function type
 */
function getRCPMessageConstructor(
	messageType: RCPMessageType,
	functionType: RCPFunctionType,
): RCPMessageConstructor<RCPMessage> | undefined {
	return rcpMessageTypesDecorator.lookupConstructorByKey(
		getMessageTypeMapKey(messageType, functionType),
	);
}

const expectedRcpResponseDecorator = createReflectionDecorator<
	typeof RCPMessage,
	[
		typeOrPredicate:
			| RCPFunctionType
			| typeof RCPMessage
			| RCPResponsePredicate,
	],
	RCPFunctionType | typeof RCPMessage | RCPResponsePredicate,
	RCPMessageConstructor<RCPMessage>
>({
	name: "expectedRcpResponse",
	valueFromArgs: (typeOrPredicate) => typeOrPredicate,
	constructorLookupKey: false,
});

/**
 * Defines the expected response function type or message class for a Z-Wave message
 */
export const expectedRcpResponse = expectedRcpResponseDecorator.decorator;

/**
 * Retrieves the expected response function type or message class defined for a Z-Wave message class
 */
export function getExpectedRcpResponse<T extends RCPMessage>(
	messageClass: T,
): RCPFunctionType | typeof RCPMessage | RCPResponsePredicate | undefined {
	return expectedRcpResponseDecorator.lookupValue(messageClass);
}

/**
 * Retrieves the function type defined for a Z-Wave message class
 */
export function getExpectedRcpResponseStatic<
	T extends RCPMessageConstructor<RCPMessage>,
>(
	classConstructor: T,
): RCPFunctionType | typeof RCPMessage | RCPResponsePredicate | undefined {
	return expectedRcpResponseDecorator.lookupValueStatic(classConstructor);
}

const expectedRcpCallbackDecorator = createReflectionDecorator<
	typeof RCPMessage,
	[
		typeOrPredicate:
			| RCPFunctionType
			| typeof RCPMessage
			| RCPResponsePredicate,
	],
	RCPFunctionType | typeof RCPMessage | RCPResponsePredicate,
	RCPMessageConstructor<RCPMessage>
>({
	name: "expectedRcpCallback",
	valueFromArgs: (typeOrPredicate) => typeOrPredicate,
	constructorLookupKey: false,
});

/**
 * Defines the expected callback function type or message class for a Z-Wave message
 */
export function expectedRcpCallback<TSent extends typeof RCPMessage>(
	typeOrPredicate:
		| RCPFunctionType
		| typeof RCPMessage
		| RCPResponsePredicate<InstanceType<TSent>>,
): TypedClassDecorator<TSent> {
	return expectedRcpCallbackDecorator.decorator(typeOrPredicate as any);
}

/**
 * Retrieves the expected callback function type or message class defined for a Z-Wave message class
 */
export function getExpectedRcpCallback<T extends RCPMessage>(
	messageClass: T,
): RCPFunctionType | typeof RCPMessage | RCPResponsePredicate | undefined {
	return expectedRcpCallbackDecorator.lookupValue(messageClass);
}

/**
 * Retrieves the function type defined for a Z-Wave message class
 */
export function getExpectedRcpCallbackStatic<
	T extends RCPMessageConstructor<RCPMessage>,
>(
	classConstructor: T,
): RCPFunctionType | typeof RCPMessage | RCPResponsePredicate | undefined {
	return expectedRcpCallbackDecorator.lookupValueStatic(classConstructor);
}

// const priorityDecorator = createReflectionDecorator<
// 	typeof RCPMessage,
// 	[prio: MessagePriority],
// 	MessagePriority
// >({
// 	name: "priority",
// 	valueFromArgs: (priority) => priority,
// 	constructorLookupKey: false,
// });

// /**
//  * Defines the default priority associated with a Z-Wave message
//  */
// export const priority = priorityDecorator.decorator;

// /**
//  * Retrieves the default priority defined for a Z-Wave message class
//  */
// export function getDefaultPriority<T extends RCPMessage>(
// 	messageClass: T,
// ): MessagePriority | undefined {
// 	return priorityDecorator.lookupValue(messageClass);
// }

// /**
//  * Retrieves the default priority defined for a Z-Wave message class
//  */
// export function getDefaultPriorityStatic<
// 	T extends RCPMessageConstructor<RCPMessage>,
// >(
// 	classConstructor: T,
// ): MessagePriority | undefined {
// 	return priorityDecorator.lookupValueStatic(classConstructor);
// }
