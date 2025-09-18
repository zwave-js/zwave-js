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
import { CommandClasses, MessagePriority, UNKNOWN_STATE, ValueMetadata, encodeBitMask, encodeFloatWithScale, getFloatParameters, getMeter, getMeterName, getMeterScale, getUnknownMeterScale, parseBitMask, parseFloatWithScale, timespan, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, num2hex, pick, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, SET_VALUE, SET_VALUE_HOOKS, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { meterTypesToPropertyKey } from "../lib/CCValueUtils.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, getCommandClass, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { MeterCommand, RateType } from "../lib/_Types.js";
export const MeterCCValues = V.defineCCValues(CommandClasses.Meter, {
    ...V.staticProperty("type", undefined, { internal: true }),
    ...V.staticProperty("supportsReset", undefined, { internal: true }),
    ...V.staticProperty("supportedScales", undefined, { internal: true }),
    ...V.staticProperty("supportedRateTypes", undefined, {
        internal: true,
    }),
    ...V.staticPropertyWithName("resetAll", "reset", {
        ...ValueMetadata.WriteOnlyBoolean,
        label: `Reset accumulated values`,
        states: {
            true: "Reset",
        },
    }),
    ...V.dynamicPropertyAndKeyWithName("resetSingle", "reset", meterTypesToPropertyKey, ({ property, propertyKey }) => property === "reset" && typeof propertyKey === "number", (meterType, rateType, scale) => ({
        ...ValueMetadata.WriteOnlyBoolean,
        // This is only a placeholder label. A config manager is needed to
        // determine the actual label.
        label: `Reset (${rateType === RateType.Consumed
            ? "Consumption, "
            : rateType === RateType.Produced
                ? "Production, "
                : ""}${num2hex(scale)})`,
        states: {
            true: "Reset",
        },
        ccSpecific: {
            meterType,
            rateType,
            scale,
        },
    })),
    ...V.dynamicPropertyAndKeyWithName("value", "value", meterTypesToPropertyKey, ({ property, propertyKey }) => property === "value" && typeof propertyKey === "number", (meterType, rateType, scale) => ({
        ...ValueMetadata.ReadOnlyNumber,
        // Label and unit can only be determined with a config manager
        ccSpecific: {
            meterType,
            rateType,
            scale,
        },
    })),
});
function splitPropertyKey(key) {
    return {
        rateType: key & 0xff,
        scale: (key >>> 8) & 0xff,
        meterType: key >>> 16,
    };
}
function getValueLabel(meterType, scale, rateType, suffix) {
    let ret = getMeterName(meterType);
    const scaleLabel = (getMeterScale(meterType, scale) ?? getUnknownMeterScale(scale)).label;
    switch (rateType) {
        case RateType.Consumed:
            ret += ` Consumption [${scaleLabel}]`;
            break;
        case RateType.Produced:
            ret += ` Production [${scaleLabel}]`;
            break;
        default:
            ret += ` [${scaleLabel}]`;
    }
    if (suffix) {
        ret += ` (${suffix})`;
    }
    return ret;
}
function parseMeterValueAndInfo(data, offset) {
    validatePayload(data.length >= offset + 1);
    const type = data[offset] & 0b0_00_11111;
    const rateType = (data[offset] & 0b0_11_00000) >>> 5;
    const scale1Bit2 = (data[offset] & 0b1_00_00000) >>> 7;
    const { scale: scale1Bits10, value, bytesRead, } = parseFloatWithScale(data.subarray(offset + 1));
    return {
        type,
        rateType,
        // The scale is composed of two fields
        scale1: (scale1Bit2 << 2) | scale1Bits10,
        value,
        // We've read one byte more than the float contains
        bytesRead: bytesRead + 1,
    };
}
function encodeMeterValueAndInfo(type, rateType, scale, value) {
    // We need at least 2 bytes
    const scale1 = scale >= 7 ? 7 : scale & 0b111;
    const scale1Bits10 = scale1 & 0b11;
    const scale1Bit2 = scale1 >>> 2;
    const scale2 = scale >= 7 ? scale - 7 : undefined;
    const typeByte = (type & 0b0_00_11111)
        | ((rateType & 0b11) << 5)
        | (scale1Bit2 << 7);
    const floatParams = getFloatParameters(value);
    const valueBytes = encodeFloatWithScale(value, scale1Bits10, floatParams);
    return {
        data: Bytes.concat([Bytes.from([typeByte]), valueBytes]),
        floatParams: pick(floatParams, ["precision", "size"]),
        scale2,
    };
}
function parseScale(scale1, data, scale2Offset) {
    if (scale1 === 7) {
        validatePayload(data.length >= scale2Offset + 1);
        const scale2 = data[scale2Offset];
        return scale1 + scale2;
    }
    else {
        return scale1;
    }
}
export function isAccumulatedValue(meterType, scale) {
    // FIXME: We should probably move the meter definitions into code
    switch (meterType) {
        case 0x01: // Electric
            return (
            // kVarh
            // Pulse count
            scale === 0x00 // kWh
                || scale === 0x01 // kVAh
                || scale === 0x03
                || scale === 0x08);
        case 0x02: // Gas
            return (
            // Pulse count
            // ft³
            scale === 0x00 // m³
                || scale === 0x01
                || scale === 0x03);
        case 0x03: // Water
            return (
            // Pulse count
            // US gallons
            scale === 0x00 // m³
                || scale === 0x01 // ft³
                || scale === 0x02
                || scale === 0x03);
        case 0x04: // Heating
            return scale === 0x00; // kWh
        case 0x05: // Cooling
            return scale === 0x00; // kWh
    }
    return false;
}
let MeterCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Meter)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _sendReport_decorators;
    let _getAll_decorators;
    let _sendSupportedReport_decorators;
    let _reset_decorators;
    var MeterCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAll_decorators, { kind: "method", name: "getAll", static: false, private: false, access: { has: obj => "getAll" in obj, get: obj => obj.getAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendSupportedReport_decorators, { kind: "method", name: "sendSupportedReport", static: false, private: false, access: { has: obj => "sendSupportedReport" in obj, get: obj => obj.sendSupportedReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reset_decorators, { kind: "method", name: "reset", static: false, private: false, access: { has: obj => "reset" in obj, get: obj => obj.reset }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case MeterCommand.Get:
                case MeterCommand.Report:
                    return true; // This is mandatory
                case MeterCommand.SupportedGet:
                case MeterCommand.SupportedReport:
                    return this.version >= 2;
                case MeterCommand.Reset: {
                    const ret = this.tryGetValueDB()?.getValue({
                        commandClass: getCommandClass(this),
                        endpoint: this.endpoint.index,
                        property: "supportsReset",
                    });
                    return ret === true;
                }
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "value":
                    case "previousValue":
                    case "deltaTime": {
                        if (propertyKey == undefined) {
                            throwMissingPropertyKey(this.ccId, property);
                        }
                        else if (typeof propertyKey !== "number") {
                            throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                        }
                        const { rateType, scale } = splitPropertyKey(propertyKey);
                        return (await this.get({
                            rateType,
                            scale,
                        }))?.[property];
                    }
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async get(options) {
            this.assertSupportsCommand(MeterCommand, MeterCommand.Get);
            const cc = new MeterCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    type: response.type,
                    scale: getMeterScale(response.type, response.scale)
                        ?? getUnknownMeterScale(response.scale),
                    ...pick(response, [
                        "value",
                        "previousValue",
                        "rateType",
                        "deltaTime",
                    ]),
                };
            }
        }
        async sendReport(options) {
            this.assertSupportsCommand(MeterCommand, MeterCommand.Report);
            const cc = new MeterCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getAll(accumulatedOnly = false) {
            const valueDB = this.tryGetValueDB();
            if (this.version >= 2) {
                const meterType = valueDB?.getValue(MeterCCValues.type.endpoint(this.endpoint.index));
                const supportedScales = valueDB?.getValue(MeterCCValues.supportedScales.endpoint(this.endpoint.index)) ?? [];
                const supportedRateTypes = valueDB?.getValue(MeterCCValues.supportedRateTypes.endpoint(this.endpoint.index)) ?? [];
                const rateTypes = supportedRateTypes.length
                    ? supportedRateTypes
                    : [undefined];
                const ret = [];
                for (const rateType of rateTypes) {
                    for (const scale of supportedScales) {
                        // Skip non-accumulated values if requested
                        if (accumulatedOnly
                            && meterType != undefined
                            && !isAccumulatedValue(meterType, scale)) {
                            continue;
                        }
                        const response = await this.get({
                            scale,
                            rateType,
                        });
                        if (response)
                            ret.push(response);
                    }
                }
                return ret;
            }
            else {
                const response = await this.get();
                return response ? [response] : [];
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupported() {
            this.assertSupportsCommand(MeterCommand, MeterCommand.SupportedGet);
            const cc = new MeterCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "type",
                    "supportsReset",
                    "supportedScales",
                    "supportedRateTypes",
                ]);
            }
        }
        async sendSupportedReport(options) {
            this.assertSupportsCommand(MeterCommand, MeterCommand.SupportedReport);
            const cc = new MeterCCSupportedReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async reset(options) {
            this.assertSupportsCommand(MeterCommand, MeterCommand.Reset);
            const cc = new MeterCCReset({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_get_decorators = [validateArgs()], _sendReport_decorators = [validateArgs()], _getAll_decorators = [validateArgs()], _sendSupportedReport_decorators = [validateArgs()], _reset_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property, propertyKey }, value) {
                if (property !== "reset") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                else if (propertyKey != undefined
                    && typeof propertyKey !== "number") {
                    throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                }
                else if (value !== true) {
                    throwWrongValueType(this.ccId, property, "true", value === false ? "false" : typeof value);
                }
                if (typeof propertyKey === "number") {
                    const { meterType, scale, rateType } = splitPropertyKey(propertyKey);
                    return this.reset({
                        type: meterType,
                        scale,
                        rateType,
                        targetValue: 0,
                    });
                }
                else {
                    return this.reset();
                }
                return undefined;
            };
        }
        [SET_VALUE_HOOKS] = (__runInitializers(this, _instanceExtraInitializers), ({ property, propertyKey }, _value, _options) => {
            if (property !== "reset")
                return;
            if (typeof propertyKey === "number") {
                // Reset single
                const { meterType, rateType, scale } = splitPropertyKey(propertyKey);
                const readingValueId = MeterCCValues.value(meterType, rateType, scale).endpoint(this.endpoint.index);
                return {
                    optimisticallyUpdateRelatedValues: (supervisedAndSuccessful) => {
                        if (!supervisedAndSuccessful)
                            return;
                        // After resetting a single reading with supervision, store zero
                        // in the corresponding value
                        const valueDB = this.tryGetValueDB();
                        if (!valueDB)
                            return;
                        if (isAccumulatedValue(meterType, scale)) {
                            valueDB.setValue({
                                commandClass: this.ccId,
                                endpoint: this.endpoint.index,
                                property,
                                propertyKey,
                            }, 0);
                        }
                    },
                    verifyChanges: () => {
                        this.schedulePoll(readingValueId, 0, { transition: "fast" });
                    },
                };
            }
            else {
                // Reset all
                const valueDB = this.tryGetValueDB();
                if (!valueDB)
                    return;
                const accumulatedValues = valueDB.findValues((vid) => vid.commandClass === this.ccId
                    && vid.endpoint === this.endpoint.index
                    && MeterCCValues.value.is(vid)).filter(({ propertyKey }) => {
                    if (typeof propertyKey !== "number")
                        return false;
                    const { meterType, scale } = splitPropertyKey(propertyKey);
                    return isAccumulatedValue(meterType, scale);
                });
                return {
                    optimisticallyUpdateRelatedValues: (supervisedAndSuccessful) => {
                        if (!supervisedAndSuccessful)
                            return;
                        // After setting the reset all value with supervision,
                        // reset all accumulated values, since we know they are now zero.
                        for (const value of accumulatedValues) {
                            valueDB.setValue(value, 0);
                        }
                    },
                    verifyChanges: () => {
                        // Poll all accumulated values, unless they were updated by the device
                        for (const valueID of accumulatedValues) {
                            this.schedulePoll(valueID, 0, { transition: "fast" });
                        }
                    },
                };
            }
        });
    };
    return MeterCCAPI = _classThis;
})();
export { MeterCCAPI };
let MeterCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Meter), implementedVersion(6), ccValues(MeterCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var MeterCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Meter, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            if (api.version >= 2) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying meter support...",
                    direction: "outbound",
                });
                const suppResp = await api.getSupported();
                if (suppResp) {
                    const logMessage = `received meter support:
type:                 ${getMeterName(suppResp.type)}
supported scales:     ${suppResp.supportedScales
                        .map((s) => (getMeterScale(suppResp.type, s)
                        ?? getUnknownMeterScale(s)).label)
                        .map((label) => `\n· ${label}`)
                        .join("")}
supported rate types: ${suppResp.supportedRateTypes
                        .map((rt) => getEnumMemberName(RateType, rt))
                        .map((label) => `\n· ${label}`)
                        .join("")}
supports reset:       ${suppResp.supportsReset}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
                else {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "Querying meter support timed out, skipping interview...",
                        level: "warn",
                    });
                    return;
                }
            }
            // Query current meter values
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Meter, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            if (api.version === 1) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying default meter value...`,
                    direction: "outbound",
                });
                await api.get();
            }
            else {
                const type = this.getValue(ctx, MeterCCValues.type)
                    ?? 0;
                const supportedScales = this.getValue(ctx, MeterCCValues.supportedScales) ?? [];
                const supportedRateTypes = this.getValue(ctx, MeterCCValues.supportedRateTypes) ?? [];
                const rateTypes = supportedRateTypes.length
                    ? supportedRateTypes
                    : [undefined];
                for (const rateType of rateTypes) {
                    for (const scale of supportedScales) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `querying meter value (type = ${getMeterName(type)}, scale = ${(getMeterScale(type, scale)
                                ?? getUnknownMeterScale(scale)).label}${rateType != undefined
                                ? `, rate type = ${getEnumMemberName(RateType, rateType)}`
                                : ""})...`,
                            direction: "outbound",
                        });
                        await api.get({ scale, rateType });
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
            const values = this.getDefinedValueIDs(ctx).filter((v) => MeterCCValues.value.is(v));
            return values.every((v) => {
                const lastUpdated = valueDB.getTimestamp(v);
                return (lastUpdated == undefined
                    || Date.now() - lastUpdated > timespan.hours(6));
            });
        }
        /**
         * Returns which type this meter has.
         * This only works AFTER the interview process
         */
        static getMeterTypeCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MeterCCValues.type.endpoint(endpoint.index));
        }
        /**
         * Returns which scales are supported by this meter.
         * This only works AFTER the interview process
         */
        static getSupportedScalesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MeterCCValues.supportedScales.endpoint(endpoint.index));
        }
        /**
         * Returns whether reset is supported by this meter.
         * This only works AFTER the interview process
         */
        static supportsResetCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MeterCCValues.supportsReset.endpoint(endpoint.index));
        }
        /**
         * Returns which rate types are supported by this meter.
         * This only works AFTER the interview process
         */
        static getSupportedRateTypesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MeterCCValues.supportedRateTypes.endpoint(endpoint.index));
        }
        translatePropertyKey(ctx, property, propertyKey) {
            if (property === "value" && typeof propertyKey === "number") {
                const { meterType, rateType, scale } = splitPropertyKey(propertyKey);
                let ret;
                if (meterType !== 0) {
                    ret = `${getMeterName(meterType)}_${(getMeterScale(meterType, scale)
                        ?? getUnknownMeterScale(scale)).label}`;
                }
                else {
                    ret = "default";
                }
                if (rateType !== RateType.Unspecified) {
                    ret += "_" + getEnumMemberName(RateType, rateType);
                }
                return ret;
            }
            else if (property === "reset" && typeof propertyKey === "number") {
                return getMeterName(propertyKey);
            }
            return super.translatePropertyKey(ctx, property, propertyKey);
        }
    };
    return MeterCC = _classThis;
})();
export { MeterCC };
let MeterCCReport = (() => {
    let _classDecorators = [CCCommand(MeterCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MeterCC;
    var MeterCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.scale = options.scale;
            this.value = options.value;
            this.previousValue = options.previousValue;
            this.rateType = options.rateType ?? RateType.Unspecified;
            this.deltaTime = options.deltaTime ?? UNKNOWN_STATE;
        }
        static from(raw, ctx) {
            const { type, rateType, scale1, value, bytesRead } = parseMeterValueAndInfo(raw.payload, 0);
            let offset = bytesRead;
            const floatSize = bytesRead - 2;
            let deltaTime;
            let previousValue;
            if (raw.payload.length >= offset + 2) {
                deltaTime = raw.payload.readUInt16BE(offset);
                offset += 2;
                if (deltaTime === 0xffff) {
                    deltaTime = UNKNOWN_STATE;
                }
                if (
                // Previous value is included only if delta time is not 0
                deltaTime !== 0
                    && raw.payload.length >= offset + floatSize) {
                    const { value: prevValue } = parseFloatWithScale(
                    // This float is split in the payload
                    Bytes.concat([
                        Bytes.from([raw.payload[1]]),
                        raw.payload.subarray(offset),
                    ]));
                    offset += floatSize;
                    previousValue = prevValue;
                }
            }
            else {
                // 0 means that no previous value is included
                deltaTime = 0;
            }
            const scale = parseScale(scale1, raw.payload, offset);
            return new this({
                nodeId: ctx.sourceNodeId,
                type,
                rateType,
                value,
                deltaTime,
                previousValue,
                scale,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const ccVersion = getEffectiveCCVersion(ctx, this);
            const meter = getMeter(this.type);
            const scale = getMeterScale(this.type, this.scale)
                ?? getUnknownMeterScale(this.scale);
            // Filter out unknown meter types and scales, unless the strict validation is disabled
            const measurementValidation = !ctx.getDeviceConfig?.(this.nodeId)?.compat?.disableStrictMeasurementValidation;
            if (measurementValidation) {
                validatePayload.withReason(`Unknown meter type ${num2hex(this.type)} or corrupted data`)(!!meter);
                validatePayload.withReason(`Unknown meter scale ${num2hex(this.scale)} or corrupted data`)(scale.label !== getUnknownMeterScale(this.scale).label);
                // Filter out unsupported meter types, scales and rate types if possible
                if (ccVersion >= 2) {
                    const expectedType = this.getValue(ctx, MeterCCValues.type);
                    if (expectedType != undefined) {
                        validatePayload.withReason("Unexpected meter type or corrupted data")(this.type === expectedType);
                    }
                    const supportedScales = this.getValue(ctx, MeterCCValues.supportedScales);
                    if (supportedScales?.length) {
                        validatePayload.withReason(`Unsupported meter scale ${scale.label} or corrupted data`)(supportedScales.includes(this.scale));
                    }
                    const supportedRateTypes = this.getValue(ctx, MeterCCValues.supportedRateTypes);
                    if (supportedRateTypes?.length) {
                        validatePayload.withReason(`Unsupported rate type ${getEnumMemberName(RateType, this.rateType)} or corrupted data`)(supportedRateTypes.includes(this.rateType));
                    }
                }
            }
            const valueValue = MeterCCValues.value(this.type, this.rateType, this.scale);
            this.setMetadata(ctx, valueValue, {
                ...valueValue.meta,
                label: getValueLabel(this.type, this.scale, this.rateType),
                unit: scale.unit,
                ccSpecific: {
                    meterType: this.type,
                    scale: this.scale,
                    rateType: this.rateType,
                },
            });
            this.setValue(ctx, valueValue, this.value);
            return true;
        }
        type;
        scale;
        value;
        previousValue;
        rateType;
        deltaTime;
        serialize(ctx) {
            const { data: typeAndValue, floatParams, scale2 } = encodeMeterValueAndInfo(this.type, this.rateType, this.scale, this.value);
            const deltaTime = this.deltaTime ?? 0xffff;
            const deltaTimeBytes = new Bytes(2);
            deltaTimeBytes.writeUInt16BE(deltaTime, 0);
            this.payload = Bytes.concat([
                typeAndValue,
                deltaTimeBytes,
            ]);
            if (this.deltaTime !== 0 && this.previousValue != undefined) {
                // Encode the float, but only keep the value bytes
                const prevValueBytes = encodeFloatWithScale(this.previousValue, 0, // we discard the scale anyways
                floatParams).subarray(1);
                this.payload = Bytes.concat([
                    this.payload,
                    prevValueBytes,
                ]);
            }
            if (scale2 != undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([scale2]),
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const scale = getMeterScale(this.type, this.scale)
                ?? getUnknownMeterScale(this.scale);
            const message = {
                "meter type": getMeterName(this.type),
                scale: scale.label,
                "rate type": getEnumMemberName(RateType, this.rateType),
                value: this.value,
            };
            if (this.deltaTime !== UNKNOWN_STATE) {
                message["time delta"] = `${this.deltaTime} seconds`;
            }
            if (this.previousValue != undefined) {
                message["prev. value"] = this.previousValue;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MeterCCReport = _classThis;
})();
export { MeterCCReport };
function testResponseForMeterGet(sent, received) {
    // We expect a Meter Report that matches the requested scale and rate type
    // (if they were requested)
    return ((sent.scale == undefined || sent.scale === received.scale)
        && (sent.rateType == undefined || sent.rateType == received.rateType));
}
let MeterCCGet = (() => {
    let _classDecorators = [CCCommand(MeterCommand.Get), expectedCCResponse(MeterCCReport, testResponseForMeterGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MeterCC;
    var MeterCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.rateType = options.rateType;
            this.scale = options.scale;
        }
        static from(raw, ctx) {
            let rateType;
            let scale;
            if (raw.payload.length >= 1) {
                rateType = (raw.payload[0] & 0b11_000_000) >>> 6;
                scale = (raw.payload[0] & 0b00_111_000) >>> 3;
                if (scale === 7) {
                    validatePayload(raw.payload.length >= 2);
                    scale += raw.payload[1];
                }
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                rateType,
                scale,
            });
        }
        rateType;
        scale;
        serialize(ctx) {
            let scale1;
            let scale2;
            let bufferLength = 0;
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (this.scale == undefined) {
                scale1 = 0;
            }
            else if (ccVersion >= 4 && this.scale >= 7) {
                scale1 = 7;
                scale2 = this.scale >>> 3;
                bufferLength = 2;
            }
            else if (ccVersion >= 3) {
                scale1 = this.scale & 0b111;
                bufferLength = 1;
            }
            else if (ccVersion >= 2) {
                scale1 = this.scale & 0b11;
                bufferLength = 1;
            }
            else {
                scale1 = 0;
            }
            let rateTypeFlags = 0;
            if (ccVersion >= 4 && this.rateType != undefined) {
                rateTypeFlags = this.rateType & 0b11;
                bufferLength = Math.max(bufferLength, 1);
            }
            this.payload = Bytes.alloc(bufferLength, 0);
            this.payload[0] = (rateTypeFlags << 6) | (scale1 << 3);
            if (scale2)
                this.payload[1] = scale2;
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            if (this.rateType != undefined) {
                message["rate type"] = getEnumMemberName(RateType, this.rateType);
            }
            if (this.scale != undefined) {
                if (ctx) {
                    // Try to lookup the meter type to translate the scale
                    const type = this.getValue(ctx, MeterCCValues.type);
                    if (type != undefined) {
                        message.scale = (getMeterScale(type, this.scale)
                            ?? getUnknownMeterScale(this.scale)).label;
                    }
                }
                else {
                    message.scale = this.scale;
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MeterCCGet = _classThis;
})();
export { MeterCCGet };
let MeterCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(MeterCommand.SupportedReport), ccValueProperty("type", MeterCCValues.type), ccValueProperty("supportsReset", MeterCCValues.supportsReset), ccValueProperty("supportedScales", MeterCCValues.supportedScales), ccValueProperty("supportedRateTypes", MeterCCValues.supportedRateTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MeterCC;
    var MeterCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.supportsReset = options.supportsReset;
            this.supportedScales = options.supportedScales;
            this.supportedRateTypes = options.supportedRateTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const type = raw.payload[0] & 0b0_00_11111;
            const supportsReset = !!(raw.payload[0] & 0b1_00_00000);
            const hasMoreScales = !!(raw.payload[1] & 0b1_0000000);
            let supportedScales;
            if (hasMoreScales) {
                // The bitmask is spread out
                validatePayload(raw.payload.length >= 3);
                const extraBytes = raw.payload[2];
                validatePayload(raw.payload.length >= 3 + extraBytes);
                // The bitmask is the original payload byte plus all following bytes
                // Since the first byte only has 7 bits, we need to reduce all following bits by 1
                supportedScales = parseBitMask(Bytes.concat([
                    Bytes.from([raw.payload[1] & 0b0_1111111]),
                    raw.payload.subarray(3, 3 + extraBytes),
                ]), 0).map((scale) => (scale >= 8 ? scale - 1 : scale));
            }
            else {
                // only 7 bits in the bitmask. Bit 7 is 0, so no need to mask it out
                supportedScales = parseBitMask(Bytes.from([raw.payload[1]]), 0);
            }
            // This is only present in V4+
            const supportedRateTypes = parseBitMask(Bytes.from([(raw.payload[0] & 0b0_11_00000) >>> 5]), 1);
            return new this({
                nodeId: ctx.sourceNodeId,
                type,
                supportsReset,
                supportedScales,
                supportedRateTypes,
            });
        }
        type;
        supportsReset;
        supportedScales;
        supportedRateTypes;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            if (!this.supportsReset)
                return true;
            const ccVersion = getEffectiveCCVersion(ctx, this);
            // Create reset values
            if (ccVersion < 6) {
                this.ensureMetadata(ctx, MeterCCValues.resetAll);
            }
            else {
                for (const scale of this.supportedScales) {
                    // Only accumulated values can be reset
                    if (!isAccumulatedValue(this.type, scale))
                        continue;
                    for (const rateType of this.supportedRateTypes) {
                        const resetSingleValue = MeterCCValues.resetSingle(this.type, rateType, scale);
                        this.ensureMetadata(ctx, resetSingleValue, {
                            ...resetSingleValue.meta,
                            label: `Reset ${getValueLabel(this.type, scale, rateType)}`,
                        });
                    }
                }
            }
            return true;
        }
        serialize(ctx) {
            const typeByte = (this.type & 0b0_00_11111)
                | (this.supportedRateTypes.includes(RateType.Consumed)
                    ? 0b0_01_00000
                    : 0)
                | (this.supportedRateTypes.includes(RateType.Produced)
                    ? 0b0_10_00000
                    : 0)
                | (this.supportsReset ? 0b1_00_00000 : 0);
            const supportedScales = encodeBitMask(this.supportedScales, undefined, 
            // The first byte only has 7 bits for the bitmask,
            // so we add a fake bit for the value -1 and later shift
            // the first byte one to the right
            -1);
            const scalesByte1 = (supportedScales[0] >>> 1)
                | (supportedScales.length > 1 ? 0b1000_0000 : 0);
            this.payload = Bytes.from([
                typeByte,
                scalesByte1,
            ]);
            if (supportedScales.length > 1) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([supportedScales.length - 1]),
                    Bytes.from(supportedScales.subarray(1)),
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "meter type": getMeterName(this.type),
                "supports reset": this.supportsReset,
                "supported scales": `${this.supportedScales
                    .map((scale) => `
· ${(getMeterScale(this.type, scale) ?? getUnknownMeterScale(scale)).label}`)
                    .join("")}`,
                "supported rate types": this.supportedRateTypes
                    .map((rt) => getEnumMemberName(RateType, rt))
                    .join(", "),
            };
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MeterCCSupportedReport = _classThis;
})();
export { MeterCCSupportedReport };
let MeterCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(MeterCommand.SupportedGet), expectedCCResponse(MeterCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MeterCC;
    var MeterCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MeterCCSupportedGet = _classThis;
})();
export { MeterCCSupportedGet };
let MeterCCReset = (() => {
    let _classDecorators = [CCCommand(MeterCommand.Reset), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MeterCC;
    var MeterCCReset = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeterCCReset = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.type = options.type;
            this.scale = options.scale;
            this.rateType = options.rateType;
            this.targetValue = options.targetValue;
        }
        static from(raw, ctx) {
            if (raw.payload.length === 0) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                });
            }
            const { type, rateType, scale1, value: targetValue, bytesRead: scale2Offset, } = parseMeterValueAndInfo(raw.payload, 0);
            const scale = parseScale(scale1, raw.payload, scale2Offset);
            return new this({
                nodeId: ctx.sourceNodeId,
                type,
                rateType,
                targetValue,
                scale,
            });
        }
        type;
        scale;
        rateType;
        targetValue;
        serialize(ctx) {
            if (this.type != undefined
                && this.scale != undefined
                && this.rateType != undefined
                && this.targetValue != undefined) {
                const { data: typeAndValue, scale2 } = encodeMeterValueAndInfo(this.type, this.rateType, this.scale, this.targetValue);
                this.payload = typeAndValue;
                if (scale2 != undefined) {
                    this.payload = Bytes.concat([
                        this.payload,
                        Bytes.from([scale2]),
                    ]);
                }
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            if (this.type != undefined) {
                message.type = getMeterName(this.type);
            }
            if (this.rateType != undefined) {
                message["rate type"] = getEnumMemberName(RateType, this.rateType);
            }
            if (this.type != undefined && this.scale != undefined) {
                message.scale = (getMeterScale(this.type, this.scale)
                    ?? getUnknownMeterScale(this.scale)).label;
            }
            if (this.targetValue != undefined) {
                message["target value"] = this.targetValue;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MeterCCReset = _classThis;
})();
export { MeterCCReset };
//# sourceMappingURL=MeterCC.js.map