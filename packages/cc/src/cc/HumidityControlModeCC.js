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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, enumValuesToMetadataStates, parseBitMask, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { HumidityControlMode, HumidityControlModeCommand, } from "../lib/_Types.js";
export const HumidityControlModeCCValues = V.defineCCValues(CommandClasses["Humidity Control Mode"], {
    ...V.staticProperty("mode", {
        ...ValueMetadata.UInt8,
        states: enumValuesToMetadataStates(HumidityControlMode),
        label: "Humidity control mode",
    }),
    ...V.staticProperty("supportedModes", undefined, { internal: true }),
});
let HumidityControlModeCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Humidity Control Mode"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var HumidityControlModeCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case HumidityControlModeCommand.Get:
                case HumidityControlModeCommand.SupportedGet:
                    return this.isSinglecast();
                case HumidityControlModeCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                if (property === "mode") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
                const result = await this.set(value);
                // Verify the change after a delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    this.schedulePoll({ property }, value);
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "mode":
                        return this.get();
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async get() {
            this.assertSupportsCommand(HumidityControlModeCommand, HumidityControlModeCommand.Get);
            const cc = new HumidityControlModeCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return response?.mode;
            }
        }
        async set(mode) {
            this.assertSupportsCommand(HumidityControlModeCommand, HumidityControlModeCommand.Set);
            const cc = new HumidityControlModeCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                mode,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getSupportedModes() {
            this.assertSupportsCommand(HumidityControlModeCommand, HumidityControlModeCommand.SupportedGet);
            const cc = new HumidityControlModeCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedModes;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return HumidityControlModeCCAPI = _classThis;
})();
export { HumidityControlModeCCAPI };
let HumidityControlModeCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Humidity Control Mode"]), implementedVersion(1), ccValues(HumidityControlModeCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var HumidityControlModeCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Humidity Control Mode"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // First query the possible modes to set the metadata
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying supported humidity control modes...",
                direction: "outbound",
            });
            const supportedModes = await api.getSupportedModes();
            if (supportedModes) {
                const logMessage = `received supported humidity control modes:${supportedModes
                    .map((mode) => `\n· ${getEnumMemberName(HumidityControlMode, mode)}`)
                    .join("")}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying supported humidity control modes timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Humidity Control Mode"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the current status
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying current humidity control mode...",
                direction: "outbound",
            });
            const currentMode = await api.get();
            if (currentMode) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "received current humidity control mode: "
                        + getEnumMemberName(HumidityControlMode, currentMode),
                    direction: "inbound",
                });
            }
        }
    };
    return HumidityControlModeCC = _classThis;
})();
export { HumidityControlModeCC };
let HumidityControlModeCCSet = (() => {
    let _classDecorators = [CCCommand(HumidityControlModeCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlModeCC;
    var HumidityControlModeCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.mode = options.mode;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new HumidityControlModeCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        mode;
        serialize(ctx) {
            this.payload = Bytes.from([this.mode & 0b1111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    mode: getEnumMemberName(HumidityControlMode, this.mode),
                },
            };
        }
    };
    return HumidityControlModeCCSet = _classThis;
})();
export { HumidityControlModeCCSet };
let HumidityControlModeCCReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlModeCommand.Report), ccValueProperty("mode", HumidityControlModeCCValues.mode)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlModeCC;
    var HumidityControlModeCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.mode = options.mode;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const mode = raw.payload[0] & 0b1111;
            return new this({
                nodeId: ctx.sourceNodeId,
                mode,
            });
        }
        mode;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    mode: getEnumMemberName(HumidityControlMode, this.mode),
                },
            };
        }
    };
    return HumidityControlModeCCReport = _classThis;
})();
export { HumidityControlModeCCReport };
let HumidityControlModeCCGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlModeCommand.Get), expectedCCResponse(HumidityControlModeCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlModeCC;
    var HumidityControlModeCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return HumidityControlModeCCGet = _classThis;
})();
export { HumidityControlModeCCGet };
let HumidityControlModeCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlModeCommand.SupportedReport), ccValueProperty("supportedModes", HumidityControlModeCCValues.supportedModes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlModeCC;
    var HumidityControlModeCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedModes = options.supportedModes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const supportedModes = parseBitMask(raw.payload, HumidityControlMode.Off);
            if (!supportedModes.includes(HumidityControlMode.Off)) {
                supportedModes.unshift(HumidityControlMode.Off);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedModes,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Use this information to create the metadata for the mode property
            const modeValue = HumidityControlModeCCValues.mode;
            this.setMetadata(ctx, modeValue, {
                ...modeValue.meta,
                states: enumValuesToMetadataStates(HumidityControlMode, this.supportedModes),
            });
            return true;
        }
        supportedModes;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported modes": this.supportedModes
                        .map((mode) => `\n· ${getEnumMemberName(HumidityControlMode, mode)}`)
                        .join(""),
                },
            };
        }
    };
    return HumidityControlModeCCSupportedReport = _classThis;
})();
export { HumidityControlModeCCSupportedReport };
let HumidityControlModeCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlModeCommand.SupportedGet), expectedCCResponse(HumidityControlModeCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlModeCC;
    var HumidityControlModeCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlModeCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return HumidityControlModeCCSupportedGet = _classThis;
})();
export { HumidityControlModeCCSupportedGet };
//# sourceMappingURL=HumidityControlModeCC.js.map