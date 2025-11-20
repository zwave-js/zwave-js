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
import { CommandClasses, Duration, MessagePriority, NOT_KNOWN, SupervisionStatus, ValueMetadata, maybeUnknownToString, parseMaybeNumber, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, SET_VALUE_HOOKS, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { multilevelSwitchTypeProperties, multilevelSwitchTypeToActions, } from "../lib/CCValueUtils.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { LevelChangeDirection, MultilevelSwitchCommand, SwitchType, } from "../lib/_Types.js";
export const MultilevelSwitchCCValues = V.defineCCValues(CommandClasses["Multilevel Switch"], {
    ...V.staticProperty("currentValue", {
        ...ValueMetadata.ReadOnlyLevel,
        label: "Current value",
    }),
    ...V.staticProperty("targetValue", {
        ...ValueMetadata.Level,
        label: "Target value",
        valueChangeOptions: ["transitionDuration"],
    }),
    ...V.staticProperty("duration", {
        ...ValueMetadata.ReadOnlyDuration,
        label: "Remaining duration",
    }),
    ...V.staticProperty("restorePrevious", {
        ...ValueMetadata.WriteOnlyBoolean,
        label: "Restore previous value",
        states: {
            true: "Restore",
        },
    }),
    ...V.staticPropertyWithName("compatEvent", "event", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Event value",
    }, {
        stateful: false,
        autoCreate: (applHost, endpoint) => !!applHost.getDeviceConfig?.(endpoint.nodeId)?.compat
            ?.treatMultilevelSwitchSetAsEvent,
    }),
    ...V.staticProperty("switchType", undefined, { internal: true }),
    ...V.staticProperty("superviseStartStopLevelChange", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.dynamicPropertyWithName("levelChangeUp", 
    // This is called "up" here, but the actual property name will depend on
    // the given switch type
    (switchType) => {
        const switchTypeName = getEnumMemberName(SwitchType, switchType);
        const [, up] = multilevelSwitchTypeToActions(switchTypeName);
        return up;
    }, ({ property }) => typeof property === "string"
        && multilevelSwitchTypeProperties.indexOf(property) % 2 === 1, (switchType) => {
        const switchTypeName = getEnumMemberName(SwitchType, switchType);
        const [, up] = multilevelSwitchTypeToActions(switchTypeName);
        return {
            ...ValueMetadata.WriteOnlyBoolean,
            label: `Perform a level change (${up})`,
            valueChangeOptions: ["transitionDuration"],
            states: {
                true: "Start",
                false: "Stop",
            },
            ccSpecific: { switchType },
        };
    }),
    ...V.dynamicPropertyWithName("levelChangeDown", 
    // This is called "down" here, but the actual property name will depend on
    // the given switch type
    (switchType) => {
        const switchTypeName = getEnumMemberName(SwitchType, switchType);
        const [down] = multilevelSwitchTypeToActions(switchTypeName);
        return down;
    }, ({ property }) => typeof property === "string"
        && multilevelSwitchTypeProperties.indexOf(property) % 2 === 0, (switchType) => {
        const switchTypeName = getEnumMemberName(SwitchType, switchType);
        const [down] = multilevelSwitchTypeToActions(switchTypeName);
        return {
            ...ValueMetadata.WriteOnlyBoolean,
            label: `Perform a level change (${down})`,
            valueChangeOptions: ["transitionDuration"],
            states: {
                true: "Start",
                false: "Stop",
            },
            ccSpecific: { switchType },
        };
    }),
});
let MultilevelSwitchCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Multilevel Switch"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    let _startLevelChange_decorators;
    var MultilevelSwitchCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startLevelChange_decorators, { kind: "method", name: "startLevelChange", static: false, private: false, access: { has: obj => "startLevelChange" in obj, get: obj => obj.startLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case MultilevelSwitchCommand.Get:
                    return this.isSinglecast();
                case MultilevelSwitchCommand.Set:
                case MultilevelSwitchCommand.StartLevelChange:
                case MultilevelSwitchCommand.StopLevelChange:
                    return true; // This is mandatory
                case MultilevelSwitchCommand.SupportedGet:
                    return this.version >= 3 && this.isSinglecast();
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(MultilevelSwitchCommand, MultilevelSwitchCommand.Get);
            const cc = new MultilevelSwitchCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["currentValue", "targetValue", "duration"]);
            }
        }
        /**
         * Sets the switch to a new value
         * @param targetValue The new target value for the switch
         * @param duration The duration after which the target value should be reached. Can be a Duration instance or a user-friendly duration string like `"1m17s"`. Only supported in V2 and above.
         * @returns A promise indicating whether the command was completed
         */
        async set(targetValue, duration) {
            this.assertSupportsCommand(MultilevelSwitchCommand, MultilevelSwitchCommand.Set);
            const cc = new MultilevelSwitchCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                targetValue,
                duration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async startLevelChange(options) {
            this.assertSupportsCommand(MultilevelSwitchCommand, MultilevelSwitchCommand.StartLevelChange);
            const cc = new MultilevelSwitchCCStartLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async stopLevelChange() {
            this.assertSupportsCommand(MultilevelSwitchCommand, MultilevelSwitchCommand.StopLevelChange);
            const cc = new MultilevelSwitchCCStopLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getSupported() {
            this.assertSupportsCommand(MultilevelSwitchCommand, MultilevelSwitchCommand.SupportedGet);
            const cc = new MultilevelSwitchCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.switchType;
        }
        get [(_set_decorators = [validateArgs()], _startLevelChange_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property }, value, options) {
                // Enable restoring the previous non-zero value
                if (property === "restorePrevious") {
                    property = "targetValue";
                    value = 255;
                }
                if (property === "targetValue") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    const duration = Duration.from(options?.transitionDuration);
                    return this.set(value, duration);
                }
                else if (multilevelSwitchTypeProperties.includes(property)) {
                    // Since the switch only supports one of the switch types, we would
                    // need to check if the correct one is used. But since the names are
                    // purely cosmetic, we just accept all of them
                    if (typeof value !== "boolean") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    if (value) {
                        // The property names are organized so that positive motions are
                        // at odd indices and negative motions at even indices
                        const direction = multilevelSwitchTypeProperties.indexOf(property) % 2
                            === 0
                            ? "down"
                            : "up";
                        // Singlecast only: Try to retrieve the current value to use as the start level,
                        // even if the target node is going to ignore it. There might
                        // be some bugged devices that ignore the ignore start level flag.
                        const startLevel = this.tryGetValueDB()?.getValue(MultilevelSwitchCCValues.currentValue.endpoint(this.endpoint.index));
                        // And perform the level change
                        const duration = Duration.from(options?.transitionDuration);
                        return this.startLevelChange({
                            direction,
                            ignoreStartLevel: true,
                            startLevel: typeof startLevel === "number"
                                ? startLevel
                                : undefined,
                            duration,
                        });
                    }
                    else {
                        return this.stopLevelChange();
                    }
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        [SET_VALUE_HOOKS] = (__runInitializers(this, _instanceExtraInitializers), ({ property }, value, options) => {
            // Enable restoring the previous non-zero value
            if (property === "restorePrevious") {
                property = "targetValue";
                value = 255;
            }
            if (property === "targetValue") {
                const duration = Duration.from(options?.transitionDuration);
                const currentValueValueId = MultilevelSwitchCCValues.currentValue
                    .endpoint(this.endpoint.index);
                return {
                    // Multilevel Switch commands may take some time to be executed.
                    // Therefore we try to supervise the command execution and delay the
                    // optimistic update until the final result is received.
                    supervisionDelayedUpdates: true,
                    supervisionOnSuccess: async () => {
                        // Only update currentValue for valid target values
                        if (typeof value === "number"
                            && value >= 0
                            && value <= 99) {
                            this.tryGetValueDB()?.setValue(currentValueValueId, value);
                        }
                        else if (value === 255) {
                            // We don't know the status now, so refresh the current value
                            try {
                                await this.get();
                            }
                            catch {
                                // ignore
                            }
                        }
                    },
                    supervisionOnFailure: async () => {
                        // The transition failed, so now we don't know the status - refresh the current value
                        try {
                            await this.get();
                        }
                        catch {
                            // ignore
                        }
                    },
                    optimisticallyUpdateRelatedValues: (_supervisedAndSuccessful) => {
                        // Only update currentValue for valid target values
                        if (typeof value === "number"
                            && value >= 0
                            && value <= 99) {
                            if (this.isSinglecast()) {
                                this.tryGetValueDB()?.setValue(currentValueValueId, value);
                            }
                            else if (this.isMulticast()) {
                                // Figure out which nodes were affected by this command
                                const affectedNodes = this.endpoint.node
                                    .physicalNodes.filter((node) => node
                                    .getEndpoint(this.endpoint.index)
                                    ?.supportsCC(this.ccId));
                                // and optimistically update the currentValue
                                for (const node of affectedNodes) {
                                    this.host
                                        .tryGetValueDB(node.id)
                                        ?.setValue(currentValueValueId, value);
                                }
                            }
                        }
                    },
                    forceVerifyChanges: () => {
                        // If we don't know the actual value, we need to verify the change, regardless of the supervision result
                        return value === 255;
                    },
                    verifyChanges: async (result) => {
                        if (
                        // We generally don't want to poll for multicasts because of how much traffic it can cause
                        // However, when setting the value 255 (ON), we don't know the actual state
                        !(this.isSinglecast()
                            || (this.isMulticast() && value === 255))) {
                            return;
                        }
                        switch (result?.status) {
                            case SupervisionStatus.Success:
                            case SupervisionStatus.Fail:
                                await this.pollValue(currentValueValueId);
                                break;
                            case SupervisionStatus.Working:
                            default: // (not supervised)
                                this.schedulePoll(currentValueValueId, value === 255 ? undefined : value, {
                                    duration: result?.remainingDuration
                                        ?? duration,
                                });
                                break;
                        }
                    },
                };
            }
        });
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "currentValue":
                    case "targetValue":
                    case "duration":
                        return (await this.get())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
    };
    return MultilevelSwitchCCAPI = _classThis;
})();
export { MultilevelSwitchCCAPI };
let MultilevelSwitchCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Multilevel Switch"]), implementedVersion(4), ccValues(MultilevelSwitchCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var MultilevelSwitchCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Multilevel Switch"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            if (api.version >= 3) {
                // Find out which kind of switch this is
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "requesting switch type...",
                    direction: "outbound",
                });
                const switchType = await api.getSupported();
                if (switchType != undefined) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `has switch type ${getEnumMemberName(SwitchType, switchType)}`,
                        direction: "inbound",
                    });
                }
            }
            else {
                // requesting the switch type automatically creates the up/down actions
                // We need to do this manually for V1 and V2
                this.createMetadataForLevelChangeActions(ctx);
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Multilevel Switch"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "requesting current switch state...",
                direction: "outbound",
            });
            await api.get();
        }
        setMappedBasicValue(ctx, value) {
            this.setValue(ctx, MultilevelSwitchCCValues.currentValue, value);
            return true;
        }
        createMetadataForLevelChangeActions(ctx, 
        // SDS13781: The Primary Switch Type SHOULD be 0x02 (Up/Down)
        switchType = SwitchType["Down/Up"]) {
            this.ensureMetadata(ctx, MultilevelSwitchCCValues.levelChangeUp(switchType));
            this.ensureMetadata(ctx, MultilevelSwitchCCValues.levelChangeDown(switchType));
        }
    };
    return MultilevelSwitchCC = _classThis;
})();
export { MultilevelSwitchCC };
let MultilevelSwitchCCSet = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.targetValue = options.targetValue;
            this.duration = Duration.from(options.duration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const targetValue = raw.payload[0];
            let duration;
            if (raw.payload.length >= 2) {
                duration = Duration.parseReport(raw.payload[1]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                targetValue,
                duration,
            });
        }
        targetValue;
        duration;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.targetValue,
                (this.duration ?? Duration.default()).serializeSet(),
            ]);
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 2 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1, only include the target value
                this.payload = this.payload.subarray(0, 1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "target value": this.targetValue,
            };
            if (this.duration) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MultilevelSwitchCCSet = _classThis;
})();
export { MultilevelSwitchCCSet };
let MultilevelSwitchCCReport = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.Report), ccValueProperty("targetValue", MultilevelSwitchCCValues.targetValue), ccValueProperty("duration", MultilevelSwitchCCValues.duration), ccValueProperty("currentValue", MultilevelSwitchCCValues.currentValue)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.currentValue = options.currentValue;
            this.targetValue = options.targetValue;
            this.duration = Duration.from(options.duration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const currentValue = 
            // 0xff is a legacy value for 100% (99)
            raw.payload[0] === 0xff
                ? 99
                : parseMaybeNumber(raw.payload[0]);
            let targetValue;
            let duration;
            if (raw.payload.length >= 3) {
                targetValue = parseMaybeNumber(raw.payload[1]);
                duration = Duration.parseReport(raw.payload[2]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                currentValue,
                targetValue,
                duration,
            });
        }
        targetValue;
        duration;
        currentValue;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.currentValue ?? 0xfe,
                this.targetValue ?? 0xfe,
                (this.duration ?? Duration.default()).serializeReport(),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "current value": maybeUnknownToString(this.currentValue),
            };
            if (this.targetValue !== NOT_KNOWN && this.duration) {
                message["target value"] = maybeUnknownToString(this.targetValue);
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MultilevelSwitchCCReport = _classThis;
})();
export { MultilevelSwitchCCReport };
let MultilevelSwitchCCGet = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.Get), expectedCCResponse(MultilevelSwitchCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MultilevelSwitchCCGet = _classThis;
})();
export { MultilevelSwitchCCGet };
let MultilevelSwitchCCStartLevelChange = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.StartLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCStartLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCStartLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.duration = Duration.from(options.duration);
            this.ignoreStartLevel = options.ignoreStartLevel;
            this.startLevel = options.startLevel ?? 0;
            this.direction = options.direction;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const ignoreStartLevel = !!((raw.payload[0] & 0b0_0_1_00000) >>> 5);
            const direction = ((raw.payload[0] & 0b0_1_0_00000) >>> 6)
                ? "down"
                : "up";
            const startLevel = raw.payload[1];
            let duration;
            if (raw.payload.length >= 3) {
                duration = Duration.parseSet(raw.payload[2]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                ignoreStartLevel,
                direction,
                startLevel,
                duration,
            });
        }
        duration;
        startLevel;
        ignoreStartLevel;
        direction;
        serialize(ctx) {
            const controlByte = (LevelChangeDirection[this.direction] << 6)
                | (this.ignoreStartLevel ? 0b0010_0000 : 0);
            this.payload = Bytes.from([
                controlByte,
                this.startLevel,
                (this.duration ?? Duration.default()).serializeSet(),
            ]);
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 2 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1, omit the duration byte
                this.payload = this.payload.subarray(0, -1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                startLevel: `${this.startLevel}${this.ignoreStartLevel ? " (ignored)" : ""}`,
                direction: this.direction,
            };
            if (this.duration) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MultilevelSwitchCCStartLevelChange = _classThis;
})();
export { MultilevelSwitchCCStartLevelChange };
let MultilevelSwitchCCStopLevelChange = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.StopLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCStopLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCStopLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MultilevelSwitchCCStopLevelChange = _classThis;
})();
export { MultilevelSwitchCCStopLevelChange };
let MultilevelSwitchCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.SupportedReport), ccValueProperty("switchType", MultilevelSwitchCCValues.switchType)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.switchType = options.switchType;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const switchType = raw.payload[0] & 0b11111;
            return new this({
                nodeId: ctx.sourceNodeId,
                switchType,
            });
        }
        // This is the primary switch type. We're not supporting secondary switch types
        switchType;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            this.createMetadataForLevelChangeActions(ctx, this.switchType);
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.from([this.switchType & 0b11111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "switch type": getEnumMemberName(SwitchType, this.switchType),
                },
            };
        }
    };
    return MultilevelSwitchCCSupportedReport = _classThis;
})();
export { MultilevelSwitchCCSupportedReport };
let MultilevelSwitchCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(MultilevelSwitchCommand.SupportedGet), expectedCCResponse(MultilevelSwitchCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultilevelSwitchCC;
    var MultilevelSwitchCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultilevelSwitchCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MultilevelSwitchCCSupportedGet = _classThis;
})();
export { MultilevelSwitchCCSupportedGet };
//# sourceMappingURL=MultilevelSwitchCC.js.map