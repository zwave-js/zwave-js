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
import { CRC16_CCITT, CommandClasses, EncapsulationFlags, validatePayload, } from "@zwave-js/core";
import { CCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { Bytes } from "@zwave-js/shared";
import { CRC16Command } from "../lib/_Types.js";
const headerBuffer = Bytes.from([
    CommandClasses["CRC-16 Encapsulation"],
    CRC16Command.CommandEncapsulation,
]);
// @noSetValueAPI
// @noInterview This CC only has a single encapsulation command
// Encapsulation CCs are used internally and too frequently that we
// want to pay the cost of validating each call
/* eslint-disable @zwave-js/ccapi-validate-args */
let CRC16CCAPI = (() => {
    let _classDecorators = [API(CommandClasses["CRC-16 Encapsulation"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    var CRC16CCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CRC16CCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(_cmd) {
            // switch (cmd) {
            // 	case CRC16Command.CommandEncapsulation:
            return true; // This is mandatory
            // }
            // return super.supportsCommand(cmd);
        }
        async sendEncapsulated(encapsulatedCC) {
            this.assertSupportsCommand(CRC16Command, CRC16Command.CommandEncapsulation);
            const cc = new CRC16CCCommandEncapsulation({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                encapsulated: encapsulatedCC,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
    };
    return CRC16CCAPI = _classThis;
})();
export { CRC16CCAPI };
let CRC16CC = (() => {
    let _classDecorators = [commandClass(CommandClasses["CRC-16 Encapsulation"]), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var CRC16CC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CRC16CC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** Tests if a command should be supervised and thus requires encapsulation */
        static requiresEncapsulation(cc) {
            return (!!(cc.encapsulationFlags & EncapsulationFlags.CRC16)
                && !(cc instanceof CRC16CCCommandEncapsulation));
        }
        /** Encapsulates a command in a CRC-16 CC */
        static encapsulate(cc) {
            const ret = new CRC16CCCommandEncapsulation({
                nodeId: cc.nodeId,
                encapsulated: cc,
            });
            // Copy the encapsulation flags from the encapsulated command
            // but omit CRC-16, since we're doing that right now
            ret.encapsulationFlags = cc.encapsulationFlags
                & ~EncapsulationFlags.CRC16;
            return ret;
        }
    };
    return CRC16CC = _classThis;
})();
export { CRC16CC };
function getCCResponseForCommandEncapsulation(sent) {
    if (sent.encapsulated?.expectsCCResponse()) {
        return CRC16CCCommandEncapsulation;
    }
}
let CRC16CCCommandEncapsulation = (() => {
    let _classDecorators = [CCCommand(CRC16Command.CommandEncapsulation), expectedCCResponse(getCCResponseForCommandEncapsulation, () => "checkEncapsulated")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CRC16CC;
    var CRC16CCCommandEncapsulation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CRC16CCCommandEncapsulation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.encapsulated = options.encapsulated;
            this.encapsulated.encapsulatingCC = this;
        }
        static async from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const ccBuffer = raw.payload.subarray(0, -2);
            // Verify the CRC
            let expectedCRC = CRC16_CCITT(headerBuffer);
            expectedCRC = CRC16_CCITT(ccBuffer, expectedCRC);
            const actualCRC = raw.payload.readUInt16BE(raw.payload.length - 2);
            validatePayload(expectedCRC === actualCRC);
            const encapsulated = await CommandClass.parse(ccBuffer, ctx);
            return new this({
                nodeId: ctx.sourceNodeId,
                encapsulated,
            });
        }
        encapsulated;
        async serialize(ctx) {
            const commandBuffer = await this.encapsulated.serialize(ctx);
            // Reserve 2 bytes for the CRC
            this.payload = Bytes.concat([commandBuffer, new Bytes(2)]);
            // Compute and save the CRC16 in the payload
            // The CC header is included in the CRC computation
            let crc = CRC16_CCITT(headerBuffer);
            crc = CRC16_CCITT(commandBuffer, crc);
            this.payload.writeUInt16BE(crc, this.payload.length - 2);
            return super.serialize(ctx);
        }
        computeEncapsulationOverhead() {
            // CRC16 adds two bytes CRC to the default overhead
            return super.computeEncapsulationOverhead() + 2;
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                // Hide the default payload line
                message: undefined,
            };
        }
    };
    return CRC16CCCommandEncapsulation = _classThis;
})();
export { CRC16CCCommandEncapsulation };
//# sourceMappingURL=CRC16CC.js.map