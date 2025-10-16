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
import { CommandClasses, MessagePriority, UNKNOWN_STATE, ValueMetadata, ZWaveError, ZWaveErrorCodes, enumValuesToMetadataStates, maybeUnknownToString, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, isEnumMember, noop, pick, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, SET_VALUE_HOOKS, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { BarrierOperatorCommand, BarrierState, SubsystemState, SubsystemType, } from "../lib/_Types.js";
export const BarrierOperatorCCValues = V.defineCCValues(CommandClasses["Barrier Operator"], {
    ...V.staticProperty("supportedSubsystemTypes", undefined, {
        internal: true,
    }),
    ...V.staticProperty("position", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Barrier Position",
        unit: "%",
        max: 100,
    }),
    ...V.staticProperty("targetState", {
        ...ValueMetadata.UInt8,
        label: "Target Barrier State",
        states: enumValuesToMetadataStates(BarrierState, [
            BarrierState.Open,
            BarrierState.Closed,
        ]),
    }),
    ...V.staticProperty("currentState", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Current Barrier State",
        states: enumValuesToMetadataStates(BarrierState),
    }),
    ...V.dynamicPropertyAndKeyWithName("signalingState", "signalingState", (subsystemType) => subsystemType, ({ property, propertyKey }) => property === "signalingState"
        && typeof propertyKey === "number", (subsystemType) => ({
        ...ValueMetadata.UInt8,
        label: `Signaling State (${getEnumMemberName(SubsystemType, subsystemType)})`,
        states: enumValuesToMetadataStates(SubsystemState),
    })),
});
let BarrierOperatorCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Barrier Operator"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    let _getSignalingCapabilities_decorators;
    let _getEventSignaling_decorators;
    let _setEventSignaling_decorators;
    var BarrierOperatorCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSignalingCapabilities_decorators, { kind: "method", name: "getSignalingCapabilities", static: false, private: false, access: { has: obj => "getSignalingCapabilities" in obj, get: obj => obj.getSignalingCapabilities }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getEventSignaling_decorators, { kind: "method", name: "getEventSignaling", static: false, private: false, access: { has: obj => "getEventSignaling" in obj, get: obj => obj.getEventSignaling }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setEventSignaling_decorators, { kind: "method", name: "setEventSignaling", static: false, private: false, access: { has: obj => "setEventSignaling" in obj, get: obj => obj.setEventSignaling }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case BarrierOperatorCommand.Get:
                case BarrierOperatorCommand.Set:
                case BarrierOperatorCommand.SignalingCapabilitiesGet:
                case BarrierOperatorCommand.EventSignalingGet:
                case BarrierOperatorCommand.EventSignalingSet:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(BarrierOperatorCommand, BarrierOperatorCommand.Get);
            const cc = new BarrierOperatorCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["currentState", "position"]);
            }
        }
        async set(targetState) {
            this.assertSupportsCommand(BarrierOperatorCommand, BarrierOperatorCommand.Set);
            const cc = new BarrierOperatorCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                targetState,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getSignalingCapabilities() {
            this.assertSupportsCommand(BarrierOperatorCommand, BarrierOperatorCommand.SignalingCapabilitiesGet);
            const cc = new BarrierOperatorCCSignalingCapabilitiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedSubsystemTypes;
        }
        async getEventSignaling(subsystemType) {
            this.assertSupportsCommand(BarrierOperatorCommand, BarrierOperatorCommand.EventSignalingGet);
            const cc = new BarrierOperatorCCEventSignalingGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                subsystemType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.subsystemState;
        }
        async setEventSignaling(subsystemType, subsystemState) {
            this.assertSupportsCommand(BarrierOperatorCommand, BarrierOperatorCommand.EventSignalingSet);
            const cc = new BarrierOperatorCCEventSignalingSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                subsystemType,
                subsystemState,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_set_decorators = [validateArgs({ strictEnums: true })], _getSignalingCapabilities_decorators = [validateArgs()], _getEventSignaling_decorators = [validateArgs({ strictEnums: true })], _setEventSignaling_decorators = [validateArgs({ strictEnums: true })], SET_VALUE)]() {
            return async function ({ property, propertyKey }, value) {
                if (property === "targetState") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    const targetValue = value === BarrierState.Closed
                        ? BarrierState.Closed
                        : BarrierState.Open;
                    return this.set(targetValue);
                }
                else if (property === "signalingState") {
                    if (propertyKey == undefined) {
                        throwMissingPropertyKey(this.ccId, property);
                    }
                    else if (typeof propertyKey !== "number") {
                        throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                    }
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    return this.setEventSignaling(propertyKey, value);
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        [SET_VALUE_HOOKS] = (__runInitializers(this, _instanceExtraInitializers), ({ property, propertyKey }, value, _options) => {
            const valueId = {
                commandClass: this.ccId,
                property,
                propertyKey,
            };
            if (BarrierOperatorCCValues.targetState.is(valueId)) {
                const currentStateValueId = BarrierOperatorCCValues.currentState
                    .endpoint(this.endpoint.index);
                const targetValue = value === BarrierState.Closed
                    ? BarrierState.Closed
                    : BarrierState.Open;
                return {
                    // Barrier Operator commands may take some time to be executed.
                    // Therefore we try to supervise the command execution and delay the
                    // optimistic update until the final result is received.
                    supervisionDelayedUpdates: true,
                    supervisionOnSuccess: () => {
                        this.tryGetValueDB()?.setValue(currentStateValueId, targetValue);
                    },
                    supervisionOnFailure: async () => {
                        // The command failed, so now we don't know the status - refresh the current value
                        try {
                            await this.get();
                        }
                        catch {
                            // ignore
                        }
                    },
                    optimisticallyUpdateRelatedValues: (supervisedAndSuccessful) => {
                        // For barriers, do not update the current value unless we actually know the command was successful
                        if (!supervisedAndSuccessful)
                            return;
                        if (this.isSinglecast()) {
                            this.tryGetValueDB()?.setValue(currentStateValueId, targetValue);
                        }
                        else if (this.isMulticast()) {
                            // Figure out which nodes were affected by this command
                            const affectedNodes = this.endpoint.node.physicalNodes
                                .filter((node) => node
                                .getEndpoint(this.endpoint.index)
                                ?.supportsCC(this.ccId));
                            // and optimistically update the currentValue
                            for (const node of affectedNodes) {
                                this.host
                                    .tryGetValueDB(node.id)
                                    ?.setValue(currentStateValueId, targetValue);
                            }
                        }
                    },
                    verifyChanges: () => {
                        if (this.isSinglecast()) {
                            // We query currentValue instead of targetValue to make sure that unsolicited updates cancel the scheduled poll
                            this.schedulePoll(currentStateValueId, targetValue);
                        }
                        else {
                            // For multicasts, do not schedule a refresh - this could cause a LOT of traffic
                        }
                    },
                };
            }
            else if (BarrierOperatorCCValues.signalingState.is(valueId)) {
                const subsystemType = propertyKey;
                const signalingStateValueId = BarrierOperatorCCValues
                    .signalingState(subsystemType).endpoint(this.endpoint.index);
                return {
                    verifyChanges: () => {
                        if (this.isSinglecast()) {
                            this.schedulePoll(signalingStateValueId, value, {
                                // Signaling state changes are fast
                                transition: "fast",
                            });
                        }
                    },
                };
            }
        });
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "currentState":
                    case "position":
                        return (await this.get())?.[property];
                    case "signalingState":
                        if (propertyKey == undefined) {
                            throwMissingPropertyKey(this.ccId, property);
                        }
                        else if (typeof propertyKey !== "number") {
                            throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                        }
                        return this.getEventSignaling(propertyKey);
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
    };
    return BarrierOperatorCCAPI = _classThis;
})();
export { BarrierOperatorCCAPI };
let BarrierOperatorCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Barrier Operator"]), implementedVersion(1), ccValues(BarrierOperatorCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var BarrierOperatorCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Barrier Operator"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Create targetState value if it does not exist
            this.ensureMetadata(ctx, BarrierOperatorCCValues.targetState);
            ctx.logNode(node.id, {
                message: "Querying signaling capabilities...",
                direction: "outbound",
            });
            const resp = await api.getSignalingCapabilities();
            if (resp) {
                ctx.logNode(node.id, {
                    message: `Received supported subsystem types: ${resp
                        .map((t) => `\n· ${getEnumMemberName(SubsystemType, t)}`)
                        .join("")}`,
                    direction: "inbound",
                });
                // Enable all supported subsystems
                for (const subsystemType of resp) {
                    // Some devices report invalid subsystem types, but the CC API checks
                    // for valid values and throws otherwise.
                    if (!isEnumMember(SubsystemType, subsystemType))
                        continue;
                    ctx.logNode(node.id, {
                        message: `Enabling subsystem ${getEnumMemberName(SubsystemType, subsystemType)}...`,
                        direction: "outbound",
                    });
                    await api.setEventSignaling(subsystemType, SubsystemState.On)
                        .catch(noop);
                }
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Barrier Operator"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const supportedSubsystems = this.getValue(ctx, BarrierOperatorCCValues.supportedSubsystemTypes) ?? [];
            for (const subsystemType of supportedSubsystems) {
                // Some devices report invalid subsystem types, but the CC API checks
                // for valid values and throws otherwise.
                if (!isEnumMember(SubsystemType, subsystemType))
                    continue;
                ctx.logNode(node.id, {
                    message: `Querying event signaling state for subsystem ${getEnumMemberName(SubsystemType, subsystemType)}...`,
                    direction: "outbound",
                });
                const state = await api.getEventSignaling(subsystemType);
                if (state != undefined) {
                    ctx.logNode(node.id, {
                        message: `Subsystem ${getEnumMemberName(SubsystemType, subsystemType)} has state ${getEnumMemberName(SubsystemState, state)}`,
                        direction: "inbound",
                    });
                }
            }
            ctx.logNode(node.id, {
                message: "querying current barrier state...",
                direction: "outbound",
            });
            await api.get();
        }
    };
    return BarrierOperatorCC = _classThis;
})();
export { BarrierOperatorCC };
let BarrierOperatorCCSet = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.targetState = options.targetState;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new BarrierOperatorCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        targetState;
        serialize(ctx) {
            this.payload = Bytes.from([this.targetState]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "target state": this.targetState },
            };
        }
    };
    return BarrierOperatorCCSet = _classThis;
})();
export { BarrierOperatorCCSet };
let BarrierOperatorCCReport = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.Report), ccValueProperty("currentState", BarrierOperatorCCValues.currentState), ccValueProperty("position", BarrierOperatorCCValues.position)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.position = options.position;
            this.currentState = options.currentState;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            // The payload byte encodes information about the state and position in a single value
            const payloadValue = raw.payload[0];
            let position;
            if (payloadValue <= 99) {
                // known position
                position = payloadValue;
            }
            else if (payloadValue === 255) {
                // known position, fully opened
                position = 100;
            }
            else {
                // unknown position
                position = UNKNOWN_STATE;
            }
            let currentState;
            if (payloadValue === BarrierState.Closed
                || payloadValue >= BarrierState.Closing) {
                // predefined states
                currentState = payloadValue;
            }
            else if (payloadValue > 0 && payloadValue <= 99) {
                // stopped at exact position
                currentState = BarrierState.Stopped;
            }
            else {
                // invalid value, assume unknown
                currentState = UNKNOWN_STATE;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                position,
                currentState,
            });
        }
        currentState;
        position;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "barrier position": maybeUnknownToString(this.position),
                    "barrier state": this.currentState != undefined
                        ? getEnumMemberName(BarrierState, this.currentState)
                        : "unknown",
                },
            };
        }
    };
    return BarrierOperatorCCReport = _classThis;
})();
export { BarrierOperatorCCReport };
let BarrierOperatorCCGet = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.Get), expectedCCResponse(BarrierOperatorCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BarrierOperatorCCGet = _classThis;
})();
export { BarrierOperatorCCGet };
let BarrierOperatorCCSignalingCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.SignalingCapabilitiesReport), ccValueProperty("supportedSubsystemTypes", BarrierOperatorCCValues.supportedSubsystemTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCSignalingCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCSignalingCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedSubsystemTypes = options.supportedSubsystemTypes;
        }
        static from(raw, ctx) {
            const supportedSubsystemTypes = parseBitMask(raw.payload, SubsystemType.Audible);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedSubsystemTypes,
            });
        }
        supportedSubsystemTypes;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported types": this.supportedSubsystemTypes
                        .map((t) => `\n· ${getEnumMemberName(SubsystemType, t)}`)
                        .join(""),
                },
            };
        }
    };
    return BarrierOperatorCCSignalingCapabilitiesReport = _classThis;
})();
export { BarrierOperatorCCSignalingCapabilitiesReport };
let BarrierOperatorCCSignalingCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.SignalingCapabilitiesGet), expectedCCResponse(BarrierOperatorCCSignalingCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCSignalingCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCSignalingCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BarrierOperatorCCSignalingCapabilitiesGet = _classThis;
})();
export { BarrierOperatorCCSignalingCapabilitiesGet };
let BarrierOperatorCCEventSignalingSet = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.EventSignalingSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCEventSignalingSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCEventSignalingSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.subsystemType = options.subsystemType;
            this.subsystemState = options.subsystemState;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new BarrierOperatorCCEventSignalingSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        subsystemType;
        subsystemState;
        serialize(ctx) {
            this.payload = Bytes.from([this.subsystemType, this.subsystemState]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "subsystem type": getEnumMemberName(SubsystemType, this.subsystemType),
                    "subsystem state": getEnumMemberName(SubsystemState, this.subsystemState),
                },
            };
        }
    };
    return BarrierOperatorCCEventSignalingSet = _classThis;
})();
export { BarrierOperatorCCEventSignalingSet };
let BarrierOperatorCCEventSignalingReport = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.EventSignalingReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCEventSignalingReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCEventSignalingReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.subsystemType = options.subsystemType;
            this.subsystemState = options.subsystemState;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const subsystemType = raw.payload[0];
            const subsystemState = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                subsystemType,
                subsystemState,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const signalingStateValue = BarrierOperatorCCValues.signalingState(this.subsystemType);
            this.ensureMetadata(ctx, signalingStateValue);
            this.setValue(ctx, signalingStateValue, this.subsystemState);
            return true;
        }
        subsystemType;
        subsystemState;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "subsystem type": getEnumMemberName(SubsystemType, this.subsystemType),
                    "subsystem state": getEnumMemberName(SubsystemState, this.subsystemState),
                },
            };
        }
    };
    return BarrierOperatorCCEventSignalingReport = _classThis;
})();
export { BarrierOperatorCCEventSignalingReport };
let BarrierOperatorCCEventSignalingGet = (() => {
    let _classDecorators = [CCCommand(BarrierOperatorCommand.EventSignalingGet), expectedCCResponse(BarrierOperatorCCEventSignalingReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BarrierOperatorCC;
    var BarrierOperatorCCEventSignalingGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BarrierOperatorCCEventSignalingGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.subsystemType = options.subsystemType;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new BarrierOperatorCCEventSignalingGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        subsystemType;
        serialize(ctx) {
            this.payload = Bytes.from([this.subsystemType]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "subsystem type": getEnumMemberName(SubsystemType, this.subsystemType),
                },
            };
        }
    };
    return BarrierOperatorCCEventSignalingGet = _classThis;
})();
export { BarrierOperatorCCEventSignalingGet };
//# sourceMappingURL=BarrierOperatorCC.js.map