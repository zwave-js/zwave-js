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
import { CommandClasses, MAX_NODES, MAX_REPEATERS, ZWaveDataRate, ZWaveError, ZWaveErrorCodes, encodeBitMask, encodeNodeInformationFrame, encodeNodeProtocolInfoAndDeviceClass, parseBitMask, parseNodeInformationFrame, parseNodeProtocolInfoAndDeviceClass, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CommandClass } from "../lib/CommandClass.js";
import { CCCommand, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { WakeUpTime, ZWaveProtocolCommand, parseWakeUpTime, } from "../lib/_Types.js";
var DataRateBitmask;
(function (DataRateBitmask) {
    DataRateBitmask[DataRateBitmask["9k6"] = 1] = "9k6";
    DataRateBitmask[DataRateBitmask["40k"] = 2] = "40k";
    DataRateBitmask[DataRateBitmask["100k"] = 4] = "100k";
})(DataRateBitmask || (DataRateBitmask = {}));
function dataRate2Bitmask(dataRate) {
    return dataRate === ZWaveDataRate["100k"]
        ? DataRateBitmask["100k"]
        : dataRate === ZWaveDataRate["40k"]
            ? DataRateBitmask["40k"]
            : DataRateBitmask["9k6"];
}
function bitmask2DataRate(mask) {
    return mask === DataRateBitmask["100k"]
        ? ZWaveDataRate["100k"]
        : mask === DataRateBitmask["40k"]
            ? ZWaveDataRate["40k"]
            : ZWaveDataRate["9k6"];
}
let ZWaveProtocolCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Z-Wave Protocol"]), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ZWaveProtocolCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCC = _classThis;
})();
export { ZWaveProtocolCC };
let ZWaveProtocolCCNodeInformationFrame = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.NodeInformationFrame)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCNodeInformationFrame = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCNodeInformationFrame = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.basicDeviceClass = options.basicDeviceClass;
            this.genericDeviceClass = options.genericDeviceClass;
            this.specificDeviceClass = options.specificDeviceClass;
            this.isListening = options.isListening;
            this.isFrequentListening = options.isFrequentListening;
            this.isRouting = options.isRouting;
            this.supportedDataRates = options.supportedDataRates;
            this.protocolVersion = options.protocolVersion;
            this.optionalFunctionality = options.optionalFunctionality;
            this.nodeType = options.nodeType;
            this.supportsSecurity = options.supportsSecurity;
            this.supportsBeaming = options.supportsBeaming;
            this.supportedCCs = options.supportedCCs;
        }
        static from(raw, ctx) {
            const nif = parseNodeInformationFrame(raw.payload);
            return new this({
                nodeId: ctx.sourceNodeId,
                ...nif,
            });
        }
        basicDeviceClass;
        genericDeviceClass;
        specificDeviceClass;
        isListening;
        isFrequentListening;
        isRouting;
        supportedDataRates;
        protocolVersion;
        optionalFunctionality;
        nodeType;
        supportsSecurity;
        supportsBeaming;
        supportedCCs;
        serialize(ctx) {
            this.payload = encodeNodeInformationFrame(this);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCNodeInformationFrame = _classThis;
})();
export { ZWaveProtocolCCNodeInformationFrame };
let ZWaveProtocolCCRequestNodeInformationFrame = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.RequestNodeInformationFrame), expectedCCResponse(ZWaveProtocolCCNodeInformationFrame)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCRequestNodeInformationFrame = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCRequestNodeInformationFrame = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCRequestNodeInformationFrame = _classThis;
})();
export { ZWaveProtocolCCRequestNodeInformationFrame };
let ZWaveProtocolCCAssignIDs = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AssignIDs)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCAssignIDs = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAssignIDs = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.assignedNodeId = options.assignedNodeId;
            this.homeId = options.homeId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 5);
            const assignedNodeId = raw.payload[0];
            const homeId = raw.payload.readUInt32BE(1);
            return new this({
                nodeId: ctx.sourceNodeId,
                assignedNodeId,
                homeId,
            });
        }
        assignedNodeId;
        homeId;
        serialize(ctx) {
            this.payload = new Bytes(5);
            this.payload[0] = this.assignedNodeId;
            this.payload.writeUInt32BE(this.homeId, 1);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCAssignIDs = _classThis;
})();
export { ZWaveProtocolCCAssignIDs };
let ZWaveProtocolCCFindNodesInRange = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.FindNodesInRange)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCFindNodesInRange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCFindNodesInRange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.candidateNodeIds = options.candidateNodeIds;
            this.wakeUpTime = options.wakeUpTime;
            this.dataRate = options.dataRate ?? ZWaveDataRate["9k6"];
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const speedPresent = raw.payload[0] & 0b1000_0000;
            const bitmaskLength = raw.payload[0] & 0b0001_1111;
            validatePayload(raw.payload.length >= 1 + bitmaskLength);
            const candidateNodeIds = parseBitMask(raw.payload.subarray(1, 1 + bitmaskLength));
            const rest = raw.payload.subarray(1 + bitmaskLength);
            let dataRate;
            let wakeUpTime;
            if (speedPresent) {
                validatePayload(rest.length >= 1);
                if (rest.length === 1) {
                    dataRate = rest[0] & 0b111;
                    wakeUpTime = WakeUpTime.None;
                }
                else if (rest.length === 2) {
                    wakeUpTime = parseWakeUpTime(rest[0]);
                    dataRate = rest[1] & 0b111;
                }
                else {
                    validatePayload.fail("Invalid payload length");
                }
            }
            else if (rest.length >= 1) {
                wakeUpTime = parseWakeUpTime(rest[0]);
                dataRate = ZWaveDataRate["9k6"];
            }
            else {
                wakeUpTime = WakeUpTime.None;
                dataRate = ZWaveDataRate["9k6"];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                candidateNodeIds,
                dataRate,
                wakeUpTime,
            });
        }
        candidateNodeIds;
        wakeUpTime;
        dataRate;
        serialize(ctx) {
            const nodesBitmask = encodeBitMask(this.candidateNodeIds, MAX_NODES);
            const speedAndLength = 0b1000_0000 | nodesBitmask.length;
            this.payload = Bytes.concat([
                Bytes.from([speedAndLength]),
                nodesBitmask,
                Bytes.from([this.wakeUpTime, this.dataRate]),
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCFindNodesInRange = _classThis;
})();
export { ZWaveProtocolCCFindNodesInRange };
let ZWaveProtocolCCRangeInfo = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.RangeInfo)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCRangeInfo = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCRangeInfo = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.neighborNodeIds = options.neighborNodeIds;
            this.wakeUpTime = options.wakeUpTime;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const bitmaskLength = raw.payload[0] & 0b0001_1111;
            validatePayload(raw.payload.length >= 1 + bitmaskLength);
            const neighborNodeIds = parseBitMask(raw.payload.subarray(1, 1 + bitmaskLength));
            let wakeUpTime;
            if (raw.payload.length >= 2 + bitmaskLength) {
                wakeUpTime = parseWakeUpTime(raw.payload[1 + bitmaskLength]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                neighborNodeIds,
                wakeUpTime,
            });
        }
        neighborNodeIds;
        wakeUpTime;
        serialize(ctx) {
            const nodesBitmask = encodeBitMask(this.neighborNodeIds, MAX_NODES);
            this.payload = Bytes.concat([
                Bytes.from([nodesBitmask.length]),
                nodesBitmask,
                this.wakeUpTime != undefined
                    ? Bytes.from([this.wakeUpTime])
                    : new Bytes(),
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCRangeInfo = _classThis;
})();
export { ZWaveProtocolCCRangeInfo };
let ZWaveProtocolCCGetNodesInRange = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.GetNodesInRange), expectedCCResponse(ZWaveProtocolCCRangeInfo)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCGetNodesInRange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCGetNodesInRange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCGetNodesInRange = _classThis;
})();
export { ZWaveProtocolCCGetNodesInRange };
let ZWaveProtocolCCCommandComplete = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.CommandComplete)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCCommandComplete = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCCommandComplete = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sequenceNumber = options.sequenceNumber;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const sequenceNumber = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                sequenceNumber,
            });
        }
        sequenceNumber;
        serialize(ctx) {
            this.payload = Bytes.from([this.sequenceNumber]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCCommandComplete = _classThis;
})();
export { ZWaveProtocolCCCommandComplete };
let ZWaveProtocolCCTransferPresentation = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.TransferPresentation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCTransferPresentation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCTransferPresentation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.includeNode && options.excludeNode) {
                throw new ZWaveError(`${this.constructor.name}: the includeNode and excludeNode options cannot both be true`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.supportsNWI = options.supportsNWI;
            this.includeNode = options.includeNode;
            this.excludeNode = options.excludeNode;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const option = raw.payload[0];
            const supportsNWI = !!(option & 0b0001);
            const excludeNode = !!(option & 0b0010);
            const includeNode = !!(option & 0b0100);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportsNWI,
                excludeNode,
                includeNode,
            });
        }
        supportsNWI;
        includeNode;
        excludeNode;
        serialize(ctx) {
            this.payload = Bytes.from([
                (this.supportsNWI ? 0b0001 : 0)
                    | (this.excludeNode ? 0b0010 : 0)
                    | (this.includeNode ? 0b0100 : 0),
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCTransferPresentation = _classThis;
})();
export { ZWaveProtocolCCTransferPresentation };
let ZWaveProtocolCCTransferNodeInformation = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.TransferNodeInformation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCTransferNodeInformation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCTransferNodeInformation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sequenceNumber = options.sequenceNumber;
            this.sourceNodeId = options.sourceNodeId;
            this.basicDeviceClass = options.basicDeviceClass;
            this.genericDeviceClass = options.genericDeviceClass;
            this.specificDeviceClass = options.specificDeviceClass;
            this.isListening = options.isListening;
            this.isFrequentListening = options.isFrequentListening;
            this.isRouting = options.isRouting;
            this.supportedDataRates = options.supportedDataRates;
            this.protocolVersion = options.protocolVersion;
            this.optionalFunctionality = options.optionalFunctionality;
            this.nodeType = options.nodeType;
            this.supportsSecurity = options.supportsSecurity;
            this.supportsBeaming = options.supportsBeaming;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const sequenceNumber = raw.payload[0];
            const sourceNodeId = raw.payload[1];
            const { info } = parseNodeProtocolInfoAndDeviceClass(raw.payload.subarray(2));
            return new this({
                nodeId: ctx.sourceNodeId,
                sequenceNumber,
                sourceNodeId,
                ...info,
            });
        }
        sequenceNumber;
        sourceNodeId;
        basicDeviceClass;
        genericDeviceClass;
        specificDeviceClass;
        isListening;
        isFrequentListening;
        isRouting;
        supportedDataRates;
        protocolVersion;
        optionalFunctionality;
        nodeType;
        supportsSecurity;
        supportsBeaming;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.sequenceNumber, this.sourceNodeId]),
                encodeNodeProtocolInfoAndDeviceClass(this),
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCTransferNodeInformation = _classThis;
})();
export { ZWaveProtocolCCTransferNodeInformation };
let ZWaveProtocolCCTransferRangeInformation = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.TransferRangeInformation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCTransferRangeInformation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCTransferRangeInformation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sequenceNumber = options.sequenceNumber;
            this.testedNodeId = options.testedNodeId;
            this.neighborNodeIds = options.neighborNodeIds;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const sequenceNumber = raw.payload[0];
            const testedNodeId = raw.payload[1];
            const bitmaskLength = raw.payload[2];
            validatePayload(raw.payload.length >= 3 + bitmaskLength);
            const neighborNodeIds = parseBitMask(raw.payload.subarray(3, 3 + bitmaskLength));
            return new this({
                nodeId: ctx.sourceNodeId,
                sequenceNumber,
                testedNodeId,
                neighborNodeIds,
            });
        }
        sequenceNumber;
        testedNodeId;
        neighborNodeIds;
        serialize(ctx) {
            const nodesBitmask = encodeBitMask(this.neighborNodeIds, MAX_NODES);
            this.payload = Bytes.concat([
                Bytes.from([
                    this.sequenceNumber,
                    this.testedNodeId,
                    nodesBitmask.length,
                ]),
                nodesBitmask,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCTransferRangeInformation = _classThis;
})();
export { ZWaveProtocolCCTransferRangeInformation };
let ZWaveProtocolCCTransferEnd = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.TransferEnd)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCTransferEnd = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCTransferEnd = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.status = options.status;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const status = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                status,
            });
        }
        status;
        serialize(ctx) {
            this.payload = Bytes.from([this.status]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCTransferEnd = _classThis;
})();
export { ZWaveProtocolCCTransferEnd };
let ZWaveProtocolCCAssignReturnRoute = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AssignReturnRoute)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCAssignReturnRoute = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAssignReturnRoute = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.repeaters.length > MAX_REPEATERS) {
                throw new ZWaveError(`${this.constructor.name}: too many repeaters`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.destinationNodeId = options.destinationNodeId;
            this.routeIndex = options.routeIndex;
            this.repeaters = options.repeaters;
            this.destinationWakeUp = options.destinationWakeUp;
            this.destinationSpeed = options.destinationSpeed;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 7);
            const destinationNodeId = raw.payload[0];
            const routeIndex = raw.payload[1] >>> 4;
            const numRepeaters = raw.payload[1] & 0b1111;
            const repeaters = [...raw.payload.subarray(2, 2 + numRepeaters)];
            const speedAndWakeup = raw.payload[2 + numRepeaters];
            const destinationSpeed = bitmask2DataRate((speedAndWakeup >>> 3) & 0b111);
            const destinationWakeUp = (speedAndWakeup >>> 1) & 0b11;
            return new this({
                nodeId: ctx.sourceNodeId,
                destinationNodeId,
                routeIndex,
                repeaters,
                destinationSpeed,
                destinationWakeUp,
            });
        }
        destinationNodeId;
        routeIndex;
        repeaters;
        destinationWakeUp;
        destinationSpeed;
        serialize(ctx) {
            const routeByte = (this.routeIndex << 4) | this.repeaters.length;
            const speedMask = dataRate2Bitmask(this.destinationSpeed);
            const speedByte = (speedMask << 3) | (this.destinationWakeUp << 1);
            this.payload = Bytes.from([
                this.destinationNodeId,
                routeByte,
                ...this.repeaters,
                speedByte,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCAssignReturnRoute = _classThis;
})();
export { ZWaveProtocolCCAssignReturnRoute };
let ZWaveProtocolCCNewNodeRegistered = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.NewNodeRegistered)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCNewNodeRegistered = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCNewNodeRegistered = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.newNodeId = options.newNodeId;
            this.basicDeviceClass = options.basicDeviceClass;
            this.genericDeviceClass = options.genericDeviceClass;
            this.specificDeviceClass = options.specificDeviceClass;
            this.isListening = options.isListening;
            this.isFrequentListening = options.isFrequentListening;
            this.isRouting = options.isRouting;
            this.supportedDataRates = options.supportedDataRates;
            this.protocolVersion = options.protocolVersion;
            this.optionalFunctionality = options.optionalFunctionality;
            this.nodeType = options.nodeType;
            this.supportsSecurity = options.supportsSecurity;
            this.supportsBeaming = options.supportsBeaming;
            this.supportedCCs = options.supportedCCs;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const newNodeId = raw.payload[0];
            const nif = parseNodeInformationFrame(raw.payload.subarray(1));
            return new this({
                nodeId: ctx.sourceNodeId,
                newNodeId,
                ...nif,
            });
        }
        newNodeId;
        basicDeviceClass;
        genericDeviceClass;
        specificDeviceClass;
        isListening;
        isFrequentListening;
        isRouting;
        supportedDataRates;
        protocolVersion;
        optionalFunctionality;
        nodeType;
        supportsSecurity;
        supportsBeaming;
        supportedCCs;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.newNodeId]),
                encodeNodeInformationFrame(this),
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCNewNodeRegistered = _classThis;
})();
export { ZWaveProtocolCCNewNodeRegistered };
let ZWaveProtocolCCNewRangeRegistered = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.NewRangeRegistered)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCNewRangeRegistered = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCNewRangeRegistered = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.testedNodeId = options.testedNodeId;
            this.neighborNodeIds = options.neighborNodeIds;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const testedNodeId = raw.payload[0];
            const numNeighbors = raw.payload[1];
            const neighborNodeIds = [
                ...raw.payload.subarray(2, 2 + numNeighbors),
            ];
            return new this({
                nodeId: ctx.sourceNodeId,
                testedNodeId,
                neighborNodeIds,
            });
        }
        testedNodeId;
        neighborNodeIds;
        serialize(ctx) {
            const nodesBitmask = encodeBitMask(this.neighborNodeIds, MAX_NODES);
            this.payload = Bytes.concat([
                Bytes.from([this.testedNodeId, nodesBitmask.length]),
                nodesBitmask,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCNewRangeRegistered = _classThis;
})();
export { ZWaveProtocolCCNewRangeRegistered };
let ZWaveProtocolCCTransferNewPrimaryControllerComplete = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.TransferNewPrimaryControllerComplete)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCTransferNewPrimaryControllerComplete = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCTransferNewPrimaryControllerComplete = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.genericDeviceClass = options.genericDeviceClass;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const genericDeviceClass = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                genericDeviceClass,
            });
        }
        genericDeviceClass;
        serialize(ctx) {
            this.payload = Bytes.from([this.genericDeviceClass]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCTransferNewPrimaryControllerComplete = _classThis;
})();
export { ZWaveProtocolCCTransferNewPrimaryControllerComplete };
let ZWaveProtocolCCAutomaticControllerUpdateStart = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AutomaticControllerUpdateStart)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCAutomaticControllerUpdateStart = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAutomaticControllerUpdateStart = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCAutomaticControllerUpdateStart = _classThis;
})();
export { ZWaveProtocolCCAutomaticControllerUpdateStart };
let ZWaveProtocolCCSUCNodeID = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SUCNodeID)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCSUCNodeID = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSUCNodeID = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sucNodeId = options.sucNodeId;
            this.isSIS = options.isSIS;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const sucNodeId = raw.payload[0];
            const capabilities = raw.payload[1] ?? 0;
            const isSIS = !!(capabilities & 0b1);
            return new this({
                nodeId: ctx.sourceNodeId,
                sucNodeId,
                isSIS,
            });
        }
        sucNodeId;
        isSIS;
        serialize(ctx) {
            this.payload = Bytes.from([this.sucNodeId, this.isSIS ? 0b1 : 0]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCSUCNodeID = _classThis;
})();
export { ZWaveProtocolCCSUCNodeID };
let ZWaveProtocolCCSetSUC = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SetSUC)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCSetSUC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSetSUC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.enableSIS = options.enableSIS;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            // Byte 0 must be 0x01 or ignored
            const capabilities = raw.payload[1] ?? 0;
            const enableSIS = !!(capabilities & 0b1);
            return new this({
                nodeId: ctx.sourceNodeId,
                enableSIS,
            });
        }
        enableSIS;
        serialize(ctx) {
            this.payload = Bytes.from([0x01, this.enableSIS ? 0b1 : 0]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCSetSUC = _classThis;
})();
export { ZWaveProtocolCCSetSUC };
let ZWaveProtocolCCSetSUCAck = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SetSUCAck)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCSetSUCAck = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSetSUCAck = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.accepted = options.accepted;
            this.isSIS = options.isSIS;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const accepted = raw.payload[0] === 0x01;
            const capabilities = raw.payload[1] ?? 0;
            const isSIS = !!(capabilities & 0b1);
            return new this({
                nodeId: ctx.sourceNodeId,
                accepted,
                isSIS,
            });
        }
        accepted;
        isSIS;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.accepted ? 0x01 : 0x00,
                this.isSIS ? 0b1 : 0,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCSetSUCAck = _classThis;
})();
export { ZWaveProtocolCCSetSUCAck };
let ZWaveProtocolCCAssignSUCReturnRoute = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AssignSUCReturnRoute)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCCAssignReturnRoute;
    var ZWaveProtocolCCAssignSUCReturnRoute = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAssignSUCReturnRoute = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCAssignSUCReturnRoute = _classThis;
})();
export { ZWaveProtocolCCAssignSUCReturnRoute };
let ZWaveProtocolCCStaticRouteRequest = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.StaticRouteRequest)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCStaticRouteRequest = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCStaticRouteRequest = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.nodeIds.some((n) => n < 1 || n > MAX_NODES)) {
                throw new ZWaveError(`All node IDs must be between 1 and ${MAX_NODES}!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.nodeIds = options.nodeIds;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 5);
            const nodeIds = [...raw.payload.subarray(0, 5)].filter((id) => id > 0 && id <= MAX_NODES);
            return new this({
                nodeId: ctx.sourceNodeId,
                nodeIds,
            });
        }
        nodeIds;
        serialize(ctx) {
            this.payload = Bytes.alloc(5, 0);
            for (let i = 0; i < this.nodeIds.length && i < 5; i++) {
                this.payload[i] = this.nodeIds[i];
            }
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCStaticRouteRequest = _classThis;
})();
export { ZWaveProtocolCCStaticRouteRequest };
let ZWaveProtocolCCLost = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.Lost)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCLost = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCLost = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.lostNodeId = options.lostNodeId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const lostNodeId = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                lostNodeId,
            });
        }
        lostNodeId;
        serialize(ctx) {
            this.payload = Bytes.from([this.lostNodeId]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCLost = _classThis;
})();
export { ZWaveProtocolCCLost };
let ZWaveProtocolCCAcceptLost = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AcceptLost)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCAcceptLost = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAcceptLost = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.accepted = options.accepted;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            validatePayload(raw.payload[0] === 0x04 || raw.payload[0] === 0x05);
            const accepted = raw.payload[0] === 0x05;
            return new this({
                nodeId: ctx.sourceNodeId,
                accepted,
            });
        }
        accepted;
        serialize(ctx) {
            this.payload = Bytes.from([this.accepted ? 0x05 : 0x04]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCAcceptLost = _classThis;
})();
export { ZWaveProtocolCCAcceptLost };
let ZWaveProtocolCCNOPPower = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.NOPPower)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCNOPPower = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCNOPPower = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.powerDampening < 0 || options.powerDampening > 14) {
                throw new ZWaveError(`${this.constructor.name}: power dampening must be between 0 and 14 dBm!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.powerDampening = options.powerDampening;
        }
        static from(raw, ctx) {
            let powerDampening;
            if (raw.payload.length >= 2) {
                // Ignore byte 0
                powerDampening = raw.payload[1];
            }
            else if (raw.payload.length === 1) {
                powerDampening = [
                    0xf0,
                    0xc8,
                    0xa7,
                    0x91,
                    0x77,
                    0x67,
                    0x60,
                    0x46,
                    0x38,
                    0x35,
                    0x32,
                    0x30,
                    0x24,
                    0x22,
                    0x20,
                ].indexOf(raw.payload[0]);
                if (powerDampening === -1)
                    powerDampening = 0;
            }
            else {
                validatePayload.fail("Invalid payload length!");
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                powerDampening,
            });
        }
        // Power dampening in (negative) dBm. A value of 2 means -2 dBm.
        powerDampening;
        serialize(ctx) {
            this.payload = Bytes.from([0, this.powerDampening]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCNOPPower = _classThis;
})();
export { ZWaveProtocolCCNOPPower };
let ZWaveProtocolCCReservedIDs = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.ReservedIDs)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCReservedIDs = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCReservedIDs = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.reservedNodeIDs = options.reservedNodeIDs;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const numNodeIDs = raw.payload[0];
            validatePayload(raw.payload.length >= 1 + numNodeIDs);
            const reservedNodeIDs = [
                ...raw.payload.subarray(1, 1 + numNodeIDs),
            ];
            return new this({
                nodeId: ctx.sourceNodeId,
                reservedNodeIDs,
            });
        }
        reservedNodeIDs;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.reservedNodeIDs.length,
                ...this.reservedNodeIDs,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCReservedIDs = _classThis;
})();
export { ZWaveProtocolCCReservedIDs };
let ZWaveProtocolCCReserveNodeIDs = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.ReserveNodeIDs), expectedCCResponse(ZWaveProtocolCCReservedIDs)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCReserveNodeIDs = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCReserveNodeIDs = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.numNodeIDs = options.numNodeIDs;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const numNodeIDs = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                numNodeIDs,
            });
        }
        numNodeIDs;
        serialize(ctx) {
            this.payload = Bytes.from([this.numNodeIDs]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCReserveNodeIDs = _classThis;
})();
export { ZWaveProtocolCCReserveNodeIDs };
let ZWaveProtocolCCNodesExistReply = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.NodesExistReply)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCNodesExistReply = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCNodesExistReply = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.nodeMaskType = options.nodeMaskType;
            this.nodeListUpdated = options.nodeListUpdated;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const nodeMaskType = raw.payload[0];
            const nodeListUpdated = raw.payload[1] === 0x01;
            return new this({
                nodeId: ctx.sourceNodeId,
                nodeMaskType,
                nodeListUpdated,
            });
        }
        nodeMaskType;
        nodeListUpdated;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.nodeMaskType,
                this.nodeListUpdated ? 0x01 : 0x00,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCNodesExistReply = _classThis;
})();
export { ZWaveProtocolCCNodesExistReply };
function testResponseForZWaveProtocolNodesExist(sent, received) {
    return received.nodeMaskType === sent.nodeMaskType;
}
let ZWaveProtocolCCNodesExist = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.NodesExist), expectedCCResponse(ZWaveProtocolCCNodesExistReply, testResponseForZWaveProtocolNodesExist)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCNodesExist = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCNodesExist = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.nodeMaskType = options.nodeMaskType;
            this.nodeIDs = options.nodeIDs;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const nodeMaskType = raw.payload[0];
            const numNodeIDs = raw.payload[1];
            validatePayload(raw.payload.length >= 2 + numNodeIDs);
            const nodeIDs = [...raw.payload.subarray(2, 2 + numNodeIDs)];
            return new this({
                nodeId: ctx.sourceNodeId,
                nodeMaskType,
                nodeIDs,
            });
        }
        nodeMaskType;
        nodeIDs;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.nodeMaskType,
                this.nodeIDs.length,
                ...this.nodeIDs,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCNodesExist = _classThis;
})();
export { ZWaveProtocolCCNodesExist };
let ZWaveProtocolCCSetNWIMode = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SetNWIMode)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCSetNWIMode = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSetNWIMode = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.enabled = options.enabled;
            this.timeoutMinutes = options.timeoutMinutes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const enabled = raw.payload[0] === 0x01;
            const timeoutMinutes = raw.payload[1] || undefined;
            return new this({
                nodeId: ctx.sourceNodeId,
                enabled,
                timeoutMinutes,
            });
        }
        enabled;
        timeoutMinutes;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.enabled ? 0x01 : 0x00,
                this.timeoutMinutes ?? 0x00,
            ]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCSetNWIMode = _classThis;
})();
export { ZWaveProtocolCCSetNWIMode };
let ZWaveProtocolCCExcludeRequest = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.ExcludeRequest)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCCNodeInformationFrame;
    var ZWaveProtocolCCExcludeRequest = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCExcludeRequest = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCExcludeRequest = _classThis;
})();
export { ZWaveProtocolCCExcludeRequest };
let ZWaveProtocolCCAssignReturnRoutePriority = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AssignReturnRoutePriority)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCAssignReturnRoutePriority = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAssignReturnRoutePriority = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.targetNodeId = options.targetNodeId;
            this.routeNumber = options.routeNumber;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const targetNodeId = raw.payload[0];
            const routeNumber = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                targetNodeId,
                routeNumber,
            });
        }
        targetNodeId;
        routeNumber;
        serialize(ctx) {
            this.payload = Bytes.from([this.targetNodeId, this.routeNumber]);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCAssignReturnRoutePriority = _classThis;
})();
export { ZWaveProtocolCCAssignReturnRoutePriority };
let ZWaveProtocolCCAssignSUCReturnRoutePriority = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.AssignSUCReturnRoutePriority)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCCAssignReturnRoutePriority;
    var ZWaveProtocolCCAssignSUCReturnRoutePriority = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCAssignSUCReturnRoutePriority = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCAssignSUCReturnRoutePriority = _classThis;
})();
export { ZWaveProtocolCCAssignSUCReturnRoutePriority };
let ZWaveProtocolCCSmartStartIncludedNodeInformation = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SmartStartIncludedNodeInformation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCC;
    var ZWaveProtocolCCSmartStartIncludedNodeInformation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSmartStartIncludedNodeInformation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.nwiHomeId.length !== 4) {
                throw new ZWaveError(`nwiHomeId must have length 4`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.nwiHomeId = options.nwiHomeId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const nwiHomeId = raw.payload.subarray(0, 4);
            return new this({
                nodeId: ctx.sourceNodeId,
                nwiHomeId,
            });
        }
        nwiHomeId;
        serialize(ctx) {
            this.payload = Bytes.from(this.nwiHomeId);
            return super.serialize(ctx);
        }
    };
    return ZWaveProtocolCCSmartStartIncludedNodeInformation = _classThis;
})();
export { ZWaveProtocolCCSmartStartIncludedNodeInformation };
let ZWaveProtocolCCSmartStartPrime = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SmartStartPrime)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCCNodeInformationFrame;
    var ZWaveProtocolCCSmartStartPrime = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSmartStartPrime = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCSmartStartPrime = _classThis;
})();
export { ZWaveProtocolCCSmartStartPrime };
let ZWaveProtocolCCSmartStartInclusionRequest = (() => {
    let _classDecorators = [CCCommand(ZWaveProtocolCommand.SmartStartInclusionRequest)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWaveProtocolCCNodeInformationFrame;
    var ZWaveProtocolCCSmartStartInclusionRequest = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWaveProtocolCCSmartStartInclusionRequest = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWaveProtocolCCSmartStartInclusionRequest = _classThis;
})();
export { ZWaveProtocolCCSmartStartInclusionRequest };
//# sourceMappingURL=ZWaveProtocolCC.js.map