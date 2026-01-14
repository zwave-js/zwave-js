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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, num2hex, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { DeviceIdType, ManufacturerSpecificCommand } from "../lib/_Types.js";
export const ManufacturerSpecificCCValues = V.defineCCValues(CommandClasses["Manufacturer Specific"], {
    ...V.staticProperty("manufacturerId", {
        ...ValueMetadata.ReadOnlyUInt16,
        label: "Manufacturer ID",
    }, { supportsEndpoints: false }),
    ...V.staticProperty("productType", {
        ...ValueMetadata.ReadOnlyUInt16,
        label: "Product type",
    }, { supportsEndpoints: false }),
    ...V.staticProperty("productId", {
        ...ValueMetadata.ReadOnlyUInt16,
        label: "Product ID",
    }, { supportsEndpoints: false }),
    ...V.dynamicPropertyAndKeyWithName("deviceId", "deviceId", (type) => getEnumMemberName(DeviceIdType, type), ({ property, propertyKey }) => property === "deviceId"
        && typeof propertyKey === "string"
        && propertyKey in DeviceIdType, (type) => ({
        ...ValueMetadata.ReadOnlyString,
        label: `Device ID (${getEnumMemberName(DeviceIdType, type)})`,
    }), { minVersion: 2 }),
});
// @noSetValueAPI This CC is read-only
let ManufacturerSpecificCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Manufacturer Specific"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _deviceSpecificGet_decorators;
    let _sendReport_decorators;
    var ManufacturerSpecificCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _deviceSpecificGet_decorators = [validateArgs()];
            _sendReport_decorators = [validateArgs()];
            __esDecorate(this, null, _deviceSpecificGet_decorators, { kind: "method", name: "deviceSpecificGet", static: false, private: false, access: { has: obj => "deviceSpecificGet" in obj, get: obj => obj.deviceSpecificGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerSpecificCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ManufacturerSpecificCommand.Get:
                case ManufacturerSpecificCommand.Report:
                    return true; // This is mandatory
                case ManufacturerSpecificCommand.DeviceSpecificGet:
                case ManufacturerSpecificCommand.DeviceSpecificReport:
                    return this.version >= 2;
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ManufacturerSpecificCommand, ManufacturerSpecificCommand.Get);
            const cc = new ManufacturerSpecificCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "manufacturerId",
                    "productType",
                    "productId",
                ]);
            }
        }
        async deviceSpecificGet(deviceIdType) {
            this.assertSupportsCommand(ManufacturerSpecificCommand, ManufacturerSpecificCommand.DeviceSpecificGet);
            const cc = new ManufacturerSpecificCCDeviceSpecificGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                deviceIdType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.deviceId;
        }
        async sendReport(options) {
            this.assertSupportsCommand(ManufacturerSpecificCommand, ManufacturerSpecificCommand.Report);
            const cc = new ManufacturerSpecificCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ManufacturerSpecificCCAPI = _classThis;
})();
export { ManufacturerSpecificCCAPI };
let ManufacturerSpecificCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Manufacturer Specific"]), implementedVersion(2), ccValues(ManufacturerSpecificCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ManufacturerSpecificCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerSpecificCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            // The Manufacturer Specific CC MUST be interviewed first
            return [];
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Manufacturer Specific"], ctx, endpoint).withOptions({ priority: MessagePriority.NodeQuery });
            if (node.id !== ctx.ownNodeId) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Interviewing ${this.ccName}...`,
                    direction: "none",
                });
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying manufacturer information...",
                    direction: "outbound",
                });
                const mfResp = await api.get();
                if (mfResp) {
                    const logMessage = `received response for manufacturer information:
  manufacturer: ${ctx.lookupManufacturer(mfResp.manufacturerId)
                        || "unknown"} (${num2hex(mfResp.manufacturerId)})
  product type: ${num2hex(mfResp.productType)}
  product id:   ${num2hex(mfResp.productId)}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return ManufacturerSpecificCC = _classThis;
})();
export { ManufacturerSpecificCC };
let ManufacturerSpecificCCReport = (() => {
    let _classDecorators = [CCCommand(ManufacturerSpecificCommand.Report), ccValueProperty("manufacturerId", ManufacturerSpecificCCValues.manufacturerId), ccValueProperty("productType", ManufacturerSpecificCCValues.productType), ccValueProperty("productId", ManufacturerSpecificCCValues.productId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ManufacturerSpecificCC;
    var ManufacturerSpecificCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerSpecificCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId;
            this.productType = options.productType;
            this.productId = options.productId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 6);
            const manufacturerId = raw.payload.readUInt16BE(0);
            const productType = raw.payload.readUInt16BE(2);
            const productId = raw.payload.readUInt16BE(4);
            return new this({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                productType,
                productId,
            });
        }
        manufacturerId;
        productType;
        productId;
        serialize(ctx) {
            this.payload = new Bytes(6);
            this.payload.writeUInt16BE(this.manufacturerId, 0);
            this.payload.writeUInt16BE(this.productType, 2);
            this.payload.writeUInt16BE(this.productId, 4);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "manufacturer id": num2hex(this.manufacturerId),
                    "product type": num2hex(this.productType),
                    "product id": num2hex(this.productId),
                },
            };
        }
    };
    return ManufacturerSpecificCCReport = _classThis;
})();
export { ManufacturerSpecificCCReport };
let ManufacturerSpecificCCGet = (() => {
    let _classDecorators = [CCCommand(ManufacturerSpecificCommand.Get), expectedCCResponse(ManufacturerSpecificCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ManufacturerSpecificCC;
    var ManufacturerSpecificCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerSpecificCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ManufacturerSpecificCCGet = _classThis;
})();
export { ManufacturerSpecificCCGet };
let ManufacturerSpecificCCDeviceSpecificReport = (() => {
    let _classDecorators = [CCCommand(ManufacturerSpecificCommand.DeviceSpecificReport), ccValueProperty("deviceId", ManufacturerSpecificCCValues.deviceId, (self) => [self.type])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ManufacturerSpecificCC;
    var ManufacturerSpecificCCDeviceSpecificReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerSpecificCCDeviceSpecificReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.type = options.type;
            this.deviceId = options.deviceId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const type = raw.payload[0] & 0b111;
            const dataFormat = raw.payload[1] >>> 5;
            const dataLength = raw.payload[1] & 0b11111;
            validatePayload(dataLength > 0, raw.payload.length >= 2 + dataLength);
            const deviceIdData = raw.payload.subarray(2, 2 + dataLength);
            const deviceId = dataFormat === 0
                ? deviceIdData.toString("utf8")
                : "0x" + deviceIdData.toString("hex");
            return new this({
                nodeId: ctx.sourceNodeId,
                type,
                deviceId,
            });
        }
        type;
        deviceId;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "device id type": getEnumMemberName(DeviceIdType, this.type),
                    "device id": this.deviceId,
                },
            };
        }
    };
    return ManufacturerSpecificCCDeviceSpecificReport = _classThis;
})();
export { ManufacturerSpecificCCDeviceSpecificReport };
let ManufacturerSpecificCCDeviceSpecificGet = (() => {
    let _classDecorators = [CCCommand(ManufacturerSpecificCommand.DeviceSpecificGet), expectedCCResponse(ManufacturerSpecificCCDeviceSpecificReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ManufacturerSpecificCC;
    var ManufacturerSpecificCCDeviceSpecificGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ManufacturerSpecificCCDeviceSpecificGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.deviceIdType = options.deviceIdType;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ManufacturerSpecificCCDeviceSpecificGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        deviceIdType;
        serialize(ctx) {
            this.payload = Bytes.from([(this.deviceIdType || 0) & 0b111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "device id type": getEnumMemberName(DeviceIdType, this.deviceIdType),
                },
            };
        }
    };
    return ManufacturerSpecificCCDeviceSpecificGet = _classThis;
})();
export { ManufacturerSpecificCCDeviceSpecificGet };
//# sourceMappingURL=ManufacturerSpecificCC.js.map