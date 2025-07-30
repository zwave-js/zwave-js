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
import { CommandClasses, MessagePriority, ValueMetadata, encodeBitMask, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, isEnumMember } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, throwUnsupportedProperty, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { BinarySensorCommand, BinarySensorType } from "../lib/_Types.js";
export const BinarySensorCCValues = V.defineCCValues(CommandClasses["Binary Sensor"], {
    ...V.staticProperty("supportedSensorTypes", undefined, {
        internal: true,
    }),
    ...V.dynamicPropertyWithName("state", 
    /* property */ (sensorType) => getEnumMemberName(BinarySensorType, sensorType), ({ property }) => typeof property === "string" && property in BinarySensorType, 
    /* meta */ (sensorType) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `Sensor state (${getEnumMemberName(BinarySensorType, sensorType)})`,
        ccSpecific: { sensorType },
    })),
});
// @noSetValueAPI This CC is read-only
let BinarySensorCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Binary Sensor"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _sendReport_decorators;
    let _reportSupportedSensorTypes_decorators;
    var BinarySensorCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs({ strictEnums: true })];
            _sendReport_decorators = [validateArgs()];
            _reportSupportedSensorTypes_decorators = [validateArgs()];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportSupportedSensorTypes_decorators, { kind: "method", name: "reportSupportedSensorTypes", static: false, private: false, access: { has: obj => "reportSupportedSensorTypes" in obj, get: obj => obj.reportSupportedSensorTypes }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySensorCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case BinarySensorCommand.Get:
                case BinarySensorCommand.Report:
                    return true; // This is mandatory
                case BinarySensorCommand.SupportedGet:
                case BinarySensorCommand.SupportedReport:
                    return this.version >= 2;
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                if (typeof property === "string") {
                    const sensorType = BinarySensorType[property];
                    if (sensorType)
                        return this.get(sensorType);
                }
                throwUnsupportedProperty(this.ccId, property);
            };
        }
        /**
         * Retrieves the current value from this sensor
         * @param sensorType The (optional) sensor type to retrieve the value for
         */
        async get(sensorType) {
            this.assertSupportsCommand(BinarySensorCommand, BinarySensorCommand.Get);
            const cc = new BinarySensorCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sensorType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            // We don't want to repeat the sensor type
            return response?.value;
        }
        async sendReport(value, sensorType) {
            this.assertSupportsCommand(BinarySensorCommand, BinarySensorCommand.Report);
            const cc = new BinarySensorCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                value,
                type: sensorType,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getSupportedSensorTypes() {
            this.assertSupportsCommand(BinarySensorCommand, BinarySensorCommand.SupportedGet);
            const cc = new BinarySensorCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            // We don't want to repeat the sensor type
            return response?.supportedSensorTypes;
        }
        async reportSupportedSensorTypes(supported) {
            this.assertSupportsCommand(BinarySensorCommand, BinarySensorCommand.SupportedReport);
            const cc = new BinarySensorCCSupportedReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                supportedSensorTypes: supported,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return BinarySensorCCAPI = _classThis;
})();
export { BinarySensorCCAPI };
let BinarySensorCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Binary Sensor"]), implementedVersion(2), ccValues(BinarySensorCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var BinarySensorCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySensorCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Binary Sensor"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Find out which sensor types this sensor supports
            if (api.version >= 2) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying supported sensor types...",
                    direction: "outbound",
                });
                const supportedSensorTypes = await api.getSupportedSensorTypes();
                if (supportedSensorTypes) {
                    const logMessage = `received supported sensor types: ${supportedSensorTypes
                        .map((type) => getEnumMemberName(BinarySensorType, type))
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
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Binary Sensor"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query (all of) the sensor's current value(s)
            if (api.version === 1) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying current value...",
                    direction: "outbound",
                });
                const currentValue = await api.get();
                if (currentValue != undefined) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `received current value: ${currentValue}`,
                        direction: "inbound",
                    });
                }
            }
            else {
                const supportedSensorTypes = this.getValue(ctx, BinarySensorCCValues.supportedSensorTypes) ?? [];
                for (const type of supportedSensorTypes) {
                    // Some devices report invalid sensor types, but the CC API checks
                    // for valid values and throws otherwise.
                    if (!isEnumMember(BinarySensorType, type))
                        continue;
                    const sensorName = getEnumMemberName(BinarySensorType, type);
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying current value for ${sensorName}...`,
                        direction: "outbound",
                    });
                    const currentValue = await api.get(type);
                    if (currentValue != undefined) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `received current value for ${sensorName}: ${currentValue}`,
                            direction: "inbound",
                        });
                    }
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
                .getValue(BinarySensorCCValues.supportedSensorTypes.endpoint(endpoint.index));
        }
        setMappedBasicValue(ctx, value) {
            this.setValue(ctx, BinarySensorCCValues.state(BinarySensorType.Any), value > 0);
            return true;
        }
    };
    return BinarySensorCC = _classThis;
})();
export { BinarySensorCC };
let BinarySensorCCReport = (() => {
    let _classDecorators = [CCCommand(BinarySensorCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySensorCC;
    var BinarySensorCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySensorCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type ?? BinarySensorType.Any;
            this.value = options.value;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const value = raw.payload[0] === 0xff;
            let type = BinarySensorType.Any;
            if (raw.payload.length >= 2) {
                type = raw.payload[1];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                value,
                type,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Workaround for devices reporting with sensor type Any -> find first supported sensor type and use that
            let sensorType = this.type;
            if (sensorType === BinarySensorType.Any) {
                const supportedSensorTypes = this.getValue(ctx, BinarySensorCCValues.supportedSensorTypes);
                if (supportedSensorTypes?.length) {
                    sensorType = supportedSensorTypes[0];
                }
            }
            const binarySensorValue = BinarySensorCCValues.state(sensorType);
            this.setMetadata(ctx, binarySensorValue, binarySensorValue.meta);
            this.setValue(ctx, binarySensorValue, this.value);
            return true;
        }
        type;
        value;
        serialize(ctx) {
            this.payload = Bytes.from([this.value ? 0xff : 0x00, this.type]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    type: getEnumMemberName(BinarySensorType, this.type),
                    value: this.value,
                },
            };
        }
    };
    return BinarySensorCCReport = _classThis;
})();
export { BinarySensorCCReport };
function testResponseForBinarySensorGet(sent, received) {
    // We expect a Binary Sensor Report that matches the requested sensor type (if a type was requested)
    return (sent.sensorType == undefined
        || sent.sensorType === BinarySensorType.Any
        || received.type === sent.sensorType
        // This is technically not correct, but some devices do this anyways
        || received.type === BinarySensorType.Any);
}
let BinarySensorCCGet = (() => {
    let _classDecorators = [CCCommand(BinarySensorCommand.Get), expectedCCResponse(BinarySensorCCReport, testResponseForBinarySensorGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySensorCC;
    var BinarySensorCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySensorCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sensorType = options.sensorType;
        }
        static from(raw, ctx) {
            let sensorType;
            if (raw.payload.length >= 1) {
                sensorType = raw.payload[0];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sensorType,
            });
        }
        sensorType;
        serialize(ctx) {
            this.payload = Bytes.from([this.sensorType ?? BinarySensorType.Any]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    type: getEnumMemberName(BinarySensorType, this.sensorType ?? BinarySensorType.Any),
                },
            };
        }
    };
    return BinarySensorCCGet = _classThis;
})();
export { BinarySensorCCGet };
let BinarySensorCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(BinarySensorCommand.SupportedReport), ccValueProperty("supportedSensorTypes", BinarySensorCCValues.supportedSensorTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySensorCC;
    var BinarySensorCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySensorCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedSensorTypes = options.supportedSensorTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            // The enumeration starts at 1, but the first (reserved) bit is included
            // in the report
            const supportedSensorTypes = parseBitMask(raw.payload, 0)
                .filter((t) => t !== 0);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedSensorTypes,
            });
        }
        supportedSensorTypes;
        serialize(ctx) {
            this.payload = encodeBitMask(this.supportedSensorTypes.filter((t) => t !== BinarySensorType.Any), undefined, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported types": this.supportedSensorTypes
                        .map((type) => getEnumMemberName(BinarySensorType, type))
                        .join(", "),
                },
            };
        }
    };
    return BinarySensorCCSupportedReport = _classThis;
})();
export { BinarySensorCCSupportedReport };
let BinarySensorCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(BinarySensorCommand.SupportedGet), expectedCCResponse(BinarySensorCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySensorCC;
    var BinarySensorCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySensorCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BinarySensorCCSupportedGet = _classThis;
})();
export { BinarySensorCCSupportedGet };
//# sourceMappingURL=BinarySensorCC.js.map