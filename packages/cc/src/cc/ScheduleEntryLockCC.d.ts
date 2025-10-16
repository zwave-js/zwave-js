import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { type AllOrNone, Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext } from "../lib/CommandClass.js";
import { ScheduleEntryLockCommand, type ScheduleEntryLockDailyRepeatingSchedule, ScheduleEntryLockScheduleKind, ScheduleEntryLockSetAction, type ScheduleEntryLockSlotId, type ScheduleEntryLockWeekDaySchedule, ScheduleEntryLockWeekday, type ScheduleEntryLockYearDaySchedule, type Timezone } from "../lib/_Types.js";
export declare const ScheduleEntryLockCCValues: Readonly<{
    numWeekDaySlots: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "numWeekDaySlots";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "numWeekDaySlots";
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
    numYearDaySlots: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "numYearDaySlots";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "numYearDaySlots";
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
    numDailyRepeatingSlots: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "numDailyRepeatingSlots";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "numDailyRepeatingSlots";
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
    userEnabled: ((userId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "userEnabled";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "userEnabled";
            readonly propertyKey: number;
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
    scheduleKind: ((userId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "scheduleKind";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "scheduleKind";
            readonly propertyKey: number;
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
    schedule: ((scheduleKind: ScheduleEntryLockScheduleKind, userId: number, slotId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "schedule";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "schedule";
            readonly propertyKey: number;
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
export declare class ScheduleEntryLockCCAPI extends CCAPI {
    supportsCommand(cmd: ScheduleEntryLockCommand): MaybeNotKnown<boolean>;
    /**
     * Enables or disables schedules. If a user ID is given, that user's
     * schedules will be enabled or disabled. If no user ID is given, all schedules
     * will be affected.
     */
    setEnabled(enabled: boolean, userId?: number): Promise<SupervisionResult | undefined>;
    getNumSlots(): Promise<Pick<ScheduleEntryLockCCSupportedReport, "numWeekDaySlots" | "numYearDaySlots" | "numDailyRepeatingSlots"> | undefined>;
    setWeekDaySchedule(slot: ScheduleEntryLockSlotId, schedule?: ScheduleEntryLockWeekDaySchedule): Promise<SupervisionResult | undefined>;
    getWeekDaySchedule(slot: ScheduleEntryLockSlotId): Promise<MaybeNotKnown<ScheduleEntryLockWeekDaySchedule>>;
    setYearDaySchedule(slot: ScheduleEntryLockSlotId, schedule?: ScheduleEntryLockYearDaySchedule): Promise<SupervisionResult | undefined>;
    getYearDaySchedule(slot: ScheduleEntryLockSlotId): Promise<MaybeNotKnown<ScheduleEntryLockYearDaySchedule>>;
    setDailyRepeatingSchedule(slot: ScheduleEntryLockSlotId, schedule?: ScheduleEntryLockDailyRepeatingSchedule): Promise<SupervisionResult | undefined>;
    getDailyRepeatingSchedule(slot: ScheduleEntryLockSlotId): Promise<MaybeNotKnown<ScheduleEntryLockDailyRepeatingSchedule>>;
    getTimezone(): Promise<MaybeNotKnown<Timezone>>;
    setTimezone(timezone: Timezone): Promise<SupervisionResult | undefined>;
}
export declare class ScheduleEntryLockCC extends CommandClass {
    ccCommand: ScheduleEntryLockCommand;
    interview(ctx: InterviewContext): Promise<void>;
    /**
     * Returns the number of supported day-of-week slots.
     * This only works AFTER the interview process
     */
    static getNumWeekDaySlotsCached(ctx: GetValueDB, endpoint: EndpointId): number;
    /**
     * Returns the number of supported day-of-year slots.
     * This only works AFTER the interview process
     */
    static getNumYearDaySlotsCached(ctx: GetValueDB, endpoint: EndpointId): number;
    /**
     * Returns the number of supported daily-repeating slots.
     * This only works AFTER the interview process
     */
    static getNumDailyRepeatingSlotsCached(ctx: GetValueDB, endpoint: EndpointId): number;
    /**
     * Returns whether scheduling for a given user ID (most likely) enabled. Since the Schedule Entry Lock CC
     * provides no way to query the enabled state, Z-Wave JS tracks this in its own cache.
     *
     * This only works AFTER the interview process and is likely to be wrong if a device
     * with existing schedules is queried. To be sure, disable scheduling for all users and enable
     * only the desired ones.
     */
    static getUserCodeScheduleEnabledCached(ctx: GetValueDB, endpoint: EndpointId, userId: number): boolean;
    /**
     * Returns which scheduling kind is (most likely) enabled for a given user ID . Since the Schedule Entry Lock CC
     * provides no way to query the current state, Z-Wave JS tracks this in its own cache.
     *
     * This only works AFTER the interview process and is likely to be wrong if a device
     * with existing schedules is queried. To be sure, edit a schedule of the desired kind
     * which will automatically switch the user to that scheduling kind.
     */
    static getUserCodeScheduleKindCached(ctx: GetValueDB, endpoint: EndpointId, userId: number): MaybeNotKnown<ScheduleEntryLockScheduleKind>;
    static getScheduleCached(ctx: GetValueDB, endpoint: EndpointId, scheduleKind: ScheduleEntryLockScheduleKind.WeekDay, userId: number, slotId: number): MaybeNotKnown<ScheduleEntryLockWeekDaySchedule | false>;
    static getScheduleCached(ctx: GetValueDB, endpoint: EndpointId, scheduleKind: ScheduleEntryLockScheduleKind.YearDay, userId: number, slotId: number): MaybeNotKnown<ScheduleEntryLockYearDaySchedule | false>;
    static getScheduleCached(ctx: GetValueDB, endpoint: EndpointId, scheduleKind: ScheduleEntryLockScheduleKind.DailyRepeating, userId: number, slotId: number): MaybeNotKnown<ScheduleEntryLockDailyRepeatingSchedule | false>;
    static getScheduleCached(ctx: GetValueDB, endpoint: EndpointId, scheduleKind: ScheduleEntryLockScheduleKind, userId: number, slotId: number): MaybeNotKnown<ScheduleEntryLockWeekDaySchedule | ScheduleEntryLockYearDaySchedule | ScheduleEntryLockDailyRepeatingSchedule | false>;
}
export interface ScheduleEntryLockCCEnableSetOptions {
    userId: number;
    enabled: boolean;
}
export declare class ScheduleEntryLockCCEnableSet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCEnableSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCEnableSet;
    userId: number;
    enabled: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ScheduleEntryLockCCEnableAllSetOptions {
    enabled: boolean;
}
export declare class ScheduleEntryLockCCEnableAllSet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCEnableAllSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCEnableAllSet;
    enabled: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ScheduleEntryLockCCSupportedReportOptions {
    numWeekDaySlots: number;
    numYearDaySlots: number;
    numDailyRepeatingSlots?: number;
}
export declare class ScheduleEntryLockCCSupportedReport extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCSupportedReport;
    numWeekDaySlots: number;
    numYearDaySlots: number;
    numDailyRepeatingSlots: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ScheduleEntryLockCCSupportedGet extends ScheduleEntryLockCC {
}
/** @publicAPI */
export type ScheduleEntryLockCCWeekDayScheduleSetOptions = ScheduleEntryLockSlotId & ({
    action: ScheduleEntryLockSetAction.Erase;
} | ({
    action: ScheduleEntryLockSetAction.Set;
} & ScheduleEntryLockWeekDaySchedule));
export declare class ScheduleEntryLockCCWeekDayScheduleSet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCWeekDayScheduleSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCWeekDayScheduleSet;
    userId: number;
    slotId: number;
    action: ScheduleEntryLockSetAction;
    weekday?: ScheduleEntryLockWeekday;
    startHour?: number;
    startMinute?: number;
    stopHour?: number;
    stopMinute?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ScheduleEntryLockCCWeekDayScheduleReportOptions = ScheduleEntryLockSlotId & AllOrNone<ScheduleEntryLockWeekDaySchedule>;
export declare class ScheduleEntryLockCCWeekDayScheduleReport extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCWeekDayScheduleReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCWeekDayScheduleReport;
    userId: number;
    slotId: number;
    weekday?: ScheduleEntryLockWeekday;
    startHour?: number;
    startMinute?: number;
    stopHour?: number;
    stopMinute?: number;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ScheduleEntryLockCCWeekDayScheduleGetOptions = ScheduleEntryLockSlotId;
export declare class ScheduleEntryLockCCWeekDayScheduleGet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCWeekDayScheduleGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCWeekDayScheduleGet;
    userId: number;
    slotId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
/** @publicAPI */
export type ScheduleEntryLockCCYearDayScheduleSetOptions = ScheduleEntryLockSlotId & ({
    action: ScheduleEntryLockSetAction.Erase;
} | ({
    action: ScheduleEntryLockSetAction.Set;
} & ScheduleEntryLockYearDaySchedule));
export declare class ScheduleEntryLockCCYearDayScheduleSet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCYearDayScheduleSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCYearDayScheduleSet;
    userId: number;
    slotId: number;
    action: ScheduleEntryLockSetAction;
    startYear?: number;
    startMonth?: number;
    startDay?: number;
    startHour?: number;
    startMinute?: number;
    stopYear?: number;
    stopMonth?: number;
    stopDay?: number;
    stopHour?: number;
    stopMinute?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ScheduleEntryLockCCYearDayScheduleReportOptions = ScheduleEntryLockSlotId & AllOrNone<ScheduleEntryLockYearDaySchedule>;
export declare class ScheduleEntryLockCCYearDayScheduleReport extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCYearDayScheduleReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCYearDayScheduleReport;
    userId: number;
    slotId: number;
    startYear?: number;
    startMonth?: number;
    startDay?: number;
    startHour?: number;
    startMinute?: number;
    stopYear?: number;
    stopMonth?: number;
    stopDay?: number;
    stopHour?: number;
    stopMinute?: number;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ScheduleEntryLockCCYearDayScheduleGetOptions = ScheduleEntryLockSlotId;
export declare class ScheduleEntryLockCCYearDayScheduleGet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCYearDayScheduleGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCYearDayScheduleGet;
    userId: number;
    slotId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ScheduleEntryLockCCTimeOffsetSetOptions {
    standardOffset: number;
    dstOffset: number;
}
export declare class ScheduleEntryLockCCTimeOffsetSet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCTimeOffsetSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCTimeOffsetSet;
    standardOffset: number;
    dstOffset: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ScheduleEntryLockCCTimeOffsetReportOptions {
    standardOffset: number;
    dstOffset: number;
}
export declare class ScheduleEntryLockCCTimeOffsetReport extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCTimeOffsetReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCTimeOffsetReport;
    standardOffset: number;
    dstOffset: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ScheduleEntryLockCCTimeOffsetGet extends ScheduleEntryLockCC {
}
/** @publicAPI */
export type ScheduleEntryLockCCDailyRepeatingScheduleSetOptions = ScheduleEntryLockSlotId & ({
    action: ScheduleEntryLockSetAction.Erase;
} | ({
    action: ScheduleEntryLockSetAction.Set;
} & ScheduleEntryLockDailyRepeatingSchedule));
export declare class ScheduleEntryLockCCDailyRepeatingScheduleSet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCDailyRepeatingScheduleSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCDailyRepeatingScheduleSet;
    userId: number;
    slotId: number;
    action: ScheduleEntryLockSetAction;
    weekdays?: ScheduleEntryLockWeekday[];
    startHour?: number;
    startMinute?: number;
    durationHour?: number;
    durationMinute?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ScheduleEntryLockCCDailyRepeatingScheduleReportOptions = ScheduleEntryLockSlotId & AllOrNone<ScheduleEntryLockDailyRepeatingSchedule>;
export declare class ScheduleEntryLockCCDailyRepeatingScheduleReport extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCDailyRepeatingScheduleReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCDailyRepeatingScheduleReport;
    userId: number;
    slotId: number;
    weekdays?: ScheduleEntryLockWeekday[];
    startHour?: number;
    startMinute?: number;
    durationHour?: number;
    durationMinute?: number;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ScheduleEntryLockCCDailyRepeatingScheduleGetOptions = ScheduleEntryLockSlotId;
export declare class ScheduleEntryLockCCDailyRepeatingScheduleGet extends ScheduleEntryLockCC {
    constructor(options: WithAddress<ScheduleEntryLockCCDailyRepeatingScheduleGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ScheduleEntryLockCCDailyRepeatingScheduleGet;
    userId: number;
    slotId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=ScheduleEntryLockCC.d.ts.map