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
import { CommandClasses, Duration, ValueMetadata, ZWaveError, ZWaveErrorCodes, getCCName, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { SceneActuatorConfigurationCommand } from "../lib/_Types.js";
export const SceneActuatorConfigurationCCValues = V.defineCCValues(CommandClasses["Scene Actuator Configuration"], {
    ...V.dynamicPropertyAndKeyWithName("level", "level", (sceneId) => sceneId, ({ property, propertyKey }) => property === "level" && typeof propertyKey === "number", (sceneId) => ({
        ...ValueMetadata.UInt8,
        label: `Level (${sceneId})`,
        valueChangeOptions: ["transitionDuration"],
    })),
    ...V.dynamicPropertyAndKeyWithName("dimmingDuration", "dimmingDuration", (sceneId) => sceneId, ({ property, propertyKey }) => property === "dimmingDuration"
        && typeof propertyKey === "number", (sceneId) => ({
        ...ValueMetadata.Duration,
        label: `Dimming duration (${sceneId})`,
    })),
});
let SceneActuatorConfigurationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Scene Actuator Configuration"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    let _get_decorators;
    var SceneActuatorConfigurationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs()];
            _get_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActuatorConfigurationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case SceneActuatorConfigurationCommand.Get:
                    return this.isSinglecast();
                case SceneActuatorConfigurationCommand.Set:
                    return true;
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
                if (property === "level") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    // We need to set the dimming duration along with the level.
                    // Dimming duration is chosen with the following precedence:
                    // 1. options.transitionDuration
                    // 2. current stored value
                    // 3. default
                    const dimmingDuration = Duration.from(options?.transitionDuration)
                        ?? this.tryGetValueDB()?.getValue(SceneActuatorConfigurationCCValues.dimmingDuration(propertyKey).endpoint(this.endpoint.index));
                    return this.set(propertyKey, dimmingDuration, value);
                }
                else if (property === "dimmingDuration") {
                    if (typeof value !== "string" && !Duration.isDuration(value)) {
                        throwWrongValueType(this.ccId, property, "duration", typeof value);
                    }
                    const dimmingDuration = Duration.from(value);
                    if (dimmingDuration == undefined) {
                        throw new ZWaveError(`${getCCName(this.ccId)}: "${property}" could not be set. ${JSON.stringify(value)} is not a valid duration.`, ZWaveErrorCodes.Argument_Invalid);
                    }
                    // Must set the level along with the dimmingDuration,
                    // Use saved value, if it's defined. Otherwise the default
                    // will be used.
                    const level = this.tryGetValueDB()?.getValue(SceneActuatorConfigurationCCValues.level(propertyKey).endpoint(this.endpoint.index));
                    return this.set(propertyKey, dimmingDuration, level);
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "level":
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
        async set(sceneId, dimmingDuration, level) {
            this.assertSupportsCommand(SceneActuatorConfigurationCommand, SceneActuatorConfigurationCommand.Set);
            // Undefined `dimmingDuration` defaults to 0 seconds to simplify the call
            // for actuators that don't support non-instant `dimmingDuration`
            // Undefined `level` uses the actuator's current value (override = 0).
            const cc = new SceneActuatorConfigurationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sceneId,
                dimmingDuration: Duration.from(dimmingDuration)
                    ?? new Duration(0, "seconds"),
                level,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getActive() {
            this.assertSupportsCommand(SceneActuatorConfigurationCommand, SceneActuatorConfigurationCommand.Get);
            const cc = new SceneActuatorConfigurationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sceneId: 0,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["sceneId", "level", "dimmingDuration"]);
            }
        }
        async get(sceneId) {
            this.assertSupportsCommand(SceneActuatorConfigurationCommand, SceneActuatorConfigurationCommand.Get);
            if (sceneId === 0) {
                throw new ZWaveError(`Invalid scene ID 0. To get the currently active scene, use getActive() instead.`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new SceneActuatorConfigurationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sceneId: sceneId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["level", "dimmingDuration"]);
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return SceneActuatorConfigurationCCAPI = _classThis;
})();
export { SceneActuatorConfigurationCCAPI };
let SceneActuatorConfigurationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Scene Actuator Configuration"]), implementedVersion(1), ccValues(SceneActuatorConfigurationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var SceneActuatorConfigurationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActuatorConfigurationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // eslint-disable-next-line @typescript-eslint/require-await
        async interview(ctx) {
            const node = this.getNode(ctx);
            ctx.logNode(node.id, {
                message: `${this.constructor.name}: setting metadata`,
                direction: "none",
            });
            // Create Metadata for all scenes
            for (let sceneId = 1; sceneId <= 255; sceneId++) {
                const levelValue = SceneActuatorConfigurationCCValues.level(sceneId);
                this.ensureMetadata(ctx, levelValue);
                const dimmingDurationValue = SceneActuatorConfigurationCCValues
                    .dimmingDuration(sceneId);
                this.ensureMetadata(ctx, dimmingDurationValue);
            }
            this.setInterviewComplete(ctx, true);
        }
    };
    return SceneActuatorConfigurationCC = _classThis;
})();
export { SceneActuatorConfigurationCC };
let SceneActuatorConfigurationCCSet = (() => {
    let _classDecorators = [CCCommand(SceneActuatorConfigurationCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneActuatorConfigurationCC;
    var SceneActuatorConfigurationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActuatorConfigurationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.sceneId < 1 || options.sceneId > 255) {
                throw new ZWaveError(`The scene id ${options.sceneId} must be between 1 and 255!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.sceneId = options.sceneId;
            this.dimmingDuration = options.dimmingDuration;
            this.level = options.level;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new SceneActuatorConfigurationCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        sceneId;
        dimmingDuration;
        level;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.sceneId,
                this.dimmingDuration.serializeSet(),
                this.level != undefined ? 0b1000_0000 : 0,
                this.level ?? 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                sceneId: this.sceneId,
                dimmingDuration: this.dimmingDuration.toString(),
            };
            if (this.level != undefined) {
                message.level = this.level;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return SceneActuatorConfigurationCCSet = _classThis;
})();
export { SceneActuatorConfigurationCCSet };
let SceneActuatorConfigurationCCReport = (() => {
    let _classDecorators = [CCCommand(SceneActuatorConfigurationCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneActuatorConfigurationCC;
    var SceneActuatorConfigurationCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActuatorConfigurationCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.sceneId = options.sceneId;
            this.level = options.level;
            this.dimmingDuration = options.dimmingDuration;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const sceneId = raw.payload[0];
            let level;
            let dimmingDuration;
            if (sceneId !== 0) {
                level = raw.payload[1];
                dimmingDuration = Duration.parseReport(raw.payload[2])
                    ?? Duration.unknown();
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sceneId,
                level,
                dimmingDuration,
            });
        }
        sceneId;
        level;
        dimmingDuration;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Do not persist values for an inactive scene
            if (this.sceneId === 0
                || this.level == undefined
                || this.dimmingDuration == undefined) {
                return false;
            }
            const levelValue = SceneActuatorConfigurationCCValues.level(this.sceneId);
            this.ensureMetadata(ctx, levelValue);
            const dimmingDurationValue = SceneActuatorConfigurationCCValues
                .dimmingDuration(this.sceneId);
            this.ensureMetadata(ctx, dimmingDurationValue);
            this.setValue(ctx, levelValue, this.level);
            this.setValue(ctx, dimmingDurationValue, this.dimmingDuration);
            return true;
        }
        toLogEntry(ctx) {
            const message = {
                sceneId: this.sceneId,
            };
            if (this.dimmingDuration != undefined) {
                message.dimmingDuration = this.dimmingDuration.toString();
            }
            if (this.level != undefined) {
                message.level = this.level;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return SceneActuatorConfigurationCCReport = _classThis;
})();
export { SceneActuatorConfigurationCCReport };
function testResponseForSceneActuatorConfigurationGet(sent, received) {
    // We expect a Scene Actuator Configuration Report that matches
    // the requested sceneId, unless groupId 0 was requested
    return sent.sceneId === 0 || received.sceneId === sent.sceneId;
}
let SceneActuatorConfigurationCCGet = (() => {
    let _classDecorators = [CCCommand(SceneActuatorConfigurationCommand.Get), expectedCCResponse(SceneActuatorConfigurationCCReport, testResponseForSceneActuatorConfigurationGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneActuatorConfigurationCC;
    var SceneActuatorConfigurationCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActuatorConfigurationCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sceneId = options.sceneId;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new SceneActuatorConfigurationCCGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        sceneId;
        serialize(ctx) {
            this.payload = Bytes.from([this.sceneId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "scene id": this.sceneId },
            };
        }
    };
    return SceneActuatorConfigurationCCGet = _classThis;
})();
export { SceneActuatorConfigurationCCGet };
//# sourceMappingURL=SceneActuatorConfigurationCC.js.map