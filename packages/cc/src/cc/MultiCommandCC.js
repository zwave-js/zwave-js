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
import { CommandClasses, EncapsulationFlags, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { MultiCommandCommand } from "../lib/_Types.js";
// TODO: Handle this command when received
// @noSetValueAPI This CC has no set-type commands
// @noInterview This CC only has a single encapsulation command
let MultiCommandCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Multi Command"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _send_decorators;
    var MultiCommandCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _send_decorators = [validateArgs()];
            __esDecorate(this, null, _send_decorators, { kind: "method", name: "send", static: false, private: false, access: { has: obj => "send" in obj, get: obj => obj.send }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiCommandCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(_cmd) {
            // switch (cmd) {
            // 	case MultiCommandCommand.CommandEncapsulation:
            return true; // This is mandatory
            // }
            // return super.supportsCommand(cmd);
        }
        async send(commands) {
            this.assertSupportsCommand(MultiCommandCommand, MultiCommandCommand.CommandEncapsulation);
            // FIXME: This should not be on the API but rather on the applHost level
            const cc = new MultiCommandCCCommandEncapsulation({
                nodeId: this.endpoint.nodeId,
                encapsulated: commands,
            });
            cc.endpointIndex = this.endpoint.index;
            await this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return MultiCommandCCAPI = _classThis;
})();
export { MultiCommandCCAPI };
let MultiCommandCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Multi Command"]), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var MultiCommandCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiCommandCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** Tests if a command targets a specific endpoint and thus requires encapsulation */
        static requiresEncapsulation(cc) {
            return (cc.endpointIndex !== 0
                && !(cc instanceof MultiCommandCCCommandEncapsulation));
        }
        static encapsulate(CCs) {
            const ret = new MultiCommandCCCommandEncapsulation({
                nodeId: CCs[0].nodeId,
                encapsulated: CCs,
            });
            // Copy the "sum" of the encapsulation flags from the encapsulated CCs
            for (const flag of [
                EncapsulationFlags.Supervision,
                EncapsulationFlags.Security,
                EncapsulationFlags.CRC16,
            ]) {
                ret.toggleEncapsulationFlag(flag, CCs.some((cc) => cc.encapsulationFlags & flag));
            }
            return ret;
        }
    };
    return MultiCommandCC = _classThis;
})();
export { MultiCommandCC };
let MultiCommandCCCommandEncapsulation = (() => {
    let _classDecorators = [CCCommand(MultiCommandCommand.CommandEncapsulation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiCommandCC;
    var MultiCommandCCCommandEncapsulation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiCommandCCCommandEncapsulation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.encapsulated = options.encapsulated;
            for (const cc of options.encapsulated) {
                cc.encapsulatingCC = this;
                // Multi Command CC is inside Multi Channel CC, so the endpoint must be copied
                cc.endpointIndex = this.endpointIndex;
            }
        }
        static async from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const numCommands = raw.payload[0];
            const encapsulated = [];
            let offset = 1;
            for (let i = 0; i < numCommands; i++) {
                validatePayload(raw.payload.length >= offset + 1);
                const cmdLength = raw.payload[offset];
                validatePayload(raw.payload.length >= offset + 1 + cmdLength);
                encapsulated.push(await CommandClass.parse(raw.payload.subarray(offset + 1, offset + 1 + cmdLength), ctx));
                offset += 1 + cmdLength;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                encapsulated,
            });
        }
        encapsulated;
        async serialize(ctx) {
            const buffers = [];
            buffers.push(Bytes.from([this.encapsulated.length]));
            for (const cmd of this.encapsulated) {
                const cmdBuffer = await cmd.serialize(ctx);
                buffers.push(Bytes.from([cmdBuffer.length]));
                buffers.push(cmdBuffer);
            }
            this.payload = Bytes.concat(buffers);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                // Hide the default payload line
                message: undefined,
            };
        }
    };
    return MultiCommandCCCommandEncapsulation = _classThis;
})();
export { MultiCommandCCCommandEncapsulation };
//# sourceMappingURL=MultiCommandCC.js.map