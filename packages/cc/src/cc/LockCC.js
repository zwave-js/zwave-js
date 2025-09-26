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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { LockCommand } from "../lib/_Types.js";
export const LockCCValues = V.defineCCValues(CommandClasses.Lock, {
    ...V.staticProperty("locked", {
        ...ValueMetadata.Boolean,
        label: "Locked",
        description: "Whether the lock is locked",
    }),
});
let LockCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Lock)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var LockCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LockCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case LockCommand.Get:
                case LockCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        async get() {
            this.assertSupportsCommand(LockCommand, LockCommand.Get);
            const cc = new LockCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.locked;
        }
        /**
         * Locks or unlocks the lock
         * @param locked Whether the lock should be locked
         */
        async set(locked) {
            this.assertSupportsCommand(LockCommand, LockCommand.Set);
            const cc = new LockCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                locked,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_set_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property }, value) {
                if (property !== "locked") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "boolean") {
                    throwWrongValueType(this.ccId, property, "boolean", typeof value);
                }
                const result = await this.set(value);
                // Verify the current value after a delay, unless the command was supervised and successful
                if (!supervisedCommandSucceeded(result)) {
                    this.schedulePoll({ property }, value);
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                if (property === "locked")
                    return this.get();
                throwUnsupportedProperty(this.ccId, property);
            };
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return LockCCAPI = _classThis;
})();
export { LockCCAPI };
let LockCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Lock), implementedVersion(1), ccValues(LockCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var LockCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LockCC = _classThis = _classDescriptor.value;
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
            const api = CCAPI.create(CommandClasses.Lock, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                message: "requesting current lock state...",
                direction: "outbound",
            });
            const locked = await api.get();
            const logMessage = `the lock is ${locked ? "locked" : "unlocked"}`;
            ctx.logNode(node.id, {
                message: logMessage,
                direction: "inbound",
            });
        }
    };
    return LockCC = _classThis;
})();
export { LockCC };
let LockCCSet = (() => {
    let _classDecorators = [CCCommand(LockCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LockCC;
    var LockCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LockCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.locked = options.locked;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new LockCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        locked;
        serialize(ctx) {
            this.payload = Bytes.from([this.locked ? 1 : 0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { locked: this.locked },
            };
        }
    };
    return LockCCSet = _classThis;
})();
export { LockCCSet };
let LockCCReport = (() => {
    let _classDecorators = [CCCommand(LockCommand.Report), ccValueProperty("locked", LockCCValues.locked)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LockCC;
    var LockCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LockCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.locked = options.locked;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const locked = raw.payload[0] === 1;
            return new this({
                nodeId: ctx.sourceNodeId,
                locked,
            });
        }
        locked;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { locked: this.locked },
            };
        }
    };
    return LockCCReport = _classThis;
})();
export { LockCCReport };
let LockCCGet = (() => {
    let _classDecorators = [CCCommand(LockCommand.Get), expectedCCResponse(LockCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LockCC;
    var LockCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LockCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return LockCCGet = _classThis;
})();
export { LockCCGet };
//# sourceMappingURL=LockCC.js.map