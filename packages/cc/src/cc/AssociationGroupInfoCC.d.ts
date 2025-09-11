import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupportsCC, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { AssociationGroupInfoCommand, AssociationGroupInfoProfile } from "../lib/_Types.js";
export declare const AssociationGroupInfoCCValues: Readonly<{
    hasDynamicInfo: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "hasDynamicInfo";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "hasDynamicInfo";
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
    groupName: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "name";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "name";
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
    groupInfo: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "info";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "info";
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
    commands: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "issuedCommands";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "issuedCommands";
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
export declare class AssociationGroupInfoCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: AssociationGroupInfoCommand): MaybeNotKnown<boolean>;
    getGroupName(groupId: number): Promise<MaybeNotKnown<string>>;
    reportGroupName(groupId: number, name: string): Promise<void>;
    getGroupInfo(groupId: number, refreshCache?: boolean): Promise<{
        mode: number;
        profile: number;
        eventCode: number;
        hasDynamicInfo: boolean;
    } | undefined>;
    reportGroupInfo(options: AssociationGroupInfoCCInfoReportOptions): Promise<void>;
    getCommands(groupId: number, allowCache?: boolean): Promise<MaybeNotKnown<AssociationGroupInfoCCCommandListReport["commands"]>>;
    reportCommands(groupId: number, commands: ReadonlyMap<CommandClasses, readonly number[]>): Promise<void>;
}
export declare class AssociationGroupInfoCC extends CommandClass {
    ccCommand: AssociationGroupInfoCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    /** Returns the name of an association group */
    static getGroupNameCached(ctx: GetValueDB, endpoint: EndpointId, groupId: number): MaybeNotKnown<string>;
    /** Returns the association profile for an association group */
    static getGroupProfileCached(ctx: GetValueDB, endpoint: EndpointId, groupId: number): MaybeNotKnown<AssociationGroupInfoProfile>;
    /** Returns the dictionary of all commands issued by the given association group */
    static getIssuedCommandsCached(ctx: GetValueDB, endpoint: EndpointId, groupId: number): MaybeNotKnown<ReadonlyMap<CommandClasses, readonly number[]>>;
    static findGroupsForIssuedCommand(ctx: GetValueDB, endpoint: EndpointId & SupportsCC, ccId: CommandClasses, command: number): number[];
    private static getAssociationGroupCountCached;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface AssociationGroupInfoCCNameReportOptions {
    groupId: number;
    name: string;
}
export declare class AssociationGroupInfoCCNameReport extends AssociationGroupInfoCC {
    constructor(options: WithAddress<AssociationGroupInfoCCNameReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationGroupInfoCCNameReport;
    readonly groupId: number;
    readonly name: string;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationGroupInfoCCNameGetOptions {
    groupId: number;
}
export declare class AssociationGroupInfoCCNameGet extends AssociationGroupInfoCC {
    constructor(options: WithAddress<AssociationGroupInfoCCNameGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationGroupInfoCCNameGet;
    groupId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationGroupInfo {
    groupId: number;
    mode: number;
    profile: number;
    eventCode: number;
}
export interface AssociationGroupInfoCCInfoReportOptions {
    isListMode: boolean;
    hasDynamicInfo: boolean;
    groups: AssociationGroupInfo[];
}
export declare class AssociationGroupInfoCCInfoReport extends AssociationGroupInfoCC {
    constructor(options: WithAddress<AssociationGroupInfoCCInfoReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationGroupInfoCCInfoReport;
    readonly isListMode: boolean;
    readonly hasDynamicInfo: boolean;
    readonly groups: readonly AssociationGroupInfo[];
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type AssociationGroupInfoCCInfoGetOptions = {
    refreshCache: boolean;
} & ({
    listMode: boolean;
} | {
    groupId: number;
});
export declare class AssociationGroupInfoCCInfoGet extends AssociationGroupInfoCC {
    constructor(options: WithAddress<AssociationGroupInfoCCInfoGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationGroupInfoCCInfoGet;
    refreshCache: boolean;
    listMode?: boolean;
    groupId?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationGroupInfoCCCommandListReportOptions {
    groupId: number;
    commands: ReadonlyMap<CommandClasses, readonly number[]>;
}
export declare class AssociationGroupInfoCCCommandListReport extends AssociationGroupInfoCC {
    constructor(options: WithAddress<AssociationGroupInfoCCCommandListReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationGroupInfoCCCommandListReport;
    readonly groupId: number;
    readonly commands: ReadonlyMap<CommandClasses, readonly number[]>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AssociationGroupInfoCCCommandListGetOptions {
    allowCache: boolean;
    groupId: number;
}
export declare class AssociationGroupInfoCCCommandListGet extends AssociationGroupInfoCC {
    constructor(options: WithAddress<AssociationGroupInfoCCCommandListGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AssociationGroupInfoCCCommandListGet;
    allowCache: boolean;
    groupId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=AssociationGroupInfoCC.d.ts.map