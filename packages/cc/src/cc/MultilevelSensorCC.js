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
import { CommandClasses, MessagePriority, ValueMetadata, encodeBitMask, encodeFloatWithScale, getSensor, getSensorName, getSensorScale, getUnknownScale, parseBitMask, parseFloatWithScale, timespan, validatePayload, } from "@zwave-js/core";
import { Bytes, num2hex } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, throwUnsupportedProperty, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { MultilevelSensorCommand, } from "../lib/_Types.js";
export const MultilevelSensorCCValues = V.defineCCValues(CommandClasses["Multilevel Sensor"], {
    ...V.staticProperty("supportedSensorTypes", undefined, {
        internal: true,
    }),
    ...V.dynamicPropertyAndKeyWithName("supportedScales", "supportedScales", (sensorType) => sensorType, ({ property, propertyKey }) => property === "supportedScales"
        && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyWithName("value", 
    // This should have been the sensor type, but it is too late to change now
    // Maybe we can migrate this without breaking in the future
    (sensorTypeName) => sensorTypeName, ({ property, propertyKey }) => typeof property === "string"
        && property !== "supportedSensorTypes"
        && property !== "supportedScales"
        && propertyKey == undefined, (sensorTypeName) => ({
        // Just the base metadata, to be extended using a config manager
        ...ValueMetadata.ReadOnlyNumber,
        label: sensorTypeName,
    })),
});
/**
 * Determine the scale to use to query a sensor reading. Uses the user-preferred scale if given,
 * followed by the most recently used scale, otherwile falls back to the first supported one.
 */
function getPreferredSensorScale(ctx, nodeId, endpointIndex, sensorType, supportedScales) {
    const preferences = ctx.getUserPreferences();
    const sensor = getSensor(sensorType);
    // If the sensor type is unknown, we have no default. Use the user-provided scale or 0
    if (!sensor) {
        const preferred = preferences?.scales[sensorType];
        // We cannot look up strings for unknown sensor types, so this must be a number or we use the fallback
        if (typeof preferred !== "number")
            return 0;
        return preferred;
    }
    // Look up the preference for the scale
    let preferred;
    // Named scales apply to multiple sensor types. To be able to override the scale for single types
    // we need to look at the preferences by sensor type first
    preferred = preferences?.scales[sensorType];
    // If the scale is named, we can then try to use the named preference
    const scaleGroupName = sensor.scaleGroupName;
    if (preferred == undefined && scaleGroupName) {
        preferred = preferences?.scales[scaleGroupName];
    }
    // Then attempt reading the scale from the corresponding value
    if (preferred == undefined) {
        const sensorName = getSensorName(sensorType);
        const sensorValue = MultilevelSensorCCValues.value(sensorName);
        const metadata = ctx
            .tryGetValueDB(nodeId)
            ?.getMetadata(sensorValue.endpoint(endpointIndex));
        const scale = metadata?.ccSpecific?.scale;
        if (typeof scale === "number" && supportedScales.includes(scale)) {
            preferred = scale;
            ctx.logNode(nodeId, {
                endpoint: endpointIndex,
                message: `No scale preference for sensor type ${sensorType}, using the last-used scale ${preferred}`,
            });
        }
    }
    // Then fall back to the first supported scale
    if (preferred == undefined) {
        preferred = supportedScales[0] ?? 0;
        ctx.logNode(nodeId, {
            endpoint: endpointIndex,
            message: `No scale preference for sensor type ${sensorType}, using the first supported scale ${preferred}`,
        });
        return preferred;
    }
    // If the scale name or unit was given, try to look it up
    if (typeof preferred === "string") {
        for (const [key, scale] of Object.entries(sensor.scales)) {
            if (scale.label === preferred || scale.unit === preferred) {
                preferred = parseInt(key, 10);
                break;
            }
        }
    }
    if (typeof preferred === "string") {
        // Looking up failed
        ctx.logNode(nodeId, {
            endpoint: endpointIndex,
            message: `Preferred scale "${preferred}" for sensor type ${sensorType} not found, using the first supported scale ${supportedScales[0] ?? 0}`,
        });
        return supportedScales[0] ?? 0;
    }
    // We have a numeric scale key, nothing to look up. Make sure it is supported though
    if (!supportedScales.length) {
        // No info about supported scales, just use the preferred one
        return preferred;
    }
    else if (!supportedScales.includes(preferred)) {
        ctx.logNode(nodeId, {
            endpoint: endpointIndex,
            message: `Preferred scale ${preferred} not supported for sensor type ${sensorType}, using the first supported scale`,
        });
        return supportedScales[0];
    }
    else {
        return preferred;
    }
}
// @noSetValueAPI This CC is read-only
let MultilevelSensorCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Multilevel Sensor"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _getSupportedScales_decorators;
    let _sendReport_decorators;
    var MultilevelSensorCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs()];
            _getSupportedScales_decorators = [validateArgs()];
            _sendReport_decorators = [validateArgs()];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSupportedScales_decorators, { kind: "method", name: "getSupportedScales", static: false, private: false, access: { has: obj => "getSupportedScales" in obj, get: obj => obj.getSupportedScales }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case MultilevelSensorCommand.Get:
                case MultilevelSensorCommand.Report:
                    return true; // This is mandatory
                case MultilevelSensorCommand.GetSupportedSensor:
                case MultilevelSensorCommand.GetSupportedScale:
                    return this.version >= 5;
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                // Look up the necessary information
                const valueId = {
                    commandClass: CommandClasses["Multilevel Sensor"],
                    endpoint: this.endpoint.index,
                    property,
                };
                const ccSpecific = this.tryGetValueDB()?.getMetadata(valueId)
                    ?.ccSpecific;
                if (!ccSpecific) {
                    throwUnsupportedProperty(this.ccId, property);
                }
                const { sensorType, scale } = ccSpecific;
                return this.get(sensorType, scale);
            };
        }
        async get(sensorType, scale) {
            this.assertSupportsCommand(MultilevelSensorCommand, MultilevelSensorCommand.Get);
            // Figure out the preferred scale if none was given
            let preferredScale;
            if (sensorType != undefined && scale == undefined) {
                const supportedScales = this.tryGetValueDB()?.getValue({
                    commandClass: this.ccId,
                    endpoint: this.endpoint.index,
                    property: "supportedScales",
                    propertyKey: sensorType,
                }) ?? [];
                preferredScale = getPreferredSensorScale(this.host, this.endpoint.nodeId, this.endpoint.index, sensorType, supportedScales);
            }
            const cc = new MultilevelSensorCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sensorType: sensorType,
                scale: (scale ?? preferredScale),
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (!response)
                return;
            const responseScale = getSensorScale(response.type, response.scale);
            if (sensorType == undefined) {
                // Overload #1: return the full response
                return {
                    type: response.type,
                    value: response.value,
                    scale: responseScale,
                };
            }
            else if (scale == undefined) {
                // Overload #2: return value and scale
                return {
                    value: response.value,
                    scale: responseScale,
                };
            }
            else {
                // Overload #3: return only the value
                return response.value;
            }
        }
        async getSupportedSensorTypes() {
            this.assertSupportsCommand(MultilevelSensorCommand, MultilevelSensorCommand.GetSupportedSensor);
            const cc = new MultilevelSensorCCGetSupportedSensor({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedSensorTypes;
        }
        async getSupportedScales(sensorType) {
            this.assertSupportsCommand(MultilevelSensorCommand, MultilevelSensorCommand.GetSupportedScale);
            const cc = new MultilevelSensorCCGetSupportedScale({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sensorType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedScales;
        }
        async sendReport(sensorType, scale, value) {
            this.assertSupportsCommand(MultilevelSensorCommand, MultilevelSensorCommand.Report);
            const cc = new MultilevelSensorCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                type: sensorType,
                scale,
                value,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return MultilevelSensorCCAPI = _classThis;
})();
export { MultilevelSensorCCAPI };
let MultilevelSensorCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Multilevel Sensor"]), implementedVersion(11), ccValues(MultilevelSensorCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var MultilevelSensorCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Multilevel Sensor"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            if (api.version >= 5) {
                // Query the supported sensor types
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "retrieving supported sensor types...",
                    direction: "outbound",
                });
                const sensorTypes = await api.getSupportedSensorTypes();
                if (sensorTypes) {
                    const logMessage = "received supported sensor types:\n"
                        + sensorTypes
                            .map((t) => getSensorName(t))
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
                        message: "Querying supported sensor types timed out, skipping interview...",
                        level: "warn",
                    });
                    return;
                }
                // As well as the supported scales for each sensor
                for (const type of sensorTypes) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying supported scales for ${getSensorName(type)} sensor`,
                        direction: "outbound",
                    });
                    const sensorScales = await api.getSupportedScales(type);
                    if (sensorScales) {
                        const logMessage = "received supported scales:\n"
                            + sensorScales
                                .map((s) => (getSensorScale(type, s)
                                ?? getUnknownScale(s)).label)
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
                            message: "Querying supported scales timed out, skipping interview...",
                            level: "warn",
                        });
                        return;
                    }
                }
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Multilevel Sensor"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const valueDB = this.getValueDB(ctx);
            if (api.version <= 4) {
                // Sensors up to V4 only support a single value
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying current sensor reading...",
                    direction: "outbound",
                });
                const mlsResponse = await api.get();
                if (mlsResponse) {
                    const sensorScale = getSensorScale(mlsResponse.type, mlsResponse.scale.key);
                    const logMessage = `received current sensor reading:
sensor type: ${getSensorName(mlsResponse.type)}
value:       ${mlsResponse.value}${sensorScale?.unit ? ` ${sensorScale.unit}` : ""}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
            else {
                // Query all sensor values
                const sensorTypes = valueDB.getValue({
                    commandClass: this.ccId,
                    property: "supportedSensorTypes",
                    endpoint: this.endpointIndex,
                }) || [];
                for (const type of sensorTypes) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying ${getSensorName(type)} sensor reading...`,
                        direction: "outbound",
                    });
                    const value = await api.get(type);
                    if (value) {
                        const logMessage = `received current ${getSensorName(type)} sensor reading: ${value.value} ${value.scale.unit || ""}`;
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: logMessage,
                            direction: "inbound",
                        });
                    }
                }
            }
        }
        shouldRefreshValues(ctx) {
            // Poll the device when all of the supported values were last updated longer than 6 hours ago.
            // This may lead to some values not being updated, but the user may have disabled some unnecessary
            // reports to reduce traffic.
            const valueDB = ctx.tryGetValueDB(this.nodeId);
            if (!valueDB)
                return true;
            const values = this.getDefinedValueIDs(ctx).filter((v) => MultilevelSensorCCValues.value.is(v));
            return values.every((v) => {
                const lastUpdated = valueDB.getTimestamp(v);
                return (lastUpdated == undefined
                    || Date.now() - lastUpdated > timespan.hours(6));
            });
        }
        /**
         * Returns which sensor types are supported.
         * This only works AFTER the interview process
         */
        static getSupportedSensorTypesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MultilevelSensorCCValues.supportedSensorTypes.endpoint(endpoint.index));
        }
        /**
         * Returns which scales are supported for a given sensor type.
         * This only works AFTER the interview process
         */
        static getSupportedScalesCached(ctx, endpoint, sensorType) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MultilevelSensorCCValues.supportedScales(sensorType).endpoint(endpoint.index));
        }
        translatePropertyKey(ctx, property, propertyKey) {
            // TODO: check this
            if (property === "values" && typeof propertyKey === "number") {
                const sensor = getSensor(propertyKey);
                if (sensor)
                    return sensor.label;
            }
            return super.translatePropertyKey(ctx, property, propertyKey);
        }
    };
    return MultilevelSensorCC = _classThis;
})();
export { MultilevelSensorCC };
let MultilevelSensorCCReport = (() => {
    let _classDecorators = [CCCommand(MultilevelSensorCommand.Report), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSensorCC;
    var MultilevelSensorCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.value = options.value;
            this.scale = typeof options.scale === "number"
                ? options.scale
                : options.scale.key;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const type = raw.payload[0];
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
            const sensor = getSensor(this.type);
            const scale = getSensorScale(this.type, this.scale) ?? getUnknownScale(this.scale);
            // Filter out unknown sensor types and scales, unless the strict validation is disabled
            const measurementValidation = !ctx.getDeviceConfig?.(this.nodeId)?.compat?.disableStrictMeasurementValidation;
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (measurementValidation) {
                // Filter out unsupported sensor types and scales if possible
                if (ccVersion >= 5) {
                    const supportedSensorTypes = this.getValue(ctx, MultilevelSensorCCValues.supportedSensorTypes);
                    if (supportedSensorTypes?.length) {
                        validatePayload.withReason(`Unsupported sensor type ${getSensorName(this.type)} or corrupted data`)(supportedSensorTypes.includes(this.type));
                    }
                    const supportedScales = this.getValue(ctx, MultilevelSensorCCValues.supportedScales(this.type));
                    if (supportedScales?.length) {
                        validatePayload.withReason(`Unsupported scale ${scale.label} or corrupted data`)(supportedScales.includes(scale.key));
                    }
                }
                else {
                    // We support a higher CC version than the device, so any types and scales it uses should be known to us
                    // Filter out unknown ones.
                    validatePayload.withReason(`Unknown sensor type ${num2hex(this.type)} or corrupted data`)(!!sensor);
                    validatePayload.withReason(`Unknown scale ${num2hex(this.scale)} or corrupted data`)(scale.label !== getUnknownScale(this.scale).label);
                }
            }
            const sensorName = getSensorName(this.type);
            const sensorValue = MultilevelSensorCCValues.value(sensorName);
            this.setMetadata(ctx, sensorValue, {
                ...sensorValue.meta,
                unit: scale.unit,
                ccSpecific: {
                    sensorType: this.type,
                    scale: scale.key,
                },
            });
            this.setValue(ctx, sensorValue, this.value);
            return true;
        }
        type;
        scale;
        value;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.type]),
                encodeFloatWithScale(this.value, this.scale),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "sensor type": getSensorName(this.type),
                    scale: (getSensorScale(this.type, this.scale)
                        ?? getUnknownScale(this.scale)).label,
                    value: this.value,
                },
            };
        }
    };
    return MultilevelSensorCCReport = _classThis;
})();
export { MultilevelSensorCCReport };
const testResponseForMultilevelSensorGet = (sent, received) => {
    // We expect a Multilevel Sensor Report that matches the requested sensor type (if a type was requested)
    return sent.sensorType == undefined || received.type === sent.sensorType;
};
let MultilevelSensorCCGet = (() => {
    let _classDecorators = [CCCommand(MultilevelSensorCommand.Get), expectedCCResponse(MultilevelSensorCCReport, testResponseForMultilevelSensorGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSensorCC;
    var MultilevelSensorCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if ("sensorType" in options) {
                this.sensorType = options.sensorType;
                this.scale = options.scale;
            }
        }
        static from(raw, ctx) {
            if (raw.payload.length >= 2) {
                const sensorType = raw.payload[0];
                const scale = (raw.payload[1] >> 3) & 0b11;
                return new this({
                    nodeId: ctx.sourceNodeId,
                    sensorType,
                    scale,
                });
            }
            else {
                return new this({
                    nodeId: ctx.sourceNodeId,
                });
            }
        }
        sensorType;
        scale;
        serialize(ctx) {
            if (this.sensorType != undefined
                && this.scale != undefined) {
                this.payload = Bytes.from([
                    this.sensorType,
                    (this.scale & 0b11) << 3,
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message = {};
            if (this.sensorType != undefined
                && this.scale != undefined) {
                message = {
                    "sensor type": getSensorName(this.sensorType),
                    scale: (getSensorScale(this.sensorType, this.scale) ?? getUnknownScale(this.scale)).label,
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MultilevelSensorCCGet = _classThis;
})();
export { MultilevelSensorCCGet };
let MultilevelSensorCCSupportedSensorReport = (() => {
    let _classDecorators = [CCCommand(MultilevelSensorCommand.SupportedSensorReport), ccValueProperty("supportedSensorTypes", MultilevelSensorCCValues.supportedSensorTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSensorCC;
    var MultilevelSensorCCSupportedSensorReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCSupportedSensorReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedSensorTypes = options.supportedSensorTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const supportedSensorTypes = parseBitMask(raw.payload);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedSensorTypes,
            });
        }
        // TODO: Use this during interview to precreate values
        supportedSensorTypes;
        serialize(ctx) {
            this.payload = encodeBitMask(this.supportedSensorTypes);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported sensor types": this.supportedSensorTypes
                        .map((t) => `\n· ${getSensorName(t)}`)
                        .join(""),
                },
            };
        }
    };
    return MultilevelSensorCCSupportedSensorReport = _classThis;
})();
export { MultilevelSensorCCSupportedSensorReport };
let MultilevelSensorCCGetSupportedSensor = (() => {
    let _classDecorators = [CCCommand(MultilevelSensorCommand.GetSupportedSensor), expectedCCResponse(MultilevelSensorCCSupportedSensorReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSensorCC;
    var MultilevelSensorCCGetSupportedSensor = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCGetSupportedSensor = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MultilevelSensorCCGetSupportedSensor = _classThis;
})();
export { MultilevelSensorCCGetSupportedSensor };
let MultilevelSensorCCSupportedScaleReport = (() => {
    let _classDecorators = [CCCommand(MultilevelSensorCommand.SupportedScaleReport), ccValueProperty("supportedScales", MultilevelSensorCCValues.supportedScales, (self) => [self.sensorType])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSensorCC;
    var MultilevelSensorCCSupportedScaleReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCSupportedScaleReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sensorType = options.sensorType;
            this.supportedScales = options.supportedScales;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const sensorType = raw.payload[0];
            const supportedScales = parseBitMask(Bytes.from([raw.payload[1] & 0b1111]), 0);
            return new this({
                nodeId: ctx.sourceNodeId,
                sensorType,
                supportedScales,
            });
        }
        sensorType;
        supportedScales;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.sensorType]),
                encodeBitMask(this.supportedScales, 4, 0),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "sensor type": getSensorName(this.sensorType),
                    "supported scales": this.supportedScales
                        .map((s) => `\n· ${(getSensorScale(this.sensorType, s)
                        ?? getUnknownScale(s)).label}`)
                        .join(""),
                },
            };
        }
    };
    return MultilevelSensorCCSupportedScaleReport = _classThis;
})();
export { MultilevelSensorCCSupportedScaleReport };
let MultilevelSensorCCGetSupportedScale = (() => {
    let _classDecorators = [CCCommand(MultilevelSensorCommand.GetSupportedScale), expectedCCResponse(MultilevelSensorCCSupportedScaleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSensorCC;
    var MultilevelSensorCCGetSupportedScale = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSensorCCGetSupportedScale = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sensorType = options.sensorType;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const sensorType = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                sensorType,
            });
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
                    "sensor type": getSensorName(this.sensorType),
                },
            };
        }
    };
    return MultilevelSensorCCGetSupportedScale = _classThis;
})();
export { MultilevelSensorCCGetSupportedScale };
//# sourceMappingURL=MultilevelSensorCC.js.map