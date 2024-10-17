import {
	type MessageOrCCLogEntry,
	MessagePriority,
	NUM_NODEMASK_BYTES,
	encodeNodeID,
	parseNodeBitMask,
} from "@zwave-js/core";
import {
	FunctionType,
	Message,
	type MessageBaseOptions,
	type MessageDeserializationOptions,
	type MessageEncodingContext,
	MessageType,
	expectedResponse,
	messageTypes,
	priority,
} from "@zwave-js/serial";

interface GetRoutingInfoRequestOptions extends MessageBaseOptions {
	nodeId: number;
	removeNonRepeaters?: boolean;
	removeBadLinks?: boolean;
}

@messageTypes(MessageType.Request, FunctionType.GetRoutingInfo)
@expectedResponse(FunctionType.GetRoutingInfo)
@priority(MessagePriority.Controller)
export class GetRoutingInfoRequest extends Message {
	public constructor(options: GetRoutingInfoRequestOptions) {
		super(options);
		this.sourceNodeId = options.nodeId;
		this.removeNonRepeaters = !!options.removeNonRepeaters;
		this.removeBadLinks = !!options.removeBadLinks;
	}

	public sourceNodeId: number;
	public removeNonRepeaters: boolean;
	public removeBadLinks: boolean;

	public serialize(ctx: MessageEncodingContext): Buffer {
		const nodeId = encodeNodeID(this.sourceNodeId, ctx.nodeIdType);
		const optionsByte = (this.removeBadLinks ? 0b1000_0000 : 0)
			| (this.removeNonRepeaters ? 0b0100_0000 : 0);
		this.payload = Buffer.concat([
			nodeId,
			Buffer.from([
				optionsByte,
				0, // callbackId - this must be 0 as per the docs
			]),
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"remove non-repeaters": this.removeNonRepeaters,
				"remove bad links": this.removeBadLinks,
			},
		};
	}
}

@messageTypes(MessageType.Response, FunctionType.GetRoutingInfo)
export class GetRoutingInfoResponse extends Message {
	public constructor(
		options: MessageDeserializationOptions,
	) {
		super(options);

		if (this.payload.length === NUM_NODEMASK_BYTES) {
			// the payload contains a bit mask of all neighbor nodes
			this._nodeIds = parseNodeBitMask(this.payload);
		} else {
			this._nodeIds = [];
		}
	}

	private _nodeIds: number[];
	public get nodeIds(): number[] {
		return this._nodeIds;
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: { "node ids": `${this._nodeIds.join(", ")}` },
		};
	}
}
