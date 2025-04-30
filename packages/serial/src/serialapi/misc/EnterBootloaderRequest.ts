import { MessagePriority } from "@zwave-js/core";
import {
	FunctionType,
	Message,
	MessageType,
	messageTypes,
	priority,
} from "@zwave-js/serial";

@messageTypes(MessageType.Request, FunctionType.EnterBootloader)
@priority(MessagePriority.Controller)
export class EnterBootloaderRequest extends Message {
	public expectsAck(): boolean {
		// When this message is used, the driver switches serial parsers,
		// so the ACK will be ignored
		return false;
	}
}
