import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type Scale, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { type HumidityControlSetpointCapabilities, HumidityControlSetpointCommand, HumidityControlSetpointType, type HumidityControlSetpointValue } from "../lib/_Types.js";
export declare const HumidityControlSetpointCCValues: Readonly<{
    supportedSetpointTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly property: "supportedSetpointTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly endpoint: number;
            readonly property: "supportedSetpointTypes";
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
    setpoint: ((setpointType: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly property: "setpoint";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly endpoint: number;
            readonly property: "setpoint";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Setpoint (${string})`;
            readonly ccSpecific: {
                readonly setpointType: number;
            };
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
    setpointScale: ((setpointType: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly property: "setpointScale";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly endpoint: number;
            readonly property: "setpointScale";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Setpoint scale (${string})`;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
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
export declare class HumidityControlSetpointCCAPI extends CCAPI {
    supportsCommand(cmd: HumidityControlSetpointCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(setpointType: HumidityControlSetpointType): Promise<MaybeNotKnown<HumidityControlSetpointValue>>;
    set(setpointType: HumidityControlSetpointType, value: number, scale: number): Promise<SupervisionResult | undefined>;
    getCapabilities(setpointType: HumidityControlSetpointType): Promise<MaybeNotKnown<HumidityControlSetpointCapabilities>>;
    getSupportedSetpointTypes(): Promise<MaybeNotKnown<readonly HumidityControlSetpointType[]>>;
    getSupportedScales(setpointType: HumidityControlSetpointType): Promise<MaybeNotKnown<readonly Scale[]>>;
}
export declare class HumidityControlSetpointCC extends CommandClass {
    ccCommand: HumidityControlSetpointCommand;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface HumidityControlSetpointCCSetOptions {
    setpointType: HumidityControlSetpointType;
    value: number;
    scale: number;
}
export declare class HumidityControlSetpointCCSet extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): HumidityControlSetpointCCSet;
    setpointType: HumidityControlSetpointType;
    value: number;
    scale: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlSetpointCCReportOptions {
    type: HumidityControlSetpointType;
    scale: number;
    value: number;
}
export declare class HumidityControlSetpointCCReport extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlSetpointCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: HumidityControlSetpointType;
    scale: number;
    value: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlSetpointCCGetOptions {
    setpointType: HumidityControlSetpointType;
}
export declare class HumidityControlSetpointCCGet extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): HumidityControlSetpointCCGet;
    setpointType: HumidityControlSetpointType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlSetpointCCSupportedReportOptions {
    supportedSetpointTypes: HumidityControlSetpointType[];
}
export declare class HumidityControlSetpointCCSupportedReport extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlSetpointCCSupportedReport;
    readonly supportedSetpointTypes: readonly HumidityControlSetpointType[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class HumidityControlSetpointCCSupportedGet extends HumidityControlSetpointCC {
}
export interface HumidityControlSetpointCCScaleSupportedReportOptions {
    supportedScales: number[];
}
export declare class HumidityControlSetpointCCScaleSupportedReport extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCScaleSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlSetpointCCScaleSupportedReport;
    readonly supportedScales: readonly number[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlSetpointCCScaleSupportedGetOptions {
    setpointType: HumidityControlSetpointType;
}
export declare class HumidityControlSetpointCCScaleSupportedGet extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCScaleSupportedGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): HumidityControlSetpointCCScaleSupportedGet;
    setpointType: HumidityControlSetpointType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlSetpointCCCapabilitiesReportOptions {
    type: HumidityControlSetpointType;
    minValue: number;
    maxValue: number;
    minValueScale: number;
    maxValueScale: number;
}
export declare class HumidityControlSetpointCCCapabilitiesReport extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlSetpointCCCapabilitiesReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: HumidityControlSetpointType;
    minValue: number;
    maxValue: number;
    minValueScale: number;
    maxValueScale: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlSetpointCCCapabilitiesGetOptions {
    setpointType: HumidityControlSetpointType;
}
export declare class HumidityControlSetpointCCCapabilitiesGet extends HumidityControlSetpointCC {
    constructor(options: WithAddress<HumidityControlSetpointCCCapabilitiesGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): HumidityControlSetpointCCCapabilitiesGet;
    setpointType: HumidityControlSetpointType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=HumidityControlSetpointCC.d.ts.map