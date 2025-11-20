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
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ThermostatFanMode, ThermostatFanModeCommand } from "../lib/_Types.js";
export const ThermostatFanModeCCValues = V.defineCCValues(CommandClasses["Thermostat Fan Mode"], {
    ...V.staticPropertyWithName("turnedOff", "off", {
        ...ValueMetadata.Boolean,
        label: "Thermostat fan turned off",
    }, { minVersion: 3 }),
    ...V.staticPropertyWithName("fanMode", "mode", {
        ...ValueMetadata.UInt8,
        states: enumValuesToMetadataStates(ThermostatFanMode),
        label: "Thermostat fan mode",
    }),
    ...V.staticPropertyWithName("supportedFanModes", "supportedModes", undefined, { internal: true }),
});
let ThermostatFanModeCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Thermostat Fan Mode"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var ThermostatFanModeCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ThermostatFanModeCommand.Get:
                case ThermostatFanModeCommand.SupportedGet:
                    return this.isSinglecast();
                case ThermostatFanModeCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                const valueDB = this.getValueDB();
                let result;
                if (property === "mode") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    // Preserve the value of the "off" flag
                    const off = valueDB.getValue(ThermostatFanModeCCValues.turnedOff.endpoint(this.endpoint.index));
                    result = await this.set(value, off);
                }
                else if (property === "off") {
                    if (typeof value !== "boolean") {
                        throwWrongValueType(this.ccId, property, "boolean", typeof value);
                    }
                    const mode = valueDB.getValue(ThermostatFanModeCCValues.fanMode.endpoint(this.endpoint.index));
                    if (mode == undefined) {
                        throw new ZWaveError(`The "off" property cannot be changed before the fan mode is known!`, ZWaveErrorCodes.Argument_Invalid);
                    }
                    result = await this.set(mode, value);
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
                // Verify the current value after a delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    // TODO: Ideally this would be a short delay, but some thermostats like Remotec ZXT-600
                    // aren't able to handle the GET this quickly.
                    this.schedulePoll({ property }, value);
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "mode":
                    case "off":
                        return (await this.get())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ThermostatFanModeCommand, ThermostatFanModeCommand.Get);
            const cc = new ThermostatFanModeCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["mode", "off"]);
            }
        }
        async set(mode, off) {
            this.assertSupportsCommand(ThermostatFanModeCommand, ThermostatFanModeCommand.Set);
            const cc = new ThermostatFanModeCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                mode,
                off,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getSupportedModes() {
            this.assertSupportsCommand(ThermostatFanModeCommand, ThermostatFanModeCommand.SupportedGet);
            const cc = new ThermostatFanModeCCSupportedGet({
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
    return ThermostatFanModeCCAPI = _classThis;
})();
export { ThermostatFanModeCCAPI };
let ThermostatFanModeCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Thermostat Fan Mode"]), implementedVersion(5), ccValues(ThermostatFanModeCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ThermostatFanModeCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Thermostat Fan Mode"], ctx, endpoint).withOptions({
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
                message: "querying supported thermostat fan modes...",
                direction: "outbound",
            });
            const supportedModes = await api.getSupportedModes();
            if (supportedModes) {
                const logMessage = `received supported thermostat fan modes:${supportedModes
                    .map((mode) => `\n· ${getEnumMemberName(ThermostatFanMode, mode)}`)
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
                    message: "Querying supported thermostat fan modes timed out, skipping interview...",
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
            const api = CCAPI.create(CommandClasses["Thermostat Fan Mode"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the current status
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying current thermostat fan mode...",
                direction: "outbound",
            });
            const currentStatus = await api.get();
            if (currentStatus) {
                let logMessage = `received current thermostat fan mode: ${getEnumMemberName(ThermostatFanMode, currentStatus.mode)}`;
                if (currentStatus.off != undefined) {
                    logMessage += ` (turned off)`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
    };
    return ThermostatFanModeCC = _classThis;
})();
export { ThermostatFanModeCC };
let ThermostatFanModeCCSet = (() => {
    let _classDecorators = [CCCommand(ThermostatFanModeCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatFanModeCC;
    var ThermostatFanModeCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.mode = options.mode;
            this.off = options.off;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ThermostatFanModeCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        mode;
        off;
        serialize(ctx) {
            this.payload = Bytes.from([
                (this.off ? 0b1000_0000 : 0)
                    | (this.mode & 0b1111),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                mode: getEnumMemberName(ThermostatFanMode, this.mode),
            };
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ThermostatFanModeCCSet = _classThis;
})();
export { ThermostatFanModeCCSet };
let ThermostatFanModeCCReport = (() => {
    let _classDecorators = [CCCommand(ThermostatFanModeCommand.Report), ccValueProperty("mode", ThermostatFanModeCCValues.fanMode), ccValueProperty("off", ThermostatFanModeCCValues.turnedOff)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatFanModeCC;
    var ThermostatFanModeCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.mode = options.mode;
            this.off = options.off;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const mode = raw.payload[0] & 0b1111;
            // V3+
            const off = !!(raw.payload[0] & 0b1000_0000);
            return new this({
                nodeId: ctx.sourceNodeId,
                mode,
                off,
            });
        }
        mode;
        off;
        toLogEntry(ctx) {
            const message = {
                mode: getEnumMemberName(ThermostatFanMode, this.mode),
            };
            if (this.off != undefined) {
                message.off = this.off;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ThermostatFanModeCCReport = _classThis;
})();
export { ThermostatFanModeCCReport };
let ThermostatFanModeCCGet = (() => {
    let _classDecorators = [CCCommand(ThermostatFanModeCommand.Get), expectedCCResponse(ThermostatFanModeCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatFanModeCC;
    var ThermostatFanModeCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ThermostatFanModeCCGet = _classThis;
})();
export { ThermostatFanModeCCGet };
let ThermostatFanModeCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(ThermostatFanModeCommand.SupportedReport), ccValueProperty("supportedModes", ThermostatFanModeCCValues.supportedFanModes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatFanModeCC;
    var ThermostatFanModeCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedModes = options.supportedModes;
        }
        static from(raw, ctx) {
            const supportedModes = parseBitMask(raw.payload, ThermostatFanMode["Auto low"]);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedModes,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Remember which fan modes are supported
            const fanModeValue = ThermostatFanModeCCValues.fanMode;
            this.setMetadata(ctx, fanModeValue, {
                ...fanModeValue.meta,
                states: enumValuesToMetadataStates(ThermostatFanMode, this.supportedModes),
            });
            return true;
        }
        supportedModes;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported modes": this.supportedModes
                        .map((mode) => `\n· ${getEnumMemberName(ThermostatFanMode, mode)}`)
                        .join(""),
                },
            };
        }
    };
    return ThermostatFanModeCCSupportedReport = _classThis;
})();
export { ThermostatFanModeCCSupportedReport };
let ThermostatFanModeCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(ThermostatFanModeCommand.SupportedGet), expectedCCResponse(ThermostatFanModeCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatFanModeCC;
    var ThermostatFanModeCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatFanModeCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ThermostatFanModeCCSupportedGet = _classThis;
})();
export { ThermostatFanModeCCSupportedGet };
//# sourceMappingURL=ThermostatFanModeCC.js.map