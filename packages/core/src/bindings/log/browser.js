import colors from "ansi-colors";
import { MESSAGE } from "triple-beam";
import { colorizer } from "../../log/Colorizer.js";
import { combine, formatLogMessage, label, printLogMessage, timestamp, } from "../../log/format.js";
import { timestampFormat, timestampFormatShort, } from "../../log/shared.js";
colors.enabled = true;
function createLoggerFormat(channel, colorize, shortTimestamps) {
    const formats = [
        label(channel),
        shortTimestamps
            ? timestamp(timestampFormatShort)
            : timestamp(timestampFormat),
        formatLogMessage,
        colorize ? colorizer(false) : undefined,
        printLogMessage(shortTimestamps),
    ].filter((f) => f != undefined);
    return combine(...formats);
}
class ConsoleLogContainer {
    #loggers = new Map();
    updateConfiguration(_config) {
        // noop
    }
    getConfiguration() {
        return {
            enabled: true,
            level: "debug",
            transports: [],
            logToFile: false,
            filename: "zwavejs.log",
            forceConsole: false,
            maxFiles: 0,
        };
    }
    destroy() {
        // noop
    }
    getLogger(label) {
        if (!this.#loggers.has(label)) {
            const format = createLoggerFormat(label, true, false);
            this.#loggers.set(label, {
                log: (info) => {
                    info = format.transform(info);
                    if (info.level === "error") {
                        console.error(info[MESSAGE]);
                    }
                    else {
                        console.log(info[MESSAGE]);
                    }
                },
            });
        }
        return this.#loggers.get(label);
    }
    isLoglevelVisible(loglevel) {
        return loglevel !== "silly";
    }
    isNodeLoggingVisible(_nodeId) {
        return true;
    }
}
export const log = (_config) => new ConsoleLogContainer();
//# sourceMappingURL=browser.js.map