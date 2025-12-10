import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, type EndpointId, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type MaybeNotKnown, type MaybeUnknown, type MessageOrCCLogEntry, type NodeId, type SinglecastCC, type SupervisionResult, type SupportsCC, type WithAddress } from "@zwave-js/core";
import { type AllOrNone, Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation, SET_VALUE, SET_VALUE_HOOKS, type SetValueImplementation, type SetValueImplementationHooksFactory } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { MeterCommand, type MeterReading, RateType } from "../lib/_Types.js";
export declare const MeterCCValues: Readonly<{
    type: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "type";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "type";
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
    supportsReset: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "supportsReset";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "supportsReset";
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
    supportedScales: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "supportedScales";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "supportedScales";
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
    supportedRateTypes: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "supportedRateTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "supportedRateTypes";
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
    resetAll: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "reset";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "reset";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Reset accumulated values";
            readonly states: {
                readonly true: "Reset";
            };
            readonly readable: false;
            readonly type: "boolean";
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
    resetSingle: ((meterType: number, rateType: RateType, scale: number) => {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "reset";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "reset";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Reset (${string})` | `Reset (Consumption, ${string})` | `Reset (Production, ${string})`;
            readonly states: {
                readonly true: "Reset";
            };
            readonly ccSpecific: {
                readonly meterType: number;
                readonly rateType: RateType;
                readonly scale: number;
            };
            readonly readable: false;
            readonly type: "boolean";
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
    value: ((meterType: number, rateType: RateType, scale: number) => {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "value";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "value";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly ccSpecific: {
                readonly meterType: number;
                readonly rateType: RateType;
                readonly scale: number;
            };
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
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
export declare function isAccumulatedValue(meterType: number, scale: number): boolean;
export declare class MeterCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: MeterCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(options?: MeterCCGetOptions): Promise<MeterReading | undefined>;
    sendReport(options: MeterCCReportOptions): Promise<SupervisionResult | undefined>;
    getAll(accumulatedOnly?: boolean): Promise<MeterReading[]>;
    getSupported(): Promise<Pick<MeterCCSupportedReport, "type" | "supportsReset" | "supportedScales" | "supportedRateTypes"> | undefined>;
    sendSupportedReport(options: MeterCCSupportedReportOptions): Promise<void>;
    reset(options?: MeterCCResetOptions): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory;
}
export declare class MeterCC extends CommandClass {
    ccCommand: MeterCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    shouldRefreshValues(this: SinglecastCC<this>, ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): boolean;
    /**
     * Returns which type this meter has.
     * This only works AFTER the interview process
     */
    static getMeterTypeCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<number>;
    /**
     * Returns which scales are supported by this meter.
     * This only works AFTER the interview process
     */
    static getSupportedScalesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<number[]>;
    /**
     * Returns whether reset is supported by this meter.
     * This only works AFTER the interview process
     */
    static supportsResetCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<boolean>;
    /**
     * Returns which rate types are supported by this meter.
     * This only works AFTER the interview process
     */
    static getSupportedRateTypesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<RateType[]>;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
}
export interface MeterCCReportOptions {
    type: number;
    scale: number;
    value: number;
    previousValue?: MaybeNotKnown<number>;
    rateType?: RateType;
    deltaTime?: MaybeUnknown<number>;
}
export declare class MeterCCReport extends MeterCC {
    constructor(options: WithAddress<MeterCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MeterCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: number;
    scale: number;
    value: number;
    previousValue: MaybeNotKnown<number>;
    rateType: RateType;
    deltaTime: MaybeUnknown<number>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MeterCCGetOptions {
    scale?: number;
    rateType?: RateType;
}
export declare class MeterCCGet extends MeterCC {
    constructor(options: WithAddress<MeterCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MeterCCGet;
    rateType: RateType | undefined;
    scale: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MeterCCSupportedReportOptions {
    type: number;
    supportsReset: boolean;
    supportedScales: readonly number[];
    supportedRateTypes: readonly RateType[];
}
export declare class MeterCCSupportedReport extends MeterCC {
    constructor(options: WithAddress<MeterCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MeterCCSupportedReport;
    readonly type: number;
    readonly supportsReset: boolean;
    readonly supportedScales: readonly number[];
    readonly supportedRateTypes: readonly RateType[];
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MeterCCSupportedGet extends MeterCC {
}
export type MeterCCResetOptions = AllOrNone<{
    type: number;
    scale: number;
    rateType: RateType;
    targetValue: number;
}>;
export declare class MeterCCReset extends MeterCC {
    constructor(options: WithAddress<MeterCCResetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MeterCCReset;
    type: number | undefined;
    scale: number | undefined;
    rateType: RateType | undefined;
    targetValue: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=MeterCC.d.ts.map