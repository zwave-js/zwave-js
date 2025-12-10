import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { LockCommand } from "../lib/_Types.js";
export declare const LockCCValues: Readonly<{
    locked: {
        id: {
            readonly commandClass: CommandClasses.Lock;
            readonly property: "locked";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Lock;
            readonly endpoint: number;
            readonly property: "locked";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Locked";
            readonly description: "Whether the lock is locked";
            readonly type: "boolean";
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
}>;
export declare class LockCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: LockCommand): MaybeNotKnown<boolean>;
    get(): Promise<MaybeNotKnown<boolean>>;
    /**
     * Locks or unlocks the lock
     * @param locked Whether the lock should be locked
     */
    set(locked: boolean): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class LockCC extends CommandClass {
    ccCommand: LockCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface LockCCSetOptions {
    locked: boolean;
}
export declare class LockCCSet extends LockCC {
    constructor(options: WithAddress<LockCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): LockCCSet;
    locked: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface LockCCReportOptions {
    locked: boolean;
}
export declare class LockCCReport extends LockCC {
    constructor(options: WithAddress<LockCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): LockCCReport;
    readonly locked: boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class LockCCGet extends LockCC {
}
//# sourceMappingURL=LockCC.d.ts.map