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
import { CommandClasses, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { ManufacturerSpecificCCValues } from "./ManufacturerSpecificCC.js";
import { getManufacturerId, getManufacturerProprietaryAPI, getManufacturerProprietaryCCConstructor, } from "./manufacturerProprietary/Decorators.js";
let ManufacturerProprietaryCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Manufacturer Proprietary"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _sendData_decorators;
    let _sendAndReceiveData_decorators;
    var ManufacturerProprietaryCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sendData_decorators = [validateArgs()];
            _sendAndReceiveData_decorators = [validateArgs()];
            __esDecorate(this, null, _sendData_decorators, { kind: "method", name: "sendData", static: false, private: false, access: { has: obj => "sendData" in obj, get: obj => obj.sendData }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendAndReceiveData_decorators, { kind: "method", name: "sendAndReceiveData", static: false, private: false, access: { has: obj => "sendAndReceiveData" in obj, get: obj => obj.sendAndReceiveData }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerProprietaryCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(host, endpoint) {
            super(host, endpoint);
            __runInitializers(this, _instanceExtraInitializers);
            // Read the manufacturer ID from Manufacturer Specific CC
            const manufacturerId = this.getValueDB().getValue(ManufacturerSpecificCCValues.manufacturerId.id);
            // If possible, try to defer to a specific subclass of this API
            if (manufacturerId != undefined) {
                const SpecificAPIConstructor = getManufacturerProprietaryAPI(manufacturerId);
                if (SpecificAPIConstructor != undefined
                    && new.target !== SpecificAPIConstructor) {
                    return new SpecificAPIConstructor(host, endpoint);
                }
            }
        }
        async sendData(manufacturerId, data) {
            const cc = new ManufacturerProprietaryCC({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                manufacturerId,
            });
            cc.payload = data ? Bytes.view(data) : new Bytes();
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async sendAndReceiveData(manufacturerId, data) {
            const cc = new ManufacturerProprietaryCC({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                manufacturerId,
                unspecifiedExpectsResponse: true,
            });
            cc.payload = data ? Bytes.view(data) : new Bytes();
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    manufacturerId: response.manufacturerId,
                    data: response.payload,
                };
            }
        }
    };
    return ManufacturerProprietaryCCAPI = _classThis;
})();
export { ManufacturerProprietaryCCAPI };
function getReponseForManufacturerProprietary(cc) {
    return cc.unspecifiedExpectsResponse
        ? ManufacturerProprietaryCC
        : undefined;
}
function testResponseForManufacturerProprietaryRequest(sent, received) {
    // We expect a Manufacturer Proprietary response that has the same manufacturer ID as the request
    return sent.manufacturerId === received.manufacturerId;
}
let ManufacturerProprietaryCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Manufacturer Proprietary"]), implementedVersion(1), expectedCCResponse(getReponseForManufacturerProprietary, testResponseForManufacturerProprietaryRequest)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ManufacturerProprietaryCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerProprietaryCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId
                ?? getManufacturerId(this);
            this.unspecifiedExpectsResponse = options.unspecifiedExpectsResponse;
            // To use this CC, a manufacturer ID must exist in the value DB
            // If it doesn't, the interview procedure will throw.
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const manufacturerId = raw.payload.readUInt16BE(0);
            // Try to parse the proprietary command
            const PCConstructor = getManufacturerProprietaryCCConstructor(manufacturerId);
            const payload = raw.payload.subarray(2);
            if (PCConstructor) {
                return PCConstructor.from(raw.withPayload(payload), ctx);
            }
            return new ManufacturerProprietaryCC({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                payload,
            });
        }
        manufacturerId;
        /**
         * @internal
         * This is used to indicate that an unspecified Manufacturer Proprietary CC instance expects a response.
         * Subclasses should roll their own `@expectedCCResponse` instead.
         */
        unspecifiedExpectsResponse;
        getManufacturerIdOrThrow() {
            if (this.manufacturerId == undefined) {
                throw new ZWaveError(`To use an instance of ManufacturerProprietaryCC, the manufacturer ID must be stored in the value DB`, ZWaveErrorCodes.ManufacturerProprietaryCC_NoManufacturerId);
            }
            return this.manufacturerId;
        }
        serialize(ctx) {
            const manufacturerId = this.getManufacturerIdOrThrow();
            // ManufacturerProprietaryCC has no CC command, so the first byte
            // is stored in ccCommand
            this.ccCommand = (manufacturerId >>> 8) & 0xff;
            // The 2nd byte is in the payload
            this.payload = Bytes.concat([
                Bytes.from([
                    // 2nd byte of manufacturerId
                    manufacturerId & 0xff,
                ]),
                this.payload,
            ]);
            return super.serialize(ctx);
        }
        createSpecificInstance() {
            // Try to defer to the correct subclass
            if (this.manufacturerId != undefined) {
                const PCConstructor = getManufacturerProprietaryCCConstructor(this.manufacturerId);
                if (PCConstructor) {
                    return new PCConstructor({
                        nodeId: this.nodeId,
                        endpoint: this.endpointIndex,
                    });
                }
            }
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            // Read the manufacturer ID from Manufacturer Specific CC
            this.manufacturerId = this.getValue(ctx, ManufacturerSpecificCCValues.manufacturerId);
            const pcInstance = this.createSpecificInstance();
            if (pcInstance) {
                await pcInstance.interview(ctx);
            }
            else {
                ctx.logNode(node.id, {
                    message: `${this.constructor.name}: skipping interview refresh because the matching proprietary CC is not implemented...`,
                    direction: "none",
                });
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            if (this.manufacturerId == undefined) {
                // Read the manufacturer ID from Manufacturer Specific CC
                this.manufacturerId = this.getValue(ctx, ManufacturerSpecificCCValues.manufacturerId);
            }
            const pcInstance = this.createSpecificInstance();
            if (pcInstance) {
                await pcInstance.refreshValues(ctx);
            }
            else {
                ctx.logNode(node.id, {
                    message: `${this.constructor.name}: skipping value refresh because the matching proprietary CC is not implemented...`,
                    direction: "none",
                });
            }
        }
    };
    return ManufacturerProprietaryCC = _classThis;
})();
export { ManufacturerProprietaryCC };
//# sourceMappingURL=ManufacturerProprietaryCC.js.map