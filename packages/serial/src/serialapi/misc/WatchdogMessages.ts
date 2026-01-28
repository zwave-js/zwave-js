import { MessagePriority } from "@zwave-js/core";
import {
	FunctionType,
	MessageType,
} from "../../message/Constants.js";
import {
	Message,
	messageTypes,
	priority,
} from "../../message/Message.js";

// These commands expect no ACK, no response, no callback

@messageTypes(MessageType.Request, FunctionType.StartWatchdog)
@priority(MessagePriority.Controller)
export class StartWatchdogRequest extends Message {
	public override expectsAck(): boolean {
		return false;
	}
}

@messageTypes(MessageType.Request, FunctionType.StopWatchdog)
@priority(MessagePriority.Controller)
export class StopWatchdogRequest extends Message {
	public override expectsAck(): boolean {
		return false;
	}
}
