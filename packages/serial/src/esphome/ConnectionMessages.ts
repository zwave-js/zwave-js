import {
	ESPHomeMessage,
	ESPHomeMessageType,
	messageType,
} from "./ESPHomeMessage.js";

@messageType(ESPHomeMessageType.DisconnectRequest)
export class DisconnectRequest extends ESPHomeMessage {}

@messageType(ESPHomeMessageType.DisconnectResponse)
export class DisconnectResponse extends ESPHomeMessage {}
