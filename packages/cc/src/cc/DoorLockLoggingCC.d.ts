import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { DoorLockLoggingCommand, type DoorLockLoggingRecord } from "../lib/_Types.js";
export declare const DoorLockLoggingCCValues: Readonly<{
    recordsCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock Logging"];
            readonly property: "recordsCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock Logging"];
            readonly endpoint: number;
            readonly property: "recordsCount";
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
export declare class DoorLockLoggingCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: DoorLockLoggingCommand): MaybeNotKnown<boolean>;
    getRecordsCount(): Promise<MaybeNotKnown<number>>;
    /** Retrieves the specified audit record. Defaults to the latest one. */
    getRecord(recordNumber?: number): Promise<MaybeNotKnown<DoorLockLoggingRecord>>;
}
export declare class DoorLockLoggingCC extends CommandClass {
    ccCommand: DoorLockLoggingCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface DoorLockLoggingCCRecordsSupportedReportOptions {
    recordsCount: number;
}
export declare class DoorLockLoggingCCRecordsSupportedReport extends DoorLockLoggingCC {
    constructor(options: WithAddress<DoorLockLoggingCCRecordsSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): DoorLockLoggingCCRecordsSupportedReport;
    readonly recordsCount: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class DoorLockLoggingCCRecordsSupportedGet extends DoorLockLoggingCC {
}
export interface DoorLockLoggingCCRecordReportOptions {
    recordNumber: number;
    record?: DoorLockLoggingRecord;
}
export declare class DoorLockLoggingCCRecordReport extends DoorLockLoggingCC {
    constructor(options: WithAddress<DoorLockLoggingCCRecordReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): DoorLockLoggingCCRecordReport;
    readonly recordNumber: number;
    readonly record?: DoorLockLoggingRecord;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface DoorLockLoggingCCRecordGetOptions {
    recordNumber: number;
}
export declare class DoorLockLoggingCCRecordGet extends DoorLockLoggingCC {
    constructor(options: WithAddress<DoorLockLoggingCCRecordGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): DoorLockLoggingCCRecordGet;
    recordNumber: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=DoorLockLoggingCC.d.ts.map