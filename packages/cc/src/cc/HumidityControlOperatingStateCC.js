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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { CommandClasses, MessagePriority, ValueMetadata, enumValuesToMetadataStates, validatePayload, } from "@zwave-js/core";
import { getEnumMemberName } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, throwUnsupportedProperty, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { HumidityControlOperatingState, HumidityControlOperatingStateCommand, } from "../lib/_Types.js";
export const HumidityControlOperatingStateCCValues = V.defineCCValues(CommandClasses["Humidity Control Operating State"], {
    ...V.staticProperty("state", {
        ...ValueMetadata.ReadOnlyUInt8,
        states: enumValuesToMetadataStates(HumidityControlOperatingState),
        label: "Humidity control operating state",
    }),
});
let HumidityControlOperatingStateCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Humidity Control Operating State"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    var HumidityControlOperatingStateCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlOperatingStateCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case HumidityControlOperatingStateCommand.Get:
                    return this.isSinglecast();
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "state":
                        return this.get();
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async get() {
            this.assertSupportsCommand(HumidityControlOperatingStateCommand, HumidityControlOperatingStateCommand.Get);
            const cc = new HumidityControlOperatingStateCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return response?.state;
            }
        }
    };
    return HumidityControlOperatingStateCCAPI = _classThis;
})();
export { HumidityControlOperatingStateCCAPI };
let HumidityControlOperatingStateCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Humidity Control Operating State"]), implementedVersion(1), ccValues(HumidityControlOperatingStateCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var HumidityControlOperatingStateCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlOperatingStateCC = _classThis = _classDescriptor.value;
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
            const api = CCAPI.create(CommandClasses["Humidity Control Operating State"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            // Query the current status
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying current humidity control operating state...",
                direction: "outbound",
            });
            const currentStatus = await api.get();
            if (currentStatus) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "received current humidity control operating state: "
                        + getEnumMemberName(HumidityControlOperatingState, currentStatus),
                    direction: "inbound",
                });
            }
        }
    };
    return HumidityControlOperatingStateCC = _classThis;
})();
export { HumidityControlOperatingStateCC };
let HumidityControlOperatingStateCCReport = (() => {
    let _classDecorators = [CCCommand(HumidityControlOperatingStateCommand.Report), ccValueProperty("state", HumidityControlOperatingStateCCValues.state)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlOperatingStateCC;
    var HumidityControlOperatingStateCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlOperatingStateCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.state = options.state;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const state = raw.payload[0] & 0b1111;
            return new this({
                nodeId: ctx.sourceNodeId,
                state,
            });
        }
        state;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    state: getEnumMemberName(HumidityControlOperatingState, this.state),
                },
            };
        }
    };
    return HumidityControlOperatingStateCCReport = _classThis;
})();
export { HumidityControlOperatingStateCCReport };
let HumidityControlOperatingStateCCGet = (() => {
    let _classDecorators = [CCCommand(HumidityControlOperatingStateCommand.Get), expectedCCResponse(HumidityControlOperatingStateCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = HumidityControlOperatingStateCC;
    var HumidityControlOperatingStateCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HumidityControlOperatingStateCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return HumidityControlOperatingStateCCGet = _classThis;
})();
export { HumidityControlOperatingStateCCGet };
//# sourceMappingURL=HumidityControlOperatingStateCC.js.map