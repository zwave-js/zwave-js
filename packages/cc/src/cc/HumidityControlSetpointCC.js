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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeFloatWithScale, getNamedScale, getUnknownScale, parseBitMask, parseFloatWithScale, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { HumidityControlSetpointCommand, HumidityControlSetpointType, } from "../lib/_Types.js";
export const HumidityControlSetpointCCValues = V.defineCCValues(CommandClasses["Humidity Control Setpoint"], {
    ...V.staticProperty("supportedSetpointTypes", undefined, {
        internal: true,
    }),
    ...V.dynamicPropertyAndKeyWithName("setpoint", "setpoint", (setpointType) => setpointType, ({ property, propertyKey }) => property === "setpoint" && typeof propertyKey === "number", (setpointType) => ({
        // This is the base metadata that will be extended on the fly
        ...ValueMetadata.Number,
        label: `Setpoint (${getEnumMemberName(HumidityControlSetpointType, setpointType)})`,
        ccSpecific: { setpointType },
    })),
    ...V.dynamicPropertyAndKeyWithName("setpointScale", "setpointScale", (setpointType) => setpointType, ({ property, propertyKey }) => property === "setpointScale" && typeof propertyKey === "number", (setpointType) => ({
        ...ValueMetadata.ReadOnlyUInt8,
        label: `Setpoint scale (${getEnumMemberName(HumidityControlSetpointType, setpointType)})`,
    })),
});
function getScale(scale) {
    return getNamedScale("humidity", scale) ?? getUnknownScale(scale);
}
function getSetpointUnit(scale) {
    return getScale(scale).unit ?? "";
}
let HumidityControlSetpointCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Humidity Control Setpoint"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _set_decorators;
    let _getCapabilities_decorators;
    let _getSupportedScales_decorators;
    var HumidityControlSetpointCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs()];
            _set_decorators = [validateArgs()];
            _getCapabilities_decorators = [validateArgs()];
            _getSupportedScales_decorators = [validateArgs()];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCapabilities_decorators, { kind: "method", name: "getCapabilities", static: false, private: false, access: { has: obj => "getCapabilities" in obj, get: obj => obj.getCapabilities }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSupportedScales_decorators, { kind: "method", name: "getSupportedScales", static: false, private: false, access: { has: obj => "getSupportedScales" in obj, get: obj => obj.getSupportedScales }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case HumidityControlSetpointCommand.Get:
                case HumidityControlSetpointCommand.SupportedGet:
                case HumidityControlSetpointCommand.CapabilitiesGet:
                    return this.isSinglecast();
                case HumidityControlSetpointCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property, propertyKey }, value) {
                if (property !== "setpoint") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof propertyKey !== "number") {
                    throw new ZWaveError(`${CommandClasses[this.ccId]}: "${property}" must be further specified by a numeric property key`, ZWaveErrorCodes.Argument_Invalid);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                const scaleValueId = HumidityControlSetpointCCValues.setpointScale(propertyKey).endpoint(this.endpoint.index);
                const preferredScale = this.tryGetValueDB()?.getValue(scaleValueId);
                const result = await this.set(propertyKey, value, preferredScale ?? 0);
                // Verify the change after a delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    this.schedulePoll({ property, propertyKey }, value);
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "setpoint":
                        if (typeof propertyKey !== "number") {
                            throw new ZWaveError(`${CommandClasses[this.ccId]}: "${property}" must be further specified by a numeric property key`, ZWaveErrorCodes.Argument_Invalid);
                        }
                        return (await this.get(propertyKey))?.value;
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async get(setpointType) {
            this.assertSupportsCommand(HumidityControlSetpointCommand, HumidityControlSetpointCommand.Get);
            const cc = new HumidityControlSetpointCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setpointType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (!response)
                return;
            return response.type === HumidityControlSetpointType["N/A"]
                // not supported
                ? undefined
                // supported
                : {
                    value: response.value,
                    scale: response.scale,
                };
        }
        async set(setpointType, value, scale) {
            this.assertSupportsCommand(HumidityControlSetpointCommand, HumidityControlSetpointCommand.Set);
            const cc = new HumidityControlSetpointCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setpointType,
                value,
                scale,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getCapabilities(setpointType) {
            this.assertSupportsCommand(HumidityControlSetpointCommand, HumidityControlSetpointCommand.CapabilitiesGet);
            const cc = new HumidityControlSetpointCCCapabilitiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setpointType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "minValue",
                    "maxValue",
                    "minValueScale",
                    "maxValueScale",
                ]);
            }
        }
        async getSupportedSetpointTypes() {
            this.assertSupportsCommand(HumidityControlSetpointCommand, HumidityControlSetpointCommand.SupportedGet);
            const cc = new HumidityControlSetpointCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedSetpointTypes;
        }
        async getSupportedScales(setpointType) {
            this.assertSupportsCommand(HumidityControlSetpointCommand, HumidityControlSetpointCommand.SupportedGet);
            const cc = new HumidityControlSetpointCCScaleSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setpointType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return response.supportedScales.map((scale) => getScale(scale));
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return HumidityControlSetpointCCAPI = _classThis;
})();
export { HumidityControlSetpointCCAPI };
let HumidityControlSetpointCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Humidity Control Setpoint"]), implementedVersion(2), ccValues(HumidityControlSetpointCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var HumidityControlSetpointCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        translatePropertyKey(ctx, property, propertyKey) {
            if (property === "setpoint") {
                return getEnumMemberName(HumidityControlSetpointType, propertyKey);
            }
            else {
                return super.translatePropertyKey(ctx, property, propertyKey);
            }
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Humidity Control Setpoint"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Query the supported setpoint types
            let setpointTypes = [];
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "retrieving supported setpoint types...",
                direction: "outbound",
            });
            const resp = await api.getSupportedSetpointTypes();
            if (resp) {
                setpointTypes = [...resp];
                const logMessage = "received supported setpoint types:\n"
                    + setpointTypes
                        .map((type) => getEnumMemberName(HumidityControlSetpointType, type))
                        .map((name) => `· ${name}`)
                        .join("\n");
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying supported setpoint types timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            for (const type of setpointTypes) {
                const setpointName = getEnumMemberName(HumidityControlSetpointType, type);
                // Find out the capabilities of this setpoint
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `retrieving capabilities for setpoint ${setpointName}...`,
                    direction: "outbound",
                });
                const setpointScaleSupported = await api.getSupportedScales(type);
                if (setpointScaleSupported) {
                    const logMessage = `received supported scales for setpoint ${setpointName}: 
${setpointScaleSupported
                        .map((t) => `\n· ${t.key} ${t.unit} - ${t.label}`)
                        .join("")}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                    const scaleValue = HumidityControlSetpointCCValues
                        .setpointScale(type);
                    const states = {};
                    for (const scale of setpointScaleSupported) {
                        if (scale.unit)
                            states[scale.key] = scale.unit;
                    }
                    this.setMetadata(ctx, scaleValue, {
                        ...scaleValue.meta,
                        states,
                    });
                }
                const setpointCaps = await api.getCapabilities(type);
                if (setpointCaps) {
                    const minValueUnit = getSetpointUnit(setpointCaps.minValueScale);
                    const maxValueUnit = getSetpointUnit(setpointCaps.maxValueScale);
                    const logMessage = `received capabilities for setpoint ${setpointName}:
minimum value: ${setpointCaps.minValue} ${minValueUnit}
maximum value: ${setpointCaps.maxValue} ${maxValueUnit}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
            // Query the current value for all setpoint types
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Humidity Control Setpoint"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const setpointTypes = this.getValue(ctx, HumidityControlSetpointCCValues.supportedSetpointTypes) ?? [];
            // Query each setpoint's current value
            for (const type of setpointTypes) {
                const setpointName = getEnumMemberName(HumidityControlSetpointType, type);
                // Every time, query the current value
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying current value of setpoint ${setpointName}...`,
                    direction: "outbound",
                });
                const setpoint = await api.get(type);
                if (setpoint) {
                    const logMessage = `received current value of setpoint ${setpointName}: ${setpoint.value} ${getScale(setpoint.scale).unit ?? ""}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
    };
    return HumidityControlSetpointCC = _classThis;
})();
export { HumidityControlSetpointCC };
let HumidityControlSetpointCCSet = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
            this.value = options.value;
            this.scale = options.scale;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new HumidityControlSetpointCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        setpointType;
        value;
        scale;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.setpointType & 0b1111]),
                encodeFloatWithScale(this.value, this.scale),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const scale = getScale(this.scale);
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(HumidityControlSetpointType, this.setpointType),
                    value: `${this.value} ${scale.unit}`,
                },
            };
        }
    };
    return HumidityControlSetpointCCSet = _classThis;
})();
export { HumidityControlSetpointCCSet };
let HumidityControlSetpointCCReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.type = options.type;
            this.value = options.value;
            this.scale = options.scale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const type = raw.payload[0] & 0b1111;
            // Setpoint type 0 is not defined in the spec, prevent devices from using it.
            if (type === 0) {
                // Not supported
                return new this({
                    nodeId: ctx.sourceNodeId,
                    type,
                    value: 0,
                    scale: 0,
                });
            }
            // parseFloatWithScale does its own validation
            const { value, scale } = parseFloatWithScale(raw.payload.subarray(1));
            return new this({
                nodeId: ctx.sourceNodeId,
                type,
                value,
                scale,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const scale = getScale(this.scale);
            const setpointValue = HumidityControlSetpointCCValues.setpoint(this.type);
            const existingMetadata = this.getMetadata(ctx, setpointValue);
            // Update the metadata when it is missing or the unit has changed
            if (existingMetadata?.unit !== scale.unit) {
                this.setMetadata(ctx, setpointValue, {
                    ...(existingMetadata ?? setpointValue.meta),
                    unit: scale.unit,
                });
            }
            this.setValue(ctx, setpointValue, this.value);
            // Remember the device-preferred setpoint scale so it can be used in SET commands
            this.setValue(ctx, HumidityControlSetpointCCValues.setpointScale(this.type), this.scale);
            return true;
        }
        type;
        scale;
        value;
        toLogEntry(ctx) {
            const scale = getScale(this.scale);
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(HumidityControlSetpointType, this.type),
                    value: `${this.value} ${scale.unit}`,
                },
            };
        }
    };
    return HumidityControlSetpointCCReport = _classThis;
})();
export { HumidityControlSetpointCCReport };
function testResponseForHumidityControlSetpointGet(sent, received) {
    // We expect a Humidity Control Setpoint Report that matches the requested setpoint type
    return received.type === sent.setpointType;
}
let HumidityControlSetpointCCGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.Get), expectedCCResponse(HumidityControlSetpointCCReport, testResponseForHumidityControlSetpointGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new HumidityControlSetpointCCGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        setpointType;
        serialize(ctx) {
            this.payload = Bytes.from([this.setpointType & 0b1111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(HumidityControlSetpointType, this.setpointType),
                },
            };
        }
    };
    return HumidityControlSetpointCCGet = _classThis;
})();
export { HumidityControlSetpointCCGet };
let HumidityControlSetpointCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.SupportedReport), ccValueProperty("supportedSetpointTypes", HumidityControlSetpointCCValues.supportedSetpointTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedSetpointTypes = options.supportedSetpointTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const supportedSetpointTypes = parseBitMask(raw.payload, HumidityControlSetpointType["N/A"]);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedSetpointTypes,
            });
        }
        supportedSetpointTypes;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported setpoint types": this.supportedSetpointTypes
                        .map((t) => `\n· ${getEnumMemberName(HumidityControlSetpointType, t)}`)
                        .join(""),
                },
            };
        }
    };
    return HumidityControlSetpointCCSupportedReport = _classThis;
})();
export { HumidityControlSetpointCCSupportedReport };
let HumidityControlSetpointCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.SupportedGet), expectedCCResponse(HumidityControlSetpointCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return HumidityControlSetpointCCSupportedGet = _classThis;
})();
export { HumidityControlSetpointCCSupportedGet };
let HumidityControlSetpointCCScaleSupportedReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.ScaleSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCScaleSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCScaleSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedScales = options.supportedScales;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const supportedScales = parseBitMask(Bytes.from([raw.payload[0] & 0b1111]), 0);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedScales,
            });
        }
        supportedScales;
        toLogEntry(ctx) {
            const supportedScales = this.supportedScales.map((scale) => getScale(scale));
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "scale supported": supportedScales
                        .map((t) => `\n· ${t.key} ${t.unit} - ${t.label}`)
                        .join(""),
                },
            };
        }
    };
    return HumidityControlSetpointCCScaleSupportedReport = _classThis;
})();
export { HumidityControlSetpointCCScaleSupportedReport };
let HumidityControlSetpointCCScaleSupportedGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.ScaleSupportedGet), expectedCCResponse(HumidityControlSetpointCCScaleSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCScaleSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCScaleSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new HumidityControlSetpointCCScaleSupportedGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        setpointType;
        serialize(ctx) {
            this.payload = Bytes.from([this.setpointType & 0b1111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(HumidityControlSetpointType, this.setpointType),
                },
            };
        }
    };
    return HumidityControlSetpointCCScaleSupportedGet = _classThis;
})();
export { HumidityControlSetpointCCScaleSupportedGet };
let HumidityControlSetpointCCCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.CapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.minValue = options.minValue;
            this.maxValue = options.maxValue;
            this.minValueScale = options.minValueScale;
            this.maxValueScale = options.maxValueScale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const type = raw.payload[0] & 0b1111;
            // parseFloatWithScale does its own validation
            const { value: minValue, scale: minValueScale, bytesRead, } = parseFloatWithScale(raw.payload.subarray(1));
            const { value: maxValue, scale: maxValueScale } = parseFloatWithScale(raw.payload.subarray(1 + bytesRead));
            return new this({
                nodeId: ctx.sourceNodeId,
                type,
                minValue,
                minValueScale,
                maxValue,
                maxValueScale,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Predefine the metadata
            const setpointValue = HumidityControlSetpointCCValues.setpoint(this.type);
            this.setMetadata(ctx, setpointValue, {
                ...setpointValue.meta,
                min: this.minValue,
                max: this.maxValue,
                unit: getSetpointUnit(this.minValueScale)
                    || getSetpointUnit(this.maxValueScale),
            });
            return true;
        }
        type;
        minValue;
        maxValue;
        minValueScale;
        maxValueScale;
        toLogEntry(ctx) {
            const minValueScale = getScale(this.minValueScale);
            const maxValueScale = getScale(this.maxValueScale);
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(HumidityControlSetpointType, this.type),
                    "min value": `${this.minValue} ${minValueScale.unit}`,
                    "max value": `${this.maxValue} ${maxValueScale.unit}`,
                },
            };
        }
    };
    return HumidityControlSetpointCCCapabilitiesReport = _classThis;
})();
export { HumidityControlSetpointCCCapabilitiesReport };
let HumidityControlSetpointCCCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlSetpointCommand.CapabilitiesGet), expectedCCResponse(HumidityControlSetpointCCCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlSetpointCC;
    var HumidityControlSetpointCCCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlSetpointCCCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new HumidityControlSetpointCCCapabilitiesGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        setpointType;
        serialize(ctx) {
            this.payload = Bytes.from([this.setpointType & 0b1111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(HumidityControlSetpointType, this.setpointType),
                },
            };
        }
    };
    return HumidityControlSetpointCCCapabilitiesGet = _classThis;
})();
export { HumidityControlSetpointCCCapabilitiesGet };
//# sourceMappingURL=HumidityControlSetpointCC.js.map