import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { Powerlevel, PowerlevelCommand, PowerlevelTestStatus } from "../lib/_Types.js";
export declare class PowerlevelCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: PowerlevelCommand): MaybeNotKnown<boolean>;
    setNormalPowerlevel(): Promise<SupervisionResult | undefined>;
    setCustomPowerlevel(powerlevel: Powerlevel, timeout: number): Promise<SupervisionResult | undefined>;
    getPowerlevel(): Promise<MaybeNotKnown<Pick<PowerlevelCCReport, "powerlevel" | "timeout">>>;
    reportPowerlevel(options: PowerlevelCCReportOptions): Promise<void>;
    startNodeTest(testNodeId: number, powerlevel: Powerlevel, testFrameCount: number): Promise<SupervisionResult | undefined>;
    getNodeTestStatus(): Promise<MaybeNotKnown<Pick<PowerlevelCCTestNodeReport, "testNodeId" | "status" | "acknowledgedFrames">>>;
    sendNodeTestReport(options: PowerlevelCCTestNodeReportOptions): Promise<void>;
}
export declare class PowerlevelCC extends CommandClass {
    ccCommand: PowerlevelCommand;
}
export type PowerlevelCCSetOptions = {
    powerlevel: Powerlevel;
    timeout: number;
} | {
    powerlevel: (typeof Powerlevel)["Normal Power"];
    timeout?: undefined;
};
export declare class PowerlevelCCSet extends PowerlevelCC {
    constructor(options: WithAddress<PowerlevelCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): PowerlevelCCSet;
    powerlevel: Powerlevel;
    timeout?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type PowerlevelCCReportOptions = {
    powerlevel: typeof Powerlevel["Normal Power"];
    timeout?: undefined;
} | {
    powerlevel: Exclude<Powerlevel, typeof Powerlevel["Normal Power"]>;
    timeout: number;
};
export declare class PowerlevelCCReport extends PowerlevelCC {
    constructor(options: WithAddress<PowerlevelCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): PowerlevelCCReport;
    readonly powerlevel: Powerlevel;
    readonly timeout?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class PowerlevelCCGet extends PowerlevelCC {
}
export interface PowerlevelCCTestNodeSetOptions {
    testNodeId: number;
    powerlevel: Powerlevel;
    testFrameCount: number;
}
export declare class PowerlevelCCTestNodeSet extends PowerlevelCC {
    constructor(options: WithAddress<PowerlevelCCTestNodeSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): PowerlevelCCTestNodeSet;
    testNodeId: number;
    powerlevel: Powerlevel;
    testFrameCount: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface PowerlevelCCTestNodeReportOptions {
    testNodeId: number;
    status: PowerlevelTestStatus;
    acknowledgedFrames: number;
}
export declare class PowerlevelCCTestNodeReport extends PowerlevelCC {
    constructor(options: WithAddress<PowerlevelCCTestNodeReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): PowerlevelCCTestNodeReport;
    testNodeId: number;
    status: PowerlevelTestStatus;
    acknowledgedFrames: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class PowerlevelCCTestNodeGet extends PowerlevelCC {
}
//# sourceMappingURL=PowerlevelCC.d.ts.map