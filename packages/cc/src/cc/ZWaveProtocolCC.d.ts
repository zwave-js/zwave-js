import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type BasicDeviceClass, CommandClasses, type DataRate, type FLiRS, type NodeInformationFrame, type NodeProtocolInfoAndDeviceClass, type NodeType, type ProtocolVersion, type WithAddress, ZWaveDataRate } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { type NetworkTransferStatus, WakeUpTime, ZWaveProtocolCommand } from "../lib/_Types.js";
export declare class ZWaveProtocolCC extends CommandClass {
    ccCommand: ZWaveProtocolCommand;
}
export interface ZWaveProtocolCCNodeInformationFrameOptions extends NodeInformationFrame {
}
export declare class ZWaveProtocolCCNodeInformationFrame extends ZWaveProtocolCC implements NodeInformationFrame {
    constructor(options: WithAddress<ZWaveProtocolCCNodeInformationFrameOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCNodeInformationFrame;
    basicDeviceClass: BasicDeviceClass;
    genericDeviceClass: number;
    specificDeviceClass: number;
    isListening: boolean;
    isFrequentListening: FLiRS;
    isRouting: boolean;
    supportedDataRates: DataRate[];
    protocolVersion: ProtocolVersion;
    optionalFunctionality: boolean;
    nodeType: NodeType;
    supportsSecurity: boolean;
    supportsBeaming: boolean;
    supportedCCs: CommandClasses[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCRequestNodeInformationFrame extends ZWaveProtocolCC {
}
export interface ZWaveProtocolCCAssignIDsOptions {
    assignedNodeId: number;
    homeId: number;
}
export declare class ZWaveProtocolCCAssignIDs extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCAssignIDsOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCAssignIDs;
    assignedNodeId: number;
    homeId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCFindNodesInRangeOptions {
    candidateNodeIds: number[];
    wakeUpTime: WakeUpTime;
    dataRate?: ZWaveDataRate;
}
export declare class ZWaveProtocolCCFindNodesInRange extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCFindNodesInRangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCFindNodesInRange;
    candidateNodeIds: number[];
    wakeUpTime: WakeUpTime;
    dataRate: ZWaveDataRate;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCRangeInfoOptions {
    neighborNodeIds: number[];
    wakeUpTime?: WakeUpTime;
}
export declare class ZWaveProtocolCCRangeInfo extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCRangeInfoOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCRangeInfo;
    neighborNodeIds: number[];
    wakeUpTime?: WakeUpTime;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCGetNodesInRange extends ZWaveProtocolCC {
}
export interface ZWaveProtocolCCCommandCompleteOptions {
    sequenceNumber: number;
}
export declare class ZWaveProtocolCCCommandComplete extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCCommandCompleteOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCCommandComplete;
    sequenceNumber: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCTransferPresentationOptions {
    supportsNWI: boolean;
    includeNode: boolean;
    excludeNode: boolean;
}
export declare class ZWaveProtocolCCTransferPresentation extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCTransferPresentationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCTransferPresentation;
    supportsNWI: boolean;
    includeNode: boolean;
    excludeNode: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCTransferNodeInformationOptions extends NodeProtocolInfoAndDeviceClass {
    sequenceNumber: number;
    sourceNodeId: number;
}
export declare class ZWaveProtocolCCTransferNodeInformation extends ZWaveProtocolCC implements NodeProtocolInfoAndDeviceClass {
    constructor(options: WithAddress<ZWaveProtocolCCTransferNodeInformationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCTransferNodeInformation;
    sequenceNumber: number;
    sourceNodeId: number;
    basicDeviceClass: BasicDeviceClass;
    genericDeviceClass: number;
    specificDeviceClass: number;
    isListening: boolean;
    isFrequentListening: FLiRS;
    isRouting: boolean;
    supportedDataRates: DataRate[];
    protocolVersion: ProtocolVersion;
    optionalFunctionality: boolean;
    nodeType: NodeType;
    supportsSecurity: boolean;
    supportsBeaming: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCTransferRangeInformationOptions {
    sequenceNumber: number;
    testedNodeId: number;
    neighborNodeIds: number[];
}
export declare class ZWaveProtocolCCTransferRangeInformation extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCTransferRangeInformationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCTransferRangeInformation;
    sequenceNumber: number;
    testedNodeId: number;
    neighborNodeIds: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCTransferEndOptions {
    status: NetworkTransferStatus;
}
export declare class ZWaveProtocolCCTransferEnd extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCTransferEndOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCTransferEnd;
    status: NetworkTransferStatus;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCAssignReturnRouteOptions {
    destinationNodeId: number;
    routeIndex: number;
    repeaters: number[];
    destinationWakeUp: WakeUpTime;
    destinationSpeed: ZWaveDataRate;
}
export declare class ZWaveProtocolCCAssignReturnRoute extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCAssignReturnRouteOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCAssignReturnRoute;
    destinationNodeId: number;
    routeIndex: number;
    repeaters: number[];
    destinationWakeUp: WakeUpTime;
    destinationSpeed: ZWaveDataRate;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCNewNodeRegisteredOptions extends NodeInformationFrame {
    newNodeId: number;
}
export declare class ZWaveProtocolCCNewNodeRegistered extends ZWaveProtocolCC implements NodeInformationFrame {
    constructor(options: WithAddress<ZWaveProtocolCCNewNodeRegisteredOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCNewNodeRegistered;
    newNodeId: number;
    basicDeviceClass: BasicDeviceClass;
    genericDeviceClass: number;
    specificDeviceClass: number;
    isListening: boolean;
    isFrequentListening: FLiRS;
    isRouting: boolean;
    supportedDataRates: DataRate[];
    protocolVersion: ProtocolVersion;
    optionalFunctionality: boolean;
    nodeType: NodeType;
    supportsSecurity: boolean;
    supportsBeaming: boolean;
    supportedCCs: CommandClasses[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCNewRangeRegisteredOptions {
    testedNodeId: number;
    neighborNodeIds: number[];
}
export declare class ZWaveProtocolCCNewRangeRegistered extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCNewRangeRegisteredOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCNewRangeRegistered;
    testedNodeId: number;
    neighborNodeIds: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCTransferNewPrimaryControllerCompleteOptions {
    genericDeviceClass: number;
}
export declare class ZWaveProtocolCCTransferNewPrimaryControllerComplete extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCTransferNewPrimaryControllerCompleteOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCTransferNewPrimaryControllerComplete;
    genericDeviceClass: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCAutomaticControllerUpdateStart extends ZWaveProtocolCC {
}
export interface ZWaveProtocolCCSUCNodeIDOptions {
    sucNodeId: number;
    isSIS: boolean;
}
export declare class ZWaveProtocolCCSUCNodeID extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCSUCNodeIDOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCSUCNodeID;
    sucNodeId: number;
    isSIS: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCSetSUCOptions {
    enableSIS: boolean;
}
export declare class ZWaveProtocolCCSetSUC extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCSetSUCOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCSetSUC;
    enableSIS: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCSetSUCAckOptions {
    accepted: boolean;
    isSIS: boolean;
}
export declare class ZWaveProtocolCCSetSUCAck extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCSetSUCAckOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCSetSUCAck;
    accepted: boolean;
    isSIS: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCAssignSUCReturnRoute extends ZWaveProtocolCCAssignReturnRoute {
}
export interface ZWaveProtocolCCStaticRouteRequestOptions {
    nodeIds: number[];
}
export declare class ZWaveProtocolCCStaticRouteRequest extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCStaticRouteRequestOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCStaticRouteRequest;
    nodeIds: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCLostOptions {
    lostNodeId: number;
}
export declare class ZWaveProtocolCCLost extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCLostOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCLost;
    lostNodeId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCAcceptLostOptions {
    accepted: boolean;
}
export declare class ZWaveProtocolCCAcceptLost extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCAcceptLostOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCAcceptLost;
    accepted: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCNOPPowerOptions {
    powerDampening: number;
}
export declare class ZWaveProtocolCCNOPPower extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCNOPPowerOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCNOPPower;
    powerDampening: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCReservedIDsOptions {
    reservedNodeIDs: number[];
}
export declare class ZWaveProtocolCCReservedIDs extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCReservedIDsOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCReservedIDs;
    reservedNodeIDs: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCReserveNodeIDsOptions {
    numNodeIDs: number;
}
export declare class ZWaveProtocolCCReserveNodeIDs extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCReserveNodeIDsOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCReserveNodeIDs;
    numNodeIDs: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCNodesExistReplyOptions {
    nodeMaskType: number;
    nodeListUpdated: boolean;
}
export declare class ZWaveProtocolCCNodesExistReply extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCNodesExistReplyOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCNodesExistReply;
    nodeMaskType: number;
    nodeListUpdated: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCNodesExistOptions {
    nodeMaskType: number;
    nodeIDs: number[];
}
export declare class ZWaveProtocolCCNodesExist extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCNodesExistOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCNodesExist;
    nodeMaskType: number;
    nodeIDs: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export interface ZWaveProtocolCCSetNWIModeOptions {
    enabled: boolean;
    timeoutMinutes?: number;
}
export declare class ZWaveProtocolCCSetNWIMode extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCSetNWIModeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCSetNWIMode;
    enabled: boolean;
    timeoutMinutes?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCExcludeRequest extends ZWaveProtocolCCNodeInformationFrame {
}
export interface ZWaveProtocolCCAssignReturnRoutePriorityOptions {
    targetNodeId: number;
    routeNumber: number;
}
export declare class ZWaveProtocolCCAssignReturnRoutePriority extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCAssignReturnRoutePriorityOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCAssignReturnRoutePriority;
    targetNodeId: number;
    routeNumber: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCAssignSUCReturnRoutePriority extends ZWaveProtocolCCAssignReturnRoutePriority {
}
export interface ZWaveProtocolCCSmartStartIncludedNodeInformationOptions {
    nwiHomeId: Uint8Array;
}
export declare class ZWaveProtocolCCSmartStartIncludedNodeInformation extends ZWaveProtocolCC {
    constructor(options: WithAddress<ZWaveProtocolCCSmartStartIncludedNodeInformationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWaveProtocolCCSmartStartIncludedNodeInformation;
    nwiHomeId: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare class ZWaveProtocolCCSmartStartPrime extends ZWaveProtocolCCNodeInformationFrame {
}
export declare class ZWaveProtocolCCSmartStartInclusionRequest extends ZWaveProtocolCCNodeInformationFrame {
}
//# sourceMappingURL=ZWaveProtocolCC.d.ts.map