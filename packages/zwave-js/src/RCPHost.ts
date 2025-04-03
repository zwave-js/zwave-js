export { RCPFunctionType, RCPMessage, RCPMessageType } from "@zwave-js/serial";
export type {
	RCPMessageOptions,
	RCPResponsePredicate,
	RCPResponseRole,
} from "@zwave-js/serial";
export type { GetFirmwareInfoResponseOptions } from "@zwave-js/serial/rcp";
export {
	GetFirmwareInfoRequest,
	GetFirmwareInfoResponse,
} from "@zwave-js/serial/rcp";
export type { RCPLogContext } from "./lib/log/RCP.js";
export type {
	PartialRCPHostOptions,
	RCPHostEventCallbacks,
	RCPHostEvents,
	RCPHostOptions,
} from "./lib/rcp/RCPHost.js";
export { RCPHost } from "./lib/rcp/RCPHost.js";
