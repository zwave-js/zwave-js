import { isObject } from "alcalzone-shared/typeguards";
import { CommandClasses } from "../definitions/CommandClasses.js";
import { InterviewStage } from "../definitions/InterviewStage.js";
import { CONTROLLER_LABEL, CONTROLLER_LOGLEVEL, VALUE_LOGLEVEL, } from "./Controller.definitions.js";
import { ZWaveLoggerBase } from "./ZWaveLoggerBase.js";
import { getDirectionPrefix, getNodeTag, tagify } from "./shared.js";
export class ControllerLogger extends ZWaveLoggerBase {
    constructor(loggers) {
        super(loggers, CONTROLLER_LABEL);
    }
    isValueLogVisible() {
        return this.container.isLoglevelVisible(VALUE_LOGLEVEL);
    }
    isControllerLogVisible() {
        return this.container.isLoglevelVisible(CONTROLLER_LOGLEVEL);
    }
    /**
     * Logs a message
     * @param message The message to output
     */
    print(message, level) {
        const actualLevel = level || CONTROLLER_LOGLEVEL;
        if (!this.container.isLoglevelVisible(actualLevel))
            return;
        this.logger.log({
            level: actualLevel,
            message,
            direction: getDirectionPrefix("none"),
            context: { source: "controller", type: "controller" },
        });
    }
    logNode(nodeId, messageOrOptions, logLevel) {
        if (typeof messageOrOptions === "string") {
            return this.logNode(nodeId, {
                message: messageOrOptions,
                level: logLevel,
            });
        }
        const { level, message, direction, endpoint } = messageOrOptions;
        const actualLevel = level || CONTROLLER_LOGLEVEL;
        if (!this.container.isLoglevelVisible(actualLevel))
            return;
        if (!this.container.isNodeLoggingVisible(nodeId))
            return;
        const context = {
            nodeId,
            source: "controller",
            type: "node",
            direction: direction || "none",
        };
        if (endpoint)
            context.endpoint = endpoint;
        this.logger.log({
            level: actualLevel,
            primaryTags: tagify([getNodeTag(nodeId)]),
            message,
            secondaryTags: endpoint
                ? tagify([`Endpoint ${endpoint}`])
                : undefined,
            direction: getDirectionPrefix(direction || "none"),
            context,
        });
    }
    valueEventPrefixes = Object.freeze({
        added: "+",
        updated: "~",
        removed: "-",
        notification: "!",
    });
    formatValue(value) {
        if (isObject(value))
            return JSON.stringify(value);
        if (typeof value !== "string")
            return String(value);
        return `"${value}"`;
    }
    value(change, args) {
        if (!this.isValueLogVisible())
            return;
        if (!this.container.isNodeLoggingVisible(args.nodeId))
            return;
        const context = {
            nodeId: args.nodeId,
            change,
            commandClass: args.commandClass,
            internal: args.internal,
            property: args.property,
            source: "controller",
            type: "value",
        };
        const primaryTags = [
            getNodeTag(args.nodeId),
            this.valueEventPrefixes[change],
            CommandClasses[args.commandClass],
        ];
        const secondaryTags = [];
        if (args.endpoint != undefined) {
            context.endpoint = args.endpoint;
            secondaryTags.push(`Endpoint ${args.endpoint}`);
        }
        if (args.internal === true) {
            secondaryTags.push("internal");
        }
        let message = args.property.toString();
        if (args.propertyKey != undefined) {
            context.propertyKey = args.propertyKey;
            message += `[${args.propertyKey}]`;
        }
        switch (change) {
            case "added":
                message += `: ${this.formatValue(args.newValue)}`;
                break;
            case "updated": {
                const _args = args;
                message += `: ${this.formatValue(_args.prevValue)} => ${this.formatValue(_args.newValue)}`;
                break;
            }
            case "removed":
                message += ` (was ${this.formatValue(args.prevValue)})`;
                break;
            case "notification":
                message += `: ${this.formatValue(args.value)}`;
                break;
        }
        this.logger.log({
            level: VALUE_LOGLEVEL,
            primaryTags: tagify(primaryTags),
            secondaryTags: tagify(secondaryTags),
            message,
            direction: getDirectionPrefix("none"),
            context,
        });
    }
    /** Prints a log message for updated metadata of a value id */
    metadataUpdated(args) {
        if (!this.isValueLogVisible())
            return;
        if (!this.container.isNodeLoggingVisible(args.nodeId))
            return;
        const context = {
            nodeId: args.nodeId,
            commandClass: args.commandClass,
            internal: args.internal,
            property: args.property,
            source: "controller",
            type: "value",
        };
        const primaryTags = [
            getNodeTag(args.nodeId),
            CommandClasses[args.commandClass],
        ];
        const secondaryTags = [];
        if (args.endpoint != undefined) {
            context.endpoint = args.endpoint;
            secondaryTags.push(`Endpoint ${args.endpoint}`);
        }
        if (args.internal === true) {
            secondaryTags.push("internal");
        }
        let message = args.property.toString();
        if (args.propertyKey != undefined) {
            context.propertyKey = args.propertyKey;
            message += `[${args.propertyKey}]`;
        }
        message += ": metadata updated";
        this.logger.log({
            level: VALUE_LOGLEVEL,
            primaryTags: tagify(primaryTags),
            secondaryTags: tagify(secondaryTags),
            message,
            direction: getDirectionPrefix("none"),
            context,
        });
    }
    /** Logs the interview progress of a node */
    interviewStage(node) {
        if (!this.isControllerLogVisible())
            return;
        if (!this.container.isNodeLoggingVisible(node.id))
            return;
        this.logger.log({
            level: CONTROLLER_LOGLEVEL,
            primaryTags: tagify([getNodeTag(node.id)]),
            message: node.interviewStage === InterviewStage.Complete
                ? "Interview completed"
                : `Interview stage completed: ${InterviewStage[node.interviewStage]}`,
            direction: getDirectionPrefix("none"),
            context: {
                nodeId: node.id,
                source: "controller",
                type: "node",
                direction: "none",
            },
        });
    }
    /** Logs the interview progress of a node */
    interviewStart(node) {
        if (!this.isControllerLogVisible())
            return;
        if (!this.container.isNodeLoggingVisible(node.id))
            return;
        const message = `Beginning interview - last completed stage: ${InterviewStage[node.interviewStage]}`;
        this.logger.log({
            level: CONTROLLER_LOGLEVEL,
            primaryTags: tagify([getNodeTag(node.id)]),
            message,
            direction: getDirectionPrefix("none"),
            context: {
                nodeId: node.id,
                source: "controller",
                type: "node",
                direction: "none",
            },
        });
    }
}
//# sourceMappingURL=Controller.js.map