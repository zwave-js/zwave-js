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
import { CommandClasses, TransmitOptions, validatePayload, } from "@zwave-js/core";
import { CCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { DeviceResetLocallyCommand } from "../lib/_Types.js";
// @noInterview: There is no interview procedure
let DeviceResetLocallyCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Device Reset Locally"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    var DeviceResetLocallyCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DeviceResetLocallyCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case DeviceResetLocallyCommand.Notification:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        async sendNotification() {
            this.assertSupportsCommand(DeviceResetLocallyCommand, DeviceResetLocallyCommand.Notification);
            const cc = new DeviceResetLocallyCCNotification({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            try {
                // This command is sent immediately before a hard reset of the controller.
                // If we don't wait for a callback (ack), the controller locks up when hard-resetting.
                await this.host.sendCommand(cc, {
                    ...this.commandOptions,
                    // Do not fall back to explorer frames
                    transmitOptions: TransmitOptions.ACK
                        | TransmitOptions.AutoRoute,
                    // Only try sending once
                    maxSendAttempts: 1,
                    // We don't want failures causing us to treat the node as asleep or dead
                    changeNodeStatusOnMissingACK: false,
                });
            }
            catch {
                // Don't care
            }
        }
    };
    return DeviceResetLocallyCCAPI = _classThis;
})();
export { DeviceResetLocallyCCAPI };
let DeviceResetLocallyCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Device Reset Locally"]), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var DeviceResetLocallyCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DeviceResetLocallyCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DeviceResetLocallyCC = _classThis;
})();
export { DeviceResetLocallyCC };
let DeviceResetLocallyCCNotification = (() => {
    let _classDecorators = [CCCommand(DeviceResetLocallyCommand.Notification)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DeviceResetLocallyCC;
    var DeviceResetLocallyCCNotification = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DeviceResetLocallyCCNotification = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // @noLogEntry: This CC has no properties to log
        static from(raw, ctx) {
            // We need to make sure this doesn't get parsed accidentally, e.g. because of a bit flip
            // This CC has no payload
            validatePayload(raw.payload.length === 0);
            // The driver ensures before handling it that it is only received from the root device
            return new this({
                nodeId: ctx.sourceNodeId,
            });
        }
    };
    return DeviceResetLocallyCCNotification = _classThis;
})();
export { DeviceResetLocallyCCNotification };
//# sourceMappingURL=DeviceResetLocallyCC.js.map