import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { ClimateControlScheduleCommand, ScheduleOverrideType, type SetbackState, type Switchpoint, Weekday } from "../lib/_Types.js";
export declare const ClimateControlScheduleCCValues: Readonly<{
    overrideType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly property: "overrideType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly endpoint: number;
            readonly property: "overrideType";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Override type";
            readonly states: Record<number, string>;
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
    overrideState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly property: "overrideState";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly endpoint: number;
            readonly property: "overrideState";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Override state";
            readonly min: -12.8;
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
    schedule: ((weekday: Weekday) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly property: "schedule";
            readonly propertyKey: Weekday;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly endpoint: number;
            readonly property: "schedule";
            readonly propertyKey: Weekday;
        };
        readonly meta: {
            readonly label: `Schedule (${string})`;
            readonly type: "any";
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
export declare class ClimateControlScheduleCCAPI extends CCAPI {
    supportsCommand(cmd: ClimateControlScheduleCommand): MaybeNotKnown<boolean>;
    set(weekday: Weekday, switchPoints: Switchpoint[]): Promise<SupervisionResult | undefined>;
    get(weekday: Weekday): Promise<MaybeNotKnown<readonly Switchpoint[]>>;
    getChangeCounter(): Promise<MaybeNotKnown<number>>;
    getOverride(): Promise<{
        type: ScheduleOverrideType;
        state: SetbackState;
    } | undefined>;
    setOverride(type: ScheduleOverrideType, state: SetbackState): Promise<SupervisionResult | undefined>;
}
export declare class ClimateControlScheduleCC extends CommandClass {
    ccCommand: ClimateControlScheduleCommand;
}
export interface ClimateControlScheduleCCSetOptions {
    weekday: Weekday;
    switchPoints: Switchpoint[];
}
export declare class ClimateControlScheduleCCSet extends ClimateControlScheduleCC {
    constructor(options: WithAddress<ClimateControlScheduleCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ClimateControlScheduleCCSet;
    switchPoints: Switchpoint[];
    weekday: Weekday;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ClimateControlScheduleCCReportOptions {
    weekday: Weekday;
    schedule: Switchpoint[];
}
export declare class ClimateControlScheduleCCReport extends ClimateControlScheduleCC {
    constructor(options: WithAddress<ClimateControlScheduleCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ClimateControlScheduleCCReport;
    readonly weekday: Weekday;
    readonly schedule: readonly Switchpoint[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ClimateControlScheduleCCGetOptions {
    weekday: Weekday;
}
export declare class ClimateControlScheduleCCGet extends ClimateControlScheduleCC {
    constructor(options: WithAddress<ClimateControlScheduleCCGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ClimateControlScheduleCCGet;
    weekday: Weekday;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ClimateControlScheduleCCChangedReportOptions {
    changeCounter: number;
}
export declare class ClimateControlScheduleCCChangedReport extends ClimateControlScheduleCC {
    constructor(options: WithAddress<ClimateControlScheduleCCChangedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ClimateControlScheduleCCChangedReport;
    readonly changeCounter: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ClimateControlScheduleCCChangedGet extends ClimateControlScheduleCC {
}
export interface ClimateControlScheduleCCOverrideReportOptions {
    overrideType: ScheduleOverrideType;
    overrideState: SetbackState;
}
export declare class ClimateControlScheduleCCOverrideReport extends ClimateControlScheduleCC {
    constructor(options: WithAddress<ClimateControlScheduleCCOverrideReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ClimateControlScheduleCCOverrideReport;
    readonly overrideType: ScheduleOverrideType;
    readonly overrideState: SetbackState;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ClimateControlScheduleCCOverrideGet extends ClimateControlScheduleCC {
}
export interface ClimateControlScheduleCCOverrideSetOptions {
    overrideType: ScheduleOverrideType;
    overrideState: SetbackState;
}
export declare class ClimateControlScheduleCCOverrideSet extends ClimateControlScheduleCC {
    constructor(options: WithAddress<ClimateControlScheduleCCOverrideSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ClimateControlScheduleCCOverrideSet;
    overrideType: ScheduleOverrideType;
    overrideState: SetbackState;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=ClimateControlScheduleCC.d.ts.map