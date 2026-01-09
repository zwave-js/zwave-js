import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type Scale, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ThermostatSetpointCommand, ThermostatSetpointType } from "../lib/_Types.js";
export declare const ThermostatSetpointCCValues: Readonly<{
    supportedSetpointTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly property: "supportedSetpointTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
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
    setpoint: ((setpointType: ThermostatSetpointType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly property: "setpoint";
            readonly propertyKey: ThermostatSetpointType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly endpoint: number;
            readonly property: "setpoint";
            readonly propertyKey: ThermostatSetpointType;
        };
        readonly meta: {
            readonly label: `Setpoint (${string})`;
            readonly ccSpecific: {
                readonly setpointType: ThermostatSetpointType;
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
    setpointScale: ((setpointType: ThermostatSetpointType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly property: "setpointScale";
            readonly propertyKey: ThermostatSetpointType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly endpoint: number;
            readonly property: "setpointScale";
            readonly propertyKey: ThermostatSetpointType;
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
export declare class ThermostatSetpointCCAPI extends CCAPI {
    supportsCommand(cmd: ThermostatSetpointCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(setpointType: ThermostatSetpointType): Promise<{
        value: number;
        scale: Scale;
    } | undefined>;
    set(setpointType: ThermostatSetpointType, value: number, scale: number): Promise<SupervisionResult | undefined>;
    getCapabilities(setpointType: ThermostatSetpointType): Promise<Pick<ThermostatSetpointCCCapabilitiesReport, "minValue" | "maxValue" | "minValueScale" | "maxValueScale"> | undefined>;
    /**
     * Requests the supported setpoint types from the node. Due to inconsistencies it is NOT recommended
     * to use this method on nodes with CC versions 1 and 2. Instead rely on the information determined
     * during node interview.
     */
    getSupportedSetpointTypes(): Promise<MaybeNotKnown<readonly ThermostatSetpointType[]>>;
}
export declare class ThermostatSetpointCC extends CommandClass {
    ccCommand: ThermostatSetpointCommand;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ThermostatSetpointCCSetOptions {
    setpointType: ThermostatSetpointType;
    value: number;
    scale: number;
}
export declare class ThermostatSetpointCCSet extends ThermostatSetpointCC {
    constructor(options: WithAddress<ThermostatSetpointCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetpointCCSet;
    setpointType: ThermostatSetpointType;
    value: number;
    scale: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatSetpointCCReportOptions {
    type: ThermostatSetpointType;
    value: number;
    scale: number;
}
export declare class ThermostatSetpointCCReport extends ThermostatSetpointCC {
    constructor(options: WithAddress<ThermostatSetpointCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetpointCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: ThermostatSetpointType;
    scale: number;
    value: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatSetpointCCGetOptions {
    setpointType: ThermostatSetpointType;
}
export declare class ThermostatSetpointCCGet extends ThermostatSetpointCC {
    constructor(options: WithAddress<ThermostatSetpointCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetpointCCGet;
    setpointType: ThermostatSetpointType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatSetpointCCCapabilitiesReportOptions {
    type: ThermostatSetpointType;
    minValue: number;
    minValueScale: number;
    maxValue: number;
    maxValueScale: number;
}
export declare class ThermostatSetpointCCCapabilitiesReport extends ThermostatSetpointCC {
    constructor(options: WithAddress<ThermostatSetpointCCCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetpointCCCapabilitiesReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: ThermostatSetpointType;
    minValue: number;
    maxValue: number;
    minValueScale: number;
    maxValueScale: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatSetpointCCCapabilitiesGetOptions {
    setpointType: ThermostatSetpointType;
}
export declare class ThermostatSetpointCCCapabilitiesGet extends ThermostatSetpointCC {
    constructor(options: WithAddress<ThermostatSetpointCCCapabilitiesGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetpointCCCapabilitiesGet;
    setpointType: ThermostatSetpointType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatSetpointCCSupportedReportOptions {
    supportedSetpointTypes: ThermostatSetpointType[];
}
export declare class ThermostatSetpointCCSupportedReport extends ThermostatSetpointCC {
    constructor(options: WithAddress<ThermostatSetpointCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetpointCCSupportedReport;
    readonly supportedSetpointTypes: readonly ThermostatSetpointType[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatSetpointCCSupportedGet extends ThermostatSetpointCC {
}
//# sourceMappingURL=ThermostatSetpointCC.d.ts.map