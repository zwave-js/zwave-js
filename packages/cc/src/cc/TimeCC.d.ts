import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type DSTInfo, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { TimeCommand } from "../lib/_Types.js";
export declare class TimeCCAPI extends CCAPI {
    supportsCommand(cmd: TimeCommand): MaybeNotKnown<boolean>;
    getTime(): Promise<Pick<TimeCCTimeReport, "second" | "minute" | "hour"> | undefined>;
    reportTime(hour: number, minute: number, second: number): Promise<SupervisionResult | undefined>;
    getDate(): Promise<Pick<TimeCCDateReport, "day" | "month" | "year"> | undefined>;
    reportDate(year: number, month: number, day: number): Promise<SupervisionResult | undefined>;
    setTimezone(timezone: DSTInfo): Promise<SupervisionResult | undefined>;
    getTimezone(): Promise<MaybeNotKnown<DSTInfo>>;
    reportTimezone(timezone: DSTInfo): Promise<SupervisionResult | undefined>;
}
export declare class TimeCC extends CommandClass {
    ccCommand: TimeCommand;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface TimeCCTimeReportOptions {
    hour: number;
    minute: number;
    second: number;
}
export declare class TimeCCTimeReport extends TimeCC {
    constructor(options: WithAddress<TimeCCTimeReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TimeCCTimeReport;
    hour: number;
    minute: number;
    second: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class TimeCCTimeGet extends TimeCC {
}
export interface TimeCCDateReportOptions {
    year: number;
    month: number;
    day: number;
}
export declare class TimeCCDateReport extends TimeCC {
    constructor(options: WithAddress<TimeCCDateReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TimeCCDateReport;
    year: number;
    month: number;
    day: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class TimeCCDateGet extends TimeCC {
}
export interface TimeCCTimeOffsetSetOptions {
    standardOffset: number;
    dstOffset: number;
    dstStart: Date;
    dstEnd: Date;
}
export declare class TimeCCTimeOffsetSet extends TimeCC {
    constructor(options: WithAddress<TimeCCTimeOffsetSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): TimeCCTimeOffsetSet;
    standardOffset: number;
    dstOffset: number;
    dstStartDate: Date;
    dstEndDate: Date;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface TimeCCTimeOffsetReportOptions {
    standardOffset: number;
    dstOffset: number;
    dstStart: Date;
    dstEnd: Date;
}
export declare class TimeCCTimeOffsetReport extends TimeCC {
    constructor(options: WithAddress<TimeCCTimeOffsetReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TimeCCTimeOffsetReport;
    standardOffset: number;
    dstOffset: number;
    dstStartDate: Date;
    dstEndDate: Date;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class TimeCCTimeOffsetGet extends TimeCC {
}
//# sourceMappingURL=TimeCC.d.ts.map