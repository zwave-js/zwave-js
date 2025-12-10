import { getenv } from "@zwave-js/shared";
import path from "pathe";
import { configs } from "triple-beam";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { colorizer } from "../../log/Colorizer.js";
import { combine, formatLogMessage, label, printLogMessage, timestamp, } from "../../log/format.js";
import { nonUndefinedLogConfigKeys, stringToNodeList, timestampFormat, timestampFormatShort, } from "../../log/shared.js";
const isTTY = process.stdout.isTTY;
const isUnitTest = process.env.NODE_ENV === "test";
const loglevels = configs.npm.levels;
function getTransportLoglevel() {
    const loglevel = getenv("LOGLEVEL");
    return loglevel in loglevels ? loglevel : "debug";
}
/** Performs a reverse lookup of the numeric loglevel */
function loglevelFromNumber(numLevel) {
    if (numLevel == undefined)
        return;
    for (const [level, value] of Object.entries(loglevels)) {
        if (value === numLevel)
            return level;
    }
}
/** Creates the common logger format for all loggers under a given channel */
export function createLoggerFormat(channel) {
    return combine(
    // add the channel as a label
    label(channel), 
    // default to short timestamps
    timestamp(timestampFormat));
}
/** The common logger format for built-in transports */
export function createDefaultTransportFormat(colorize, shortTimestamps) {
    const formats = [
        // overwrite the default timestamp format if necessary
        shortTimestamps
            ? timestamp(timestampFormatShort)
            : undefined,
        formatLogMessage,
        colorize ? colorizer() : undefined,
        printLogMessage(shortTimestamps),
    ].filter((f) => f != undefined);
    return combine(...formats);
}
/** Unsilences the console transport of a logger and returns the original value */
export function unsilence(logger) {
    const consoleTransport = logger.transports.find((t) => t.name === "console");
    if (consoleTransport) {
        const ret = !!consoleTransport.silent;
        consoleTransport.silent = false;
        return ret;
    }
    return false;
}
/** Restores the console transport of a logger to its original silence state */
export function restoreSilence(logger, original) {
    const consoleTransport = logger.transports.find((t) => t.name === "console");
    if (consoleTransport) {
        consoleTransport.silent = original;
    }
}
class ZWaveLogContainer extends winston.Container {
    fileTransport;
    consoleTransport;
    loglevelVisibleCache = new Map();
    logConfig = {
        enabled: true,
        level: getTransportLoglevel(),
        logToFile: !!getenv("LOGTOFILE"),
        maxFiles: 7,
        nodeFilter: stringToNodeList(getenv("LOG_NODES")),
        transports: undefined,
        filename: path.join(process.cwd(), `zwavejs_%DATE%.log`),
        forceConsole: false,
    };
    constructor(config = {}) {
        super();
        this.updateConfiguration(config);
    }
    getLogger(label) {
        if (!this.has(label)) {
            this.add(label, {
                transports: this.getAllTransports(),
                format: createLoggerFormat(label),
                // Accept all logs, no matter what. The individual loggers take care
                // of filtering the wrong loglevels
                level: "silly",
            });
        }
        return this.get(label);
    }
    updateConfiguration(config) {
        // Avoid overwriting configuration settings with undefined if they shouldn't be
        for (const key of nonUndefinedLogConfigKeys) {
            if (key in config && config[key] === undefined) {
                delete config[key];
            }
        }
        const changedLoggingTarget = (config.logToFile != undefined
            && config.logToFile !== this.logConfig.logToFile)
            || (config.forceConsole != undefined
                && config.forceConsole !== this.logConfig.forceConsole);
        if (typeof config.level === "number") {
            config.level = loglevelFromNumber(config.level);
        }
        const changedLogLevel = config.level != undefined
            && config.level !== this.logConfig.level;
        if (config.filename != undefined
            && !config.filename.includes("%DATE%")) {
            config.filename += "_%DATE%.log";
        }
        const changedFilename = config.filename != undefined
            && config.filename !== this.logConfig.filename;
        if (config.maxFiles != undefined) {
            if (typeof config.maxFiles !== "number"
                || config.maxFiles < 1
                || config.maxFiles > 365) {
                delete config.maxFiles;
            }
        }
        const changedMaxFiles = config.maxFiles != undefined
            && config.maxFiles !== this.logConfig.maxFiles;
        this.logConfig = Object.assign(this.logConfig, config);
        // If the loglevel changed, our cached "is visible" info is out of date
        if (changedLogLevel) {
            this.loglevelVisibleCache.clear();
        }
        // When the log target (console, file, filename) was changed, recreate the internal transports
        // because at least the filename does not update dynamically
        // Also do this when configuring the logger for the first time
        const recreateInternalTransports = (this.fileTransport == undefined
            && this.consoleTransport == undefined)
            || changedLoggingTarget
            || changedFilename
            || changedMaxFiles;
        if (recreateInternalTransports) {
            this.fileTransport?.destroy();
            this.fileTransport = undefined;
            this.consoleTransport?.destroy();
            this.consoleTransport = undefined;
        }
        // When the internal transports or the custom transports were changed, we need to update the loggers
        if (recreateInternalTransports || config.transports != undefined) {
            this.loggers.forEach((logger) => logger.configure({ transports: this.getAllTransports() }));
        }
    }
    getConfiguration() {
        return this.logConfig;
    }
    /** Tests whether a log using the given loglevel will be logged */
    isLoglevelVisible(loglevel) {
        // If we are not connected to a TTY, not logging to a file and don't have any custom transports, we won't see anything
        if (!this.fileTransport
            && !this.consoleTransport
            && (!this.logConfig.transports
                || this.logConfig.transports.length === 0)) {
            return false;
        }
        if (!this.loglevelVisibleCache.has(loglevel)) {
            this.loglevelVisibleCache.set(loglevel, loglevel in loglevels
                && loglevels[loglevel] <= loglevels[this.logConfig.level]);
        }
        return this.loglevelVisibleCache.get(loglevel);
    }
    destroy() {
        for (const key in this.loggers) {
            this.close(key);
        }
        this.fileTransport = undefined;
        this.consoleTransport = undefined;
        this.logConfig.transports = [];
    }
    getAllTransports() {
        return [
            ...this.getInternalTransports(),
            ...(this.logConfig.transports ?? []),
        ];
    }
    getInternalTransports() {
        const ret = [];
        // If logging is disabled, don't log to any of the default transports
        if (!this.logConfig.enabled) {
            return ret;
        }
        // Log to file only when opted in
        if (this.logConfig.logToFile) {
            if (!this.fileTransport) {
                this.fileTransport = this.createFileTransport();
            }
            ret.push(this.fileTransport);
        }
        // Console logs can be noise, so only log to console...
        if (
        // when in production
        !isUnitTest
            // and stdout is a TTY while we're not already logging to a file
            && ((isTTY && !this.logConfig.logToFile)
                // except when the user explicitly wants to
                || this.logConfig.forceConsole)) {
            if (!this.consoleTransport) {
                this.consoleTransport = this.createConsoleTransport();
            }
            ret.push(this.consoleTransport);
        }
        return ret;
    }
    createConsoleTransport() {
        return new winston.transports.Console({
            format: createDefaultTransportFormat(
            // Only colorize the output if logging to a TTY, otherwise we'll get
            // ansi color codes in logfiles or redirected shells
            isTTY || isUnitTest, 
            // Only use short timestamps if logging to a TTY
            isTTY),
            silent: this.isConsoleTransportSilent(),
        });
    }
    isConsoleTransportSilent() {
        return process.env.NODE_ENV === "test" || !this.logConfig.enabled;
    }
    isFileTransportSilent() {
        return !this.logConfig.enabled;
    }
    createFileTransport() {
        const ret = new DailyRotateFile({
            filename: this.logConfig.filename,
            auditFile: `${this.logConfig.filename
                .replace("_%DATE%", "_logrotate")
                .replace(/\.log$/, "")}.json`,
            datePattern: "YYYY-MM-DD",
            createSymlink: true,
            symlinkName: path
                .basename(this.logConfig.filename)
                .replace(`_%DATE%`, "_current"),
            zippedArchive: true,
            maxFiles: `${this.logConfig.maxFiles}d`,
            format: createDefaultTransportFormat(false, false),
            silent: this.isFileTransportSilent(),
        });
        ret.on("new", (newFilename) => {
            console.log(`Logging to file:
	${newFilename}`);
        });
        ret.on("error", (err) => {
            console.error(`Error in file stream rotator: ${err.message}`);
        });
        return ret;
    }
    /**
     * Checks the log configuration whether logs should be written for a given node id
     */
    isNodeLoggingVisible(nodeId) {
        // If no filters are set, every node gets logged
        if (!this.logConfig.nodeFilter)
            return true;
        return this.logConfig.nodeFilter.includes(nodeId);
    }
}
export const log = (config) => new ZWaveLogContainer(config);
//# sourceMappingURL=node.js.map