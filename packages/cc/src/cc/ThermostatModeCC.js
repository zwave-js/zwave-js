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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeBitMask, enumValuesToMetadataStates, parseBitMask, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, buffer2hex, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ThermostatMode, ThermostatModeCommand } from "../lib/_Types.js";
export const ThermostatModeCCValues = V.defineCCValues(CommandClasses["Thermostat Mode"], {
    ...V.staticPropertyWithName("thermostatMode", "mode", {
        ...ValueMetadata.UInt8,
        states: enumValuesToMetadataStates(ThermostatMode),
        label: "Thermostat mode",
    }),
    ...V.staticProperty("manufacturerData", {
        ...ValueMetadata.ReadOnlyBuffer,
        label: "Manufacturer data",
    }),
    ...V.staticProperty("supportedModes", undefined, { internal: true }),
});
let ThermostatModeCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Thermostat Mode"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var ThermostatModeCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ThermostatModeCommand.Get:
                case ThermostatModeCommand.SupportedGet:
                    return this.isSinglecast();
                case ThermostatModeCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                if (property !== "mode") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                const result = await this.set(value);
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
                        return (await this.get())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ThermostatModeCommand, ThermostatModeCommand.Get);
            const cc = new ThermostatModeCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["mode", "manufacturerData"]);
            }
        }
        async set(mode, manufacturerData) {
            this.assertSupportsCommand(ThermostatModeCommand, ThermostatModeCommand.Set);
            if (typeof manufacturerData === "string") {
                // We accept the manufacturer data as a hex string. Make sure it's valid
                if (manufacturerData.length % 2 !== 0
                    || !/^[0-9a-f]+$/i.test(manufacturerData)) {
                    throw new ZWaveError(`Manufacturer data must be represented as hexadecimal when passed as a string!`, ZWaveErrorCodes.Argument_Invalid);
                }
                manufacturerData = Bytes.from(manufacturerData, "hex");
            }
            const cc = new ThermostatModeCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                mode,
                manufacturerData: manufacturerData,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getSupportedModes() {
            this.assertSupportsCommand(ThermostatModeCommand, ThermostatModeCommand.SupportedGet);
            const cc = new ThermostatModeCCSupportedGet({
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
    return ThermostatModeCCAPI = _classThis;
})();
export { ThermostatModeCCAPI };
let ThermostatModeCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Thermostat Mode"]), implementedVersion(3), ccValues(ThermostatModeCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ThermostatModeCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Thermostat Mode"], ctx, endpoint).withOptions({
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
                message: "querying supported thermostat modes...",
                direction: "outbound",
            });
            const supportedModes = await api.getSupportedModes();
            if (supportedModes) {
                const logMessage = `received supported thermostat modes:${supportedModes
                    .map((mode) => `\n· ${getEnumMemberName(ThermostatMode, mode)}`)
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
                    message: "Querying supported thermostat modes timed out, skipping interview...",
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
            const api = CCAPI.create(CommandClasses["Thermostat Mode"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the current status
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying current thermostat mode...",
                direction: "outbound",
            });
            const currentStatus = await api.get();
            if (currentStatus) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "received current thermostat mode: "
                        + getEnumMemberName(ThermostatMode, currentStatus.mode),
                    direction: "inbound",
                });
            }
        }
    };
    return ThermostatModeCC = _classThis;
})();
export { ThermostatModeCC };
let ThermostatModeCCSet = (() => {
    let _classDecorators = [CCCommand(ThermostatModeCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatModeCC;
    var ThermostatModeCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.mode = options.mode;
            if ("manufacturerData" in options) {
                this.manufacturerData = options.manufacturerData;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const mode = raw.payload[0] & 0b11111;
            if (mode !== ThermostatMode["Manufacturer specific"]) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    mode,
                });
            }
            const manufacturerDataLength = (raw.payload[0] >>> 5) & 0b111;
            validatePayload(raw.payload.length >= 1 + manufacturerDataLength);
            const manufacturerData = raw.payload.subarray(1, 1 + manufacturerDataLength);
            return new this({
                nodeId: ctx.sourceNodeId,
                mode,
                manufacturerData,
            });
        }
        mode;
        manufacturerData;
        serialize(ctx) {
            const manufacturerData = this.mode === ThermostatMode["Manufacturer specific"]
                && this.manufacturerData
                ? this.manufacturerData
                : new Uint8Array();
            const manufacturerDataLength = manufacturerData.length;
            this.payload = Bytes.concat([
                Bytes.from([
                    ((manufacturerDataLength & 0b111) << 5) + (this.mode & 0b11111),
                ]),
                manufacturerData,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                mode: getEnumMemberName(ThermostatMode, this.mode),
            };
            if (this.manufacturerData != undefined) {
                message["manufacturer data"] = buffer2hex(this.manufacturerData);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ThermostatModeCCSet = _classThis;
})();
export { ThermostatModeCCSet };
let ThermostatModeCCReport = (() => {
    let _classDecorators = [CCCommand(ThermostatModeCommand.Report), ccValueProperty("mode", ThermostatModeCCValues.thermostatMode), ccValueProperty("manufacturerData", ThermostatModeCCValues.manufacturerData)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatModeCC;
    var ThermostatModeCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.mode = options.mode;
            this.manufacturerData = options.manufacturerData;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const mode = raw.payload[0] & 0b11111;
            if (mode !== ThermostatMode["Manufacturer specific"]) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    mode,
                });
            }
            // V3+
            const manufacturerDataLength = raw.payload[0] >>> 5;
            validatePayload(raw.payload.length >= 1 + manufacturerDataLength);
            const manufacturerData = raw.payload.subarray(1, 1 + manufacturerDataLength);
            return new this({
                nodeId: ctx.sourceNodeId,
                mode,
                manufacturerData,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Update the supported modes if a mode is used that wasn't previously
            // reported to be supported. This shouldn't happen, but well... it does anyways
            const thermostatModeValue = ThermostatModeCCValues.thermostatMode;
            const supportedModesValue = ThermostatModeCCValues.supportedModes;
            const supportedModes = this.getValue(ctx, supportedModesValue);
            if (supportedModes
                && this.mode in ThermostatMode
                && !supportedModes.includes(this.mode)) {
                supportedModes.push(this.mode);
                supportedModes.sort();
                this.setMetadata(ctx, thermostatModeValue, {
                    ...thermostatModeValue.meta,
                    states: enumValuesToMetadataStates(ThermostatMode, supportedModes),
                });
                this.setValue(ctx, supportedModesValue, supportedModes);
            }
            return true;
        }
        mode;
        manufacturerData;
        serialize(ctx) {
            const manufacturerDataLength = this.mode === ThermostatMode["Manufacturer specific"]
                && this.manufacturerData
                ? Math.min(0b111, this.manufacturerData.length)
                : 0;
            this.payload = new Bytes(1 + manufacturerDataLength);
            this.payload[0] = (manufacturerDataLength << 5) + (this.mode & 0b11111);
            if (manufacturerDataLength && this.manufacturerData) {
                this.payload.set(this.manufacturerData.subarray(0, manufacturerDataLength), 1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                mode: getEnumMemberName(ThermostatMode, this.mode),
            };
            if (this.manufacturerData != undefined) {
                message["manufacturer data"] = buffer2hex(this.manufacturerData);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ThermostatModeCCReport = _classThis;
})();
export { ThermostatModeCCReport };
let ThermostatModeCCGet = (() => {
    let _classDecorators = [CCCommand(ThermostatModeCommand.Get), expectedCCResponse(ThermostatModeCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatModeCC;
    var ThermostatModeCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ThermostatModeCCGet = _classThis;
})();
export { ThermostatModeCCGet };
let ThermostatModeCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(ThermostatModeCommand.SupportedReport), ccValueProperty("supportedModes", ThermostatModeCCValues.supportedModes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatModeCC;
    var ThermostatModeCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedModes = options.supportedModes;
        }
        static from(raw, ctx) {
            const supportedModes = parseBitMask(raw.payload, ThermostatMode.Off);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedModes,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Use this information to create the metadata for the mode property
            const thermostatModeValue = ThermostatModeCCValues.thermostatMode;
            this.setMetadata(ctx, thermostatModeValue, {
                ...thermostatModeValue.meta,
                states: enumValuesToMetadataStates(ThermostatMode, this.supportedModes),
            });
            return true;
        }
        supportedModes;
        serialize(ctx) {
            this.payload = encodeBitMask(this.supportedModes, ThermostatMode["Manufacturer specific"], ThermostatMode.Off);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported modes": this.supportedModes
                        .map((mode) => `\n· ${getEnumMemberName(ThermostatMode, mode)}`)
                        .join(""),
                },
            };
        }
    };
    return ThermostatModeCCSupportedReport = _classThis;
})();
export { ThermostatModeCCSupportedReport };
let ThermostatModeCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(ThermostatModeCommand.SupportedGet), expectedCCResponse(ThermostatModeCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ThermostatModeCC;
    var ThermostatModeCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ThermostatModeCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ThermostatModeCCSupportedGet = _classThis;
})();
export { ThermostatModeCCSupportedGet };
//# sourceMappingURL=ThermostatModeCC.js.map