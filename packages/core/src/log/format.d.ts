import { type ZWaveLogInfo } from "./shared.js";
export interface LogFormat {
    transform: (info: ZWaveLogInfo) => ZWaveLogInfo;
}
export declare function combine(...formats: LogFormat[]): LogFormat;
export declare function label(label: string): LogFormat;
export declare function timestamp(format?: string): LogFormat;
/** Formats the log message and calculates the necessary paddings */
export declare const formatLogMessage: LogFormat;
/** Prints a formatted and colorized log message */
export declare function printLogMessage(shortTimestamps: boolean): LogFormat;
//# sourceMappingURL=format.d.ts.map