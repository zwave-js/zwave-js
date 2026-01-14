import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MaybeUnknown, type MessageOrCCLogEntry, type ValueID, ValueMetadata, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../../lib/API.js";
import type { CCRaw, CommandClassOptions, InterviewContext, PersistValuesContext, RefreshValuesContext } from "../../lib/CommandClass.js";
import { ManufacturerProprietaryCC, ManufacturerProprietaryCCAPI } from "../ManufacturerProprietaryCC.js";
export declare const MANUFACTURERID_FIBARO = 271;
/** Returns the ValueID used to store the current venetian blind position */
export declare function getFibaroVenetianBlindPositionValueId(endpoint: number): ValueID;
/** Returns the value metadata for venetian blind position */
export declare function getFibaroVenetianBlindPositionMetadata(): ValueMetadata;
/** Returns the ValueID used to store the current venetian blind tilt */
export declare function getFibaroVenetianBlindTiltValueId(endpoint: number): ValueID;
/** Returns the value metadata for venetian blind tilt */
export declare function getFibaroVenetianBlindTiltMetadata(): ValueMetadata;
export declare enum FibaroCCIDs {
    VenetianBlind = 38
}
export declare class FibaroCCAPI extends ManufacturerProprietaryCCAPI {
    fibaroVenetianBlindsGet(): Promise<Pick<FibaroVenetianBlindCCReport, "position" | "tilt"> | undefined>;
    fibaroVenetianBlindsSetPosition(value: number): Promise<void>;
    fibaroVenetianBlindsSetTilt(value: number): Promise<void>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class FibaroCC extends ManufacturerProprietaryCC {
    constructor(options: CommandClassOptions);
    static from(raw: CCRaw, ctx: CCParsingContext): FibaroCC;
    fibaroCCId?: number;
    fibaroCCCommand?: number;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export declare enum FibaroVenetianBlindCCCommand {
    Set = 1,
    Get = 2,
    Report = 3
}
export declare class FibaroVenetianBlindCC extends FibaroCC {
    fibaroCCId: FibaroCCIDs.VenetianBlind;
    fibaroCCCommand: FibaroVenetianBlindCCCommand;
    constructor(options: CommandClassOptions);
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export type FibaroVenetianBlindCCSetOptions = {
    position: number;
} | {
    tilt: number;
} | {
    position: number;
    tilt: number;
};
export declare class FibaroVenetianBlindCCSet extends FibaroVenetianBlindCC {
    constructor(options: WithAddress<FibaroVenetianBlindCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): FibaroVenetianBlindCCSet;
    position: number | undefined;
    tilt: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FibaroVenetianBlindCCReportOptions {
    position?: MaybeUnknown<number>;
    tilt?: MaybeUnknown<number>;
}
export declare class FibaroVenetianBlindCCReport extends FibaroVenetianBlindCC {
    constructor(options: WithAddress<FibaroVenetianBlindCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FibaroVenetianBlindCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    position: MaybeUnknown<number> | undefined;
    tilt: MaybeUnknown<number> | undefined;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class FibaroVenetianBlindCCGet extends FibaroVenetianBlindCC {
    constructor(options: CommandClassOptions);
    static from(raw: CCRaw, ctx: CCParsingContext): FibaroVenetianBlindCCGet;
}
//# sourceMappingURL=FibaroCC.d.ts.map