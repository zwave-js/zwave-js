import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MessageOrCCLogEntry, type SinglecastCC, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { TransportServiceCommand } from "../lib/_Types.js";
export declare const MAX_SEGMENT_SIZE = 39;
export declare const RELAXED_TIMING_THRESHOLD = 2;
/** @publicAPI */
export declare const TransportServiceTimeouts: {
    /** Waiting time before requesting a missing segment at data rate R2 */
    requestMissingSegmentR2: number;
    /** Waiting time before requesting a missing segment at data rate R3 */
    requestMissingSegmentR3: number;
    /** Waiting time before sending another datagram at data rate R2 */
    segmentCompleteR2: number;
    /** Waiting time before sending another datagram at data rate R3 */
    segmentCompleteR3: number;
    /** Waiting time between segments when sending more than {@link RELAXED_TIMING_THRESHOLD} segments at data rate R2 */
    relaxedTimingDelayR2: number;
    /** Waiting time between segments when sending more than {@link RELAXED_TIMING_THRESHOLD} segments at data rate R3 */
    relaxedTimingDelayR3: number;
};
export declare class TransportServiceCC extends CommandClass implements SinglecastCC<TransportServiceCC> {
    ccCommand: TransportServiceCommand;
    nodeId: number;
}
export interface TransportServiceCCFirstSegmentOptions {
    datagramSize: number;
    sessionId: number;
    headerExtension?: Uint8Array | undefined;
    partialDatagram: Uint8Array;
}
/** @publicAPI */
export declare function isTransportServiceEncapsulation(command: CommandClass): command is TransportServiceCCFirstSegment | TransportServiceCCSubsequentSegment;
export declare class TransportServiceCCFirstSegment extends TransportServiceCC {
    constructor(options: WithAddress<TransportServiceCCFirstSegmentOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TransportServiceCCFirstSegment;
    datagramSize: number;
    sessionId: number;
    headerExtension: Uint8Array | undefined;
    partialDatagram: Uint8Array;
    encapsulated: CommandClass;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    expectMoreMessages(): boolean;
    getPartialCCSessionId(): Record<string, any> | undefined;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface TransportServiceCCSubsequentSegmentOptions extends TransportServiceCCFirstSegmentOptions {
    datagramOffset: number;
}
export declare class TransportServiceCCSubsequentSegment extends TransportServiceCC {
    constructor(options: WithAddress<TransportServiceCCSubsequentSegmentOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TransportServiceCCSubsequentSegment;
    datagramSize: number;
    datagramOffset: number;
    sessionId: number;
    headerExtension: Uint8Array | undefined;
    partialDatagram: Uint8Array;
    private _encapsulated;
    get encapsulated(): CommandClass;
    expectMoreMessages(session: [
        TransportServiceCCFirstSegment,
        ...TransportServiceCCSubsequentSegment[]
    ]): boolean;
    getPartialCCSessionId(): Record<string, any> | undefined;
    mergePartialCCs(partials: [
        TransportServiceCCFirstSegment,
        ...TransportServiceCCSubsequentSegment[]
    ], ctx: CCParsingContext): Promise<void>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface TransportServiceCCSegmentRequestOptions {
    sessionId: number;
    datagramOffset: number;
}
export declare class TransportServiceCCSegmentRequest extends TransportServiceCC {
    constructor(options: WithAddress<TransportServiceCCSegmentRequestOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TransportServiceCCSegmentRequest;
    sessionId: number;
    datagramOffset: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface TransportServiceCCSegmentCompleteOptions {
    sessionId: number;
}
export declare class TransportServiceCCSegmentComplete extends TransportServiceCC {
    constructor(options: WithAddress<TransportServiceCCSegmentCompleteOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TransportServiceCCSegmentComplete;
    sessionId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface TransportServiceCCSegmentWaitOptions {
    pendingSegments: number;
}
export declare class TransportServiceCCSegmentWait extends TransportServiceCC {
    constructor(options: WithAddress<TransportServiceCCSegmentWaitOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TransportServiceCCSegmentWait;
    pendingSegments: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=TransportServiceCC.d.ts.map