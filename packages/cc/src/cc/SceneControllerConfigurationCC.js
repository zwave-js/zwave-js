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
import { CommandClasses, Duration, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, getCCName, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { SceneControllerConfigurationCommand } from "../lib/_Types.js";
import { AssociationCC } from "./AssociationCC.js";
export const SceneControllerConfigurationCCValues = V.defineCCValues(CommandClasses["Scene Controller Configuration"], {
    ...V.dynamicPropertyAndKeyWithName("sceneId", "sceneId", (groupId) => groupId, ({ property, propertyKey }) => property === "sceneId" && typeof propertyKey === "number", (groupId) => ({
        ...ValueMetadata.UInt8,
        label: `Associated Scene ID (${groupId})`,
        valueChangeOptions: ["transitionDuration"],
    })),
    ...V.dynamicPropertyAndKeyWithName("dimmingDuration", "dimmingDuration", (groupId) => groupId, ({ property, propertyKey }) => property === "dimmingDuration"
        && typeof propertyKey === "number", (groupId) => ({
        ...ValueMetadata.Duration,
        label: `Dimming duration (${groupId})`,
    })),
});
let SceneControllerConfigurationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Scene Controller Configuration"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _disable_decorators;
    let _set_decorators;
    let _get_decorators;
    var SceneControllerConfigurationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _disable_decorators = [validateArgs()];
            _set_decorators = [validateArgs()];
            _get_decorators = [validateArgs()];
            __esDecorate(this, null, _disable_decorators, { kind: "method", name: "disable", static: false, private: false, access: { has: obj => "disable" in obj, get: obj => obj.disable }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneControllerConfigurationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case SceneControllerConfigurationCommand.Get:
                    return this.isSinglecast();
                case SceneControllerConfigurationCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property, propertyKey }, value, options) {
                if (propertyKey == undefined) {
                    throwMissingPropertyKey(this.ccId, property);
                }
                else if (typeof propertyKey !== "number") {
                    throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                }
                if (property === "sceneId") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    if (value === 0) {
                        // Disable Group ID / Scene ID
                        return this.disable(propertyKey);
                    }
                    else {
                        // We need to set the dimming duration along with the scene ID
                        // Dimming duration is chosen with the following precedence:
                        // 1. options.transitionDuration
                        // 2. current stored value
                        // 3. default value
                        const dimmingDuration = Duration.from(options?.transitionDuration)
                            ?? this.tryGetValueDB()?.getValue(SceneControllerConfigurationCCValues
                                .dimmingDuration(propertyKey).endpoint(this.endpoint.index))
                            ?? Duration.default();
                        return this.set(propertyKey, value, dimmingDuration);
                    }
                }
                else if (property === "dimmingDuration") {
                    if (typeof value !== "string" && !Duration.isDuration(value)) {
                        throwWrongValueType(this.ccId, property, "duration", typeof value);
                    }
                    const dimmingDuration = Duration.from(value);
                    if (dimmingDuration == undefined) {
                        throw new ZWaveError(`${getCCName(this.ccId)}: "${property}" could not be set. ${JSON.stringify(value)} is not a valid duration.`, ZWaveErrorCodes.Argument_Invalid);
                    }
                    const valueDB = this.tryGetValueDB();
                    const sceneId = valueDB?.getValue(SceneControllerConfigurationCCValues.sceneId(propertyKey).endpoint(this.endpoint.index));
                    if (sceneId == undefined || sceneId === 0) {
                        if (valueDB) {
                            // Can't actually send dimmingDuration without valid sceneId
                            // So we save it in the valueDB without sending it to the node
                            const dimmingDurationValueId = SceneControllerConfigurationCCValues
                                .dimmingDuration(propertyKey).endpoint(this.endpoint.index);
                            valueDB.setValue(dimmingDurationValueId, dimmingDuration);
                        }
                        return;
                    }
                    return this.set(propertyKey, sceneId, dimmingDuration);
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "sceneId":
                    case "dimmingDuration": {
                        if (propertyKey == undefined) {
                            throwMissingPropertyKey(this.ccId, property);
                        }
                        else if (typeof propertyKey !== "number") {
                            throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                        }
                        return (await this.get(propertyKey))?.[property];
                    }
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async disable(groupId) {
            this.assertSupportsCommand(SceneControllerConfigurationCommand, SceneControllerConfigurationCommand.Set);
            return this.set(groupId, 0, new Duration(0, "seconds"));
        }
        async set(groupId, sceneId, dimmingDuration) {
            this.assertSupportsCommand(SceneControllerConfigurationCommand, SceneControllerConfigurationCommand.Set);
            if (!this.endpoint.virtual) {
                const groupCount = SceneControllerConfigurationCC
                    .getGroupCountCached(this.host, this.endpoint);
                // The client SHOULD NOT specify group 1 (the life-line group).
                // We don't block it here, because the specs don't forbid it,
                // and it may be needed for some devices.
                if (groupId < 1 || groupId > groupCount) {
                    throw new ZWaveError(`${this.constructor.name}: The group ID must be between 1 and the number of supported groups ${groupCount}.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            else if (groupId < 1) {
                throw new ZWaveError(`The group ID must be greater than 0.`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new SceneControllerConfigurationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
                sceneId,
                dimmingDuration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getLastActivated() {
            this.assertSupportsCommand(SceneControllerConfigurationCommand, SceneControllerConfigurationCommand.Get);
            const cc = new SceneControllerConfigurationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId: 0,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            // Return value includes "groupId", because
            // the returned report will include the actual groupId of the
            // last activated groupId / sceneId
            if (response) {
                return pick(response, ["groupId", "sceneId", "dimmingDuration"]);
            }
        }
        async get(groupId) {
            this.assertSupportsCommand(SceneControllerConfigurationCommand, SceneControllerConfigurationCommand.Get);
            if (groupId === 0) {
                throw new ZWaveError(`Invalid group ID 0. To get the last activated group / scene, use getLastActivated() instead.`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (groupId < 0) {
                throw new ZWaveError(`The group ID must be greater than 0.`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new SceneControllerConfigurationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            // Since groupId is not allowed to be 0, only Reports with
            // groupId equal to the requested groupId will be accepted,
            // so we can omit groupId from the return.
            if (response) {
                return pick(response, ["sceneId", "dimmingDuration"]);
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return SceneControllerConfigurationCCAPI = _classThis;
})();
export { SceneControllerConfigurationCCAPI };
let SceneControllerConfigurationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Scene Controller Configuration"]), implementedVersion(1), ccValues(SceneControllerConfigurationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var SceneControllerConfigurationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneControllerConfigurationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            // AssociationCC is required and MUST be interviewed
            // before SceneControllerConfigurationCC to supply groupCount
            return [
                ...super.determineRequiredCCInterviews(),
                CommandClasses.Association,
            ];
        }
        // eslint-disable-next-line @typescript-eslint/require-await
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            const groupCount = SceneControllerConfigurationCC.getGroupCountCached(ctx, endpoint);
            if (groupCount === 0) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `skipping Scene Controller Configuration interview because Association group count is unknown`,
                    direction: "none",
                    level: "warn",
                });
                return;
            }
            // Create metadata for each scene, but don't query their actual configuration
            // since some devices only support setting scenes
            for (let groupId = 1; groupId <= groupCount; groupId++) {
                const sceneIdValue = SceneControllerConfigurationCCValues.sceneId(groupId);
                this.ensureMetadata(ctx, sceneIdValue);
                const dimmingDurationValue = SceneControllerConfigurationCCValues
                    .dimmingDuration(groupId);
                this.ensureMetadata(ctx, dimmingDurationValue);
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Scene Controller Configuration"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const groupCount = SceneControllerConfigurationCC.getGroupCountCached(ctx, endpoint);
            ctx.logNode(node.id, {
                message: "querying all scene controller configurations...",
                direction: "outbound",
            });
            for (let groupId = 1; groupId <= groupCount; groupId++) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying scene configuration for group #${groupId}...`,
                    direction: "outbound",
                });
                const group = await api.get(groupId);
                if (group != undefined) {
                    const logMessage = `received scene configuration for group #${groupId}:
scene ID:         ${group.sceneId}
dimming duration: ${group.dimmingDuration.toString()}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
        /**
         * Returns the number of association groups reported by the node.
         * This only works AFTER the node has been interviewed by this CC
         * or the AssociationCC.
         */
        static getGroupCountCached(ctx, endpoint) {
            return ctx.getDeviceConfig?.(endpoint.nodeId)?.compat
                ?.forceSceneControllerGroupCount
                ?? AssociationCC.getGroupCountCached(ctx, endpoint)
                ?? 0;
        }
    };
    return SceneControllerConfigurationCC = _classThis;
})();
export { SceneControllerConfigurationCC };
let SceneControllerConfigurationCCSet = (() => {
    let _classDecorators = [CCCommand(SceneControllerConfigurationCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneControllerConfigurationCC;
    var SceneControllerConfigurationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneControllerConfigurationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupId = options.groupId;
            this.sceneId = options.sceneId;
            // if dimmingDuration was missing, use default duration.
            this.dimmingDuration = Duration.from(options.dimmingDuration)
                ?? Duration.default();
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new SceneControllerConfigurationCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        groupId;
        sceneId;
        dimmingDuration;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.groupId,
                this.sceneId,
                this.dimmingDuration.serializeSet(),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    "scene id": this.sceneId,
                    "dimming duration": this.dimmingDuration.toString(),
                },
            };
        }
    };
    return SceneControllerConfigurationCCSet = _classThis;
})();
export { SceneControllerConfigurationCCSet };
let SceneControllerConfigurationCCReport = (() => {
    let _classDecorators = [CCCommand(SceneControllerConfigurationCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneControllerConfigurationCC;
    var SceneControllerConfigurationCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneControllerConfigurationCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.groupId = options.groupId;
            this.sceneId = options.sceneId;
            this.dimmingDuration = options.dimmingDuration;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const groupId = raw.payload[0];
            const sceneId = raw.payload[1];
            const dimmingDuration = Duration.parseReport(raw.payload[2])
                ?? Duration.unknown();
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                sceneId,
                dimmingDuration,
            });
        }
        groupId;
        sceneId;
        dimmingDuration;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // If groupId = 0, values are meaningless
            if (this.groupId === 0)
                return false;
            const sceneIdValue = SceneControllerConfigurationCCValues.sceneId(this.groupId);
            this.ensureMetadata(ctx, sceneIdValue);
            const dimmingDurationValue = SceneControllerConfigurationCCValues
                .dimmingDuration(this.groupId);
            this.ensureMetadata(ctx, dimmingDurationValue);
            this.setValue(ctx, sceneIdValue, this.sceneId);
            this.setValue(ctx, dimmingDurationValue, this.dimmingDuration);
            return true;
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    "scene id": this.sceneId,
                    "dimming duration": this.dimmingDuration.toString(),
                },
            };
        }
    };
    return SceneControllerConfigurationCCReport = _classThis;
})();
export { SceneControllerConfigurationCCReport };
function testResponseForSceneControllerConfigurationGet(sent, received) {
    // We expect a Scene Controller Configuration Report that matches
    // the requested groupId, unless groupId 0 was requested
    return sent.groupId === 0 || received.groupId === sent.groupId;
}
let SceneControllerConfigurationCCGet = (() => {
    let _classDecorators = [CCCommand(SceneControllerConfigurationCommand.Get), expectedCCResponse(SceneControllerConfigurationCCReport, testResponseForSceneControllerConfigurationGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneControllerConfigurationCC;
    var SceneControllerConfigurationCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneControllerConfigurationCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupId = options.groupId;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new SceneControllerConfigurationCCGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        groupId;
        serialize(ctx) {
            this.payload = Bytes.from([this.groupId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "group id": this.groupId },
            };
        }
    };
    return SceneControllerConfigurationCCGet = _classThis;
})();
export { SceneControllerConfigurationCCGet };
//# sourceMappingURL=SceneControllerConfigurationCC.js.map