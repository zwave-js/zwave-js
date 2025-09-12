import {
	ESPHomeMessage,
	ESPHomeMessageType,
	messageType,
} from "./ESPHomeMessage.js";

@messageType(ESPHomeMessageType.PingRequest)
export class PingRequest extends ESPHomeMessage {}

@messageType(ESPHomeMessageType.PingResponse)
export class PingResponse extends ESPHomeMessage {}
