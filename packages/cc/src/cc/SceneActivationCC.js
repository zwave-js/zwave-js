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
import { CommandClasses, Duration, ValueMetadata, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { SceneActivationCommand } from "../lib/_Types.js";
export const SceneActivationCCValues = V.defineCCValues(CommandClasses["Scene Activation"], {
    ...V.staticProperty("sceneId", {
        ...ValueMetadata.UInt8,
        min: 1,
        label: "Scene ID",
        valueChangeOptions: ["transitionDuration"],
    }, { stateful: false }),
    ...V.staticProperty("dimmingDuration", {
        ...ValueMetadata.Duration,
        label: "Dimming duration",
    }),
});
// @noInterview This CC is write-only
let SceneActivationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Scene Activation"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var SceneActivationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActivationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(_cmd) {
            // There is only one mandatory command
            return true;
        }
        get [SET_VALUE]() {
            return async function ({ property }, value, options) {
                if (property !== "sceneId") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "number") {
                    throwWrongValueType(this.ccId, property, "number", typeof value);
                }
                const duration = Duration.from(options?.transitionDuration);
                return this.set(value, duration);
            };
        }
        /**
         * Activates the Scene with the given ID
         * @param duration The duration specifying how long the transition should take. Can be a Duration instance or a user-friendly duration string like `"1m17s"`.
         */
        async set(sceneId, dimmingDuration) {
            this.assertSupportsCommand(SceneActivationCommand, SceneActivationCommand.Set);
            const cc = new SceneActivationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                sceneId,
                dimmingDuration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return SceneActivationCCAPI = _classThis;
})();
export { SceneActivationCCAPI };
let SceneActivationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Scene Activation"]), implementedVersion(1), ccValues(SceneActivationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var SceneActivationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActivationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SceneActivationCC = _classThis;
})();
export { SceneActivationCC };
let SceneActivationCCSet = (() => {
    let _classDecorators = [CCCommand(SceneActivationCommand.Set), useSupervision(), ccValueProperty("sceneId", SceneActivationCCValues.sceneId), ccValueProperty("dimmingDuration", SceneActivationCCValues.dimmingDuration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SceneActivationCC;
    var SceneActivationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SceneActivationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sceneId = options.sceneId;
            this.dimmingDuration = Duration.from(options.dimmingDuration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const sceneId = raw.payload[0];
            validatePayload(sceneId >= 1, sceneId <= 255);
            // Per the specs, dimmingDuration is required, but as always the real world is different...
            let dimmingDuration;
            if (raw.payload.length >= 2) {
                dimmingDuration = Duration.parseSet(raw.payload[1]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sceneId,
                dimmingDuration,
            });
        }
        sceneId;
        dimmingDuration;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.sceneId,
                this.dimmingDuration?.serializeSet() ?? 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = { "scene id": this.sceneId };
            if (this.dimmingDuration != undefined) {
                message["dimming duration"] = this.dimmingDuration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return SceneActivationCCSet = _classThis;
})();
export { SceneActivationCCSet };
//# sourceMappingURL=SceneActivationCC.js.map