import type { CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { CCAPI, POLL_VALUE, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ThermostatFanState, ThermostatFanStateCommand } from "../lib/_Types.js";
export declare const ThermostatFanStateCCValues: Readonly<{
    fanState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan State"];
            readonly property: "state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan State"];
            readonly endpoint: number;
            readonly property: "state";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Thermostat fan state";
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
}>;
export declare class ThermostatFanStateCCAPI extends CCAPI {
    supportsCommand(cmd: ThermostatFanStateCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<ThermostatFanState | undefined>;
}
export declare class ThermostatFanStateCC extends CommandClass {
    ccCommand: ThermostatFanStateCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ThermostatFanStateCCReportOptions {
    state: ThermostatFanState;
}
export declare class ThermostatFanStateCCReport extends ThermostatFanStateCC {
    constructor(options: WithAddress<ThermostatFanStateCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatFanStateCCReport;
    readonly state: ThermostatFanState;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatFanStateCCGet extends ThermostatFanStateCC {
}
//# sourceMappingURL=ThermostatFanStateCC.d.ts.map