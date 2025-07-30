import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MaybeUnknown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, SET_VALUE_HOOKS, type SetValueImplementation, type SetValueImplementationHooksFactory } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { BarrierOperatorCommand, BarrierState, SubsystemState, SubsystemType } from "../lib/_Types.js";
export declare const BarrierOperatorCCValues: Readonly<{
    supportedSubsystemTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "supportedSubsystemTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "supportedSubsystemTypes";
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
    position: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "position";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "position";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Barrier Position";
            readonly unit: "%";
            readonly max: 100;
            readonly writeable: false;
            readonly min: 0;
            readonly type: "number";
            readonly readable: true;
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
    targetState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "targetState";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "targetState";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Target Barrier State";
            readonly states: Record<number, string>;
            readonly min: 0;
            readonly max: 255;
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
    currentState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "currentState";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "currentState";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Current Barrier State";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
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
    signalingState: ((subsystemType: SubsystemType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "signalingState";
            readonly propertyKey: SubsystemType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "signalingState";
            readonly propertyKey: SubsystemType;
        };
        readonly meta: {
            readonly label: `Signaling State (${string})`;
            readonly states: Record<number, string>;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class BarrierOperatorCCAPI extends CCAPI {
    supportsCommand(cmd: BarrierOperatorCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<BarrierOperatorCCReport, "position" | "currentState"> | undefined>;
    set(targetState: BarrierState.Open | BarrierState.Closed): Promise<SupervisionResult | undefined>;
    getSignalingCapabilities(): Promise<MaybeNotKnown<readonly SubsystemType[]>>;
    getEventSignaling(subsystemType: SubsystemType): Promise<MaybeNotKnown<SubsystemState>>;
    setEventSignaling(subsystemType: SubsystemType, subsystemState: SubsystemState): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class BarrierOperatorCC extends CommandClass {
    ccCommand: BarrierOperatorCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface BarrierOperatorCCSetOptions {
    targetState: BarrierState.Open | BarrierState.Closed;
}
export declare class BarrierOperatorCCSet extends BarrierOperatorCC {
    constructor(options: WithAddress<BarrierOperatorCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): BarrierOperatorCCSet;
    targetState: BarrierState.Open | BarrierState.Closed;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BarrierOperatorCCReportOptions {
    position: MaybeUnknown<number>;
    currentState: MaybeUnknown<BarrierState>;
}
export declare class BarrierOperatorCCReport extends BarrierOperatorCC {
    constructor(options: WithAddress<BarrierOperatorCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BarrierOperatorCCReport;
    readonly currentState: MaybeUnknown<BarrierState>;
    readonly position: MaybeUnknown<number>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BarrierOperatorCCGet extends BarrierOperatorCC {
}
export interface BarrierOperatorCCSignalingCapabilitiesReportOptions {
    supportedSubsystemTypes: SubsystemType[];
}
export declare class BarrierOperatorCCSignalingCapabilitiesReport extends BarrierOperatorCC {
    constructor(options: WithAddress<BarrierOperatorCCSignalingCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BarrierOperatorCCSignalingCapabilitiesReport;
    readonly supportedSubsystemTypes: readonly SubsystemType[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BarrierOperatorCCSignalingCapabilitiesGet extends BarrierOperatorCC {
}
export interface BarrierOperatorCCEventSignalingSetOptions {
    subsystemType: SubsystemType;
    subsystemState: SubsystemState;
}
export declare class BarrierOperatorCCEventSignalingSet extends BarrierOperatorCC {
    constructor(options: WithAddress<BarrierOperatorCCEventSignalingSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): BarrierOperatorCCEventSignalingSet;
    subsystemType: SubsystemType;
    subsystemState: SubsystemState;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BarrierOperatorCCEventSignalingReportOptions {
    subsystemType: SubsystemType;
    subsystemState: SubsystemState;
}
export declare class BarrierOperatorCCEventSignalingReport extends BarrierOperatorCC {
    constructor(options: WithAddress<BarrierOperatorCCEventSignalingReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BarrierOperatorCCEventSignalingReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly subsystemType: SubsystemType;
    readonly subsystemState: SubsystemState;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BarrierOperatorCCEventSignalingGetOptions {
    subsystemType: SubsystemType;
}
export declare class BarrierOperatorCCEventSignalingGet extends BarrierOperatorCC {
    constructor(options: WithAddress<BarrierOperatorCCEventSignalingGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): BarrierOperatorCCEventSignalingGet;
    subsystemType: SubsystemType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=BarrierOperatorCC.d.ts.map