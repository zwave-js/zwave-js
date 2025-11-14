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
import { CommandClasses, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { InclusionControllerCommand, InclusionControllerStatus, InclusionControllerStep, } from "../lib/_Types.js";
// This CC should not be used directly from user code
/* eslint-disable @zwave-js/ccapi-validate-args */
let InclusionControllerCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Inclusion Controller"]), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var InclusionControllerCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InclusionControllerCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return InclusionControllerCC = _classThis;
})();
export { InclusionControllerCC };
let InclusionControllerCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Inclusion Controller"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    var InclusionControllerCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InclusionControllerCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case InclusionControllerCommand.Initiate:
                case InclusionControllerCommand.Complete:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        /** Instruct the target to initiate the given inclusion step for the given node */
        async initiateStep(nodeId, step) {
            this.assertSupportsCommand(InclusionControllerCommand, InclusionControllerCommand.Initiate);
            const cc = new InclusionControllerCCInitiate({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                includedNodeId: nodeId,
                step,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        /** Indicate to the other node that the given inclusion step has been completed */
        async completeStep(step, status) {
            this.assertSupportsCommand(InclusionControllerCommand, InclusionControllerCommand.Complete);
            const cc = new InclusionControllerCCComplete({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                step,
                status,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
    };
    return InclusionControllerCCAPI = _classThis;
})();
export { InclusionControllerCCAPI };
let InclusionControllerCCComplete = (() => {
    let _classDecorators = [CCCommand(InclusionControllerCommand.Complete)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = InclusionControllerCC;
    var InclusionControllerCCComplete = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InclusionControllerCCComplete = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.step = options.step;
            this.status = options.status;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const step = raw.payload[0];
            validatePayload.withReason("Invalid inclusion controller step")(step in InclusionControllerStep);
            const status = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                step,
                status,
            });
        }
        step;
        status;
        serialize(ctx) {
            this.payload = Bytes.from([this.step, this.status]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    step: getEnumMemberName(InclusionControllerStep, this.step),
                    status: getEnumMemberName(InclusionControllerStatus, this.status),
                },
            };
        }
    };
    return InclusionControllerCCComplete = _classThis;
})();
export { InclusionControllerCCComplete };
let InclusionControllerCCInitiate = (() => {
    let _classDecorators = [CCCommand(InclusionControllerCommand.Initiate)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = InclusionControllerCC;
    var InclusionControllerCCInitiate = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InclusionControllerCCInitiate = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.includedNodeId = options.includedNodeId;
            this.step = options.step;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const includedNodeId = raw.payload[0];
            const step = raw.payload[1];
            validatePayload.withReason("Invalid inclusion controller step")(step in InclusionControllerStep);
            return new this({
                nodeId: ctx.sourceNodeId,
                includedNodeId,
                step,
            });
        }
        includedNodeId;
        step;
        serialize(ctx) {
            this.payload = Bytes.from([this.includedNodeId, this.step]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "included node id": this.includedNodeId,
                    step: getEnumMemberName(InclusionControllerStep, this.step),
                },
            };
        }
    };
    return InclusionControllerCCInitiate = _classThis;
})();
export { InclusionControllerCCInitiate };
//# sourceMappingURL=InclusionControllerCC.js.map