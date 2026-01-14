import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { HumidityControlMode, HumidityControlModeCommand } from "../lib/_Types.js";
export declare const HumidityControlModeCCValues: Readonly<{
    mode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly property: "mode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly endpoint: number;
            readonly property: "mode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Humidity control mode";
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
    supportedModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly property: "supportedModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
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
export declare class HumidityControlModeCCAPI extends CCAPI {
    supportsCommand(cmd: HumidityControlModeCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<MaybeNotKnown<HumidityControlMode>>;
    set(mode: HumidityControlMode): Promise<SupervisionResult | undefined>;
    getSupportedModes(): Promise<MaybeNotKnown<readonly HumidityControlMode[]>>;
}
export declare class HumidityControlModeCC extends CommandClass {
    ccCommand: HumidityControlModeCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface HumidityControlModeCCSetOptions {
    mode: HumidityControlMode;
}
export declare class HumidityControlModeCCSet extends HumidityControlModeCC {
    constructor(options: WithAddress<HumidityControlModeCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): HumidityControlModeCCSet;
    mode: HumidityControlMode;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface HumidityControlModeCCReportOptions {
    mode: HumidityControlMode;
}
export declare class HumidityControlModeCCReport extends HumidityControlModeCC {
    constructor(options: WithAddress<HumidityControlModeCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlModeCCReport;
    readonly mode: HumidityControlMode;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class HumidityControlModeCCGet extends HumidityControlModeCC {
}
export interface HumidityControlModeCCSupportedReportOptions {
    supportedModes: HumidityControlMode[];
}
export declare class HumidityControlModeCCSupportedReport extends HumidityControlModeCC {
    constructor(options: WithAddress<HumidityControlModeCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): HumidityControlModeCCSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    supportedModes: HumidityControlMode[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class HumidityControlModeCCSupportedGet extends HumidityControlModeCC {
}
//# sourceMappingURL=HumidityControlModeCC.d.ts.map