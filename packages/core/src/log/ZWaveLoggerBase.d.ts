import type { LogContext } from "./shared.js";
import type { LogContainer, ZWaveLogger } from "./traits.js";
export declare class ZWaveLoggerBase<TContext extends LogContext = LogContext> {
    constructor(loggers: LogContainer, logLabel: string);
    logger: ZWaveLogger<TContext>;
    container: LogContainer;
}
//# sourceMappingURL=ZWaveLoggerBase.d.ts.map