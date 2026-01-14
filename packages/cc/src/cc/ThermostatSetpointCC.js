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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeBitMask, encodeFloatWithScale, getNamedScale, getUnknownScale, parseBitMask, parseFloatWithScale, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ThermostatSetpointCommand, ThermostatSetpointType, } from "../lib/_Types.js";
// This array is used to map the advertised supported types (interpretation A)
// to the actual enum values
const thermostatSetpointTypeMap = [
    0x00,
    0x01,
    0x02,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
];
function getScale(scale) {
    return getNamedScale("temperature", scale)
        ?? getUnknownScale(scale);
}
function getSetpointUnit(scale) {
    return getScale(scale).unit ?? "";
}
export const ThermostatSetpointCCValues = V.defineCCValues(CommandClasses["Thermostat Setpoint"], {
    ...V.staticProperty("supportedSetpointTypes", undefined, {
        internal: true,
    }),
    ...V.dynamicPropertyAndKeyWithName("setpoint", "setpoint", (setpointType) => setpointType, ({ property, propertyKey }) => property === "setpoint" && typeof propertyKey === "number", (setpointType) => ({
        ...ValueMetadata.Number,
        label: `Setpoint (${getEnumMemberName(ThermostatSetpointType, setpointType)})`,
        ccSpecific: { setpointType },
    })),
    ...V.dynamicPropertyAndKeyWithName("setpointScale", "setpointScale", (setpointType) => setpointType, ({ property, propertyKey }) => property === "setpointScale" && typeof propertyKey === "number", undefined, { internal: true }),
});
let ThermostatSetpointCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Thermostat Setpoint"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _set_decorators;
    let _getCapabilities_decorators;
    var ThermostatSetpointCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs()];
            _set_decorators = [validateArgs()];
            _getCapabilities_decorators = [validateArgs()];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCapabilities_decorators, { kind: "method", name: "getCapabilities", static: false, private: false, access: { has: obj => "getCapabilities" in obj, get: obj => obj.getCapabilities }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ThermostatSetpointCommand.Get:
                case ThermostatSetpointCommand.SupportedGet:
                    return this.isSinglecast();
                case ThermostatSetpointCommand.Set:
                    return true; // This is mandatory
                case ThermostatSetpointCommand.CapabilitiesGet:
                    return this.version >= 3 && this.isSinglecast();
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
                // SDS14223: The Scale field value MUST be identical to the value received in the Thermostat Setpoint Report for the
                // actual Setpoint Type during the node interview. Fall back to the first scale if none is known
                const preferredScale = this.tryGetValueDB()?.getValue(ThermostatSetpointCCValues.setpointScale(propertyKey).endpoint(this.endpoint.index));
                const result = await this.set(propertyKey, value, preferredScale ?? 0);
                // Verify the current value after a delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    // TODO: Ideally this would be a short delay, but some thermostats like Remotec ZXT-600
                    // aren't able to handle the GET this quickly.
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
            this.assertSupportsCommand(ThermostatSetpointCommand, ThermostatSetpointCommand.Get);
            const cc = new ThermostatSetpointCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setpointType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (!response)
                return;
            if (response.type !== ThermostatSetpointType["N/A"]) {
                // This is a supported setpoint
                const scale = getScale(response.scale);
                return {
                    value: response.value,
                    scale,
                };
            }
        }
        async set(setpointType, value, scale) {
            this.assertSupportsCommand(ThermostatSetpointCommand, ThermostatSetpointCommand.Set);
            const cc = new ThermostatSetpointCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setpointType,
                value,
                scale,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getCapabilities(setpointType) {
            this.assertSupportsCommand(ThermostatSetpointCommand, ThermostatSetpointCommand.CapabilitiesGet);
            const cc = new ThermostatSetpointCCCapabilitiesGet({
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
        /**
         * Requests the supported setpoint types from the node. Due to inconsistencies it is NOT recommended
         * to use this method on nodes with CC versions 1 and 2. Instead rely on the information determined
         * during node interview.
         */
        async getSupportedSetpointTypes() {
            this.assertSupportsCommand(ThermostatSetpointCommand, ThermostatSetpointCommand.SupportedGet);
            const cc = new ThermostatSetpointCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedSetpointTypes;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ThermostatSetpointCCAPI = _classThis;
})();
export { ThermostatSetpointCCAPI };
let ThermostatSetpointCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Thermostat Setpoint"]), implementedVersion(3), ccValues(ThermostatSetpointCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ThermostatSetpointCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        translatePropertyKey(ctx, property, propertyKey) {
            if (property === "setpoint") {
                return getEnumMemberName(ThermostatSetpointType, propertyKey);
            }
            else {
                return super.translatePropertyKey(ctx, property, propertyKey);
            }
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Thermostat Setpoint"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            if (api.version <= 2) {
                // It has been found that early implementations of this Command Class applied two non-interoperable
                // interpretations of the bit mask advertising the support for specific Setpoint Types in the Thermostat
                // Setpoint Supported Report Command.
                // A controlling node SHOULD determine the supported Setpoint Types of a version 1 and version 2
                // supporting node by sending one Thermostat Setpoint Get Command at a time while incrementing
                // the requested Setpoint Type.
                // If the same Setpoint Type is advertised in the returned Thermostat Setpoint Report Command, the
                // controlling node MUST conclude that the actual Setpoint Type is supported.
                // If the Setpoint Type 0x00 (type N/A) is advertised in the returned Thermostat Setpoint Report
                // Command, the controlling node MUST conclude that the actual Setpoint Type is not supported.
                // The specs require us to query the list of supported setpoint types anyways, even if the response is ignored
                await api.getSupportedSetpointTypes();
                // Now scan all endpoints. Each type we received a value for gets marked as supported
                const supportedSetpointTypes = [];
                for (let type = ThermostatSetpointType.Heating; type <= ThermostatSetpointType["Full Power"]; type++) {
                    const setpointName = getEnumMemberName(ThermostatSetpointType, type);
                    // Every time, query the current value
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying current value of setpoint ${setpointName}...`,
                        direction: "outbound",
                    });
                    const setpoint = await api.get(type);
                    // If the node did not respond, assume the setpoint type is not supported
                    let logMessage;
                    if (setpoint) {
                        // Setpoint supported, remember the type
                        supportedSetpointTypes.push(type);
                        logMessage =
                            `received current value of setpoint ${setpointName}: ${setpoint.value} ${setpoint.scale.unit ?? ""}`;
                    }
                    else {
                        // We're sure about the interpretation - this should not happen
                        logMessage = `setpoint ${setpointName} is not supported`;
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
                // Remember which setpoint types are actually supported
                this.setValue(ctx, ThermostatSetpointCCValues.supportedSetpointTypes, supportedSetpointTypes);
            }
            else {
                // Versions >= 3 adhere to bitmap interpretation A, so we can rely on getSupportedSetpointTypes
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
                            .map((type) => getEnumMemberName(ThermostatSetpointType, type))
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
                    const setpointName = getEnumMemberName(ThermostatSetpointType, type);
                    // Find out the capabilities of this setpoint
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `retrieving capabilities for setpoint ${setpointName}...`,
                        direction: "outbound",
                    });
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
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Thermostat Setpoint"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const setpointTypes = this.getValue(ctx, ThermostatSetpointCCValues.supportedSetpointTypes) ?? [];
            // Query each setpoint's current value
            for (const type of setpointTypes) {
                const setpointName = getEnumMemberName(ThermostatSetpointType, type);
                // Every time, query the current value
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying current value of setpoint ${setpointName}...`,
                    direction: "outbound",
                });
                const setpoint = await api.get(type);
                if (setpoint) {
                    const logMessage = `received current value of setpoint ${setpointName}: ${setpoint.value} ${setpoint.scale.unit ?? ""}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
    };
    return ThermostatSetpointCC = _classThis;
})();
export { ThermostatSetpointCC };
let ThermostatSetpointCCSet = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
            this.value = options.value;
            this.scale = options.scale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const setpointType = raw.payload[0] & 0b1111;
            // parseFloatWithScale does its own validation
            const { value, scale } = parseFloatWithScale(raw.payload.subarray(1));
            return new this({
                nodeId: ctx.sourceNodeId,
                setpointType,
                value,
                scale,
            });
        }
        setpointType;
        value;
        scale;
        serialize(ctx) {
            // If a config file overwrites how the float should be encoded, use that information
            const override = ctx.getDeviceConfig?.(this.nodeId)
                ?.compat?.overrideFloatEncoding;
            this.payload = Bytes.concat([
                Bytes.from([this.setpointType & 0b1111]),
                encodeFloatWithScale(this.value, this.scale, override),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const scale = getScale(this.scale);
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(ThermostatSetpointType, this.setpointType),
                    value: `${this.value} ${scale.unit}`,
                },
            };
        }
    };
    return ThermostatSetpointCCSet = _classThis;
})();
export { ThermostatSetpointCCSet };
let ThermostatSetpointCCReport = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.value = options.value;
            this.scale = options.scale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const type = raw.payload[0] & 0b1111;
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
            const setpointValue = ThermostatSetpointCCValues.setpoint(this.type);
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
            this.setValue(ctx, ThermostatSetpointCCValues.setpointScale(this.type), scale.key);
            return true;
        }
        type;
        scale;
        value;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.type & 0b1111]),
                encodeFloatWithScale(this.value, this.scale),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const scale = getScale(this.scale);
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(ThermostatSetpointType, this.type),
                    value: `${this.value} ${scale.unit}`,
                },
            };
        }
    };
    return ThermostatSetpointCCReport = _classThis;
})();
export { ThermostatSetpointCCReport };
function testResponseForThermostatSetpointGet(sent, received) {
    // We expect a Thermostat Setpoint Report that matches the requested setpoint type
    return received.type === sent.setpointType;
}
let ThermostatSetpointCCGet = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.Get), expectedCCResponse(ThermostatSetpointCCReport, testResponseForThermostatSetpointGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const setpointType = raw.payload[0] & 0b1111;
            return new this({
                nodeId: ctx.sourceNodeId,
                setpointType,
            });
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
                    "setpoint type": getEnumMemberName(ThermostatSetpointType, this.setpointType),
                },
            };
        }
    };
    return ThermostatSetpointCCGet = _classThis;
})();
export { ThermostatSetpointCCGet };
let ThermostatSetpointCCCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.CapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.minValue = options.minValue;
            this.minValueScale = options.minValueScale;
            this.maxValue = options.maxValue;
            this.maxValueScale = options.maxValueScale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const type = raw.payload[0];
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
            const setpointValue = ThermostatSetpointCCValues.setpoint(this.type);
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
        serialize(ctx) {
            const min = encodeFloatWithScale(this.minValue, this.minValueScale);
            const max = encodeFloatWithScale(this.maxValue, this.maxValueScale);
            this.payload = Bytes.concat([Bytes.from([this.type]), min, max]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const minValueScale = getScale(this.minValueScale);
            const maxValueScale = getScale(this.maxValueScale);
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setpoint type": getEnumMemberName(ThermostatSetpointType, this.type),
                    "min value": `${this.minValue} ${minValueScale.unit}`,
                    "max value": `${this.maxValue} ${maxValueScale.unit}`,
                },
            };
        }
    };
    return ThermostatSetpointCCCapabilitiesReport = _classThis;
})();
export { ThermostatSetpointCCCapabilitiesReport };
let ThermostatSetpointCCCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.CapabilitiesGet), expectedCCResponse(ThermostatSetpointCCCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setpointType = options.setpointType;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const setpointType = raw.payload[0] & 0b1111;
            return new this({
                nodeId: ctx.sourceNodeId,
                setpointType,
            });
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
                    "setpoint type": getEnumMemberName(ThermostatSetpointType, this.setpointType),
                },
            };
        }
    };
    return ThermostatSetpointCCCapabilitiesGet = _classThis;
})();
export { ThermostatSetpointCCCapabilitiesGet };
let ThermostatSetpointCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.SupportedReport), ccValueProperty("supportedSetpointTypes", ThermostatSetpointCCValues.supportedSetpointTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.supportedSetpointTypes.length === 0) {
                throw new ZWaveError(`At least one setpoint type must be supported`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.supportedSetpointTypes = options.supportedSetpointTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const bitMask = raw.payload;
            const supported = parseBitMask(bitMask, ThermostatSetpointType["N/A"]);
            // We use this command only when we are sure that bitmask interpretation A is used
            // FIXME: Figure out if we can do this without the CC version
            const supportedSetpointTypes = supported.map((i) => thermostatSetpointTypeMap[i]);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedSetpointTypes,
            });
        }
        supportedSetpointTypes;
        serialize(ctx) {
            this.payload = encodeBitMask(
            // Encode as interpretation A
            this.supportedSetpointTypes
                .map((t) => thermostatSetpointTypeMap.indexOf(t))
                .filter((t) => t !== -1), undefined, ThermostatSetpointType["N/A"]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported setpoint types": this.supportedSetpointTypes
                        .map((t) => `\n· ${getEnumMemberName(ThermostatSetpointType, t)}`)
                        .join(""),
                },
            };
        }
    };
    return ThermostatSetpointCCSupportedReport = _classThis;
})();
export { ThermostatSetpointCCSupportedReport };
let ThermostatSetpointCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(ThermostatSetpointCommand.SupportedGet), expectedCCResponse(ThermostatSetpointCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetpointCC;
    var ThermostatSetpointCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetpointCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ThermostatSetpointCCSupportedGet = _classThis;
})();
export { ThermostatSetpointCCSupportedGet };
//# sourceMappingURL=ThermostatSetpointCC.js.map