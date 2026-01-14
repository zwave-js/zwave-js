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
import { CommandClasses, Duration, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, enumValuesToMetadataStates, parseBitMask, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { isArray } from "alcalzone-shared/typeguards";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { DoorLockCommand, DoorLockMode, DoorLockOperationType, } from "../lib/_Types.js";
export const DoorLockCCValues = V.defineCCValues(CommandClasses["Door Lock"], {
    ...V.staticProperty("targetMode", {
        ...ValueMetadata.UInt8,
        label: "Target lock mode",
        states: enumValuesToMetadataStates(DoorLockMode),
    }),
    ...V.staticProperty("currentMode", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Current lock mode",
        states: enumValuesToMetadataStates(DoorLockMode),
    }),
    ...V.staticProperty("duration", {
        ...ValueMetadata.ReadOnlyDuration,
        label: "Remaining duration until target lock mode",
    }, { minVersion: 3 }),
    ...V.staticProperty("supportedOutsideHandles", undefined, {
        internal: true,
        minVersion: 4,
    }),
    ...V.staticProperty("outsideHandlesCanOpenDoorConfiguration", {
        ...ValueMetadata.Any,
        label: "Which outside handles can open the door (configuration)",
    }),
    ...V.staticProperty("outsideHandlesCanOpenDoor", {
        ...ValueMetadata.ReadOnly,
        label: "Which outside handles can open the door (actual status)",
    }),
    ...V.staticProperty("supportedInsideHandles", undefined, {
        internal: true,
        minVersion: 4,
    }),
    ...V.staticProperty("insideHandlesCanOpenDoorConfiguration", {
        ...ValueMetadata.Any,
        label: "Which inside handles can open the door (configuration)",
    }),
    ...V.staticProperty("insideHandlesCanOpenDoor", {
        ...ValueMetadata.ReadOnly,
        label: "Which inside handles can open the door (actual status)",
    }),
    ...V.staticProperty("operationType", {
        ...ValueMetadata.UInt8,
        label: "Lock operation type",
        states: enumValuesToMetadataStates(DoorLockOperationType),
    }),
    ...V.staticProperty("lockTimeoutConfiguration", {
        ...ValueMetadata.UInt16,
        label: "Duration of timed mode in seconds",
    }),
    ...V.staticProperty("lockTimeout", {
        ...ValueMetadata.ReadOnlyUInt16,
        label: "Seconds until lock mode times out",
    }),
    ...V.staticProperty("autoRelockSupported", undefined, {
        internal: true,
        minVersion: 4,
    }),
    ...V.staticProperty("autoRelockTime", {
        ...ValueMetadata.UInt16,
        label: "Duration in seconds until lock returns to secure state",
    }, {
        minVersion: 4,
        autoCreate: shouldAutoCreateAutoRelockConfigValue,
    }),
    ...V.staticProperty("holdAndReleaseSupported", undefined, {
        internal: true,
        minVersion: 4,
    }),
    ...V.staticProperty("holdAndReleaseTime", {
        ...ValueMetadata.UInt16,
        label: "Duration in seconds the latch stays retracted",
    }, {
        minVersion: 4,
        autoCreate: shouldAutoCreateHoldAndReleaseConfigValue,
    }),
    ...V.staticProperty("twistAssistSupported", undefined, {
        internal: true,
        minVersion: 4,
    }),
    ...V.staticProperty("twistAssist", {
        ...ValueMetadata.Boolean,
        label: "Twist Assist enabled",
    }, {
        minVersion: 4,
        autoCreate: shouldAutoCreateTwistAssistConfigValue,
    }),
    ...V.staticProperty("blockToBlockSupported", undefined, {
        internal: true,
        minVersion: 4,
    }),
    ...V.staticProperty("blockToBlock", {
        ...ValueMetadata.Boolean,
        label: "Block-to-block functionality enabled",
    }, {
        minVersion: 4,
        autoCreate: shouldAutoCreateBlockToBlockConfigValue,
    }),
    ...V.staticProperty("latchSupported", undefined, { internal: true }),
    ...V.staticProperty("latchStatus", {
        ...ValueMetadata.ReadOnly,
        label: "Current status of the latch",
    }, {
        autoCreate: shouldAutoCreateLatchStatusValue,
    }),
    ...V.staticProperty("boltSupported", undefined, { internal: true }),
    ...V.staticProperty("boltStatus", {
        ...ValueMetadata.ReadOnly,
        label: "Current status of the bolt",
    }, {
        autoCreate: shouldAutoCreateBoltStatusValue,
    }),
    ...V.staticProperty("doorSupported", undefined, { internal: true }),
    ...V.staticProperty("doorStatus", {
        ...ValueMetadata.ReadOnly,
        label: "Current status of the door",
    }, {
        autoCreate: shouldAutoCreateDoorStatusValue,
    }),
});
export function shouldAutoCreateLatchStatusValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.latchSupported.endpoint(endpoint.index));
}
export function shouldAutoCreateBoltStatusValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.boltSupported.endpoint(endpoint.index));
}
export function shouldAutoCreateDoorStatusValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.doorSupported.endpoint(endpoint.index));
}
export function shouldAutoCreateTwistAssistConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.twistAssistSupported.endpoint(endpoint.index));
}
export function shouldAutoCreateBlockToBlockConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.blockToBlockSupported.endpoint(endpoint.index));
}
export function shouldAutoCreateAutoRelockConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.autoRelockSupported.endpoint(endpoint.index));
}
export function shouldAutoCreateHoldAndReleaseConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.holdAndReleaseSupported.endpoint(endpoint.index));
}
const configurationSetParameters = [
    "operationType",
    "outsideHandlesCanOpenDoorConfiguration",
    "insideHandlesCanOpenDoorConfiguration",
    "lockTimeoutConfiguration",
    "autoRelockTime",
    "holdAndReleaseTime",
    "twistAssist",
    "blockToBlock",
];
let DoorLockCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Door Lock"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    let _setConfiguration_decorators;
    var DoorLockCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            _setConfiguration_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setConfiguration_decorators, { kind: "method", name: "setConfiguration", static: false, private: false, access: { has: obj => "setConfiguration" in obj, get: obj => obj.setConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case DoorLockCommand.OperationSet:
                case DoorLockCommand.OperationGet:
                case DoorLockCommand.ConfigurationSet:
                case DoorLockCommand.ConfigurationGet:
                    return true; // This is mandatory
                case DoorLockCommand.CapabilitiesGet:
                    return this.version >= 4;
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                if (property === "targetMode") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    const result = await this.set(value);
                    // Verify the current value after a delay, unless the command was supervised and successful
                    if (supervisedCommandSucceeded(result)) {
                        this.getValueDB().setValue(DoorLockCCValues.currentMode.endpoint(this.endpoint.index), value);
                    }
                    else {
                        this.schedulePoll({ property }, value);
                    }
                    return result;
                }
                else if (typeof property === "string"
                    && configurationSetParameters.includes(property)) {
                    // checking every type here would create a LOT of duplicate code, so we don't
                    // ConfigurationSet expects all parameters --> read the others from cache
                    const config = {
                        [property]: value,
                    };
                    for (const param of configurationSetParameters) {
                        if (param !== property) {
                            config[param] = this.tryGetValueDB()?.getValue({
                                commandClass: this.ccId,
                                endpoint: this.endpoint.index,
                                property: param,
                            });
                        }
                    }
                    // Fix insideHandlesCanOpenDoorConfiguration is not iterable
                    const allTrue = [true, true, true, true];
                    if (!config.insideHandlesCanOpenDoorConfiguration) {
                        config.insideHandlesCanOpenDoorConfiguration = allTrue;
                    }
                    if (!config.outsideHandlesCanOpenDoorConfiguration) {
                        config.outsideHandlesCanOpenDoorConfiguration = allTrue;
                    }
                    const result = await this.setConfiguration(config);
                    // Verify the current value after a delay, unless the command was supervised and successful
                    if (!supervisedCommandSucceeded(result)) {
                        this.schedulePoll({ property }, value);
                    }
                    return result;
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "currentMode":
                    case "targetMode":
                    case "duration":
                    case "outsideHandlesCanOpenDoor":
                    case "insideHandlesCanOpenDoor":
                    case "latchStatus":
                    case "boltStatus":
                    case "doorStatus":
                    case "lockTimeout":
                        return (await this.get())?.[property];
                    case "operationType":
                    case "outsideHandlesCanOpenDoorConfiguration":
                    case "insideHandlesCanOpenDoorConfiguration":
                    case "lockTimeoutConfiguration":
                    case "autoRelockTime":
                    case "holdAndReleaseTime":
                    case "twistAssist":
                    case "blockToBlock":
                        return (await this.getConfiguration())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getCapabilities() {
            this.assertSupportsCommand(DoorLockCommand, DoorLockCommand.CapabilitiesGet);
            const cc = new DoorLockCCCapabilitiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "autoRelockSupported",
                    "blockToBlockSupported",
                    "boltSupported",
                    "doorSupported",
                    "holdAndReleaseSupported",
                    "latchSupported",
                    "twistAssistSupported",
                    "supportedDoorLockModes",
                    "supportedInsideHandles",
                    "supportedOperationTypes",
                    "supportedOutsideHandles",
                ]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(DoorLockCommand, DoorLockCommand.OperationGet);
            const cc = new DoorLockCCOperationGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "currentMode",
                    "targetMode",
                    "duration",
                    "outsideHandlesCanOpenDoor",
                    "insideHandlesCanOpenDoor",
                    "latchStatus",
                    "boltStatus",
                    "doorStatus",
                    "lockTimeout",
                ]);
            }
        }
        async set(mode) {
            this.assertSupportsCommand(DoorLockCommand, DoorLockCommand.OperationSet);
            const cc = new DoorLockCCOperationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                mode,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async setConfiguration(configuration) {
            this.assertSupportsCommand(DoorLockCommand, DoorLockCommand.ConfigurationSet);
            const cc = new DoorLockCCConfigurationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...configuration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getConfiguration() {
            this.assertSupportsCommand(DoorLockCommand, DoorLockCommand.ConfigurationGet);
            const cc = new DoorLockCCConfigurationGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "operationType",
                    "outsideHandlesCanOpenDoorConfiguration",
                    "insideHandlesCanOpenDoorConfiguration",
                    "lockTimeoutConfiguration",
                    "autoRelockTime",
                    "holdAndReleaseTime",
                    "twistAssist",
                    "blockToBlock",
                ]);
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return DoorLockCCAPI = _classThis;
})();
export { DoorLockCCAPI };
let DoorLockCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Door Lock"]), implementedVersion(4), ccValues(DoorLockCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var DoorLockCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Door Lock"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // We need to do some queries after a potential timeout
            // In this case, do now mark this CC as interviewed completely
            let hadCriticalTimeout = false;
            // By default, assume all status sensors to be supported
            let doorSupported = true;
            let boltSupported = true;
            let latchSupported = true;
            if (api.version >= 4) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "requesting lock capabilities...",
                    direction: "outbound",
                });
                const resp = await api.getCapabilities();
                if (resp) {
                    const logMessage = `received lock capabilities:
supported operation types: ${resp.supportedOperationTypes
                        .map((t) => getEnumMemberName(DoorLockOperationType, t))
                        .join(", ")}
supported door lock modes: ${resp.supportedDoorLockModes
                        .map((t) => getEnumMemberName(DoorLockMode, t))
                        .map((str) => `\n· ${str}`)
                        .join("")}
supported outside handles: ${resp.supportedOutsideHandles
                        .map(String)
                        .join(", ")}
supported inside handles:  ${resp.supportedInsideHandles.map(String).join(", ")}
supports door status:      ${resp.doorSupported}
supports bolt status:      ${resp.boltSupported}
supports latch status:     ${resp.latchSupported}
supports auto-relock:      ${resp.autoRelockSupported}
supports hold-and-release: ${resp.holdAndReleaseSupported}
supports twist assist:     ${resp.twistAssistSupported}
supports block to block:   ${resp.blockToBlockSupported}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                    doorSupported = resp.doorSupported;
                    boltSupported = resp.boltSupported;
                    latchSupported = resp.latchSupported;
                    // Update metadata of settable states
                    const targetModeValue = DoorLockCCValues.targetMode;
                    this.setMetadata(ctx, targetModeValue, {
                        ...targetModeValue.meta,
                        states: enumValuesToMetadataStates(DoorLockMode, resp.supportedDoorLockModes),
                    });
                    const operationTypeValue = DoorLockCCValues.operationType;
                    this.setMetadata(ctx, operationTypeValue, {
                        ...operationTypeValue.meta,
                        states: enumValuesToMetadataStates(DoorLockOperationType, resp.supportedOperationTypes),
                    });
                }
                else {
                    hadCriticalTimeout = true;
                }
            }
            if (!hadCriticalTimeout) {
                // Save support information for the status values
                const doorStatusValue = DoorLockCCValues.doorStatus;
                if (doorSupported)
                    this.setMetadata(ctx, doorStatusValue);
                this.setValue(ctx, DoorLockCCValues.doorSupported, doorSupported);
                const latchStatusValue = DoorLockCCValues.latchStatus;
                if (latchSupported)
                    this.setMetadata(ctx, latchStatusValue);
                this.setValue(ctx, DoorLockCCValues.latchSupported, latchSupported);
                const boltStatusValue = DoorLockCCValues.boltStatus;
                if (boltSupported)
                    this.setMetadata(ctx, boltStatusValue);
                this.setValue(ctx, DoorLockCCValues.boltSupported, boltSupported);
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            if (!hadCriticalTimeout)
                this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Door Lock"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "requesting lock configuration...",
                direction: "outbound",
            });
            const config = await api.getConfiguration();
            if (config) {
                let logMessage = `received lock configuration:
operation type:                ${getEnumMemberName(DoorLockOperationType, config.operationType)}`;
                if (config.operationType === DoorLockOperationType.Timed) {
                    logMessage += `
lock timeout:                  ${config.lockTimeoutConfiguration} seconds
`;
                }
                logMessage += `
outside handles can open door: ${config.outsideHandlesCanOpenDoorConfiguration
                    .map(String)
                    .join(", ")}
inside handles can open door:  ${config.insideHandlesCanOpenDoorConfiguration
                    .map(String)
                    .join(", ")}`;
                if (api.version >= 4) {
                    logMessage += `
auto-relock time               ${config.autoRelockTime ?? "-"} seconds
hold-and-release time          ${config.holdAndReleaseTime ?? "-"} seconds
twist assist                   ${!!config.twistAssist}
block to block                 ${!!config.blockToBlock}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "requesting current lock status...",
                direction: "outbound",
            });
            const status = await api.get();
            if (status) {
                let logMessage = `received lock status:
current mode:       ${getEnumMemberName(DoorLockMode, status.currentMode)}`;
                if (status.targetMode != undefined) {
                    logMessage += `
target mode:        ${getEnumMemberName(DoorLockMode, status.targetMode)}
remaining duration: ${status.duration?.toString() ?? "undefined"}`;
                }
                if (status.lockTimeout != undefined) {
                    logMessage += `
lock timeout:       ${status.lockTimeout} seconds`;
                }
                if (status.doorStatus != undefined) {
                    logMessage += `
door status:        ${status.doorStatus}`;
                }
                if (status.boltStatus != undefined) {
                    logMessage += `
bolt status:        ${status.boltStatus}`;
                }
                if (status.latchStatus != undefined) {
                    logMessage += `
latch status:       ${status.latchStatus}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
        /**
         * Returns whether the node supports auto relock.
         * This only works AFTER the node has been interviewed.
         */
        static supportsAutoRelockCached(ctx, endpoint) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(DoorLockCCValues.autoRelockSupported.endpoint(endpoint.index));
        }
        /**
         * Returns whether the node supports hold and release.
         * This only works AFTER the node has been interviewed.
         */
        static supportsHoldAndReleaseCached(ctx, endpoint) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(DoorLockCCValues.holdAndReleaseSupported.endpoint(endpoint.index));
        }
        /**
         * Returns whether the node supports twist assist.
         * This only works AFTER the node has been interviewed.
         */
        static supportsTwistAssistCached(ctx, endpoint) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(DoorLockCCValues.twistAssistSupported.endpoint(endpoint.index));
        }
        /**
         * Returns whether the node supports block to block.
         * This only works AFTER the node has been interviewed.
         */
        static supportsBlockToBlockCached(ctx, endpoint) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(DoorLockCCValues.blockToBlockSupported.endpoint(endpoint.index));
        }
        /**
         * Returns the supported outside handles.
         * This only works AFTER the node has been interviewed.
         */
        static getSupportedOutsideHandlesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(DoorLockCCValues.supportedOutsideHandles.endpoint(endpoint.index));
        }
        /**
         * Returns the supported inside handles.
         * This only works AFTER the node has been interviewed.
         */
        static getSupportedInsideHandlesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(DoorLockCCValues.supportedInsideHandles.endpoint(endpoint.index));
        }
    };
    return DoorLockCC = _classThis;
})();
export { DoorLockCC };
let DoorLockCCOperationSet = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.OperationSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCOperationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCOperationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.mode === DoorLockMode.Unknown) {
                throw new ZWaveError(`Unknown is not a valid door lock target state!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.mode = options.mode;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new DoorLockCCOperationSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        mode;
        serialize(ctx) {
            this.payload = Bytes.from([this.mode]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "target mode": getEnumMemberName(DoorLockMode, this.mode),
                },
            };
        }
    };
    return DoorLockCCOperationSet = _classThis;
})();
export { DoorLockCCOperationSet };
let DoorLockCCOperationReport = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.OperationReport), ccValueProperty("currentMode", DoorLockCCValues.currentMode), ccValueProperty("targetMode", DoorLockCCValues.targetMode), ccValueProperty("duration", DoorLockCCValues.duration), ccValueProperty("outsideHandlesCanOpenDoor", DoorLockCCValues.outsideHandlesCanOpenDoor), ccValueProperty("insideHandlesCanOpenDoor", DoorLockCCValues.insideHandlesCanOpenDoor), ccValueProperty("lockTimeout", DoorLockCCValues.lockTimeout)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCOperationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCOperationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.currentMode = options.currentMode;
            this.outsideHandlesCanOpenDoor = options.outsideHandlesCanOpenDoor;
            this.insideHandlesCanOpenDoor = options.insideHandlesCanOpenDoor;
            this.doorStatus = options.doorStatus;
            this.boltStatus = options.boltStatus;
            this.latchStatus = options.latchStatus;
            this.lockTimeout = options.lockTimeout;
            this.targetMode = options.targetMode;
            this.duration = options.duration;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 5);
            const currentMode = raw.payload[0];
            const outsideHandlesCanOpenDoor = [
                !!(raw.payload[1] & 0b0001_0000),
                !!(raw.payload[1] & 0b0010_0000),
                !!(raw.payload[1] & 0b0100_0000),
                !!(raw.payload[1] & 0b1000_0000),
            ];
            const insideHandlesCanOpenDoor = [
                !!(raw.payload[1] & 0b0001),
                !!(raw.payload[1] & 0b0010),
                !!(raw.payload[1] & 0b0100),
                !!(raw.payload[1] & 0b1000),
            ];
            const doorStatus = !!(raw.payload[2] & 0b1)
                ? "closed"
                : "open";
            const boltStatus = !!(raw.payload[2] & 0b10) ? "unlocked" : "locked";
            const latchStatus = !!(raw.payload[2] & 0b100)
                ? "closed"
                : "open";
            // Ignore invalid timeout values
            const lockTimeoutMinutes = raw.payload[3];
            const lockTimeoutSeconds = raw.payload[4];
            let lockTimeout;
            if (lockTimeoutMinutes <= 253 && lockTimeoutSeconds <= 59) {
                lockTimeout = lockTimeoutSeconds + lockTimeoutMinutes * 60;
            }
            let targetMode;
            let duration;
            if (raw.payload.length >= 7) {
                targetMode = raw.payload[5];
                duration = Duration.parseReport(raw.payload[6]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                currentMode,
                outsideHandlesCanOpenDoor,
                insideHandlesCanOpenDoor,
                doorStatus,
                boltStatus,
                latchStatus,
                lockTimeout,
                targetMode,
                duration,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Only store the door/bolt/latch status if the lock supports it
            const supportsDoorStatus = !!this.getValue(ctx, DoorLockCCValues.doorSupported);
            if (supportsDoorStatus) {
                this.setValue(ctx, DoorLockCCValues.doorStatus, this.doorStatus);
            }
            const supportsBoltStatus = !!this.getValue(ctx, DoorLockCCValues.boltSupported);
            if (supportsBoltStatus) {
                this.setValue(ctx, DoorLockCCValues.boltStatus, this.boltStatus);
            }
            const supportsLatchStatus = !!this.getValue(ctx, DoorLockCCValues.latchSupported);
            if (supportsLatchStatus) {
                this.setValue(ctx, DoorLockCCValues.latchStatus, this.latchStatus);
            }
            return true;
        }
        currentMode;
        targetMode;
        duration;
        outsideHandlesCanOpenDoor;
        insideHandlesCanOpenDoor;
        latchStatus;
        boltStatus;
        doorStatus;
        lockTimeout; // in seconds
        toLogEntry(ctx) {
            const message = {
                "current mode": getEnumMemberName(DoorLockMode, this.currentMode),
                "active outside handles": this.outsideHandlesCanOpenDoor.join(", "),
                "active inside handles": this.insideHandlesCanOpenDoor.join(", "),
            };
            if (this.latchStatus != undefined) {
                message["latch status"] = this.latchStatus;
            }
            if (this.boltStatus != undefined) {
                message["bolt status"] = this.boltStatus;
            }
            if (this.doorStatus != undefined) {
                message["door status"] = this.doorStatus;
            }
            if (this.targetMode != undefined) {
                message["target mode"] = getEnumMemberName(DoorLockMode, this.targetMode);
            }
            if (this.duration != undefined) {
                message["remaining duration"] = this.duration.toString();
            }
            if (this.lockTimeout != undefined) {
                message["lock timeout"] = `${this.lockTimeout} seconds`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return DoorLockCCOperationReport = _classThis;
})();
export { DoorLockCCOperationReport };
let DoorLockCCOperationGet = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.OperationGet), expectedCCResponse(DoorLockCCOperationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCOperationGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCOperationGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DoorLockCCOperationGet = _classThis;
})();
export { DoorLockCCOperationGet };
let DoorLockCCConfigurationReport = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.ConfigurationReport), ccValueProperty("operationType", DoorLockCCValues.operationType), ccValueProperty("outsideHandlesCanOpenDoorConfiguration", DoorLockCCValues.outsideHandlesCanOpenDoorConfiguration), ccValueProperty("insideHandlesCanOpenDoorConfiguration", DoorLockCCValues.insideHandlesCanOpenDoorConfiguration), ccValueProperty("lockTimeoutConfiguration", DoorLockCCValues.lockTimeoutConfiguration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCConfigurationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCConfigurationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.operationType = options.operationType;
            this.outsideHandlesCanOpenDoorConfiguration =
                options.outsideHandlesCanOpenDoorConfiguration;
            this.insideHandlesCanOpenDoorConfiguration =
                options.insideHandlesCanOpenDoorConfiguration;
            this.lockTimeoutConfiguration = options.lockTimeoutConfiguration;
            this.autoRelockTime = options.autoRelockTime;
            this.holdAndReleaseTime = options.holdAndReleaseTime;
            this.twistAssist = options.twistAssist;
            this.blockToBlock = options.blockToBlock;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const operationType = raw.payload[0];
            const outsideHandlesCanOpenDoorConfiguration = [
                !!(raw.payload[1] & 0b0001_0000),
                !!(raw.payload[1] & 0b0010_0000),
                !!(raw.payload[1] & 0b0100_0000),
                !!(raw.payload[1] & 0b1000_0000),
            ];
            const insideHandlesCanOpenDoorConfiguration = [
                !!(raw.payload[1] & 0b0001),
                !!(raw.payload[1] & 0b0010),
                !!(raw.payload[1] & 0b0100),
                !!(raw.payload[1] & 0b1000),
            ];
            let lockTimeoutConfiguration;
            if (operationType === DoorLockOperationType.Timed) {
                const lockTimeoutMinutes = raw.payload[2];
                const lockTimeoutSeconds = raw.payload[3];
                if (lockTimeoutMinutes <= 0xfd && lockTimeoutSeconds <= 59) {
                    lockTimeoutConfiguration = lockTimeoutSeconds
                        + lockTimeoutMinutes * 60;
                }
            }
            let autoRelockTime;
            let holdAndReleaseTime;
            let twistAssist;
            let blockToBlock;
            if (raw.payload.length >= 5) {
                autoRelockTime = raw.payload.readUInt16BE(4);
                holdAndReleaseTime = raw.payload.readUInt16BE(6);
                const flags = raw.payload[8];
                twistAssist = !!(flags & 0b1);
                blockToBlock = !!(flags & 0b10);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                operationType,
                outsideHandlesCanOpenDoorConfiguration,
                insideHandlesCanOpenDoorConfiguration,
                lockTimeoutConfiguration,
                autoRelockTime,
                holdAndReleaseTime,
                twistAssist,
                blockToBlock,
            });
        }
        operationType;
        outsideHandlesCanOpenDoorConfiguration;
        insideHandlesCanOpenDoorConfiguration;
        lockTimeoutConfiguration;
        // These are not always supported and have to be persisted manually
        // to avoid unsupported values being exposed to the user
        autoRelockTime;
        holdAndReleaseTime;
        twistAssist;
        blockToBlock;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Only store the autoRelockTime etc. params if the lock supports it
            const supportsAutoRelock = !!this.getValue(ctx, DoorLockCCValues.autoRelockSupported);
            if (supportsAutoRelock) {
                this.setValue(ctx, DoorLockCCValues.autoRelockTime, this.autoRelockTime);
            }
            const supportsHoldAndRelease = !!this.getValue(ctx, DoorLockCCValues.holdAndReleaseSupported);
            if (supportsHoldAndRelease) {
                this.setValue(ctx, DoorLockCCValues.holdAndReleaseTime, this.holdAndReleaseTime);
            }
            const supportsTwistAssist = !!this.getValue(ctx, DoorLockCCValues.twistAssistSupported);
            if (supportsTwistAssist) {
                this.setValue(ctx, DoorLockCCValues.twistAssist, this.twistAssist);
            }
            const supportsBlockToBlock = !!this.getValue(ctx, DoorLockCCValues.blockToBlockSupported);
            if (supportsBlockToBlock) {
                this.setValue(ctx, DoorLockCCValues.blockToBlock, this.blockToBlock);
            }
            return true;
        }
        toLogEntry(ctx) {
            const message = {
                "operation type": getEnumMemberName(DoorLockOperationType, this.operationType),
                "outside handle configuration": this
                    .outsideHandlesCanOpenDoorConfiguration.join(", "),
                "inside handle configuration": this
                    .insideHandlesCanOpenDoorConfiguration.join(", "),
            };
            if (this.lockTimeoutConfiguration != undefined) {
                message["timed mode duration"] = `${this.lockTimeoutConfiguration} seconds`;
            }
            if (this.autoRelockTime != undefined) {
                message["auto-relock time"] = `${this.autoRelockTime} seconds`;
            }
            if (this.holdAndReleaseTime != undefined) {
                message["hold-and-release time"] = `${this.holdAndReleaseTime} seconds`;
            }
            if (this.twistAssist != undefined) {
                message["twist assist enabled"] = this.twistAssist;
            }
            if (this.blockToBlock != undefined) {
                message["block-to-block enabled"] = this.blockToBlock;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return DoorLockCCConfigurationReport = _classThis;
})();
export { DoorLockCCConfigurationReport };
let DoorLockCCConfigurationGet = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.ConfigurationGet), expectedCCResponse(DoorLockCCConfigurationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCConfigurationGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCConfigurationGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DoorLockCCConfigurationGet = _classThis;
})();
export { DoorLockCCConfigurationGet };
let DoorLockCCConfigurationSet = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.ConfigurationSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCConfigurationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCConfigurationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.operationType = options.operationType;
            this.outsideHandlesCanOpenDoorConfiguration =
                options.outsideHandlesCanOpenDoorConfiguration;
            this.insideHandlesCanOpenDoorConfiguration =
                options.insideHandlesCanOpenDoorConfiguration;
            this.lockTimeoutConfiguration = options.lockTimeoutConfiguration;
            this.autoRelockTime = options.autoRelockTime;
            this.holdAndReleaseTime = options.holdAndReleaseTime;
            this.twistAssist = options.twistAssist;
            this.blockToBlock = options.blockToBlock;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new DoorLockCCConfigurationSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        operationType;
        outsideHandlesCanOpenDoorConfiguration;
        insideHandlesCanOpenDoorConfiguration;
        lockTimeoutConfiguration;
        autoRelockTime;
        holdAndReleaseTime;
        twistAssist;
        blockToBlock;
        serialize(ctx) {
            const insideHandles = isArray(this.insideHandlesCanOpenDoorConfiguration)
                ? this.insideHandlesCanOpenDoorConfiguration
                : [];
            const outsideHandles = isArray(this.outsideHandlesCanOpenDoorConfiguration)
                ? this.outsideHandlesCanOpenDoorConfiguration
                : [];
            const handles = [...insideHandles, ...outsideHandles]
                .map((val, i) => (val ? 1 << i : 0))
                .reduce((acc, cur) => acc | cur, 0);
            let lockTimeoutMinutes;
            let lockTimeoutSeconds;
            if (this.operationType === DoorLockOperationType.Constant) {
                lockTimeoutMinutes = lockTimeoutSeconds = 0xfe;
            }
            else {
                lockTimeoutMinutes = Math.floor(this.lockTimeoutConfiguration / 60);
                lockTimeoutSeconds = this.lockTimeoutConfiguration % 60;
            }
            const flags = (this.twistAssist ? 0b1 : 0)
                | (this.blockToBlock ? 0b10 : 0);
            this.payload = Bytes.from([
                this.operationType,
                handles,
                lockTimeoutMinutes,
                lockTimeoutSeconds,
                // placeholder for auto relock time
                0,
                0,
                // placeholder for hold and release time
                0,
                0,
                flags,
            ]);
            this.payload.writeUInt16BE((this.autoRelockTime ?? 0) & 0xffff, 4);
            this.payload.writeUInt16BE((this.holdAndReleaseTime ?? 0) & 0xffff, 6);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const insideHandles = isArray(this.insideHandlesCanOpenDoorConfiguration)
                ? this.insideHandlesCanOpenDoorConfiguration
                : [];
            const outsideHandles = isArray(this.outsideHandlesCanOpenDoorConfiguration)
                ? this.outsideHandlesCanOpenDoorConfiguration
                : [];
            const message = {
                "operation type": getEnumMemberName(DoorLockOperationType, this.operationType),
                "outside handle configuration": outsideHandles.join(", "),
                "inside handle configuration": insideHandles.join(", "),
            };
            if (this.lockTimeoutConfiguration != undefined) {
                message["timed mode duration"] = `${this.lockTimeoutConfiguration} seconds`;
            }
            if (this.autoRelockTime != undefined) {
                message["auto-relock time"] = `${this.autoRelockTime} seconds`;
            }
            if (this.holdAndReleaseTime != undefined) {
                message["hold-and-release time"] = `${this.holdAndReleaseTime} seconds`;
            }
            if (this.twistAssist != undefined) {
                message["enable twist assist"] = this.twistAssist;
            }
            if (this.blockToBlock != undefined) {
                message["enable block-to-block"] = this.blockToBlock;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return DoorLockCCConfigurationSet = _classThis;
})();
export { DoorLockCCConfigurationSet };
let DoorLockCCCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.CapabilitiesReport), ccValueProperty("supportedOutsideHandles", DoorLockCCValues.supportedOutsideHandles), ccValueProperty("supportedInsideHandles", DoorLockCCValues.supportedInsideHandles), ccValueProperty("autoRelockSupported", DoorLockCCValues.autoRelockSupported), ccValueProperty("holdAndReleaseSupported", DoorLockCCValues.holdAndReleaseSupported), ccValueProperty("twistAssistSupported", DoorLockCCValues.twistAssistSupported), ccValueProperty("blockToBlockSupported", DoorLockCCValues.blockToBlockSupported)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedOperationTypes = options.supportedOperationTypes;
            this.supportedDoorLockModes = options.supportedDoorLockModes;
            this.supportedOutsideHandles = options.supportedOutsideHandles;
            this.supportedInsideHandles = options.supportedInsideHandles;
            this.doorSupported = options.doorSupported;
            this.boltSupported = options.boltSupported;
            this.latchSupported = options.latchSupported;
            this.blockToBlockSupported = options.blockToBlockSupported;
            this.twistAssistSupported = options.twistAssistSupported;
            this.holdAndReleaseSupported = options.holdAndReleaseSupported;
            this.autoRelockSupported = options.autoRelockSupported;
        }
        static from(raw, ctx) {
            // parse variable length operation type bit mask
            validatePayload(raw.payload.length >= 1);
            const bitMaskLength = raw.payload[0] & 0b11111;
            let offset = 1;
            validatePayload(raw.payload.length >= offset + bitMaskLength + 1);
            const supportedOperationTypes = parseBitMask(raw.payload.subarray(offset, offset + bitMaskLength), 
            // bit 0 is reserved, bitmask starts at 1
            0);
            offset += bitMaskLength;
            // parse variable length door lock mode list
            const listLength = raw.payload[offset];
            offset += 1;
            validatePayload(raw.payload.length >= offset + listLength + 3);
            const supportedDoorLockModes = [
                ...raw.payload.subarray(offset, offset + listLength),
            ];
            offset += listLength;
            const supportedOutsideHandles = [
                !!(raw.payload[offset] & 0b0001_0000),
                !!(raw.payload[offset] & 0b0010_0000),
                !!(raw.payload[offset] & 0b0100_0000),
                !!(raw.payload[offset] & 0b1000_0000),
            ];
            const supportedInsideHandles = [
                !!(raw.payload[offset] & 0b0001),
                !!(raw.payload[offset] & 0b0010),
                !!(raw.payload[offset] & 0b0100),
                !!(raw.payload[offset] & 0b1000),
            ];
            const doorSupported = !!(raw.payload[offset + 1] & 0b1);
            const boltSupported = !!(raw.payload[offset + 1] & 0b10);
            const latchSupported = !!(raw.payload[offset + 1] & 0b100);
            const blockToBlockSupported = !!(raw.payload[offset + 2] & 0b1);
            const twistAssistSupported = !!(raw.payload[offset + 2] & 0b10);
            const holdAndReleaseSupported = !!(raw.payload[offset + 2] & 0b100);
            const autoRelockSupported = !!(raw.payload[offset + 2] & 0b1000);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedOperationTypes,
                supportedDoorLockModes,
                supportedOutsideHandles,
                supportedInsideHandles,
                doorSupported,
                boltSupported,
                latchSupported,
                blockToBlockSupported,
                twistAssistSupported,
                holdAndReleaseSupported,
                autoRelockSupported,
            });
        }
        supportedOperationTypes;
        supportedDoorLockModes;
        supportedOutsideHandles;
        supportedInsideHandles;
        // These 3 are not automatically persisted because in CC version 3
        // we have to assume them to be supported. In v4 we can query this.
        latchSupported;
        boltSupported;
        doorSupported;
        autoRelockSupported;
        holdAndReleaseSupported;
        twistAssistSupported;
        blockToBlockSupported;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    door: this.doorSupported,
                    bolt: this.boltSupported,
                    latch: this.latchSupported,
                    "block-to-block feature": this.blockToBlockSupported,
                    "twist assist feature": this.twistAssistSupported,
                    "hold-and-release feature": this.holdAndReleaseSupported,
                    "auto-relock feature": this.autoRelockSupported,
                    "operation types": this.supportedOperationTypes
                        .map((t) => `\n· ${getEnumMemberName(DoorLockOperationType, t)}`)
                        .join(""),
                    "door lock modes": this.supportedDoorLockModes
                        .map((t) => `\n· ${getEnumMemberName(DoorLockMode, t)}`)
                        .join(""),
                    "outside handles": this.supportedOutsideHandles.join(", "),
                    "inside handles": this.supportedInsideHandles.join(", "),
                },
            };
        }
    };
    return DoorLockCCCapabilitiesReport = _classThis;
})();
export { DoorLockCCCapabilitiesReport };
let DoorLockCCCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(DoorLockCommand.CapabilitiesGet), expectedCCResponse(DoorLockCCCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockCC;
    var DoorLockCCCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockCCCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DoorLockCCCapabilitiesGet = _classThis;
})();
export { DoorLockCCCapabilitiesGet };
//# sourceMappingURL=DoorLockCC.js.map