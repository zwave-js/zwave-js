import type { CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { CCAPI, POLL_VALUE, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { HumidityControlOperatingState, HumidityControlOperatingStateCommand } from "../lib/_Types.js";
export declare const HumidityControlOperatingStateCCValues: Readonly<{
    state: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Operating State"];
            readonly property: "state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Operating State"];
            readonly endpoint: number;
            readonly property: "state";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Humidity control operating state";
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
export declare class HumidityControlOperatingStateCCAPI extends CCAPI {
    supportsCommand(cmd: HumidityControlOperatingStateCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<HumidityControlOperatingState | undefined>;
}
export declare class HumidityControlOperatingStateCC extends CommandClass {
    ccCommand: HumidityControlOperatingStateCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface HumidityControlOperatingStateCCReportOptions {
    state: HumidityControlOperatingState;
}
export declare class HumidityControlOperatingStateCCReport extends HumidityControlOperatingStateCC {
    constructor(options: WithAddress<HumidityControlOperatingStateCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlOperatingStateCCReport;
    readonly state: HumidityControlOperatingState;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class HumidityControlOperatingStateCCGet extends HumidityControlOperatingStateCC {
}
//# sourceMappingURL=HumidityControlOperatingStateCC.d.ts.map