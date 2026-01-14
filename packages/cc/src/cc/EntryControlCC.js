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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, getCCName, parseBitMask, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, buffer2hex, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { EntryControlCommand, EntryControlDataTypes, EntryControlEventTypes, } from "../lib/_Types.js";
import * as ccUtils from "../lib/utils.js";
export const EntryControlCCValues = V.defineCCValues(CommandClasses["Entry Control"], {
    ...V.staticProperty("keyCacheSize", {
        ...ValueMetadata.UInt8,
        label: "Key cache size",
        description: "Number of character that must be stored before sending",
        min: 1,
        max: 32,
    }),
    ...V.staticProperty("keyCacheTimeout", {
        ...ValueMetadata.UInt8,
        label: "Key cache timeout",
        unit: "seconds",
        description: "How long the key cache must wait for additional characters",
        min: 1,
        max: 10,
    }),
    ...V.staticProperty("supportedDataTypes", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedEventTypes", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedKeys", undefined, {
        internal: true,
    }),
});
let EntryControlCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Entry Control"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _setConfiguration_decorators;
    var EntryControlCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _setConfiguration_decorators, { kind: "method", name: "setConfiguration", static: false, private: false, access: { has: obj => "setConfiguration" in obj, get: obj => obj.setConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case EntryControlCommand.KeySupportedGet:
                case EntryControlCommand.EventSupportedGet:
                case EntryControlCommand.ConfigurationGet:
                    return this.isSinglecast();
                case EntryControlCommand.ConfigurationSet:
                    return true;
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupportedKeys() {
            this.assertSupportsCommand(EntryControlCommand, EntryControlCommand.KeySupportedGet);
            const cc = new EntryControlCCKeySupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedKeys;
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getEventCapabilities() {
            this.assertSupportsCommand(EntryControlCommand, EntryControlCommand.EventSupportedGet);
            const cc = new EntryControlCCEventSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "supportedDataTypes",
                    "supportedEventTypes",
                    "minKeyCacheSize",
                    "maxKeyCacheSize",
                    "minKeyCacheTimeout",
                    "maxKeyCacheTimeout",
                ]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getConfiguration() {
            this.assertSupportsCommand(EntryControlCommand, EntryControlCommand.ConfigurationGet);
            const cc = new EntryControlCCConfigurationGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["keyCacheSize", "keyCacheTimeout"]);
            }
        }
        async setConfiguration(keyCacheSize, keyCacheTimeout) {
            this.assertSupportsCommand(EntryControlCommand, EntryControlCommand.ConfigurationGet);
            const cc = new EntryControlCCConfigurationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                keyCacheSize,
                keyCacheTimeout,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_setConfiguration_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property }, value) {
                if (property !== "keyCacheSize" && property !== "keyCacheTimeout") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                let keyCacheSize = value;
                let keyCacheTimeout = 2;
                if (property === "keyCacheTimeout") {
                    keyCacheTimeout = value;
                    const oldKeyCacheSize = this.tryGetValueDB()?.getValue(EntryControlCCValues.keyCacheSize.endpoint(this.endpoint.index));
                    if (oldKeyCacheSize == undefined) {
                        throw new ZWaveError(`The "keyCacheTimeout" property cannot be changed before the key cache size is known!`, ZWaveErrorCodes.Argument_Invalid);
                    }
                    keyCacheSize = oldKeyCacheSize;
                }
                const result = await this.setConfiguration(keyCacheSize, keyCacheTimeout);
                // Verify the change after a short delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    this.schedulePoll({ property }, value, { transition: "fast" });
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "keyCacheSize":
                    case "keyCacheTimeout":
                        return (await this.getConfiguration())?.[property];
                }
                throwUnsupportedProperty(this.ccId, property);
            };
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return EntryControlCCAPI = _classThis;
})();
export { EntryControlCCAPI };
let EntryControlCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Entry Control"]), implementedVersion(1), ccValues(EntryControlCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var EntryControlCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            return [
                ...super.determineRequiredCCInterviews(),
                CommandClasses.Association,
                CommandClasses["Multi Channel Association"],
                CommandClasses["Association Group Information"],
            ];
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Entry Control"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // If one Association group issues Entry Control notifications,
            // we must associate ourselves with that channel
            try {
                await ccUtils.assignLifelineIssueingCommand(ctx, endpoint, this.ccId, EntryControlCommand.Notification);
            }
            catch {
                ctx.logNode(node.id, {
                    endpoint: endpoint.index,
                    message: `Configuring associations to receive ${getCCName(this.ccId)} commands failed!`,
                    level: "warn",
                });
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "requesting entry control supported keys...",
                direction: "outbound",
            });
            const supportedKeys = await api.getSupportedKeys();
            if (supportedKeys) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `received entry control supported keys: ${supportedKeys.toString()}`,
                    direction: "inbound",
                });
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "requesting entry control supported events...",
                direction: "outbound",
            });
            const eventCapabilities = await api.getEventCapabilities();
            if (eventCapabilities) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `received entry control supported keys:
data types:            ${eventCapabilities.supportedDataTypes
                        .map((e) => EntryControlDataTypes[e])
                        .toString()}
event types:           ${eventCapabilities.supportedEventTypes
                        .map((e) => EntryControlEventTypes[e])
                        .toString()}
min key cache size:    ${eventCapabilities.minKeyCacheSize}
max key cache size:    ${eventCapabilities.maxKeyCacheSize}
min key cache timeout: ${eventCapabilities.minKeyCacheTimeout} seconds
max key cache timeout: ${eventCapabilities.maxKeyCacheTimeout} seconds`,
                    direction: "inbound",
                });
            }
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Entry Control"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "requesting entry control configuration...",
                direction: "outbound",
            });
            const conf = await api.getConfiguration();
            if (conf) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `received entry control configuration:
key cache size:    ${conf.keyCacheSize}
key cache timeout: ${conf.keyCacheTimeout} seconds`,
                    direction: "inbound",
                });
            }
        }
    };
    return EntryControlCC = _classThis;
})();
export { EntryControlCC };
let EntryControlCCNotification = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.Notification)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCNotification = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCNotification = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.sequenceNumber = options.sequenceNumber;
            this.dataType = options.dataType;
            this.eventType = options.eventType;
            this.eventData = options.eventData;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const sequenceNumber = raw.payload[0];
            let dataType = raw.payload[1] & 0b11;
            const eventType = raw.payload[2];
            const eventDataLength = raw.payload[3];
            validatePayload(eventDataLength >= 0 && eventDataLength <= 32);
            const offset = 4;
            validatePayload(raw.payload.length >= offset + eventDataLength);
            let eventData;
            if (eventDataLength > 0) {
                // We shouldn't need to check this, since the specs are pretty clear which format to expect.
                // But as always - manufacturers don't care and send ASCII data with 0 bytes...
                // We also need to disable the strict validation for some devices to make them work
                const noStrictValidation = !!ctx.getDeviceConfig?.(ctx.sourceNodeId)?.compat?.disableStrictEntryControlDataValidation;
                eventData = Bytes.from(raw.payload.subarray(offset, offset + eventDataLength));
                switch (dataType) {
                    case EntryControlDataTypes.Raw:
                        // RAW 1 to 32 bytes of arbitrary binary data
                        if (!noStrictValidation) {
                            validatePayload(eventDataLength >= 1 && eventDataLength <= 32);
                        }
                        break;
                    case EntryControlDataTypes.ASCII:
                        // ASCII 1 to 32 ASCII encoded characters. ASCII codes MUST be in the value range 0x00-0xF7.
                        // The string MUST be padded with the value 0xFF to fit 16 byte blocks when sent in a notification.
                        if (!noStrictValidation) {
                            validatePayload(eventDataLength === 16 || eventDataLength === 32);
                        }
                        // Trim 0xff padding bytes
                        let paddingStart = eventDataLength;
                        while (paddingStart > 0
                            && eventData[paddingStart - 1] === 0xff) {
                            paddingStart--;
                        }
                        eventData = eventData.subarray(0, paddingStart).toString("ascii");
                        if (!noStrictValidation) {
                            validatePayload(/^[\u0000-\u007f]+$/.test(eventData));
                        }
                        break;
                    case EntryControlDataTypes.MD5:
                        // MD5 16 byte binary data encoded as a MD5 hash value.
                        if (!noStrictValidation) {
                            validatePayload(eventDataLength === 16);
                        }
                        break;
                }
            }
            else {
                dataType = EntryControlDataTypes.None;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sequenceNumber,
                dataType,
                eventType,
                eventData,
            });
        }
        sequenceNumber;
        dataType;
        eventType;
        eventData;
        toLogEntry(ctx) {
            const message = {
                "sequence number": this.sequenceNumber,
                "data type": this.dataType,
                "event type": this.eventType,
            };
            if (this.eventData) {
                switch (this.eventType) {
                    case EntryControlEventTypes.CachedKeys:
                    case EntryControlEventTypes.Enter:
                        // The event data is likely the user's PIN code, hide it from logs
                        message["event data"] = "*".repeat(this.eventData.length);
                        break;
                    default:
                        message["event data"] = typeof this.eventData === "string"
                            ? this.eventData
                            : buffer2hex(this.eventData);
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return EntryControlCCNotification = _classThis;
})();
export { EntryControlCCNotification };
let EntryControlCCKeySupportedReport = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.KeySupportedReport), ccValueProperty("supportedKeys", EntryControlCCValues.supportedKeys)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCKeySupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCKeySupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedKeys = options.supportedKeys;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const length = raw.payload[0];
            validatePayload(raw.payload.length >= 1 + length);
            const supportedKeys = parseBitMask(raw.payload.subarray(1, 1 + length), 0);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedKeys,
            });
        }
        supportedKeys;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "supported keys": this.supportedKeys.toString() },
            };
        }
    };
    return EntryControlCCKeySupportedReport = _classThis;
})();
export { EntryControlCCKeySupportedReport };
let EntryControlCCKeySupportedGet = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.KeySupportedGet), expectedCCResponse(EntryControlCCKeySupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCKeySupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCKeySupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return EntryControlCCKeySupportedGet = _classThis;
})();
export { EntryControlCCKeySupportedGet };
let EntryControlCCEventSupportedReport = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.EventSupportedReport), ccValueProperty("supportedDataTypes", EntryControlCCValues.supportedDataTypes), ccValueProperty("supportedEventTypes", EntryControlCCValues.supportedEventTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCEventSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCEventSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.supportedDataTypes = options.supportedDataTypes;
            this.supportedEventTypes = options.supportedEventTypes;
            this.minKeyCacheSize = options.minKeyCacheSize;
            this.maxKeyCacheSize = options.maxKeyCacheSize;
            this.minKeyCacheTimeout = options.minKeyCacheTimeout;
            this.maxKeyCacheTimeout = options.maxKeyCacheTimeout;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const dataTypeLength = raw.payload[0] & 0b11;
            let offset = 1;
            validatePayload(raw.payload.length >= offset + dataTypeLength);
            const supportedDataTypes = parseBitMask(raw.payload.subarray(offset, offset + dataTypeLength), EntryControlDataTypes.None);
            offset += dataTypeLength;
            validatePayload(raw.payload.length >= offset + 1);
            const eventTypeLength = raw.payload[offset] & 0b11111;
            offset += 1;
            validatePayload(raw.payload.length >= offset + eventTypeLength);
            const supportedEventTypes = parseBitMask(raw.payload.subarray(offset, offset + eventTypeLength), EntryControlEventTypes.Caching);
            offset += eventTypeLength;
            validatePayload(raw.payload.length >= offset + 4);
            const minKeyCacheSize = raw.payload[offset];
            validatePayload(minKeyCacheSize >= 1 && minKeyCacheSize <= 32);
            const maxKeyCacheSize = raw.payload[offset + 1];
            validatePayload(maxKeyCacheSize >= minKeyCacheSize
                && maxKeyCacheSize <= 32);
            const minKeyCacheTimeout = raw.payload[offset + 2];
            const maxKeyCacheTimeout = raw.payload[offset + 3];
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedDataTypes,
                supportedEventTypes,
                minKeyCacheSize,
                maxKeyCacheSize,
                minKeyCacheTimeout,
                maxKeyCacheTimeout,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Store min/max cache size and timeout as metadata
            const keyCacheSizeValue = EntryControlCCValues.keyCacheSize;
            this.setMetadata(ctx, keyCacheSizeValue, {
                ...keyCacheSizeValue.meta,
                min: this.minKeyCacheSize,
                max: this.maxKeyCacheSize,
            });
            const keyCacheTimeoutValue = EntryControlCCValues.keyCacheTimeout;
            this.setMetadata(ctx, keyCacheTimeoutValue, {
                ...keyCacheTimeoutValue.meta,
                min: this.minKeyCacheTimeout,
                max: this.maxKeyCacheTimeout,
            });
            return true;
        }
        supportedDataTypes;
        supportedEventTypes;
        minKeyCacheSize;
        maxKeyCacheSize;
        minKeyCacheTimeout;
        maxKeyCacheTimeout;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported data types": this.supportedDataTypes
                        .map((dt) => EntryControlDataTypes[dt])
                        .toString(),
                    "supported event types": this.supportedEventTypes
                        .map((et) => EntryControlEventTypes[et])
                        .toString(),
                    "min key cache size": this.minKeyCacheSize,
                    "max key cache size": this.maxKeyCacheSize,
                    "min key cache timeout": this.minKeyCacheTimeout,
                    "max key cache timeout": this.maxKeyCacheTimeout,
                },
            };
        }
    };
    return EntryControlCCEventSupportedReport = _classThis;
})();
export { EntryControlCCEventSupportedReport };
let EntryControlCCEventSupportedGet = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.EventSupportedGet), expectedCCResponse(EntryControlCCEventSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCEventSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCEventSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return EntryControlCCEventSupportedGet = _classThis;
})();
export { EntryControlCCEventSupportedGet };
let EntryControlCCConfigurationReport = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.ConfigurationReport), ccValueProperty("keyCacheSize", EntryControlCCValues.keyCacheSize), ccValueProperty("keyCacheTimeout", EntryControlCCValues.keyCacheTimeout)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCConfigurationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCConfigurationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.keyCacheSize = options.keyCacheSize;
            this.keyCacheTimeout = options.keyCacheTimeout;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const keyCacheSize = raw.payload[0];
            validatePayload(keyCacheSize >= 1 && keyCacheSize <= 32);
            const keyCacheTimeout = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                keyCacheSize,
                keyCacheTimeout,
            });
        }
        keyCacheSize;
        keyCacheTimeout;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "key cache size": this.keyCacheSize,
                    "key cache timeout": this.keyCacheTimeout,
                },
            };
        }
    };
    return EntryControlCCConfigurationReport = _classThis;
})();
export { EntryControlCCConfigurationReport };
let EntryControlCCConfigurationGet = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.ConfigurationGet), expectedCCResponse(EntryControlCCConfigurationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCConfigurationGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCConfigurationGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return EntryControlCCConfigurationGet = _classThis;
})();
export { EntryControlCCConfigurationGet };
let EntryControlCCConfigurationSet = (() => {
    let _classDecorators = [CCCommand(EntryControlCommand.ConfigurationSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EntryControlCC;
    var EntryControlCCConfigurationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EntryControlCCConfigurationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.keyCacheSize = options.keyCacheSize;
            this.keyCacheTimeout = options.keyCacheTimeout;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new EntryControlCCConfigurationSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        keyCacheSize;
        keyCacheTimeout;
        serialize(ctx) {
            this.payload = Bytes.from([this.keyCacheSize, this.keyCacheTimeout]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "key cache size": this.keyCacheSize,
                    "key cache timeout": this.keyCacheTimeout,
                },
            };
        }
    };
    return EntryControlCCConfigurationSet = _classThis;
})();
export { EntryControlCCConfigurationSet };
//# sourceMappingURL=EntryControlCC.js.map