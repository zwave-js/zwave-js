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
import { CommandClasses, ValueMetadata, ZWaveError, ZWaveErrorCodes, parseMaybeNumber, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { isArray } from "alcalzone-shared/typeguards";
import { POLL_VALUE, SET_VALUE, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../../lib/API.js";
import { expectedCCResponse } from "../../lib/CommandClassDecorators.js";
import { ManufacturerProprietaryCC, ManufacturerProprietaryCCAPI, } from "../ManufacturerProprietaryCC.js";
import { fibaroCC, fibaroCCCommand, getFibaroCCCommand, getFibaroCCCommandConstructor, getFibaroCCConstructor, getFibaroCCId, manufacturerId, manufacturerProprietaryAPI, } from "./Decorators.js";
export const MANUFACTURERID_FIBARO = 0x10f;
/** Returns the ValueID used to store the current venetian blind position */
export function getFibaroVenetianBlindPositionValueId(endpoint) {
    return {
        commandClass: CommandClasses["Manufacturer Proprietary"],
        endpoint,
        property: "fibaro",
        propertyKey: "venetianBlindsPosition",
    };
}
/** Returns the value metadata for venetian blind position */
export function getFibaroVenetianBlindPositionMetadata() {
    return {
        ...ValueMetadata.Level,
        label: "Venetian blinds position",
    };
}
/** Returns the ValueID used to store the current venetian blind tilt */
export function getFibaroVenetianBlindTiltValueId(endpoint) {
    return {
        commandClass: CommandClasses["Manufacturer Proprietary"],
        endpoint,
        property: "fibaro",
        propertyKey: "venetianBlindsTilt",
    };
}
/** Returns the value metadata for venetian blind tilt */
export function getFibaroVenetianBlindTiltMetadata() {
    return {
        ...ValueMetadata.Level,
        label: "Venetian blinds tilt",
    };
}
function getSupportedFibaroCCIDs(ctx, nodeId) {
    const proprietaryConfig = ctx.getDeviceConfig?.(nodeId)?.proprietary;
    if (proprietaryConfig && isArray(proprietaryConfig.fibaroCCs)) {
        return proprietaryConfig.fibaroCCs;
    }
    return [];
}
export var FibaroCCIDs;
(function (FibaroCCIDs) {
    FibaroCCIDs[FibaroCCIDs["VenetianBlind"] = 38] = "VenetianBlind";
})(FibaroCCIDs || (FibaroCCIDs = {}));
let FibaroCCAPI = (() => {
    let _classDecorators = [manufacturerProprietaryAPI(MANUFACTURERID_FIBARO)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ManufacturerProprietaryCCAPI;
    let _instanceExtraInitializers = [];
    let _fibaroVenetianBlindsSetPosition_decorators;
    let _fibaroVenetianBlindsSetTilt_decorators;
    var FibaroCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _fibaroVenetianBlindsSetPosition_decorators, { kind: "method", name: "fibaroVenetianBlindsSetPosition", static: false, private: false, access: { has: obj => "fibaroVenetianBlindsSetPosition" in obj, get: obj => obj.fibaroVenetianBlindsSetPosition }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fibaroVenetianBlindsSetTilt_decorators, { kind: "method", name: "fibaroVenetianBlindsSetTilt", static: false, private: false, access: { has: obj => "fibaroVenetianBlindsSetTilt" in obj, get: obj => obj.fibaroVenetianBlindsSetTilt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FibaroCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async fibaroVenetianBlindsGet() {
            const cc = new FibaroVenetianBlindCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["position", "tilt"]);
            }
        }
        async fibaroVenetianBlindsSetPosition(value) {
            const cc = new FibaroVenetianBlindCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                position: value,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async fibaroVenetianBlindsSetTilt(value) {
            const cc = new FibaroVenetianBlindCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                tilt: value,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_fibaroVenetianBlindsSetPosition_decorators = [validateArgs()], _fibaroVenetianBlindsSetTilt_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property, propertyKey }, value) {
                if (property !== "fibaro") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (propertyKey === "venetianBlindsPosition") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    await this.fibaroVenetianBlindsSetPosition(value);
                }
                else if (propertyKey === "venetianBlindsTilt") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    await this.fibaroVenetianBlindsSetTilt(value);
                }
                else {
                    // unsupported property key, ignore...
                    return;
                }
                // Verify the current value after a delay
                this.schedulePoll({ property, propertyKey }, value);
                return undefined;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                if (property !== "fibaro") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                else if (propertyKey == undefined) {
                    throwMissingPropertyKey(this.ccId, property);
                }
                switch (propertyKey) {
                    case "venetianBlindsPosition":
                        return (await this.fibaroVenetianBlindsGet())?.position;
                    case "venetianBlindsTilt":
                        return (await this.fibaroVenetianBlindsGet())?.tilt;
                    default:
                        throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                }
            };
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return FibaroCCAPI = _classThis;
})();
export { FibaroCCAPI };
let FibaroCC = (() => {
    let _classDecorators = [manufacturerId(MANUFACTURERID_FIBARO)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ManufacturerProprietaryCC;
    var FibaroCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FibaroCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.fibaroCCId = getFibaroCCId(this);
            this.fibaroCCCommand = getFibaroCCCommand(this);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const fibaroCCId = raw.payload[0];
            const fibaroCCCommand = raw.payload[1];
            const FibaroConstructor = getFibaroCCCommandConstructor(fibaroCCId, fibaroCCCommand);
            if (FibaroConstructor) {
                return FibaroConstructor.from(raw.withPayload(raw.payload.subarray(2)), ctx);
            }
            return new FibaroCC({
                nodeId: ctx.sourceNodeId,
            });
        }
        fibaroCCId;
        fibaroCCCommand;
        async interview(ctx) {
            const node = this.getNode(ctx);
            // Iterate through all supported Fibaro CCs and interview them
            const supportedFibaroCCIDs = getSupportedFibaroCCIDs(ctx, node.id);
            for (const ccId of supportedFibaroCCIDs) {
                const SubConstructor = getFibaroCCConstructor(ccId);
                if (SubConstructor) {
                    const instance = new SubConstructor({ nodeId: node.id });
                    await instance.interview(ctx);
                }
            }
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            // Iterate through all supported Fibaro CCs and let them refresh their values
            const supportedFibaroCCIDs = getSupportedFibaroCCIDs(ctx, node.id);
            for (const ccId of supportedFibaroCCIDs) {
                const SubConstructor = getFibaroCCConstructor(ccId);
                if (SubConstructor) {
                    const instance = new SubConstructor({ nodeId: node.id });
                    await instance.refreshValues(ctx);
                }
            }
        }
        serialize(ctx) {
            if (this.fibaroCCId == undefined) {
                throw new ZWaveError("Cannot serialize a Fibaro CC without a Fibaro CC ID", ZWaveErrorCodes.CC_Invalid);
            }
            else if (this.fibaroCCCommand == undefined) {
                throw new ZWaveError("Cannot serialize a Fibaro CC without a Fibaro CC Command", ZWaveErrorCodes.CC_Invalid);
            }
            this.payload = Bytes.concat([
                Bytes.from([this.fibaroCCId, this.fibaroCCCommand]),
                this.payload,
            ]);
            return super.serialize(ctx);
        }
    };
    return FibaroCC = _classThis;
})();
export { FibaroCC };
export var FibaroVenetianBlindCCCommand;
(function (FibaroVenetianBlindCCCommand) {
    FibaroVenetianBlindCCCommand[FibaroVenetianBlindCCCommand["Set"] = 1] = "Set";
    FibaroVenetianBlindCCCommand[FibaroVenetianBlindCCCommand["Get"] = 2] = "Get";
    FibaroVenetianBlindCCCommand[FibaroVenetianBlindCCCommand["Report"] = 3] = "Report";
})(FibaroVenetianBlindCCCommand || (FibaroVenetianBlindCCCommand = {}));
let FibaroVenetianBlindCC = (() => {
    let _classDecorators = [fibaroCC(FibaroCCIDs.VenetianBlind)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FibaroCC;
    var FibaroVenetianBlindCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FibaroVenetianBlindCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.fibaroCCId = FibaroCCIDs.VenetianBlind;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing Fibaro Venetian Blind CC...`,
                direction: "none",
            });
            // Nothing special, just get the values
            await this.refreshValues(ctx);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            ctx.logNode(node.id, {
                message: "Requesting venetian blind position and tilt...",
                direction: "outbound",
            });
            const resp = await ctx.sendCommand(new FibaroVenetianBlindCCGet({
                nodeId: this.nodeId,
                endpointIndex: this.endpointIndex,
            }));
            if (resp) {
                const logMessage = `received venetian blind state:
position: ${resp.position}
tilt:     ${resp.tilt}`;
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
    };
    return FibaroVenetianBlindCC = _classThis;
})();
export { FibaroVenetianBlindCC };
let FibaroVenetianBlindCCSet = (() => {
    let _classDecorators = [fibaroCCCommand(FibaroVenetianBlindCCCommand.Set)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FibaroVenetianBlindCC;
    var FibaroVenetianBlindCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FibaroVenetianBlindCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.fibaroCCCommand = FibaroVenetianBlindCCCommand.Set;
            if ("position" in options)
                this.position = options.position;
            if ("tilt" in options)
                this.tilt = options.tilt;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
        }
        position;
        tilt;
        serialize(ctx) {
            const controlByte = (this.position != undefined ? 0b10 : 0)
                | (this.tilt != undefined ? 0b01 : 0);
            this.payload = Bytes.from([
                controlByte,
                this.position ?? 0,
                this.tilt ?? 0,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            if (this.position != undefined) {
                message.position = this.position;
            }
            if (this.tilt != undefined) {
                message.tilt = this.tilt;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FibaroVenetianBlindCCSet = _classThis;
})();
export { FibaroVenetianBlindCCSet };
let FibaroVenetianBlindCCReport = (() => {
    let _classDecorators = [fibaroCCCommand(FibaroVenetianBlindCCCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FibaroVenetianBlindCC;
    var FibaroVenetianBlindCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FibaroVenetianBlindCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.fibaroCCCommand = FibaroVenetianBlindCCCommand.Report;
            // TODO: Check implementation:
            this.position = options.position;
            this.tilt = options.tilt;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            // When the node sends a report, payload[0] === 0b11. This is probably a
            // bit mask for position and tilt
            let position;
            if (!!(raw.payload[0] & 0b10)) {
                position = parseMaybeNumber(raw.payload[1]);
            }
            let tilt;
            if (!!(raw.payload[0] & 0b01)) {
                tilt = parseMaybeNumber(raw.payload[2]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                position,
                tilt,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const valueDB = this.getValueDB(ctx);
            if (this.position != undefined) {
                const positionValueId = getFibaroVenetianBlindPositionValueId(this.endpointIndex);
                valueDB.setMetadata(positionValueId, {
                    ...ValueMetadata.Level,
                    label: "Venetian blinds position",
                });
                valueDB.setValue(positionValueId, this.position);
            }
            if (this.tilt != undefined) {
                const tiltValueId = getFibaroVenetianBlindTiltValueId(this.endpointIndex);
                valueDB.setMetadata(tiltValueId, {
                    ...ValueMetadata.Level,
                    label: "Venetian blinds tilt",
                });
                valueDB.setValue(tiltValueId, this.tilt);
            }
            return true;
        }
        position;
        tilt;
        toLogEntry(ctx) {
            const message = {};
            if (this.position != undefined) {
                message.position = this.position;
            }
            if (this.tilt != undefined) {
                message.tilt = this.tilt;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FibaroVenetianBlindCCReport = _classThis;
})();
export { FibaroVenetianBlindCCReport };
let FibaroVenetianBlindCCGet = (() => {
    let _classDecorators = [fibaroCCCommand(FibaroVenetianBlindCCCommand.Get), expectedCCResponse(FibaroVenetianBlindCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FibaroVenetianBlindCC;
    var FibaroVenetianBlindCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FibaroVenetianBlindCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // @noLogEntry: This CC has no properties to log
        constructor(options) {
            super(options);
            this.fibaroCCCommand = FibaroVenetianBlindCCCommand.Get;
        }
        static from(raw, ctx) {
            return new this({
                nodeId: ctx.sourceNodeId,
            });
        }
    };
    return FibaroVenetianBlindCCGet = _classThis;
})();
export { FibaroVenetianBlindCCGet };
//# sourceMappingURL=FibaroCC.js.map