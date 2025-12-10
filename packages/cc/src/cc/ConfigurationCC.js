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
import { CommandClasses, ConfigValueFormat, MessagePriority, SupervisionStatus, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodePartial, getBitMaskWidth, getIntegerLimits, getMinIntegerSize, isConsecutiveArray, mergeSupervisionResults, parsePartial, stripUndefined, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { distinct } from "alcalzone-shared/arrays";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ConfigurationCommand } from "../lib/_Types.js";
function configValueToString(value) {
    if (typeof value === "number")
        return value.toString();
    else
        return [...value].join(", ");
}
export class ConfigurationCCError extends ZWaveError {
    message;
    code;
    argument;
    constructor(message, code, argument) {
        super(message, code);
        this.message = message;
        this.code = code;
        this.argument = argument;
        // We need to set the prototype explicitly
        Object.setPrototypeOf(this, ConfigurationCCError.prototype);
    }
}
export const ConfigurationCCValues = V.defineCCValues(CommandClasses.Configuration, {
    ...V.staticProperty("isParamInformationFromConfig", undefined, // meta
    { internal: true, supportsEndpoints: false }),
    ...V.dynamicPropertyAndKeyWithName("paramInformation", 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (parameter, bitMask) => parameter, (parameter, bitMask) => bitMask, ({ property, propertyKey }) => typeof property === "number"
        && (typeof propertyKey === "number"
            || propertyKey == undefined), 
    // Metadata is determined dynamically depending on other factors
    undefined),
});
function createConfigurationCCInstance(endpoint) {
    return CommandClass.createInstanceUnchecked(endpoint.virtual ? endpoint.node.physicalNodes[0] : endpoint, ConfigurationCC);
}
function normalizeConfigurationCCAPISetOptions(ctx, endpoint, options) {
    if ("bitMask" in options && options.bitMask) {
        // Variant 3: Partial param, look it up in the device config
        const ccc = createConfigurationCCInstance(endpoint);
        const paramInfo = ccc.getParamInformation(ctx, options.parameter, options.bitMask);
        if (!paramInfo.isFromConfig) {
            throw new ZWaveError("Setting a partial configuration parameter requires it to be defined in a device config file!", ZWaveErrorCodes.Argument_Invalid);
        }
        return {
            parameter: options.parameter,
            bitMask: options.bitMask,
            value: options.value,
            valueSize: paramInfo.valueSize,
            valueFormat: paramInfo.format,
        };
    }
    else if ("valueSize" in options) {
        // Variant 2: Normal parameter, not defined in a config file
        return pick(options, [
            "parameter",
            "value",
            "valueSize",
            "valueFormat",
        ]);
    }
    else {
        // Variant 1: Normal parameter, defined in a config file
        const ccc = createConfigurationCCInstance(endpoint);
        const paramInfo = ccc.getParamInformation(ctx, options.parameter, options.bitMask);
        if (!paramInfo.isFromConfig) {
            throw new ZWaveError("Setting a configuration parameter without specifying a value size and format requires it to be defined in a device config file!", ZWaveErrorCodes.Argument_Invalid);
        }
        return {
            parameter: options.parameter,
            value: options.value,
            valueSize: paramInfo.valueSize,
            valueFormat: paramInfo.format,
        };
    }
}
function bulkMergePartialParamValues(ctx, endpoint, options) {
    // Merge partial parameters before doing anything else. Therefore, take the non-partials, ...
    const allParams = options.filter((o) => o.bitMask == undefined);
    // ... group the partials by parameter
    const unmergedPartials = new Map();
    for (const partial of options.filter((o) => o.bitMask != undefined)) {
        if (!unmergedPartials.has(partial.parameter)) {
            unmergedPartials.set(partial.parameter, []);
        }
        unmergedPartials.get(partial.parameter).push(partial);
    }
    // and push the merged result into the array we'll be working with
    if (unmergedPartials.size) {
        const ccc = createConfigurationCCInstance(endpoint);
        for (const [parameter, partials] of unmergedPartials) {
            allParams.push({
                parameter,
                value: ccc.composePartialParamValues(ctx, parameter, partials.map((p) => ({
                    bitMask: p.bitMask,
                    partialValue: p.value,
                }))),
                valueSize: partials[0].valueSize,
                valueFormat: partials[0].valueFormat,
            });
        }
    }
    return allParams;
}
/** Determines whether a partial parameter needs to be interpreted as signed */
function isSignedPartial(bitMask, format) {
    // Only treat partial params as signed if they span more than 1 bit.
    // Otherwise we cannot model 0/1 properly.
    return (getBitMaskWidth(bitMask) > 1
        && (format ?? ConfigValueFormat.SignedInteger)
            === ConfigValueFormat.SignedInteger);
}
function reInterpretSignedValue(value, valueSize, targetFormat) {
    // Re-interpret the value with the new format
    const raw = new Bytes(valueSize);
    serializeValue(raw, 0, valueSize, ConfigValueFormat.SignedInteger, value);
    return parseValue(raw, valueSize, targetFormat);
}
function getParamInformationFromConfigFile(ctx, nodeId, endpointIndex) {
    const deviceConfig = ctx.getDeviceConfig?.(nodeId);
    if (endpointIndex === 0) {
        return (deviceConfig?.paramInformation
            ?? deviceConfig?.endpoints?.get(0)?.paramInformation);
    }
    else {
        return deviceConfig?.endpoints?.get(endpointIndex)?.paramInformation;
    }
}
/**
 * Updates the stored metadata labels and descriptions from the device config file.
 */
export function refreshMetadataStringsFromConfigFile(ctx, nodeId, endpointIndex) {
    const paramInfo = getParamInformationFromConfigFile(ctx, nodeId, endpointIndex);
    if (!paramInfo)
        return;
    const valueDB = ctx.getValueDB(nodeId);
    for (const [param, info] of paramInfo.entries()) {
        const valueId = ConfigurationCCValues.paramInformation(param.parameter, param.valueBitMask).endpoint(endpointIndex);
        const existing = valueDB.getMetadata(valueId);
        if (!existing)
            continue;
        if (!existing.isFromConfig)
            continue;
        let didChange = false;
        // Update info, description and option labels and remember if something was changed
        if (info.label !== existing.label) {
            existing.label = info.label;
            didChange = true;
        }
        if (info.description !== existing.description) {
            existing.description = info.description;
            didChange = true;
        }
        if (existing.states) {
            for (const option of info.options) {
                if (option.value in existing.states
                    && existing.states[option.value] !== option.label) {
                    existing.states[option.value] = option.label;
                    didChange = true;
                }
            }
        }
        // If something changed, update the metadata
        if (didChange)
            valueDB.setMetadata(valueId, existing);
    }
}
let ConfigurationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Configuration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _getBulk_decorators;
    let _set_decorators;
    let _setBulk_decorators;
    let _reset_decorators;
    let _resetBulk_decorators;
    let _getProperties_decorators;
    let _getName_decorators;
    let _getInfo_decorators;
    var ConfigurationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs()];
            _getBulk_decorators = [validateArgs()];
            _set_decorators = [validateArgs({ strictEnums: true })];
            _setBulk_decorators = [validateArgs({ strictEnums: true })];
            _reset_decorators = [validateArgs()];
            _resetBulk_decorators = [validateArgs()];
            _getProperties_decorators = [validateArgs()];
            _getName_decorators = [validateArgs()];
            _getInfo_decorators = [validateArgs()];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getBulk_decorators, { kind: "method", name: "getBulk", static: false, private: false, access: { has: obj => "getBulk" in obj, get: obj => obj.getBulk }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setBulk_decorators, { kind: "method", name: "setBulk", static: false, private: false, access: { has: obj => "setBulk" in obj, get: obj => obj.setBulk }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reset_decorators, { kind: "method", name: "reset", static: false, private: false, access: { has: obj => "reset" in obj, get: obj => obj.reset }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resetBulk_decorators, { kind: "method", name: "resetBulk", static: false, private: false, access: { has: obj => "resetBulk" in obj, get: obj => obj.resetBulk }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getProperties_decorators, { kind: "method", name: "getProperties", static: false, private: false, access: { has: obj => "getProperties" in obj, get: obj => obj.getProperties }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getName_decorators, { kind: "method", name: "getName", static: false, private: false, access: { has: obj => "getName" in obj, get: obj => obj.getName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getInfo_decorators, { kind: "method", name: "getInfo", static: false, private: false, access: { has: obj => "getInfo" in obj, get: obj => obj.getInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ConfigurationCommand.Get:
                case ConfigurationCommand.Set:
                    return true; // This is mandatory
                case ConfigurationCommand.BulkGet:
                case ConfigurationCommand.BulkSet:
                    return this.version >= 2;
                case ConfigurationCommand.NameGet:
                case ConfigurationCommand.InfoGet:
                case ConfigurationCommand.PropertiesGet:
                    return this.version >= 3;
                case ConfigurationCommand.DefaultReset:
                    return this.version >= 4;
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property, propertyKey }, value) {
                // Config parameters are addressed with numeric properties/keys
                if (typeof property !== "number") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (propertyKey != undefined && typeof propertyKey !== "number") {
                    throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                let ccInstance;
                const applHost = this.host;
                if (this.isSinglecast()) {
                    ccInstance = createConfigurationCCInstance(this.endpoint);
                }
                else if (this.isMulticast()) {
                    // Multicast is only possible if the parameter definition is the same on all target nodes
                    const nodes = this.endpoint.node.physicalNodes;
                    if (!nodes.every((node) => node
                        .getEndpoint(this.endpoint.index)
                        ?.supportsCC(CommandClasses.Configuration))) {
                        throw new ZWaveError(`The multicast setValue API for Configuration CC requires all virtual target endpoints to support Configuration CC!`, ZWaveErrorCodes.CC_Invalid);
                    }
                    // Figure out if all the relevant info is the same
                    const paramInfos = this.endpoint.node.physicalNodes.map((node) => createConfigurationCCInstance(node.getEndpoint(this.endpoint.index)).getParamInformation(this.host, property, propertyKey));
                    if (!paramInfos.length
                        || !paramInfos.every((info, index) => {
                            if (index === 0)
                                return true;
                            return (info.valueSize === paramInfos[0].valueSize
                                && info.format === paramInfos[0].format);
                        })) {
                        throw new ZWaveError(`The multicast setValue API for Configuration CC requires all virtual target nodes to have the same parameter definition!`, ZWaveErrorCodes.CC_Invalid);
                    }
                    // If it is, just use the first node to create the CC instance
                    ccInstance = createConfigurationCCInstance(this.endpoint);
                }
                else {
                    throw new ZWaveError(`The setValue API for Configuration CC is not supported via broadcast!`, ZWaveErrorCodes.CC_NotSupported);
                }
                let { valueSize, format: valueFormat = ConfigValueFormat.SignedInteger, } = ccInstance.getParamInformation(applHost, property);
                let targetValue;
                if (propertyKey) {
                    // This is a partial value, we need to update some bits only
                    // Find out the correct value size
                    if (!valueSize) {
                        valueSize = ccInstance.getParamInformation(applHost, property, propertyKey).valueSize;
                    }
                    // Add the target value to the remaining partial values
                    targetValue = ccInstance.composePartialParamValue(applHost, property, propertyKey, value);
                    // Partial parameters are internally converted to unsigned values - update the valueFormat accordingly
                    valueFormat = ConfigValueFormat.UnsignedInteger;
                }
                else {
                    targetValue = value;
                }
                if (!valueSize) {
                    // If there's no value size configured, figure out a matching value size
                    valueSize = getMinIntegerSize(targetValue, valueFormat === ConfigValueFormat.SignedInteger);
                    // Throw if the value is too large or too small
                    if (!valueSize) {
                        throw new ZWaveError(`The value ${targetValue} is not valid for configuration parameters!`, ZWaveErrorCodes.Argument_Invalid);
                    }
                }
                // Make sure that the given value fits into the value size
                if (!isSafeValue(targetValue, valueSize, valueFormat)) {
                    // If there is a value size configured, check that the given value is compatible
                    throwInvalidValueError(targetValue, property, valueSize, valueFormat);
                }
                const result = await this.set({
                    parameter: property,
                    value: targetValue,
                    valueSize: valueSize,
                    valueFormat,
                });
                if (!supervisedCommandSucceeded(result)
                    && this.isSinglecast()) {
                    // Verify the current value after a delay, unless the command was supervised and successful
                    this.schedulePoll({ property, propertyKey }, targetValue, 
                    // Configuration changes are instant
                    { transition: "fast" });
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                // Config parameters are addressed with numeric properties/keys
                if (typeof property !== "number") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (propertyKey != undefined && typeof propertyKey !== "number") {
                    throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                }
                return this.get(property, { valueBitMask: propertyKey });
            };
        }
        /**
         * Requests the current value of a given config parameter from the device.
         * This may timeout and return `undefined` if the node does not respond.
         * If the node replied with a different parameter number, a `ConfigurationCCError`
         * is thrown with the `argument` property set to the reported parameter number.
         */
        async get(parameter, options) {
            // Get-type commands are only possible in singlecast
            this.assertPhysicalEndpoint(this.endpoint);
            // Two-byte parameter numbers can only be read using the BulkGet command
            if (parameter > 255) {
                const result = await this.getBulk([
                    {
                        parameter,
                        bitMask: options?.valueBitMask,
                    },
                ]);
                return result.find((r) => r.parameter === parameter)?.value;
            }
            this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.Get);
            const { valueBitMask, allowUnexpectedResponse } = options ?? {};
            const cc = new ConfigurationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
                allowUnexpectedResponse,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (!response)
                return;
            // Nodes may respond with a different parameter, e.g. if we
            // requested a non-existing one
            if (response.parameter === parameter) {
                if (!valueBitMask)
                    return response.value;
                // If a partial parameter was requested, extract that value
                const paramInfo = cc.getParamInformation(this.host, response.parameter, valueBitMask);
                return parsePartial(response.value, valueBitMask, isSignedPartial(valueBitMask, paramInfo.format));
            }
            this.host.logNode(this.endpoint.nodeId, {
                endpoint: this.endpoint.index,
                message: `Received unexpected ConfigurationReport (param = ${response.parameter}, value = ${response.value.toString()})`,
                direction: "inbound",
                level: "error",
            });
            throw new ConfigurationCCError(`The first existing parameter on this node is ${response.parameter}`, ZWaveErrorCodes.ConfigurationCC_FirstParameterNumber, response.parameter);
        }
        /**
         * Requests the current value of the config parameters from the device.
         * When the node does not respond due to a timeout, the `value` in the returned array will be `undefined`.
         */
        async getBulk(options) {
            // Get-type commands are only possible in singlecast
            this.assertPhysicalEndpoint(this.endpoint);
            let values;
            // If the parameters are consecutive, we may use BulkGet
            const distinctParameters = distinct(options.map((o) => o.parameter));
            if (this.supportsCommand(ConfigurationCommand.BulkGet)
                && isConsecutiveArray(distinctParameters)) {
                const cc = new ConfigurationCCBulkGet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    parameters: distinctParameters,
                });
                const response = await this.host.sendCommand(cc, this.commandOptions);
                if (response)
                    values = response.values;
            }
            else {
                this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.Get);
                const _values = new Map();
                for (const parameter of distinctParameters) {
                    const cc = new ConfigurationCCGet({
                        nodeId: this.endpoint.nodeId,
                        endpointIndex: this.endpoint.index,
                        parameter,
                    });
                    const response = await this.host.sendCommand(cc, this.commandOptions);
                    if (response) {
                        _values.set(response.parameter, response.value);
                    }
                }
                values = _values;
            }
            // Combine the returned values with the requested ones
            const cc = createConfigurationCCInstance(this.endpoint);
            return options.map((o) => {
                let value = values?.get(o.parameter);
                if (typeof value === "number" && o.bitMask) {
                    const paramInfo = cc.getParamInformation(this.host, o.parameter, o.bitMask);
                    value = parsePartial(value, o.bitMask, isSignedPartial(o.bitMask, paramInfo.format));
                }
                return { ...o, value };
            });
        }
        /**
         * Sets a new value for a given config parameter of the device.
         */
        async set(options) {
            // Two-byte parameter numbers can only be set using the BulkSet command
            if (options.parameter > 255) {
                return this.setBulk([options]);
            }
            this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.Set);
            const normalized = normalizeConfigurationCCAPISetOptions(this.host, this.endpoint, options);
            let value = normalized.value;
            if (normalized.bitMask) {
                const ccc = createConfigurationCCInstance(this.endpoint);
                value = ccc.composePartialParamValue(this.host, normalized.parameter, normalized.bitMask, normalized.value);
            }
            const cc = new ConfigurationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                resetToDefault: false,
                parameter: normalized.parameter,
                value,
                valueSize: normalized.valueSize,
                valueFormat: normalized.valueFormat,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Sets new values for multiple config parameters of the device. Uses the `BulkSet` command if supported, otherwise falls back to individual `Set` commands.
         */
        async setBulk(values) {
            // Normalize the values so we can better work with them
            const normalized = values.map((v) => normalizeConfigurationCCAPISetOptions(this.host, this.endpoint, v));
            // And merge multiple partials that belong the same "full" value
            const allParams = bulkMergePartialParamValues(this.host, this.endpoint, normalized);
            const canUseBulkSet = this.supportsCommand(ConfigurationCommand.BulkSet)
                // For Bulk Set we need consecutive parameters
                && isConsecutiveArray(allParams.map((v) => v.parameter))
                // and identical format
                && new Set(allParams.map((v) => v.valueFormat)).size === 1
                // and identical size
                && new Set(allParams.map((v) => v.valueSize)).size === 1;
            if (canUseBulkSet) {
                const cc = new ConfigurationCCBulkSet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    parameters: allParams.map((v) => v.parameter),
                    valueSize: allParams[0].valueSize,
                    valueFormat: allParams[0].valueFormat,
                    values: allParams.map((v) => v.value),
                    handshake: true,
                });
                // The handshake flag is set, so we expect a BulkReport in response
                const result = await this.host.sendCommand(cc, this.commandOptions);
                // If we did receive a response, we also received the updated parameters,
                // so if any one was not accepted, we know by looking at the values.
                // Translate the result into a SupervisionResult by comparing the values
                if (result) {
                    const sentValues = cc.values;
                    const receivedValues = [...result.values.values()];
                    const success = sentValues.length === receivedValues.length
                        && sentValues.every((v, i) => v === receivedValues[i]);
                    return {
                        status: success
                            ? SupervisionStatus.Success
                            : SupervisionStatus.Fail,
                    };
                }
                else {
                    return undefined;
                }
            }
            else {
                this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.Set);
                const supervisionResults = [];
                for (const { parameter, value, valueSize, valueFormat, } of allParams) {
                    const cc = new ConfigurationCCSet({
                        nodeId: this.endpoint.nodeId,
                        endpointIndex: this.endpoint.index,
                        parameter,
                        value,
                        valueSize,
                        valueFormat,
                    });
                    supervisionResults.push(await this.host.sendCommand(cc, this.commandOptions));
                }
                return mergeSupervisionResults(supervisionResults);
            }
        }
        /**
         * Resets a configuration parameter to its default value.
         *
         * WARNING: This will throw on legacy devices (ConfigurationCC v3 and below)
         */
        async reset(parameter) {
            // Two-byte parameter numbers can only be reset using the BulkSet command
            if (parameter > 255) {
                return this.resetBulk([parameter]);
            }
            // According to SDS14223 this flag SHOULD NOT be set
            // Because we don't want to test the behavior, we enforce that it MUST not be set
            // on legacy nodes
            if (this.version <= 3) {
                throw new ZWaveError(`Resetting configuration parameters to default MUST not be done on nodes implementing ConfigurationCC V3 or below!`, ZWaveErrorCodes
                    .ConfigurationCC_NoResetToDefaultOnLegacyDevices);
            }
            this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.Set);
            const cc = new ConfigurationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
                resetToDefault: true,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Resets multiple configuration parameters to their default value. Uses BulkSet if supported, otherwise falls back to individual Set commands.
         *
         * WARNING: This will throw on legacy devices (ConfigurationCC v3 and below)
         */
        async resetBulk(parameters) {
            if (isConsecutiveArray(parameters)
                && this.supportsCommand(ConfigurationCommand.BulkSet)) {
                const cc = new ConfigurationCCBulkSet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    parameters,
                    resetToDefault: true,
                });
                return this.host.sendCommand(cc, this.commandOptions);
            }
            else {
                this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.Set);
                const CCs = distinct(parameters).map((parameter) => new ConfigurationCCSet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    parameter,
                    resetToDefault: true,
                }));
                for (const cc of CCs) {
                    await this.host.sendCommand(cc, this.commandOptions);
                }
            }
        }
        /** Resets all configuration parameters to their default value */
        async resetAll() {
            // This is dangerous - don't allow resetting all parameters via multicast
            this.assertPhysicalEndpoint(this.endpoint);
            this.assertSupportsCommand(ConfigurationCommand, ConfigurationCommand.DefaultReset);
            const cc = new ConfigurationCCDefaultReset({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async getProperties(parameter) {
            // Get-type commands are only possible in singlecast
            this.assertPhysicalEndpoint(this.endpoint);
            const cc = new ConfigurationCCPropertiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "valueSize",
                    "valueFormat",
                    "minValue",
                    "maxValue",
                    "defaultValue",
                    "nextParameter",
                    "altersCapabilities",
                    "isReadonly",
                    "isAdvanced",
                    "noBulkSupport",
                ]);
            }
        }
        /** Requests the name of a configuration parameter from the node */
        async getName(parameter) {
            // Get-type commands are only possible in singlecast
            this.assertPhysicalEndpoint(this.endpoint);
            const cc = new ConfigurationCCNameGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.name;
        }
        /** Requests usage info for a configuration parameter from the node */
        async getInfo(parameter) {
            // Get-type commands are only possible in singlecast
            this.assertPhysicalEndpoint(this.endpoint);
            const cc = new ConfigurationCCInfoGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.info;
        }
        /**
         * This scans the node for the existing parameters. Found parameters will be reported
         * through the `value added` and `value updated` events.
         *
         * WARNING: This method throws for newer devices.
         *
         * WARNING: On nodes implementing V1 and V2, this process may take
         * **up to an hour**, depending on the configured timeout.
         *
         * WARNING: On nodes implementing V2, all parameters after 255 will be ignored.
         */
        async scanParametersLegacy() {
            if (this.version >= 3) {
                throw new ZWaveError("Use ConfigurationCC.interview instead of scanning parameters for versions 3 and above.", ZWaveErrorCodes.ConfigurationCC_NoLegacyScanOnNewDevices);
            }
            // Get-type commands are only possible in singlecast
            this.assertPhysicalEndpoint(this.endpoint);
            // TODO: Reduce the priority of the messages
            this.host.logNode(this.endpoint.nodeId, {
                endpoint: this.endpoint.index,
                message: `Scanning available parameters...`,
            });
            const ccInstance = createConfigurationCCInstance(this.endpoint);
            for (let param = 1; param <= 255; param++) {
                // Check if the parameter is readable
                let originalValue;
                this.host.logNode(this.endpoint.nodeId, {
                    endpoint: this.endpoint.index,
                    message: `  trying param ${param}...`,
                    direction: "outbound",
                });
                try {
                    originalValue = await this.get(param, {
                        // When requesting a non-existing parameter, a node SHOULD respond with the
                        // first available parameter. We use this for the first param only,
                        // because delayed responses might otherwise confuse the interview process
                        allowUnexpectedResponse: param === 1,
                    });
                    if (originalValue != undefined) {
                        const logMessage = `  Param ${param}:
    readable  = true
    valueSize = ${ccInstance.getParamInformation(this.host, param)
                            .valueSize}
    value     = ${originalValue.toString()}`;
                        this.host.logNode(this.endpoint.nodeId, {
                            endpoint: this.endpoint.index,
                            message: logMessage,
                            direction: "inbound",
                        });
                    }
                }
                catch (e) {
                    if (e instanceof ConfigurationCCError
                        && e.code
                            === ZWaveErrorCodes.ConfigurationCC_FirstParameterNumber) {
                        // Continue iterating with the next param
                        if (e.argument - 1 > param)
                            param = e.argument - 1;
                        continue;
                    }
                    throw e;
                }
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ConfigurationCCAPI = _classThis;
})();
export { ConfigurationCCAPI };
let ConfigurationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Configuration), implementedVersion(4), ccValues(ConfigurationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ConfigurationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** Applies configuration parameters from the node's provisioning entry, if any */
        async applyProvisioningConfigParameters(ctx) {
            // Only apply provisioning config parameters during the initial interview
            if (!("getInterviewOptions" in ctx)) {
                return;
            }
            const node = this.getNode(ctx);
            ;
            ;
            // Check if this node has a provisioning entry with configuration parameters
            const provisioningEntry = node.driver?.controller?.getProvisioningEntry?.(node.id);
            if (!provisioningEntry?.configParameters?.length) {
                return;
            }
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Configuration, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Applying ${provisioningEntry.configParameters.length} configuration parameters from provisioning entry`,
                direction: "none",
            });
            // Apply each configuration parameter
            for (const configParam of provisioningEntry.configParameters) {
                try {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Setting parameter #${configParam.parameter}${configParam.bitMask ? `[${configParam.bitMask.toString(16).padStart(2, "0")}]` : ""} = ${configParam.value}`,
                        direction: "outbound",
                    });
                    if (configParam.bitMask) {
                        // For partial parameters, use setBulk
                        await api.setBulk([{
                                parameter: configParam.parameter,
                                bitMask: configParam.bitMask,
                                value: configParam.value,
                            }]);
                    }
                    else {
                        // For regular parameters, use set
                        await api.set({
                            parameter: configParam.parameter,
                            value: configParam.value,
                        });
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Successfully set parameter #${configParam.parameter}${configParam.bitMask ? `[${configParam.bitMask.toString(16).padStart(2, "0")}]` : ""}`,
                        direction: "inbound",
                    });
                }
                catch (error) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Failed to set parameter #${configParam.parameter}${configParam.bitMask ? `[${configParam.bitMask.toString(16).padStart(2, "0")}]` : ""}: ${error.message}`,
                        direction: "inbound",
                        level: "warn",
                    });
                }
            }
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Configuration, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            const deviceConfig = ctx.getDeviceConfig?.(node.id);
            const paramInfo = getParamInformationFromConfigFile(ctx, node.id, this.endpointIndex);
            if (paramInfo) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `${this.constructor.name}: Loading configuration parameters from device config`,
                    direction: "none",
                });
                this.deserializeParamInformationFromConfig(ctx, paramInfo);
            }
            const documentedParamNumbers = new Set(Array.from(paramInfo?.keys() ?? []).map((k) => k.parameter));
            if (api.version >= 3) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "finding first configuration parameter...",
                    direction: "outbound",
                });
                const param0props = await api.getProperties(0);
                let param;
                if (param0props) {
                    param = param0props.nextParameter;
                    if (param === 0) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `didn't report any config params, trying #1 just to be sure...`,
                            direction: "inbound",
                        });
                        param = 1;
                    }
                }
                else {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "Finding first configuration parameter timed out, skipping interview...",
                        level: "warn",
                    });
                    return;
                }
                while (param > 0) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying parameter #${param} information...`,
                        direction: "outbound",
                    });
                    // Query properties and the next param
                    const props = await api.getProperties(param).catch(
                    // If querying the properties fails, don't abort the entire interview
                    () => undefined);
                    if (!props) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `Querying parameter #${param} information timed out, skipping scan...`,
                            level: "warn",
                        });
                        break;
                    }
                    const { nextParameter, ...properties } = props;
                    let logMessage;
                    if (properties.valueSize === 0) {
                        logMessage =
                            `Parameter #${param} is unsupported. Next parameter: ${nextParameter}`;
                    }
                    else {
                        let name;
                        // Query the name and info for parameters that are NOT defined in a config file
                        if (!documentedParamNumbers.has(param)) {
                            // Skip the name query for bugged devices
                            if (!deviceConfig?.compat?.skipConfigurationNameQuery) {
                                name = await api.getName(param).catch(
                                // If querying the name fails, don't abort the entire interview
                                () => undefined);
                            }
                            // Skip the info query for bugged devices
                            if (!deviceConfig?.compat?.skipConfigurationInfoQuery) {
                                await api.getInfo(param).catch(
                                // If querying the info fails, don't abort the entire interview
                                () => undefined);
                            }
                        }
                        logMessage =
                            `received information for parameter #${param}:`;
                        if (name) {
                            logMessage += `
parameter name:      ${name}`;
                        }
                        logMessage += `
value format:        ${getEnumMemberName(ConfigValueFormat, properties.valueFormat)}
value size:          ${properties.valueSize} bytes
min value:           ${properties.minValue?.toString() ?? "undefined"}
max value:           ${properties.maxValue?.toString() ?? "undefined"}
default value:       ${properties.defaultValue?.toString() ?? "undefined"}
is read-only:        ${!!properties.isReadonly}
is advanced (UI):    ${!!properties.isAdvanced}
has bulk support:    ${!properties.noBulkSupport}
alters capabilities: ${!!properties.altersCapabilities}`;
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                    // Some devices report their parameter 1 instead of 0 as the next one
                    // when reaching the end. To avoid infinite loops, stop scanning
                    // once the next parameter is lower than the current one
                    if (nextParameter > param) {
                        param = nextParameter;
                    }
                    else {
                        break;
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
            const api = CCAPI.create(CommandClasses.Configuration, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            if (api.version < 3) {
                // V1/V2: Query all values defined in the config file
                const paramInfo = getParamInformationFromConfigFile(ctx, node.id, this.endpointIndex);
                if (paramInfo?.size) {
                    // Because partial params share the same parameter number,
                    // we need to remember which ones we have already queried.
                    const alreadyQueried = new Set();
                    for (const param of paramInfo.keys()) {
                        // No need to query writeonly params
                        if (paramInfo.get(param)?.writeOnly)
                            continue;
                        // Don't double-query params
                        if (alreadyQueried.has(param.parameter))
                            continue;
                        alreadyQueried.add(param.parameter);
                        // Query the current value
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `querying parameter #${param.parameter} value...`,
                            direction: "outbound",
                        });
                        // ... at least try to
                        const paramValue = await api.get(param.parameter);
                        if (typeof paramValue === "number") {
                            ctx.logNode(node.id, {
                                endpoint: this.endpointIndex,
                                message: `parameter #${param.parameter} has value: ${paramValue}`,
                                direction: "inbound",
                            });
                        }
                        else if (!paramValue) {
                            ctx.logNode(node.id, {
                                endpoint: this.endpointIndex,
                                message: `received no value for parameter #${param.parameter}`,
                                direction: "inbound",
                                level: "warn",
                            });
                        }
                    }
                }
                else {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `${this.constructor.name}: skipping interview because CC version is < 3 and there is no config file`,
                        direction: "none",
                    });
                }
            }
            else {
                // V3+: Query the values of discovered parameters
                const parameters = distinct(this.getDefinedValueIDs(ctx)
                    .map((v) => v.property)
                    .filter((p) => typeof p === "number"));
                for (const param of parameters) {
                    if (this.getParamInformation(ctx, param).readable !== false) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `querying parameter #${param} value...`,
                            direction: "outbound",
                        });
                        await api.get(param);
                    }
                    else {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `not querying parameter #${param} value, because it is writeonly`,
                            direction: "none",
                        });
                    }
                }
            }
            // Apply configuration parameters from SmartStart provisioning entry if available
            await this.applyProvisioningConfigParameters(ctx);
        }
        /**
         * Whether this node's param information was loaded from a config file.
         * If this is true, we don't trust what the node reports
         */
        paramExistsInConfigFile(ctx, parameter, valueBitMask) {
            if (this.getValue(ctx, ConfigurationCCValues.isParamInformationFromConfig) !== true) {
                return false;
            }
            const paramInformation = getParamInformationFromConfigFile(ctx, this.nodeId, this.endpointIndex);
            if (!paramInformation)
                return false;
            // Check if the param is defined in the config file, either as a normal param or a partial
            if (paramInformation.has({ parameter, valueBitMask })) {
                return true;
            }
            else if (valueBitMask == undefined) {
                // Also consider partials when looking for plain params
                for (const key of paramInformation.keys()) {
                    if (key.parameter === parameter)
                        return true;
                }
            }
            return false;
        }
        /**
         * @internal
         * Stores config parameter metadata for this CC's node
         */
        extendParamInformation(ctx, parameter, valueBitMask, info) {
            // Don't trust param information that a node reports if we have already loaded it from a config file
            if (valueBitMask === undefined
                && this.paramExistsInConfigFile(ctx, parameter)) {
                return;
            }
            // Retrieve the base metadata
            const metadata = this.getParamInformation(ctx, parameter, valueBitMask);
            // Override it with new data
            Object.assign(metadata, info);
            // And store it back
            this.setMetadata(ctx, ConfigurationCCValues.paramInformation(parameter, valueBitMask), metadata);
        }
        /**
         * @internal
         * Returns stored config parameter metadata for this CC's node
         */
        getParamInformation(ctx, parameter, valueBitMask) {
            return (this.getMetadata(ctx, ConfigurationCCValues.paramInformation(parameter, valueBitMask)) ?? {
                ...ValueMetadata.Any,
            });
        }
        /**
         * **INTERNAL:** Returns the param info that was queried for this node. This returns the information that was returned by the node
         * and does not include partial parameters.
         */
        getQueriedParamInfos(ctx) {
            const parameters = distinct(this.getDefinedValueIDs(ctx)
                .map((v) => v.property)
                .filter((p) => typeof p === "number"));
            return Object.fromEntries(parameters.map((p) => [
                p,
                this.getParamInformation(ctx, p),
            ]));
        }
        /**
         * Returns stored config parameter metadata for all partial config params addressed with the given parameter number
         */
        getPartialParamInfos(ctx, parameter) {
            const valueDB = this.getValueDB(ctx);
            return valueDB.findMetadata((id) => id.commandClass === this.ccId
                && (id.endpoint ?? 0) === this.endpointIndex
                && id.property === parameter
                && id.propertyKey != undefined);
        }
        /**
         * Computes the full value of a parameter after applying a partial param value
         */
        composePartialParamValue(ctx, parameter, bitMask, partialValue) {
            return this.composePartialParamValues(ctx, parameter, [
                { bitMask, partialValue },
            ]);
        }
        /**
         * Computes the full value of a parameter after applying multiple partial param values
         */
        composePartialParamValues(ctx, parameter, partials) {
            const valueDB = this.getValueDB(ctx);
            // Add the other values together
            const otherValues = valueDB.findValues((id) => id.commandClass === this.ccId
                && (id.endpoint ?? 0) === this.endpointIndex
                && id.property === parameter
                && id.propertyKey != undefined
                && !partials.some((p) => id.propertyKey === p.bitMask));
            let ret = 0;
            for (const { propertyKey: bitMask, value: partialValue, } of otherValues) {
                ret = encodePartial(ret, partialValue, bitMask);
            }
            for (const { bitMask, partialValue } of partials) {
                ret = encodePartial(ret, partialValue, bitMask);
            }
            return ret;
        }
        /** Deserializes the config parameter info from a config file */
        deserializeParamInformationFromConfig(ctx, config) {
            const valueDB = this.getValueDB(ctx);
            // Clear old param information
            for (const meta of valueDB.getAllMetadata(this.ccId)) {
                if (typeof meta.property === "number"
                    && (meta.endpoint ?? 0) === this.endpointIndex) {
                    // this is a param information, delete it
                    valueDB.setMetadata(meta, undefined, 
                    // Don't emit the added/updated events, as this will spam applications with untranslated events
                    { noEvent: true });
                }
            }
            // Allow overwriting the param info (mark it as unloaded)
            this.setValue(ctx, ConfigurationCCValues.isParamInformationFromConfig, false);
            for (const [param, info] of config.entries()) {
                // We need to make the config information compatible with the
                // format that ConfigurationCC reports
                const paramInfo = stripUndefined({
                    // TODO: Make this smarter! (0...1 ==> boolean)
                    type: "number",
                    valueSize: info.valueSize,
                    min: info.minValue,
                    max: info.maxValue,
                    default: info.defaultValue,
                    unit: info.unit,
                    format: info.unsigned
                        ? ConfigValueFormat.UnsignedInteger
                        : ConfigValueFormat.SignedInteger,
                    readable: !info.writeOnly,
                    writeable: !info.readOnly,
                    allowManualEntry: info.allowManualEntry,
                    states: info.options.length > 0
                        ? Object.fromEntries(info.options.map(({ label, value }) => [
                            value.toString(),
                            label,
                        ]))
                        : undefined,
                    label: info.label,
                    description: info.description,
                    isFromConfig: true,
                });
                this.extendParamInformation(ctx, param.parameter, param.valueBitMask, paramInfo);
            }
            // Remember that we loaded the param information from a config file
            this.setValue(ctx, ConfigurationCCValues.isParamInformationFromConfig, true);
        }
        translatePropertyKey(ctx, property, propertyKey) {
            if (typeof property === "number"
                && (propertyKey == undefined || typeof propertyKey === "number")) {
                // This CC names all configuration parameters differently,
                // so no name for the property key is required
                return undefined;
            }
            return super.translateProperty(ctx, property, propertyKey);
        }
        translateProperty(ctx, property, propertyKey) {
            // Try to retrieve the configured param label
            if (typeof property === "number"
                && (propertyKey == undefined || typeof propertyKey === "number")) {
                const paramInfo = this.getParamInformation(ctx, property, propertyKey);
                if (paramInfo.label)
                    return paramInfo.label;
                // fall back to paramXYZ[_key] if none is defined
                let ret = `param${property.toString().padStart(3, "0")}`;
                if (propertyKey != undefined) {
                    ret += "_" + propertyKey.toString();
                }
                return ret;
            }
            return super.translateProperty(ctx, property, propertyKey);
        }
    };
    return ConfigurationCC = _classThis;
})();
export { ConfigurationCC };
let ConfigurationCCReport = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.value = options.value;
            this.valueSize = options.valueSize;
            this.valueFormat = options.valueFormat;
        }
        static from(raw, ctx) {
            // All fields must be present
            validatePayload(raw.payload.length > 2);
            const parameter = raw.payload[0];
            const valueSize = raw.payload[1] & 0b111;
            // Ensure we received a valid report
            validatePayload(valueSize >= 1, valueSize <= 4, raw.payload.length >= 2 + valueSize);
            // Default to parsing the value as SignedInteger, like the specs say.
            // We try to re-interpret the value in persistValues()
            const value = parseValue(raw.payload.subarray(2), valueSize, ConfigValueFormat.SignedInteger);
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                valueSize,
                value,
            });
        }
        parameter;
        value;
        valueSize;
        valueFormat; // only used for serialization
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const ccVersion = getEffectiveCCVersion(ctx, this);
            // This parameter may be a partial param in the following cases:
            // * a config file defines it as such
            // * it was reported by the device as a bit field
            const partialParams = this.getPartialParamInfos(ctx, this.parameter);
            let cachedValueFormat;
            if (partialParams.length > 0) {
                // This is a partial param. All definitions should have the same format, so we just take the first one
                cachedValueFormat = partialParams[0].metadata.format;
            }
            else {
                // Check if the initial assumption of SignedInteger holds true
                const oldParamInformation = this.getParamInformation(ctx, this.parameter);
                cachedValueFormat = oldParamInformation.format;
                // On older CC versions, these reports may be the only way we can retrieve the value size
                // Therefore we store it here
                this.extendParamInformation(ctx, this.parameter, undefined, {
                    valueSize: this.valueSize,
                });
                if (ccVersion < 3
                    && !this.paramExistsInConfigFile(ctx, this.parameter)
                    && oldParamInformation.min == undefined
                    && oldParamInformation.max == undefined) {
                    const isSigned = oldParamInformation.format == undefined
                        || oldParamInformation.format
                            === ConfigValueFormat.SignedInteger;
                    this.extendParamInformation(ctx, this.parameter, undefined, getIntegerLimits(this.valueSize, isSigned));
                }
            }
            // We may have to re-interpret the value as unsigned, depending on the cached value format
            if (cachedValueFormat != undefined
                && cachedValueFormat !== ConfigValueFormat.SignedInteger) {
                // Re-interpret the value with the new format
                this.value = reInterpretSignedValue(this.value, this.valueSize, cachedValueFormat);
            }
            // And store the value itself
            // If we have partial config params defined, we need to split the value
            if (partialParams.length > 0) {
                for (const param of partialParams) {
                    if (typeof param.propertyKey === "number") {
                        this.setValue(ctx, ConfigurationCCValues.paramInformation(this.parameter, param.propertyKey), parsePartial(this.value, param.propertyKey, isSignedPartial(param.propertyKey, param.metadata.format)));
                    }
                }
            }
            else {
                // This is a single param
                this.setValue(ctx, ConfigurationCCValues.paramInformation(this.parameter), this.value);
            }
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.parameter, this.valueSize & 0b111]),
                new Bytes(this.valueSize),
            ]);
            serializeValue(this.payload, 2, this.valueSize, this.valueFormat ?? ConfigValueFormat.SignedInteger, this.value);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "parameter #": this.parameter,
                    "value size": this.valueSize,
                    value: configValueToString(this.value),
                },
            };
        }
    };
    return ConfigurationCCReport = _classThis;
})();
export { ConfigurationCCReport };
function testResponseForConfigurationGet(sent, received) {
    // We expect a Configuration Report that matches the requested parameter
    return (sent.parameter === received.parameter || sent.allowUnexpectedResponse);
}
let ConfigurationCCGet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.Get), expectedCCResponse(ConfigurationCCReport, testResponseForConfigurationGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.allowUnexpectedResponse = options.allowUnexpectedResponse
                ?? false;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const parameter = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        allowUnexpectedResponse;
        serialize(ctx) {
            this.payload = Bytes.from([this.parameter]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "parameter #": this.parameter },
            };
        }
    };
    return ConfigurationCCGet = _classThis;
})();
export { ConfigurationCCGet };
let ConfigurationCCSet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.resetToDefault = !!options.resetToDefault;
            if (!options.resetToDefault) {
                // TODO: Default to the stored value size
                this.valueSize = options.valueSize;
                this.valueFormat = options.valueFormat
                    ?? ConfigValueFormat.SignedInteger;
                this.value = options.value;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const parameter = raw.payload[0];
            const resetToDefault = !!(raw.payload[1] & 0b1000_0000);
            const valueSize = raw.payload[1] & 0b111;
            // Ensure we received a valid report
            validatePayload(valueSize >= 1, valueSize <= 4, raw.payload.length >= 2 + valueSize);
            // Parse the value as signed integer. We don't know the format here.
            const value = parseValue(raw.payload.subarray(2), valueSize, ConfigValueFormat.SignedInteger);
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                resetToDefault,
                valueSize,
                value,
            });
        }
        resetToDefault;
        parameter;
        valueSize;
        valueFormat;
        value;
        serialize(ctx) {
            const valueSize = this.resetToDefault ? 1 : this.valueSize;
            const payloadLength = 2 + valueSize;
            this.payload = Bytes.alloc(payloadLength, 0);
            this.payload[0] = this.parameter;
            this.payload[1] = (this.resetToDefault ? 0b1000_0000 : 0)
                | (valueSize & 0b111);
            if (!this.resetToDefault) {
                // Make sure that the given value fits into the value size
                if (typeof this.value === "number"
                    && !isSafeValue(this.value, valueSize, this.valueFormat)) {
                    // If there is a value size configured, check that the given value is compatible
                    throwInvalidValueError(this.value, this.parameter, valueSize, this.valueFormat);
                }
                try {
                    serializeValue(this.payload, 2, valueSize, this.valueFormat, this.value);
                }
                catch (e) {
                    tryCatchOutOfBoundsError(e, this.value, this.parameter, valueSize, this.valueFormat);
                }
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "parameter #": this.parameter,
                "reset to default": this.resetToDefault,
            };
            if (this.valueSize != undefined) {
                message["value size"] = this.valueSize;
            }
            if (this.valueFormat != undefined) {
                message["value format"] = getEnumMemberName(ConfigValueFormat, this.valueFormat);
            }
            if (this.value != undefined) {
                message.value = configValueToString(this.value);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ConfigurationCCSet = _classThis;
})();
export { ConfigurationCCSet };
function getResponseForBulkSet(cc) {
    return cc.handshake ? ConfigurationCCBulkReport : undefined;
}
let ConfigurationCCBulkSet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.BulkSet), expectedCCResponse(getResponseForBulkSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCBulkSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCBulkSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this._parameters = options.parameters;
            if (this._parameters.length < 1) {
                throw new ZWaveError(`In a ConfigurationCC.BulkSet, parameters must be a non-empty array`, ZWaveErrorCodes.CC_Invalid);
            }
            else if (!isConsecutiveArray(this._parameters)) {
                throw new ZWaveError(`A ConfigurationCC.BulkSet can only be used for consecutive parameters`, ZWaveErrorCodes.CC_Invalid);
            }
            this._handshake = !!options.handshake;
            this._resetToDefault = !!options.resetToDefault;
            if (!!options.resetToDefault) {
                this._valueSize = 1;
                this._valueFormat = ConfigValueFormat.SignedInteger;
                this._values = this._parameters.map(() => 0);
            }
            else {
                this._valueSize = options.valueSize;
                this._valueFormat = options.valueFormat
                    ?? ConfigValueFormat.SignedInteger;
                this._values = options.values;
            }
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ConfigurationCCBulkSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        _parameters;
        get parameters() {
            return this._parameters;
        }
        _resetToDefault;
        get resetToDefault() {
            return this._resetToDefault;
        }
        _valueSize;
        get valueSize() {
            return this._valueSize;
        }
        _valueFormat;
        get valueFormat() {
            return this._valueFormat;
        }
        _values;
        get values() {
            return this._values;
        }
        _handshake;
        get handshake() {
            return this._handshake;
        }
        serialize(ctx) {
            const valueSize = this._resetToDefault ? 1 : this.valueSize;
            const payloadLength = 4 + valueSize * this.parameters.length;
            this.payload = Bytes.alloc(payloadLength, 0);
            this.payload.writeUInt16BE(this.parameters[0], 0);
            this.payload[2] = this.parameters.length;
            this.payload[3] = (this._resetToDefault ? 0b1000_0000 : 0)
                | (this.handshake ? 0b0100_0000 : 0)
                | (valueSize & 0b111);
            if (!this._resetToDefault) {
                for (let i = 0; i < this.parameters.length; i++) {
                    const value = this._values[i];
                    const param = this._parameters[i];
                    // Make sure that the given value fits into the value size
                    if (!isSafeValue(value, valueSize, this._valueFormat)) {
                        // If there is a value size configured, check that the given value is compatible
                        throwInvalidValueError(value, param, valueSize, this._valueFormat);
                    }
                    try {
                        serializeValue(this.payload, 4 + i * valueSize, valueSize, this._valueFormat, value);
                    }
                    catch (e) {
                        tryCatchOutOfBoundsError(e, value, param, valueSize, this._valueFormat);
                    }
                }
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                handshake: this.handshake,
                "reset to default": this.resetToDefault,
                "value size": this.valueSize,
            };
            if (this._values.length > 0) {
                message.values = this._values
                    .map((value, i) => `\n· #${this._parameters[i]}: ${configValueToString(value)}`)
                    .join("");
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ConfigurationCCBulkSet = _classThis;
})();
export { ConfigurationCCBulkSet };
let ConfigurationCCBulkReport = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.BulkReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCBulkReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCBulkReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.reportsToFollow = options.reportsToFollow;
            this.defaultValues = options.defaultValues;
            this.isHandshakeResponse = options.isHandshakeResponse;
            this.valueSize = options.valueSize;
            for (const [param, value] of Object.entries(options.values)) {
                this._values.set(parseInt(param), value);
            }
        }
        static from(raw, ctx) {
            // Ensure we received enough bytes for the preamble
            validatePayload(raw.payload.length >= 5);
            const firstParameter = raw.payload.readUInt16BE(0);
            const numParams = raw.payload[2];
            const reportsToFollow = raw.payload[3];
            const defaultValues = !!(raw.payload[4] & 0b1000_0000);
            const isHandshakeResponse = !!(raw.payload[4] & 0b0100_0000);
            const valueSize = raw.payload[4] & 0b111;
            // Ensure the payload is long enough for all reported values
            validatePayload(raw.payload.length >= 5 + numParams * valueSize);
            const values = {};
            for (let i = 0; i < numParams; i++) {
                const param = firstParameter + i;
                // Default to parsing the value as SignedInteger, like the specs say.
                // We try to re-interpret the value in persistValues()
                values[param] = parseValue(raw.payload.subarray(5 + i * valueSize), valueSize, ConfigValueFormat.SignedInteger);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                reportsToFollow,
                defaultValues,
                isHandshakeResponse,
                valueSize,
                values,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Store every received parameter
            // eslint-disable-next-line prefer-const
            for (let [parameter, value] of this._values.entries()) {
                // Check if the initial assumption of SignedInteger holds true
                const oldParamInformation = this.getParamInformation(ctx, parameter);
                if (oldParamInformation.format != undefined
                    && oldParamInformation.format
                        !== ConfigValueFormat.SignedInteger) {
                    // Re-interpret the value with the new format
                    value = reInterpretSignedValue(value, this.valueSize, oldParamInformation.format);
                    this._values.set(parameter, value);
                }
                this.setValue(ctx, ConfigurationCCValues.paramInformation(parameter), value);
            }
            return true;
        }
        reportsToFollow;
        defaultValues;
        isHandshakeResponse;
        valueSize;
        _values = new Map();
        get values() {
            return this._values;
        }
        getPartialCCSessionId() {
            // We don't expect the applHost to merge CCs but we want to wait until all reports have been received
            return {};
        }
        expectMoreMessages() {
            return this.reportsToFollow > 0;
        }
        toLogEntry(ctx) {
            const message = {
                "handshake response": this.isHandshakeResponse,
                "default values": this.defaultValues,
                "value size": this.valueSize,
                "reports to follow": this.reportsToFollow,
            };
            if (this._values.size > 0) {
                message.values = [...this._values]
                    .map(([param, value]) => `
· #${param}: ${configValueToString(value)}`)
                    .join("");
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ConfigurationCCBulkReport = _classThis;
})();
export { ConfigurationCCBulkReport };
let ConfigurationCCBulkGet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.BulkGet), expectedCCResponse(ConfigurationCCBulkReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCBulkGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCBulkGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this._parameters = options.parameters.sort();
            if (!isConsecutiveArray(this.parameters)) {
                throw new ZWaveError(`A ConfigurationCC.BulkGet can only be used for consecutive parameters`, ZWaveErrorCodes.CC_Invalid);
            }
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ConfigurationCCBulkGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        _parameters;
        get parameters() {
            return this._parameters;
        }
        serialize(ctx) {
            this.payload = new Bytes(3);
            this.payload.writeUInt16BE(this.parameters[0], 0);
            this.payload[2] = this.parameters.length;
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { parameters: this.parameters.join(", ") },
            };
        }
    };
    return ConfigurationCCBulkGet = _classThis;
})();
export { ConfigurationCCBulkGet };
let ConfigurationCCNameReport = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.NameReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCNameReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCNameReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.name = options.name;
            this.reportsToFollow = options.reportsToFollow;
        }
        static from(raw, ctx) {
            // Parameter and # of reports must be present
            validatePayload(raw.payload.length >= 3);
            const parameter = raw.payload.readUInt16BE(0);
            const reportsToFollow = raw.payload[2];
            if (reportsToFollow > 0) {
                // If more reports follow, the info must at least be one byte
                validatePayload(raw.payload.length >= 4);
            }
            const name = raw.payload.subarray(3).toString("utf8");
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                reportsToFollow,
                name,
            });
        }
        parameter;
        name;
        reportsToFollow;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Bitfield parameters that are not documented in a config file
            // are split into multiple partial parameters. We need to set the name for
            // all of them.
            const partialParams = this.getPartialParamInfos(ctx, this.parameter);
            if (partialParams.length === 0) {
                this.extendParamInformation(ctx, this.parameter, undefined, {
                    label: this.name,
                });
            }
            else {
                for (const param of partialParams) {
                    const paramNumber = param.property;
                    const bitMask = param.propertyKey;
                    const bitNumber = Math.log2(bitMask) % 1 === 0
                        ? Math.log2(bitMask)
                        : undefined;
                    let label = `${this.name} - ${bitMask}`;
                    if (bitNumber != undefined) {
                        label += ` (bit ${bitNumber})`;
                    }
                    this.extendParamInformation(ctx, paramNumber, bitMask, {
                        label,
                    });
                }
            }
            return true;
        }
        serialize(ctx) {
            const nameBuffer = Bytes.from(this.name, "utf8");
            this.payload = new Bytes(3 + nameBuffer.length);
            this.payload.writeUInt16BE(this.parameter, 0);
            this.payload[2] = this.reportsToFollow;
            this.payload.set(nameBuffer, 3);
            return super.serialize(ctx);
        }
        getPartialCCSessionId() {
            // Distinguish sessions by the parameter number
            return { parameter: this.parameter };
        }
        expectMoreMessages() {
            return this.reportsToFollow > 0;
        }
        mergePartialCCs(partials, _ctx) {
            // Concat the name
            this.name = [...partials, this]
                .map((report) => report.name)
                .reduce((prev, cur) => prev + cur, "");
            return Promise.resolve();
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "parameter #": this.parameter,
                    name: this.name,
                    "reports to follow": this.reportsToFollow,
                },
            };
        }
    };
    return ConfigurationCCNameReport = _classThis;
})();
export { ConfigurationCCNameReport };
let ConfigurationCCNameGet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.NameGet), expectedCCResponse(ConfigurationCCNameReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCNameGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCNameGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const parameter = raw.payload.readUInt16BE(0);
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        serialize(ctx) {
            this.payload = new Bytes(2);
            this.payload.writeUInt16BE(this.parameter, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "parameter #": this.parameter },
            };
        }
    };
    return ConfigurationCCNameGet = _classThis;
})();
export { ConfigurationCCNameGet };
let ConfigurationCCInfoReport = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.InfoReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCInfoReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCInfoReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.info = options.info;
            this.reportsToFollow = options.reportsToFollow;
        }
        static from(raw, ctx) {
            // Parameter and # of reports must be present
            validatePayload(raw.payload.length >= 3);
            const parameter = raw.payload.readUInt16BE(0);
            const reportsToFollow = raw.payload[2];
            if (reportsToFollow > 0) {
                // If more reports follow, the info must at least be one byte
                validatePayload(raw.payload.length >= 4);
            }
            const info = raw.payload.subarray(3).toString("utf8");
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                reportsToFollow,
                info,
            });
        }
        parameter;
        info;
        reportsToFollow;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Bitfield parameters that are not documented in a config file
            // are split into multiple partial parameters. We need to set the description for
            // all of them. However, these can get very long, so we put the reported
            // description on the first partial param, and refer to it from the others
            const partialParams = this.getPartialParamInfos(ctx, this.parameter).sort((a, b) => (a.propertyKey ?? 0)
                - (b.propertyKey ?? 0));
            if (partialParams.length === 0) {
                this.extendParamInformation(ctx, this.parameter, undefined, {
                    description: this.info,
                });
            }
            else {
                let firstParamLabel;
                for (const param of partialParams) {
                    const paramNumber = param.property;
                    const bitMask = param.propertyKey;
                    // We put the description on the first partial param
                    const description = firstParamLabel
                        ? `Refer to ${firstParamLabel}`
                        : this.info;
                    this.extendParamInformation(ctx, paramNumber, bitMask, {
                        description,
                    });
                    // Then we store the name of the first param to refer to it on the
                    // following partial params
                    if (firstParamLabel == undefined) {
                        firstParamLabel =
                            this.getParamInformation(ctx, paramNumber, bitMask)
                                .label ?? `parameter ${paramNumber} - ${bitMask}`;
                    }
                }
            }
            return true;
        }
        serialize(ctx) {
            const infoBuffer = Bytes.from(this.info, "utf8");
            this.payload = new Bytes(3 + infoBuffer.length);
            this.payload.writeUInt16BE(this.parameter, 0);
            this.payload[2] = this.reportsToFollow;
            this.payload.set(infoBuffer, 3);
            return super.serialize(ctx);
        }
        getPartialCCSessionId() {
            // Distinguish sessions by the parameter number
            return { parameter: this.parameter };
        }
        expectMoreMessages() {
            return this.reportsToFollow > 0;
        }
        mergePartialCCs(partials, _ctx) {
            // Concat the info
            this.info = [...partials, this]
                .map((report) => report.info)
                .reduce((prev, cur) => prev + cur, "");
            return Promise.resolve();
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "parameter #": this.parameter,
                    info: this.info,
                    "reports to follow": this.reportsToFollow,
                },
            };
        }
    };
    return ConfigurationCCInfoReport = _classThis;
})();
export { ConfigurationCCInfoReport };
let ConfigurationCCInfoGet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.InfoGet), expectedCCResponse(ConfigurationCCInfoReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCInfoGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCInfoGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const parameter = raw.payload.readUInt16BE(0);
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        serialize(ctx) {
            this.payload = new Bytes(2);
            this.payload.writeUInt16BE(this.parameter, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "parameter #": this.parameter },
            };
        }
    };
    return ConfigurationCCInfoGet = _classThis;
})();
export { ConfigurationCCInfoGet };
let ConfigurationCCPropertiesReport = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.PropertiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCPropertiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCPropertiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.valueSize = options.valueSize;
            this.valueFormat = options.valueFormat;
            if (this.valueSize > 0) {
                if (options.minValue == undefined) {
                    throw new ZWaveError("The minimum value must be set when the value size is non-zero", ZWaveErrorCodes.Argument_Invalid);
                }
                else if (options.maxValue == undefined) {
                    throw new ZWaveError("The maximum value must be set when the value size is non-zero", ZWaveErrorCodes.Argument_Invalid);
                }
                else if (options.defaultValue == undefined) {
                    throw new ZWaveError("The default value must be set when the value size is non-zero", ZWaveErrorCodes.Argument_Invalid);
                }
                this.minValue = options.minValue;
                this.maxValue = options.maxValue;
                this.defaultValue = options.defaultValue;
            }
            this.nextParameter = options.nextParameter;
            this.altersCapabilities = options.altersCapabilities;
            this.isReadonly = options.isReadonly;
            this.isAdvanced = options.isAdvanced;
            this.noBulkSupport = options.noBulkSupport;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const parameter = raw.payload.readUInt16BE(0);
            const valueFormat = (raw.payload[2] & 0b111000)
                >>> 3;
            const valueSize = raw.payload[2] & 0b111;
            // GH#1309 Some devices don't tell us the first parameter if we query #0
            // Instead, they contain 0x000000
            let nextParameter;
            if (valueSize === 0 && raw.payload.length < 5) {
                nextParameter = 0;
                return new this({
                    nodeId: ctx.sourceNodeId,
                    parameter,
                    valueFormat,
                    valueSize,
                    nextParameter,
                });
            }
            // Ensure the payload contains the two bytes for next parameter
            const nextParameterOffset = 3 + 3 * valueSize;
            validatePayload(raw.payload.length >= nextParameterOffset + 2);
            let minValue;
            let maxValue;
            let defaultValue;
            if (valueSize > 0) {
                if (valueFormat === ConfigValueFormat.BitField) {
                    minValue = 0;
                }
                else {
                    minValue = parseValue(raw.payload.subarray(3), valueSize, valueFormat);
                }
                maxValue = parseValue(raw.payload.subarray(3 + valueSize), valueSize, valueFormat);
                defaultValue = parseValue(raw.payload.subarray(3 + 2 * valueSize), valueSize, valueFormat);
            }
            nextParameter = raw.payload.readUInt16BE(nextParameterOffset);
            let altersCapabilities;
            let isReadonly;
            let isAdvanced;
            let noBulkSupport;
            if (raw.payload.length >= nextParameterOffset + 3) {
                // V4 adds an options byte after the next parameter and two bits in byte 2
                const options1 = raw.payload[2];
                const options2 = raw.payload[3 + 3 * valueSize + 2];
                altersCapabilities = !!(options1 & 0b1000_0000);
                isReadonly = !!(options1 & 0b0100_0000);
                isAdvanced = !!(options2 & 0b1);
                noBulkSupport = !!(options2 & 0b10);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                valueFormat,
                valueSize,
                nextParameter,
                minValue,
                maxValue,
                defaultValue,
                altersCapabilities,
                isReadonly,
                isAdvanced,
                noBulkSupport,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // If we actually received parameter info, store it
            if (this.valueSize > 0) {
                const baseInfo = {
                    type: "number",
                    format: this.valueFormat,
                    valueSize: this.valueSize,
                    requiresReInclusion: this.altersCapabilities,
                    readable: true,
                    writeable: !this.isReadonly,
                    allowManualEntry: true,
                    isAdvanced: this.isAdvanced,
                    noBulkSupport: this.noBulkSupport,
                    isFromConfig: false,
                };
                if (this.valueFormat !== ConfigValueFormat.BitField) {
                    // Do not override param information from a config file
                    if (!this.paramExistsInConfigFile(ctx, this.parameter)) {
                        const paramInfo = stripUndefined({
                            ...baseInfo,
                            min: this.minValue,
                            max: this.maxValue,
                            default: this.defaultValue,
                        });
                        this.extendParamInformation(ctx, this.parameter, undefined, paramInfo);
                    }
                }
                else {
                    // Bit fields are split into multiple single-bit partial parameters
                    const bits = this.maxValue;
                    let mask = 1;
                    while (mask <= bits) {
                        if (
                        // Only create partials that exist
                        !!(mask & bits)
                            // Do not override param information from a config file
                            && !this.paramExistsInConfigFile(ctx, this.parameter, mask)) {
                            const paramInfo = stripUndefined({
                                ...baseInfo,
                                min: 0,
                                max: 1,
                                default: this.defaultValue & mask ? 1 : 0,
                            });
                            this.extendParamInformation(ctx, this.parameter, mask, paramInfo);
                        }
                        // We must use multiplication here, as bitwise shifting works on signed 32-bit integers in JS
                        // which would create an infinite loop if maxValue === 0xffff_ffff
                        mask *= 2;
                    }
                }
            }
            return true;
        }
        parameter;
        valueSize;
        valueFormat;
        minValue;
        maxValue;
        defaultValue;
        nextParameter;
        altersCapabilities;
        isReadonly;
        isAdvanced;
        noBulkSupport;
        serialize(ctx) {
            this.payload = new Bytes(3 // preamble
                + 3 * this.valueSize // min, max, default value
                + 2 // next parameter
                + 1);
            this.payload.writeUInt16BE(this.parameter, 0);
            const options1 = (this.altersCapabilities ? 0b1000_0000 : 0)
                | (this.isReadonly ? 0b0100_0000 : 0)
                | ((this.valueFormat & 0b111) << 3)
                | (this.valueSize & 0b111);
            this.payload[2] = options1;
            let offset = 3;
            if (this.valueSize > 0) {
                serializeValue(this.payload, offset, this.valueSize, this.valueFormat, this.minValue);
                offset += this.valueSize;
                serializeValue(this.payload, offset, this.valueSize, this.valueFormat, this.maxValue);
                offset += this.valueSize;
                serializeValue(this.payload, offset, this.valueSize, this.valueFormat, this.defaultValue);
                offset += this.valueSize;
            }
            this.payload.writeUInt16BE(this.nextParameter, offset);
            offset += 2;
            const options2 = (this.isAdvanced ? 0b1 : 0)
                | (this.noBulkSupport ? 0b10 : 0);
            this.payload[offset] = options2;
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "parameter #": this.parameter,
                "next param #": this.nextParameter,
                "value size": this.valueSize,
                "value format": getEnumMemberName(ConfigValueFormat, this.valueFormat),
            };
            if (this.minValue != undefined) {
                message["min value"] = configValueToString(this.minValue);
            }
            if (this.maxValue != undefined) {
                message["max value"] = configValueToString(this.maxValue);
            }
            if (this.defaultValue != undefined) {
                message["default value"] = configValueToString(this.defaultValue);
            }
            if (this.altersCapabilities != undefined) {
                message["alters capabilities"] = this.altersCapabilities;
            }
            if (this.isReadonly != undefined) {
                message.readonly = this.isReadonly;
            }
            if (this.isAdvanced != undefined) {
                message.advanced = this.isAdvanced;
            }
            if (this.noBulkSupport != undefined) {
                message["bulk support"] = !this.noBulkSupport;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ConfigurationCCPropertiesReport = _classThis;
})();
export { ConfigurationCCPropertiesReport };
let ConfigurationCCPropertiesGet = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.PropertiesGet), expectedCCResponse(ConfigurationCCPropertiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCPropertiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCPropertiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const parameter = raw.payload.readUInt16BE(0);
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        serialize(ctx) {
            this.payload = new Bytes(2);
            this.payload.writeUInt16BE(this.parameter, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "parameter #": this.parameter },
            };
        }
    };
    return ConfigurationCCPropertiesGet = _classThis;
})();
export { ConfigurationCCPropertiesGet };
let ConfigurationCCDefaultReset = (() => {
    let _classDecorators = [CCCommand(ConfigurationCommand.DefaultReset)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ConfigurationCC;
    var ConfigurationCCDefaultReset = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConfigurationCCDefaultReset = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ConfigurationCCDefaultReset = _classThis;
})();
export { ConfigurationCCDefaultReset };
function isSafeValue(value, size, format) {
    let minValue;
    let maxValue;
    switch (format) {
        case ConfigValueFormat.SignedInteger:
            minValue = -Math.pow(2, 8 * size - 1);
            maxValue = Math.pow(2, 8 * size - 1) - 1;
            break;
        case ConfigValueFormat.UnsignedInteger:
        case ConfigValueFormat.Enumerated:
        case ConfigValueFormat.BitField:
            minValue = 0;
            maxValue = Math.pow(2, 8 * size);
            break;
        default:
            throw new Error("not implemented");
    }
    return minValue <= value && value <= maxValue;
}
/** Interprets values from the payload depending on the value format */
function parseValue(raw, size, format) {
    switch (format) {
        case ConfigValueFormat.SignedInteger:
            return raw.readIntBE(0, size);
        case ConfigValueFormat.UnsignedInteger:
        case ConfigValueFormat.Enumerated:
        case ConfigValueFormat.BitField:
            return raw.readUIntBE(0, size);
    }
}
function throwInvalidValueError(value, parameter, valueSize, valueFormat) {
    throw new ZWaveError(`The value ${value} is invalid for configuration parameter ${parameter} (size = ${valueSize}, format = ${getEnumMemberName(ConfigValueFormat, valueFormat)})!`, ZWaveErrorCodes.Argument_Invalid);
}
function tryCatchOutOfBoundsError(e, value, parameter, valueSize, valueFormat) {
    if (e.message.includes("out of bounds")) {
        throwInvalidValueError(value, parameter, valueSize, valueFormat);
    }
    else {
        throw e;
    }
}
/** Serializes values into the payload according to the value format */
function serializeValue(payload, offset, size, format, value) {
    switch (format) {
        case ConfigValueFormat.SignedInteger:
            payload.writeIntBE(value, offset, size);
            return;
        case ConfigValueFormat.UnsignedInteger:
        case ConfigValueFormat.Enumerated:
        case ConfigValueFormat.BitField:
            payload.writeUIntBE(value, offset, size);
            return;
    }
}
//# sourceMappingURL=ConfigurationCC.js.map