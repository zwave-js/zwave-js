import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, Timeout, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { LocalProtectionState, ProtectionCommand, RFProtectionState } from "../lib/_Types.js";
export declare const ProtectionCCValues: Readonly<{
    exclusiveControlNodeId: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "exclusiveControlNodeId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "exclusiveControlNodeId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly min: 1;
            readonly max: 232;
            readonly label: "Node ID with exclusive control";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    localProtectionState: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "local";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "local";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Local protection state";
            readonly states: Record<number, string>;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    rfProtectionState: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "rf";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "rf";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "RF protection state";
            readonly states: Record<number, string>;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    timeout: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "timeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "timeout";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "RF protection timeout";
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportsExclusiveControl: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportsExclusiveControl";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportsExclusiveControl";
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
    supportsTimeout: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportsTimeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportsTimeout";
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
    supportedLocalStates: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportedLocalStates";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportedLocalStates";
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
    supportedRFStates: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportedRFStates";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportedRFStates";
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
}>;
export declare class ProtectionCCAPI extends CCAPI {
    supportsCommand(cmd: ProtectionCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<Pick<ProtectionCCReport, "local" | "rf"> | undefined>;
    set(local: LocalProtectionState, rf?: RFProtectionState): Promise<SupervisionResult | undefined>;
    getSupported(): Promise<Pick<ProtectionCCSupportedReport, "supportsExclusiveControl" | "supportsTimeout" | "supportedLocalStates" | "supportedRFStates"> | undefined>;
    getExclusiveControl(): Promise<MaybeNotKnown<number>>;
    setExclusiveControl(nodeId: number): Promise<SupervisionResult | undefined>;
    getTimeout(): Promise<MaybeNotKnown<Timeout>>;
    setTimeout(timeout: Timeout): Promise<SupervisionResult | undefined>;
}
export declare class ProtectionCC extends CommandClass {
    ccCommand: ProtectionCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ProtectionCCSetOptions {
    local: LocalProtectionState;
    rf?: RFProtectionState;
}
export declare class ProtectionCCSet extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ProtectionCCSet;
    local: LocalProtectionState;
    rf?: RFProtectionState;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ProtectionCCReportOptions {
    local: LocalProtectionState;
    rf?: RFProtectionState;
}
export declare class ProtectionCCReport extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ProtectionCCReport;
    readonly local: LocalProtectionState;
    readonly rf?: RFProtectionState;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ProtectionCCGet extends ProtectionCC {
}
export interface ProtectionCCSupportedReportOptions {
    supportsTimeout: boolean;
    supportsExclusiveControl: boolean;
    supportedLocalStates: LocalProtectionState[];
    supportedRFStates: RFProtectionState[];
}
export declare class ProtectionCCSupportedReport extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ProtectionCCSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly supportsExclusiveControl: boolean;
    readonly supportsTimeout: boolean;
    readonly supportedLocalStates: LocalProtectionState[];
    readonly supportedRFStates: RFProtectionState[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ProtectionCCSupportedGet extends ProtectionCC {
}
export interface ProtectionCCExclusiveControlReportOptions {
    exclusiveControlNodeId: number;
}
export declare class ProtectionCCExclusiveControlReport extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCExclusiveControlReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ProtectionCCExclusiveControlReport;
    readonly exclusiveControlNodeId: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ProtectionCCExclusiveControlGet extends ProtectionCC {
}
export interface ProtectionCCExclusiveControlSetOptions {
    exclusiveControlNodeId: number;
}
export declare class ProtectionCCExclusiveControlSet extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCExclusiveControlSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ProtectionCCExclusiveControlSet;
    exclusiveControlNodeId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ProtectionCCTimeoutReportOptions {
    timeout: Timeout;
}
export declare class ProtectionCCTimeoutReport extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCTimeoutReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ProtectionCCTimeoutReport;
    readonly timeout: Timeout;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ProtectionCCTimeoutGet extends ProtectionCC {
}
export interface ProtectionCCTimeoutSetOptions {
    timeout: Timeout;
}
export declare class ProtectionCCTimeoutSet extends ProtectionCC {
    constructor(options: WithAddress<ProtectionCCTimeoutSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ProtectionCCTimeoutSet;
    timeout: Timeout;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=ProtectionCC.d.ts.map