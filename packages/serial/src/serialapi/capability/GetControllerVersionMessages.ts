import { MessagePriority, type ZWaveLibraryTypes } from "@zwave-js/core";
import {
	FunctionType,
	MessageType,
} from "../../message/Constants.js";
import {
	Message,
	type MessageBaseOptions,
	type MessageEncodingContext,
	type MessageParsingContext,
	type MessageRaw,
	expectedResponse,
	messageTypes,
	priority,
} from "../../message/Message.js";
import { Bytes, cpp2js } from "@zwave-js/shared";

@messageTypes(MessageType.Request, FunctionType.GetControllerVersion)
@expectedResponse(FunctionType.GetControllerVersion)
@priority(MessagePriority.Controller)
export class GetControllerVersionRequest extends Message {}

export interface GetControllerVersionResponseOptions {
	controllerType: ZWaveLibraryTypes;
	libraryVersion: string;
}

@messageTypes(MessageType.Response, FunctionType.GetControllerVersion)
export class GetControllerVersionResponse extends Message {
	public constructor(
		options: GetControllerVersionResponseOptions & MessageBaseOptions,
	) {
		super(options);

		this.controllerType = options.controllerType;
		this.libraryVersion = options.libraryVersion;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): GetControllerVersionResponse {
		// The payload consists of a zero-terminated string and a uint8 for the controller type
		const libraryVersion = cpp2js(raw.payload.toString("ascii"));
		const controllerType: ZWaveLibraryTypes =
			raw.payload[libraryVersion.length + 1];

		return new this({
			libraryVersion,
			controllerType,
		});
	}

	public controllerType: ZWaveLibraryTypes;
	public libraryVersion: string;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([
			Bytes.from(`${this.libraryVersion}\0`, "ascii"),
			[this.controllerType],
		]);

		return super.serialize(ctx);
	}
}
