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
import { CommandClasses, MAX_NODES, MessagePriority, Timeout, ValueMetadata, ZWaveError, ZWaveErrorCodes, enumValuesToMetadataStates, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { LocalProtectionState, ProtectionCommand, RFProtectionState, } from "../lib/_Types.js";
export const ProtectionCCValues = V.defineCCValues(CommandClasses.Protection, {
    ...V.staticProperty("exclusiveControlNodeId", {
        ...ValueMetadata.UInt8,
        min: 1,
        max: MAX_NODES,
        label: "Node ID with exclusive control",
    }, { minVersion: 2 }),
    ...V.staticPropertyWithName("localProtectionState", "local", {
        ...ValueMetadata.Number,
        label: "Local protection state",
        states: enumValuesToMetadataStates(LocalProtectionState),
    }),
    ...V.staticPropertyWithName("rfProtectionState", "rf", {
        ...ValueMetadata.Number,
        label: "RF protection state",
        states: enumValuesToMetadataStates(RFProtectionState),
    }, { minVersion: 2 }),
    ...V.staticProperty("timeout", {
        ...ValueMetadata.UInt8,
        label: "RF protection timeout",
    }, { minVersion: 2 }),
    ...V.staticProperty("supportsExclusiveControl", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsTimeout", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedLocalStates", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedRFStates", undefined, {
        internal: true,
    }),
});
let ProtectionCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Protection)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    let _setExclusiveControl_decorators;
    let _setTimeout_decorators;
    var ProtectionCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            _setExclusiveControl_decorators = [validateArgs()];
            _setTimeout_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setExclusiveControl_decorators, { kind: "method", name: "setExclusiveControl", static: false, private: false, access: { has: obj => "setExclusiveControl" in obj, get: obj => obj.setExclusiveControl }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setTimeout_decorators, { kind: "method", name: "setTimeout", static: false, private: false, access: { has: obj => "setTimeout" in obj, get: obj => obj.setTimeout }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ProtectionCommand.Get:
                    return this.isSinglecast();
                case ProtectionCommand.Set:
                    return true; // This is mandatory
                case ProtectionCommand.SupportedGet:
                    return this.version >= 2 && this.isSinglecast();
                case ProtectionCommand.TimeoutGet:
                case ProtectionCommand.TimeoutSet: {
                    return (this.isSinglecast()
                        && this.tryGetValueDB()?.getValue(ProtectionCCValues.supportsTimeout.endpoint(this.endpoint.index)));
                }
                case ProtectionCommand.ExclusiveControlGet:
                case ProtectionCommand.ExclusiveControlSet: {
                    return (this.isSinglecast()
                        && this.tryGetValueDB()?.getValue(ProtectionCCValues.supportsExclusiveControl.endpoint(this.endpoint.index)));
                }
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                const valueDB = this.tryGetValueDB();
                if (property === "local") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    // We need to set both values together, so retrieve the other one from the value DB
                    const rf = valueDB?.getValue(ProtectionCCValues.rfProtectionState.endpoint(this.endpoint.index));
                    return this.set(value, rf);
                }
                else if (property === "rf") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    // We need to set both values together, so retrieve the other one from the value DB
                    const local = valueDB?.getValue(ProtectionCCValues.localProtectionState.endpoint(this.endpoint.index));
                    return this.set(local ?? LocalProtectionState.Unprotected, value);
                }
                else if (property === "exclusiveControlNodeId") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    return this.setExclusiveControl(value);
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "local":
                    case "rf":
                        return (await this.get())?.[property];
                    case "exclusiveControlNodeId":
                        return this.getExclusiveControl();
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.Get);
            const cc = new ProtectionCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["local", "rf"]);
            }
        }
        async set(local, rf) {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.Set);
            const cc = new ProtectionCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                local,
                rf,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupported() {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.SupportedGet);
            const cc = new ProtectionCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "supportsExclusiveControl",
                    "supportsTimeout",
                    "supportedLocalStates",
                    "supportedRFStates",
                ]);
            }
        }
        async getExclusiveControl() {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.ExclusiveControlGet);
            const cc = new ProtectionCCExclusiveControlGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.exclusiveControlNodeId;
        }
        async setExclusiveControl(nodeId) {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.ExclusiveControlSet);
            const cc = new ProtectionCCExclusiveControlSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                exclusiveControlNodeId: nodeId,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getTimeout() {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.TimeoutGet);
            const cc = new ProtectionCCTimeoutGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.timeout;
        }
        async setTimeout(timeout) {
            this.assertSupportsCommand(ProtectionCommand, ProtectionCommand.TimeoutSet);
            const cc = new ProtectionCCTimeoutSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                timeout,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ProtectionCCAPI = _classThis;
})();
export { ProtectionCCAPI };
let ProtectionCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Protection), implementedVersion(2), ccValues(ProtectionCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ProtectionCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Protection, ctx, endpoint).withOptions({
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
            // First find out what the device supports
            if (api.version >= 2) {
                ctx.logNode(node.id, {
                    message: "querying protection capabilities...",
                    direction: "outbound",
                });
                const resp = await api.getSupported();
                if (resp) {
                    const logMessage = `received protection capabilities:
exclusive control:       ${resp.supportsExclusiveControl}
timeout:                 ${resp.supportsTimeout}
local protection states: ${resp.supportedLocalStates
                        .map((local) => getEnumMemberName(LocalProtectionState, local))
                        .map((str) => `\n· ${str}`)
                        .join("")}
RF protection states:    ${resp.supportedRFStates
                        .map((local) => getEnumMemberName(RFProtectionState, local))
                        .map((str) => `\n· ${str}`)
                        .join("")}`;
                    ctx.logNode(node.id, {
                        message: logMessage,
                        direction: "inbound",
                    });
                }
                else {
                    hadCriticalTimeout = true;
                }
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            if (!hadCriticalTimeout)
                this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Protection, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const supportsExclusiveControl = !!this.getValue(ctx, ProtectionCCValues.supportsExclusiveControl);
            const supportsTimeout = !!this.getValue(ctx, ProtectionCCValues.supportsTimeout);
            // Query the current state
            ctx.logNode(node.id, {
                message: "querying protection status...",
                direction: "outbound",
            });
            const protectionResp = await api.get();
            if (protectionResp) {
                let logMessage = `received protection status:
local: ${getEnumMemberName(LocalProtectionState, protectionResp.local)}`;
                if (protectionResp.rf != undefined) {
                    logMessage += `
rf     ${getEnumMemberName(RFProtectionState, protectionResp.rf)}`;
                }
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
            }
            if (supportsTimeout) {
                // Query the current timeout
                ctx.logNode(node.id, {
                    message: "querying protection timeout...",
                    direction: "outbound",
                });
                const timeout = await api.getTimeout();
                if (timeout) {
                    ctx.logNode(node.id, {
                        message: `received timeout: ${timeout.toString()}`,
                        direction: "inbound",
                    });
                }
            }
            if (supportsExclusiveControl) {
                // Query the current timeout
                ctx.logNode(node.id, {
                    message: "querying exclusive control node...",
                    direction: "outbound",
                });
                const nodeId = await api.getExclusiveControl();
                if (nodeId != undefined) {
                    ctx.logNode(node.id, {
                        message: (nodeId !== 0
                            ? `Node ${nodeId.toString().padStart(3, "0")}`
                            : `no node`) + ` has exclusive control`,
                        direction: "inbound",
                    });
                }
            }
        }
    };
    return ProtectionCC = _classThis;
})();
export { ProtectionCC };
let ProtectionCCSet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.local = options.local;
            this.rf = options.rf;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ProtectionCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        local;
        rf;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.local & 0b1111,
                (this.rf ?? RFProtectionState.Unprotected) & 0b1111,
            ]);
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 2 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1, only include the local state
                this.payload = this.payload.subarray(0, 1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                local: getEnumMemberName(LocalProtectionState, this.local),
            };
            if (this.rf != undefined) {
                message.rf = getEnumMemberName(RFProtectionState, this.rf);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ProtectionCCSet = _classThis;
})();
export { ProtectionCCSet };
let ProtectionCCReport = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.Report), ccValueProperty("local", ProtectionCCValues.localProtectionState), ccValueProperty("rf", ProtectionCCValues.rfProtectionState)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.local = options.local;
            this.rf = options.rf;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const local = raw.payload[0] & 0b1111;
            let rf;
            if (raw.payload.length >= 2) {
                rf = raw.payload[1] & 0b1111;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                local,
                rf,
            });
        }
        local;
        rf;
        toLogEntry(ctx) {
            const message = {
                local: getEnumMemberName(LocalProtectionState, this.local),
            };
            if (this.rf != undefined) {
                message.rf = getEnumMemberName(RFProtectionState, this.rf);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ProtectionCCReport = _classThis;
})();
export { ProtectionCCReport };
let ProtectionCCGet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.Get), expectedCCResponse(ProtectionCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ProtectionCCGet = _classThis;
})();
export { ProtectionCCGet };
let ProtectionCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.SupportedReport), ccValueProperty("supportsExclusiveControl", ProtectionCCValues.supportsExclusiveControl), ccValueProperty("supportsTimeout", ProtectionCCValues.supportsTimeout), ccValueProperty("supportedLocalStates", ProtectionCCValues.supportedLocalStates), ccValueProperty("supportedRFStates", ProtectionCCValues.supportedRFStates)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportsTimeout = options.supportsTimeout;
            this.supportsExclusiveControl = options.supportsExclusiveControl;
            this.supportedLocalStates = options.supportedLocalStates;
            this.supportedRFStates = options.supportedRFStates;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 5);
            const supportsTimeout = !!(raw.payload[0] & 0b1);
            const supportsExclusiveControl = !!(raw.payload[0] & 0b10);
            const supportedLocalStates = parseBitMask(raw.payload.subarray(1, 3), LocalProtectionState.Unprotected);
            const supportedRFStates = parseBitMask(raw.payload.subarray(3, 5), RFProtectionState.Unprotected);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportsTimeout,
                supportsExclusiveControl,
                supportedLocalStates,
                supportedRFStates,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // update metadata (partially) for the local and rf values
            const localStateValue = ProtectionCCValues.localProtectionState;
            this.setMetadata(ctx, localStateValue, {
                ...localStateValue.meta,
                states: enumValuesToMetadataStates(LocalProtectionState, this.supportedLocalStates),
            });
            const rfStateValue = ProtectionCCValues.rfProtectionState;
            this.setMetadata(ctx, rfStateValue, {
                ...rfStateValue.meta,
                states: enumValuesToMetadataStates(RFProtectionState, this.supportedRFStates),
            });
            return true;
        }
        supportsExclusiveControl;
        supportsTimeout;
        supportedLocalStates;
        supportedRFStates;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supports exclusive control": this.supportsExclusiveControl,
                    "supports timeout": this.supportsTimeout,
                    "local protection states": this.supportedLocalStates
                        .map((local) => getEnumMemberName(LocalProtectionState, local))
                        .map((str) => `\n· ${str}`)
                        .join(""),
                    "RF protection states": this.supportedRFStates
                        .map((rf) => getEnumMemberName(RFProtectionState, rf))
                        .map((str) => `\n· ${str}`)
                        .join(""),
                },
            };
        }
    };
    return ProtectionCCSupportedReport = _classThis;
})();
export { ProtectionCCSupportedReport };
let ProtectionCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.SupportedGet), expectedCCResponse(ProtectionCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ProtectionCCSupportedGet = _classThis;
})();
export { ProtectionCCSupportedGet };
let ProtectionCCExclusiveControlReport = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.ExclusiveControlReport), ccValueProperty("exclusiveControlNodeId", ProtectionCCValues.exclusiveControlNodeId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCExclusiveControlReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCExclusiveControlReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.exclusiveControlNodeId = options.exclusiveControlNodeId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const exclusiveControlNodeId = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                exclusiveControlNodeId,
            });
        }
        exclusiveControlNodeId;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "exclusive control node id": this.exclusiveControlNodeId,
                },
            };
        }
    };
    return ProtectionCCExclusiveControlReport = _classThis;
})();
export { ProtectionCCExclusiveControlReport };
let ProtectionCCExclusiveControlGet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.ExclusiveControlGet), expectedCCResponse(ProtectionCCExclusiveControlReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCExclusiveControlGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCExclusiveControlGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ProtectionCCExclusiveControlGet = _classThis;
})();
export { ProtectionCCExclusiveControlGet };
let ProtectionCCExclusiveControlSet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.ExclusiveControlSet), expectedCCResponse(ProtectionCCReport), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCExclusiveControlSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCExclusiveControlSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.exclusiveControlNodeId = options.exclusiveControlNodeId;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ProtectionCCExclusiveControlSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        exclusiveControlNodeId;
        serialize(ctx) {
            this.payload = Bytes.from([this.exclusiveControlNodeId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "exclusive control node id": this.exclusiveControlNodeId,
                },
            };
        }
    };
    return ProtectionCCExclusiveControlSet = _classThis;
})();
export { ProtectionCCExclusiveControlSet };
let ProtectionCCTimeoutReport = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.TimeoutReport), ccValueProperty("timeout", ProtectionCCValues.timeout)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCTimeoutReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCTimeoutReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.timeout = options.timeout;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const timeout = Timeout.parse(raw.payload[0]);
            return new this({
                nodeId: ctx.sourceNodeId,
                timeout,
            });
        }
        timeout;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { timeout: this.timeout.toString() },
            };
        }
    };
    return ProtectionCCTimeoutReport = _classThis;
})();
export { ProtectionCCTimeoutReport };
let ProtectionCCTimeoutGet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.TimeoutGet), expectedCCResponse(ProtectionCCTimeoutReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCTimeoutGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCTimeoutGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ProtectionCCTimeoutGet = _classThis;
})();
export { ProtectionCCTimeoutGet };
let ProtectionCCTimeoutSet = (() => {
    let _classDecorators = [CCCommand(ProtectionCommand.TimeoutSet), expectedCCResponse(ProtectionCCReport), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ProtectionCC;
    var ProtectionCCTimeoutSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ProtectionCCTimeoutSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.timeout = options.timeout;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ProtectionCCTimeoutSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        timeout;
        serialize(ctx) {
            this.payload = Bytes.from([this.timeout.serialize()]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { timeout: this.timeout.toString() },
            };
        }
    };
    return ProtectionCCTimeoutSet = _classThis;
})();
export { ProtectionCCTimeoutSet };
//# sourceMappingURL=ProtectionCC.js.map