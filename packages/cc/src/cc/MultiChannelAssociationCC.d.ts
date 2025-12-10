import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { type AssociationAddress, type EndpointAddress, MultiChannelAssociationCommand } from "../lib/_Types.js";
export declare const MultiChannelAssociationCCValues: Readonly<{
    groupCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "groupCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
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
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "maxNodes";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
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
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "nodeIds";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
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
    endpoints: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "endpoints";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly endpoint: number;
            readonly property: "endpoints";
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
export declare class MultiChannelAssociationCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: MultiChannelAssociationCommand): MaybeNotKnown<boolean>;
    /**
     * Returns the number of association groups a node supports.
     * Association groups are consecutive, starting at 1.
     */
    getGroupCount(): Promise<MaybeNotKnown<number>>;
    reportGroupCount(groupCount: number): Promise<void>;
    /**
     * Returns information about an association group.
     */
    getGroup(groupId: number): Promise<Pick<MultiChannelAssociationCCReport, "maxNodes" | "endpoints" | "nodeIds"> | undefined>;
    sendReport(options: MultiChannelAssociationCCReportOptions): Promise<void>;
    /**
     * Adds new nodes or endpoints to an association group
     */
    addDestinations(options: MultiChannelAssociationCCSetOptions): Promise<SupervisionResult | undefined>;
    /**
     * Removes nodes or endpoints from an association group
     */
    removeDestinations(options: MultiChannelAssociationCCRemoveOptions): Promise<SupervisionResult | undefined>;
}
export declare class MultiChannelAssociationCC extends CommandClass {
    ccCommand: MultiChannelAssociationCommand;
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
    static getMaxNodesCached(ctx: GetValueDB, endpoint: EndpointId, groupId: number): number;
    /**
     * Returns all the destinations of all association groups reported by the node/endpoint.
     * This only works AFTER the interview process
     */
    static getAllDestinationsCached(ctx: GetValueDB, endpoint: EndpointId): ReadonlyMap<number, readonly AssociationAddress[]>;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export type MultiChannelAssociationCCSetOptions = {
    groupId: number;
} & ({
    nodeIds: number[];
} | {
    endpoints: EndpointAddress[];
} | {
    nodeIds: number[];
    endpoints: EndpointAddress[];
});
export declare class MultiChannelAssociationCCSet extends MultiChannelAssociationCC {
    constructor(options: WithAddress<MultiChannelAssociationCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelAssociationCCSet;
    groupId: number;
    nodeIds: number[];
    endpoints: EndpointAddress[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelAssociationCCRemoveOptions {
    /** The group from which to remove the nodes. If none is specified, the nodes will be removed from all groups. */
    groupId?: number;
    /** The nodes to remove. If no nodeIds and no endpoint addresses are specified, ALL nodes will be removed. */
    nodeIds?: number[];
    /** The single endpoints to remove. If no nodeIds and no endpoint addresses are specified, ALL will be removed. */
    endpoints?: EndpointAddress[];
}
export declare class MultiChannelAssociationCCRemove extends MultiChannelAssociationCC {
    constructor(options: WithAddress<MultiChannelAssociationCCRemoveOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelAssociationCCRemove;
    groupId?: number;
    nodeIds?: number[];
    endpoints?: EndpointAddress[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelAssociationCCReportOptions {
    groupId: number;
    maxNodes: number;
    nodeIds: number[];
    endpoints: EndpointAddress[];
    reportsToFollow: number;
}
export declare class MultiChannelAssociationCCReport extends MultiChannelAssociationCC {
    constructor(options: WithAddress<MultiChannelAssociationCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelAssociationCCReport;
    readonly groupId: number;
    maxNodes: number;
    nodeIds: number[];
    endpoints: EndpointAddress[];
    reportsToFollow: number;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: MultiChannelAssociationCCReport[], _ctx: CCParsingContext): Promise<void>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelAssociationCCGetOptions {
    groupId: number;
}
export declare class MultiChannelAssociationCCGet extends MultiChannelAssociationCC {
    constructor(options: WithAddress<MultiChannelAssociationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelAssociationCCGet;
    groupId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelAssociationCCSupportedGroupingsReportOptions {
    groupCount: number;
}
export declare class MultiChannelAssociationCCSupportedGroupingsReport extends MultiChannelAssociationCC {
    constructor(options: WithAddress<MultiChannelAssociationCCSupportedGroupingsReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelAssociationCCSupportedGroupingsReport;
    readonly groupCount: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MultiChannelAssociationCCSupportedGroupingsGet extends MultiChannelAssociationCC {
}
//# sourceMappingURL=MultiChannelAssociationCC.d.ts.map