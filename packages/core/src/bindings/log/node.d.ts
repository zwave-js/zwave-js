import type { Format } from "logform";
import winston from "winston";
import { type LogFactory } from "../../log/shared.js";
/** Creates the common logger format for all loggers under a given channel */
export declare function createLoggerFormat(channel: string): Format;
/** The common logger format for built-in transports */
export declare function createDefaultTransportFormat(colorize: boolean, shortTimestamps: boolean): Format;
/** Unsilences the console transport of a logger and returns the original value */
export declare function unsilence(logger: winston.Logger): boolean;
/** Restores the console transport of a logger to its original silence state */
export declare function restoreSilence(logger: winston.Logger, original: boolean): void;
export declare const log: LogFactory;
//# sourceMappingURL=node.d.ts.map