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
import { CommandClasses, ValueMetadata, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, ccValues, commandClass, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { BasicWindowCoveringCommand, } from "../lib/_Types.js";
export const BasicWindowCoveringCCValues = V.defineCCValues(CommandClasses["Basic Window Covering"], {
    ...V.staticProperty("levelChangeUp", {
        ...ValueMetadata.WriteOnlyBoolean,
        label: "Open",
        states: {
            true: "Start",
            false: "Stop",
        },
    }),
    ...V.staticProperty("levelChangeDown", {
        ...ValueMetadata.WriteOnlyBoolean,
        label: "Close",
        states: {
            true: "Start",
            false: "Stop",
        },
    }),
});
let BasicWindowCoveringCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Basic Window Covering"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _startLevelChange_decorators;
    let _stopLevelChange_decorators;
    var BasicWindowCoveringCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _startLevelChange_decorators = [validateArgs({ strictEnums: true })];
            _stopLevelChange_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _startLevelChange_decorators, { kind: "method", name: "startLevelChange", static: false, private: false, access: { has: obj => "startLevelChange" in obj, get: obj => obj.startLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _stopLevelChange_decorators, { kind: "method", name: "stopLevelChange", static: false, private: false, access: { has: obj => "stopLevelChange" in obj, get: obj => obj.stopLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicWindowCoveringCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case BasicWindowCoveringCommand.StartLevelChange:
                case BasicWindowCoveringCommand.StopLevelChange:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                const valueId = {
                    commandClass: this.ccId,
                    property,
                };
                if (BasicWindowCoveringCCValues.levelChangeUp.is(valueId)
                    || BasicWindowCoveringCCValues.levelChangeDown.is(valueId)) {
                    if (typeof value !== "boolean") {
                        throwWrongValueType(this.ccId, property, "boolean", typeof value);
                    }
                    if (value) {
                        const direction = BasicWindowCoveringCCValues.levelChangeUp
                            .is(valueId)
                            ? "up"
                            : "down";
                        return this.startLevelChange(direction);
                    }
                    else {
                        return this.stopLevelChange();
                    }
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async startLevelChange(direction) {
            this.assertSupportsCommand(BasicWindowCoveringCommand, BasicWindowCoveringCommand.StartLevelChange);
            const cc = new BasicWindowCoveringCCStartLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                direction,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async stopLevelChange() {
            this.assertSupportsCommand(BasicWindowCoveringCommand, BasicWindowCoveringCommand.StopLevelChange);
            const cc = new BasicWindowCoveringCCStopLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return BasicWindowCoveringCCAPI = _classThis;
})();
export { BasicWindowCoveringCCAPI };
let BasicWindowCoveringCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Basic Window Covering"]), implementedVersion(1), ccValues(BasicWindowCoveringCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var BasicWindowCoveringCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicWindowCoveringCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BasicWindowCoveringCC = _classThis;
})();
export { BasicWindowCoveringCC };
let BasicWindowCoveringCCStartLevelChange = (() => {
    let _classDecorators = [CCCommand(BasicWindowCoveringCommand.StartLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BasicWindowCoveringCC;
    var BasicWindowCoveringCCStartLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicWindowCoveringCCStartLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.direction = options.direction;
        }
        static from(raw, ctx) {
            // The CC is obsolete and will never be extended. Check for exact length
            validatePayload(raw.payload.length === 1);
            const direction = !!(raw.payload[0] & 0b0100_0000)
                ? "down"
                : "up";
            return new this({
                nodeId: ctx.sourceNodeId,
                direction,
            });
        }
        direction;
        async serialize(ctx) {
            this.payload = Bytes.from([
                this.direction === "down" ? 0b0100_0000 : 0b0000_0000,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    direction: this.direction,
                },
            };
        }
    };
    return BasicWindowCoveringCCStartLevelChange = _classThis;
})();
export { BasicWindowCoveringCCStartLevelChange };
let BasicWindowCoveringCCStopLevelChange = (() => {
    let _classDecorators = [CCCommand(BasicWindowCoveringCommand.StopLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BasicWindowCoveringCC;
    var BasicWindowCoveringCCStopLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BasicWindowCoveringCCStopLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BasicWindowCoveringCCStopLevelChange = _classThis;
})();
export { BasicWindowCoveringCCStopLevelChange };
//# sourceMappingURL=BasicWindowCoveringCC.js.map