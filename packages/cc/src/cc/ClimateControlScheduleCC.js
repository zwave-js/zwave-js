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
import { CommandClasses, ValueMetadata, ZWaveError, ZWaveErrorCodes, enumValuesToMetadataStates, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ClimateControlScheduleCommand, ScheduleOverrideType, Weekday, } from "../lib/_Types.js";
import { decodeSetbackState, decodeSwitchpoint, encodeSetbackState, encodeSwitchpoint, } from "../lib/serializers.js";
export const ClimateControlScheduleCCValues = V.defineCCValues(CommandClasses["Climate Control Schedule"], {
    ...V.staticProperty("overrideType", {
        ...ValueMetadata.Number,
        label: "Override type",
        states: enumValuesToMetadataStates(ScheduleOverrideType),
    }),
    ...V.staticProperty("overrideState", {
        ...ValueMetadata.Number,
        label: "Override state",
        min: -12.8,
    }),
    ...V.dynamicPropertyAndKeyWithName("schedule", "schedule", (weekday) => weekday, ({ property, propertyKey }) => property === "switchPoints"
        && typeof propertyKey === "number"
        && propertyKey >= Weekday.Monday
        && propertyKey <= Weekday.Sunday, (weekday) => ({
        ...ValueMetadata.Any,
        label: `Schedule (${getEnumMemberName(Weekday, weekday)})`,
    })),
});
let ClimateControlScheduleCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Climate Control Schedule"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    let _get_decorators;
    let _setOverride_decorators;
    var ClimateControlScheduleCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs({ strictEnums: true })];
            _get_decorators = [validateArgs({ strictEnums: true })];
            _setOverride_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setOverride_decorators, { kind: "method", name: "setOverride", static: false, private: false, access: { has: obj => "setOverride" in obj, get: obj => obj.setOverride }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ClimateControlScheduleCommand.Set:
                case ClimateControlScheduleCommand.OverrideSet:
                    return true; // mandatory
                case ClimateControlScheduleCommand.Get:
                case ClimateControlScheduleCommand.ChangedGet:
                case ClimateControlScheduleCommand.OverrideGet:
                    return this.isSinglecast();
            }
            return super.supportsCommand(cmd);
        }
        async set(weekday, switchPoints) {
            this.assertSupportsCommand(ClimateControlScheduleCommand, ClimateControlScheduleCommand.Set);
            const cc = new ClimateControlScheduleCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                weekday,
                switchPoints,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async get(weekday) {
            this.assertSupportsCommand(ClimateControlScheduleCommand, ClimateControlScheduleCommand.Get);
            const cc = new ClimateControlScheduleCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                weekday,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.schedule;
        }
        async getChangeCounter() {
            this.assertSupportsCommand(ClimateControlScheduleCommand, ClimateControlScheduleCommand.ChangedGet);
            const cc = new ClimateControlScheduleCCChangedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.changeCounter;
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getOverride() {
            this.assertSupportsCommand(ClimateControlScheduleCommand, ClimateControlScheduleCommand.OverrideGet);
            const cc = new ClimateControlScheduleCCOverrideGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    type: response.overrideType,
                    state: response.overrideState,
                };
            }
        }
        async setOverride(type, state) {
            this.assertSupportsCommand(ClimateControlScheduleCommand, ClimateControlScheduleCommand.OverrideSet);
            const cc = new ClimateControlScheduleCCOverrideSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                overrideType: type,
                overrideState: state,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ClimateControlScheduleCCAPI = _classThis;
})();
export { ClimateControlScheduleCCAPI };
let ClimateControlScheduleCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Climate Control Schedule"]), implementedVersion(1), ccValues(ClimateControlScheduleCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ClimateControlScheduleCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ClimateControlScheduleCC = _classThis;
})();
export { ClimateControlScheduleCC };
let ClimateControlScheduleCCSet = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.switchPoints = options.switchPoints;
            this.weekday = options.weekday;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ClimateControlScheduleCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        switchPoints;
        weekday;
        serialize(ctx) {
            // Make sure we have exactly 9 entries
            const allSwitchPoints = this.switchPoints.slice(0, 9); // maximum 9
            while (allSwitchPoints.length < 9) {
                allSwitchPoints.push({
                    hour: 0,
                    minute: 0,
                    state: "Unused",
                });
            }
            this.payload = Bytes.concat([
                Bytes.from([this.weekday & 0b111]),
                ...allSwitchPoints.map((sp) => encodeSwitchpoint(sp)),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    weekday: getEnumMemberName(Weekday, this.weekday),
                    switchpoints: `${this.switchPoints
                        .map((sp) => `
· ${sp.hour.toString().padStart(2, "0")}:${sp.minute.toString().padStart(2, "0")} --> ${sp.state}`)
                        .join("")}`,
                },
            };
        }
    };
    return ClimateControlScheduleCCSet = _classThis;
})();
export { ClimateControlScheduleCCSet };
let ClimateControlScheduleCCReport = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.Report), ccValueProperty("schedule", ClimateControlScheduleCCValues.schedule, (self) => [self.weekday])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.weekday = options.weekday;
            this.schedule = options.schedule;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 28);
            const weekday = raw.payload[0] & 0b111;
            const allSwitchpoints = [];
            for (let i = 0; i <= 8; i++) {
                allSwitchpoints.push(decodeSwitchpoint(raw.payload.subarray(1 + 3 * i)));
            }
            const schedule = allSwitchpoints.filter((sp) => sp.state !== "Unused");
            return new this({
                nodeId: ctx.sourceNodeId,
                weekday,
                schedule,
            });
        }
        weekday;
        schedule;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    weekday: getEnumMemberName(Weekday, this.weekday),
                    schedule: `${this.schedule
                        .map((sp) => `
· ${sp.hour.toString().padStart(2, "0")}:${sp.minute.toString().padStart(2, "0")} --> ${sp.state}`)
                        .join("")}`,
                },
            };
        }
    };
    return ClimateControlScheduleCCReport = _classThis;
})();
export { ClimateControlScheduleCCReport };
let ClimateControlScheduleCCGet = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.Get), expectedCCResponse(ClimateControlScheduleCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.weekday = options.weekday;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ClimateControlScheduleCCGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        weekday;
        serialize(ctx) {
            this.payload = Bytes.from([this.weekday & 0b111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { weekday: getEnumMemberName(Weekday, this.weekday) },
            };
        }
    };
    return ClimateControlScheduleCCGet = _classThis;
})();
export { ClimateControlScheduleCCGet };
let ClimateControlScheduleCCChangedReport = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.ChangedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCChangedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCChangedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.changeCounter = options.changeCounter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const changeCounter = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                changeCounter,
            });
        }
        changeCounter;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "change counter": this.changeCounter },
            };
        }
    };
    return ClimateControlScheduleCCChangedReport = _classThis;
})();
export { ClimateControlScheduleCCChangedReport };
let ClimateControlScheduleCCChangedGet = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.ChangedGet), expectedCCResponse(ClimateControlScheduleCCChangedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCChangedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCChangedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ClimateControlScheduleCCChangedGet = _classThis;
})();
export { ClimateControlScheduleCCChangedGet };
let ClimateControlScheduleCCOverrideReport = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.OverrideReport), ccValueProperty("overrideType", ClimateControlScheduleCCValues.overrideType), ccValueProperty("overrideState", ClimateControlScheduleCCValues.overrideState)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCOverrideReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCOverrideReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.overrideType = options.overrideType;
            this.overrideState = options.overrideState;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const overrideType = raw.payload[0] & 0b11;
            const overrideState = decodeSetbackState(raw.payload, 1)
                // If we receive an unknown setback state, return the raw value
                || raw.payload.readInt8(1);
            return new this({
                nodeId: ctx.sourceNodeId,
                overrideType,
                overrideState,
            });
        }
        overrideType;
        overrideState;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "override type": getEnumMemberName(ScheduleOverrideType, this.overrideType),
                    "override state": this.overrideState,
                },
            };
        }
    };
    return ClimateControlScheduleCCOverrideReport = _classThis;
})();
export { ClimateControlScheduleCCOverrideReport };
let ClimateControlScheduleCCOverrideGet = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.OverrideGet), expectedCCResponse(ClimateControlScheduleCCOverrideReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCOverrideGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCOverrideGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ClimateControlScheduleCCOverrideGet = _classThis;
})();
export { ClimateControlScheduleCCOverrideGet };
let ClimateControlScheduleCCOverrideSet = (() => {
    let _classDecorators = [CCCommand(ClimateControlScheduleCommand.OverrideSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClimateControlScheduleCC;
    var ClimateControlScheduleCCOverrideSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClimateControlScheduleCCOverrideSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.overrideType = options.overrideType;
            this.overrideState = options.overrideState;
        }
        static from(_raw, _ctx) {
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new ClimateControlScheduleCCOverrideSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        overrideType;
        overrideState;
        serialize(ctx) {
            this.payload = Bytes.concat([
                [this.overrideType & 0b11],
                encodeSetbackState(this.overrideState),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "override type": getEnumMemberName(ScheduleOverrideType, this.overrideType),
                    "override state": this.overrideState,
                },
            };
        }
    };
    return ClimateControlScheduleCCOverrideSet = _classThis;
})();
export { ClimateControlScheduleCCOverrideSet };
//# sourceMappingURL=ClimateControlScheduleCC.js.map