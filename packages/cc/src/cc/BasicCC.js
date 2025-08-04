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
import { CommandClasses, Duration, MessagePriority, ValueMetadata, maybeUnknownToString, parseMaybeNumber, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, SET_VALUE_HOOKS, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { BasicCommand } from "../lib/_Types.js";
export const BasicCCValues = V.defineCCValues(CommandClasses.Basic, {
    ...V.staticProperty("currentValue", {
        ...ValueMetadata.ReadOnlyLevel,
        label: "Current value",
    }),
    ...V.staticProperty("targetValue", {
        ...ValueMetadata.UInt8,
        label: "Target value",
    }),
    ...V.staticProperty("duration", {
        ...ValueMetadata.ReadOnlyDuration,
        label: "Remaining duration",
    }, {
        minVersion: 2,
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
        autoCreate: false,
    }),
});
let BasicCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Basic)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var BasicCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case BasicCommand.Get:
                    return this.isSinglecast();
                case BasicCommand.Set:
                    return true;
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                // Enable restoring the previous non-zero value
                if (property === "restorePrevious") {
                    property = "targetValue";
                    value = 255;
                }
                if (property !== "targetValue") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                return this.set(value);
            };
        }
        [SET_VALUE_HOOKS] = (__runInitializers(this, _instanceExtraInitializers), ({ property }, value, _options) => {
            // Enable restoring the previous non-zero value
            if (property === "restorePrevious") {
                property = "targetValue";
                value = 255;
            }
            if (property === "targetValue") {
                const currentValueValueId = BasicCCValues.currentValue.endpoint(this.endpoint.index);
                return {
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
                    verifyChanges: () => {
                        if (this.isSinglecast()
                            // We generally don't want to poll for multicasts because of how much traffic it can cause
                            // However, when setting the value 255 (ON), we don't know the actual state
                            || (this.isMulticast() && value === 255)) {
                            // We query currentValue instead of targetValue to make sure that unsolicited updates cancel the scheduled poll
                            this.schedulePoll(currentValueValueId, value === 255 ? undefined : value);
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
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(BasicCommand, BasicCommand.Get);
            const cc = new BasicCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                this.tryGetValueDB()?.setValue(BasicCCValues.currentValue.endpoint(this.endpoint.index), response.currentValue);
                return pick(response, ["currentValue", "targetValue", "duration"]);
            }
        }
        async set(targetValue) {
            this.assertSupportsCommand(BasicCommand, BasicCommand.Set);
            const cc = new BasicCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                targetValue,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
    };
    return BasicCCAPI = _classThis;
})();
export { BasicCCAPI };
let BasicCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Basic), implementedVersion(2), ccValues(BasicCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var BasicCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Assume that the endpoint supports Basic CC, so the values get persisted correctly.
            endpoint.addCC(CommandClasses.Basic, { isSupported: true });
            // try to query the current state
            await this.refreshValues(ctx);
            // Remove Basic CC support again when there was no response
            if (this.getValue(ctx, BasicCCValues.currentValue) == undefined) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "No response to Basic Get command, assuming Basic CC is unsupported...",
                });
                // SDS14223: A controlling node MUST conclude that the Basic Command Class is not supported by a node (or
                // endpoint) if no Basic Report is returned.
                endpoint.addCC(CommandClasses.Basic, { isSupported: false });
                if (!endpoint.controlsCC(CommandClasses.Basic)) {
                    endpoint.removeCC(CommandClasses.Basic);
                }
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Basic, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // try to query the current state
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying Basic CC state...",
                direction: "outbound",
            });
            const basicResponse = await api.get();
            if (basicResponse) {
                let logMessage = `received Basic CC state:
current value:      ${basicResponse.currentValue}`;
                if (basicResponse.targetValue != undefined) {
                    logMessage += `
target value:       ${basicResponse.targetValue}
remaining duration: ${basicResponse.duration?.toString() ?? "undefined"}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
        getDefinedValueIDs(ctx) {
            const ret = [];
            const endpoint = this.getEndpoint(ctx);
            const compat = ctx.getDeviceConfig?.(endpoint.nodeId)?.compat;
            if (compat?.mapBasicSet === "event") {
                // Add the compat event value if it should be exposed
                ret.push(BasicCCValues.compatEvent.endpoint(endpoint.index));
            }
            if (endpoint.supportsCC(this.ccId)) {
                // Defer to the base implementation if Basic CC is supported.
                // This implies that no other actuator CC is supported.
                ret.push(...super.getDefinedValueIDs(ctx));
            }
            else if (endpoint.controlsCC(CommandClasses.Basic)) {
                // During the interview, we mark Basic CC as controlled only if we want to expose currentValue
                ret.push(BasicCCValues.currentValue.endpoint(endpoint.index));
            }
            return ret;
        }
    };
    return BasicCC = _classThis;
})();
export { BasicCC };
let BasicCCSet = (() => {
    let _classDecorators = [CCCommand(BasicCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BasicCC;
    var BasicCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.targetValue = options.targetValue;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const targetValue = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                targetValue,
            });
        }
        targetValue;
        serialize(ctx) {
            this.payload = Bytes.from([this.targetValue]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "target value": this.targetValue },
            };
        }
    };
    return BasicCCSet = _classThis;
})();
export { BasicCCSet };
let BasicCCReport = (() => {
    let _classDecorators = [CCCommand(BasicCommand.Report), ccValueProperty("currentValue", BasicCCValues.currentValue), ccValueProperty("targetValue", BasicCCValues.targetValue), ccValueProperty("duration", BasicCCValues.duration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BasicCC;
    var BasicCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // @noCCValues See comment in the constructor
        constructor(options) {
            super(options);
            this.currentValue = options.currentValue;
            this.targetValue = options.targetValue;
            this.duration = options.duration;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const currentValue = 
            // 0xff is a legacy value for 100% (99)
            raw.payload[0] === 0xff
                ? 99
                : parseMaybeNumber(raw.payload[0]);
            validatePayload(currentValue !== undefined);
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
        currentValue;
        targetValue;
        duration;
        persistValues(ctx) {
            // Basic CC Report persists its values itself, since there are some
            // specific rules when which value may be persisted.
            // These rules are essentially encoded in the getDefinedValueIDs overload,
            // so we simply reuse that here.
            // Figure out which values may be persisted.
            const definedValueIDs = this.getDefinedValueIDs(ctx);
            const shouldPersistCurrentValue = definedValueIDs.some((vid) => BasicCCValues.currentValue.is(vid));
            const shouldPersistTargetValue = definedValueIDs.some((vid) => BasicCCValues.targetValue.is(vid));
            const shouldPersistDuration = definedValueIDs.some((vid) => BasicCCValues.duration.is(vid));
            if (this.currentValue !== undefined && shouldPersistCurrentValue) {
                this.setValue(ctx, BasicCCValues.currentValue, this.currentValue);
            }
            if (this.targetValue !== undefined && shouldPersistTargetValue) {
                this.setValue(ctx, BasicCCValues.targetValue, this.targetValue);
            }
            if (this.duration !== undefined && shouldPersistDuration) {
                this.setValue(ctx, BasicCCValues.duration, this.duration);
            }
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.from([
                this.currentValue ?? 0xfe,
                this.targetValue ?? 0xfe,
                (this.duration ?? Duration.unknown()).serializeReport(),
            ]);
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 2 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1, only send the current value
                this.payload = this.payload.subarray(0, 1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "current value": maybeUnknownToString(this.currentValue),
            };
            if (this.targetValue !== undefined) {
                message["target value"] = maybeUnknownToString(this.targetValue);
            }
            if (this.duration != undefined) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return BasicCCReport = _classThis;
})();
export { BasicCCReport };
let BasicCCGet = (() => {
    let _classDecorators = [CCCommand(BasicCommand.Get), expectedCCResponse(BasicCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BasicCC;
    var BasicCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BasicCCGet = _classThis;
})();
export { BasicCCGet };
//# sourceMappingURL=BasicCC.js.map