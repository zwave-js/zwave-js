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
import { CommandClasses, MessagePriority, ValueMetadata, encodeFloatWithScale, parseFloatWithScale, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, throwUnsupportedProperty, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { EnergyProductionCommand, EnergyProductionParameter, getEnergyProductionScale, } from "../lib/_Types.js";
export const EnergyProductionCCValues = V.defineCCValues(CommandClasses["Energy Production"], {
    ...V.dynamicPropertyAndKeyWithName("value", "value", (parameter) => parameter, ({ property, propertyKey }) => property === "value" && typeof propertyKey === "number", (parameter) => ({
        ...ValueMetadata.ReadOnlyNumber,
        label: getEnumMemberName(EnergyProductionParameter, parameter),
        // unit and ccSpecific are set dynamically
    })),
});
let EnergyProductionCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Energy Production"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    var EnergyProductionCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EnergyProductionCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case EnergyProductionCommand.Get:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                if (EnergyProductionCCValues.value.is({
                    commandClass: this.ccId,
                    property,
                    propertyKey,
                })) {
                    return (await this.get(property))
                        ?.value;
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async get(parameter) {
            this.assertSupportsCommand(EnergyProductionCommand, EnergyProductionCommand.Get);
            const cc = new EnergyProductionCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["value", "scale"]);
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return EnergyProductionCCAPI = _classThis;
})();
export { EnergyProductionCCAPI };
let EnergyProductionCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Energy Production"]), implementedVersion(1), ccValues(EnergyProductionCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var EnergyProductionCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EnergyProductionCC = _classThis = _classDescriptor.value;
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
            // Query current values
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Energy Production"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            for (const parameter of [
                EnergyProductionParameter.Power,
                EnergyProductionParameter["Production Total"],
                EnergyProductionParameter["Production Today"],
                EnergyProductionParameter["Total Time"],
            ]) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying energy production (${getEnumMemberName(EnergyProductionParameter, parameter)})...`,
                    direction: "outbound",
                });
                await api.get(parameter);
            }
        }
    };
    return EnergyProductionCC = _classThis;
})();
export { EnergyProductionCC };
let EnergyProductionCCReport = (() => {
    let _classDecorators = [CCCommand(EnergyProductionCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EnergyProductionCC;
    var EnergyProductionCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EnergyProductionCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.value = options.value;
            this.scale = options.scale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const parameter = raw.payload[0];
            const { value, scale: rawScale } = parseFloatWithScale(raw.payload.subarray(1));
            const scale = getEnergyProductionScale(parameter, rawScale);
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                value,
                scale,
            });
        }
        parameter;
        scale;
        value;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const valueValue = EnergyProductionCCValues.value(this.parameter);
            this.setMetadata(ctx, valueValue, {
                ...valueValue.meta,
                unit: this.scale.unit,
                ccSpecific: {
                    parameter: this.parameter,
                    scale: this.scale.key,
                },
            });
            this.setValue(ctx, valueValue, this.value);
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.parameter]),
                encodeFloatWithScale(this.value, this.scale.key),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    [getEnumMemberName(EnergyProductionParameter, this.parameter).toLowerCase()]: `${this.value} ${this.scale.unit}`,
                },
            };
        }
    };
    return EnergyProductionCCReport = _classThis;
})();
export { EnergyProductionCCReport };
function testResponseForEnergyProductionGet(sent, received) {
    return received.parameter === sent.parameter;
}
let EnergyProductionCCGet = (() => {
    let _classDecorators = [CCCommand(EnergyProductionCommand.Get), expectedCCResponse(EnergyProductionCCReport, testResponseForEnergyProductionGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EnergyProductionCC;
    var EnergyProductionCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EnergyProductionCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const parameter = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        serialize(ctx) {
            this.payload = Bytes.from([this.parameter]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    parameter: getEnumMemberName(EnergyProductionParameter, this.parameter),
                },
            };
        }
    };
    return EnergyProductionCCGet = _classThis;
})();
export { EnergyProductionCCGet };
//# sourceMappingURL=EnergyProductionCC.js.map