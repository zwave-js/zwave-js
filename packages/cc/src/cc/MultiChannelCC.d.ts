import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type ApplicationNodeInformation, CommandClasses, type GenericDeviceClass, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SpecificDeviceClass, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext } from "../lib/CommandClass.js";
import { MultiChannelCommand } from "../lib/_Types.js";
export declare const MultiChannelCCValues: Readonly<{
    endpointIndizes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "endpointIndizes";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "endpointIndizes";
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    individualEndpointCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "individualCount";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "individualCount";
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    aggregatedEndpointCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "aggregatedCount";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "aggregatedCount";
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    endpointCountIsDynamic: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "countIsDynamic";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "countIsDynamic";
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    endpointsHaveIdenticalCapabilities: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "identicalCapabilities";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "identicalCapabilities";
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    endpointCCs: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "commandClasses";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: number;
            readonly property: "commandClasses";
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
    endpointDeviceClass: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "deviceClass";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: number;
            readonly property: "deviceClass";
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
    aggregatedEndpointMembers: ((endpointIndex: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "members";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: number;
            readonly property: "members";
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
export declare class MultiChannelCCAPI extends CCAPI {
    supportsCommand(cmd: MultiChannelCommand): MaybeNotKnown<boolean>;
    getEndpoints(): Promise<{
        isDynamicEndpointCount: boolean;
        identicalCapabilities: boolean;
        individualEndpointCount: number;
        aggregatedEndpointCount: MaybeNotKnown<number>;
    } | undefined>;
    getEndpointCapabilities(endpoint: number): Promise<MaybeNotKnown<EndpointCapability>>;
    findEndpoints(genericClass: number, specificClass: number): Promise<MaybeNotKnown<readonly number[]>>;
    getAggregatedMembers(endpoint: number): Promise<MaybeNotKnown<readonly number[]>>;
    sendEncapsulated(options: MultiChannelCCCommandEncapsulationOptions): Promise<void>;
    getEndpointCountV1(ccId: CommandClasses): Promise<MaybeNotKnown<number>>;
    sendEncapsulatedV1(encapsulated: CommandClass): Promise<void>;
}
export interface EndpointCapability {
    generic: GenericDeviceClass;
    specific: SpecificDeviceClass;
    supportedCCs: CommandClasses[];
    isDynamic: boolean;
    wasRemoved: boolean;
}
export declare class MultiChannelCC extends CommandClass {
    ccCommand: MultiChannelCommand;
    /** Tests if a command targets a specific endpoint and thus requires encapsulation */
    static requiresEncapsulation(cc: CommandClass): boolean;
    /** Encapsulates a command that targets a specific endpoint, with version 2+ of the Multi Channel CC */
    static encapsulate(cc: CommandClass): MultiChannelCCCommandEncapsulation;
    /** Encapsulates a command that targets a specific endpoint, with version 1 of the Multi Channel CC */
    static encapsulateV1(cc: CommandClass): MultiChannelCCV1CommandEncapsulation;
    skipEndpointInterview(): boolean;
    interview(ctx: InterviewContext): Promise<void>;
    private interviewV1;
}
export interface MultiChannelCCEndPointReportOptions {
    countIsDynamic: boolean;
    identicalCapabilities: boolean;
    individualCount: number;
    aggregatedCount?: number;
}
export declare class MultiChannelCCEndPointReport extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCEndPointReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCEndPointReport;
    countIsDynamic: boolean;
    identicalCapabilities: boolean;
    individualCount: number;
    aggregatedCount: MaybeNotKnown<number>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MultiChannelCCEndPointGet extends MultiChannelCC {
}
export interface MultiChannelCCCapabilityReportOptions {
    endpointIndex: number;
    genericDeviceClass: number;
    specificDeviceClass: number;
    supportedCCs: CommandClasses[];
    isDynamic: boolean;
    wasRemoved: boolean;
}
export declare class MultiChannelCCCapabilityReport extends MultiChannelCC implements ApplicationNodeInformation {
    constructor(options: WithAddress<MultiChannelCCCapabilityReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCCapabilityReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly genericDeviceClass: number;
    readonly specificDeviceClass: number;
    readonly supportedCCs: CommandClasses[];
    readonly isDynamic: boolean;
    readonly wasRemoved: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCCapabilityGetOptions {
    requestedEndpoint: number;
}
export declare class MultiChannelCCCapabilityGet extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCCapabilityGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCCapabilityGet;
    requestedEndpoint: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCEndPointFindReportOptions {
    genericClass: number;
    specificClass: number;
    foundEndpoints: number[];
    reportsToFollow: number;
}
export declare class MultiChannelCCEndPointFindReport extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCEndPointFindReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCEndPointFindReport;
    genericClass: number;
    specificClass: number;
    foundEndpoints: number[];
    reportsToFollow: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: MultiChannelCCEndPointFindReport[], _ctx: CCParsingContext): Promise<void>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCEndPointFindOptions {
    genericClass: number;
    specificClass: number;
}
export declare class MultiChannelCCEndPointFind extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCEndPointFindOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCEndPointFind;
    genericClass: number;
    specificClass: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCAggregatedMembersReportOptions {
    aggregatedEndpointIndex: number;
    members: number[];
}
export declare class MultiChannelCCAggregatedMembersReport extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCAggregatedMembersReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCAggregatedMembersReport;
    readonly aggregatedEndpointIndex: number;
    readonly members: readonly number[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCAggregatedMembersGetOptions {
    requestedEndpoint: number;
}
export declare class MultiChannelCCAggregatedMembersGet extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCAggregatedMembersGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): MultiChannelCCAggregatedMembersGet;
    requestedEndpoint: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
type MultiChannelCCDestination = number | (1 | 2 | 3 | 4 | 5 | 6 | 7)[];
export interface MultiChannelCCCommandEncapsulationOptions {
    encapsulated: CommandClass;
    destination: MultiChannelCCDestination;
}
export declare class MultiChannelCCCommandEncapsulation extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCCommandEncapsulationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<MultiChannelCCCommandEncapsulation>;
    encapsulated: CommandClass;
    /** The destination end point (0-127) or an array of destination end points (1-7) */
    destination: MultiChannelCCDestination;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
    protected computeEncapsulationOverhead(): number;
}
export interface MultiChannelCCV1ReportOptions {
    requestedCC: CommandClasses;
    endpointCount: number;
}
export declare class MultiChannelCCV1Report extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCV1ReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCV1Report;
    readonly requestedCC: CommandClasses;
    readonly endpointCount: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCV1GetOptions {
    requestedCC: CommandClasses;
}
export declare class MultiChannelCCV1Get extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCV1GetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultiChannelCCV1Get;
    requestedCC: CommandClasses;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultiChannelCCV1CommandEncapsulationOptions {
    encapsulated: CommandClass;
}
export declare class MultiChannelCCV1CommandEncapsulation extends MultiChannelCC {
    constructor(options: WithAddress<MultiChannelCCV1CommandEncapsulationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<MultiChannelCCV1CommandEncapsulation>;
    encapsulated: CommandClass;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export {};
//# sourceMappingURL=MultiChannelCC.d.ts.map