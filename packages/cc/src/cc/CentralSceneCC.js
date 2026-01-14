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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, enumValuesToMetadataStates, getCCName, maybeUnknownToString, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { CentralSceneCommand, CentralSceneKeys } from "../lib/_Types.js";
import * as ccUtils from "../lib/utils.js";
export const CentralSceneCCValues = V.defineCCValues(CommandClasses["Central Scene"], {
    ...V.staticProperty("sceneCount", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsSlowRefresh", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedKeyAttributes", undefined, {
        internal: true,
    }),
    ...V.staticProperty("slowRefresh", {
        ...ValueMetadata.Boolean,
        label: "Send held down notifications at a slow rate",
        description: "When this is true, KeyHeldDown notifications are sent every 55s. When this is false, the notifications are sent every 200ms.",
    }),
    ...V.dynamicPropertyAndKeyWithName("scene", "scene", (sceneNumber) => sceneNumber.toString().padStart(3, "0"), ({ property, propertyKey }) => property === "scene"
        && typeof propertyKey === "string"
        && /^\d{3}$/.test(propertyKey), (sceneNumber) => ({
        ...ValueMetadata.ReadOnlyUInt8,
        label: `Scene ${sceneNumber.toString().padStart(3, "0")}`,
    }), { stateful: false }),
});
let CentralSceneCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Central Scene"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _setConfiguration_decorators;
    var CentralSceneCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _setConfiguration_decorators, { kind: "method", name: "setConfiguration", static: false, private: false, access: { has: obj => "setConfiguration" in obj, get: obj => obj.setConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case CentralSceneCommand.SupportedGet:
                    return this.isSinglecast(); // this is mandatory
                case CentralSceneCommand.ConfigurationGet:
                    return this.version >= 3 && this.isSinglecast();
                case CentralSceneCommand.ConfigurationSet:
                    return this.version >= 3;
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupported() {
            this.assertSupportsCommand(CentralSceneCommand, CentralSceneCommand.SupportedGet);
            const cc = new CentralSceneCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "sceneCount",
                    "supportsSlowRefresh",
                    "supportedKeyAttributes",
                ]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getConfiguration() {
            this.assertSupportsCommand(CentralSceneCommand, CentralSceneCommand.ConfigurationGet);
            const cc = new CentralSceneCCConfigurationGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["slowRefresh"]);
            }
        }
        async setConfiguration(slowRefresh) {
            this.assertSupportsCommand(CentralSceneCommand, CentralSceneCommand.ConfigurationSet);
            const cc = new CentralSceneCCConfigurationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                slowRefresh,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_setConfiguration_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property }, value) {
                if (property !== "slowRefresh") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "boolean") {
                    throwWrongValueType(this.ccId, property, "boolean", typeof value);
                }
                return this.setConfiguration(value);
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                if (property === "slowRefresh") {
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
    return CentralSceneCCAPI = _classThis;
})();
export { CentralSceneCCAPI };
let CentralSceneCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Central Scene"]), implementedVersion(3), ccValues(CentralSceneCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var CentralSceneCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCC = _classThis = _classDescriptor.value;
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
        skipEndpointInterview() {
            // Central scene notifications are issued by the root device
            return true;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Central Scene"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // If one Association group issues CentralScene notifications,
            // we must associate ourselves with that channel
            try {
                await ccUtils.assignLifelineIssueingCommand(ctx, endpoint, this.ccId, CentralSceneCommand.Notification);
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
                message: "Querying supported scenes...",
                direction: "outbound",
            });
            const ccSupported = await api.getSupported();
            if (ccSupported) {
                const logMessage = `received supported scenes:
# of scenes:           ${ccSupported.sceneCount}
supports slow refresh: ${ccSupported.supportsSlowRefresh}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying supported scenes timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            // The slow refresh capability should be enabled whenever possible
            if (api.version >= 3 && ccSupported?.supportsSlowRefresh) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Enabling slow refresh capability...",
                    direction: "outbound",
                });
                await api.setConfiguration(true);
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return CentralSceneCC = _classThis;
})();
export { CentralSceneCC };
let CentralSceneCCNotification = (() => {
    let _classDecorators = [CCCommand(CentralSceneCommand.Notification)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CentralSceneCC;
    var CentralSceneCCNotification = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCNotification = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.sequenceNumber = options.sequenceNumber;
            this.keyAttribute = options.keyAttribute;
            this.sceneNumber = options.sceneNumber;
            this.slowRefresh = options.slowRefresh;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const sequenceNumber = raw.payload[0];
            const keyAttribute = raw.payload[1] & 0b111;
            const sceneNumber = raw.payload[2];
            let slowRefresh;
            if (keyAttribute === CentralSceneKeys.KeyHeldDown) {
                // A receiving node MUST ignore this field if the command is not
                // carrying the Key Held Down key attribute.
                slowRefresh = !!(raw.payload[1] & 0b1000_0000);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sequenceNumber,
                keyAttribute,
                sceneNumber,
                slowRefresh,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // In case the interview is not yet completed, we still create some basic metadata
            const sceneValue = CentralSceneCCValues.scene(this.sceneNumber);
            this.ensureMetadata(ctx, sceneValue);
            // The spec behavior is pretty complicated, so we cannot just store
            // the value and call it a day. Handling of these notifications will
            // happen in the receiving node class
            return true;
        }
        sequenceNumber;
        keyAttribute;
        sceneNumber;
        slowRefresh;
        toLogEntry(ctx) {
            const message = {
                "sequence number": this.sequenceNumber,
                "key attribute": getEnumMemberName(CentralSceneKeys, this.keyAttribute),
                "scene number": this.sceneNumber,
            };
            if (this.slowRefresh != undefined) {
                message["slow refresh"] = this.slowRefresh;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return CentralSceneCCNotification = _classThis;
})();
export { CentralSceneCCNotification };
let CentralSceneCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(CentralSceneCommand.SupportedReport), ccValueProperty("sceneCount", CentralSceneCCValues.sceneCount), ccValueProperty("supportsSlowRefresh", CentralSceneCCValues.supportsSlowRefresh), ccValueProperty("supportedKeyAttributes", CentralSceneCCValues.supportedKeyAttributes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CentralSceneCC;
    var CentralSceneCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.sceneCount = options.sceneCount;
            this.supportsSlowRefresh = options.supportsSlowRefresh;
            for (const [scene, keys] of Object.entries(options.supportedKeyAttributes)) {
                this._supportedKeyAttributes.set(parseInt(scene), keys);
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const sceneCount = raw.payload[0];
            const supportsSlowRefresh = !!(raw.payload[1] & 0b1000_0000);
            const bitMaskBytes = (raw.payload[1] & 0b110) >>> 1;
            const identicalKeyAttributes = !!(raw.payload[1] & 0b1);
            const numEntries = identicalKeyAttributes ? 1 : sceneCount;
            validatePayload(raw.payload.length >= 2 + bitMaskBytes * numEntries);
            const supportedKeyAttributes = {};
            for (let i = 0; i < numEntries; i++) {
                const mask = raw.payload.subarray(2 + i * bitMaskBytes, 2 + (i + 1) * bitMaskBytes);
                supportedKeyAttributes[i + 1] = parseBitMask(mask, CentralSceneKeys.KeyPressed);
            }
            if (identicalKeyAttributes) {
                // The key attributes are only transmitted for scene 1, copy them to the others
                for (let i = 2; i <= sceneCount; i++) {
                    supportedKeyAttributes[i] = supportedKeyAttributes[1];
                }
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sceneCount,
                supportsSlowRefresh,
                supportedKeyAttributes,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Create/extend metadata for all scenes
            for (let i = 1; i <= this.sceneCount; i++) {
                const sceneValue = CentralSceneCCValues.scene(i);
                this.setMetadata(ctx, sceneValue, {
                    ...sceneValue.meta,
                    states: enumValuesToMetadataStates(CentralSceneKeys, this._supportedKeyAttributes.get(i)),
                });
            }
            return true;
        }
        sceneCount;
        // TODO: Only offer `slowRefresh` if this is true
        supportsSlowRefresh;
        _supportedKeyAttributes = new Map();
        get supportedKeyAttributes() {
            return this._supportedKeyAttributes;
        }
        toLogEntry(ctx) {
            const message = {
                "scene count": this.sceneCount,
                "supports slow refresh": maybeUnknownToString(this.supportsSlowRefresh),
            };
            for (const [scene, keys] of this.supportedKeyAttributes) {
                message[`supported attributes (scene #${scene})`] = keys
                    .map((k) => `\n· ${getEnumMemberName(CentralSceneKeys, k)}`)
                    .join("");
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return CentralSceneCCSupportedReport = _classThis;
})();
export { CentralSceneCCSupportedReport };
let CentralSceneCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(CentralSceneCommand.SupportedGet), expectedCCResponse(CentralSceneCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CentralSceneCC;
    var CentralSceneCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return CentralSceneCCSupportedGet = _classThis;
})();
export { CentralSceneCCSupportedGet };
let CentralSceneCCConfigurationReport = (() => {
    let _classDecorators = [CCCommand(CentralSceneCommand.ConfigurationReport), ccValueProperty("slowRefresh", CentralSceneCCValues.slowRefresh)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CentralSceneCC;
    var CentralSceneCCConfigurationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCConfigurationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.slowRefresh = options.slowRefresh;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const slowRefresh = !!(raw.payload[0] & 0b1000_0000);
            return new this({
                nodeId: ctx.sourceNodeId,
                slowRefresh,
            });
        }
        slowRefresh;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "slow refresh": this.slowRefresh },
            };
        }
    };
    return CentralSceneCCConfigurationReport = _classThis;
})();
export { CentralSceneCCConfigurationReport };
let CentralSceneCCConfigurationGet = (() => {
    let _classDecorators = [CCCommand(CentralSceneCommand.ConfigurationGet), expectedCCResponse(CentralSceneCCConfigurationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CentralSceneCC;
    var CentralSceneCCConfigurationGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCConfigurationGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return CentralSceneCCConfigurationGet = _classThis;
})();
export { CentralSceneCCConfigurationGet };
let CentralSceneCCConfigurationSet = (() => {
    let _classDecorators = [CCCommand(CentralSceneCommand.ConfigurationSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CentralSceneCC;
    var CentralSceneCCConfigurationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentralSceneCCConfigurationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.slowRefresh = options.slowRefresh;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new CentralSceneCCConfigurationSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        slowRefresh;
        serialize(ctx) {
            this.payload = Bytes.from([this.slowRefresh ? 0b1000_0000 : 0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "slow refresh": this.slowRefresh },
            };
        }
    };
    return CentralSceneCCConfigurationSet = _classThis;
})();
export { CentralSceneCCConfigurationSet };
//# sourceMappingURL=CentralSceneCC.js.map