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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { LanguageCommand } from "../lib/_Types.js";
export const LanguageCCValues = V.defineCCValues(CommandClasses.Language, {
    ...V.staticProperty("language", {
        ...ValueMetadata.ReadOnlyString,
        label: "Language code",
    }),
    ...V.staticProperty("country", {
        ...ValueMetadata.ReadOnlyString,
        label: "Country code",
    }),
});
// @noSetValueAPI It doesn't make sense
let LanguageCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Language)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _set_decorators;
    var LanguageCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _set_decorators = [validateArgs()];
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LanguageCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case LanguageCommand.Get:
                    return this.isSinglecast();
                case LanguageCommand.Set:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(LanguageCommand, LanguageCommand.Get);
            const cc = new LanguageCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["language", "country"]);
            }
        }
        async set(language, country) {
            this.assertSupportsCommand(LanguageCommand, LanguageCommand.Set);
            const cc = new LanguageCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                language,
                country,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return LanguageCCAPI = _classThis;
})();
export { LanguageCCAPI };
let LanguageCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Language), implementedVersion(1), ccValues(LanguageCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var LanguageCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LanguageCC = _classThis = _classDescriptor.value;
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
            const api = CCAPI.create(CommandClasses.Language, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                message: "requesting language setting...",
                direction: "outbound",
            });
            const resp = await api.get();
            if (resp) {
                const { language, country } = resp;
                const logMessage = `received current language setting: ${language}${country != undefined ? `-${country}` : ""}`;
                ctx.logNode(node.id, {
                    message: logMessage,
                    direction: "inbound",
                });
            }
        }
    };
    return LanguageCC = _classThis;
})();
export { LanguageCC };
let LanguageCCSet = (() => {
    let _classDecorators = [CCCommand(LanguageCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LanguageCC;
    var LanguageCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LanguageCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // Populate properties from options object
            this._language = options.language;
            this._country = options.country;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new LanguageCCSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        _language;
        get language() {
            return this._language;
        }
        set language(value) {
            if (value.length !== 3 || value.toLowerCase() !== value) {
                throw new ZWaveError("language must be a 3 digit (lowercase) code according to ISO 639-2", ZWaveErrorCodes.Argument_Invalid);
            }
            this._language = value;
        }
        _country;
        get country() {
            return this._country;
        }
        set country(value) {
            if (typeof value === "string"
                && (value.length !== 2 || value.toUpperCase() !== value)) {
                throw new ZWaveError("country must be a 2 digit (uppercase) code according to ISO 3166-1", ZWaveErrorCodes.Argument_Invalid);
            }
            this._country = value;
        }
        serialize(ctx) {
            this.payload = Bytes.from(this._language, "ascii");
            if (this._country) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from(this._country, "ascii"),
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = { language: this.language };
            if (this._country != undefined) {
                message.country = this._country;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return LanguageCCSet = _classThis;
})();
export { LanguageCCSet };
let LanguageCCReport = (() => {
    let _classDecorators = [CCCommand(LanguageCommand.Report), ccValueProperty("language", LanguageCCValues.language), ccValueProperty("country", LanguageCCValues.country)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LanguageCC;
    var LanguageCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LanguageCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.language = options.language;
            this.country = options.country;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const language = raw.payload.subarray(0, 3).toString("ascii");
            let country;
            if (raw.payload.length >= 5) {
                country = raw.payload.subarray(3, 5).toString("ascii");
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                language,
                country,
            });
        }
        language;
        country;
        toLogEntry(ctx) {
            const message = { language: this.language };
            if (this.country != undefined) {
                message.country = this.country;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return LanguageCCReport = _classThis;
})();
export { LanguageCCReport };
let LanguageCCGet = (() => {
    let _classDecorators = [CCCommand(LanguageCommand.Get), expectedCCResponse(LanguageCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LanguageCC;
    var LanguageCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LanguageCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return LanguageCCGet = _classThis;
})();
export { LanguageCCGet };
//# sourceMappingURL=LanguageCC.js.map