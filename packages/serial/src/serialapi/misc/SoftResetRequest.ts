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

@messageTypes(MessageType.Request, FunctionType.SoftReset)
@priority(MessagePriority.ControllerImmediate)
export class SoftResetRequest extends Message {}
