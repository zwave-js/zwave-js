export class ZWaveLoggerBase {
    constructor(loggers, logLabel) {
        this.container = loggers;
        this.logger = this.container.getLogger(logLabel);
    }
    logger;
    container;
}
//# sourceMappingURL=ZWaveLoggerBase.js.map