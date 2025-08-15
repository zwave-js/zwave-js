import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { NodeNamingAndLocationCommand } from "../lib/_Types.js";
export declare const NodeNamingAndLocationCCValues: Readonly<{
    name: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly property: "name";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly endpoint: 0;
            readonly property: "name";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Node name";
            readonly type: "string";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    location: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly property: "location";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly endpoint: 0;
            readonly property: "location";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Node location";
            readonly type: "string";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
export declare class NodeNamingAndLocationCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: NodeNamingAndLocationCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    getName(): Promise<MaybeNotKnown<string>>;
    setName(name: string): Promise<SupervisionResult | undefined>;
    getLocation(): Promise<MaybeNotKnown<string>>;
    setLocation(location: string): Promise<SupervisionResult | undefined>;
}
export declare class NodeNamingAndLocationCC extends CommandClass {
    ccCommand: NodeNamingAndLocationCommand;
    skipEndpointInterview(): boolean;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface NodeNamingAndLocationCCNameSetOptions {
    name: string;
}
export declare class NodeNamingAndLocationCCNameSet extends NodeNamingAndLocationCC {
    constructor(options: WithAddress<NodeNamingAndLocationCCNameSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): NodeNamingAndLocationCCNameSet;
    name: string;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface NodeNamingAndLocationCCNameReportOptions {
    name: string;
}
export declare class NodeNamingAndLocationCCNameReport extends NodeNamingAndLocationCC {
    constructor(options: WithAddress<NodeNamingAndLocationCCNameReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NodeNamingAndLocationCCNameReport;
    readonly name: string;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class NodeNamingAndLocationCCNameGet extends NodeNamingAndLocationCC {
}
export interface NodeNamingAndLocationCCLocationSetOptions {
    location: string;
}
export declare class NodeNamingAndLocationCCLocationSet extends NodeNamingAndLocationCC {
    constructor(options: WithAddress<NodeNamingAndLocationCCLocationSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): NodeNamingAndLocationCCLocationSet;
    location: string;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface NodeNamingAndLocationCCLocationReportOptions {
    location: string;
}
export declare class NodeNamingAndLocationCCLocationReport extends NodeNamingAndLocationCC {
    constructor(options: WithAddress<NodeNamingAndLocationCCLocationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NodeNamingAndLocationCCLocationReport;
    readonly location: string;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class NodeNamingAndLocationCCLocationGet extends NodeNamingAndLocationCC {
}
//# sourceMappingURL=NodeNamingCC.d.ts.map