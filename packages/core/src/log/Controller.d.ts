import type { ValueAddedArgs, ValueID, ValueNotificationArgs, ValueRemovedArgs, ValueUpdatedArgs } from "../values/_Types.js";
import { type ControllerLogContext, type Interviewable, type LogNode, type LogNodeOptions, type LogValueArgs } from "./Controller.definitions.js";
import { ZWaveLoggerBase } from "./ZWaveLoggerBase.js";
import type { LogContainer } from "./traits.js";
export declare class ControllerLogger extends ZWaveLoggerBase<ControllerLogContext> implements LogNode {
    constructor(loggers: LogContainer);
    private isValueLogVisible;
    private isControllerLogVisible;
    /**
     * Logs a message
     * @param message The message to output
     */
    print(message: string, level?: "verbose" | "warn" | "error"): void;
    /**
     * Logs a node-related message with the correct prefix
     * @param message The message to output
     * @param level The optional loglevel if it should be different from "info"
     */
    logNode(nodeId: number, message: string, level?: LogNodeOptions["level"]): void;
    /**
     * Logs a node-related message with the correct prefix
     * @param node The node to log the message for
     * @param options The message and other options
     */
    logNode(nodeId: number, options: LogNodeOptions): void;
    valueEventPrefixes: Readonly<{
        added: "+";
        updated: "~";
        removed: "-";
        notification: "!";
    }>;
    private formatValue;
    /** Prints a log message for an added, updated or removed value */
    value(change: "added", args: LogValueArgs<ValueAddedArgs>): void;
    value(change: "updated", args: LogValueArgs<ValueUpdatedArgs>): void;
    value(change: "removed", args: LogValueArgs<ValueRemovedArgs>): void;
    value(change: "notification", args: LogValueArgs<ValueNotificationArgs>): void;
    /** Prints a log message for updated metadata of a value id */
    metadataUpdated(args: LogValueArgs<ValueID>): void;
    /** Logs the interview progress of a node */
    interviewStage(node: Interviewable): void;
    /** Logs the interview progress of a node */
    interviewStart(node: Interviewable): void;
}
//# sourceMappingURL=Controller.d.ts.map