import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { type SetbackState, SetbackType, ThermostatSetbackCommand } from "../lib/_Types.js";
export declare class ThermostatSetbackCCAPI extends CCAPI {
    supportsCommand(cmd: ThermostatSetbackCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<Pick<ThermostatSetbackCCReport, "setbackType" | "setbackState"> | undefined>;
    set(setbackType: SetbackType, setbackState: SetbackState): Promise<SupervisionResult | undefined>;
}
export declare class ThermostatSetbackCC extends CommandClass {
    ccCommand: ThermostatSetbackCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface ThermostatSetbackCCSetOptions {
    setbackType: SetbackType;
    setbackState: SetbackState;
}
export declare class ThermostatSetbackCCSet extends ThermostatSetbackCC {
    constructor(options: WithAddress<ThermostatSetbackCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetbackCCSet;
    setbackType: SetbackType;
    /** The offset from the setpoint in 0.1 Kelvin or a special mode */
    setbackState: SetbackState;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ThermostatSetbackCCReportOptions {
    setbackType: SetbackType;
    setbackState: SetbackState;
}
export declare class ThermostatSetbackCCReport extends ThermostatSetbackCC {
    constructor(options: WithAddress<ThermostatSetbackCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ThermostatSetbackCCReport;
    readonly setbackType: SetbackType;
    /** The offset from the setpoint in 0.1 Kelvin or a special mode */
    readonly setbackState: SetbackState;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ThermostatSetbackCCGet extends ThermostatSetbackCC {
}
//# sourceMappingURL=ThermostatSetbackCC.d.ts.map