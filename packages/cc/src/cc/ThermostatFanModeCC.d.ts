import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ThermostatFanMode, ThermostatFanModeCommand } from "../lib/_Types.js";
export declare const ThermostatFanModeCCValues: Readonly<{
    turnedOff: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly property: "off";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly endpoint: number;
            readonly property: "off";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Thermostat fan turned off";
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    fanMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly property: "mode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly endpoint: number;
            readonly property: "mode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Thermostat fan mode";
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
    supportedFanModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly property: "supportedModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
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
export declare class ThermostatFanModeCCAPI extends CCAPI {
    supportsCommand(cmd: ThermostatFanModeCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<Pick<ThermostatFanModeCCReport, "mode" | "off"> | undefined>;
    set(mode: ThermostatFanMode, off?: boolean): Promise<SupervisionResult | undefined>;
    getSupportedModes(): Promise<MaybeNotKnown<readonly ThermostatFanMode[]>>;
}
export declare class ThermostatFanModeCC extends CommandClass {
    ccCommand: ThermostatFanModeCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ThermostatFanModeCCSetOptions {
    mode: ThermostatFanMode;
    off?: boolean;
}
export declare class ThermostatFanModeCCSet extends ThermostatFanModeCC {
    constructor(options: WithAddress<ThermostatFanModeCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ThermostatFanModeCCSet;
    mode: ThermostatFanMode;
    off: boolean | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatFanModeCCReportOptions {
    mode: ThermostatFanMode;
    off?: boolean;
}
export declare class ThermostatFanModeCCReport extends ThermostatFanModeCC {
    constructor(options: WithAddress<ThermostatFanModeCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatFanModeCCReport;
    readonly mode: ThermostatFanMode;
    readonly off: boolean | undefined;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatFanModeCCGet extends ThermostatFanModeCC {
}
export interface ThermostatFanModeCCSupportedReportOptions {
    supportedModes: ThermostatFanMode[];
}
export declare class ThermostatFanModeCCSupportedReport extends ThermostatFanModeCC {
    constructor(options: WithAddress<ThermostatFanModeCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatFanModeCCSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly supportedModes: ThermostatFanMode[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatFanModeCCSupportedGet extends ThermostatFanModeCC {
}
//# sourceMappingURL=ThermostatFanModeCC.d.ts.map