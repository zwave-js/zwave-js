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
import { CommandClasses, MessagePriority, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, throwUnsupportedProperty, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { SetbackType, ThermostatSetbackCommand, } from "../lib/_Types.js";
import { decodeSetbackState, encodeSetbackState } from "../lib/serializers.js";
// @noSetValueAPI
// The setback state consist of two values that must be set together
let ThermostatSetbackCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Thermostat Setback"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var ThermostatSetbackCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetbackCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ThermostatSetbackCommand.Get:
                    return this.isSinglecast();
                case ThermostatSetbackCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "setbackType":
                    case "setbackState":
                        return (await this.get())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ThermostatSetbackCommand, ThermostatSetbackCommand.Get);
            const cc = new ThermostatSetbackCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["setbackType", "setbackState"]);
            }
        }
        async set(setbackType, setbackState) {
            this.assertSupportsCommand(ThermostatSetbackCommand, ThermostatSetbackCommand.Get);
            const cc = new ThermostatSetbackCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                setbackType,
                setbackState,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ThermostatSetbackCCAPI = _classThis;
})();
export { ThermostatSetbackCCAPI };
let ThermostatSetbackCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Thermostat Setback"]), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ThermostatSetbackCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetbackCC = _classThis = _classDescriptor.value;
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
            const api = CCAPI.create(CommandClasses["Thermostat Setback"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the thermostat state
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying the current thermostat state...",
                direction: "outbound",
            });
            const setbackResp = await api.get();
            if (setbackResp) {
                const logMessage = `received current state:
setback type:  ${getEnumMemberName(SetbackType, setbackResp.setbackType)}
setback state: ${setbackResp.setbackState}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
    };
    return ThermostatSetbackCC = _classThis;
})();
export { ThermostatSetbackCC };
let ThermostatSetbackCCSet = (() => {
    let _classDecorators = [CCCommand(ThermostatSetbackCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetbackCC;
    var ThermostatSetbackCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetbackCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setbackType = options.setbackType;
            this.setbackState = options.setbackState;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const setbackType = raw.payload[0] & 0b11;
            const setbackState = decodeSetbackState(raw.payload, 1)
                // If we receive an unknown setback state, return the raw value
                || raw.payload.readInt8(1);
            return new this({
                nodeId: ctx.sourceNodeId,
                setbackType,
                setbackState,
            });
        }
        setbackType;
        /** The offset from the setpoint in 0.1 Kelvin or a special mode */
        setbackState;
        serialize(ctx) {
            this.payload = Bytes.concat([
                [this.setbackType & 0b11],
                encodeSetbackState(this.setbackState),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setback type": getEnumMemberName(SetbackType, this.setbackType),
                    "setback state": typeof this.setbackState === "number"
                        ? `${this.setbackState} K`
                        : this.setbackState,
                },
            };
        }
    };
    return ThermostatSetbackCCSet = _classThis;
})();
export { ThermostatSetbackCCSet };
let ThermostatSetbackCCReport = (() => {
    let _classDecorators = [CCCommand(ThermostatSetbackCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetbackCC;
    var ThermostatSetbackCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetbackCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.setbackType = options.setbackType;
            this.setbackState = options.setbackState;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const setbackType = raw.payload[0] & 0b11;
            const setbackState = decodeSetbackState(raw.payload, 1)
                // If we receive an unknown setback state, return the raw value
                || raw.payload.readInt8(1);
            return new this({
                nodeId: ctx.sourceNodeId,
                setbackType,
                setbackState,
            });
        }
        setbackType;
        /** The offset from the setpoint in 0.1 Kelvin or a special mode */
        setbackState;
        serialize(ctx) {
            this.payload = Bytes.concat([
                [this.setbackType & 0b11],
                encodeSetbackState(this.setbackState),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "setback type": getEnumMemberName(SetbackType, this.setbackType),
                    "setback state": typeof this.setbackState === "number"
                        ? `${this.setbackState} K`
                        : this.setbackState,
                },
            };
        }
    };
    return ThermostatSetbackCCReport = _classThis;
})();
export { ThermostatSetbackCCReport };
let ThermostatSetbackCCGet = (() => {
    let _classDecorators = [CCCommand(ThermostatSetbackCommand.Get), expectedCCResponse(ThermostatSetbackCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatSetbackCC;
    var ThermostatSetbackCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatSetbackCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ThermostatSetbackCCGet = _classThis;
})();
export { ThermostatSetbackCCGet };
//# sourceMappingURL=ThermostatSetbackCC.js.map