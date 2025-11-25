import {
	type MessageOrCCLogEntry,
	MessagePriority,
	encodeNodeID,
	parseNodeID,
} from "@zwave-js/core";
import {
	FunctionType,
	Message,
	type MessageBaseOptions,
	type MessageEncodingContext,
	type MessageParsingContext,
	type MessageRaw,
	MessageType,
	type SuccessIndicator,
	expectedResponse,
	messageTypes,
	priority,
} from "@zwave-js/serial";
import { type Bytes } from "@zwave-js/shared";

export interface EnableNodeNLSRequestOptions {
	nlsNodeId: number;
}

@messageTypes(MessageType.Request, FunctionType.EnableNodeNLS)
@priority(MessagePriority.Normal)
@expectedResponse(FunctionType.EnableNodeNLS)
export class EnableNodeNLSRequest extends Message {
	public constructor(
		options: EnableNodeNLSRequestOptions & MessageBaseOptions,
	) {
		super(options);
		this.nlsNodeId = options.nlsNodeId;
	}

	public nlsNodeId: number;

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): EnableNodeNLSRequest {
		const { nodeId } = parseNodeID(raw.payload, ctx.nodeIdType, 0);

		return new this({
			nlsNodeId: nodeId,
		});
	}

	public async serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = encodeNodeID(this.nlsNodeId);

		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"NLS node id": this.nlsNodeId,
			},
		};
	}
}

export interface EnableNodeNLSResponseOptions {
	success: boolean;
}

@messageTypes(MessageType.Response, FunctionType.EnableNodeNLS)
export class EnableNodeNLSResponse extends Message implements SuccessIndicator {
	public constructor(
		options: EnableNodeNLSResponseOptions & MessageBaseOptions,
	) {
		super(options);
		this.success = options.success;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): EnableNodeNLSResponse {
		const success = raw.payload[0] !== 0;

		return new this({
			success,
		});
	}

	isOK(): boolean {
		return this.success;
	}

	public readonly success: boolean;

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: { success: this.success },
		};
	}
}
