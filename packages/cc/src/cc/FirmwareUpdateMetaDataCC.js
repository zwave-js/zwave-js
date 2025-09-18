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
import { CRC16_CCITT, CommandClasses, MessagePriority, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, num2hex, pick, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { FirmwareDownloadStatus, FirmwareUpdateActivationStatus, FirmwareUpdateMetaDataCommand, FirmwareUpdateRequestStatus, FirmwareUpdateStatus, } from "../lib/_Types.js";
// @noSetValueAPI There are no values to set here
export const FirmwareUpdateMetaDataCCValues = V.defineCCValues(CommandClasses["Firmware Update Meta Data"], {
    ...V.staticProperty("supportsActivation", undefined, {
        internal: true,
    }),
    ...V.staticProperty("firmwareUpgradable", undefined, {
        internal: true,
    }),
    ...V.staticProperty("additionalFirmwareIDs", undefined, {
        internal: true,
    }),
    ...V.staticProperty("continuesToFunction", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsResuming", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsNonSecureTransfer", undefined, {
        internal: true,
    }),
});
let FirmwareUpdateMetaDataCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Firmware Update Meta Data"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _reportMetaData_decorators;
    let _requestUpdate_decorators;
    let _respondToUpdateRequest_decorators;
    let _respondToDownloadRequest_decorators;
    let _sendFirmwareFragment_decorators;
    let _activateFirmware_decorators;
    var FirmwareUpdateMetaDataCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _reportMetaData_decorators = [validateArgs()];
            _requestUpdate_decorators = [validateArgs()];
            _respondToUpdateRequest_decorators = [validateArgs()];
            _respondToDownloadRequest_decorators = [validateArgs()];
            _sendFirmwareFragment_decorators = [validateArgs()];
            _activateFirmware_decorators = [validateArgs()];
            __esDecorate(this, null, _reportMetaData_decorators, { kind: "method", name: "reportMetaData", static: false, private: false, access: { has: obj => "reportMetaData" in obj, get: obj => obj.reportMetaData }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestUpdate_decorators, { kind: "method", name: "requestUpdate", static: false, private: false, access: { has: obj => "requestUpdate" in obj, get: obj => obj.requestUpdate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _respondToUpdateRequest_decorators, { kind: "method", name: "respondToUpdateRequest", static: false, private: false, access: { has: obj => "respondToUpdateRequest" in obj, get: obj => obj.respondToUpdateRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _respondToDownloadRequest_decorators, { kind: "method", name: "respondToDownloadRequest", static: false, private: false, access: { has: obj => "respondToDownloadRequest" in obj, get: obj => obj.respondToDownloadRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendFirmwareFragment_decorators, { kind: "method", name: "sendFirmwareFragment", static: false, private: false, access: { has: obj => "sendFirmwareFragment" in obj, get: obj => obj.sendFirmwareFragment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _activateFirmware_decorators, { kind: "method", name: "activateFirmware", static: false, private: false, access: { has: obj => "activateFirmware" in obj, get: obj => obj.activateFirmware }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case FirmwareUpdateMetaDataCommand.MetaDataGet:
                case FirmwareUpdateMetaDataCommand.MetaDataReport:
                case FirmwareUpdateMetaDataCommand.RequestGet:
                case FirmwareUpdateMetaDataCommand.RequestReport:
                case FirmwareUpdateMetaDataCommand.Report:
                case FirmwareUpdateMetaDataCommand.StatusReport:
                    return true;
                case FirmwareUpdateMetaDataCommand.ActivationSet:
                    return (this.version >= 4
                        && (this.version < 7
                            || this.tryGetValueDB()?.getValue(FirmwareUpdateMetaDataCCValues
                                .supportsActivation.endpoint(this.endpoint.index)) === true));
                case FirmwareUpdateMetaDataCommand.PrepareGet:
                case FirmwareUpdateMetaDataCommand.PrepareReport:
                    return this.version >= 5;
            }
            return super.supportsCommand(cmd);
        }
        /**
         * Requests information about the current firmware on the device
         */
        async getMetaData() {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.MetaDataGet);
            const cc = new FirmwareUpdateMetaDataCCMetaDataGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "manufacturerId",
                    "firmwareId",
                    "checksum",
                    "firmwareUpgradable",
                    "maxFragmentSize",
                    "additionalFirmwareIDs",
                    "hardwareVersion",
                    "continuesToFunction",
                    "supportsActivation",
                    "supportsResuming",
                    "supportsNonSecureTransfer",
                ]);
            }
        }
        async reportMetaData(options) {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.Report);
            const cc = new FirmwareUpdateMetaDataCCMetaDataReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Requests the device to start the firmware update process and waits for a response.
         * This response may time out on some devices, in which case the caller of this method
         * should wait manually.
         */
        requestUpdate(options) {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.RequestGet);
            const cc = new FirmwareUpdateMetaDataCCRequestGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Responds to a firmware update request
         */
        async respondToUpdateRequest(options) {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.RequestReport);
            const cc = new FirmwareUpdateMetaDataCCRequestReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, {
                ...this.commandOptions,
                // Do not wait for Nonce Reports
                s2VerifyDelivery: false,
            });
        }
        /**
         * Responds to a firmware download request
         */
        async respondToDownloadRequest(options) {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.PrepareReport);
            const cc = new FirmwareUpdateMetaDataCCPrepareReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, {
                ...this.commandOptions,
                // Do not wait for Nonce Reports
                s2VerifyDelivery: false,
            });
        }
        /**
         * Sends a fragment of the new firmware to the device
         */
        async sendFirmwareFragment(fragmentNumber, isLastFragment, data) {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.Report);
            const cc = new FirmwareUpdateMetaDataCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                reportNumber: fragmentNumber,
                isLast: isLastFragment,
                firmwareData: data,
            });
            await this.host.sendCommand(cc, {
                ...this.commandOptions,
                // Do not wait for Nonce Reports
                s2VerifyDelivery: false,
            });
        }
        /** Activates a previously transferred firmware image */
        async activateFirmware(options) {
            this.assertSupportsCommand(FirmwareUpdateMetaDataCommand, FirmwareUpdateMetaDataCommand.ActivationSet);
            const cc = new FirmwareUpdateMetaDataCCActivationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.activationStatus;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return FirmwareUpdateMetaDataCCAPI = _classThis;
})();
export { FirmwareUpdateMetaDataCCAPI };
let FirmwareUpdateMetaDataCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Firmware Update Meta Data"]), implementedVersion(8), ccValues(FirmwareUpdateMetaDataCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var FirmwareUpdateMetaDataCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        skipEndpointInterview() {
            return true;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Firmware Update Meta Data"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "Querying firmware update capabilities...",
                direction: "outbound",
            });
            const caps = await api.getMetaData();
            if (caps) {
                let logMessage = `Received firmware update capabilities:`;
                if (caps.firmwareUpgradable) {
                    logMessage += `
  firmware targets:             ${[0, ...caps.additionalFirmwareIDs].join(", ")}
  continues to function:        ${caps.continuesToFunction}
  supports activation:          ${caps.supportsActivation}`;
                    if (caps.supportsResuming != undefined) {
                        logMessage += `
  supports resuming:            ${caps.supportsResuming}`;
                    }
                    if (caps.supportsNonSecureTransfer != undefined) {
                        logMessage += `
  supports non-secure transfer: ${caps.supportsNonSecureTransfer}`;
                    }
                }
                else {
                    logMessage += `\nfirmware upgradeable: false`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Firmware update capability query timed out",
                    direction: "inbound",
                });
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return FirmwareUpdateMetaDataCC = _classThis;
})();
export { FirmwareUpdateMetaDataCC };
let FirmwareUpdateMetaDataCCMetaDataReport = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.MetaDataReport), ccValueProperty("firmwareUpgradable", FirmwareUpdateMetaDataCCValues.firmwareUpgradable), ccValueProperty("additionalFirmwareIDs", FirmwareUpdateMetaDataCCValues.additionalFirmwareIDs), ccValueProperty("continuesToFunction", FirmwareUpdateMetaDataCCValues.continuesToFunction), ccValueProperty("supportsActivation", FirmwareUpdateMetaDataCCValues.supportsActivation), ccValueProperty("supportsResuming", FirmwareUpdateMetaDataCCValues.supportsResuming), ccValueProperty("supportsNonSecureTransfer", FirmwareUpdateMetaDataCCValues.supportsNonSecureTransfer)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCMetaDataReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCMetaDataReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId;
            this.firmwareId = options.firmwareId ?? 0;
            this.checksum = options.checksum ?? 0;
            this.firmwareUpgradable = options.firmwareUpgradable;
            this.maxFragmentSize = options.maxFragmentSize;
            this.additionalFirmwareIDs = options.additionalFirmwareIDs ?? [];
            this.hardwareVersion = options.hardwareVersion;
            this.continuesToFunction = options.continuesToFunction;
            this.supportsActivation = options.supportsActivation;
            this.supportsResuming = options.supportsResuming;
            this.supportsNonSecureTransfer = options.supportsNonSecureTransfer;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 6);
            const manufacturerId = raw.payload.readUInt16BE(0);
            const firmwareId = raw.payload.readUInt16BE(2);
            const checksum = raw.payload.readUInt16BE(4);
            // V1/V2 only have a single firmware which must be upgradable
            const firmwareUpgradable = raw.payload[6] === 0xff
                || raw.payload[6] == undefined;
            let maxFragmentSize;
            let additionalFirmwareIDs;
            let hardwareVersion;
            let continuesToFunction;
            let supportsActivation;
            let supportsResuming;
            let supportsNonSecureTransfer;
            if (raw.payload.length >= 10) {
                // V3+
                maxFragmentSize = raw.payload.readUInt16BE(8);
                // Read variable length list of additional firmwares
                const numAdditionalFirmwares = raw.payload[7];
                additionalFirmwareIDs = [];
                validatePayload(raw.payload.length >= 10 + 2 * numAdditionalFirmwares);
                for (let i = 0; i < numAdditionalFirmwares; i++) {
                    additionalFirmwareIDs.push(raw.payload.readUInt16BE(10 + 2 * i));
                }
                // Read hardware version (if it exists)
                let offset = 10 + 2 * numAdditionalFirmwares;
                if (raw.payload.length >= offset + 1) {
                    // V5+
                    hardwareVersion = raw.payload[offset];
                    offset++;
                    if (raw.payload.length >= offset + 1) {
                        // V6+
                        const capabilities = raw.payload[offset];
                        offset++;
                        continuesToFunction = !!(capabilities & 0b1);
                        // V7+
                        supportsActivation = !!(capabilities & 0b10);
                        // V8+
                        supportsResuming = !!(capabilities & 0b1000);
                        supportsNonSecureTransfer = !!(capabilities & 0b100);
                    }
                }
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                firmwareId,
                checksum,
                firmwareUpgradable,
                maxFragmentSize,
                additionalFirmwareIDs,
                hardwareVersion,
                continuesToFunction,
                supportsActivation,
                supportsResuming,
                supportsNonSecureTransfer,
            });
        }
        manufacturerId;
        firmwareId;
        checksum;
        firmwareUpgradable;
        maxFragmentSize;
        additionalFirmwareIDs = [];
        hardwareVersion;
        continuesToFunction;
        supportsActivation;
        supportsResuming;
        supportsNonSecureTransfer;
        serialize(ctx) {
            this.payload = Bytes.alloc(12 + 2 * this.additionalFirmwareIDs.length);
            this.payload.writeUInt16BE(this.manufacturerId, 0);
            this.payload.writeUInt16BE(this.firmwareId, 2);
            this.payload.writeUInt16BE(this.checksum, 4);
            this.payload[6] = this.firmwareUpgradable ? 0xff : 0;
            this.payload[7] = this.additionalFirmwareIDs.length;
            this.payload.writeUInt16BE(this.maxFragmentSize ?? 0xff, 8);
            let offset = 10;
            for (const id of this.additionalFirmwareIDs) {
                this.payload.writeUInt16BE(id, offset);
                offset += 2;
            }
            this.payload[offset++] = this.hardwareVersion ?? 0xff;
            this.payload[offset++] = (this.continuesToFunction ? 0b1 : 0)
                | (this.supportsActivation ? 0b10 : 0)
                | (this.supportsNonSecureTransfer ? 0b100 : 0)
                | (this.supportsResuming ? 0b1000 : 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "manufacturer id": this.manufacturerId,
                "firmware id": this.firmwareId,
                checksum: this.checksum,
                "firmware upgradable": this.firmwareUpgradable,
            };
            if (this.maxFragmentSize != undefined) {
                message["max fragment size"] = this.maxFragmentSize;
            }
            if (this.additionalFirmwareIDs.length) {
                message["additional firmware IDs"] = JSON.stringify(this.additionalFirmwareIDs);
            }
            if (this.hardwareVersion != undefined) {
                message["hardware version"] = this.hardwareVersion;
            }
            if (this.continuesToFunction != undefined) {
                message["continues to function"] = this.continuesToFunction;
            }
            if (this.supportsActivation != undefined) {
                message["supports activation"] = this.supportsActivation;
            }
            if (this.supportsResuming != undefined) {
                message["supports resuming"] = this.supportsResuming;
            }
            if (this.supportsNonSecureTransfer != undefined) {
                message["supports non-secure transfer"] =
                    this.supportsNonSecureTransfer;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FirmwareUpdateMetaDataCCMetaDataReport = _classThis;
})();
export { FirmwareUpdateMetaDataCCMetaDataReport };
let FirmwareUpdateMetaDataCCMetaDataGet = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.MetaDataGet), expectedCCResponse(FirmwareUpdateMetaDataCCMetaDataReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCMetaDataGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCMetaDataGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return FirmwareUpdateMetaDataCCMetaDataGet = _classThis;
})();
export { FirmwareUpdateMetaDataCCMetaDataGet };
let FirmwareUpdateMetaDataCCRequestReport = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.RequestReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCRequestReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCRequestReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.status = options.status;
            this.resume = options.resume;
            this.nonSecureTransfer = options.nonSecureTransfer;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const status = raw.payload[0];
            let resume;
            let nonSecureTransfer;
            if (raw.payload.length >= 2) {
                resume = !!(raw.payload[1] & 0b100);
                nonSecureTransfer = !!(raw.payload[1] & 0b10);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                status,
                resume,
                nonSecureTransfer,
            });
        }
        status;
        resume;
        nonSecureTransfer;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.status,
                (this.resume ? 0b100 : 0) | (this.nonSecureTransfer ? 0b10 : 0),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                status: getEnumMemberName(FirmwareUpdateRequestStatus, this.status),
            };
            if (this.resume != undefined) {
                message.resume = this.resume;
            }
            if (this.nonSecureTransfer != undefined) {
                message["non-secure transfer"] = this.nonSecureTransfer;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FirmwareUpdateMetaDataCCRequestReport = _classThis;
})();
export { FirmwareUpdateMetaDataCCRequestReport };
let FirmwareUpdateMetaDataCCRequestGet = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.RequestGet), expectedCCResponse(FirmwareUpdateMetaDataCCRequestReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCRequestGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCRequestGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId;
            this.firmwareId = options.firmwareId;
            this.checksum = options.checksum;
            if ("firmwareTarget" in options) {
                this.firmwareTarget = options.firmwareTarget;
                this.fragmentSize = options.fragmentSize;
                this.activation = options.activation ?? false;
                this.hardwareVersion = options.hardwareVersion;
                this.resume = options.resume;
                this.nonSecureTransfer = options.nonSecureTransfer;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 6);
            const manufacturerId = raw.payload.readUInt16BE(0);
            const firmwareId = raw.payload.readUInt16BE(2);
            const checksum = raw.payload.readUInt16BE(4);
            if (raw.payload.length < 9) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    manufacturerId,
                    firmwareId,
                    checksum,
                });
            }
            // V3+
            const firmwareTarget = raw.payload[6];
            const fragmentSize = raw.payload.readUInt16BE(7);
            let resume;
            let nonSecureTransfer;
            let activation;
            if (raw.payload.length >= 10) {
                // V4+
                activation = !!(raw.payload[9] & 0b1);
                nonSecureTransfer = !!(raw.payload[9] & 0b10);
                resume = !!(raw.payload[9] & 0b100);
            }
            let hardwareVersion;
            if (raw.payload.length >= 11) {
                // V5+
                hardwareVersion = raw.payload[10];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                firmwareId,
                checksum,
                firmwareTarget,
                fragmentSize,
                activation,
                hardwareVersion,
                resume,
                nonSecureTransfer,
            });
        }
        manufacturerId;
        firmwareId;
        checksum;
        firmwareTarget;
        fragmentSize;
        activation;
        hardwareVersion;
        resume;
        nonSecureTransfer;
        serialize(ctx) {
            this.payload = Bytes.alloc(10, 0);
            this.payload.writeUInt16BE(this.manufacturerId, 0);
            this.payload.writeUInt16BE(this.firmwareId, 2);
            this.payload.writeUInt16BE(this.checksum, 4);
            this.payload[6] = this.firmwareTarget ?? 0;
            // 32 seems like a reasonable default fragment size,
            // but it should be specified anyways
            this.payload.writeUInt16BE(this.fragmentSize ?? 32, 7);
            this.payload[9] = (this.activation ? 0b1 : 0)
                | (this.nonSecureTransfer ? 0b10 : 0)
                | (this.resume ? 0b100 : 0);
            // Hardware version is not always set, but devices check it
            if (this.hardwareVersion != undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    [this.hardwareVersion],
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "manufacturer id": num2hex(this.manufacturerId),
                "firmware id": num2hex(this.firmwareId),
                checksum: num2hex(this.checksum),
            };
            if (this.firmwareTarget != undefined) {
                message["firmware target"] = this.firmwareTarget;
            }
            if (this.fragmentSize != undefined) {
                message["fragment size"] = this.fragmentSize;
            }
            if (this.activation != undefined) {
                message.activation = this.activation;
            }
            if (this.resume != undefined) {
                message.resume = this.resume;
            }
            if (this.nonSecureTransfer != undefined) {
                message["non-secure transfer"] = this.nonSecureTransfer;
            }
            if (this.hardwareVersion != undefined) {
                message["hardware version"] = this.hardwareVersion;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FirmwareUpdateMetaDataCCRequestGet = _classThis;
})();
export { FirmwareUpdateMetaDataCCRequestGet };
let FirmwareUpdateMetaDataCCGet = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.Get)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.numReports = options.numReports;
            this.reportNumber = options.reportNumber;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const numReports = raw.payload[0];
            const reportNumber = raw.payload.readUInt16BE(1) & 0x7fff;
            return new this({
                nodeId: ctx.sourceNodeId,
                numReports,
                reportNumber,
            });
        }
        numReports;
        reportNumber;
        serialize(ctx) {
            this.payload = new Bytes(3);
            this.payload[0] = this.numReports;
            this.payload.writeUInt16BE(this.reportNumber & 0x7fff, 1);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "total # of reports": this.numReports,
                    "report number": this.reportNumber,
                },
            };
        }
    };
    return FirmwareUpdateMetaDataCCGet = _classThis;
})();
export { FirmwareUpdateMetaDataCCGet };
let FirmwareUpdateMetaDataCCReport = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.reportNumber = options.reportNumber;
            this.firmwareData = options.firmwareData;
            this.isLast = options.isLast;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new FirmwareUpdateMetaDataCCReport({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        isLast;
        reportNumber;
        firmwareData;
        serialize(ctx) {
            const commandBuffer = Bytes.concat([
                new Bytes(2), // placeholder for report number
                this.firmwareData,
            ]);
            commandBuffer.writeUInt16BE((this.reportNumber & 0x7fff) | (this.isLast ? 0x8000 : 0), 0);
            // V1 devices would consider the checksum to be part of the firmware data
            // so it must not be included for those
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion >= 2) {
                // Compute and save the CRC16 in the payload
                // The CC header is included in the CRC computation
                let crc = CRC16_CCITT(Bytes.from([this.ccId, this.ccCommand]));
                crc = CRC16_CCITT(commandBuffer, crc);
                this.payload = Bytes.concat([
                    commandBuffer,
                    new Bytes(2),
                ]);
                this.payload.writeUInt16BE(crc, this.payload.length - 2);
            }
            else {
                this.payload = commandBuffer;
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "report #": this.reportNumber,
                    "is last": this.isLast,
                },
            };
        }
    };
    return FirmwareUpdateMetaDataCCReport = _classThis;
})();
export { FirmwareUpdateMetaDataCCReport };
let FirmwareUpdateMetaDataCCStatusReport = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.StatusReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCStatusReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCStatusReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.status = options.status;
            this.waitTime = options.waitTime;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const status = raw.payload[0];
            let waitTime;
            if (raw.payload.length >= 3) {
                waitTime = raw.payload.readUInt16BE(1);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                status,
                waitTime,
            });
        }
        status;
        /** The wait time in seconds before the node becomes available for communication after the update */
        waitTime;
        serialize(ctx) {
            this.payload = new Bytes(3);
            this.payload[0] = this.status;
            this.payload.writeUInt16BE(this.waitTime ?? 0, 1);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                status: getEnumMemberName(FirmwareUpdateStatus, this.status),
            };
            if (this.waitTime != undefined) {
                message["wait time"] = `${this.waitTime} seconds`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FirmwareUpdateMetaDataCCStatusReport = _classThis;
})();
export { FirmwareUpdateMetaDataCCStatusReport };
let FirmwareUpdateMetaDataCCActivationReport = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.ActivationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCActivationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCActivationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId;
            this.firmwareId = options.firmwareId;
            this.checksum = options.checksum;
            this.firmwareTarget = options.firmwareTarget;
            this.activationStatus = options.activationStatus;
            this.hardwareVersion = options.hardwareVersion;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 8);
            const manufacturerId = raw.payload.readUInt16BE(0);
            const firmwareId = raw.payload.readUInt16BE(2);
            const checksum = raw.payload.readUInt16BE(4);
            const firmwareTarget = raw.payload[6];
            const activationStatus = raw.payload[7];
            let hardwareVersion;
            if (raw.payload.length >= 9) {
                // V5+
                hardwareVersion = raw.payload[8];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                firmwareId,
                checksum,
                firmwareTarget,
                activationStatus,
                hardwareVersion,
            });
        }
        manufacturerId;
        firmwareId;
        checksum;
        firmwareTarget;
        activationStatus;
        hardwareVersion;
        serialize(ctx) {
            this.payload = new Bytes(8);
            this.payload.writeUInt16BE(this.manufacturerId, 0);
            this.payload.writeUInt16BE(this.firmwareId, 2);
            this.payload.writeUInt16BE(this.checksum, 4);
            this.payload[6] = this.firmwareTarget;
            this.payload[7] = this.activationStatus;
            if (this.hardwareVersion != undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    [this.hardwareVersion],
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "manufacturer id": num2hex(this.manufacturerId),
                "firmware id": num2hex(this.firmwareId),
                checksum: num2hex(this.checksum),
                "firmware target": this.firmwareTarget,
                "activation status": getEnumMemberName(FirmwareUpdateActivationStatus, this.activationStatus),
            };
            if (this.hardwareVersion != undefined) {
                message.hardwareVersion = this.hardwareVersion;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FirmwareUpdateMetaDataCCActivationReport = _classThis;
})();
export { FirmwareUpdateMetaDataCCActivationReport };
let FirmwareUpdateMetaDataCCActivationSet = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.ActivationSet), expectedCCResponse(FirmwareUpdateMetaDataCCActivationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCActivationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCActivationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId;
            this.firmwareId = options.firmwareId;
            this.checksum = options.checksum;
            this.firmwareTarget = options.firmwareTarget;
            this.hardwareVersion = options.hardwareVersion;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 7);
            const manufacturerId = raw.payload.readUInt16BE(0);
            const firmwareId = raw.payload.readUInt16BE(2);
            const checksum = raw.payload.readUInt16BE(4);
            const firmwareTarget = raw.payload[6];
            let hardwareVersion;
            if (raw.payload.length >= 8) {
                // V5+
                hardwareVersion = raw.payload[7];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                firmwareId,
                checksum,
                firmwareTarget,
                hardwareVersion,
            });
        }
        manufacturerId;
        firmwareId;
        checksum;
        firmwareTarget;
        hardwareVersion;
        serialize(ctx) {
            this.payload = new Bytes(7);
            this.payload.writeUInt16BE(this.manufacturerId, 0);
            this.payload.writeUInt16BE(this.firmwareId, 2);
            this.payload.writeUInt16BE(this.checksum, 4);
            this.payload[6] = this.firmwareTarget;
            if (this.hardwareVersion != undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    [this.hardwareVersion],
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "manufacturer id": num2hex(this.manufacturerId),
                "firmware id": num2hex(this.firmwareId),
                checksum: num2hex(this.checksum),
                "firmware target": this.firmwareTarget,
            };
            if (this.hardwareVersion != undefined) {
                message["hardware version"] = this.hardwareVersion;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return FirmwareUpdateMetaDataCCActivationSet = _classThis;
})();
export { FirmwareUpdateMetaDataCCActivationSet };
let FirmwareUpdateMetaDataCCPrepareReport = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.PrepareReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCPrepareReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCPrepareReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.status = options.status;
            this.checksum = options.checksum;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const status = raw.payload[0];
            const checksum = raw.payload.readUInt16BE(1);
            return new this({
                nodeId: ctx.sourceNodeId,
                status,
                checksum,
            });
        }
        status;
        checksum;
        serialize(ctx) {
            this.payload = new Bytes(3);
            this.payload[0] = this.status;
            this.payload.writeUInt16BE(this.checksum, 1);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    status: getEnumMemberName(FirmwareDownloadStatus, this.status),
                    checksum: num2hex(this.checksum),
                },
            };
        }
    };
    return FirmwareUpdateMetaDataCCPrepareReport = _classThis;
})();
export { FirmwareUpdateMetaDataCCPrepareReport };
let FirmwareUpdateMetaDataCCPrepareGet = (() => {
    let _classDecorators = [CCCommand(FirmwareUpdateMetaDataCommand.PrepareGet), expectedCCResponse(FirmwareUpdateMetaDataCCPrepareReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = FirmwareUpdateMetaDataCC;
    var FirmwareUpdateMetaDataCCPrepareGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FirmwareUpdateMetaDataCCPrepareGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.manufacturerId = options.manufacturerId;
            this.firmwareId = options.firmwareId;
            this.firmwareTarget = options.firmwareTarget;
            this.fragmentSize = options.fragmentSize;
            this.hardwareVersion = options.hardwareVersion;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 8);
            const manufacturerId = raw.payload.readUInt16BE(0);
            const firmwareId = raw.payload.readUInt16BE(2);
            const firmwareTarget = raw.payload[4];
            const fragmentSize = raw.payload.readUInt16BE(5);
            const hardwareVersion = raw.payload[7];
            return new this({
                nodeId: ctx.sourceNodeId,
                manufacturerId,
                firmwareId,
                firmwareTarget,
                fragmentSize,
                hardwareVersion,
            });
        }
        manufacturerId;
        firmwareId;
        firmwareTarget;
        fragmentSize;
        hardwareVersion;
        serialize(ctx) {
            this.payload = new Bytes(8);
            this.payload.writeUInt16BE(this.manufacturerId, 0);
            this.payload.writeUInt16BE(this.firmwareId, 2);
            this.payload[4] = this.firmwareTarget;
            this.payload.writeUInt16BE(this.fragmentSize, 5);
            this.payload[7] = this.hardwareVersion;
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "manufacturer id": num2hex(this.manufacturerId),
                    "firmware id": num2hex(this.firmwareId),
                    "firmware target": this.firmwareTarget,
                    "fragment size": this.fragmentSize,
                    "hardware version": this.hardwareVersion,
                },
            };
        }
    };
    return FirmwareUpdateMetaDataCCPrepareGet = _classThis;
})();
export { FirmwareUpdateMetaDataCCPrepareGet };
//# sourceMappingURL=FirmwareUpdateMetaDataCC.js.map