import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { type AssociationAddress, AssociationCommand } from "../lib/_Types.js";
export declare const AssociationCCValues: Readonly<{
    hasLifeline: {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "hasLifeline";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "hasLifeline";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    groupCount: {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "groupCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "groupCount";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    maxNodes: ((groupId: number) => {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "maxNodes";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "maxNodes";
            readonly propertyKey: number;
        };
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    nodeIds: ((groupId: number) => {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "nodeIds";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "nodeIds";
            readonly propertyKey: number;
        };
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class AssociationCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: AssociationCommand): MaybeNotKnown<boolean>;
    /**
     * Returns the number of association groups a node supports.
     * Association groups are consecutive, starting at 1.
     */
    getGroupCount(): Promise<MaybeNotKnown<number>>;
    reportGroupCount(groupCount: number): Promise<void>;
    /**
     * Returns information about an association group.
     */
    getGroup(groupId: number): Promise<{
        maxNodes: number;
        nodeIds: number[];
    } | undefined>;
    sendReport(options: AssociationCCReportOptions): Promise<void>;
    /**
     * Adds new nodes to an association group
     */
    addNodeIds(groupId: number, ...nodeIds: number[]): Promise<SupervisionResult | undefined>;
    /**
     * Removes nodes from an association group
     */
    removeNodeIds(options: AssociationCCRemoveOptions): Promise<SupervisionResult | undefined>;
    /**
     * Removes nodes from all association groups
     */
    removeNodeIdsFromAllGroups(nodeIds: number[]): Promise<SupervisionResult | undefined>;
    /**
     * Request the association group that represents the most recently detected button press
     */
    getSpecificGroup(): Promise<number | undefined>;
    /**
     * Report the association group that represents the most recently detected button press
     */
    reportSpecificGroup(group: number): Promise<void>;
}
export declare class AssociationCC extends CommandClass {
    ccCommand: AssociationCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    /**
     * Returns the number of association groups reported by the node/endpoint.
     * This only works AFTER the interview process
     */
    static getGroupCountCached(ctx: GetValueDB, endpoint: EndpointId): number;
    /**
     * Returns the number of nodes an association group supports.
     * This only works AFTER the interview process
     */
    static getMaxNodesCached(ctx: GetValueDB & GetDeviceConfig, endpoint: EndpointId, groupId: number): number;
    /**
     * Returns all the destinations of all association groups reported by the node/endpoint.
     * This only works AFTER the interview process
     */
    static getAllDestinationsCached(ctx: GetValueDB, endpoint: EndpointId): ReadonlyMap<number, readonly AssociationAddress[]>;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface AssociationCCSetOptions {
    groupId: number;
    nodeIds: number[];
}
export declare class AssociationCCSet extends AssociationCC {
    constructor(options: WithAddress<AssociationCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationCCSet;
    groupId: number;
    nodeIds: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationCCRemoveOptions {
    /** The group from which to remove the nodes. If none is specified, the nodes will be removed from all nodes. */
    groupId?: number;
    /** The nodes to remove. If none are specified, ALL nodes will be removed. */
    nodeIds?: number[];
}
export declare class AssociationCCRemove extends AssociationCC {
    constructor(options: WithAddress<AssociationCCRemoveOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationCCRemove;
    groupId?: number;
    nodeIds?: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationCCReportOptions {
    groupId: number;
    maxNodes: number;
    nodeIds: number[];
    reportsToFollow: number;
}
export declare class AssociationCCReport extends AssociationCC {
    constructor(options: WithAddress<AssociationCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationCCReport;
    groupId: number;
    maxNodes: number;
    nodeIds: number[];
    reportsToFollow: number;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: AssociationCCReport[], _ctx: CCParsingContext): Promise<void>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationCCGetOptions {
    groupId: number;
}
export declare class AssociationCCGet extends AssociationCC {
    constructor(options: WithAddress<AssociationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationCCGet;
    groupId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationCCSupportedGroupingsReportOptions {
    groupCount: number;
}
export declare class AssociationCCSupportedGroupingsReport extends AssociationCC {
    constructor(options: WithAddress<AssociationCCSupportedGroupingsReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationCCSupportedGroupingsReport;
    groupCount: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class AssociationCCSupportedGroupingsGet extends AssociationCC {
}
export interface AssociationCCSpecificGroupReportOptions {
    group: number;
}
export declare class AssociationCCSpecificGroupReport extends AssociationCC {
    constructor(options: WithAddress<AssociationCCSpecificGroupReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationCCSpecificGroupReport;
    group: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class AssociationCCSpecificGroupGet extends AssociationCC {
}
//# sourceMappingURL=AssociationCC.d.ts.map