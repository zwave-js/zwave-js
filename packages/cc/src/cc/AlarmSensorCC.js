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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, isEnumMember, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { AlarmSensorCommand, AlarmSensorType } from "../lib/_Types.js";
export const AlarmSensorCCValues = V.defineCCValues(CommandClasses["Alarm Sensor"], {
    ...V.dynamicPropertyAndKeyWithName("state", "state", (sensorType) => sensorType, ({ property, propertyKey }) => property === "state" && typeof propertyKey === "number", (sensorType) => {
        const alarmName = getEnumMemberName(AlarmSensorType, sensorType);
        return {
            ...ValueMetadata.ReadOnlyBoolean,
            label: `${alarmName} state`,
            description: "Whether the alarm is active",
            ccSpecific: { sensorType },
        };
    }),
    ...V.dynamicPropertyAndKeyWithName("severity", "severity", (sensorType) => sensorType, ({ property, propertyKey }) => property === "severity" && typeof propertyKey === "number", (sensorType) => {
        const alarmName = getEnumMemberName(AlarmSensorType, sensorType);
        return {
            ...ValueMetadata.ReadOnlyNumber,
            min: 1,
            max: 100,
            unit: "%",
            label: `${alarmName} severity`,
            ccSpecific: { sensorType },
        };
    }),
    ...V.dynamicPropertyAndKeyWithName("duration", "duration", (sensorType) => sensorType, ({ property, propertyKey }) => property === "duration" && typeof propertyKey === "number", (sensorType) => {
        const alarmName = getEnumMemberName(AlarmSensorType, sensorType);
        return {
            ...ValueMetadata.ReadOnlyNumber,
            unit: "s",
            label: `${alarmName} duration`,
            description: "For how long the alarm should be active",
            ccSpecific: { sensorType },
        };
    }),
    ...V.staticProperty("supportedSensorTypes", undefined, {
        internal: true,
    }),
});
// @noSetValueAPI This CC is read-only
let AlarmSensorCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Alarm Sensor"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    var AlarmSensorCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AlarmSensorCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case AlarmSensorCommand.Get:
                case AlarmSensorCommand.SupportedGet:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        /**
         * Retrieves the current value from this sensor
         * @param sensorType The (optional) sensor type to retrieve the value for
         */
        async get(sensorType) {
            this.assertSupportsCommand(AlarmSensorCommand, AlarmSensorCommand.Get);
            const cc = new AlarmSensorCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sensorType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response)
                return pick(response, ["state", "severity", "duration"]);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupportedSensorTypes() {
            this.assertSupportsCommand(AlarmSensorCommand, AlarmSensorCommand.SupportedGet);
            const cc = new AlarmSensorCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response)
                return response.supportedSensorTypes;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return AlarmSensorCCAPI = _classThis;
})();
export { AlarmSensorCCAPI };
let AlarmSensorCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Alarm Sensor"]), implementedVersion(1), ccValues(AlarmSensorCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var AlarmSensorCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AlarmSensorCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            // Skip the interview in favor of Notification CC if possible
            if (endpoint.supportsCC(CommandClasses.Notification)) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `${this.constructor.name}: skipping interview because Notification CC is supported...`,
                    direction: "none",
                });
                this.setInterviewComplete(ctx, true);
                return;
            }
            const api = CCAPI.create(CommandClasses["Alarm Sensor"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Find out which sensor types this sensor supports
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying supported sensor types...",
                direction: "outbound",
            });
            const supportedSensorTypes = await api.getSupportedSensorTypes();
            if (supportedSensorTypes) {
                const logMessage = `received supported sensor types: ${supportedSensorTypes
                    .map((type) => getEnumMemberName(AlarmSensorType, type))
                    .map((name) => `\n· ${name}`)
                    .join("")}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying supported sensor types timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            // Query (all of) the sensor's current value(s)
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Alarm Sensor"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const supportedSensorTypes = this.getValue(ctx, AlarmSensorCCValues.supportedSensorTypes)
                ?? [];
            // Always query (all of) the sensor's current value(s)
            for (const type of supportedSensorTypes) {
                // Some devices report invalid sensor types, but the CC API checks
                // for valid values and throws otherwise.
                if (!isEnumMember(AlarmSensorType, type))
                    continue;
                const sensorName = getEnumMemberName(AlarmSensorType, type);
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying current value for ${sensorName}...`,
                    direction: "outbound",
                });
                const currentValue = await api.get(type);
                if (currentValue) {
                    let message = `received current value for ${sensorName}: 
state:    ${currentValue.state}`;
                    if (currentValue.severity != undefined) {
                        message += `
severity: ${currentValue.severity}`;
                    }
                    if (currentValue.duration != undefined) {
                        message += `
duration: ${currentValue.duration}`;
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message,
                        direction: "inbound",
                    });
                }
            }
        }
        /**
         * Returns which sensor types are supported.
         * This only works AFTER the interview process
         */
        static getSupportedSensorTypesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(AlarmSensorCCValues.supportedSensorTypes.endpoint(endpoint.index));
        }
        createMetadataForSensorType(ctx, sensorType) {
            const stateValue = AlarmSensorCCValues.state(sensorType);
            const severityValue = AlarmSensorCCValues.severity(sensorType);
            const durationValue = AlarmSensorCCValues.duration(sensorType);
            // Always create metadata if it does not exist
            this.ensureMetadata(ctx, stateValue);
            this.ensureMetadata(ctx, severityValue);
            this.ensureMetadata(ctx, durationValue);
        }
    };
    return AlarmSensorCC = _classThis;
})();
export { AlarmSensorCC };
let AlarmSensorCCReport = (() => {
    let _classDecorators = [CCCommand(AlarmSensorCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AlarmSensorCC;
    var AlarmSensorCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AlarmSensorCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.sensorType = options.sensorType;
            this.state = options.state;
            this.severity = options.severity;
            this.duration = options.duration;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 5, raw.payload[1] !== 0xff);
            const sourceNodeId = raw.payload[0];
            const sensorType = raw.payload[1];
            // Any positive value gets interpreted as alarm
            const state = raw.payload[2] > 0;
            // Severity only ranges from 1 to 100
            let severity;
            if (raw.payload[2] > 0 && raw.payload[2] <= 0x64) {
                severity = raw.payload[2];
            }
            // ignore zero durations
            const duration = raw.payload.readUInt16BE(3) || undefined;
            return new this({
                // Alarm Sensor reports may be forwarded by a different node, in this case
                // (and only then!) the payload contains the original node ID
                nodeId: sourceNodeId || ctx.sourceNodeId,
                sensorType,
                state,
                severity,
                duration,
            });
        }
        sensorType;
        state;
        severity;
        duration;
        toLogEntry(ctx) {
            const message = {
                "sensor type": getEnumMemberName(AlarmSensorType, this.sensorType),
                "alarm state": this.state,
            };
            if (this.severity != undefined) {
                message.severity = this.severity;
            }
            if (this.duration != undefined) {
                message.duration = `${this.duration} seconds`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Create metadata if it does not exist
            this.createMetadataForSensorType(ctx, this.sensorType);
            const stateValue = AlarmSensorCCValues.state(this.sensorType);
            const severityValue = AlarmSensorCCValues.severity(this.sensorType);
            const durationValue = AlarmSensorCCValues.duration(this.sensorType);
            this.setValue(ctx, stateValue, this.state);
            this.setValue(ctx, severityValue, this.severity);
            this.setValue(ctx, durationValue, this.duration);
            return true;
        }
    };
    return AlarmSensorCCReport = _classThis;
})();
export { AlarmSensorCCReport };
function testResponseForAlarmSensorGet(sent, received) {
    // We expect a Alarm Sensor Report that matches the requested sensor type (if a type was requested)
    return (sent.sensorType === AlarmSensorType.Any
        || received.sensorType === sent.sensorType);
}
let AlarmSensorCCGet = (() => {
    let _classDecorators = [CCCommand(AlarmSensorCommand.Get), expectedCCResponse(AlarmSensorCCReport, testResponseForAlarmSensorGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AlarmSensorCC;
    var AlarmSensorCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AlarmSensorCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sensorType = options.sensorType ?? AlarmSensorType.Any;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new AlarmSensorCCGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        sensorType;
        serialize(ctx) {
            this.payload = Bytes.from([this.sensorType]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "sensor type": getEnumMemberName(AlarmSensorType, this.sensorType),
                },
            };
        }
    };
    return AlarmSensorCCGet = _classThis;
})();
export { AlarmSensorCCGet };
let AlarmSensorCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(AlarmSensorCommand.SupportedReport), ccValueProperty("supportedSensorTypes", AlarmSensorCCValues.supportedSensorTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AlarmSensorCC;
    var AlarmSensorCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AlarmSensorCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedSensorTypes = options.supportedSensorTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const bitMaskLength = raw.payload[0];
            validatePayload(raw.payload.length >= 1 + bitMaskLength);
            const supportedSensorTypes = parseBitMask(raw.payload.subarray(1, 1 + bitMaskLength), AlarmSensorType["General Purpose"]);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedSensorTypes,
            });
        }
        supportedSensorTypes;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Create metadata for each sensor type
            for (const type of this.supportedSensorTypes) {
                this.createMetadataForSensorType(ctx, type);
            }
            return true;
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported sensor types": this.supportedSensorTypes
                        .map((t) => getEnumMemberName(AlarmSensorType, t))
                        .join(", "),
                },
            };
        }
    };
    return AlarmSensorCCSupportedReport = _classThis;
})();
export { AlarmSensorCCSupportedReport };
let AlarmSensorCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(AlarmSensorCommand.SupportedGet), expectedCCResponse(AlarmSensorCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AlarmSensorCC;
    var AlarmSensorCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AlarmSensorCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AlarmSensorCCSupportedGet = _classThis;
})();
export { AlarmSensorCCSupportedGet };
//# sourceMappingURL=AlarmSensorCC.js.map