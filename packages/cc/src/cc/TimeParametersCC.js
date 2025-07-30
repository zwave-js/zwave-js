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
import { CommandClasses, MessagePriority, ValueMetadata, formatDate, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { TimeParametersCommand } from "../lib/_Types.js";
export const TimeParametersCCValues = V.defineCCValues(CommandClasses["Time Parameters"], {
    ...V.staticProperty("dateAndTime", {
        ...ValueMetadata.Any,
        label: "Date and Time",
    }),
});
/**
 * Determines if the node expects local time instead of UTC.
 */
function shouldUseLocalTime(ctx, endpoint) {
    // GH#311 Some nodes have no way to determine the time zone offset,
    // so they need to interpret the set time as local time instead of UTC.
    //
    // This is the case when they both
    // 1. DON'T control TimeCC V1, so they cannot request the local time
    // 2. DON'T support TimeCC V2, so the controller cannot specify the timezone offset
    // Incidentally, this is also true when they don't support TimeCC at all
    // Use UTC though when the device config file explicitly requests it
    const forceUTC = !!ctx.getDeviceConfig?.(endpoint.nodeId)?.compat
        ?.useUTCInTimeParametersCC;
    if (forceUTC)
        return false;
    const ccVersion = endpoint.getCCVersion(CommandClasses.Time);
    if (ccVersion >= 1 && endpoint.controlsCC(CommandClasses.Time)) {
        return false;
    }
    if (ccVersion >= 2 && endpoint.supportsCC(CommandClasses.Time)) {
        return false;
    }
    return true;
}
function segmentsToDate(segments, local) {
    if (local) {
        return new Date(segments.year, segments.month - 1, segments.day, segments.hour, segments.minute, segments.second);
    }
    else {
        return new Date(Date.UTC(segments.year, segments.month - 1, segments.day, segments.hour, segments.minute, segments.second));
    }
}
function dateToSegments(date, local) {
    return {
        year: date[`get${local ? "" : "UTC"}FullYear`](),
        month: date[`get${local ? "" : "UTC"}Month`]() + 1,
        day: date[`get${local ? "" : "UTC"}Date`](),
        hour: date[`get${local ? "" : "UTC"}Hours`](),
        minute: date[`get${local ? "" : "UTC"}Minutes`](),
        second: date[`get${local ? "" : "UTC"}Seconds`](),
    };
}
let TimeParametersCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Time Parameters"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var TimeParametersCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeParametersCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case TimeParametersCommand.Get:
                    return this.isSinglecast();
                case TimeParametersCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                if (property !== "dateAndTime") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (!(value instanceof Date)) {
                    throwWrongValueType(this.ccId, property, "date", typeof value);
                }
                return this.set(value);
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "dateAndTime":
                        return this.get();
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async get() {
            this.assertSupportsCommand(TimeParametersCommand, TimeParametersCommand.Get);
            const cc = new TimeParametersCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.dateAndTime;
        }
        async set(dateAndTime) {
            this.assertSupportsCommand(TimeParametersCommand, TimeParametersCommand.Set);
            const endpointToCheck = this.endpoint.virtual
                ? this.endpoint.node.physicalNodes[0].getEndpoint(this.endpoint.index)
                : this.endpoint;
            const useLocalTime = shouldUseLocalTime(this.host, endpointToCheck);
            const cc = new TimeParametersCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                dateAndTime,
                useLocalTime,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return TimeParametersCCAPI = _classThis;
})();
export { TimeParametersCCAPI };
let TimeParametersCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Time Parameters"]), implementedVersion(1), ccValues(TimeParametersCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var TimeParametersCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeParametersCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Time Parameters"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Synchronize the node's time
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "setting current time...",
                direction: "outbound",
            });
            await api.set(new Date());
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return TimeParametersCC = _classThis;
})();
export { TimeParametersCC };
let TimeParametersCCReport = (() => {
    let _classDecorators = [CCCommand(TimeParametersCommand.Report), ccValueProperty("dateAndTime", TimeParametersCCValues.dateAndTime)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeParametersCC;
    var TimeParametersCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeParametersCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.dateAndTime = options.dateAndTime;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 7);
            const dateSegments = {
                year: raw.payload.readUInt16BE(0),
                month: raw.payload[2],
                day: raw.payload[3],
                hour: raw.payload[4],
                minute: raw.payload[5],
                second: raw.payload[6],
            };
            const dateAndTime = segmentsToDate(dateSegments, 
            // Assume we can use UTC and correct this assumption in persistValues
            false);
            return new this({
                nodeId: ctx.sourceNodeId,
                dateAndTime,
            });
        }
        persistValues(ctx) {
            // If necessary, fix the date and time before persisting it
            const local = shouldUseLocalTime(ctx, this.getEndpoint(ctx));
            if (local) {
                // The initial assumption was incorrect, re-interpret the time
                const segments = dateToSegments(this.dateAndTime, false);
                this.dateAndTime = segmentsToDate(segments, local);
            }
            return super.persistValues(ctx);
        }
        dateAndTime;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "date and time": formatDate(this.dateAndTime, "YYYY-MM-DD HH:mm:ss"),
                },
            };
        }
    };
    return TimeParametersCCReport = _classThis;
})();
export { TimeParametersCCReport };
let TimeParametersCCGet = (() => {
    let _classDecorators = [CCCommand(TimeParametersCommand.Get), expectedCCResponse(TimeParametersCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeParametersCC;
    var TimeParametersCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeParametersCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return TimeParametersCCGet = _classThis;
})();
export { TimeParametersCCGet };
let TimeParametersCCSet = (() => {
    let _classDecorators = [CCCommand(TimeParametersCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TimeParametersCC;
    var TimeParametersCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TimeParametersCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.dateAndTime = options.dateAndTime;
            this.useLocalTime = options.useLocalTime;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 7);
            const dateSegments = {
                year: raw.payload.readUInt16BE(0),
                month: raw.payload[2],
                day: raw.payload[3],
                hour: raw.payload[4],
                minute: raw.payload[5],
                second: raw.payload[6],
            };
            validatePayload(dateSegments.month >= 1 && dateSegments.month <= 12, dateSegments.day >= 1 && dateSegments.day <= 31, dateSegments.hour >= 0 && dateSegments.hour <= 23, dateSegments.minute >= 0 && dateSegments.minute <= 59, dateSegments.second >= 0 && dateSegments.second <= 59);
            const dateAndTime = segmentsToDate(dateSegments, 
            // Assume we can use UTC and correct this assumption in persistValues
            false);
            return new this({
                nodeId: ctx.sourceNodeId,
                dateAndTime,
            });
        }
        persistValues(ctx) {
            // We do not actually persist anything here, but we need access to the node
            // in order to interpret the date segments correctly
            const local = shouldUseLocalTime(ctx, this.getEndpoint(ctx));
            if (local) {
                // The initial assumption was incorrect, re-interpret the time
                const segments = dateToSegments(this.dateAndTime, false);
                this.dateAndTime = segmentsToDate(segments, local);
            }
            return super.persistValues(ctx);
        }
        dateAndTime;
        useLocalTime;
        serialize(ctx) {
            const dateSegments = dateToSegments(this.dateAndTime, !!this.useLocalTime);
            this.payload = Bytes.from([
                // 2 bytes placeholder for year
                0,
                0,
                dateSegments.month,
                dateSegments.day,
                dateSegments.hour,
                dateSegments.minute,
                dateSegments.second,
            ]);
            this.payload.writeUInt16BE(dateSegments.year, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "date and time": formatDate(this.dateAndTime, "YYYY-MM-DD HH:mm:ss"),
                },
            };
        }
    };
    return TimeParametersCCSet = _classThis;
})();
export { TimeParametersCCSet };
//# sourceMappingURL=TimeParametersCC.js.map