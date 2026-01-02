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
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { ClockCommand, Weekday } from "../lib/_Types.js";
// @noSetValueAPI - This CC has no simple value to set
let ClockCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Clock)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var ClockCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClockCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ClockCommand.Get:
                    return this.isSinglecast();
                case ClockCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ClockCommand, ClockCommand.Get);
            const cc = new ClockCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["weekday", "hour", "minute"]);
            }
        }
        async set(hour, minute, weekday) {
            this.assertSupportsCommand(ClockCommand, ClockCommand.Set);
            const cc = new ClockCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                hour,
                minute,
                weekday: weekday ?? Weekday.Unknown,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ClockCCAPI = _classThis;
})();
export { ClockCCAPI };
let ClockCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Clock), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ClockCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClockCC = _classThis = _classDescriptor.value;
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
            const api = CCAPI.create(CommandClasses.Clock, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                message: "requesting current clock setting...",
                direction: "outbound",
            });
            const response = await api.get();
            if (response) {
                const logMessage = `received current clock setting: ${response.weekday !== Weekday.Unknown
                    ? Weekday[response.weekday] + ", "
                    : ""}${response.hour < 10 ? "0" : ""}${response.hour}:${response.minute < 10 ? "0" : ""}${response.minute}`;
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
    };
    return ClockCC = _classThis;
})();
export { ClockCC };
let ClockCCSet = (() => {
    let _classDecorators = [CCCommand(ClockCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClockCC;
    var ClockCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClockCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.weekday = options.weekday;
            this.hour = options.hour;
            this.minute = options.minute;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ClockCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        weekday;
        hour;
        minute;
        serialize(ctx) {
            this.payload = Bytes.from([
                ((this.weekday & 0b111) << 5) | (this.hour & 0b11111),
                this.minute,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "clock setting": `${getEnumMemberName(Weekday, this.weekday)}, ${this.hour.toString().padStart(2, "0")}:${this.minute.toString().padStart(2, "0")}`,
                },
            };
        }
    };
    return ClockCCSet = _classThis;
})();
export { ClockCCSet };
let ClockCCReport = (() => {
    let _classDecorators = [CCCommand(ClockCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClockCC;
    var ClockCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClockCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.weekday = options.weekday;
            this.hour = options.hour;
            this.minute = options.minute;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const weekday = raw.payload[0] >>> 5;
            const hour = raw.payload[0] & 0b11111;
            const minute = raw.payload[1];
            validatePayload(weekday <= Weekday.Sunday, hour <= 23, minute <= 59);
            return new this({
                nodeId: ctx.sourceNodeId,
                weekday,
                hour,
                minute,
            });
        }
        weekday;
        hour;
        minute;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "clock setting": `${getEnumMemberName(Weekday, this.weekday)}, ${this.hour.toString().padStart(2, "0")}:${this.minute.toString().padStart(2, "0")}`,
                },
            };
        }
    };
    return ClockCCReport = _classThis;
})();
export { ClockCCReport };
let ClockCCGet = (() => {
    let _classDecorators = [CCCommand(ClockCommand.Get), expectedCCResponse(ClockCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClockCC;
    var ClockCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClockCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ClockCCGet = _classThis;
})();
export { ClockCCGet };
//# sourceMappingURL=ClockCC.js.map