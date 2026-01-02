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
import { CommandClasses, Duration, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeBitMask, isUnsupervisedOrSucceeded, parseBitMask, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, isEnumMember, keysOf, pick, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { clamp } from "alcalzone-shared/math";
import { isObject } from "alcalzone-shared/typeguards";
import { CCAPI, POLL_VALUE, SET_VALUE, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ColorComponent, ColorComponentMap, ColorSwitchCommand, LevelChangeDirection, } from "../lib/_Types.js";
const hexColorRegex = /^#?(?<red>[0-9a-f]{2})(?<green>[0-9a-f]{2})(?<blue>[0-9a-f]{2})$/i;
const colorTableKeys = [
    ...keysOf(ColorComponent),
    ...keysOf(ColorComponentMap),
];
function colorTableKeyToComponent(key) {
    if (/^\d+$/.test(key)) {
        return parseInt(key, 10);
    }
    else if (key in ColorComponentMap) {
        return ColorComponentMap[key];
    }
    else if (key in ColorComponent) {
        return ColorComponent[key];
    }
    throw new ZWaveError(`Invalid color key ${key}!`, ZWaveErrorCodes.Argument_Invalid);
}
function colorComponentToTableKey(component) {
    for (const [key, comp] of Object.entries(ColorComponentMap)) {
        if (comp === component)
            return key;
    }
}
export const ColorSwitchCCValues = V.defineCCValues(CommandClasses["Color Switch"], {
    ...V.staticProperty("supportedColorComponents", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsHexColor", undefined, {
        internal: true,
    }),
    ...V.staticPropertyWithName("currentColor", "currentColor", {
        ...ValueMetadata.ReadOnly,
        label: `Current color`,
    }),
    ...V.staticPropertyWithName("targetColor", "targetColor", {
        ...ValueMetadata.Any,
        label: `Target color`,
        valueChangeOptions: ["transitionDuration"],
    }),
    ...V.staticProperty("duration", {
        ...ValueMetadata.ReadOnlyDuration,
        label: "Remaining duration",
    }),
    ...V.staticProperty("hexColor", {
        ...ValueMetadata.Color,
        minLength: 6,
        maxLength: 7, // to allow #rrggbb
        label: `RGB Color`,
        valueChangeOptions: ["transitionDuration"],
    }),
    ...V.dynamicPropertyAndKeyWithName("currentColorChannel", "currentColor", (component) => component, ({ property, propertyKey }) => property === "currentColor" && typeof propertyKey === "number", (component) => {
        const colorName = getEnumMemberName(ColorComponent, component);
        return {
            ...ValueMetadata.ReadOnlyUInt8,
            label: `Current value (${colorName})`,
            description: `The current value of the ${colorName} channel.`,
        };
    }),
    ...V.dynamicPropertyAndKeyWithName("targetColorChannel", "targetColor", (component) => component, ({ property, propertyKey }) => property === "targetColor" && typeof propertyKey === "number", (component) => {
        const colorName = getEnumMemberName(ColorComponent, component);
        return {
            ...ValueMetadata.UInt8,
            label: `Target value (${colorName})`,
            description: `The target value of the ${colorName} channel.`,
            valueChangeOptions: ["transitionDuration"],
        };
    }),
});
let ColorSwitchCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Color Switch"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _set_decorators;
    let _startLevelChange_decorators;
    let _stopLevelChange_decorators;
    var ColorSwitchCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startLevelChange_decorators, { kind: "method", name: "startLevelChange", static: false, private: false, access: { has: obj => "startLevelChange" in obj, get: obj => obj.startLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _stopLevelChange_decorators, { kind: "method", name: "stopLevelChange", static: false, private: false, access: { has: obj => "stopLevelChange" in obj, get: obj => obj.stopLevelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ColorSwitchCommand.SupportedGet:
                case ColorSwitchCommand.Get:
                    return this.isSinglecast();
                case ColorSwitchCommand.Set:
                case ColorSwitchCommand.StartLevelChange:
                case ColorSwitchCommand.StopLevelChange:
                    return true; // These are mandatory
            }
            return super.supportsCommand(cmd);
        }
        async getSupported() {
            this.assertSupportsCommand(ColorSwitchCommand, ColorSwitchCommand.SupportedGet);
            const cc = new ColorSwitchCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedColorComponents;
        }
        async get(component) {
            this.assertSupportsCommand(ColorSwitchCommand, ColorSwitchCommand.Get);
            const cc = new ColorSwitchCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                colorComponent: component,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["currentValue", "targetValue", "duration"]);
            }
        }
        async set(options) {
            this.assertSupportsCommand(ColorSwitchCommand, ColorSwitchCommand.Set);
            const cc = new ColorSwitchCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (isUnsupervisedOrSucceeded(result)) {
                // If the command did not fail, assume that it succeeded and update the values accordingly
                // TODO: The API methods should not modify the value DB directly, but to do so
                // this requires a nicer way of synchronizing hexColor with the others
                if (this.isSinglecast()) {
                    // Update each color component separately and record the changes to the compound value
                    this.updateCurrentColor(this.getValueDB(), cc.colorTable);
                }
                else if (this.isMulticast()) {
                    // Figure out which nodes were affected by this command
                    const affectedNodes = this.endpoint.node.physicalNodes.filter((node) => node
                        .getEndpoint(this.endpoint.index)
                        ?.supportsCC(this.ccId));
                    // and optimistically update the currentColor
                    for (const node of affectedNodes) {
                        const valueDB = this.host.tryGetValueDB(node.id);
                        if (valueDB) {
                            this.updateCurrentColor(valueDB, cc.colorTable);
                        }
                    }
                }
            }
            return result;
        }
        /** Updates the current color for a given node by merging in the given changes */
        updateCurrentColor(valueDB, colorTable) {
            let updatedRGB = false;
            const currentColorValueId = ColorSwitchCCValues.currentColor.endpoint(this.endpoint.index);
            const targetColorValueId = ColorSwitchCCValues.targetColor.endpoint(this.endpoint.index);
            const currentCompoundColor = valueDB.getValue(currentColorValueId) ?? {};
            const targetCompoundColor = valueDB.getValue(targetColorValueId) ?? {};
            for (const [key, value] of Object.entries(colorTable)) {
                const component = colorTableKeyToComponent(key);
                if (component === ColorComponent.Red
                    || component === ColorComponent.Green
                    || component === ColorComponent.Blue) {
                    updatedRGB = true;
                }
                valueDB.setValue(ColorSwitchCCValues.currentColorChannel(component).endpoint(this.endpoint.index), value);
                // Update the compound value
                if (key in ColorComponentMap) {
                    currentCompoundColor[key] = value;
                    targetCompoundColor[key] = value;
                }
            }
            // And store the updated compound values
            valueDB.setValue(currentColorValueId, currentCompoundColor);
            valueDB.setValue(targetColorValueId, targetCompoundColor);
            // and hex color if necessary
            const supportsHex = valueDB.getValue(ColorSwitchCCValues.supportsHexColor.endpoint(this.endpoint.index));
            if (supportsHex && updatedRGB) {
                const hexValueId = ColorSwitchCCValues.hexColor.endpoint(this.endpoint.index);
                const [r, g, b] = [
                    ColorComponent.Red,
                    ColorComponent.Green,
                    ColorComponent.Blue,
                ].map((c) => valueDB.getValue(ColorSwitchCCValues.currentColorChannel(c).endpoint(this.endpoint.index)) ?? 0);
                const hexValue = (r << 16) | (g << 8) | b;
                valueDB.setValue(hexValueId, hexValue.toString(16).padStart(6, "0"));
            }
        }
        async startLevelChange(options) {
            this.assertSupportsCommand(ColorSwitchCommand, ColorSwitchCommand.StartLevelChange);
            const cc = new ColorSwitchCCStartLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async stopLevelChange(colorComponent) {
            this.assertSupportsCommand(ColorSwitchCommand, ColorSwitchCommand.StopLevelChange);
            const cc = new ColorSwitchCCStopLevelChange({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                colorComponent,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        get [(_get_decorators = [validateArgs({ strictEnums: true })], _set_decorators = [validateArgs()], _startLevelChange_decorators = [validateArgs({ strictEnums: true })], _stopLevelChange_decorators = [validateArgs({ strictEnums: true })], SET_VALUE)]() {
            return async function ({ property, propertyKey }, value, options) {
                if (property === "targetColor") {
                    const duration = Duration.from(options?.transitionDuration);
                    if (propertyKey != undefined) {
                        // Single color component, only accepts numbers
                        if (typeof propertyKey !== "number") {
                            throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                        }
                        else if (typeof value !== "number") {
                            throwWrongValueType(this.ccId, property, "number", typeof value);
                        }
                        const result = await this.set({
                            [propertyKey]: value,
                            duration,
                        });
                        if (this.isSinglecast()
                            && !supervisedCommandSucceeded(result)) {
                            // Verify the current value after a (short) delay, unless the command was supervised and successful
                            this.schedulePoll({ property, propertyKey }, value, {
                                duration,
                                transition: "fast",
                            });
                        }
                        return result;
                    }
                    else {
                        // Set the compound color object
                        // Ensure the value is an object with only valid keys
                        if (!isObject(value)
                            || !Object.keys(value).every((key) => key in ColorComponentMap)) {
                            throw new ZWaveError(`${CommandClasses[this.ccId]}: "${property}" must be set to an object which specifies each color channel`, ZWaveErrorCodes.Argument_Invalid);
                        }
                        // Ensure that each property is numeric
                        for (const [key, val] of Object.entries(value)) {
                            if (typeof val !== "number") {
                                throwWrongValueType(this.ccId, `${property}.${key}`, "number", typeof val);
                            }
                        }
                        // GH#2527: strip unsupported color components, because some devices don't react otherwise
                        if (this.isSinglecast()) {
                            const supportedColors = this.tryGetValueDB()?.getValue(ColorSwitchCCValues.supportedColorComponents
                                .endpoint(this.endpoint.index));
                            if (supportedColors) {
                                value = pick(value, supportedColors
                                    .map((c) => colorComponentToTableKey(c))
                                    .filter((c) => !!c));
                            }
                        }
                        // Avoid sending empty commands
                        if (Object.keys(value).length === 0)
                            return;
                        return this.set({ ...value, duration });
                        // We're not going to poll each color component separately
                    }
                }
                else if (property === "hexColor") {
                    // No property key, this is the hex color #rrggbb
                    if (typeof value !== "string") {
                        throwWrongValueType(this.ccId, property, "string", typeof value);
                    }
                    const duration = Duration.from(options?.transitionDuration);
                    return this.set({ hexColor: value, duration });
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        isSetValueOptimistic(_valueId) {
            return false; // Color Switch CC handles updating the value DB itself
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                if (propertyKey == undefined) {
                    throwMissingPropertyKey(this.ccId, property);
                }
                else if (typeof propertyKey !== "number") {
                    throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                }
                switch (property) {
                    case "currentColor":
                        return (await this.get(propertyKey))?.currentValue;
                    case "targetColor":
                        return (await this.get(propertyKey))?.targetValue;
                    case "duration":
                        return (await this.get(propertyKey))?.duration;
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
    return ColorSwitchCCAPI = _classThis;
})();
export { ColorSwitchCCAPI };
let ColorSwitchCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Color Switch"]), implementedVersion(3), ccValues(ColorSwitchCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ColorSwitchCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Color Switch"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying supported colors...",
                direction: "outbound",
            });
            const supportedColors = await api.getSupported();
            if (!supportedColors) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying supported colors timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `received supported colors:${supportedColors
                    .map((c) => `\n· ${getEnumMemberName(ColorComponent, c)}`)
                    .join("")}`,
                direction: "outbound",
            });
            // Create metadata for the separate color channels
            for (const color of supportedColors) {
                const currentColorChannelValue = ColorSwitchCCValues
                    .currentColorChannel(color);
                this.setMetadata(ctx, currentColorChannelValue);
                const targetColorChannelValue = ColorSwitchCCValues
                    .targetColorChannel(color);
                this.setMetadata(ctx, targetColorChannelValue);
            }
            // And the compound one
            const currentColorValue = ColorSwitchCCValues.currentColor;
            this.setMetadata(ctx, currentColorValue);
            const targetColorValue = ColorSwitchCCValues.targetColor;
            this.setMetadata(ctx, targetColorValue);
            // Create the collective HEX color values
            const supportsHex = [
                ColorComponent.Red,
                ColorComponent.Green,
                ColorComponent.Blue,
            ].every((c) => supportedColors.includes(c));
            this.setValue(ctx, ColorSwitchCCValues.supportsHexColor, supportsHex);
            if (supportsHex) {
                const hexColorValue = ColorSwitchCCValues.hexColor;
                this.setMetadata(ctx, hexColorValue);
            }
            // Query all color components
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Color Switch"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const supportedColors = this.getValue(ctx, ColorSwitchCCValues.supportedColorComponents) ?? [];
            for (const color of supportedColors) {
                // Some devices report invalid colors, but the CC API checks
                // for valid values and throws otherwise.
                if (!isEnumMember(ColorComponent, color))
                    continue;
                const colorName = getEnumMemberName(ColorComponent, color);
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying current color state (${colorName})`,
                    direction: "outbound",
                });
                await api.get(color);
            }
        }
        translatePropertyKey(ctx, property, propertyKey) {
            if ((property === "currentColor" || property === "targetColor")
                && typeof propertyKey === "number") {
                const translated = ColorComponent[propertyKey];
                if (translated)
                    return translated;
            }
            return super.translatePropertyKey(ctx, property, propertyKey);
        }
    };
    return ColorSwitchCC = _classThis;
})();
export { ColorSwitchCC };
let ColorSwitchCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.SupportedReport), ccValueProperty("supportedColorComponents", ColorSwitchCCValues.supportedColorComponents)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedColorComponents = options.supportedColorComponents;
        }
        static from(raw, ctx) {
            // Docs say 'variable length', but the table shows 2 bytes.
            validatePayload(raw.payload.length >= 2);
            const supportedColorComponents = parseBitMask(raw.payload.subarray(0, 2), ColorComponent["Warm White"]);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedColorComponents,
            });
        }
        supportedColorComponents;
        serialize(ctx) {
            this.payload = encodeBitMask(this.supportedColorComponents, 15, // fixed 2 bytes
            ColorComponent["Warm White"]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supported color components": this.supportedColorComponents
                        .map((c) => `\n· ${getEnumMemberName(ColorComponent, c)}`)
                        .join(""),
                },
            };
        }
    };
    return ColorSwitchCCSupportedReport = _classThis;
})();
export { ColorSwitchCCSupportedReport };
let ColorSwitchCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.SupportedGet), expectedCCResponse(ColorSwitchCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ColorSwitchCCSupportedGet = _classThis;
})();
export { ColorSwitchCCSupportedGet };
let ColorSwitchCCReport = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.Report), ccValueProperty("currentValue", ColorSwitchCCValues.currentColorChannel, (self) => [self.colorComponent]), ccValueProperty("targetValue", ColorSwitchCCValues.targetColorChannel, (self) => [self.colorComponent]), ccValueProperty("duration", ColorSwitchCCValues.duration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.colorComponent = options.colorComponent;
            this.currentValue = options.currentValue;
            this.targetValue = options.targetValue;
            this.duration = Duration.from(options.duration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const colorComponent = raw.payload[0];
            const currentValue = raw.payload[1];
            let targetValue;
            let duration;
            if (raw.payload.length >= 4) {
                targetValue = raw.payload[2];
                duration = Duration.parseReport(raw.payload[3]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                colorComponent,
                currentValue,
                targetValue,
                duration,
            });
        }
        persistValues(ctx) {
            // Duration is stored globally instead of per component
            if (!super.persistValues(ctx))
                return false;
            // Update compound current value
            const colorTableKey = colorComponentToTableKey(this.colorComponent);
            if (colorTableKey) {
                const compoundCurrentColorValue = ColorSwitchCCValues.currentColor;
                const compoundCurrentColor = this.getValue(ctx, compoundCurrentColorValue) ?? {};
                compoundCurrentColor[colorTableKey] = this.currentValue;
                this.setValue(ctx, compoundCurrentColorValue, compoundCurrentColor);
                // and target value
                if (this.targetValue != undefined) {
                    const compoundTargetColorValue = ColorSwitchCCValues.targetColor;
                    const compoundTargetColor = this.getValue(ctx, compoundTargetColorValue) ?? {};
                    compoundTargetColor[colorTableKey] = this.targetValue;
                    this.setValue(ctx, compoundTargetColorValue, compoundTargetColor);
                }
            }
            // Update collective hex value if required
            const supportsHex = !!this.getValue(ctx, ColorSwitchCCValues.supportsHexColor);
            if (supportsHex
                && (this.colorComponent === ColorComponent.Red
                    || this.colorComponent === ColorComponent.Green
                    || this.colorComponent === ColorComponent.Blue)) {
                const hexColorValue = ColorSwitchCCValues.hexColor;
                const hexValue = this.getValue(ctx, hexColorValue)
                    ?? "000000";
                const byteOffset = ColorComponent.Blue - this.colorComponent;
                const byteMask = 0xff << (byteOffset * 8);
                let hexValueNumeric = parseInt(hexValue, 16);
                hexValueNumeric = (hexValueNumeric & ~byteMask)
                    | (this.currentValue << (byteOffset * 8));
                this.setValue(ctx, hexColorValue, hexValueNumeric.toString(16).padStart(6, "0"));
            }
            return true;
        }
        colorComponent;
        currentValue;
        targetValue;
        duration;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.colorComponent,
                this.currentValue,
            ]);
            if (this.targetValue != undefined && this.duration != undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([
                        this.targetValue ?? 0xfe,
                        (this.duration ?? Duration.default()).serializeReport(),
                    ]),
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "color component": getEnumMemberName(ColorComponent, this.colorComponent),
                "current value": this.currentValue,
            };
            if (this.targetValue != undefined) {
                message["target value"] = this.targetValue;
            }
            if (this.duration != undefined) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ColorSwitchCCReport = _classThis;
})();
export { ColorSwitchCCReport };
function testResponseForColorSwitchGet(sent, received) {
    return sent.colorComponent === received.colorComponent;
}
let ColorSwitchCCGet = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.Get), expectedCCResponse(ColorSwitchCCReport, testResponseForColorSwitchGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this._colorComponent = options.colorComponent;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const colorComponent = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                colorComponent,
            });
        }
        _colorComponent;
        get colorComponent() {
            return this._colorComponent;
        }
        set colorComponent(value) {
            if (!ColorComponent[value]) {
                throw new ZWaveError("colorComponent must be a valid color component index.", ZWaveErrorCodes.Argument_Invalid);
            }
            this._colorComponent = value;
        }
        serialize(ctx) {
            this.payload = Bytes.from([this._colorComponent]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "color component": getEnumMemberName(ColorComponent, this.colorComponent),
                },
            };
        }
    };
    return ColorSwitchCCGet = _classThis;
})();
export { ColorSwitchCCGet };
let ColorSwitchCCSet = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // Populate properties from options object
            if ("hexColor" in options) {
                const match = hexColorRegex.exec(options.hexColor);
                if (!match) {
                    throw new ZWaveError(`${options.hexColor} is not a valid HEX color string`, ZWaveErrorCodes.Argument_Invalid);
                }
                this.colorTable = {
                    red: parseInt(match.groups.red, 16),
                    green: parseInt(match.groups.green, 16),
                    blue: parseInt(match.groups.blue, 16),
                };
            }
            else {
                this.colorTable = pick(options, colorTableKeys);
            }
            this.duration = Duration.from(options.duration);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const populatedColorCount = raw.payload[0] & 0b11111;
            validatePayload(raw.payload.length >= 1 + populatedColorCount * 2);
            const colorTable = {};
            let offset = 1;
            for (let color = 0; color < populatedColorCount; color++) {
                const component = raw.payload[offset];
                const value = raw.payload[offset + 1];
                const key = colorComponentToTableKey(component);
                // @ts-expect-error
                if (key)
                    this.colorTable[key] = value;
                offset += 2;
            }
            let duration;
            if (raw.payload.length > offset) {
                duration = Duration.parseSet(raw.payload[offset]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                ...colorTable,
                duration,
            });
        }
        colorTable;
        duration;
        serialize(ctx) {
            const populatedColorCount = Object.keys(this.colorTable).length;
            this.payload = new Bytes(1 + populatedColorCount * 2 + 1);
            this.payload[0] = populatedColorCount & 0b11111;
            let i = 1;
            for (const [key, value] of Object.entries(this.colorTable)) {
                const component = colorTableKeyToComponent(key);
                this.payload[i] = component;
                this.payload[i + 1] = clamp(value, 0, 0xff);
                i += 2;
            }
            this.payload[i] = (this.duration ?? Duration.default()).serializeSet();
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 2 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1, omit the duration byte
                this.payload = this.payload.subarray(0, -1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            for (const [key, value] of Object.entries(this.colorTable)) {
                const realKey = key in ColorComponentMap
                    ? ColorComponent[ColorComponentMap[key]]
                    : ColorComponent[key];
                message[realKey] = value;
            }
            if (this.duration != undefined) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ColorSwitchCCSet = _classThis;
})();
export { ColorSwitchCCSet };
let ColorSwitchCCStartLevelChange = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.StartLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCStartLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCStartLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.duration = Duration.from(options.duration);
            this.ignoreStartLevel = options.ignoreStartLevel;
            this.startLevel = options.startLevel ?? 0;
            this.direction = options.direction;
            this.colorComponent = options.colorComponent;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const ignoreStartLevel = !!((raw.payload[0] & 0b0_0_1_00000) >>> 5);
            const direction = ((raw.payload[0] & 0b0_1_0_00000) >>> 6)
                ? "down"
                : "up";
            const colorComponent = raw.payload[1];
            const startLevel = raw.payload[2];
            let duration;
            if (raw.payload.length >= 4) {
                duration = Duration.parseSet(raw.payload[3]);
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                ignoreStartLevel,
                direction,
                colorComponent,
                startLevel,
                duration,
            });
        }
        duration;
        startLevel;
        ignoreStartLevel;
        direction;
        colorComponent;
        serialize(ctx) {
            const controlByte = (LevelChangeDirection[this.direction] << 6)
                | (this.ignoreStartLevel ? 0b0010_0000 : 0);
            this.payload = Bytes.from([
                controlByte,
                this.colorComponent,
                this.startLevel,
                (this.duration ?? Duration.default()).serializeSet(),
            ]);
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion < 3 && ctx.getDeviceConfig?.(this.nodeId)?.compat?.encodeCCsUsingTargetVersion) {
                // When forcing CC version 1 or 2, omit the duration byte
                this.payload = this.payload.subarray(0, -1);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "color component": getEnumMemberName(ColorComponent, this.colorComponent),
                "start level": `${this.startLevel}${this.ignoreStartLevel ? " (ignored)" : ""}`,
                direction: this.direction,
            };
            if (this.duration != undefined) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ColorSwitchCCStartLevelChange = _classThis;
})();
export { ColorSwitchCCStartLevelChange };
let ColorSwitchCCStopLevelChange = (() => {
    let _classDecorators = [CCCommand(ColorSwitchCommand.StopLevelChange), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ColorSwitchCC;
    var ColorSwitchCCStopLevelChange = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ColorSwitchCCStopLevelChange = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.colorComponent = options.colorComponent;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const colorComponent = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                colorComponent,
            });
        }
        colorComponent;
        serialize(ctx) {
            this.payload = Bytes.from([this.colorComponent]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "color component": getEnumMemberName(ColorComponent, this.colorComponent),
                },
            };
        }
    };
    return ColorSwitchCCStopLevelChange = _classThis;
})();
export { ColorSwitchCCStopLevelChange };
//# sourceMappingURL=ColorSwitchCC.js.map