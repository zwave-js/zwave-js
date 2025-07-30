var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { CommandClasses, MessagePriority, ZWaveError, ZWaveErrorCodes, formatDate, getDSTInfo, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { TimeCommand } from "../lib/_Types.js";
import { encodeTimezone, parseTimezone } from "../lib/serializers.js";
// @noSetValueAPI
// Only the timezone information can be set and that accepts a non-primitive value
let TimeCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Time)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _reportTime_decorators;
    let _reportDate_decorators;
    let _setTimezone_decorators;
    let _reportTimezone_decorators;
    var TimeCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _reportTime_decorators = [validateArgs()];
            _reportDate_decorators = [validateArgs()];
            _setTimezone_decorators = [validateArgs()];
            _reportTimezone_decorators = [validateArgs()];
            __esDecorate(this, null, _reportTime_decorators, { kind: "method", name: "reportTime", static: false, private: false, access: { has: obj => "reportTime" in obj, get: obj => obj.reportTime }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportDate_decorators, { kind: "method", name: "reportDate", static: false, private: false, access: { has: obj => "reportDate" in obj, get: obj => obj.reportDate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setTimezone_decorators, { kind: "method", name: "setTimezone", static: false, private: false, access: { has: obj => "setTimezone" in obj, get: obj => obj.setTimezone }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportTimezone_decorators, { kind: "method", name: "reportTimezone", static: false, private: false, access: { has: obj => "reportTimezone" in obj, get: obj => obj.reportTimezone }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case TimeCommand.TimeGet:
                case TimeCommand.TimeReport:
                case TimeCommand.DateGet:
                case TimeCommand.DateReport:
                    return this.isSinglecast(); // "mandatory"
                case TimeCommand.TimeOffsetGet:
                case TimeCommand.TimeOffsetReport:
                    return this.version >= 2 && this.isSinglecast();
                case TimeCommand.TimeOffsetSet:
                    return this.version >= 2;
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getTime() {
            this.assertSupportsCommand(TimeCommand, TimeCommand.TimeGet);
            const cc = new TimeCCTimeGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["hour", "minute", "second"]);
            }
        }
        async reportTime(hour, minute, second) {
            this.assertSupportsCommand(TimeCommand, TimeCommand.TimeReport);
            const cc = new TimeCCTimeReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                hour,
                minute,
                second,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getDate() {
            this.assertSupportsCommand(TimeCommand, TimeCommand.DateGet);
            const cc = new TimeCCDateGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["day", "month", "year"]);
            }
        }
        async reportDate(year, month, day) {
            this.assertSupportsCommand(TimeCommand, TimeCommand.DateReport);
            const cc = new TimeCCDateReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                year,
                month,
                day,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async setTimezone(timezone) {
            this.assertSupportsCommand(TimeCommand, TimeCommand.TimeOffsetSet);
            const cc = new TimeCCTimeOffsetSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                standardOffset: timezone.standardOffset,
                dstOffset: timezone.dstOffset,
                dstStart: timezone.startDate,
                dstEnd: timezone.endDate,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getTimezone() {
            this.assertSupportsCommand(TimeCommand, TimeCommand.TimeOffsetGet);
            const cc = new TimeCCTimeOffsetGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    standardOffset: response.standardOffset,
                    dstOffset: response.dstOffset,
                    startDate: response.dstStartDate,
                    endDate: response.dstEndDate,
                };
            }
        }
        async reportTimezone(timezone) {
            this.assertSupportsCommand(TimeCommand, TimeCommand.TimeOffsetReport);
            const cc = new TimeCCTimeOffsetReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                standardOffset: timezone.standardOffset,
                dstOffset: timezone.dstOffset,
                dstStart: timezone.startDate,
                dstEnd: timezone.endDate,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return TimeCCAPI = _classThis;
})();
export { TimeCCAPI };
let TimeCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Time), implementedVersion(2)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var TimeCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Time, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Synchronize the slave's time
            if (api.version >= 2) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "setting timezone information...",
                    direction: "outbound",
                });
                // Set the correct timezone on this node
                const timezone = getDSTInfo();
                await api.setTimezone(timezone);
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return TimeCC = _classThis;
})();
export { TimeCC };
let TimeCCTimeReport = (() => {
    let _classDecorators = [CCCommand(TimeCommand.TimeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCTimeReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCTimeReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.hour = options.hour;
            this.minute = options.minute;
            this.second = options.second;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const hour = raw.payload[0] & 0b11111;
            const minute = raw.payload[1];
            const second = raw.payload[2];
            validatePayload(hour >= 0, hour <= 23, minute >= 0, minute <= 59, second >= 0, second <= 59);
            return new this({
                nodeId: ctx.sourceNodeId,
                hour,
                minute,
                second,
            });
        }
        hour;
        minute;
        second;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.hour & 0b11111,
                this.minute,
                this.second,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    time: `${this.hour.toString().padStart(2, "0")}:${this.minute.toString().padStart(2, "0")}:${this.second.toString().padStart(2, "0")}`,
                },
            };
        }
    };
    return TimeCCTimeReport = _classThis;
})();
export { TimeCCTimeReport };
let TimeCCTimeGet = (() => {
    let _classDecorators = [CCCommand(TimeCommand.TimeGet), expectedCCResponse(TimeCCTimeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCTimeGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCTimeGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return TimeCCTimeGet = _classThis;
})();
export { TimeCCTimeGet };
let TimeCCDateReport = (() => {
    let _classDecorators = [CCCommand(TimeCommand.DateReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCDateReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCDateReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.year = options.year;
            this.month = options.month;
            this.day = options.day;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const year = raw.payload.readUInt16BE(0);
            const month = raw.payload[2];
            const day = raw.payload[3];
            return new this({
                nodeId: ctx.sourceNodeId,
                year,
                month,
                day,
            });
        }
        year;
        month;
        day;
        serialize(ctx) {
            this.payload = Bytes.from([
                // 2 bytes placeholder for year
                0,
                0,
                this.month,
                this.day,
            ]);
            this.payload.writeUInt16BE(this.year, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    date: `${this.year.toString().padStart(4, "0")}-${this.month.toString().padStart(2, "0")}-${this.day.toString().padStart(2, "0")}`,
                },
            };
        }
    };
    return TimeCCDateReport = _classThis;
})();
export { TimeCCDateReport };
let TimeCCDateGet = (() => {
    let _classDecorators = [CCCommand(TimeCommand.DateGet), expectedCCResponse(TimeCCDateReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCDateGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCDateGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return TimeCCDateGet = _classThis;
})();
export { TimeCCDateGet };
let TimeCCTimeOffsetSet = (() => {
    let _classDecorators = [CCCommand(TimeCommand.TimeOffsetSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCTimeOffsetSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCTimeOffsetSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.standardOffset = options.standardOffset;
            this.dstOffset = options.dstOffset;
            this.dstStartDate = options.dstStart;
            this.dstEndDate = options.dstEnd;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new TimeCCTimeOffsetSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        standardOffset;
        dstOffset;
        dstStartDate;
        dstEndDate;
        serialize(ctx) {
            this.payload = Bytes.concat([
                encodeTimezone({
                    standardOffset: this.standardOffset,
                    dstOffset: this.dstOffset,
                }),
                Bytes.from([
                    this.dstStartDate.getUTCMonth() + 1,
                    this.dstStartDate.getUTCDate(),
                    this.dstStartDate.getUTCHours(),
                    this.dstEndDate.getUTCMonth() + 1,
                    this.dstEndDate.getUTCDate(),
                    this.dstEndDate.getUTCHours(),
                ]),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "standard time offset": `${this.standardOffset} minutes`,
                    "DST offset": `${this.dstOffset} minutes`,
                    "DST start date": formatDate(this.dstStartDate, "YYYY-MM-DD"),
                    "DST end date": formatDate(this.dstEndDate, "YYYY-MM-DD"),
                },
            };
        }
    };
    return TimeCCTimeOffsetSet = _classThis;
})();
export { TimeCCTimeOffsetSet };
let TimeCCTimeOffsetReport = (() => {
    let _classDecorators = [CCCommand(TimeCommand.TimeOffsetReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCTimeOffsetReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCTimeOffsetReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.standardOffset = options.standardOffset;
            this.dstOffset = options.dstOffset;
            this.dstStartDate = options.dstStart;
            this.dstEndDate = options.dstEnd;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 9);
            const { standardOffset, dstOffset } = parseTimezone(raw.payload);
            const currentYear = new Date().getUTCFullYear();
            const dstStartDate = new Date(Date.UTC(currentYear, raw.payload[3] - 1, raw.payload[4], raw.payload[5]));
            const dstEndDate = new Date(Date.UTC(currentYear, raw.payload[6] - 1, raw.payload[7], raw.payload[8]));
            return new this({
                nodeId: ctx.sourceNodeId,
                standardOffset,
                dstOffset,
                dstStart: dstStartDate,
                dstEnd: dstEndDate,
            });
        }
        standardOffset;
        dstOffset;
        dstStartDate;
        dstEndDate;
        serialize(ctx) {
            this.payload = Bytes.concat([
                encodeTimezone({
                    standardOffset: this.standardOffset,
                    dstOffset: this.dstOffset,
                }),
                Bytes.from([
                    this.dstStartDate.getUTCMonth() + 1,
                    this.dstStartDate.getUTCDate(),
                    this.dstStartDate.getUTCHours(),
                    this.dstEndDate.getUTCMonth() + 1,
                    this.dstEndDate.getUTCDate(),
                    this.dstEndDate.getUTCHours(),
                ]),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "standard time offset": `${this.standardOffset} minutes`,
                    "DST offset": `${this.dstOffset} minutes`,
                    "DST start date": formatDate(this.dstStartDate, "YYYY-MM-DD"),
                    "DST end date": formatDate(this.dstEndDate, "YYYY-MM-DD"),
                },
            };
        }
    };
    return TimeCCTimeOffsetReport = _classThis;
})();
export { TimeCCTimeOffsetReport };
let TimeCCTimeOffsetGet = (() => {
    let _classDecorators = [CCCommand(TimeCommand.TimeOffsetGet), expectedCCResponse(TimeCCTimeOffsetReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeCC;
    var TimeCCTimeOffsetGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeCCTimeOffsetGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return TimeCCTimeOffsetGet = _classThis;
})();
export { TimeCCTimeOffsetGet };
//# sourceMappingURL=TimeCC.js.map