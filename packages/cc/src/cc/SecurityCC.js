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
import { CommandClasses, EncapsulationFlags, MessagePriority, SecurityClass, TransmitOptions, ZWaveError, ZWaveErrorCodes, computeMAC, decryptAES128OFB, encodeCCList, encryptAES128OFB, generateAuthKey, generateEncryptionKey, getCCName, isTransmissionError, parseCCList, randomBytes, validatePayload, } from "@zwave-js/core";
import { Bytes, buffer2hex, num2hex, pick } from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { SecurityCommand } from "../lib/_Types.js";
import { CRC16CC } from "./CRC16CC.js";
import { Security2CC } from "./Security2CC.js";
import { TransportServiceCC } from "./TransportServiceCC.js";
// @noSetValueAPI This is an encapsulation CC
function getAuthenticationData(senderNonce, receiverNonce, ccCommand, sendingNodeId, receivingNodeId, encryptedPayload) {
    return Bytes.concat([
        senderNonce,
        receiverNonce,
        Bytes.from([
            ccCommand,
            sendingNodeId,
            receivingNodeId,
            encryptedPayload.length,
        ]),
        encryptedPayload,
    ]);
}
function throwNoNonce(reason) {
    let message = `Security CC requires a nonce to be sent!`;
    if (reason)
        message += ` Reason: ${reason}`;
    throw new ZWaveError(message, ZWaveErrorCodes.SecurityCC_NoNonce);
}
const HALF_NONCE_SIZE = 8;
function assertSecurityRX(ctx) {
    if (!ctx.ownNodeId) {
        throw new ZWaveError(`Secure commands (S0) can only be decoded when the controller's node id is known!`, ZWaveErrorCodes.Driver_NotReady);
    }
    if (!ctx.securityManager) {
        throw new ZWaveError(`Secure commands (S0) can only be decoded when the security manager is set up!`, ZWaveErrorCodes.Driver_NoSecurity);
    }
}
function assertSecurityTX(ctx) {
    if (!ctx.ownNodeId) {
        throw new ZWaveError(`Secure commands (S0) can only be sent when the controller's node id is known!`, ZWaveErrorCodes.Driver_NotReady);
    }
    if (!ctx.securityManager) {
        throw new ZWaveError(`Secure commands (S0) can only be sent when the security manager is set up!`, ZWaveErrorCodes.Driver_NoSecurity);
    }
}
// TODO: Ignore commands if received via multicast
// Encapsulation CCs are used internally and too frequently that we
// want to pay the cost of validating each call
/* eslint-disable @zwave-js/ccapi-validate-args */
let SecurityCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Security)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    var SecurityCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(_cmd) {
            // All commands are mandatory
            return true;
        }
        async sendEncapsulated(encapsulated, requestNextNonce = false) {
            if (requestNextNonce) {
                this.assertSupportsCommand(SecurityCommand, SecurityCommand.CommandEncapsulation);
            }
            else {
                this.assertSupportsCommand(SecurityCommand, SecurityCommand.CommandEncapsulationNonceGet);
            }
            const cc = new (requestNextNonce
                ? SecurityCCCommandEncapsulationNonceGet
                : SecurityCCCommandEncapsulation)({
                nodeId: this.endpoint.nodeId,
                encapsulated,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Requests a new nonce for Security CC encapsulation which is not directly linked to a specific command.
         */
        async getNonce() {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.NonceGet);
            const cc = new SecurityCCNonceGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, {
                ...this.commandOptions,
                // Only try getting a nonce once
                maxSendAttempts: 1,
            });
            if (!response)
                return;
            const nonce = response.nonce;
            const secMan = this.host.securityManager;
            secMan.setNonce({
                issuer: this.endpoint.nodeId,
                nonceId: secMan.getNonceId(nonce),
            }, { nonce, receiver: this.host.ownNodeId }, { free: true });
            return nonce;
        }
        /**
         * Responds to a NonceGet request. The message is sent without any retransmission etc.
         * The return value indicates whether a nonce was successfully sent
         */
        async sendNonce() {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.NonceReport);
            if (!this.host.securityManager) {
                throw new ZWaveError(`Nonces can only be sent if secure communication is set up!`, ZWaveErrorCodes.Driver_NoSecurity);
            }
            const nonce = this.host.securityManager.generateNonce(this.endpoint.nodeId, HALF_NONCE_SIZE);
            const nonceId = this.host.securityManager.getNonceId(nonce);
            const cc = new SecurityCCNonceReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                nonce,
            });
            try {
                await this.host.sendCommand(cc, {
                    ...this.commandOptions,
                    // Seems we need these options or some nodes won't accept the nonce
                    transmitOptions: TransmitOptions.ACK
                        | TransmitOptions.AutoRoute,
                    // Only try sending a nonce once
                    maxSendAttempts: 1,
                    // Nonce requests must be handled immediately
                    priority: MessagePriority.Immediate,
                    // We don't want failures causing us to treat the node as asleep or dead
                    changeNodeStatusOnMissingACK: false,
                });
            }
            catch (e) {
                if (isTransmissionError(e)) {
                    // The nonce could not be sent, invalidate it
                    this.host.securityManager.deleteNonce(nonceId);
                    return false;
                }
                else {
                    // Pass other errors through
                    throw e;
                }
            }
            return true;
        }
        async getSecurityScheme() {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.SchemeGet);
            const cc = new SecurityCCSchemeGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            await this.host.sendCommand(cc, this.commandOptions);
            // There is only one scheme, so we hardcode it
            return [0];
        }
        async reportSecurityScheme(encapsulated) {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.SchemeReport);
            let cc = new SecurityCCSchemeReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            if (encapsulated) {
                cc = new SecurityCCCommandEncapsulation({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    encapsulated: cc,
                });
            }
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async inheritSecurityScheme() {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.SchemeInherit);
            const cc = new SecurityCCSchemeInherit({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            await this.host.sendCommand(cc, this.commandOptions);
            // There is only one scheme, so we don't return anything here
        }
        async setNetworkKey(networkKey) {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.NetworkKeySet);
            const keySet = new SecurityCCNetworkKeySet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                networkKey,
            });
            const cc = new SecurityCCCommandEncapsulation({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                encapsulated: keySet,
                alternativeNetworkKey: new Uint8Array(16).fill(0),
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async verifyNetworkKey() {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.NetworkKeyVerify);
            const cc = new SecurityCCNetworkKeyVerify({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupportedCommands() {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.CommandsSupportedGet);
            const cc = new SecurityCCCommandsSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["supportedCCs", "controlledCCs"]);
            }
        }
        async reportSupportedCommands(supportedCCs, controlledCCs) {
            this.assertSupportsCommand(SecurityCommand, SecurityCommand.CommandsSupportedReport);
            const cc = new SecurityCCCommandsSupportedReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                supportedCCs,
                controlledCCs,
                reportsToFollow: 0,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
    };
    return SecurityCCAPI = _classThis;
})();
export { SecurityCCAPI };
let SecurityCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Security), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var SecurityCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Security, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                message: "Querying securely supported commands (S0)...",
                direction: "outbound",
            });
            let supportedCCs;
            let controlledCCs;
            // Try up to 3 times on the root device. We REALLY don't want a spurious timeout or collision to cause us to discard a known good security class
            const MAX_ATTEMPTS = this.endpointIndex === 0 ? 3 : 1;
            for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
                const resp = await api.getSupportedCommands();
                if (resp) {
                    supportedCCs = resp.supportedCCs;
                    controlledCCs = resp.controlledCCs;
                    break;
                }
                else if (attempts < MAX_ATTEMPTS) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Querying securely supported commands (S0), attempt ${attempts}/${MAX_ATTEMPTS} failed. Retrying in 500ms...`,
                        level: "warn",
                    });
                    await wait(500);
                }
            }
            if (!supportedCCs || !controlledCCs) {
                if (node.hasSecurityClass(SecurityClass.S0_Legacy) === true) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "Querying securely supported commands (S0) failed",
                        level: "warn",
                    });
                    // TODO: Abort interview?
                }
                else {
                    // We didn't know if the node was secure and it didn't respond,
                    // assume that it doesn't have the S0 security class
                    ctx.logNode(node.id, `The node was not granted the S0 security class. Continuing interview non-securely.`);
                    node.setSecurityClass(SecurityClass.S0_Legacy, false);
                }
                return;
            }
            const logLines = [
                "received secure commands (S0)",
                "supported CCs:",
            ];
            for (const cc of supportedCCs) {
                logLines.push(`· ${getCCName(cc)}`);
            }
            logLines.push("controlled CCs:");
            for (const cc of controlledCCs) {
                logLines.push(`· ${getCCName(cc)}`);
            }
            ctx.logNode(node.id, {
                message: logLines.join("\n"),
                direction: "inbound",
            });
            // Remember which commands are supported securely
            for (const cc of supportedCCs) {
                // Basic CC has special rules for when it is considered supported
                // Therefore we mark all other CCs as supported, but not Basic CC,
                // for which support is determined later.
                if (cc === CommandClasses.Basic) {
                    endpoint.addCC(cc, { secure: true });
                }
                else {
                    endpoint.addCC(cc, {
                        isSupported: true,
                        secure: true,
                    });
                }
            }
            for (const cc of controlledCCs) {
                // Basic CC has special rules for when it is considered supported
                // Therefore we mark all other CCs as supported, but not Basic CC,
                // for which support is determined later.
                if (cc === CommandClasses.Basic) {
                    endpoint.addCC(cc, { secure: true });
                }
                else {
                    endpoint.addCC(cc, {
                        isControlled: true,
                        secure: true,
                    });
                }
            }
            // We know for sure that the node is included securely
            if (node.hasSecurityClass(SecurityClass.S0_Legacy) !== true) {
                node.setSecurityClass(SecurityClass.S0_Legacy, true);
                ctx.logNode(node.id, `The node was granted the S0 security class`);
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        /** Tests if a command should be sent secure and thus requires encapsulation */
        static requiresEncapsulation(cc) {
            // No security flag -> no encapsulation
            if (!(cc.encapsulationFlags & EncapsulationFlags.Security)) {
                return false;
            }
            // S2, CRC16, Transport Service -> no S2 encapsulation
            if (cc instanceof Security2CC
                || cc instanceof CRC16CC
                || cc instanceof TransportServiceCC) {
                return false;
            }
            // S0: check command
            if (cc instanceof SecurityCC) {
                switch (cc.ccCommand) {
                    // Already encapsulated
                    case SecurityCommand.CommandEncapsulation:
                    case SecurityCommand.CommandEncapsulationNonceGet:
                    // Cannot be sent encapsulated:
                    case SecurityCommand.NonceGet:
                    case SecurityCommand.NonceReport:
                    case SecurityCommand.SchemeGet:
                    case SecurityCommand.SchemeReport:
                        return false;
                    default:
                        // All other commands must be encapsulated
                        return true;
                }
            }
            // Everything else needs to be encapsulated if the CC is secure
            return true;
        }
        /** Encapsulates a command that should be sent encrypted */
        static encapsulate(ownNodeId, securityManager, cc) {
            // TODO: When to return a SecurityCCCommandEncapsulationNonceGet?
            const ret = new SecurityCCCommandEncapsulation({
                nodeId: cc.nodeId,
                encapsulated: cc,
            });
            // Copy the encapsulation flags from the encapsulated command
            // but omit Security, since we're doing that right now
            ret.encapsulationFlags = cc.encapsulationFlags
                & ~EncapsulationFlags.Security;
            return ret;
        }
    };
    return SecurityCC = _classThis;
})();
export { SecurityCC };
let SecurityCCNonceReport = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.NonceReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCNonceReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCNonceReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.nonce.length !== HALF_NONCE_SIZE) {
                throw new ZWaveError(`Nonce must have length ${HALF_NONCE_SIZE}!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.nonce = options.nonce;
        }
        static from(raw, ctx) {
            validatePayload.withReason("Invalid nonce length")(raw.payload.length === HALF_NONCE_SIZE);
            return new this({
                nodeId: ctx.sourceNodeId,
                nonce: raw.payload,
            });
        }
        nonce;
        serialize(ctx) {
            this.payload = Bytes.view(this.nonce);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { nonce: buffer2hex(this.nonce) },
            };
        }
    };
    return SecurityCCNonceReport = _classThis;
})();
export { SecurityCCNonceReport };
let SecurityCCNonceGet = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.NonceGet), expectedCCResponse(SecurityCCNonceReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCNonceGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCNonceGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SecurityCCNonceGet = _classThis;
})();
export { SecurityCCNonceGet };
function getCCResponseForCommandEncapsulation(sent) {
    if (sent.encapsulated.expectsCCResponse()) {
        return SecurityCCCommandEncapsulation;
    }
}
let SecurityCCCommandEncapsulation = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.CommandEncapsulation), expectedCCResponse(getCCResponseForCommandEncapsulation, () => "checkEncapsulated")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCCommandEncapsulation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCCommandEncapsulation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if ("encapsulated" in options) {
                this.encapsulated = options.encapsulated;
                this.encapsulated.encapsulatingCC = this;
            }
            else {
                this.decryptedCCBytes = options.decryptedCCBytes;
                this.sequenced = options.sequenced;
                this.secondFrame = options.secondFrame;
                this.sequenceCounter = options.sequenceCounter;
            }
            this.alternativeNetworkKey = options.alternativeNetworkKey;
        }
        static async from(raw, ctx) {
            assertSecurityRX(ctx);
            // HALF_NONCE_SIZE bytes iv, 1 byte frame control, at least 1 CC byte, 1 byte nonce id, 8 bytes auth code
            validatePayload(raw.payload.length >= HALF_NONCE_SIZE + 1 + 1 + 1 + 8);
            const iv = raw.payload.subarray(0, HALF_NONCE_SIZE);
            const encryptedPayload = raw.payload.subarray(HALF_NONCE_SIZE, -9);
            const nonceId = raw.payload.at(-9);
            const authCode = raw.payload.subarray(-8);
            // Retrieve the used nonce from the nonce store
            const nonce = ctx.securityManager.getNonce(nonceId);
            // Only accept the message if the nonce hasn't expired
            if (!nonce) {
                validatePayload.fail(`Nonce ${num2hex(nonceId)} expired, cannot decode security encapsulated command.`);
            }
            // and mark the nonce as used
            ctx.securityManager.deleteNonce(nonceId);
            // Validate the encrypted data
            const authData = getAuthenticationData(iv, nonce, SecurityCommand.CommandEncapsulation, ctx.sourceNodeId, ctx.ownNodeId, encryptedPayload);
            const expectedAuthCode = await computeMAC(authData, await ctx.securityManager.getAuthKey());
            // Only accept messages with a correct auth code
            validatePayload.withReason("Invalid auth code, won't accept security encapsulated command.")(authCode.equals(expectedAuthCode));
            // Decrypt the encapsulated CC
            const frameControlAndDecryptedCC = await decryptAES128OFB(encryptedPayload, await ctx.securityManager.getEncryptionKey(), Bytes.concat([iv, nonce]));
            const frameControl = frameControlAndDecryptedCC[0];
            const sequenceCounter = frameControl & 0b1111;
            const sequenced = !!(frameControl & 0b1_0000);
            const secondFrame = !!(frameControl & 0b10_0000);
            const decryptedCCBytes = frameControlAndDecryptedCC
                .subarray(1);
            const ret = new SecurityCCCommandEncapsulation({
                nodeId: ctx.sourceNodeId,
                sequenceCounter,
                sequenced,
                secondFrame,
                decryptedCCBytes,
            });
            ret.authData = authData;
            ret.authCode = authCode;
            ret.iv = iv;
            return ret;
        }
        sequenced;
        secondFrame;
        sequenceCounter;
        decryptedCCBytes;
        encapsulated;
        alternativeNetworkKey;
        get nonceId() {
            return this.nonce?.[0];
        }
        nonce;
        // Only used testing/for debugging purposes
        iv;
        authData;
        authCode;
        ciphertext;
        getPartialCCSessionId() {
            if (this.sequenced) {
                return {
                    // Treat Encapsulation and EncapsulationNonceGet as one
                    ccCommand: undefined,
                    sequence: this.sequenceCounter,
                };
            }
            else {
                return {
                    // Treat Encapsulation and EncapsulationNonceGet as one
                    ccCommand: undefined,
                };
            }
        }
        expectMoreMessages() {
            return !!this.sequenced && !this.secondFrame;
        }
        async mergePartialCCs(partials, ctx) {
            // Concat the CC buffers
            this.decryptedCCBytes = Bytes.concat([...partials, this].map((cc) => cc.decryptedCCBytes));
            // make sure this contains a complete CC command that's worth splitting
            validatePayload(this.decryptedCCBytes.length >= 2);
            // and deserialize the CC
            this.encapsulated = await CommandClass.parse(this.decryptedCCBytes, ctx);
            this.encapsulated.encapsulatingCC = this;
        }
        async serialize(ctx) {
            if (!this.nonce)
                throwNoNonce();
            if (this.nonce.length !== HALF_NONCE_SIZE) {
                throwNoNonce("Invalid nonce size");
            }
            assertSecurityTX(ctx);
            let authKey;
            let encryptionKey;
            if (this.alternativeNetworkKey) {
                authKey = await generateAuthKey(this.alternativeNetworkKey);
                encryptionKey = await generateEncryptionKey(this.alternativeNetworkKey);
            }
            else {
                authKey = await ctx.securityManager.getAuthKey();
                encryptionKey = await ctx.securityManager.getEncryptionKey();
            }
            const serializedCC = await this.encapsulated.serialize(ctx);
            const plaintext = Bytes.concat([
                Bytes.from([0]), // TODO: frame control
                serializedCC,
            ]);
            // Encrypt the payload
            const senderNonce = randomBytes(HALF_NONCE_SIZE);
            const iv = Bytes.concat([senderNonce, this.nonce]);
            const ciphertext = await encryptAES128OFB(plaintext, encryptionKey, iv);
            // And generate the auth code
            const authData = getAuthenticationData(senderNonce, this.nonce, this.ccCommand, ctx.ownNodeId, this.nodeId, ciphertext);
            const authCode = await computeMAC(authData, authKey);
            // Remember for debugging purposes
            this.iv = iv;
            this.authData = authData;
            this.authCode = authCode;
            this.ciphertext = ciphertext;
            this.payload = Bytes.concat([
                senderNonce,
                ciphertext,
                Bytes.from([this.nonceId]),
                authCode,
            ]);
            return super.serialize(ctx);
        }
        computeEncapsulationOverhead() {
            // Security CC adds 8 bytes IV, 1 byte frame control, 1 byte nonce ID, 8 bytes MAC
            return super.computeEncapsulationOverhead() + 18;
        }
        toLogEntry(ctx) {
            const message = {};
            if (this.nonceId != undefined) {
                message["nonce id"] = this.nonceId;
            }
            if (this.sequenced != undefined) {
                message.sequenced = this.sequenced;
                if (this.sequenced) {
                    if (this.secondFrame != undefined) {
                        message["second frame"] = this.secondFrame;
                    }
                    if (this.sequenceCounter != undefined) {
                        message["sequence counter"] = this.sequenceCounter;
                    }
                }
            }
            // Log the plaintext in integration tests and development mode
            if (process.env.NODE_ENV === "test"
                || process.env.NODE_ENV === "development") {
                if (this.iv) {
                    message.IV = buffer2hex(this.iv);
                }
                if (this.ciphertext) {
                    message.ciphertext = buffer2hex(this.ciphertext);
                }
                else if (this.decryptedCCBytes) {
                    message.plaintext = buffer2hex(this.decryptedCCBytes);
                }
                if (this.authData) {
                    message["auth data"] = buffer2hex(this.authData);
                }
                if (this.authCode) {
                    message["auth code"] = buffer2hex(this.authCode);
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return SecurityCCCommandEncapsulation = _classThis;
})();
export { SecurityCCCommandEncapsulation };
// This is the same message, but with another CC command
let SecurityCCCommandEncapsulationNonceGet = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.CommandEncapsulationNonceGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCCCommandEncapsulation;
    var SecurityCCCommandEncapsulationNonceGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCCommandEncapsulationNonceGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SecurityCCCommandEncapsulationNonceGet = _classThis;
})();
export { SecurityCCCommandEncapsulationNonceGet };
let SecurityCCSchemeReport = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.SchemeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCSchemeReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCSchemeReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            // The including controller MUST NOT perform any validation of the Supported Security Schemes byte
            return new this({
                nodeId: ctx.sourceNodeId,
            });
        }
        serialize(ctx) {
            // Since it is unlikely that any more schemes will be added to S0, we hardcode the default scheme here (bit 0 = 0)
            this.payload = Bytes.from([0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                // Hide the default payload line
                message: undefined,
            };
        }
    };
    return SecurityCCSchemeReport = _classThis;
})();
export { SecurityCCSchemeReport };
let SecurityCCSchemeGet = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.SchemeGet), expectedCCResponse(SecurityCCSchemeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCSchemeGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCSchemeGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        serialize(ctx) {
            // Since it is unlikely that any more schemes will be added to S0, we hardcode the default scheme here (bit 0 = 0)
            this.payload = Bytes.from([0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                // Hide the default payload line
                message: undefined,
            };
        }
    };
    return SecurityCCSchemeGet = _classThis;
})();
export { SecurityCCSchemeGet };
let SecurityCCSchemeInherit = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.SchemeInherit), expectedCCResponse(SecurityCCSchemeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCSchemeInherit = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCSchemeInherit = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        serialize(ctx) {
            // Since it is unlikely that any more schemes will be added to S0, we hardcode the default scheme here (bit 0 = 0)
            this.payload = Bytes.from([0]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                // Hide the default payload line
                message: undefined,
            };
        }
    };
    return SecurityCCSchemeInherit = _classThis;
})();
export { SecurityCCSchemeInherit };
let SecurityCCNetworkKeyVerify = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.NetworkKeyVerify)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCNetworkKeyVerify = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCNetworkKeyVerify = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SecurityCCNetworkKeyVerify = _classThis;
})();
export { SecurityCCNetworkKeyVerify };
let SecurityCCNetworkKeySet = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.NetworkKeySet), expectedCCResponse(SecurityCCNetworkKeyVerify)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCNetworkKeySet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCNetworkKeySet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.networkKey.length !== 16) {
                throw new ZWaveError(`The network key must have length 16!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.networkKey = options.networkKey;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 16);
            const networkKey = raw.payload.subarray(0, 16);
            return new this({
                nodeId: ctx.sourceNodeId,
                networkKey,
            });
        }
        networkKey;
        serialize(ctx) {
            this.payload = Bytes.view(this.networkKey);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            // The network key shouldn't be logged, so users can safely post their logs online
            const { message, ...log } = super.toLogEntry(ctx);
            return log;
        }
    };
    return SecurityCCNetworkKeySet = _classThis;
})();
export { SecurityCCNetworkKeySet };
let SecurityCCCommandsSupportedReport = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.CommandsSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCCommandsSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCCommandsSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportedCCs = options.supportedCCs;
            this.controlledCCs = options.controlledCCs;
            // TODO: properly split the CCs into multiple reports
            this.reportsToFollow = options.reportsToFollow ?? 0;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const reportsToFollow = raw.payload[0];
            const list = parseCCList(raw.payload.subarray(1));
            const supportedCCs = list.supportedCCs;
            const controlledCCs = list.controlledCCs;
            return new this({
                nodeId: ctx.sourceNodeId,
                reportsToFollow,
                supportedCCs,
                controlledCCs,
            });
        }
        reportsToFollow;
        supportedCCs;
        controlledCCs;
        getPartialCCSessionId() {
            // Nothing special we can distinguish sessions with
            return {};
        }
        expectMoreMessages() {
            return this.reportsToFollow > 0;
        }
        mergePartialCCs(partials) {
            // Concat the lists of CCs
            this.supportedCCs = [...partials, this]
                .map((report) => report.supportedCCs)
                .reduce((prev, cur) => prev.concat(...cur), []);
            this.controlledCCs = [...partials, this]
                .map((report) => report.controlledCCs)
                .reduce((prev, cur) => prev.concat(...cur), []);
            return Promise.resolve();
        }
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.reportsToFollow]),
                encodeCCList(this.supportedCCs, this.controlledCCs),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    reportsToFollow: this.reportsToFollow,
                    supportedCCs: this.supportedCCs
                        .map((cc) => getCCName(cc))
                        .map((cc) => `\n· ${cc}`)
                        .join(""),
                    controlledCCs: this.controlledCCs
                        .map((cc) => getCCName(cc))
                        .map((cc) => `\n· ${cc}`)
                        .join(""),
                },
            };
        }
    };
    return SecurityCCCommandsSupportedReport = _classThis;
})();
export { SecurityCCCommandsSupportedReport };
let SecurityCCCommandsSupportedGet = (() => {
    let _classDecorators = [CCCommand(SecurityCommand.CommandsSupportedGet), expectedCCResponse(SecurityCCCommandsSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SecurityCC;
    var SecurityCCCommandsSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SecurityCCCommandsSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SecurityCCCommandsSupportedGet = _classThis;
})();
export { SecurityCCCommandsSupportedGet };
//# sourceMappingURL=SecurityCC.js.map