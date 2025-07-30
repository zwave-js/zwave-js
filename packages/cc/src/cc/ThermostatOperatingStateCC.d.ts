import type { CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ThermostatOperatingState, ThermostatOperatingStateCommand } from "../lib/_Types.js";
export declare const ThermostatOperatingStateCCValues: Readonly<{
    operatingState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Operating State"];
            readonly property: "state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Operating State"];
            readonly endpoint: number;
            readonly property: "state";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Operating state";
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
}>;
export declare class ThermostatOperatingStateCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: ThermostatOperatingStateCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<MaybeNotKnown<ThermostatOperatingState>>;
}
export declare class ThermostatOperatingStateCC extends CommandClass {
    ccCommand: ThermostatOperatingStateCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ThermostatOperatingStateCCReportOptions {
    state: ThermostatOperatingState;
}
export declare class ThermostatOperatingStateCCReport extends ThermostatOperatingStateCC {
    constructor(options: WithAddress<ThermostatOperatingStateCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatOperatingStateCCReport;
    readonly state: ThermostatOperatingState;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatOperatingStateCCGet extends ThermostatOperatingStateCC {
}
//# sourceMappingURL=ThermostatOperatingStateCC.d.ts.map