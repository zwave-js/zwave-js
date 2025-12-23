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
import { ZWaveError, ZWaveErrorCodes, validatePayload } from "@zwave-js/core";
import { createSimpleReflectionDecorator } from "@zwave-js/core/reflection";
import { Bytes, buffer2hex, getEnumMemberName } from "@zwave-js/shared";
var S2ExtensionType;
(function (S2ExtensionType) {
    S2ExtensionType[S2ExtensionType["SPAN"] = 1] = "SPAN";
    S2ExtensionType[S2ExtensionType["MPAN"] = 2] = "MPAN";
    S2ExtensionType[S2ExtensionType["MGRP"] = 3] = "MGRP";
    S2ExtensionType[S2ExtensionType["MOS"] = 4] = "MOS";
})(S2ExtensionType || (S2ExtensionType = {}));
const extensionTypeDecorator = createSimpleReflectionDecorator({
    name: "extensionType",
});
/** Defines which S2 extension type a subclass of S2Extension has */
export const extensionType = extensionTypeDecorator.decorator;
/** Returns which S2 extension type a subclass of S2Extension has */
export const getExtensionType = extensionTypeDecorator.lookupValue;
/**
 * Looks up the S2 extension constructor for a given S2 extension type
 */
export const getS2ExtensionConstructor = extensionTypeDecorator.lookupConstructor;
export var ValidateS2ExtensionResult;
(function (ValidateS2ExtensionResult) {
    ValidateS2ExtensionResult[ValidateS2ExtensionResult["OK"] = 0] = "OK";
    ValidateS2ExtensionResult[ValidateS2ExtensionResult["DiscardExtension"] = 1] = "DiscardExtension";
    ValidateS2ExtensionResult[ValidateS2ExtensionResult["DiscardCommand"] = 2] = "DiscardCommand";
})(ValidateS2ExtensionResult || (ValidateS2ExtensionResult = {}));
/** Tests if the extension may be accepted */
export function validateS2Extension(ext, wasEncrypted) {
    if (ext instanceof InvalidExtension) {
        // The extension could not be parsed, ignore it
        return ValidateS2ExtensionResult.DiscardExtension;
    }
    if (ext.critical && !(ext.type in S2ExtensionType)) {
        // A receiving node MUST discard the entire command if the Critical flag
        // is set to ‘1’ and the Type field advertises a value that the
        // receiving node does not support.
        return ValidateS2ExtensionResult.DiscardCommand;
    }
    // Check if the extension is correctly encrypted or not encrypted
    switch (ext.type) {
        case S2ExtensionType.MPAN:
            if (!wasEncrypted) {
                return ValidateS2ExtensionResult.DiscardExtension;
            }
            break;
        case S2ExtensionType.SPAN:
        case S2ExtensionType.MGRP:
        case S2ExtensionType.MOS:
            if (wasEncrypted) {
                return ValidateS2ExtensionResult.DiscardExtension;
            }
            break;
    }
    return ValidateS2ExtensionResult.OK;
}
export class Security2ExtensionRaw {
    type;
    critical;
    moreToFollow;
    payload;
    constructor(type, critical, moreToFollow, payload) {
        this.type = type;
        this.critical = critical;
        this.moreToFollow = moreToFollow;
        this.payload = payload;
    }
    static parse(data) {
        validatePayload(data.length >= 2);
        const totalLength = data[0];
        const moreToFollow = !!(data[1] & 0b1000_0000);
        const critical = !!(data[1] & 0b0100_0000);
        const type = data[1] & 0b11_1111;
        const payload = data.subarray(2, totalLength);
        return new Security2ExtensionRaw(type, critical, moreToFollow, payload);
    }
    withPayload(payload) {
        return new Security2ExtensionRaw(this.type, this.critical, this.moreToFollow, payload);
    }
}
export class Security2Extension {
    constructor(options) {
        const { 
        // Try to determine the extension type if none is given
        type = getExtensionType(this), critical = false, moreToFollow = false, payload = new Uint8Array(), } = options;
        if (type == undefined) {
            throw new ZWaveError("A Security2Extension must have a given or predefined extension type", ZWaveErrorCodes.Argument_Invalid);
        }
        this.type = type;
        this.critical = critical;
        this.moreToFollow = moreToFollow;
        this.payload = payload;
    }
    static parse(data) {
        const raw = Security2ExtensionRaw.parse(data);
        const Constructor = getS2ExtensionConstructor(raw.type)
            ?? Security2Extension;
        return Constructor.from(raw);
    }
    /** Creates an instance of the message that is serialized in the given buffer */
    static from(raw) {
        return new this({
            type: raw.type,
            critical: raw.critical,
            moreToFollow: raw.moreToFollow,
            payload: raw.payload,
        });
    }
    type;
    critical;
    moreToFollow;
    payload;
    isEncrypted() {
        return false;
    }
    serialize(moreToFollow) {
        return Bytes.concat([
            Bytes.from([
                2 + this.payload.length,
                (moreToFollow ? 0b1000_0000 : 0)
                    | (this.critical ? 0b0100_0000 : 0)
                    | (this.type & 0b11_1111),
            ]),
            this.payload,
        ]);
    }
    /** Returns the number of bytes the first extension in the buffer occupies */
    static getExtensionLength(data) {
        const actual = data[0];
        let expected;
        // For known extensions, return the expected length
        const type = data[1] & 0b11_1111;
        switch (type) {
            case S2ExtensionType.SPAN:
                expected = SPANExtension.expectedLength;
                break;
            case S2ExtensionType.MPAN:
                expected = MPANExtension.expectedLength;
                break;
            case S2ExtensionType.MGRP:
                expected = MGRPExtension.expectedLength;
                break;
            case S2ExtensionType.MOS:
                expected = MOSExtension.expectedLength;
                break;
        }
        return { expected, actual };
    }
    /** Returns the number of bytes the serialized extension will occupy */
    computeLength() {
        return 2 + this.payload.length;
    }
    toLogEntry() {
        let ret = `
· type: ${getEnumMemberName(S2ExtensionType, this.type)}`;
        if (this.payload.length > 0) {
            ret += `
  payload: ${buffer2hex(this.payload)}`;
        }
        return ret;
    }
}
export class InvalidExtension extends Security2Extension {
}
let SPANExtension = (() => {
    let _classDecorators = [extensionType(S2ExtensionType.SPAN)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Security2Extension;
    var SPANExtension = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SPANExtension = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(options) {
            if (options.senderEI.length !== 16) {
                throw new ZWaveError("The sender's entropy must be a 16-byte buffer!", ZWaveErrorCodes.Argument_Invalid);
            }
            super({ critical: true, ...options });
            this.senderEI = options.senderEI;
        }
        static from(raw) {
            validatePayload(raw.payload.length === 16);
            const senderEI = raw.payload;
            return new SPANExtension({
                critical: raw.critical,
                moreToFollow: raw.moreToFollow,
                senderEI,
            });
        }
        senderEI;
        static expectedLength = 18;
        serialize(moreToFollow) {
            this.payload = this.senderEI;
            return super.serialize(moreToFollow);
        }
        toLogEntry() {
            let ret = super.toLogEntry().replace(/^  payload:.+$/m, "");
            ret += `  sender EI: ${buffer2hex(this.senderEI)}`;
            return ret;
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SPANExtension = _classThis;
})();
export { SPANExtension };
let MPANExtension = (() => {
    let _classDecorators = [extensionType(S2ExtensionType.MPAN)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Security2Extension;
    var MPANExtension = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MPANExtension = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(options) {
            if (options.innerMPANState.length !== 16) {
                throw new ZWaveError("The inner MPAN state must be a 16-byte buffer!", ZWaveErrorCodes.Argument_Invalid);
            }
            super({ critical: true, ...options });
            this.groupId = options.groupId;
            this.innerMPANState = options.innerMPANState;
        }
        static from(raw) {
            validatePayload(raw.payload.length === 17);
            const groupId = raw.payload[0];
            const innerMPANState = raw.payload.subarray(1);
            return new MPANExtension({
                critical: raw.critical,
                moreToFollow: raw.moreToFollow,
                groupId,
                innerMPANState,
            });
        }
        groupId;
        innerMPANState;
        isEncrypted() {
            return true;
        }
        static expectedLength = 19;
        serialize(moreToFollow) {
            this.payload = Bytes.concat([
                [this.groupId],
                this.innerMPANState,
            ]);
            return super.serialize(moreToFollow);
        }
        toLogEntry() {
            const mpanState = process.env.NODE_ENV === "test"
                || process.env.NODE_ENV === "development"
                ? buffer2hex(this.innerMPANState)
                : "(hidden)";
            let ret = super.toLogEntry().replace(/^  payload:.+$/m, "");
            ret += `  group ID: ${this.groupId}
  MPAN state: ${mpanState}`;
            return ret;
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MPANExtension = _classThis;
})();
export { MPANExtension };
let MGRPExtension = (() => {
    let _classDecorators = [extensionType(S2ExtensionType.MGRP)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Security2Extension;
    var MGRPExtension = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MGRPExtension = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(options) {
            super({ critical: true, ...options });
            this.groupId = options.groupId;
        }
        static from(raw) {
            validatePayload(raw.payload.length === 1);
            const groupId = raw.payload[0];
            return new MGRPExtension({
                critical: raw.critical,
                moreToFollow: raw.moreToFollow,
                groupId,
            });
        }
        groupId;
        static expectedLength = 3;
        serialize(moreToFollow) {
            this.payload = Bytes.from([this.groupId]);
            return super.serialize(moreToFollow);
        }
        toLogEntry() {
            let ret = super.toLogEntry().replace(/^  payload:.+$/m, "");
            ret += `  group ID: ${this.groupId}`;
            return ret;
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MGRPExtension = _classThis;
})();
export { MGRPExtension };
let MOSExtension = (() => {
    let _classDecorators = [extensionType(S2ExtensionType.MOS)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Security2Extension;
    var MOSExtension = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MOSExtension = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(options = {}) {
            super({ critical: false, ...options });
        }
        static expectedLength = 2;
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MOSExtension = _classThis;
})();
export { MOSExtension };
//# sourceMappingURL=Extension.js.map