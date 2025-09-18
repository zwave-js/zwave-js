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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { clamp } from "alcalzone-shared/math";
import { CCAPI, POLL_VALUE, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { SoundSwitchCommand } from "../lib/_Types.js";
export const SoundSwitchCCValues = V.defineCCValues(CommandClasses["Sound Switch"], {
    ...V.staticProperty("volume", {
        ...ValueMetadata.UInt8,
        min: 0,
        max: 100,
        unit: "%",
        label: "Volume",
        allowManualEntry: true,
        states: {
            0: "default",
        },
    }),
    ...V.staticProperty("toneId", {
        ...ValueMetadata.UInt8,
        label: "Play Tone",
        valueChangeOptions: ["volume"],
    }),
    ...V.staticProperty("defaultVolume", {
        ...ValueMetadata.Number,
        min: 0,
        max: 100,
        unit: "%",
        label: "Default volume",
    }),
    ...V.staticProperty("defaultToneId", {
        ...ValueMetadata.Number,
        min: 1,
        max: 254,
        label: "Default tone ID",
    }),
});
let SoundSwitchCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Sound Switch"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _getToneInfo_decorators;
    let _setConfiguration_decorators;
    let _play_decorators;
    var SoundSwitchCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _getToneInfo_decorators, { kind: "method", name: "getToneInfo", static: false, private: false, access: { has: obj => "getToneInfo" in obj, get: obj => obj.getToneInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setConfiguration_decorators, { kind: "method", name: "setConfiguration", static: false, private: false, access: { has: obj => "setConfiguration" in obj, get: obj => obj.setConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _play_decorators, { kind: "method", name: "play", static: false, private: false, access: { has: obj => "play" in obj, get: obj => obj.play }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case SoundSwitchCommand.TonesNumberGet:
                case SoundSwitchCommand.ToneInfoGet:
                case SoundSwitchCommand.ConfigurationGet:
                case SoundSwitchCommand.TonePlayGet:
                    return this.isSinglecast();
                case SoundSwitchCommand.ConfigurationSet:
                case SoundSwitchCommand.TonePlaySet:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        async getToneCount() {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.TonesNumberGet);
            const cc = new SoundSwitchCCTonesNumberGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.toneCount;
        }
        async getToneInfo(toneId) {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.ToneInfoGet);
            const cc = new SoundSwitchCCToneInfoGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                toneId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response)
                return pick(response, ["duration", "name"]);
        }
        async setConfiguration(defaultToneId, defaultVolume) {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.ConfigurationSet);
            const cc = new SoundSwitchCCConfigurationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                defaultToneId,
                defaultVolume,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getConfiguration() {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.ConfigurationGet);
            const cc = new SoundSwitchCCConfigurationGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["defaultToneId", "defaultVolume"]);
            }
        }
        async play(toneId, volume) {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.TonePlaySet);
            if (toneId === 0) {
                throw new ZWaveError(`Tone ID must be > 0. Use stopPlaying to stop the tone.`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new SoundSwitchCCTonePlaySet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                toneId,
                volume,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async stopPlaying() {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.TonePlaySet);
            const cc = new SoundSwitchCCTonePlaySet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                toneId: 0x00,
                volume: 0x00,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getPlaying() {
            this.assertSupportsCommand(SoundSwitchCommand, SoundSwitchCommand.TonePlayGet);
            const cc = new SoundSwitchCCTonePlayGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["toneId", "volume"]);
            }
        }
        get [(_getToneInfo_decorators = [validateArgs()], _setConfiguration_decorators = [validateArgs()], _play_decorators = [validateArgs()], SET_VALUE)]() {
            return async function ({ property }, value, options) {
                if (property === "defaultToneId") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    return this.setConfiguration(value, 0xff);
                }
                else if (property === "defaultVolume") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    return this.setConfiguration(0x00, /* keep current tone */ value);
                }
                else if (property === "volume") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    // Allow playing a tone by first setting the volume, then the tone ID
                    this.tryGetValueDB()?.setValue(SoundSwitchCCValues.volume.endpoint(this.endpoint.index), value, { source: "driver", updateTimestamp: false });
                }
                else if (property === "toneId") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    let result;
                    if (value > 0) {
                        // Use provided volume or try to use the current volume if it exists
                        const volume = options?.volume !== undefined
                            ? options.volume
                            : this.tryGetValueDB()?.getValue(SoundSwitchCCValues.volume.endpoint(this.endpoint.index));
                        result = await this.play(value, volume);
                    }
                    else {
                        result = await this.stopPlaying();
                    }
                    if (this.isSinglecast()
                        && !supervisedCommandSucceeded(result)) {
                        // Verify the current value after a (short) delay, unless the command was supervised and successful
                        this.schedulePoll({ property }, value, {
                            transition: "fast",
                        });
                    }
                    return result;
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "defaultToneId":
                    case "defaultVolume":
                        return (await this.getConfiguration())?.[property];
                    case "toneId":
                    case "volume":
                        return (await this.getPlaying())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return SoundSwitchCCAPI = _classThis;
})();
export { SoundSwitchCCAPI };
let SoundSwitchCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Sound Switch"]), implementedVersion(2), ccValues(SoundSwitchCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var SoundSwitchCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Sound Switch"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                message: "requesting tone count...",
                direction: "outbound",
            });
            const toneCount = await api.getToneCount();
            if (toneCount != undefined) {
                const logMessage = `supports ${toneCount} tones`;
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying tone count timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            ctx.logNode(node.id, {
                message: "requesting current sound configuration...",
                direction: "outbound",
            });
            const config = await api.getConfiguration();
            if (config) {
                const logMessage = `received current sound configuration:
default tone ID: ${config.defaultToneId}
default volume: ${config.defaultVolume}`;
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
            }
            const metadataStates = {};
            for (let toneId = 1; toneId <= toneCount; toneId++) {
                ctx.logNode(node.id, {
                    message: `requesting info for tone #${toneId}`,
                    direction: "outbound",
                });
                const info = await api.getToneInfo(toneId);
                if (!info)
                    continue;
                const logMessage = `received info for tone #${toneId}:
name:     ${info.name}
duration: ${info.duration} seconds`;
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
                metadataStates[toneId] = `${info.name} (${info.duration} sec)`;
            }
            // Remember tone count and info on the default tone ID metadata
            this.setMetadata(ctx, SoundSwitchCCValues.defaultToneId, {
                ...SoundSwitchCCValues.defaultToneId.meta,
                min: 1,
                max: toneCount,
                states: metadataStates,
            });
            // Remember tone count and info on the tone ID metadata
            this.setMetadata(ctx, SoundSwitchCCValues.toneId, {
                ...SoundSwitchCCValues.toneId.meta,
                min: 0,
                max: toneCount,
                states: {
                    0: "off",
                    ...metadataStates,
                    [0xff]: "default",
                },
            });
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return SoundSwitchCC = _classThis;
})();
export { SoundSwitchCC };
let SoundSwitchCCTonesNumberReport = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.TonesNumberReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCTonesNumberReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCTonesNumberReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.toneCount = options.toneCount;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const toneCount = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                toneCount,
            });
        }
        toneCount;
        serialize(ctx) {
            this.payload = Bytes.from([this.toneCount]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "# of tones": this.toneCount },
            };
        }
    };
    return SoundSwitchCCTonesNumberReport = _classThis;
})();
export { SoundSwitchCCTonesNumberReport };
let SoundSwitchCCTonesNumberGet = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.TonesNumberGet), expectedCCResponse(SoundSwitchCCTonesNumberReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCTonesNumberGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCTonesNumberGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SoundSwitchCCTonesNumberGet = _classThis;
})();
export { SoundSwitchCCTonesNumberGet };
let SoundSwitchCCToneInfoReport = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.ToneInfoReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCToneInfoReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCToneInfoReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.toneId = options.toneId;
            this.duration = options.duration;
            this.name = options.name;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const toneId = raw.payload[0];
            const duration = raw.payload.readUInt16BE(1);
            const nameLength = raw.payload[3];
            validatePayload(raw.payload.length >= 4 + nameLength);
            const name = raw.payload.subarray(4, 4 + nameLength).toString("utf8");
            return new this({
                nodeId: ctx.sourceNodeId,
                toneId,
                duration,
                name,
            });
        }
        toneId;
        duration;
        name;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.toneId, 0, 0, this.name.length]),
                Bytes.from(this.name, "utf8"),
            ]);
            this.payload.writeUInt16BE(this.duration, 1);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "tone id": this.toneId,
                    duration: `${this.duration} seconds`,
                    name: this.name,
                },
            };
        }
    };
    return SoundSwitchCCToneInfoReport = _classThis;
})();
export { SoundSwitchCCToneInfoReport };
const testResponseForSoundSwitchToneInfoGet = (sent, received) => {
    return received.toneId === sent.toneId;
};
let SoundSwitchCCToneInfoGet = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.ToneInfoGet), expectedCCResponse(SoundSwitchCCToneInfoReport, testResponseForSoundSwitchToneInfoGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCToneInfoGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCToneInfoGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.toneId = options.toneId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const toneId = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                toneId,
            });
        }
        toneId;
        serialize(ctx) {
            this.payload = Bytes.from([this.toneId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "tone id": this.toneId },
            };
        }
    };
    return SoundSwitchCCToneInfoGet = _classThis;
})();
export { SoundSwitchCCToneInfoGet };
let SoundSwitchCCConfigurationSet = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.ConfigurationSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCConfigurationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCConfigurationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.defaultVolume = options.defaultVolume;
            this.defaultToneId = options.defaultToneId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const defaultVolume = raw.payload[0];
            const defaultToneId = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                defaultVolume,
                defaultToneId,
            });
        }
        defaultVolume;
        defaultToneId;
        serialize(ctx) {
            this.payload = Bytes.from([this.defaultVolume, this.defaultToneId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "default volume": `${this.defaultVolume} %`,
                    "default tone id": this.defaultToneId,
                },
            };
        }
    };
    return SoundSwitchCCConfigurationSet = _classThis;
})();
export { SoundSwitchCCConfigurationSet };
let SoundSwitchCCConfigurationReport = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.ConfigurationReport), ccValueProperty("defaultVolume", SoundSwitchCCValues.defaultVolume), ccValueProperty("defaultToneId", SoundSwitchCCValues.defaultToneId)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCConfigurationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCConfigurationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.defaultVolume = options.defaultVolume;
            this.defaultToneId = options.defaultToneId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const defaultVolume = clamp(raw.payload[0], 0, 100);
            const defaultToneId = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                defaultVolume,
                defaultToneId,
            });
        }
        defaultVolume;
        defaultToneId;
        serialize(ctx) {
            this.payload = Bytes.from([this.defaultVolume, this.defaultToneId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "default volume": `${this.defaultVolume} %`,
                    "default tone id": this.defaultToneId,
                },
            };
        }
    };
    return SoundSwitchCCConfigurationReport = _classThis;
})();
export { SoundSwitchCCConfigurationReport };
let SoundSwitchCCConfigurationGet = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.ConfigurationGet), expectedCCResponse(SoundSwitchCCConfigurationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCConfigurationGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCConfigurationGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SoundSwitchCCConfigurationGet = _classThis;
})();
export { SoundSwitchCCConfigurationGet };
let SoundSwitchCCTonePlaySet = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.TonePlaySet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCTonePlaySet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCTonePlaySet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.toneId = options.toneId;
            this.volume = options.volume;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const toneId = raw.payload[0];
            let volume;
            if (toneId !== 0 && raw.payload.length >= 2) {
                volume = raw.payload[1];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                toneId,
                volume,
            });
        }
        toneId;
        volume;
        serialize(ctx) {
            this.payload = Bytes.from([this.toneId, this.volume ?? 0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "tone id": this.toneId,
            };
            if (this.volume != undefined) {
                message.volume = this.volume === 0 ? "default" : `${this.volume} %`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return SoundSwitchCCTonePlaySet = _classThis;
})();
export { SoundSwitchCCTonePlaySet };
let SoundSwitchCCTonePlayReport = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.TonePlayReport), ccValueProperty("toneId", SoundSwitchCCValues.toneId), ccValueProperty("volume", SoundSwitchCCValues.volume)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCTonePlayReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCTonePlayReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.toneId = options.toneId;
            this.volume = options.volume;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const toneId = raw.payload[0];
            let volume;
            if (toneId !== 0 && raw.payload.length >= 2) {
                volume = raw.payload[1];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                toneId,
                volume,
            });
        }
        toneId;
        volume;
        serialize(ctx) {
            this.payload = Bytes.from([this.toneId, this.volume ?? 0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "tone id": this.toneId,
            };
            if (this.volume != undefined) {
                message.volume = this.volume === 0 ? "default" : `${this.volume} %`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return SoundSwitchCCTonePlayReport = _classThis;
})();
export { SoundSwitchCCTonePlayReport };
let SoundSwitchCCTonePlayGet = (() => {
    let _classDecorators = [CCCommand(SoundSwitchCommand.TonePlayGet), expectedCCResponse(SoundSwitchCCTonePlayReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SoundSwitchCC;
    var SoundSwitchCCTonePlayGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SoundSwitchCCTonePlayGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SoundSwitchCCTonePlayGet = _classThis;
})();
export { SoundSwitchCCTonePlayGet };
//# sourceMappingURL=SoundSwitchCC.js.map