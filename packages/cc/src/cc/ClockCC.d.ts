import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ClockCommand, Weekday } from "../lib/_Types.js";
export declare class ClockCCAPI extends CCAPI {
    supportsCommand(cmd: ClockCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<ClockCCReport, "minute" | "hour" | "weekday"> | undefined>;
    set(hour: number, minute: number, weekday?: Weekday): Promise<SupervisionResult | undefined>;
}
export declare class ClockCC extends CommandClass {
    ccCommand: ClockCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ClockCCSetOptions {
    weekday: Weekday;
    hour: number;
    minute: number;
}
export declare class ClockCCSet extends ClockCC {
    constructor(options: WithAddress<ClockCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ClockCCSet;
    weekday: Weekday;
    hour: number;
    minute: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ClockCCReportOptions {
    weekday: Weekday;
    hour: number;
    minute: number;
}
export declare class ClockCCReport extends ClockCC {
    constructor(options: WithAddress<ClockCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ClockCCReport;
    readonly weekday: Weekday;
    readonly hour: number;
    readonly minute: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ClockCCGet extends ClockCC {
}
//# sourceMappingURL=ClockCC.d.ts.map