import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ThermostatMode, ThermostatModeCommand } from "../lib/_Types.js";
export declare const ThermostatModeCCValues: Readonly<{
    thermostatMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly property: "mode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly endpoint: number;
            readonly property: "mode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Thermostat mode";
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
    manufacturerData: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly property: "manufacturerData";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly endpoint: number;
            readonly property: "manufacturerData";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Manufacturer data";
            readonly writeable: false;
            readonly type: "buffer";
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
    supportedModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly property: "supportedModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly endpoint: number;
            readonly property: "supportedModes";
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
export declare class ThermostatModeCCAPI extends CCAPI {
    supportsCommand(cmd: ThermostatModeCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<Pick<ThermostatModeCCReport, "mode" | "manufacturerData"> | undefined>;
    set(mode: Exclude<ThermostatMode, (typeof ThermostatMode)["Manufacturer specific"]>): Promise<SupervisionResult | undefined>;
    set(mode: (typeof ThermostatMode)["Manufacturer specific"], manufacturerData: Uint8Array | string): Promise<SupervisionResult | undefined>;
    getSupportedModes(): Promise<MaybeNotKnown<readonly ThermostatMode[]>>;
}
export declare class ThermostatModeCC extends CommandClass {
    ccCommand: ThermostatModeCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export type ThermostatModeCCSetOptions = {
    mode: Exclude<ThermostatMode, (typeof ThermostatMode)["Manufacturer specific"]>;
} | {
    mode: (typeof ThermostatMode)["Manufacturer specific"];
    manufacturerData: Uint8Array;
};
export declare class ThermostatModeCCSet extends ThermostatModeCC {
    constructor(options: WithAddress<ThermostatModeCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatModeCCSet;
    mode: ThermostatMode;
    manufacturerData?: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ThermostatModeCCReportOptions = {
    mode: Exclude<ThermostatMode, (typeof ThermostatMode)["Manufacturer specific"]>;
    manufacturerData?: undefined;
} | {
    mode: (typeof ThermostatMode)["Manufacturer specific"];
    manufacturerData?: Uint8Array;
};
export declare class ThermostatModeCCReport extends ThermostatModeCC {
    constructor(options: WithAddress<ThermostatModeCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatModeCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly mode: ThermostatMode;
    readonly manufacturerData: Uint8Array | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatModeCCGet extends ThermostatModeCC {
}
export interface ThermostatModeCCSupportedReportOptions {
    supportedModes: ThermostatMode[];
}
export declare class ThermostatModeCCSupportedReport extends ThermostatModeCC {
    constructor(options: WithAddress<ThermostatModeCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatModeCCSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly supportedModes: ThermostatMode[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatModeCCSupportedGet extends ThermostatModeCC {
}
//# sourceMappingURL=ThermostatModeCC.d.ts.map