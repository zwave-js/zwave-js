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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeBitMask, enumValuesToMetadataStates, parseBitMask, supervisedCommandSucceeded, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, isPrintableASCII, isPrintableASCIIWithWhitespace, isUint8Array, num2hex, pick, uint8ArrayToString, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, SET_VALUE, throwMissingPropertyKey, throwUnsupportedProperty, throwUnsupportedPropertyKey, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { KeypadMode, UserCodeCommand, UserIDStatus } from "../lib/_Types.js";
export const UserCodeCCValues = V.defineCCValues(CommandClasses["User Code"], {
    ...V.staticProperty("supportedUsers", undefined, { internal: true }),
    ...V.staticProperty("supportsAdminCode", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsAdminCodeDeactivation", undefined, {
        internal: true,
    }),
    ...V.staticPropertyWithName("_deprecated_supportsMasterCode", "supportsMasterCode", undefined, {
        internal: true,
    }),
    ...V.staticPropertyWithName("_deprecated_supportsMasterCodeDeactivation", "supportsMasterCodeDeactivation", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsUserCodeChecksum", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsMultipleUserCodeReport", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportsMultipleUserCodeSet", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedUserIDStatuses", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedKeypadModes", undefined, {
        internal: true,
    }),
    ...V.staticProperty("supportedASCIIChars", undefined, {
        internal: true,
    }),
    ...V.staticProperty("userCodeChecksum", undefined, { internal: true }),
    ...V.staticProperty("keypadMode", {
        ...ValueMetadata.ReadOnlyNumber,
        label: "Keypad Mode",
    }, { minVersion: 2 }),
    ...V.staticProperty("adminCode", {
        ...ValueMetadata.String,
        label: "Admin Code",
        minLength: 4,
        maxLength: 10,
    }, {
        minVersion: 2,
        secret: true,
    }),
    ...V.dynamicPropertyAndKeyWithName("userIdStatus", "userIdStatus", (userId) => userId, ({ property, propertyKey }) => property === "userIdStatus" && typeof propertyKey === "number", (userId) => ({
        ...ValueMetadata.Number,
        label: `User ID status (${userId})`,
    })),
    ...V.dynamicPropertyAndKeyWithName("userCode", "userCode", (userId) => userId, ({ property, propertyKey }) => property === "userCode" && typeof propertyKey === "number", 
    // The user code metadata is dynamically created
    undefined, { secret: true }),
});
function parseExtendedUserCode(payload) {
    validatePayload(payload.length >= 4);
    const userId = payload.readUInt16BE(0);
    const status = payload[2];
    const codeLength = payload[3] & 0b1111;
    validatePayload(payload.length >= 4 + codeLength);
    const code = payload.subarray(4, 4 + codeLength).toString("ascii");
    return {
        code: {
            userId,
            userIdStatus: status,
            userCode: code,
        },
        bytesRead: 4 + codeLength,
    };
}
function validateCode(code, supportedChars) {
    if (code.length < 4 || code.length > 10)
        return false;
    return [...code].every((char) => supportedChars.includes(char));
}
function setUserCodeMetadata(ctx, userId, userCode) {
    const statusValue = UserCodeCCValues.userIdStatus(userId);
    const codeValue = UserCodeCCValues.userCode(userId);
    const ccVersion = getEffectiveCCVersion(ctx, this);
    const supportedUserIDStatuses = this.getValue(ctx, UserCodeCCValues.supportedUserIDStatuses)
        ?? (ccVersion === 1
            ? [
                UserIDStatus.Available,
                UserIDStatus.Enabled,
                UserIDStatus.Disabled,
            ]
            : [
                UserIDStatus.Available,
                UserIDStatus.Enabled,
                UserIDStatus.Disabled,
                UserIDStatus.Messaging,
                UserIDStatus.PassageMode,
            ]);
    this.ensureMetadata(ctx, statusValue, {
        ...statusValue.meta,
        states: enumValuesToMetadataStates(UserIDStatus, supportedUserIDStatuses),
    });
    const codeMetadata = {
        ...(isUint8Array(userCode)
            ? ValueMetadata.Buffer
            : ValueMetadata.String),
        minLength: 4,
        maxLength: 10,
        label: `User Code (${userId})`,
    };
    if (this.getMetadata(ctx, codeValue)?.type !== codeMetadata.type) {
        this.setMetadata(ctx, codeValue, codeMetadata);
    }
}
function persistUserCode(ctx, userId, userIdStatus, userCode) {
    const statusValue = UserCodeCCValues.userIdStatus(userId);
    const codeValue = UserCodeCCValues.userCode(userId);
    // Check if this code is supported
    if (userIdStatus === UserIDStatus.StatusNotAvailable) {
        // It is not, remove all values if any exist
        this.removeValue(ctx, statusValue);
        this.removeValue(ctx, codeValue);
        this.removeMetadata(ctx, statusValue);
        this.removeMetadata(ctx, codeValue);
    }
    else {
        // Always create metadata in case it does not exist
        setUserCodeMetadata.call(this, ctx, userId, userCode);
        this.setValue(ctx, statusValue, userIdStatus);
        this.setValue(ctx, codeValue, userCode);
    }
    return true;
}
/** Formats a user code in a way that's safe to print in public logs */
export function userCodeToLogString(userCode) {
    if (userCode.length === 0)
        return "(empty)";
    return "*".repeat(userCode.length);
}
let UserCodeCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["User Code"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _get_decorators;
    let _set_decorators;
    let _setMany_decorators;
    let _clear_decorators;
    let _setKeypadMode_decorators;
    let _setAdminCode_decorators;
    var UserCodeCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_decorators = [validateArgs()];
            _set_decorators = [validateArgs()];
            _setMany_decorators = [validateArgs()];
            _clear_decorators = [validateArgs()];
            _setKeypadMode_decorators = [validateArgs({ strictEnums: true })];
            _setAdminCode_decorators = [validateArgs()];
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setMany_decorators, { kind: "method", name: "setMany", static: false, private: false, access: { has: obj => "setMany" in obj, get: obj => obj.setMany }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _clear_decorators, { kind: "method", name: "clear", static: false, private: false, access: { has: obj => "clear" in obj, get: obj => obj.clear }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setKeypadMode_decorators, { kind: "method", name: "setKeypadMode", static: false, private: false, access: { has: obj => "setKeypadMode" in obj, get: obj => obj.setKeypadMode }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setAdminCode_decorators, { kind: "method", name: "setAdminCode", static: false, private: false, access: { has: obj => "setAdminCode" in obj, get: obj => obj.setAdminCode }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case UserCodeCommand.Get:
                case UserCodeCommand.Set:
                case UserCodeCommand.UsersNumberGet:
                    return true; // This is mandatory
                case UserCodeCommand.CapabilitiesGet:
                case UserCodeCommand.KeypadModeSet:
                case UserCodeCommand.KeypadModeGet:
                case UserCodeCommand.ExtendedUserCodeSet:
                case UserCodeCommand.ExtendedUserCodeGet:
                    return this.version >= 2;
                case UserCodeCommand.AdminCodeSet:
                case UserCodeCommand.AdminCodeGet: {
                    if (this.version < 2)
                        return false;
                    return this.tryGetValueDB()?.getValue(UserCodeCCValues.supportsAdminCode.endpoint(this.endpoint.index));
                }
                case UserCodeCommand.UserCodeChecksumGet: {
                    if (this.version < 2)
                        return false;
                    return this.tryGetValueDB()?.getValue(UserCodeCCValues.supportsUserCodeChecksum.endpoint(this.endpoint.index));
                }
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property, propertyKey }, value) {
                let result;
                if (property === "keypadMode") {
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    result = await this.setKeypadMode(value);
                }
                else if (property === "adminCode"
                    // Support devices that were interviewed before the rename to adminCode
                    || property === "masterCode") {
                    if (typeof value !== "string") {
                        throwWrongValueType(this.ccId, property, "string", typeof value);
                    }
                    result = await this.setAdminCode(value);
                }
                else if (property === "userIdStatus") {
                    if (propertyKey == undefined) {
                        throwMissingPropertyKey(this.ccId, property);
                    }
                    else if (typeof propertyKey !== "number") {
                        throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                    }
                    if (typeof value !== "number") {
                        throwWrongValueType(this.ccId, property, "number", typeof value);
                    }
                    if (value === UserIDStatus.Available) {
                        // Clear Code
                        result = await this.clear(propertyKey);
                    }
                    else {
                        // We need to set the user code along with the status
                        const userCode = this.getValueDB().getValue(UserCodeCCValues.userCode(propertyKey).endpoint(this.endpoint.index));
                        result = await this.set(propertyKey, value, userCode);
                    }
                }
                else if (property === "userCode") {
                    if (propertyKey == undefined) {
                        throwMissingPropertyKey(this.ccId, property);
                    }
                    else if (typeof propertyKey !== "number") {
                        throwUnsupportedPropertyKey(this.ccId, property, propertyKey);
                    }
                    if (typeof value !== "string" && !isUint8Array(value)) {
                        throwWrongValueType(this.ccId, property, "string or Buffer", typeof value);
                    }
                    // We need to set the user id status along with the code
                    let userIdStatus = this.getValueDB().getValue(UserCodeCCValues.userIdStatus(propertyKey).endpoint(this.endpoint.index));
                    if (userIdStatus === UserIDStatus.Available
                        || userIdStatus == undefined) {
                        userIdStatus = UserIDStatus.Enabled;
                    }
                    result = await this.set(propertyKey, userIdStatus, value);
                }
                else {
                    throwUnsupportedProperty(this.ccId, property);
                }
                // Verify the change after a short delay, unless the command was supervised and successful
                if (this.isSinglecast() && !supervisedCommandSucceeded(result)) {
                    this.schedulePoll({ property, propertyKey }, value, {
                        transition: "fast",
                    });
                }
                return result;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                switch (property) {
                    case "keypadMode":
                        return this.getKeypadMode();
                    case "adminCode":
                        return this.getAdminCode();
                    case "userIdStatus":
                    case "userCode": {
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
        async getUsersCount() {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.UsersNumberGet);
            const cc = new UserCodeCCUsersNumberGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedUsers;
        }
        async get(userId, multiple = false) {
            if (userId > 255 || multiple) {
                this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.ExtendedUserCodeGet);
                const cc = new UserCodeCCExtendedUserCodeGet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    userId,
                    reportMore: multiple,
                });
                const response = await this.host.sendCommand(cc, this.commandOptions);
                if (!response) {
                    return;
                }
                else if (multiple) {
                    return pick(response, ["userCodes", "nextUserId"]);
                }
                else {
                    return pick(response.userCodes[0], [
                        "userIdStatus",
                        "userCode",
                    ]);
                }
            }
            else {
                this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.Get);
                const cc = new UserCodeCCGet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    userId,
                });
                const response = await this.host.sendCommand(cc, this.commandOptions);
                if (response)
                    return pick(response, ["userIdStatus", "userCode"]);
            }
        }
        /** Configures a single user code */
        async set(userId, userIdStatus, userCode) {
            if (userId > 255) {
                return this.setMany([{ userId, userIdStatus, userCode }]);
            }
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.Set);
            const numUsers = UserCodeCC.getSupportedUsersCached(this.host, this.endpoint);
            if (numUsers != undefined && userId > numUsers) {
                throw new ZWaveError(`The user ID must be between 0 and the number of supported users ${numUsers}.`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new UserCodeCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                userId,
                userIdStatus,
                userCode,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /** Configures multiple user codes */
        async setMany(codes) {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.ExtendedUserCodeSet);
            const numUsers = UserCodeCC.getSupportedUsersCached(this.host, this.endpoint);
            const supportedStatuses = UserCodeCC.getSupportedUserIDStatusesCached(this.host, this.endpoint);
            const supportedASCIIChars = UserCodeCC.getSupportedASCIICharsCached(this.host, this.endpoint);
            const supportsMultipleUserCodeSet = UserCodeCC.supportsMultipleUserCodeSetCached(this.host, this.endpoint) ?? false;
            // Validate options
            if (numUsers != undefined) {
                if (codes.some((code) => code.userId < 0 || code.userId > numUsers)) {
                    throw new ZWaveError(`All User IDs must be between 0 and the number of supported users ${numUsers}.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            else {
                if (codes.some((code) => code.userId < 0)) {
                    throw new ZWaveError(`All User IDs must be greater than 0.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            if (codes.some((code) => code.userId === 0) && codes.length > 1) {
                throw new ZWaveError(`If user ID 0 is used, only one code may be set`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (codes.some((code) => code.userId === 0
                && code.userIdStatus !== UserIDStatus.Available)) {
                throw new ZWaveError(`User ID 0 may only be used to clear all user codes`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (codes.length > 1 && !supportsMultipleUserCodeSet) {
                throw new ZWaveError(`The node does not support setting multiple user codes at once`, ZWaveErrorCodes.Argument_Invalid);
            }
            for (const code of codes) {
                if (supportedStatuses != undefined
                    && !supportedStatuses.includes(code.userIdStatus)) {
                    throw new ZWaveError(`The user ID status ${getEnumMemberName(UserIDStatus, code.userIdStatus)} is not supported by the node`, ZWaveErrorCodes.Argument_Invalid);
                }
                else if (code.userIdStatus === UserIDStatus.Available) {
                    code.userCode = undefined;
                }
                else if (supportedASCIIChars) {
                    const userCodeString = typeof code.userCode === "string"
                        ? code.userCode
                        : uint8ArrayToString(code.userCode);
                    if (!validateCode(userCodeString, supportedASCIIChars)) {
                        throw new ZWaveError(`The user code must consist of 4 to 10 of the following characters: ${supportedASCIIChars}`, ZWaveErrorCodes.Argument_Invalid);
                    }
                }
            }
            const cc = new UserCodeCCExtendedUserCodeSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                userCodes: codes,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Clears one or all user code
         * @param userId The user code to clear. If none or 0 is given, all codes are cleared
         */
        async clear(userId = 0) {
            if (this.version > 1 || userId > 255) {
                return this.setMany([
                    { userId, userIdStatus: UserIDStatus.Available },
                ]);
            }
            else {
                this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.Set);
                const numUsers = UserCodeCC.getSupportedUsersCached(this.host, this.endpoint);
                if (numUsers != undefined && userId > numUsers) {
                    throw new ZWaveError(`The user ID must be between 0 and the number of supported users ${numUsers}.`, ZWaveErrorCodes.Argument_Invalid);
                }
                const cc = new UserCodeCCSet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    userId,
                    userIdStatus: UserIDStatus.Available,
                });
                return this.host.sendCommand(cc, this.commandOptions);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getCapabilities() {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.CapabilitiesGet);
            const cc = new UserCodeCCCapabilitiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "supportsAdminCode",
                    "supportsAdminCodeDeactivation",
                    "supportsUserCodeChecksum",
                    "supportsMultipleUserCodeReport",
                    "supportsMultipleUserCodeSet",
                    "supportedUserIDStatuses",
                    "supportedKeypadModes",
                    "supportedASCIIChars",
                ]);
            }
        }
        async getKeypadMode() {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.KeypadModeGet);
            const cc = new UserCodeCCKeypadModeGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.keypadMode;
        }
        async setKeypadMode(keypadMode) {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.KeypadModeSet);
            const supportedModes = UserCodeCC.getSupportedKeypadModesCached(this.host, this.endpoint);
            if (!supportedModes) {
                throw new ZWaveError(`The keypad mode can only be set after the interview is complete!`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (!supportedModes.includes(keypadMode)) {
                throw new ZWaveError(`The keypad mode ${getEnumMemberName(KeypadMode, keypadMode)} is not supported by the node!`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new UserCodeCCKeypadModeSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                keypadMode,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getAdminCode() {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.AdminCodeGet);
            const cc = new UserCodeCCAdminCodeGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.adminCode;
        }
        async setAdminCode(adminCode) {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.AdminCodeSet);
            const supportedASCIIChars = UserCodeCC.getSupportedASCIICharsCached(this.host, this.endpoint);
            if (!supportedASCIIChars) {
                throw new ZWaveError(`The admin code can only be set after the interview is complete!`, ZWaveErrorCodes.Argument_Invalid);
            }
            // Validate the code
            if (!adminCode) {
                const supportsDeactivation = UserCodeCC
                    .supportsAdminCodeDeactivationCached(this.host, this.endpoint);
                if (!supportsDeactivation) {
                    throw new ZWaveError(`The node does not support deactivating the admin code!`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            else if (!validateCode(adminCode, supportedASCIIChars)) {
                throw new ZWaveError(`The admin code must consist of 4 to 10 of the following characters: ${supportedASCIIChars}`, ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new UserCodeCCAdminCodeSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                adminCode,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getUserCodeChecksum() {
            this.assertSupportsCommand(UserCodeCommand, UserCodeCommand.UserCodeChecksumGet);
            const cc = new UserCodeCCUserCodeChecksumGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.userCodeChecksum;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return UserCodeCCAPI = _classThis;
})();
export { UserCodeCCAPI };
let UserCodeCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["User Code"]), implementedVersion(2), ccValues(UserCodeCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var UserCodeCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["User Code"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Query capabilities first to determine what needs to be done when refreshing
            if (api.version >= 2) {
                ctx.logNode(node.id, {
                    message: "querying capabilities...",
                    direction: "outbound",
                });
                const caps = await api.getCapabilities();
                if (!caps) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "User Code capabilities query timed out, skipping interview...",
                        level: "warn",
                    });
                    return;
                }
            }
            ctx.logNode(node.id, {
                message: "querying number of user codes...",
                direction: "outbound",
            });
            const supportedUsers = await api.getUsersCount();
            if (supportedUsers == undefined) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying number of user codes timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            for (let userId = 1; userId <= supportedUsers; userId++) {
                setUserCodeMetadata.call(this, ctx, userId);
            }
            // Synchronize user codes and settings
            if (ctx.getInterviewOptions()?.queryAllUserCodes) {
                await this.refreshValues(ctx);
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["User Code"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const supportsAdminCode = UserCodeCC.supportsAdminCodeCached(ctx, endpoint);
            const supportsUserCodeChecksum = this.getValue(ctx, UserCodeCCValues.supportsUserCodeChecksum) ?? false;
            const supportedKeypadModes = this.getValue(ctx, UserCodeCCValues.supportedKeypadModes)
                ?? [];
            const supportedUsers = this.getValue(ctx, UserCodeCCValues.supportedUsers) ?? 0;
            const supportsMultipleUserCodeReport = !!this.getValue(ctx, UserCodeCCValues.supportsMultipleUserCodeReport);
            // Check for changed values and codes
            if (api.version >= 2) {
                if (supportsAdminCode) {
                    ctx.logNode(node.id, {
                        message: "querying admin code...",
                        direction: "outbound",
                    });
                    await api.getAdminCode();
                }
                if (supportedKeypadModes.length > 1) {
                    ctx.logNode(node.id, {
                        message: "querying active keypad mode...",
                        direction: "outbound",
                    });
                    await api.getKeypadMode();
                }
                const storedUserCodeChecksum = this.getValue(ctx, UserCodeCCValues.userCodeChecksum) ?? 0;
                let currentUserCodeChecksum = 0;
                if (supportsUserCodeChecksum) {
                    ctx.logNode(node.id, {
                        message: "retrieving current user code checksum...",
                        direction: "outbound",
                    });
                    currentUserCodeChecksum = await api.getUserCodeChecksum();
                }
                if (!supportsUserCodeChecksum
                    || currentUserCodeChecksum !== storedUserCodeChecksum) {
                    ctx.logNode(node.id, {
                        message: "checksum changed or is not supported, querying all user codes...",
                        direction: "outbound",
                    });
                    if (supportsMultipleUserCodeReport) {
                        // Query the user codes in bulk
                        let nextUserId = 1;
                        while (nextUserId > 0 && nextUserId <= supportedUsers) {
                            const response = await api.get(nextUserId, true);
                            if (response) {
                                nextUserId = response.nextUserId;
                            }
                            else {
                                ctx.logNode(node.id, {
                                    endpoint: this.endpointIndex,
                                    message: `Querying user code #${nextUserId} timed out, skipping the remaining interview...`,
                                    level: "warn",
                                });
                                break;
                            }
                        }
                    }
                    else {
                        // Query one user code at a time
                        for (let userId = 1; userId <= supportedUsers; userId++) {
                            await api.get(userId);
                        }
                    }
                }
            }
            else {
                // V1
                ctx.logNode(node.id, {
                    message: "querying all user codes...",
                    direction: "outbound",
                });
                for (let userId = 1; userId <= supportedUsers; userId++) {
                    await api.get(userId);
                }
            }
        }
        /**
         * Returns the number of supported users.
         * This only works AFTER the interview process
         */
        static getSupportedUsersCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.supportedUsers.endpoint(endpoint.index));
        }
        /**
         * Returns the supported keypad modes.
         * This only works AFTER the interview process
         */
        static getSupportedKeypadModesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.supportedKeypadModes.endpoint(endpoint.index));
        }
        /**
         * Returns the supported user ID statuses.
         * This only works AFTER the interview process
         */
        static getSupportedUserIDStatusesCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.supportedUserIDStatuses.endpoint(endpoint.index));
        }
        /**
         * Returns the supported ASCII characters.
         * This only works AFTER the interview process
         */
        static getSupportedASCIICharsCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.supportedASCIIChars.endpoint(endpoint.index));
        }
        /**
         * Returns whether the admin code functionality is supported.
         * This only works AFTER the interview process
         */
        static supportsAdminCodeCached(ctx, endpoint) {
            const valueDB = ctx
                .getValueDB(endpoint.nodeId);
            return valueDB.getValue(UserCodeCCValues.supportsAdminCode.endpoint(endpoint.index)) ?? valueDB.getValue(UserCodeCCValues._deprecated_supportsMasterCode.endpoint(endpoint.index)) ?? false;
        }
        /**
         * Returns whether deactivating the admin code is supported.
         * This only works AFTER the interview process
         */
        static supportsAdminCodeDeactivationCached(ctx, endpoint) {
            const valueDB = ctx
                .getValueDB(endpoint.nodeId);
            return valueDB.getValue(UserCodeCCValues.supportsAdminCodeDeactivation.endpoint(endpoint.index)) ?? valueDB.getValue(UserCodeCCValues._deprecated_supportsMasterCodeDeactivation
                .endpoint(endpoint.index)) ?? false;
        }
        /**
         * Returns whether setting multiple user codes at once is supported.
         * This only works AFTER the interview process
         */
        static supportsMultipleUserCodeSetCached(ctx, endpoint) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.supportsMultipleUserCodeSet.endpoint(endpoint.index));
        }
        /**
         * Returns the current status of a user ID.
         * This only works AFTER the user IDs have been queried.
         */
        static getUserIdStatusCached(ctx, endpoint, userId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.userIdStatus(userId).endpoint(endpoint.index));
        }
        /**
         * Returns the current code belonging to a user ID.
         * This only works AFTER the user IDs have been queried.
         */
        static getUserCodeCached(ctx, endpoint, userId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(UserCodeCCValues.userCode(userId).endpoint(endpoint.index));
        }
    };
    return UserCodeCC = _classThis;
})();
export { UserCodeCC };
let UserCodeCCSet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.userIdStatus = options.userIdStatus;
            // Validate options
            if (this.userId < 0) {
                throw new ZWaveError(`${this.constructor.name}: The user ID must be between greater than 0.`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (this.userId === 0
                && this.userIdStatus !== UserIDStatus.Available) {
                throw new ZWaveError(`${this.constructor.name}: User ID 0 may only be used to clear all user codes`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (this.userIdStatus === UserIDStatus.Available) {
                this.userCode = "\0".repeat(4);
            }
            else {
                this.userCode = options.userCode;
                // Specs say ASCII 0-9, manufacturers don't care :)
                if (this.userCode.length < 4 || this.userCode.length > 10) {
                    throw new ZWaveError(`${this.constructor.name}: The user code must have a length of 4 to 10 ${typeof this.userCode === "string"
                        ? "characters"
                        : "bytes"}`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const userIdStatus = raw.payload[1];
            if (userIdStatus === UserIDStatus.StatusNotAvailable) {
                validatePayload.fail("Invalid user ID status");
            }
            if (userIdStatus === UserIDStatus.Available) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    userId,
                    userIdStatus,
                });
            }
            const userCode = raw.payload.subarray(2);
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
                userIdStatus,
                userCode,
            });
        }
        userId;
        userIdStatus;
        userCode;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.userId, this.userIdStatus]),
                typeof this.userCode === "string"
                    ? Bytes.from(this.userCode, "ascii")
                    : this.userCode,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user id": this.userId,
                    "id status": getEnumMemberName(UserIDStatus, this.userIdStatus),
                    "user code": userCodeToLogString(this.userCode),
                },
            };
        }
    };
    return UserCodeCCSet = _classThis;
})();
export { UserCodeCCSet };
let UserCodeCCReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.userIdStatus = options.userIdStatus;
            this.userCode = options.userCode ?? "";
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const userIdStatus = raw.payload[1];
            let userCode;
            if (raw.payload.length === 2
                && (userIdStatus === UserIDStatus.Available
                    || userIdStatus === UserIDStatus.StatusNotAvailable)) {
                // The user code is not set or not available and this report contains no user code
                userCode = "";
            }
            else {
                // The specs require the user code to be at least 4 digits
                validatePayload(raw.payload.length >= 6);
                let userCodeBuffer = raw.payload.subarray(2);
                // Specs say infer user code from payload length, manufacturers send zero-padded strings
                while (userCodeBuffer.at(-1) === 0) {
                    userCodeBuffer = userCodeBuffer.subarray(0, -1);
                }
                // Specs say ASCII 0-9, manufacturers don't care :)
                // Thus we check if the code is printable using ASCII, if not keep it as a Buffer
                const userCodeString = userCodeBuffer.toString("utf8");
                if (isPrintableASCII(userCodeString)) {
                    userCode = userCodeString;
                }
                else if (isPrintableASCIIWithWhitespace(userCodeString)) {
                    // Ignore leading and trailing whitespace in V1 reports if the rest is ASCII
                    userCode = userCodeString.trim();
                }
                else {
                    userCode = userCodeBuffer;
                }
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
                userIdStatus,
                userCode,
            });
        }
        userId;
        userIdStatus;
        userCode;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            persistUserCode.call(this, ctx, this.userId, this.userIdStatus, this.userCode);
            return true;
        }
        serialize(ctx) {
            let userCodeBuffer;
            if (typeof this.userCode === "string") {
                userCodeBuffer = Bytes.from(this.userCode, "ascii");
            }
            else {
                userCodeBuffer = this.userCode;
            }
            this.payload = Bytes.concat([
                Bytes.from([this.userId, this.userIdStatus]),
                userCodeBuffer,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user id": this.userId,
                    "id status": getEnumMemberName(UserIDStatus, this.userIdStatus),
                    "user code": userCodeToLogString(this.userCode),
                },
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        toNotificationEventParameters() {
            return { userId: this.userId };
        }
    };
    return UserCodeCCReport = _classThis;
})();
export { UserCodeCCReport };
let UserCodeCCGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.Get), expectedCCResponse(UserCodeCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const userId = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
            });
        }
        userId;
        serialize(ctx) {
            this.payload = Bytes.from([this.userId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "user id": this.userId },
            };
        }
    };
    return UserCodeCCGet = _classThis;
})();
export { UserCodeCCGet };
let UserCodeCCUsersNumberReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.UsersNumberReport), ccValueProperty("supportedUsers", UserCodeCCValues.supportedUsers)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCUsersNumberReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCUsersNumberReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedUsers = options.supportedUsers;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            let supportedUsers;
            if (raw.payload.length >= 3) {
                // V2+
                supportedUsers = raw.payload.readUInt16BE(1);
            }
            else {
                // V1
                supportedUsers = raw.payload[0];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                supportedUsers,
            });
        }
        supportedUsers;
        serialize(ctx) {
            this.payload = new Bytes(3);
            // If the node implements more than 255 users, this field MUST be set to 255
            this.payload[0] = Math.min(255, this.supportedUsers);
            this.payload.writeUInt16BE(this.supportedUsers, 1);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "supported users": this.supportedUsers },
            };
        }
    };
    return UserCodeCCUsersNumberReport = _classThis;
})();
export { UserCodeCCUsersNumberReport };
let UserCodeCCUsersNumberGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.UsersNumberGet), expectedCCResponse(UserCodeCCUsersNumberReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCUsersNumberGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCUsersNumberGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return UserCodeCCUsersNumberGet = _classThis;
})();
export { UserCodeCCUsersNumberGet };
let UserCodeCCCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.CapabilitiesReport), ccValueProperty("supportsAdminCode", UserCodeCCValues.supportsAdminCode), ccValueProperty("supportsAdminCodeDeactivation", UserCodeCCValues.supportsAdminCodeDeactivation), ccValueProperty("supportsUserCodeChecksum", UserCodeCCValues.supportsUserCodeChecksum), ccValueProperty("supportsMultipleUserCodeReport", UserCodeCCValues.supportsMultipleUserCodeReport), ccValueProperty("supportsMultipleUserCodeSet", UserCodeCCValues.supportsMultipleUserCodeSet), ccValueProperty("supportedUserIDStatuses", UserCodeCCValues.supportedUserIDStatuses), ccValueProperty("supportedKeypadModes", UserCodeCCValues.supportedKeypadModes), ccValueProperty("supportedASCIIChars", UserCodeCCValues.supportedASCIIChars)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportsAdminCode = options.supportsAdminCode;
            this.supportsAdminCodeDeactivation =
                options.supportsAdminCodeDeactivation;
            this.supportsUserCodeChecksum = options.supportsUserCodeChecksum;
            this.supportsMultipleUserCodeReport =
                options.supportsMultipleUserCodeReport;
            this.supportsMultipleUserCodeSet = options.supportsMultipleUserCodeSet;
            this.supportedUserIDStatuses = options.supportedUserIDStatuses;
            this.supportedKeypadModes = options.supportedKeypadModes;
            this.supportedASCIIChars = options.supportedASCIIChars;
        }
        static from(raw, ctx) {
            let offset = 0;
            validatePayload(raw.payload.length >= offset + 1);
            const supportsAdminCode = !!(raw.payload[offset] & 0b100_00000);
            const supportsAdminCodeDeactivation = !!(raw.payload[offset] & 0b010_00000);
            const statusBitMaskLength = raw.payload[offset] & 0b000_11111;
            offset += 1;
            validatePayload(raw.payload.length >= offset + statusBitMaskLength + 1);
            const supportedUserIDStatuses = parseBitMask(raw.payload.subarray(offset, offset + statusBitMaskLength), UserIDStatus.Available);
            offset += statusBitMaskLength;
            const supportsUserCodeChecksum = !!(raw.payload[offset] & 0b100_00000);
            const supportsMultipleUserCodeReport = !!(raw.payload[offset] & 0b010_00000);
            const supportsMultipleUserCodeSet = !!(raw.payload[offset] & 0b001_00000);
            const keypadModesBitMaskLength = raw.payload[offset] & 0b000_11111;
            offset += 1;
            validatePayload(raw.payload.length >= offset + keypadModesBitMaskLength + 1);
            const supportedKeypadModes = parseBitMask(raw.payload.subarray(offset, offset + keypadModesBitMaskLength), KeypadMode.Normal);
            offset += keypadModesBitMaskLength;
            const keysBitMaskLength = raw.payload[offset] & 0b000_11111;
            offset += 1;
            validatePayload(raw.payload.length >= offset + keysBitMaskLength);
            const supportedASCIIChars = Bytes.from(parseBitMask(raw.payload.subarray(offset, offset + keysBitMaskLength), 0)).toString("ascii");
            return new this({
                nodeId: ctx.sourceNodeId,
                supportsAdminCode,
                supportsAdminCodeDeactivation,
                supportedUserIDStatuses,
                supportsUserCodeChecksum,
                supportsMultipleUserCodeReport,
                supportsMultipleUserCodeSet,
                supportedKeypadModes,
                supportedASCIIChars,
            });
        }
        supportsAdminCode;
        supportsAdminCodeDeactivation;
        supportsUserCodeChecksum;
        supportsMultipleUserCodeReport;
        supportsMultipleUserCodeSet;
        supportedUserIDStatuses;
        supportedKeypadModes;
        supportedASCIIChars;
        serialize(ctx) {
            const supportedStatusesBitmask = encodeBitMask(this.supportedUserIDStatuses, undefined, UserIDStatus.Available);
            const controlByte1 = (this.supportsAdminCode ? 0b100_00000 : 0)
                | (this.supportsAdminCodeDeactivation ? 0b010_00000 : 0)
                | (supportedStatusesBitmask.length & 0b000_11111);
            const supportedKeypadModesBitmask = encodeBitMask(this.supportedKeypadModes, undefined, KeypadMode.Normal);
            const controlByte2 = (this.supportsUserCodeChecksum ? 0b100_00000 : 0)
                | (this.supportsMultipleUserCodeReport ? 0b010_00000 : 0)
                | (this.supportsMultipleUserCodeSet ? 0b001_00000 : 0)
                | (supportedKeypadModesBitmask.length & 0b000_11111);
            const keysAsNumbers = [...this.supportedASCIIChars].map((char) => char.charCodeAt(0));
            const supportedKeysBitmask = encodeBitMask(keysAsNumbers, undefined, 0);
            const controlByte3 = supportedKeysBitmask.length & 0b000_11111;
            this.payload = Bytes.concat([
                Bytes.from([controlByte1]),
                supportedStatusesBitmask,
                Bytes.from([controlByte2]),
                supportedKeypadModesBitmask,
                Bytes.from([controlByte3]),
                supportedKeysBitmask,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supports admin code": this.supportsAdminCode,
                    "supports admin code deactivation": this.supportsAdminCodeDeactivation,
                    "supports user code checksum": this.supportsUserCodeChecksum,
                    "supports multiple codes in report": this.supportsMultipleUserCodeReport,
                    "supports multiple codes in set": this.supportsMultipleUserCodeSet,
                    "supported user id statuses": this.supportedUserIDStatuses
                        .map((status) => `\n· ${getEnumMemberName(UserIDStatus, status)}`)
                        .join(""),
                    "supported keypad modes": this.supportedKeypadModes
                        .map((mode) => `\n· ${getEnumMemberName(KeypadMode, mode)}`)
                        .join(""),
                    "supported ASCII chars": this.supportedASCIIChars,
                },
            };
        }
    };
    return UserCodeCCCapabilitiesReport = _classThis;
})();
export { UserCodeCCCapabilitiesReport };
let UserCodeCCCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.CapabilitiesGet), expectedCCResponse(UserCodeCCCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return UserCodeCCCapabilitiesGet = _classThis;
})();
export { UserCodeCCCapabilitiesGet };
let UserCodeCCKeypadModeSet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.KeypadModeSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCKeypadModeSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCKeypadModeSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.keypadMode = options.keypadMode;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const keypadMode = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                keypadMode,
            });
        }
        keypadMode;
        serialize(ctx) {
            this.payload = Bytes.from([this.keypadMode]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { mode: getEnumMemberName(KeypadMode, this.keypadMode) },
            };
        }
    };
    return UserCodeCCKeypadModeSet = _classThis;
})();
export { UserCodeCCKeypadModeSet };
let UserCodeCCKeypadModeReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.KeypadModeReport), ccValueProperty("keypadMode", UserCodeCCValues.keypadMode)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCKeypadModeReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCKeypadModeReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.keypadMode = options.keypadMode;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const keypadMode = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                keypadMode,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Update the keypad modes metadata
            const supportedKeypadModes = this.getValue(ctx, UserCodeCCValues.supportedKeypadModes) ?? [this.keypadMode];
            const keypadModeValue = UserCodeCCValues.keypadMode;
            this.setMetadata(ctx, keypadModeValue, {
                ...keypadModeValue.meta,
                states: enumValuesToMetadataStates(KeypadMode, supportedKeypadModes),
            });
            return true;
        }
        keypadMode;
        serialize(ctx) {
            this.payload = Bytes.from([this.keypadMode]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    keypadMode: getEnumMemberName(KeypadMode, this.keypadMode),
                },
            };
        }
    };
    return UserCodeCCKeypadModeReport = _classThis;
})();
export { UserCodeCCKeypadModeReport };
let UserCodeCCKeypadModeGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.KeypadModeGet), expectedCCResponse(UserCodeCCKeypadModeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCKeypadModeGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCKeypadModeGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return UserCodeCCKeypadModeGet = _classThis;
})();
export { UserCodeCCKeypadModeGet };
let UserCodeCCAdminCodeSet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.AdminCodeSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCAdminCodeSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCAdminCodeSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.adminCode = options.adminCode;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const codeLength = raw.payload[0] & 0b1111;
            validatePayload(raw.payload.length >= 1 + codeLength);
            const adminCode = raw.payload
                .subarray(1, 1 + codeLength)
                .toString("ascii");
            return new this({
                nodeId: ctx.sourceNodeId,
                adminCode,
            });
        }
        adminCode;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.adminCode.length & 0b1111]),
                Bytes.from(this.adminCode, "ascii"),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "admin code": userCodeToLogString(this.adminCode) },
            };
        }
    };
    return UserCodeCCAdminCodeSet = _classThis;
})();
export { UserCodeCCAdminCodeSet };
let UserCodeCCAdminCodeReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.AdminCodeReport), ccValueProperty("adminCode", UserCodeCCValues.adminCode)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCAdminCodeReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCAdminCodeReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.adminCode = options.adminCode;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const codeLength = raw.payload[0] & 0b1111;
            validatePayload(raw.payload.length >= 1 + codeLength);
            const adminCode = raw.payload
                .subarray(1, 1 + codeLength)
                .toString("ascii");
            return new this({
                nodeId: ctx.sourceNodeId,
                adminCode,
            });
        }
        adminCode;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.adminCode.length & 0b1111]),
                Bytes.from(this.adminCode, "ascii"),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "admin code": userCodeToLogString(this.adminCode) },
            };
        }
    };
    return UserCodeCCAdminCodeReport = _classThis;
})();
export { UserCodeCCAdminCodeReport };
let UserCodeCCAdminCodeGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.AdminCodeGet), expectedCCResponse(UserCodeCCAdminCodeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCAdminCodeGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCAdminCodeGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return UserCodeCCAdminCodeGet = _classThis;
})();
export { UserCodeCCAdminCodeGet };
let UserCodeCCUserCodeChecksumReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.UserCodeChecksumReport), ccValueProperty("userCodeChecksum", UserCodeCCValues.userCodeChecksum)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCUserCodeChecksumReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCUserCodeChecksumReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userCodeChecksum = options.userCodeChecksum;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userCodeChecksum = raw.payload.readUInt16BE(0);
            return new this({
                nodeId: ctx.sourceNodeId,
                userCodeChecksum,
            });
        }
        userCodeChecksum;
        serialize(ctx) {
            this.payload = new Bytes(2);
            this.payload.writeUInt16BE(this.userCodeChecksum, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "user code checksum": num2hex(this.userCodeChecksum) },
            };
        }
    };
    return UserCodeCCUserCodeChecksumReport = _classThis;
})();
export { UserCodeCCUserCodeChecksumReport };
let UserCodeCCUserCodeChecksumGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.UserCodeChecksumGet), expectedCCResponse(UserCodeCCUserCodeChecksumReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCUserCodeChecksumGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCUserCodeChecksumGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return UserCodeCCUserCodeChecksumGet = _classThis;
})();
export { UserCodeCCUserCodeChecksumGet };
let UserCodeCCExtendedUserCodeSet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.ExtendedUserCodeSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCExtendedUserCodeSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCExtendedUserCodeSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userCodes = options.userCodes;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new UserCodeCCExtendedUserCodeSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        userCodes;
        serialize(ctx) {
            const userCodeBuffers = this.userCodes.map((code) => {
                const ret = Bytes.concat([
                    Bytes.from([
                        0,
                        0,
                        code.userIdStatus,
                        code.userCode?.length ?? 0,
                    ]),
                    isUint8Array(code.userCode)
                        ? code.userCode
                        : Bytes.from(code.userCode ?? "", "ascii"),
                ]);
                ret.writeUInt16BE(code.userId, 0);
                return ret;
            });
            this.payload = Bytes.concat([
                Bytes.from([this.userCodes.length]),
                ...userCodeBuffers,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            for (const { userId, userIdStatus, userCode } of this.userCodes) {
                message[`code #${userId}`] = `${userCodeToLogString(userCode ?? "")} (status: ${getEnumMemberName(UserIDStatus, userIdStatus)})`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return UserCodeCCExtendedUserCodeSet = _classThis;
})();
export { UserCodeCCExtendedUserCodeSet };
let UserCodeCCExtendedUserCodeReport = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.ExtendedUserCodeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCExtendedUserCodeReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCExtendedUserCodeReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.userCodes = options.userCodes;
            this.nextUserId = options.nextUserId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const numCodes = raw.payload[0];
            let offset = 1;
            const userCodes = [];
            // parse each user code
            for (let i = 0; i < numCodes; i++) {
                const { code, bytesRead } = parseExtendedUserCode(raw.payload.subarray(offset));
                userCodes.push(code);
                offset += bytesRead;
            }
            validatePayload(raw.payload.length >= offset + 2);
            const nextUserId = raw.payload.readUInt16BE(offset);
            return new this({
                nodeId: ctx.sourceNodeId,
                userCodes,
                nextUserId,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            for (const { userId, userIdStatus, userCode } of this.userCodes) {
                persistUserCode.call(this, ctx, userId, userIdStatus, userCode);
            }
            return true;
        }
        userCodes;
        nextUserId;
        toLogEntry(ctx) {
            const message = {};
            for (const { userId, userIdStatus, userCode } of this.userCodes) {
                message[`code #${userId}`] = `${userCodeToLogString(userCode)} (status: ${getEnumMemberName(UserIDStatus, userIdStatus)})`;
            }
            message["next user id"] = this.nextUserId;
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return UserCodeCCExtendedUserCodeReport = _classThis;
})();
export { UserCodeCCExtendedUserCodeReport };
let UserCodeCCExtendedUserCodeGet = (() => {
    let _classDecorators = [CCCommand(UserCodeCommand.ExtendedUserCodeGet), expectedCCResponse(UserCodeCCExtendedUserCodeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = UserCodeCC;
    var UserCodeCCExtendedUserCodeGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserCodeCCExtendedUserCodeGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.reportMore = !!options.reportMore;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new UserCodeCCExtendedUserCodeGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        userId;
        reportMore;
        serialize(ctx) {
            this.payload = Bytes.from([0, 0, this.reportMore ? 1 : 0]);
            this.payload.writeUInt16BE(this.userId, 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user id": this.userId,
                    "report more": this.reportMore,
                },
            };
        }
    };
    return UserCodeCCExtendedUserCodeGet = _classThis;
})();
export { UserCodeCCExtendedUserCodeGet };
//# sourceMappingURL=UserCodeCC.js.map