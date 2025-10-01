import type { TransformableInfo } from "logform";
import type Transport from "winston-transport";
import type { LogContainer } from "./traits.js";
export declare const timestampFormatShort = "HH:mm:ss.SSS";
export declare const timestampPaddingShort: string;
export declare const timestampFormat = "YYYY-MM-DD HH:mm:ss.SSS";
export declare const timestampPadding: string;
export type DataDirection = "inbound" | "outbound" | "none";
export declare function getDirectionPrefix(direction: DataDirection): "« " | "» " | "  ";
/** The space the directional arrows, grouping brackets and padding occupies */
export declare const CONTROL_CHAR_WIDTH = 2;
export declare const directionPrefixPadding: string;
/**
 * The width of a log line in (visible) characters, excluding the timestamp and
 * label, but including the direction prefix
 */
export declare const LOG_WIDTH = 80;
/** The width of the columns containing the timestamp and channel */
export declare const LOG_PREFIX_WIDTH = 20;
export interface ZWaveLogInfo<TContext extends LogContext = LogContext> extends Omit<TransformableInfo, "message"> {
    direction: string;
    /** Primary tags are printed before the message and must fit into the first line.
     * They don't have to be enclosed in square brackets */
    primaryTags?: string;
    /** Secondary tags are right-aligned in the first line and printed in a dim color */
    secondaryTags?: string;
    secondaryTagPadding?: number;
    multiline?: boolean;
    timestamp?: string;
    label?: string;
    message: string | string[];
    context: TContext;
}
export interface LogContext<T extends string = string> {
    /** Which logger this log came from */
    source: T;
    /** An optional identifier to distinguish different log types from the same logger */
    type?: string;
}
export type MessageRecord = Record<string, string | number | boolean>;
export interface MessageOrCCLogEntry {
    tags: string[];
    message?: MessageRecord;
}
/** Returns the tag used to log node related messages */
export declare function getNodeTag(nodeId: number): string;
/** Wraps an array of strings in square brackets and joins them with spaces */
export declare function tagify(tags: string[]): string;
/**
 * Calculates the length the first line of a log message would occupy if it is not split
 * @param info The message and information to log
 * @param firstMessageLineLength The length of the first line of the actual message text, not including pre- and postfixes.
 */
export declare function calculateFirstLineLength(info: ZWaveLogInfo, firstMessageLineLength: number): number;
/**
 * Tests if a given message fits into a single log line
 * @param info The message that should be logged
 * @param messageLength The length that should be assumed for the actual message without pre and postfixes.
 * Can be set to 0 to exclude the message from the calculation
 */
export declare function messageFitsIntoOneLine(info: ZWaveLogInfo, messageLength: number): boolean;
export declare function messageToLines(message: string | string[]): string[];
/** Splits a message record into multiple lines and auto-aligns key-value pairs */
export declare function messageRecordToLines(message: MessageRecord): string[];
export interface LogConfig {
    enabled: boolean;
    level: string | number;
    transports: Transport[];
    logToFile: boolean;
    maxFiles: number;
    nodeFilter?: number[];
    filename: string;
    forceConsole: boolean;
}
export type LogFactory = (config?: Partial<LogConfig>) => LogContainer;
//# sourceMappingURL=shared.d.ts.map