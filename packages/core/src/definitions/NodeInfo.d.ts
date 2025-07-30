import { Bytes } from "@zwave-js/shared";
import type { BasicDeviceClass } from "../registries/DeviceClasses.js";
import { CommandClasses } from "./CommandClasses.js";
import { NodeIDType } from "./NodeID.js";
import type { ProtocolVersion } from "./Protocol.js";
export interface ApplicationNodeInformation {
    genericDeviceClass: number;
    specificDeviceClass: number;
    supportedCCs: CommandClasses[];
}
export declare function parseApplicationNodeInformation(nif: Uint8Array): ApplicationNodeInformation;
export declare function encodeApplicationNodeInformation(nif: ApplicationNodeInformation): Bytes;
export interface NodeUpdatePayload extends ApplicationNodeInformation {
    nodeId: number;
    basicDeviceClass: BasicDeviceClass;
}
export declare function parseNodeUpdatePayload(nif: Uint8Array, nodeIdType?: NodeIDType): NodeUpdatePayload;
export declare function encodeNodeUpdatePayload(nif: NodeUpdatePayload, nodeIdType?: NodeIDType): Bytes;
/**
 * Reads a CC id from the given buffer, returning the parsed CC id and the number of bytes read
 * @param offset The offset at which the CC id is located
 */
export declare function parseCCId(payload: Uint8Array, offset?: number): {
    ccId: CommandClasses;
    bytesRead: number;
};
/**
 * Writes the given CC id into the given buffer at the given location
 * @returns The number of bytes written
 */
export declare function encodeCCId(ccId: CommandClasses, payload: Bytes, offset?: number): number;
export declare function parseCCList(payload: Uint8Array): {
    supportedCCs: CommandClasses[];
    controlledCCs: CommandClasses[];
};
export declare function encodeCCList(supportedCCs: readonly CommandClasses[], controlledCCs: readonly CommandClasses[]): Bytes;
export type FLiRS = false | "250ms" | "1000ms";
export type DataRate = 9600 | 40000 | 100000;
export declare enum NodeType {
    Controller = 0,
    "End Node" = 1
}
export interface NodeProtocolInfo {
    /** Whether this node is always listening or not */
    isListening: boolean;
    /** Indicates the wakeup interval if this node is a FLiRS node. `false` if it isn't. */
    isFrequentListening: FLiRS;
    /** Whether the node supports routing/forwarding messages. */
    isRouting: boolean;
    supportedDataRates: DataRate[];
    protocolVersion: ProtocolVersion;
    /** Whether this node supports additional CCs besides the mandatory minimum */
    optionalFunctionality: boolean;
    /** Whether this node is a controller (can calculate routes) or an end node (relies on route info) */
    nodeType: NodeType;
    /** Whether this node supports (legacy) network security */
    supportsSecurity: boolean;
    /** Whether this node can issue wakeup beams to FLiRS nodes */
    supportsBeaming: boolean;
    /** Whether this node's device class has the specific part */
    hasSpecificDeviceClass: boolean;
}
export interface NodeProtocolInfoAndDeviceClass extends Omit<NodeProtocolInfo, "hasSpecificDeviceClass"> {
    basicDeviceClass: BasicDeviceClass;
    genericDeviceClass: number;
    specificDeviceClass: number;
}
export type NodeInformationFrame = NodeProtocolInfoAndDeviceClass & ApplicationNodeInformation;
export declare function parseNodeProtocolInfo(buffer: Uint8Array, offset: number, isLongRange?: boolean): NodeProtocolInfo;
export declare function encodeNodeProtocolInfo(info: NodeProtocolInfo, isLongRange?: boolean): Bytes;
export declare function parseNodeProtocolInfoAndDeviceClass(buffer: Uint8Array, isLongRange?: boolean): {
    info: NodeProtocolInfoAndDeviceClass;
    bytesRead: number;
};
export declare function encodeNodeProtocolInfoAndDeviceClass(info: NodeProtocolInfoAndDeviceClass, isLongRange?: boolean): Bytes;
export declare function parseNodeInformationFrame(buffer: Uint8Array, isLongRange?: boolean): NodeInformationFrame;
export declare function encodeNodeInformationFrame(info: NodeInformationFrame, isLongRange?: boolean): Bytes;
export declare function parseNodeID(buffer: Uint8Array, type?: NodeIDType, offset?: number): {
    nodeId: number;
    bytesRead: number;
};
export declare function encodeNodeID(nodeId: number, type?: NodeIDType): Bytes;
//# sourceMappingURL=NodeInfo.d.ts.map