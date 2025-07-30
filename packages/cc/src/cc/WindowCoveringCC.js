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
import { CommandClasses, Duration, MessagePriority, ValueMetadata, encodeBitMask, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, SET_VALUE, SET_VALUE_HOOKS, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { windowCoveringParameterToLevelChangeLabel, windowCoveringParameterToMetadataStates, } from "../lib/CCValueUtils.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { WindowCoveringCommand, WindowCoveringParameter, } from "../lib/_Types.js";
export const WindowCoveringCCValues = V.defineCCValues(CommandClasses["Window Covering"], {
    ...V.staticProperty("supportedParameters", undefined, // meta
    { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("currentValue", "currentValue", (parameter) => parameter, ({ property, propertyKey }) => property === "currentValue" && typeof propertyKey === "number", (parameter) => {
        return {
            ...ValueMetadata.ReadOnlyLevel,
            label: `Current value - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
            states: windowCoveringParameterToMetadataStates(parameter),
            ccSpecific: { parameter },
        };
    }),
    ...V.dynamicPropertyAndKeyWithName("targetValue", "targetValue", (parameter) => parameter, ({ property, propertyKey }) => property === "targetValue" && typeof propertyKey === "number", (parameter) => {
        // Only odd-numbered parameters have position support and are writable
        const writeable = parameter % 2 === 1;
        return {
            ...ValueMetadata.Level,
            label: `Target value - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
            // Only odd-numbered parameters have position support and are writable
            writeable: parameter % 2 === 1,
            states: windowCoveringParameterToMetadataStates(parameter),
            allowManualEntry: writeable,
            ccSpecific: { parameter },
            valueChangeOptions: ["transitionDuration"],
        };
    }),
    ...V.dynamicPropertyAndKeyWithName("duration", "duration", (parameter) => parameter, ({ property, propertyKey }) => property === "duration" && typeof propertyKey === "number", (parameter) => ({
        ...ValueMetadata.ReadOnlyDuration,
        label: `Remaining duration - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
        ccSpecific: {
            parameter,
        },
    })),
    ...V.dynamicPropertyAndKeyWithName("levelChangeUp", 
    // The direction refers to the change in level, not the physical location
    "levelChangeUp", (parameter) => parameter, ({ property, propertyKey }) => property === "levelChangeUp" && typeof propertyKey === "number", (parameter) => {
        return {
            ...ValueMetadata.WriteOnlyBoolean,
            label: `${windowCoveringParameterToLevelChangeLabel(parameter, "up")} - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
            valueChangeOptions: ["transitionDuration"],
            states: {
                true: "Start",
                false: "Stop",
            },
            ccSpecific: { parameter },
        };
    }),
    ...V.dynamicPropertyAndKeyWithName("levelChangeDown", 
    // The direction refers to the change in level, not the physical location
    "levelChangeDown", (parameter) => parameter, ({ property, propertyKey }) => property === "levelChangeDown"
        && typeof propertyKey === "number", (parameter) => {
        return {
            ...ValueMetadata.WriteOnlyBoolean,
            label: `${windowCoveringParameterToLevelChangeLabel(parameter, "down")} - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
            valueChangeOptions: ["transitionDuration"],
            states: {
                true: "Start",
                false: "Stop",
            },
            ccSpecific: { parameter },
        };
    }),
});
let WindowCoveringCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Window Covering"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _set_decorators;
    let _startLevelChange_decorators;
    let _stopLevelChange_decorators;
    var WindowCoveringCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs({ strictEnums: true })];
            _set_decorators = [validateArgs()];
            _startLevelChange_decorators = [validateArgs({ strictEnums: true })];
            _stopLevelChange_decorators = [validateArgs({ strictEnums: true })];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startLevelChange_decorators, { kind: "method", name: "startLevelChange", static: false, private: false, access: { has: obj => "startLevelChange" in obj, get: obj => obj.startLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _stopLevelChange_decorators, { kind: "method", name: "stopLevelChange", static: false, private: false, access: { has: obj => "stopLevelChange" in obj, get: obj => obj.stopLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case WindowCoveringCommand.Get:
                case WindowCoveringCommand.Set:
                case WindowCoveringCommand.SupportedGet:
                case WindowCoveringCommand.StartLevelChange:
                case WindowCoveringCommand.StopLevelChange:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property, propertyKey }, value, options) {
                const valueId = {
                    commandClass: this.ccId,
                    property,
                    propertyKey,
                };
                if (WindowCoveringCCValues.targetValue.is(valueId)) {
                    if (typeof propertyKey !== "number"
                        // Only odd-numbered parameters have position support and are writable
                        || propertyKey % 2 === 0) {
                        throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                    }
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    const parameter = propertyKey;
                    const duration = Duration.from(options?.transitionDuration);
                    return this.set([{ parameter, value }], duration);
                }
                else if (WindowCoveringCCValues.levelChangeUp.is(valueId)
                    || WindowCoveringCCValues.levelChangeDown.is(valueId)) {
                    if (typeof value !== "boolean") {
                        throwWrongValueType(this.ccId, property, "boolean", typeof value);
                    }
                    const parameter = propertyKey;
                    const direction = WindowCoveringCCValues.levelChangeUp.is(valueId)
                        ? "up"
                        : "down";
                    if (value) {
                        // Perform the level change
                        const duration = Duration.from(options?.transitionDuration);
                        return this.startLevelChange(parameter, direction, duration);
                    }
                    else {
                        return this.stopLevelChange(parameter);
                    }
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        [SET_VALUE_HOOKS] = (__runInitializers(this, _instanceExtraInitializers), ({ property, propertyKey }, value, options) => {
            const valueId = {
                commandClass: this.ccId,
                property,
                propertyKey,
            };
            if (WindowCoveringCCValues.targetValue.is(valueId)) {
                if (typeof propertyKey !== "number")
                    return;
                const parameter = propertyKey;
                const duration = Duration.from(options?.transitionDuration);
                const currentValueValueId = WindowCoveringCCValues.currentValue(parameter).endpoint(this.endpoint.index);
                return {
                    // Window Covering commands may take some time to be executed.
                    // Therefore we try to supervise the command execution and delay the
                    // optimistic update until the final result is received.
                    supervisionDelayedUpdates: true,
                    supervisionOnSuccess: async () => {
                        // Only update currentValue for valid target values
                        if (typeof value === "number"
                            && value >= 0
                            && value <= 99) {
                            this.tryGetValueDB()?.setValue(currentValueValueId, value);
                        }
                        else if (value === 255) {
                            // We don't know the status now, so refresh the current value
                            try {
                                await this.get(parameter);
                            }
                            catch {
                                // ignore
                            }
                        }
                    },
                    supervisionOnFailure: async () => {
                        // The transition failed, so now we don't know the status - refresh the current value
                        try {
                            await this.get(parameter);
                        }
                        catch {
                            // ignore
                        }
                    },
                    optimisticallyUpdateRelatedValues: (_supervisedAndSuccessful) => {
                        // Only update currentValue for valid target values
                        if (typeof value === "number"
                            && value >= 0
                            && value <= 99) {
                            if (this.isSinglecast()) {
                                this.tryGetValueDB()?.setValue(currentValueValueId, value);
                            }
                            else if (this.isMulticast()) {
                                // Figure out which nodes were affected by this command
                                const affectedNodes = this.endpoint.node
                                    .physicalNodes.filter((node) => node
                                    .getEndpoint(this.endpoint.index)
                                    ?.supportsCC(this.ccId));
                                // and optimistically update the currentValue
                                for (const node of affectedNodes) {
                                    this.host
                                        .tryGetValueDB(node.id)
                                        ?.setValue(currentValueValueId, value);
                                }
                            }
                        }
                    },
                    verifyChanges: () => {
                        if (this.isSinglecast()) {
                            // We query currentValue instead of targetValue to make sure that unsolicited updates cancel the scheduled poll
                            this.schedulePoll(currentValueValueId, value, {
                                duration,
                            });
                        }
                        else {
                            // For multicasts, do not schedule a refresh - this could cause a LOT of traffic
                        }
                    },
                };
            }
        });
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "currentValue":
                    case "targetValue":
                    case "duration":
                        if (propertyKey == undefined) {
                            throwMissingPropertyKey(this.ccId, property);
                        }
                        else if (typeof propertyKey !== "number") {
                            throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                        }
                        return (await this.get(propertyKey))?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async getSupported() {
            this.assertSupportsCommand(WindowCoveringCommand, WindowCoveringCommand.SupportedGet);
            const cc = new WindowCoveringCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedParameters;
        }
        async get(parameter) {
            this.assertSupportsCommand(WindowCoveringCommand, WindowCoveringCommand.Get);
            const cc = new WindowCoveringCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["currentValue", "targetValue", "duration"]);
            }
        }
        async set(targetValues, duration) {
            this.assertSupportsCommand(WindowCoveringCommand, WindowCoveringCommand.StartLevelChange);
            const cc = new WindowCoveringCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                targetValues,
                duration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async startLevelChange(parameter, direction, duration) {
            this.assertSupportsCommand(WindowCoveringCommand, WindowCoveringCommand.StartLevelChange);
            const cc = new WindowCoveringCCStartLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
                direction,
                duration,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async stopLevelChange(parameter) {
            this.assertSupportsCommand(WindowCoveringCommand, WindowCoveringCommand.StopLevelChange);
            const cc = new WindowCoveringCCStopLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                parameter,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
    };
    return WindowCoveringCCAPI = _classThis;
})();
export { WindowCoveringCCAPI };
let WindowCoveringCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Window Covering"]), implementedVersion(1), ccValues(WindowCoveringCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var WindowCoveringCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Window Covering"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying supported window covering parameters...",
                direction: "outbound",
            });
            const supported = await api.getSupported();
            if (supported?.length) {
                const logMessage = `supported window covering parameters:
${supported
                    .map((p) => `· ${getEnumMemberName(WindowCoveringParameter, p)}`)
                    .join("\n")}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
                // Create metadata for all supported parameters
                for (const param of supported) {
                    // Default values
                    this.setMetadata(ctx, WindowCoveringCCValues.currentValue(param));
                    this.setMetadata(ctx, WindowCoveringCCValues.targetValue(param));
                    this.setMetadata(ctx, WindowCoveringCCValues.duration(param));
                    // Level change values
                    this.setMetadata(ctx, WindowCoveringCCValues.levelChangeUp(param));
                    this.setMetadata(ctx, WindowCoveringCCValues.levelChangeDown(param));
                    // And for the odd parameters (with position support), query the position
                    if (param % 2 === 1) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `querying position for parameter ${getEnumMemberName(WindowCoveringParameter, param)}...`,
                            direction: "outbound",
                        });
                        await api.get(param);
                    }
                }
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        translatePropertyKey(ctx, property, propertyKey) {
            if (typeof propertyKey === "number") {
                return getEnumMemberName(WindowCoveringParameter, propertyKey);
            }
            return super.translatePropertyKey(ctx, property, propertyKey);
        }
    };
    return WindowCoveringCC = _classThis;
})();
export { WindowCoveringCC };
let WindowCoveringCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.SupportedReport), ccValueProperty("supportedParameters", WindowCoveringCCValues.supportedParameters)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedParameters = options.supportedParameters;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const numBitmaskBytes = raw.payload[0] & 0b1111;
            validatePayload(raw.payload.length >= 1 + numBitmaskBytes);
            const bitmask = raw.payload.subarray(1, 1 + numBitmaskBytes);
            const supportedParameters = parseBitMask(bitmask, WindowCoveringParameter["Outbound Left (no position)"]);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedParameters,
            });
        }
        supportedParameters;
        serialize(ctx) {
            const bitmask = encodeBitMask(this.supportedParameters, undefined, WindowCoveringParameter["Outbound Left (no position)"]).subarray(0, 15);
            const numBitmaskBytes = bitmask.length & 0b1111;
            this.payload = Bytes.concat([
                Bytes.from([numBitmaskBytes]),
                bitmask.subarray(0, numBitmaskBytes),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported parameters": this.supportedParameters
                        .map((p) => `\n· ${getEnumMemberName(WindowCoveringParameter, p)}`)
                        .join(""),
                },
            };
        }
    };
    return WindowCoveringCCSupportedReport = _classThis;
})();
export { WindowCoveringCCSupportedReport };
let WindowCoveringCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.SupportedGet), expectedCCResponse(WindowCoveringCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return WindowCoveringCCSupportedGet = _classThis;
})();
export { WindowCoveringCCSupportedGet };
let WindowCoveringCCReport = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.Report), ccValueProperty("currentValue", WindowCoveringCCValues.currentValue, (self) => [self.parameter]), ccValueProperty("targetValue", WindowCoveringCCValues.targetValue, (self) => [self.parameter]), ccValueProperty("duration", WindowCoveringCCValues.duration, (self) => [self.parameter])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.parameter = options.parameter;
            this.currentValue = options.currentValue;
            this.targetValue = options.targetValue;
            this.duration = options.duration;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const parameter = raw.payload[0];
            const currentValue = raw.payload[1];
            const targetValue = raw.payload[2];
            const duration = Duration.parseReport(raw.payload[3])
                ?? Duration.unknown();
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
                currentValue,
                targetValue,
                duration,
            });
        }
        parameter;
        currentValue;
        targetValue;
        duration;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    parameter: getEnumMemberName(WindowCoveringParameter, this.parameter),
                    "current value": this.currentValue,
                    "target value": this.targetValue,
                    duration: this.duration.toString(),
                },
            };
        }
    };
    return WindowCoveringCCReport = _classThis;
})();
export { WindowCoveringCCReport };
function testResponseForWindowCoveringGet(sent, received) {
    return received.parameter === sent.parameter;
}
let WindowCoveringCCGet = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.Get), expectedCCResponse(WindowCoveringCCReport, testResponseForWindowCoveringGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const parameter = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        serialize(ctx) {
            this.payload = Bytes.from([this.parameter]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    parameter: getEnumMemberName(WindowCoveringParameter, this.parameter),
                },
            };
        }
    };
    return WindowCoveringCCGet = _classThis;
})();
export { WindowCoveringCCGet };
let WindowCoveringCCSet = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.targetValues = options.targetValues;
            this.duration = Duration.from(options.duration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const numEntries = raw.payload[0] & 0b11111;
            validatePayload(raw.payload.length >= 1 + numEntries * 2);
            const targetValues = [];
            for (let i = 0; i < numEntries; i++) {
                const offset = 1 + i * 2;
                targetValues.push({
                    parameter: raw.payload[offset],
                    value: raw.payload[offset + 1],
                });
            }
            let duration;
            if (raw.payload.length >= 2 + numEntries * 2) {
                duration = Duration.parseSet(raw.payload[1 + numEntries * 2]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                targetValues,
                duration,
            });
        }
        targetValues;
        duration;
        serialize(ctx) {
            const numEntries = this.targetValues.length & 0b11111;
            this.payload = new Bytes(2 + numEntries * 2);
            this.payload[0] = numEntries;
            for (let i = 0; i < numEntries; i++) {
                const offset = 1 + i * 2;
                this.payload[offset] = this.targetValues[i].parameter;
                this.payload[offset + 1] = this.targetValues[i].value;
            }
            this.payload[this.payload.length - 1] = (this.duration ?? Duration.default()).serializeSet();
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            for (const { parameter, value } of this.targetValues) {
                message[getEnumMemberName(WindowCoveringParameter, parameter)] =
                    value;
            }
            if (this.duration) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return WindowCoveringCCSet = _classThis;
})();
export { WindowCoveringCCSet };
let WindowCoveringCCStartLevelChange = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.StartLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCStartLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCStartLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
            this.direction = options.direction;
            this.duration = Duration.from(options.duration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const direction = !!(raw.payload[0] & 0b0100_0000)
                ? "down"
                : "up";
            const parameter = raw.payload[1];
            let duration;
            if (raw.payload.length >= 3) {
                duration = Duration.parseSet(raw.payload[2]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                direction,
                parameter,
                duration,
            });
        }
        parameter;
        direction;
        duration;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.direction === "down" ? 0b0100_0000 : 0b0000_0000,
                this.parameter,
                (this.duration ?? Duration.default()).serializeSet(),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                parameter: getEnumMemberName(WindowCoveringParameter, this.parameter),
                direction: this.direction,
            };
            if (this.duration) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return WindowCoveringCCStartLevelChange = _classThis;
})();
export { WindowCoveringCCStartLevelChange };
let WindowCoveringCCStopLevelChange = (() => {
    let _classDecorators = [CCCommand(WindowCoveringCommand.StopLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = WindowCoveringCC;
    var WindowCoveringCCStopLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WindowCoveringCCStopLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.parameter = options.parameter;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const parameter = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                parameter,
            });
        }
        parameter;
        serialize(ctx) {
            this.payload = Bytes.from([this.parameter]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    parameter: getEnumMemberName(WindowCoveringParameter, this.parameter),
                },
            };
        }
    };
    return WindowCoveringCCStopLevelChange = _classThis;
})();
export { WindowCoveringCCStopLevelChange };
//# sourceMappingURL=WindowCoveringCC.js.map