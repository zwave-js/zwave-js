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
import { CommandClasses, Duration, MessagePriority, UNKNOWN_STATE, ValueMetadata, encodeMaybeBoolean, maybeUnknownToString, parseMaybeBoolean, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, SET_VALUE_HOOKS, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { BinarySwitchCommand } from "../lib/_Types.js";
export const BinarySwitchCCValues = V.defineCCValues(CommandClasses["Binary Switch"], {
    ...V.staticProperty("currentValue", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Current value",
    }),
    ...V.staticProperty("targetValue", {
        ...ValueMetadata.Boolean,
        label: "Target value",
        valueChangeOptions: ["transitionDuration"],
    }),
    ...V.staticProperty("duration", {
        ...ValueMetadata.ReadOnlyDuration,
        label: "Remaining duration",
    }, { minVersion: 2 }),
});
let BinarySwitchCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Binary Switch"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var BinarySwitchCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySwitchCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case BinarySwitchCommand.Get:
                    return this.isSinglecast();
                case BinarySwitchCommand.Set:
                    return true;
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(BinarySwitchCommand, BinarySwitchCommand.Get);
            const cc = new BinarySwitchCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    // interpret unknown values as false
                    currentValue: response.currentValue || false,
                    targetValue: response.targetValue,
                    duration: response.duration,
                };
            }
        }
        /**
         * Sets the switch to the given value
         * @param targetValue The target value to set
         * @param duration The duration after which the target value should be reached. Can be a Duration instance or a user-friendly duration string like `"1m17s"`. Only supported in V2 and above.
         */
        async set(targetValue, duration) {
            this.assertSupportsCommand(BinarySwitchCommand, BinarySwitchCommand.Set);
            const cc = new BinarySwitchCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                targetValue,
                duration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_set_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property }, value, options) {
                if (property !== "targetValue") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "boolean") {
                    throwWrongValueType(this.ccId, property, "boolean", typeof value);
                }
                const duration = Duration.from(options?.transitionDuration);
                return this.set(value, duration);
            };
        }
        [SET_VALUE_HOOKS] = (__runInitializers(this, _instanceExtraInitializers), ({ property }, value, options) => {
            if (property === "targetValue") {
                const currentValueValueId = BinarySwitchCCValues.currentValue
                    .endpoint(this.endpoint.index);
                return {
                    optimisticallyUpdateRelatedValues: (_supervisedAndSuccessful) => {
                        // After setting targetValue, optimistically update currentValue
                        if (this.isSinglecast()) {
                            this.tryGetValueDB()?.setValue(currentValueValueId, value);
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
                                    ?.setValue(currentValueValueId, value);
                            }
                        }
                    },
                    verifyChanges: () => {
                        if (this.isSinglecast()) {
                            // We query currentValue instead of targetValue to make sure that unsolicited updates cancel the scheduled poll
                            this.schedulePoll(currentValueValueId, value, {
                                duration: Duration.from(options?.transitionDuration),
                                // on/off "transitions" are usually fast
                                transition: "fast",
                            });
                        }
                        else {
                            // For multicasts, do not schedule a refresh - this could cause a LOT of traffic
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
    return BinarySwitchCCAPI = _classThis;
})();
export { BinarySwitchCCAPI };
let BinarySwitchCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Binary Switch"]), implementedVersion(2), ccValues(BinarySwitchCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var BinarySwitchCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySwitchCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Binary Switch"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the current state
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying Binary Switch state...",
                direction: "outbound",
            });
            const resp = await api.get();
            if (resp) {
                let logMessage = `received Binary Switch state:
current value:      ${resp.currentValue}`;
                if (resp.targetValue != undefined) {
                    logMessage += `
target value:       ${resp.targetValue}
remaining duration: ${resp.duration?.toString() ?? "undefined"}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
        setMappedBasicValue(ctx, value) {
            this.setValue(ctx, BinarySwitchCCValues.currentValue, value > 0);
            return true;
        }
    };
    return BinarySwitchCC = _classThis;
})();
export { BinarySwitchCC };
let BinarySwitchCCSet = (() => {
    let _classDecorators = [CCCommand(BinarySwitchCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySwitchCC;
    var BinarySwitchCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySwitchCCSet = _classThis = _classDescriptor.value;
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
            const targetValue = !!raw.payload[0];
            let duration;
            if (raw.payload.length >= 2) {
                duration = Duration.parseSet(raw.payload[1]);
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
                this.targetValue ? 0xff : 0x00,
                (this.duration ?? Duration.default()).serializeSet(),
            ]);
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 2 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1, only send the target value
                this.payload = this.payload.subarray(0, 1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "target value": this.targetValue,
            };
            if (this.duration != undefined) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return BinarySwitchCCSet = _classThis;
})();
export { BinarySwitchCCSet };
let BinarySwitchCCReport = (() => {
    let _classDecorators = [CCCommand(BinarySwitchCommand.Report), ccValueProperty("currentValue", BinarySwitchCCValues.currentValue), ccValueProperty("targetValue", BinarySwitchCCValues.targetValue), ccValueProperty("duration", BinarySwitchCCValues.duration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySwitchCC;
    var BinarySwitchCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySwitchCCReport = _classThis = _classDescriptor.value;
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
            const currentValue = parseMaybeBoolean(raw.payload[0]);
            let targetValue;
            let duration;
            if (raw.payload.length >= 3) {
                targetValue = parseMaybeBoolean(raw.payload[1]);
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
        serialize(ctx) {
            this.payload = Bytes.from([
                encodeMaybeBoolean(this.currentValue ?? UNKNOWN_STATE),
            ]);
            if (this.targetValue !== undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([
                        encodeMaybeBoolean(this.targetValue),
                        (this.duration ?? Duration.default()).serializeReport(),
                    ]),
                ]);
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
    return BinarySwitchCCReport = _classThis;
})();
export { BinarySwitchCCReport };
let BinarySwitchCCGet = (() => {
    let _classDecorators = [CCCommand(BinarySwitchCommand.Get), expectedCCResponse(BinarySwitchCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BinarySwitchCC;
    var BinarySwitchCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarySwitchCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BinarySwitchCCGet = _classThis;
})();
export { BinarySwitchCCGet };
//# sourceMappingURL=BinarySwitchCC.js.map