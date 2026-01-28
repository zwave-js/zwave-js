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

@messageTypes(MessageType.Request, FunctionType.EnterBootloader)
@priority(MessagePriority.Controller)
export class EnterBootloaderRequest extends Message {
	public expectsAck(): boolean {
		// When this message is used, the driver switches serial parsers,
		// so the ACK will be ignored
		return false;
	}
}
