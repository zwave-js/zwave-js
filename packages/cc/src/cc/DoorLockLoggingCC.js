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
import { CommandClasses, MessagePriority, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, isPrintableASCII, num2hex } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { DoorLockLoggingCommand, DoorLockLoggingEventType, DoorLockLoggingRecordStatus, } from "../lib/_Types.js";
import { userCodeToLogString } from "./UserCodeCC.js";
function segmentsToDate(segments) {
    return new Date(segments.year, segments.month - 1, // JS months are 0-based.
    segments.day, segments.hour, segments.minute, segments.second);
}
const eventTypeLabel = {
    LockCode: "Locked via Access Code",
    UnlockCode: "Unlocked via Access Code",
    LockButton: "Locked via Lock Button",
    UnlockButton: "Unlocked via Unlock Button",
    LockCodeOutOfSchedule: "Out of Schedule Lock Attempt via Access Code",
    UnlockCodeOutOfSchedule: "Out of Schedule Unlock Attempt via Access Code",
    IllegalCode: "Illegal Access Code Entered",
    LockManual: "Manually Locked",
    UnlockManual: "Manually Unlocked",
    LockAuto: "Auto Locked",
    UnlockAuto: "Auto Unlocked",
    LockRemoteCode: "Locked via Remote Access Code",
    UnlockRemoteCode: "Unlocked via Remote Access Code",
    LockRemote: "Locked via Remote",
    UnlockRemote: "Unlocked via Remote",
    LockRemoteCodeOutOfSchedule: "Out of Schedule Lock Attempt via Remote Access Code",
    UnlockRemoteCodeOutOfSchedule: "Out of Schedule Unlock Attempt via Remote Access Code",
    RemoteIllegalCode: "Illegal Remote Access Code",
    LockManual2: "Manually Locked (2)",
    UnlockManual2: "Manually Unlocked (2)",
    LockSecured: "Lock Secured",
    LockUnsecured: "Lock Unsecured",
    UserCodeAdded: "User Code Added",
    UserCodeDeleted: "User Code Deleted",
    AllUserCodesDeleted: "All User Codes Deleted",
    AdminCodeChanged: "Admin Code Changed",
    UserCodeChanged: "User Code Changed",
    LockReset: "Lock Reset",
    ConfigurationChanged: "Configuration Changed",
    LowBattery: "Low Battery",
    NewBattery: "New Battery Installed",
    Unknown: "Unknown",
};
const LATEST_RECORD_NUMBER_KEY = 0;
export const DoorLockLoggingCCValues = V.defineCCValues(CommandClasses["Door Lock Logging"], {
    ...V.staticProperty("recordsCount", undefined, { internal: true }),
});
let DoorLockLoggingCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Door Lock Logging"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _getRecord_decorators;
    var DoorLockLoggingCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _getRecord_decorators = [validateArgs()];
            __esDecorate(this, null, _getRecord_decorators, { kind: "method", name: "getRecord", static: false, private: false, access: { has: obj => "getRecord" in obj, get: obj => obj.getRecord }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockLoggingCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case DoorLockLoggingCommand.RecordsSupportedGet:
                case DoorLockLoggingCommand.RecordsSupportedReport:
                case DoorLockLoggingCommand.RecordGet:
                case DoorLockLoggingCommand.RecordReport:
                    return true;
            }
            return super.supportsCommand(cmd);
        }
        async getRecordsCount() {
            this.assertSupportsCommand(DoorLockLoggingCommand, DoorLockLoggingCommand.RecordsSupportedGet);
            const cc = new DoorLockLoggingCCRecordsSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.recordsCount;
        }
        /** Retrieves the specified audit record. Defaults to the latest one. */
        async getRecord(recordNumber = LATEST_RECORD_NUMBER_KEY) {
            this.assertSupportsCommand(DoorLockLoggingCommand, DoorLockLoggingCommand.RecordGet);
            const cc = new DoorLockLoggingCCRecordGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                recordNumber,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.record;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return DoorLockLoggingCCAPI = _classThis;
})();
export { DoorLockLoggingCCAPI };
let DoorLockLoggingCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Door Lock Logging"]), implementedVersion(1), ccValues(DoorLockLoggingCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var DoorLockLoggingCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockLoggingCC = _classThis = _classDescriptor.value;
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
            const api = CCAPI.create(CommandClasses["Door Lock Logging"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying supported number of records...",
                direction: "outbound",
            });
            const recordsCount = await api.getRecordsCount();
            if (!recordsCount) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Door Lock Logging records count query timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            const recordsCountLogMessage = `supports ${recordsCount} record${recordsCount === 1 ? "" : "s"}`;
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: recordsCountLogMessage,
                direction: "inbound",
            });
        }
    };
    return DoorLockLoggingCC = _classThis;
})();
export { DoorLockLoggingCC };
let DoorLockLoggingCCRecordsSupportedReport = (() => {
    let _classDecorators = [CCCommand(DoorLockLoggingCommand.RecordsSupportedReport), ccValueProperty("recordsCount", DoorLockLoggingCCValues.recordsCount)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockLoggingCC;
    var DoorLockLoggingCCRecordsSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockLoggingCCRecordsSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.recordsCount = options.recordsCount;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const recordsCount = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                recordsCount,
            });
        }
        recordsCount;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported no. of records": this.recordsCount,
                },
            };
        }
    };
    return DoorLockLoggingCCRecordsSupportedReport = _classThis;
})();
export { DoorLockLoggingCCRecordsSupportedReport };
function eventTypeToLabel(eventType) {
    return (eventTypeLabel[DoorLockLoggingEventType[eventType]]
        ?? `Unknown ${num2hex(eventType)}`);
}
let DoorLockLoggingCCRecordsSupportedGet = (() => {
    let _classDecorators = [CCCommand(DoorLockLoggingCommand.RecordsSupportedGet), expectedCCResponse(DoorLockLoggingCCRecordsSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockLoggingCC;
    var DoorLockLoggingCCRecordsSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockLoggingCCRecordsSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DoorLockLoggingCCRecordsSupportedGet = _classThis;
})();
export { DoorLockLoggingCCRecordsSupportedGet };
let DoorLockLoggingCCRecordReport = (() => {
    let _classDecorators = [CCCommand(DoorLockLoggingCommand.RecordReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockLoggingCC;
    var DoorLockLoggingCCRecordReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockLoggingCCRecordReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.recordNumber = options.recordNumber;
            this.record = options.record;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 11);
            const recordNumber = raw.payload[0];
            const recordStatus = raw.payload[5] >>> 5;
            let record;
            if (recordStatus !== DoorLockLoggingRecordStatus.Empty) {
                const dateSegments = {
                    year: raw.payload.readUInt16BE(1),
                    month: raw.payload[3],
                    day: raw.payload[4],
                    hour: raw.payload[5] & 0b11111,
                    minute: raw.payload[6],
                    second: raw.payload[7],
                };
                const eventType = raw.payload[8];
                const recordUserID = raw.payload[9];
                const userCodeLength = raw.payload[10];
                validatePayload(userCodeLength <= 10, raw.payload.length >= 11 + userCodeLength);
                const userCodeBuffer = raw.payload.subarray(11, 11 + userCodeLength);
                // See User Code CC for a detailed description. We try to parse the code as ASCII if possible
                // and fall back to a buffer otherwise.
                const userCodeString = userCodeBuffer.toString("utf8");
                const userCode = isPrintableASCII(userCodeString)
                    ? userCodeString
                    : userCodeBuffer;
                record = {
                    eventType: eventType,
                    label: eventTypeToLabel(eventType),
                    timestamp: segmentsToDate(dateSegments).toISOString(),
                    userId: recordUserID,
                    userCode,
                };
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                recordNumber,
                record,
            });
        }
        recordNumber;
        record;
        toLogEntry(ctx) {
            let message;
            if (!this.record) {
                message = {
                    "record #": `${this.recordNumber} (empty)`,
                };
            }
            else {
                message = {
                    "record #": `${this.recordNumber}`,
                    "event type": this.record.label,
                    timestamp: this.record.timestamp,
                };
                if (this.record.userId) {
                    message["user ID"] = this.record.userId;
                }
                if (this.record.userCode) {
                    message["user code"] = userCodeToLogString(this.record.userCode);
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return DoorLockLoggingCCRecordReport = _classThis;
})();
export { DoorLockLoggingCCRecordReport };
function testResponseForDoorLockLoggingRecordGet(sent, received) {
    return (sent.recordNumber === LATEST_RECORD_NUMBER_KEY
        || sent.recordNumber === received.recordNumber);
}
let DoorLockLoggingCCRecordGet = (() => {
    let _classDecorators = [CCCommand(DoorLockLoggingCommand.RecordGet), expectedCCResponse(DoorLockLoggingCCRecordReport, testResponseForDoorLockLoggingRecordGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DoorLockLoggingCC;
    var DoorLockLoggingCCRecordGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DoorLockLoggingCCRecordGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.recordNumber = options.recordNumber;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new DoorLockLoggingCCRecordGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        recordNumber;
        serialize(ctx) {
            this.payload = Bytes.from([this.recordNumber]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "record number": this.recordNumber },
            };
        }
    };
    return DoorLockLoggingCCRecordGet = _classThis;
})();
export { DoorLockLoggingCCRecordGet };
//# sourceMappingURL=DoorLockLoggingCC.js.map