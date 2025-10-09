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
import { CommandClasses, MessagePriority, TransmitOptions, ValueMetadata, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { clamp } from "alcalzone-shared/math";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { WakeUpCommand } from "../lib/_Types.js";
export const WakeUpCCValues = V.defineCCValues(CommandClasses["Wake Up"], {
    ...V.staticProperty("controllerNodeId", {
        ...ValueMetadata.ReadOnly,
        label: "Node ID of the controller",
    }, {
        supportsEndpoints: false,
    }),
    ...V.staticProperty("wakeUpInterval", {
        ...ValueMetadata.UInt24,
        label: "Wake Up interval",
    }, {
        supportsEndpoints: false,
    }),
    ...V.staticProperty("wakeUpOnDemandSupported", undefined, {
        internal: true,
        supportsEndpoints: false,
        minVersion: 3,
    }),
});
let WakeUpCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Wake Up"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _setInterval_decorators;
    var WakeUpCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _setInterval_decorators = [validateArgs()];
            __esDecorate(this, null, _setInterval_decorators, { kind: "method", name: "setInterval", static: false, private: false, access: { has: obj => "setInterval" in obj, get: obj => obj.setInterval }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case WakeUpCommand.IntervalGet:
                    return this.isSinglecast();
                case WakeUpCommand.IntervalSet:
                case WakeUpCommand.NoMoreInformation:
                    return true; // This is mandatory
                case WakeUpCommand.IntervalCapabilitiesGet:
                    return this.version >= 2 && this.isSinglecast();
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                if (property !== "wakeUpInterval") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                const result = await this.setInterval(value, this.host.ownNodeId ?? 1);
                // Verify the change after a short delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    this.schedulePoll({ property }, value, { transition: "fast" });
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "wakeUpInterval":
                        return (await this.getInterval())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getInterval() {
            this.assertSupportsCommand(WakeUpCommand, WakeUpCommand.IntervalGet);
            const cc = new WakeUpCCIntervalGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["wakeUpInterval", "controllerNodeId"]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getIntervalCapabilities() {
            this.assertSupportsCommand(WakeUpCommand, WakeUpCommand.IntervalCapabilitiesGet);
            const cc = new WakeUpCCIntervalCapabilitiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "defaultWakeUpInterval",
                    "minWakeUpInterval",
                    "maxWakeUpInterval",
                    "wakeUpIntervalSteps",
                    "wakeUpOnDemandSupported",
                ]);
            }
        }
        async setInterval(wakeUpInterval, controllerNodeId) {
            this.assertSupportsCommand(WakeUpCommand, WakeUpCommand.IntervalSet);
            const cc = new WakeUpCCIntervalSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                wakeUpInterval,
                controllerNodeId,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async sendNoMoreInformation() {
            this.assertSupportsCommand(WakeUpCommand, WakeUpCommand.NoMoreInformation);
            const cc = new WakeUpCCNoMoreInformation({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            await this.host.sendCommand(cc, {
                ...this.commandOptions,
                // This command must be sent as part of the wake up queue
                priority: MessagePriority.WakeUp,
                // Don't try to resend this - if we get no response, the node is most likely asleep
                maxSendAttempts: 1,
                // Also we don't want to wait for an ACK because this can lock up the network for seconds
                // if the target node is asleep and doesn't respond to the command
                transmitOptions: TransmitOptions.DEFAULT_NOACK,
            });
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return WakeUpCCAPI = _classThis;
})();
export { WakeUpCCAPI };
let WakeUpCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Wake Up"]), implementedVersion(3), ccValues(WakeUpCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var WakeUpCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Wake Up"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            if (node.id === ctx.ownNodeId) {
                ctx.logNode(node.id, `skipping wakeup configuration for the controller`);
            }
            else if (node.isFrequentListening) {
                ctx.logNode(node.id, `skipping wakeup configuration for frequent listening device`);
            }
            else {
                let desiredInterval;
                let currentControllerNodeId;
                let minInterval;
                let maxInterval;
                // Retrieve the allowed wake up intervals and wake on demand support if possible
                if (api.version >= 2) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "retrieving wakeup capabilities from the device...",
                        direction: "outbound",
                    });
                    const wakeupCaps = await api.getIntervalCapabilities();
                    if (wakeupCaps) {
                        const logMessage = `received wakeup capabilities:
default wakeup interval: ${wakeupCaps.defaultWakeUpInterval} seconds
minimum wakeup interval: ${wakeupCaps.minWakeUpInterval} seconds
maximum wakeup interval: ${wakeupCaps.maxWakeUpInterval} seconds
wakeup interval steps:   ${wakeupCaps.wakeUpIntervalSteps} seconds
wakeup on demand supported: ${wakeupCaps.wakeUpOnDemandSupported}`;
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: logMessage,
                            direction: "inbound",
                        });
                        minInterval = wakeupCaps.minWakeUpInterval;
                        maxInterval = wakeupCaps.maxWakeUpInterval;
                    }
                }
                // SDS14223 prescribes a IntervalSet followed by a check
                // We have no intention of changing the interval (maybe some time in the future)
                // So for now get the current interval and just set the controller ID
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "retrieving wakeup interval from the device...",
                    direction: "outbound",
                });
                const wakeupResp = await api.getInterval();
                if (wakeupResp) {
                    const logMessage = `received wakeup configuration:
wakeup interval: ${wakeupResp.wakeUpInterval} seconds
controller node: ${wakeupResp.controllerNodeId}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                    desiredInterval = wakeupResp.wakeUpInterval;
                    currentControllerNodeId = wakeupResp.controllerNodeId;
                }
                else {
                    // Just guess, I guess
                    desiredInterval = 3600 * 6; // 6 hours
                    currentControllerNodeId = 0; // assume not set
                }
                const ownNodeId = ctx.ownNodeId;
                // Only change the destination if necessary
                if (currentControllerNodeId !== ownNodeId) {
                    // Spec compliance: Limit the interval to the allowed range, but...
                    // ...try and preserve a "never wake up" configuration (#6367)
                    if (desiredInterval !== 0
                        && minInterval != undefined
                        && maxInterval != undefined) {
                        desiredInterval = clamp(desiredInterval, minInterval, maxInterval);
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "configuring wakeup destination node",
                        direction: "outbound",
                    });
                    await api.setInterval(desiredInterval, ownNodeId);
                    this.setValue(ctx, WakeUpCCValues.controllerNodeId, ownNodeId);
                    ctx.logNode(node.id, "wakeup destination node changed!");
                }
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return WakeUpCC = _classThis;
})();
export { WakeUpCC };
let WakeUpCCIntervalSet = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.IntervalSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCIntervalSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCIntervalSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.wakeUpInterval = options.wakeUpInterval;
            this.controllerNodeId = options.controllerNodeId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const wakeUpInterval = raw.payload.readUIntBE(0, 3);
            const controllerNodeId = raw.payload[3];
            return new this({
                nodeId: ctx.sourceNodeId,
                wakeUpInterval,
                controllerNodeId,
            });
        }
        wakeUpInterval;
        controllerNodeId;
        serialize(ctx) {
            this.payload = Bytes.from([
                0,
                0,
                0, // placeholder
                this.controllerNodeId,
            ]);
            this.payload.writeUIntBE(this.wakeUpInterval, 0, 3);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "wake-up interval": `${this.wakeUpInterval} seconds`,
                    "controller node id": this.controllerNodeId,
                },
            };
        }
    };
    return WakeUpCCIntervalSet = _classThis;
})();
export { WakeUpCCIntervalSet };
let WakeUpCCIntervalReport = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.IntervalReport), ccValueProperty("wakeUpInterval", WakeUpCCValues.wakeUpInterval), ccValueProperty("controllerNodeId", WakeUpCCValues.controllerNodeId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCIntervalReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCIntervalReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.wakeUpInterval = options.wakeUpInterval;
            this.controllerNodeId = options.controllerNodeId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const wakeUpInterval = raw.payload.readUIntBE(0, 3);
            const controllerNodeId = raw.payload[3];
            return new this({
                nodeId: ctx.sourceNodeId,
                wakeUpInterval,
                controllerNodeId,
            });
        }
        wakeUpInterval;
        controllerNodeId;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "wake-up interval": `${this.wakeUpInterval} seconds`,
                    "controller node id": this.controllerNodeId,
                },
            };
        }
    };
    return WakeUpCCIntervalReport = _classThis;
})();
export { WakeUpCCIntervalReport };
let WakeUpCCIntervalGet = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.IntervalGet), expectedCCResponse(WakeUpCCIntervalReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCIntervalGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCIntervalGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return WakeUpCCIntervalGet = _classThis;
})();
export { WakeUpCCIntervalGet };
let WakeUpCCWakeUpNotification = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.WakeUpNotification)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCWakeUpNotification = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCWakeUpNotification = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return WakeUpCCWakeUpNotification = _classThis;
})();
export { WakeUpCCWakeUpNotification };
let WakeUpCCNoMoreInformation = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.NoMoreInformation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCNoMoreInformation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCNoMoreInformation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return WakeUpCCNoMoreInformation = _classThis;
})();
export { WakeUpCCNoMoreInformation };
let WakeUpCCIntervalCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.IntervalCapabilitiesReport), ccValueProperty("wakeUpOnDemandSupported", WakeUpCCValues.wakeUpOnDemandSupported)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCIntervalCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCIntervalCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.minWakeUpInterval = options.minWakeUpInterval;
            this.maxWakeUpInterval = options.maxWakeUpInterval;
            this.defaultWakeUpInterval = options.defaultWakeUpInterval;
            this.wakeUpIntervalSteps = options.wakeUpIntervalSteps;
            this.wakeUpOnDemandSupported = options.wakeUpOnDemandSupported;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 12);
            const minWakeUpInterval = raw.payload.readUIntBE(0, 3);
            const maxWakeUpInterval = raw.payload.readUIntBE(3, 3);
            const defaultWakeUpInterval = raw.payload.readUIntBE(6, 3);
            const wakeUpIntervalSteps = raw.payload.readUIntBE(9, 3);
            let wakeUpOnDemandSupported = false;
            if (raw.payload.length >= 13) {
                // V3+
                wakeUpOnDemandSupported = !!(raw.payload[12] & 0b1);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                minWakeUpInterval,
                maxWakeUpInterval,
                defaultWakeUpInterval,
                wakeUpIntervalSteps,
                wakeUpOnDemandSupported,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const valueDB = this.getValueDB(ctx);
            // Store the received information as metadata for the wake up interval
            valueDB.setMetadata({
                commandClass: this.ccId,
                endpoint: this.endpointIndex,
                property: "wakeUpInterval",
            }, {
                ...ValueMetadata.WriteOnlyUInt24,
                min: this.minWakeUpInterval,
                max: this.maxWakeUpInterval,
                steps: this.wakeUpIntervalSteps,
                default: this.defaultWakeUpInterval,
            });
            // Store wakeUpOnDemandSupported in valueDB
            return true;
        }
        minWakeUpInterval;
        maxWakeUpInterval;
        defaultWakeUpInterval;
        wakeUpIntervalSteps;
        wakeUpOnDemandSupported;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "default interval": `${this.defaultWakeUpInterval} seconds`,
                    "minimum interval": `${this.minWakeUpInterval} seconds`,
                    "maximum interval": `${this.maxWakeUpInterval} seconds`,
                    "interval steps": `${this.wakeUpIntervalSteps} seconds`,
                    "wake up on demand supported": `${this.wakeUpOnDemandSupported}`,
                },
            };
        }
    };
    return WakeUpCCIntervalCapabilitiesReport = _classThis;
})();
export { WakeUpCCIntervalCapabilitiesReport };
let WakeUpCCIntervalCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(WakeUpCommand.IntervalCapabilitiesGet), expectedCCResponse(WakeUpCCIntervalCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WakeUpCC;
    var WakeUpCCIntervalCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WakeUpCCIntervalCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return WakeUpCCIntervalCapabilitiesGet = _classThis;
})();
export { WakeUpCCIntervalCapabilitiesGet };
//# sourceMappingURL=WakeUpCC.js.map