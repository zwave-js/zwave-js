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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeFloatWithScale, enumValuesToMetadataStates, parseFloatWithScale, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { irrigationValveIdToMetadataPrefix } from "../lib/CCValueUtils.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { IrrigationCommand, IrrigationSensorPolarity, ValveType, } from "../lib/_Types.js";
export const IrrigationCCValues = V.defineCCValues(CommandClasses.Irrigation, {
    ...V.staticProperty("numValves", undefined, { internal: true }),
    ...V.staticProperty("numValveTables", undefined, { internal: true }),
    ...V.staticProperty("supportsMasterValve", undefined, {
        internal: true,
    }),
    ...V.staticProperty("maxValveTableSize", undefined, { internal: true }),
    ...V.staticProperty("systemVoltage", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "System voltage",
        unit: "V",
    }),
    ...V.staticProperty("masterValveDelay", {
        ...ValueMetadata.UInt8,
        label: "Master valve delay",
        description: "The delay between turning on the master valve and turning on any zone valve",
        unit: "seconds",
    }),
    ...V.staticProperty("flowSensorActive", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Flow sensor active",
    }),
    ...V.staticProperty("pressureSensorActive", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Pressure sensor active",
    }),
    ...V.staticProperty("rainSensorActive", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Rain sensor attached and active",
    }),
    ...V.staticProperty("rainSensorPolarity", {
        ...ValueMetadata.Number,
        label: "Rain sensor polarity",
        min: 0,
        max: 1,
        states: enumValuesToMetadataStates(IrrigationSensorPolarity),
    }),
    ...V.staticProperty("moistureSensorActive", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Moisture sensor attached and active",
    }),
    ...V.staticProperty("moistureSensorPolarity", {
        ...ValueMetadata.Number,
        label: "Moisture sensor polarity",
        min: 0,
        max: 1,
        states: enumValuesToMetadataStates(IrrigationSensorPolarity),
    }),
    ...V.staticProperty("flow", {
        ...ValueMetadata.ReadOnlyNumber,
        label: "Flow",
        unit: "l/h",
    }),
    ...V.staticProperty("pressure", {
        ...ValueMetadata.ReadOnlyNumber,
        label: "Pressure",
        unit: "kPa",
    }),
    ...V.staticProperty("shutoffDuration", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Remaining shutoff duration",
        unit: "hours",
    }),
    ...V.staticProperty("errorNotProgrammed", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Error: device not programmed",
    }),
    ...V.staticProperty("errorEmergencyShutdown", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Error: emergency shutdown",
    }),
    ...V.staticProperty("errorHighPressure", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Error: high pressure",
    }),
    ...V.staticProperty("highPressureThreshold", {
        ...ValueMetadata.Number,
        label: "High pressure threshold",
        unit: "kPa",
    }),
    ...V.staticProperty("errorLowPressure", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Error: low pressure",
    }),
    ...V.staticProperty("lowPressureThreshold", {
        ...ValueMetadata.Number,
        label: "Low pressure threshold",
        unit: "kPa",
    }),
    ...V.staticProperty("errorValve", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Error: valve reporting error",
    }),
    ...V.staticProperty("masterValveOpen", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Master valve is open",
    }),
    ...V.staticProperty("firstOpenZoneId", {
        ...ValueMetadata.ReadOnlyNumber,
        label: "First open zone valve ID",
    }),
    ...V.staticPropertyWithName("shutoffSystem", "shutoff", {
        ...ValueMetadata.WriteOnlyBoolean,
        label: `Shutoff system`,
        states: {
            true: "Shutoff",
        },
    }),
    ...V.dynamicPropertyAndKeyWithName("valveConnected", (valveId) => valveId, "valveConnected", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "valveConnected", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Connected`,
    })),
    ...V.dynamicPropertyAndKeyWithName("nominalCurrent", (valveId) => valveId, "nominalCurrent", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "nominalCurrent", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Nominal current`,
        unit: "mA",
    })),
    ...V.dynamicPropertyAndKeyWithName("nominalCurrentHighThreshold", (valveId) => valveId, "nominalCurrentHighThreshold", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "nominalCurrentHighThreshold", (valveId) => ({
        ...ValueMetadata.Number,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Nominal current - high threshold`,
        min: 0,
        max: 2550,
        unit: "mA",
    })),
    ...V.dynamicPropertyAndKeyWithName("nominalCurrentLowThreshold", (valveId) => valveId, "nominalCurrentLowThreshold", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "nominalCurrentLowThreshold", (valveId) => ({
        ...ValueMetadata.Number,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Nominal current - low threshold`,
        min: 0,
        max: 2550,
        unit: "mA",
    })),
    ...V.dynamicPropertyAndKeyWithName("errorShortCircuit", (valveId) => valveId, "errorShortCircuit", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "errorShortCircuit", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Short circuit detected`,
    })),
    ...V.dynamicPropertyAndKeyWithName("errorHighCurrent", (valveId) => valveId, "errorHighCurrent", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "errorHighCurrent", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Current above high threshold`,
    })),
    ...V.dynamicPropertyAndKeyWithName("errorLowCurrent", (valveId) => valveId, "errorLowCurrent", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "errorLowCurrent", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Current below low threshold`,
    })),
    ...V.dynamicPropertyAndKeyWithName("maximumFlow", (valveId) => valveId, "maximumFlow", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "maximumFlow", (valveId) => ({
        ...ValueMetadata.Number,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Maximum flow`,
        min: 0,
        unit: "l/h",
    })),
    ...V.dynamicPropertyAndKeyWithName("errorMaximumFlow", (valveId) => valveId, "errorMaximumFlow", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "errorMaximumFlow", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Maximum flow detected`,
    })),
    ...V.dynamicPropertyAndKeyWithName("highFlowThreshold", (valveId) => valveId, "highFlowThreshold", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "highFlowThreshold", (valveId) => ({
        ...ValueMetadata.Number,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: High flow threshold`,
        min: 0,
        unit: "l/h",
    })),
    ...V.dynamicPropertyAndKeyWithName("errorHighFlow", (valveId) => valveId, "errorHighFlow", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "errorHighFlow", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Flow above high threshold`,
    })),
    ...V.dynamicPropertyAndKeyWithName("lowFlowThreshold", (valveId) => valveId, "lowFlowThreshold", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "lowFlowThreshold", (valveId) => ({
        ...ValueMetadata.Number,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Low flow threshold`,
        min: 0,
        unit: "l/h",
    })),
    ...V.dynamicPropertyAndKeyWithName("errorLowFlow", (valveId) => valveId, "errorLowFlow", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "errorLowFlow", (valveId) => ({
        ...ValueMetadata.ReadOnlyBoolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Flow below high threshold`,
    })),
    ...V.dynamicPropertyAndKeyWithName("useRainSensor", (valveId) => valveId, "useRainSensor", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "useRainSensor", (valveId) => ({
        ...ValueMetadata.Boolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Use rain sensor`,
    })),
    ...V.dynamicPropertyAndKeyWithName("useMoistureSensor", (valveId) => valveId, "useMoistureSensor", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "useMoistureSensor", (valveId) => ({
        ...ValueMetadata.Boolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Use moisture sensor`,
    })),
    ...V.dynamicPropertyAndKeyWithName("valveRunDuration", (valveId) => valveId, "duration", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "duration", (valveId) => ({
        ...ValueMetadata.UInt16,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Run duration`,
        min: 1,
        unit: "s",
    })),
    ...V.dynamicPropertyAndKeyWithName("valveRunStartStop", (valveId) => valveId, "startStop", ({ property, propertyKey }) => (typeof property === "number" || property === "master")
        && propertyKey === "startStop", (valveId) => ({
        ...ValueMetadata.Boolean,
        label: `${irrigationValveIdToMetadataPrefix(valveId)}: Start/Stop`,
        states: {
            true: "Start",
            false: "Stop",
        },
    })),
});
const systemConfigProperties = [
    "masterValveDelay",
    "highPressureThreshold",
    "lowPressureThreshold",
    "rainSensorPolarity",
    "moistureSensorPolarity",
];
const valveConfigPropertyKeys = [
    "nominalCurrentHighThreshold",
    "nominalCurrentLowThreshold",
    "maximumFlow",
    "highFlowThreshold",
    "lowFlowThreshold",
    "useRainSensor",
    "useMoistureSensor",
];
let IrrigationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Irrigation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _setSystemConfig_decorators;
    let _getValveInfo_decorators;
    let _setValveConfig_decorators;
    let _getValveConfig_decorators;
    let _runValve_decorators;
    let _shutoffValve_decorators;
    let _setValveTable_decorators;
    let _getValveTable_decorators;
    let _runTables_decorators;
    let _shutoffSystem_decorators;
    var IrrigationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _setSystemConfig_decorators, { kind: "method", name: "setSystemConfig", static: false, private: false, access: { has: obj => "setSystemConfig" in obj, get: obj => obj.setSystemConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getValveInfo_decorators, { kind: "method", name: "getValveInfo", static: false, private: false, access: { has: obj => "getValveInfo" in obj, get: obj => obj.getValveInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setValveConfig_decorators, { kind: "method", name: "setValveConfig", static: false, private: false, access: { has: obj => "setValveConfig" in obj, get: obj => obj.setValveConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getValveConfig_decorators, { kind: "method", name: "getValveConfig", static: false, private: false, access: { has: obj => "getValveConfig" in obj, get: obj => obj.getValveConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _runValve_decorators, { kind: "method", name: "runValve", static: false, private: false, access: { has: obj => "runValve" in obj, get: obj => obj.runValve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _shutoffValve_decorators, { kind: "method", name: "shutoffValve", static: false, private: false, access: { has: obj => "shutoffValve" in obj, get: obj => obj.shutoffValve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setValveTable_decorators, { kind: "method", name: "setValveTable", static: false, private: false, access: { has: obj => "setValveTable" in obj, get: obj => obj.setValveTable }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getValveTable_decorators, { kind: "method", name: "getValveTable", static: false, private: false, access: { has: obj => "getValveTable" in obj, get: obj => obj.getValveTable }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _runTables_decorators, { kind: "method", name: "runTables", static: false, private: false, access: { has: obj => "runTables" in obj, get: obj => obj.runTables }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _shutoffSystem_decorators, { kind: "method", name: "shutoffSystem", static: false, private: false, access: { has: obj => "shutoffSystem" in obj, get: obj => obj.shutoffSystem }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case IrrigationCommand.SystemInfoGet:
                case IrrigationCommand.SystemStatusGet:
                case IrrigationCommand.SystemConfigSet:
                case IrrigationCommand.SystemConfigGet:
                case IrrigationCommand.ValveInfoGet:
                case IrrigationCommand.ValveConfigSet:
                case IrrigationCommand.ValveConfigGet:
                case IrrigationCommand.ValveRun:
                case IrrigationCommand.ValveTableSet:
                case IrrigationCommand.ValveTableGet:
                case IrrigationCommand.ValveTableRun:
                case IrrigationCommand.SystemShutoff:
                    // These are all mandatory in V1
                    return true;
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSystemInfo() {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.SystemInfoGet);
            const cc = new IrrigationCCSystemInfoGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "numValves",
                    "numValveTables",
                    "supportsMasterValve",
                    "maxValveTableSize",
                ]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSystemStatus() {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.SystemStatusGet);
            const cc = new IrrigationCCSystemStatusGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "systemVoltage",
                    "flowSensorActive",
                    "pressureSensorActive",
                    "rainSensorActive",
                    "moistureSensorActive",
                    "flow",
                    "pressure",
                    "shutoffDuration",
                    "errorNotProgrammed",
                    "errorEmergencyShutdown",
                    "errorHighPressure",
                    "errorLowPressure",
                    "errorValve",
                    "masterValveOpen",
                    "firstOpenZoneId",
                ]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSystemConfig() {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.SystemConfigGet);
            const cc = new IrrigationCCSystemConfigGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "masterValveDelay",
                    "highPressureThreshold",
                    "lowPressureThreshold",
                    "rainSensorPolarity",
                    "moistureSensorPolarity",
                ]);
            }
        }
        async setSystemConfig(config) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.SystemConfigSet);
            const cc = new IrrigationCCSystemConfigSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...config,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getValveInfo(valveId) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveInfoGet);
            const cc = new IrrigationCCValveInfoGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                valveId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "connected",
                    "nominalCurrent",
                    "errorShortCircuit",
                    "errorHighCurrent",
                    "errorLowCurrent",
                    "errorMaximumFlow",
                    "errorHighFlow",
                    "errorLowFlow",
                ]);
            }
        }
        async setValveConfig(options) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveConfigSet);
            const cc = new IrrigationCCValveConfigSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getValveConfig(valveId) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveConfigGet);
            const cc = new IrrigationCCValveConfigGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                valveId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "nominalCurrentHighThreshold",
                    "nominalCurrentLowThreshold",
                    "maximumFlow",
                    "highFlowThreshold",
                    "lowFlowThreshold",
                    "useRainSensor",
                    "useMoistureSensor",
                ]);
            }
        }
        async runValve(valveId, duration) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveRun);
            const cc = new IrrigationCCValveRun({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                valveId,
                duration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        shutoffValve(valveId) {
            return this.runValve(valveId, 0);
        }
        async setValveTable(tableId, entries) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveTableSet);
            if (!this.endpoint.virtual) {
                const maxValveTableSize = IrrigationCC.getMaxValveTableSizeCached(this.host, this.endpoint);
                if (maxValveTableSize != undefined
                    && entries.length > maxValveTableSize) {
                    throw new ZWaveError(`The number of valve table entries must not exceed ${maxValveTableSize}.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            const cc = new IrrigationCCValveTableSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                tableId,
                entries,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getValveTable(tableId) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveTableGet);
            const cc = new IrrigationCCValveTableGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                tableId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return response?.entries;
            }
        }
        async runTables(tableIDs) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.ValveTableRun);
            const cc = new IrrigationCCValveTableRun({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                tableIDs,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Shuts off the entire system for the given duration.
         * @param duration Shutoff duration in hours. A value of 255 will shut off the entire system permanently and prevents schedules from running.
         */
        async shutoffSystem(duration) {
            this.assertSupportsCommand(IrrigationCommand, IrrigationCommand.SystemShutoff);
            const cc = new IrrigationCCSystemShutoff({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                duration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /** Shuts off the entire system permanently and prevents schedules from running */
        shutoffSystemPermanently() {
            return this.shutoffSystem(255);
        }
        get [(_setSystemConfig_decorators = [validateArgs({ strictEnums: true })], _getValveInfo_decorators = [validateArgs()], _setValveConfig_decorators = [validateArgs()], _getValveConfig_decorators = [validateArgs()], _runValve_decorators = [validateArgs()], _shutoffValve_decorators = [validateArgs()], _setValveTable_decorators = [validateArgs()], _getValveTable_decorators = [validateArgs()], _runTables_decorators = [validateArgs()], _shutoffSystem_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property, propertyKey }, value) {
                const valueDB = this.getValueDB();
                if (systemConfigProperties.includes(property)) {
                    const options = {};
                    for (const prop of systemConfigProperties) {
                        if (prop === property)
                            continue;
                        const valueId = {
                            commandClass: this.ccId,
                            endpoint: this.endpoint.index,
                            property: prop,
                        };
                        const cachedVal = valueDB.getValue(valueId);
                        if (cachedVal == undefined) {
                            throw new ZWaveError(`The "${property}" property cannot be changed before ${prop} is known!`, ZWaveErrorCodes.Argument_Invalid);
                        }
                        options[prop] = cachedVal;
                    }
                    options[property] =
                        value;
                    return this.setSystemConfig(options);
                }
                else if (property === "shutoff") {
                    return this.shutoffSystem(0);
                }
                else if (property === "master"
                    || (typeof property === "number" && property >= 1)) {
                    // This is a value of a valve
                    if (propertyKey == undefined) {
                        throwMissingPropertyKey(this.ccId, property);
                    }
                    if (valveConfigPropertyKeys.includes(propertyKey)) {
                        const options = {
                            valveId: property,
                        };
                        for (const prop of valveConfigPropertyKeys) {
                            if (prop === propertyKey)
                                continue;
                            const valueId = {
                                commandClass: this.ccId,
                                endpoint: this.endpoint.index,
                                property,
                                propertyKey: prop,
                            };
                            const cachedVal = valueDB.getValue(valueId);
                            if (cachedVal == undefined) {
                                throw new ZWaveError(`The "${property}_${propertyKey}" property cannot be changed before ${property}_${prop} is known!`, ZWaveErrorCodes.Argument_Invalid);
                            }
                            options[prop] = cachedVal;
                        }
                        options[propertyKey] = value;
                        return this.setValveConfig(options);
                    }
                    else if (propertyKey === "duration") {
                        // The run duration needs to be set separately from triggering the run
                        // So this is okay
                        return;
                    }
                    else if (propertyKey === "startStop") {
                        // Trigger or stop a valve run, depending on the value
                        if (typeof value !== "boolean") {
                            throwWrongValueType(this.ccId, property, "boolean", typeof value);
                        }
                        if (value) {
                            // Start a valve run
                            const duration = valueDB.getValue(IrrigationCCValues.valveRunDuration(property).endpoint(this.endpoint.index));
                            if (duration == undefined) {
                                throw new ZWaveError(`Cannot start a valve run without specifying a duration first!`, ZWaveErrorCodes.Argument_Invalid);
                            }
                            return this.runValve(property, duration);
                        }
                        else {
                            // Stop a valve run
                            return this.shutoffValve(property);
                        }
                    }
                    else {
                        throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                    }
                }
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "systemVoltage":
                    case "flowSensorActive":
                    case "pressureSensorActive":
                    case "rainSensorActive":
                    case "moistureSensorActive":
                    case "flow":
                    case "pressure":
                    case "shutoffDuration":
                    case "errorNotProgrammed":
                    case "errorEmergencyShutdown":
                    case "errorHighPressure":
                    case "errorLowPressure":
                    case "errorValve":
                    case "masterValveOpen":
                    case "firstOpenZoneId":
                        return (await this.getSystemStatus())?.[property];
                    case "masterValveDelay":
                    case "highPressureThreshold":
                    case "lowPressureThreshold":
                    case "rainSensorPolarity":
                    case "moistureSensorPolarity":
                        return (await this.getSystemConfig())?.[property];
                }
                if (property === "master"
                    || (typeof property === "number" && property >= 1)) {
                    // This is a value of a valve
                    switch (propertyKey) {
                        case "connected":
                        case "nominalCurrent":
                        case "errorShortCircuit":
                        case "errorHighCurrent":
                        case "errorLowCurrent":
                        case "errorMaximumFlow":
                        case "errorHighFlow":
                        case "errorLowFlow":
                            return (await this.getValveInfo(property))?.[propertyKey];
                        case "nominalCurrentHighThreshold":
                        case "nominalCurrentLowThreshold":
                        case "maximumFlow":
                        case "highFlowThreshold":
                        case "lowFlowThreshold":
                        case "useRainSensor":
                        case "useMoistureSensor":
                            return (await this.getValveConfig(property))?.[propertyKey];
                        case undefined:
                            throwMissingPropertyKey(this.ccId, property);
                        default:
                            throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                    }
                }
                throwUnsupportedProperty(this.ccId, property);
            };
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return IrrigationCCAPI = _classThis;
})();
export { IrrigationCCAPI };
let IrrigationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Irrigation), implementedVersion(1), ccValues(IrrigationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var IrrigationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * Returns the maximum number of valve table entries reported by the node.
         * This only works AFTER the node has been interviewed.
         */
        static getMaxValveTableSizeCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(IrrigationCCValues.maxValveTableSize.endpoint(endpoint.index));
        }
        /**
         * Returns the number of zone valves reported by the node.
         * This only works AFTER the node has been interviewed.
         */
        static getNumValvesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(IrrigationCCValues.numValves.endpoint(endpoint.index));
        }
        /**
         * Returns whether the node supports a master valve
         * This only works AFTER the node has been interviewed.
         */
        static supportsMasterValveCached(ctx, endpoint) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(IrrigationCCValues.supportsMasterValve.endpoint(endpoint.index));
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Irrigation, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "Querying irrigation system info...",
                direction: "outbound",
            });
            const systemInfo = await api.getSystemInfo();
            if (!systemInfo) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Time out while querying irrigation system info, skipping interview...",
                    level: "warn",
                });
                return;
            }
            const logMessage = `received irrigation system info:
supports master valve: ${systemInfo.supportsMasterValve}
no. of valves:         ${systemInfo.numValves}
no. of valve tables:   ${systemInfo.numValveTables}
max. valve table size: ${systemInfo.maxValveTableSize}`;
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: logMessage,
                direction: "inbound",
            });
            // For each valve, create the values to start/stop a run
            for (let i = 1; i <= systemInfo.numValves; i++) {
                this.ensureMetadata(ctx, IrrigationCCValues.valveRunDuration(i));
                this.ensureMetadata(ctx, IrrigationCCValues.valveRunStartStop(i));
            }
            // And create a shutoff value
            this.ensureMetadata(ctx, IrrigationCCValues.shutoffSystem);
            // Query current values
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Irrigation, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the current system config
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "Querying irrigation system configuration...",
                direction: "outbound",
            });
            const systemConfig = await api.getSystemConfig();
            if (systemConfig) {
                let logMessage = `received irrigation system configuration:
master valve delay:       ${systemConfig.masterValveDelay} seconds
high pressure threshold:  ${systemConfig.highPressureThreshold} kPa
low pressure threshold:   ${systemConfig.lowPressureThreshold} kPa`;
                if (systemConfig.rainSensorPolarity != undefined) {
                    logMessage += `
rain sensor polarity:     ${getEnumMemberName(IrrigationSensorPolarity, systemConfig.rainSensorPolarity)}`;
                }
                if (systemConfig.moistureSensorPolarity != undefined) {
                    logMessage += `
moisture sensor polarity: ${getEnumMemberName(IrrigationSensorPolarity, systemConfig.moistureSensorPolarity)}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            // and status
            // Query the current system config
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "Querying irrigation system status...",
                direction: "outbound",
            });
            await api.getSystemStatus();
            // for each valve, query the current status and configuration
            if (IrrigationCC.supportsMasterValveCached(ctx, endpoint)) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying master valve configuration...",
                    direction: "outbound",
                });
                await api.getValveConfig("master");
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying master valve status...",
                    direction: "outbound",
                });
                await api.getValveInfo("master");
            }
            for (let i = 1; i <= (IrrigationCC.getNumValvesCached(ctx, endpoint) ?? 0); i++) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Querying configuration for valve ${i.toString().padStart(3, "0")}...`,
                    direction: "outbound",
                });
                await api.getValveConfig(i);
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Querying status for valve ${i.toString().padStart(3, "0")}...`,
                    direction: "outbound",
                });
                await api.getValveInfo(i);
            }
        }
        translateProperty(ctx, property, propertyKey) {
            if (property === "master") {
                return "Master valve";
            }
            else if (typeof property === "number") {
                return `Valve ${property.toString().padStart(3, "0")}`;
            }
            return super.translateProperty(ctx, property, propertyKey);
        }
    };
    return IrrigationCC = _classThis;
})();
export { IrrigationCC };
let IrrigationCCSystemInfoReport = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemInfoReport), ccValueProperty("numValves", IrrigationCCValues.numValves), ccValueProperty("numValveTables", IrrigationCCValues.numValveTables), ccValueProperty("supportsMasterValve", IrrigationCCValues.supportsMasterValve), ccValueProperty("maxValveTableSize", IrrigationCCValues.maxValveTableSize)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemInfoReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemInfoReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportsMasterValve = options.supportsMasterValve;
            this.numValves = options.numValves;
            this.numValveTables = options.numValveTables;
            this.maxValveTableSize = options.maxValveTableSize;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const supportsMasterValve = !!(raw.payload[0] & 0x01);
            const numValves = raw.payload[1];
            const numValveTables = raw.payload[2];
            const maxValveTableSize = raw.payload[3] & 0b1111;
            return new this({
                nodeId: ctx.sourceNodeId,
                supportsMasterValve,
                numValves,
                numValveTables,
                maxValveTableSize,
            });
        }
        numValves;
        numValveTables;
        supportsMasterValve;
        maxValveTableSize;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supports master valve": this.supportsMasterValve,
                    "no. of valves": this.numValves,
                    "no. of valve tables": this.numValveTables,
                    "max. valve table size": this.maxValveTableSize,
                },
            };
        }
    };
    return IrrigationCCSystemInfoReport = _classThis;
})();
export { IrrigationCCSystemInfoReport };
let IrrigationCCSystemInfoGet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemInfoGet), expectedCCResponse(IrrigationCCSystemInfoReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemInfoGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemInfoGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return IrrigationCCSystemInfoGet = _classThis;
})();
export { IrrigationCCSystemInfoGet };
let IrrigationCCSystemStatusReport = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemStatusReport), ccValueProperty("systemVoltage", IrrigationCCValues.systemVoltage), ccValueProperty("flowSensorActive", IrrigationCCValues.flowSensorActive), ccValueProperty("pressureSensorActive", IrrigationCCValues.pressureSensorActive), ccValueProperty("rainSensorActive", IrrigationCCValues.rainSensorActive), ccValueProperty("moistureSensorActive", IrrigationCCValues.moistureSensorActive), ccValueProperty("flow", IrrigationCCValues.flow), ccValueProperty("pressure", IrrigationCCValues.pressure), ccValueProperty("shutoffDuration", IrrigationCCValues.shutoffDuration), ccValueProperty("errorNotProgrammed", IrrigationCCValues.errorNotProgrammed), ccValueProperty("errorEmergencyShutdown", IrrigationCCValues.errorEmergencyShutdown), ccValueProperty("errorHighPressure", IrrigationCCValues.errorHighPressure), ccValueProperty("errorLowPressure", IrrigationCCValues.errorLowPressure), ccValueProperty("errorValve", IrrigationCCValues.errorValve), ccValueProperty("masterValveOpen", IrrigationCCValues.masterValveOpen), ccValueProperty("firstOpenZoneId", IrrigationCCValues.firstOpenZoneId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemStatusReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemStatusReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.systemVoltage = options.systemVoltage;
            this.flowSensorActive = options.flowSensorActive;
            this.pressureSensorActive = options.pressureSensorActive;
            this.rainSensorActive = options.rainSensorActive;
            this.moistureSensorActive = options.moistureSensorActive;
            this.flow = options.flow;
            this.pressure = options.pressure;
            this.shutoffDuration = options.shutoffDuration;
            this.errorNotProgrammed = options.errorNotProgrammed;
            this.errorEmergencyShutdown = options.errorEmergencyShutdown;
            this.errorHighPressure = options.errorHighPressure;
            this.errorLowPressure = options.errorLowPressure;
            this.errorValve = options.errorValve;
            this.masterValveOpen = options.masterValveOpen;
            this.firstOpenZoneId = options.firstOpenZoneId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const systemVoltage = raw.payload[0];
            const flowSensorActive = !!(raw.payload[1] & 0x01);
            const pressureSensorActive = !!(raw.payload[1] & 0x02);
            const rainSensorActive = !!(raw.payload[1] & 0x04);
            const moistureSensorActive = !!(raw.payload[1] & 0x08);
            let offset = 2;
            let flow;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0);
                if (flowSensorActive)
                    flow = value;
                offset += bytesRead;
            }
            let pressure;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0);
                if (pressureSensorActive)
                    pressure = value;
                offset += bytesRead;
            }
            validatePayload(raw.payload.length >= offset + 4);
            const shutoffDuration = raw.payload[offset];
            const errorNotProgrammed = !!(raw.payload[offset + 1] & 0x01);
            const errorEmergencyShutdown = !!(raw.payload[offset + 1] & 0x02);
            const errorHighPressure = !!(raw.payload[offset + 1] & 0x04);
            const errorLowPressure = !!(raw.payload[offset + 1] & 0x08);
            const errorValve = !!(raw.payload[offset + 1] & 0x10);
            const masterValveOpen = !!(raw.payload[offset + 2] & 0x01);
            let firstOpenZoneId;
            if (raw.payload[offset + 3]) {
                firstOpenZoneId = raw.payload[offset + 3];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                systemVoltage,
                flowSensorActive,
                pressureSensorActive,
                rainSensorActive,
                moistureSensorActive,
                flow,
                pressure,
                shutoffDuration,
                errorNotProgrammed,
                errorEmergencyShutdown,
                errorHighPressure,
                errorLowPressure,
                errorValve,
                masterValveOpen,
                firstOpenZoneId,
            });
        }
        systemVoltage;
        flowSensorActive;
        pressureSensorActive;
        rainSensorActive;
        moistureSensorActive;
        flow;
        pressure;
        shutoffDuration;
        errorNotProgrammed;
        errorEmergencyShutdown;
        errorHighPressure;
        errorLowPressure;
        errorValve;
        masterValveOpen;
        firstOpenZoneId;
        toLogEntry(ctx) {
            const message = {
                "system voltage": `${this.systemVoltage} V`,
                "active sensors": [
                    this.flowSensorActive ? "flow" : undefined,
                    this.pressureSensorActive ? "pressure" : undefined,
                    this.rainSensorActive ? "rain" : undefined,
                    this.moistureSensorActive ? "moisture" : undefined,
                ]
                    .filter(Boolean)
                    .join(", "),
            };
            if (this.flow != undefined) {
                message.flow = `${this.flow} l/h`;
            }
            if (this.pressure != undefined) {
                message.pressure = `${this.pressure} kPa`;
            }
            message["remaining shutoff duration"] = `${this.shutoffDuration} hours`;
            message["master valve status"] = this.masterValveOpen
                ? "open"
                : "closed";
            message["first open zone valve"] = this.firstOpenZoneId || "none";
            const errors = [
                this.errorNotProgrammed ? "device not programmed" : undefined,
                this.errorEmergencyShutdown ? "emergency shutdown" : undefined,
                this.errorHighPressure
                    ? "high pressure threshold triggered"
                    : undefined,
                this.errorLowPressure
                    ? "low pressure threshold triggered"
                    : undefined,
                this.errorValve
                    ? "a valve or the master valve has an error"
                    : undefined,
            ].filter(Boolean);
            if (errors.length > 0) {
                message.errors = errors.map((e) => `\n· ${e}`).join("");
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCSystemStatusReport = _classThis;
})();
export { IrrigationCCSystemStatusReport };
let IrrigationCCSystemStatusGet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemStatusGet), expectedCCResponse(IrrigationCCSystemStatusReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemStatusGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemStatusGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return IrrigationCCSystemStatusGet = _classThis;
})();
export { IrrigationCCSystemStatusGet };
let IrrigationCCSystemConfigSet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemConfigSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemConfigSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemConfigSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.masterValveDelay = options.masterValveDelay;
            this.highPressureThreshold = options.highPressureThreshold;
            this.lowPressureThreshold = options.lowPressureThreshold;
            this.rainSensorPolarity = options.rainSensorPolarity;
            this.moistureSensorPolarity = options.moistureSensorPolarity;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCSystemConfigSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        masterValveDelay;
        highPressureThreshold;
        lowPressureThreshold;
        rainSensorPolarity;
        moistureSensorPolarity;
        serialize(ctx) {
            let polarity = 0;
            if (this.rainSensorPolarity != undefined)
                polarity |= 0b1;
            if (this.moistureSensorPolarity != undefined)
                polarity |= 0b10;
            if (this.rainSensorPolarity == undefined
                && this.moistureSensorPolarity == undefined) {
                // Valid bit
                polarity |= 0b1000_0000;
            }
            this.payload = Bytes.concat([
                Bytes.from([this.masterValveDelay]),
                encodeFloatWithScale(this.highPressureThreshold, 0 /* kPa */),
                encodeFloatWithScale(this.lowPressureThreshold, 0 /* kPa */),
                Bytes.from([polarity]),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "master valve delay": `${this.masterValveDelay} s`,
                "high pressure threshold": `${this.highPressureThreshold} kPa`,
                "low pressure threshold": `${this.lowPressureThreshold} kPa`,
            };
            if (this.rainSensorPolarity != undefined) {
                message["rain sensor polarity"] = getEnumMemberName(IrrigationSensorPolarity, this.rainSensorPolarity);
            }
            if (this.moistureSensorPolarity != undefined) {
                message["moisture sensor polarity"] = getEnumMemberName(IrrigationSensorPolarity, this.moistureSensorPolarity);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCSystemConfigSet = _classThis;
})();
export { IrrigationCCSystemConfigSet };
let IrrigationCCSystemConfigReport = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemConfigReport), ccValueProperty("masterValveDelay", IrrigationCCValues.masterValveDelay), ccValueProperty("highPressureThreshold", IrrigationCCValues.highPressureThreshold), ccValueProperty("lowPressureThreshold", IrrigationCCValues.lowPressureThreshold), ccValueProperty("rainSensorPolarity", IrrigationCCValues.rainSensorPolarity), ccValueProperty("moistureSensorPolarity", IrrigationCCValues.moistureSensorPolarity)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemConfigReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemConfigReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.masterValveDelay = options.masterValveDelay;
            this.highPressureThreshold = options.highPressureThreshold;
            this.lowPressureThreshold = options.lowPressureThreshold;
            this.rainSensorPolarity = options.rainSensorPolarity;
            this.moistureSensorPolarity = options.moistureSensorPolarity;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const masterValveDelay = raw.payload[0];
            let offset = 1;
            let highPressureThreshold;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0 /* kPa */);
                highPressureThreshold = value;
                offset += bytesRead;
            }
            let lowPressureThreshold;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0 /* kPa */);
                lowPressureThreshold = value;
                offset += bytesRead;
            }
            validatePayload(raw.payload.length >= offset + 1);
            const polarity = raw.payload[offset];
            let rainSensorPolarity;
            let moistureSensorPolarity;
            if (!!(polarity & 0b1000_0000)) {
                // The valid bit is set
                rainSensorPolarity = polarity & 0b1;
                moistureSensorPolarity = (polarity & 0b10) >>> 1;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                masterValveDelay,
                highPressureThreshold,
                lowPressureThreshold,
                rainSensorPolarity,
                moistureSensorPolarity,
            });
        }
        masterValveDelay;
        highPressureThreshold;
        lowPressureThreshold;
        rainSensorPolarity;
        moistureSensorPolarity;
        toLogEntry(ctx) {
            const message = {
                "master valve delay": `${this.masterValveDelay} s`,
                "high pressure threshold": `${this.highPressureThreshold} kPa`,
                "low pressure threshold": `${this.lowPressureThreshold} kPa`,
            };
            if (this.rainSensorPolarity != undefined) {
                message["rain sensor polarity"] = getEnumMemberName(IrrigationSensorPolarity, this.rainSensorPolarity);
            }
            if (this.moistureSensorPolarity != undefined) {
                message["moisture sensor polarity"] = getEnumMemberName(IrrigationSensorPolarity, this.moistureSensorPolarity);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCSystemConfigReport = _classThis;
})();
export { IrrigationCCSystemConfigReport };
let IrrigationCCSystemConfigGet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemConfigGet), expectedCCResponse(IrrigationCCSystemConfigReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemConfigGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemConfigGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return IrrigationCCSystemConfigGet = _classThis;
})();
export { IrrigationCCSystemConfigGet };
let IrrigationCCValveInfoReport = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveInfoReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveInfoReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveInfoReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.valveId = options.valveId;
            this.connected = options.connected;
            this.nominalCurrent = options.nominalCurrent;
            this.errorShortCircuit = options.errorShortCircuit;
            this.errorHighCurrent = options.errorHighCurrent;
            this.errorLowCurrent = options.errorLowCurrent;
            this.errorMaximumFlow = options.errorMaximumFlow;
            this.errorHighFlow = options.errorHighFlow;
            this.errorLowFlow = options.errorLowFlow;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            let valveId;
            if ((raw.payload[0] & 0b1) === ValveType.MasterValve) {
                valveId = "master";
            }
            else {
                valveId = raw.payload[1];
            }
            const connected = !!(raw.payload[0] & 0b10);
            const nominalCurrent = 10 * raw.payload[2];
            const errorShortCircuit = !!(raw.payload[3] & 0b1);
            const errorHighCurrent = !!(raw.payload[3] & 0b10);
            const errorLowCurrent = !!(raw.payload[3] & 0b100);
            let errorMaximumFlow;
            let errorHighFlow;
            let errorLowFlow;
            if (valveId === "master") {
                errorMaximumFlow = !!(raw.payload[3] & 0b1000);
                errorHighFlow = !!(raw.payload[3] & 0b1_0000);
                errorLowFlow = !!(raw.payload[3] & 0b10_0000);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                valveId,
                connected,
                nominalCurrent,
                errorShortCircuit,
                errorHighCurrent,
                errorLowCurrent,
                errorMaximumFlow,
                errorHighFlow,
                errorLowFlow,
            });
        }
        valveId;
        connected;
        nominalCurrent;
        errorShortCircuit;
        errorHighCurrent;
        errorLowCurrent;
        errorMaximumFlow;
        errorHighFlow;
        errorLowFlow;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // connected
            const valveConnectedValue = IrrigationCCValues.valveConnected(this.valveId);
            this.ensureMetadata(ctx, valveConnectedValue);
            this.setValue(ctx, valveConnectedValue, this.connected);
            // nominalCurrent
            const nominalCurrentValue = IrrigationCCValues.nominalCurrent(this.valveId);
            this.ensureMetadata(ctx, nominalCurrentValue);
            this.setValue(ctx, nominalCurrentValue, this.nominalCurrent);
            // errorShortCircuit
            const errorShortCircuitValue = IrrigationCCValues.errorShortCircuit(this.valveId);
            this.ensureMetadata(ctx, errorShortCircuitValue);
            this.setValue(ctx, errorShortCircuitValue, this.errorShortCircuit);
            // errorHighCurrent
            const errorHighCurrentValue = IrrigationCCValues.errorHighCurrent(this.valveId);
            this.ensureMetadata(ctx, errorHighCurrentValue);
            this.setValue(ctx, errorHighCurrentValue, this.errorHighCurrent);
            // errorLowCurrent
            const errorLowCurrentValue = IrrigationCCValues.errorLowCurrent(this.valveId);
            this.ensureMetadata(ctx, errorLowCurrentValue);
            this.setValue(ctx, errorLowCurrentValue, this.errorLowCurrent);
            if (this.errorMaximumFlow != undefined) {
                const errorMaximumFlowValue = IrrigationCCValues.errorMaximumFlow(this.valveId);
                this.ensureMetadata(ctx, errorMaximumFlowValue);
                this.setValue(ctx, errorMaximumFlowValue, this.errorMaximumFlow);
            }
            if (this.errorHighFlow != undefined) {
                const errorHighFlowValue = IrrigationCCValues.errorHighFlow(this.valveId);
                this.ensureMetadata(ctx, errorHighFlowValue);
                this.setValue(ctx, errorHighFlowValue, this.errorHighFlow);
            }
            if (this.errorLowFlow != undefined) {
                const errorLowFlowValue = IrrigationCCValues.errorLowFlow(this.valveId);
                this.ensureMetadata(ctx, errorLowFlowValue);
                this.setValue(ctx, errorLowFlowValue, this.errorLowFlow);
            }
            return true;
        }
        toLogEntry(ctx) {
            const message = {
                "valve ID": this.valveId,
                connected: this.connected,
                "nominal current": `${this.nominalCurrent} mA`,
            };
            const errors = [
                this.errorShortCircuit ? "short circuit" : undefined,
                this.errorHighCurrent ? "current above high threshold" : undefined,
                this.errorLowCurrent ? "current below low threshold" : undefined,
                this.errorMaximumFlow ? "maximum flow" : undefined,
                this.errorHighFlow ? "flow above high threshold" : undefined,
                this.errorLowFlow ? "flow below low threshold" : undefined,
            ].filter(Boolean);
            if (errors.length > 0) {
                message.errors = errors.map((e) => `\n· ${e}`).join("");
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCValveInfoReport = _classThis;
})();
export { IrrigationCCValveInfoReport };
function testResponseForIrrigationCommandWithValveId(sent, received) {
    return received.valveId === sent.valveId;
}
let IrrigationCCValveInfoGet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveInfoGet), expectedCCResponse(IrrigationCCValveInfoReport, testResponseForIrrigationCommandWithValveId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveInfoGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveInfoGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.valveId = options.valveId;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveInfoGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        valveId;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.valveId === "master" ? 1 : 0,
                this.valveId === "master" ? 1 : this.valveId || 1,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "valve ID": this.valveId,
                },
            };
        }
    };
    return IrrigationCCValveInfoGet = _classThis;
})();
export { IrrigationCCValveInfoGet };
let IrrigationCCValveConfigSet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveConfigSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveConfigSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveConfigSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.valveId = options.valveId;
            this.nominalCurrentHighThreshold = options.nominalCurrentHighThreshold;
            this.nominalCurrentLowThreshold = options.nominalCurrentLowThreshold;
            this.maximumFlow = options.maximumFlow;
            this.highFlowThreshold = options.highFlowThreshold;
            this.lowFlowThreshold = options.lowFlowThreshold;
            this.useRainSensor = options.useRainSensor;
            this.useMoistureSensor = options.useMoistureSensor;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveConfigSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        valveId;
        nominalCurrentHighThreshold;
        nominalCurrentLowThreshold;
        maximumFlow;
        highFlowThreshold;
        lowFlowThreshold;
        useRainSensor;
        useMoistureSensor;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([
                    this.valveId === "master" ? 1 : 0,
                    this.valveId === "master" ? 1 : this.valveId || 1,
                    Math.floor(this.nominalCurrentHighThreshold / 10),
                    Math.floor(this.nominalCurrentLowThreshold / 10),
                ]),
                encodeFloatWithScale(this.maximumFlow, 0 /* l/h */),
                encodeFloatWithScale(this.highFlowThreshold, 0 /* l/h */),
                encodeFloatWithScale(this.lowFlowThreshold, 0 /* l/h */),
                Bytes.from([
                    (this.useRainSensor ? 0b1 : 0)
                        | (this.useMoistureSensor ? 0b10 : 0),
                ]),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "valve ID": this.valveId,
                    "nominal current high threshold": `${this.nominalCurrentHighThreshold} mA`,
                    "nominal current low threshold": `${this.nominalCurrentLowThreshold} mA`,
                    "maximum flow": `${this.maximumFlow} l/h`,
                    "high flow threshold": `${this.highFlowThreshold} l/h`,
                    "low flow threshold": `${this.lowFlowThreshold} l/h`,
                    "use rain sensor": this.useRainSensor,
                    "use moisture sensor": this.useMoistureSensor,
                },
            };
        }
    };
    return IrrigationCCValveConfigSet = _classThis;
})();
export { IrrigationCCValveConfigSet };
let IrrigationCCValveConfigReport = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveConfigReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveConfigReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveConfigReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.valveId = options.valveId;
            this.nominalCurrentHighThreshold = options.nominalCurrentHighThreshold;
            this.nominalCurrentLowThreshold = options.nominalCurrentLowThreshold;
            this.maximumFlow = options.maximumFlow;
            this.highFlowThreshold = options.highFlowThreshold;
            this.lowFlowThreshold = options.lowFlowThreshold;
            this.useRainSensor = options.useRainSensor;
            this.useMoistureSensor = options.useMoistureSensor;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            let valveId;
            if ((raw.payload[0] & 0b1) === ValveType.MasterValve) {
                valveId = "master";
            }
            else {
                valveId = raw.payload[1];
            }
            const nominalCurrentHighThreshold = 10 * raw.payload[2];
            const nominalCurrentLowThreshold = 10 * raw.payload[3];
            let offset = 4;
            let maximumFlow;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0 /* l/h */);
                maximumFlow = value;
                offset += bytesRead;
            }
            let highFlowThreshold;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0 /* l/h */);
                highFlowThreshold = value;
                offset += bytesRead;
            }
            let lowFlowThreshold;
            {
                const { value, scale, bytesRead } = parseFloatWithScale(raw.payload.subarray(offset));
                validatePayload(scale === 0 /* l/h */);
                lowFlowThreshold = value;
                offset += bytesRead;
            }
            validatePayload(raw.payload.length >= offset + 1);
            const useRainSensor = !!(raw.payload[offset] & 0b1);
            const useMoistureSensor = !!(raw.payload[offset] & 0b10);
            return new this({
                nodeId: ctx.sourceNodeId,
                valveId,
                nominalCurrentHighThreshold,
                nominalCurrentLowThreshold,
                maximumFlow,
                highFlowThreshold,
                lowFlowThreshold,
                useRainSensor,
                useMoistureSensor,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // nominalCurrentHighThreshold
            const nominalCurrentHighThresholdValue = IrrigationCCValues
                .nominalCurrentHighThreshold(this.valveId);
            this.ensureMetadata(ctx, nominalCurrentHighThresholdValue);
            this.setValue(ctx, nominalCurrentHighThresholdValue, this.nominalCurrentHighThreshold);
            // nominalCurrentLowThreshold
            const nominalCurrentLowThresholdValue = IrrigationCCValues
                .nominalCurrentLowThreshold(this.valveId);
            this.ensureMetadata(ctx, nominalCurrentLowThresholdValue);
            this.setValue(ctx, nominalCurrentLowThresholdValue, this.nominalCurrentLowThreshold);
            // maximumFlow
            const maximumFlowValue = IrrigationCCValues.maximumFlow(this.valveId);
            this.ensureMetadata(ctx, maximumFlowValue);
            this.setValue(ctx, maximumFlowValue, this.maximumFlow);
            // highFlowThreshold
            const highFlowThresholdValue = IrrigationCCValues.highFlowThreshold(this.valveId);
            this.ensureMetadata(ctx, highFlowThresholdValue);
            this.setValue(ctx, highFlowThresholdValue, this.highFlowThreshold);
            // lowFlowThreshold
            const lowFlowThresholdValue = IrrigationCCValues.lowFlowThreshold(this.valveId);
            this.ensureMetadata(ctx, lowFlowThresholdValue);
            this.setValue(ctx, lowFlowThresholdValue, this.lowFlowThreshold);
            // useRainSensor
            const useRainSensorValue = IrrigationCCValues.useRainSensor(this.valveId);
            this.ensureMetadata(ctx, useRainSensorValue);
            this.setValue(ctx, useRainSensorValue, this.useRainSensor);
            // useMoistureSensor
            const useMoistureSensorValue = IrrigationCCValues.useMoistureSensor(this.valveId);
            this.ensureMetadata(ctx, useMoistureSensorValue);
            this.setValue(ctx, useMoistureSensorValue, this.useMoistureSensor);
            return true;
        }
        valveId;
        nominalCurrentHighThreshold;
        nominalCurrentLowThreshold;
        maximumFlow;
        highFlowThreshold;
        lowFlowThreshold;
        useRainSensor;
        useMoistureSensor;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "valve ID": this.valveId,
                    "nominal current high threshold": `${this.nominalCurrentHighThreshold} mA`,
                    "nominal current low threshold": `${this.nominalCurrentLowThreshold} mA`,
                    "maximum flow": `${this.maximumFlow} l/h`,
                    "high flow threshold": `${this.highFlowThreshold} l/h`,
                    "low flow threshold": `${this.lowFlowThreshold} l/h`,
                    "use rain sensor": this.useRainSensor,
                    "use moisture sensor": this.useMoistureSensor,
                },
            };
        }
    };
    return IrrigationCCValveConfigReport = _classThis;
})();
export { IrrigationCCValveConfigReport };
let IrrigationCCValveConfigGet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveConfigGet), expectedCCResponse(IrrigationCCValveConfigReport, testResponseForIrrigationCommandWithValveId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveConfigGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveConfigGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.valveId = options.valveId;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveConfigGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        valveId;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.valveId === "master" ? 1 : 0,
                this.valveId === "master" ? 1 : this.valveId || 1,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "valve ID": this.valveId,
                },
            };
        }
    };
    return IrrigationCCValveConfigGet = _classThis;
})();
export { IrrigationCCValveConfigGet };
let IrrigationCCValveRun = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveRun), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveRun = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveRun = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.valveId = options.valveId;
            this.duration = options.duration;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveRun({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        valveId;
        duration;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.valveId === "master" ? 1 : 0,
                this.valveId === "master" ? 1 : this.valveId || 1,
                0,
                0,
            ]);
            this.payload.writeUInt16BE(this.duration, 2);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "valve ID": this.valveId,
            };
            if (this.duration) {
                message.duration = `${this.duration} s`;
            }
            else {
                message.action = "turn off";
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCValveRun = _classThis;
})();
export { IrrigationCCValveRun };
let IrrigationCCValveTableSet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveTableSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveTableSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveTableSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.tableId = options.tableId;
            this.entries = options.entries;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveTableSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        tableId;
        entries;
        serialize(ctx) {
            this.payload = new Bytes(1 + this.entries.length * 3);
            this.payload[0] = this.tableId;
            for (let i = 0; i < this.entries.length; i++) {
                const entry = this.entries[i];
                const offset = 1 + i * 3;
                this.payload[offset] = entry.valveId;
                this.payload.writeUInt16BE(entry.duration, offset + 1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "table ID": this.tableId,
            };
            for (let i = 0; i < this.entries.length; i++) {
                const entry = this.entries[i];
                const valveLabel = entry.valveId.toString().padStart(3, "0");
                if (entry.duration) {
                    message[`valve ${valveLabel} duration`] = `${entry.duration} s`;
                }
                else {
                    message[`valve ${valveLabel} action`] = `turn off`;
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCValveTableSet = _classThis;
})();
export { IrrigationCCValveTableSet };
let IrrigationCCValveTableReport = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveTableReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveTableReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveTableReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.tableId = options.tableId;
            this.entries = options.entries;
        }
        static from(raw, ctx) {
            validatePayload((raw.payload.length - 1) % 3 === 0);
            const tableId = raw.payload[0];
            const entries = [];
            for (let offset = 1; offset < raw.payload.length; offset += 3) {
                entries.push({
                    valveId: raw.payload[offset],
                    duration: raw.payload.readUInt16BE(offset + 1),
                });
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                tableId,
                entries,
            });
        }
        tableId;
        entries;
        toLogEntry(ctx) {
            const message = {
                "table ID": this.tableId,
            };
            for (let i = 0; i < this.entries.length; i++) {
                const entry = this.entries[i];
                const valveLabel = entry.valveId.toString().padStart(3, "0");
                if (entry.duration) {
                    message[`valve ${valveLabel} duration`] = `${entry.duration} s`;
                }
                else {
                    message[`valve ${valveLabel} action`] = `turn off`;
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return IrrigationCCValveTableReport = _classThis;
})();
export { IrrigationCCValveTableReport };
function testResponseForIrrigationValveTableGet(sent, received) {
    return received.tableId === sent.tableId;
}
let IrrigationCCValveTableGet = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveTableGet), expectedCCResponse(IrrigationCCValveTableReport, testResponseForIrrigationValveTableGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveTableGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveTableGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.tableId = options.tableId;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveTableGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        tableId;
        serialize(ctx) {
            this.payload = Bytes.from([this.tableId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "table ID": this.tableId,
                },
            };
        }
    };
    return IrrigationCCValveTableGet = _classThis;
})();
export { IrrigationCCValveTableGet };
let IrrigationCCValveTableRun = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.ValveTableRun), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCValveTableRun = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCValveTableRun = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.tableIDs = options.tableIDs;
            if (this.tableIDs.length < 1) {
                throw new ZWaveError(`${this.constructor.name}: At least one table ID must be specified.`, ZWaveErrorCodes.Argument_Invalid);
            }
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCValveTableRun({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        tableIDs;
        serialize(ctx) {
            this.payload = Bytes.from(this.tableIDs);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "table IDs": this.tableIDs
                        .map((id) => id.toString().padStart(3, "0"))
                        .join(", "),
                },
            };
        }
    };
    return IrrigationCCValveTableRun = _classThis;
})();
export { IrrigationCCValveTableRun };
let IrrigationCCSystemShutoff = (() => {
    let _classDecorators = [CCCommand(IrrigationCommand.SystemShutoff), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = IrrigationCC;
    var IrrigationCCSystemShutoff = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IrrigationCCSystemShutoff = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.duration = options.duration;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new IrrigationCCSystemShutoff({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        duration;
        serialize(ctx) {
            this.payload = Bytes.from([this.duration ?? 255]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    duration: this.duration === 0
                        ? "temporarily"
                        : this.duration === 255 || this.duration === undefined
                            ? "permanently"
                            : `${this.duration} hours`,
                },
            };
        }
    };
    return IrrigationCCSystemShutoff = _classThis;
})();
export { IrrigationCCSystemShutoff };
//# sourceMappingURL=IrrigationCC.js.map