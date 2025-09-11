import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, SecurityClass, type SecurityManagers, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { Security2Extension } from "../lib/Security2/Extension.js";
import { ECDHProfiles, KEXFailType, KEXSchemes } from "../lib/Security2/shared.js";
import { Security2Command } from "../lib/_Types.js";
export interface DecryptionResult {
    plaintext: Uint8Array;
    authOK: boolean;
    key?: Uint8Array;
    iv?: Uint8Array;
    securityClass: SecurityClass | undefined;
}
export declare class Security2CCAPI extends CCAPI {
    supportsCommand(_cmd: Security2Command): MaybeNotKnown<boolean>;
    /**
     * Sends a nonce to the node, either in response to a NonceGet request or a message that failed to decrypt. The message is sent without any retransmission etc.
     * The return value indicates whether a nonce was successfully sent
     */
    sendNonce(): Promise<boolean>;
    /** Notifies the target node that the MPAN state is out of sync */
    sendMOS(): Promise<boolean>;
    /** Sends the given MPAN to the node */
    sendMPAN(groupId: number, innerMPANState: Uint8Array): Promise<boolean>;
    /**
     * Queries the securely supported commands for the current security class
     * @param securityClass Can be used to overwrite the security class to use. If this doesn't match the current one, new nonces will need to be exchanged.
     */
    getSupportedCommands(securityClass: SecurityClass.S2_AccessControl | SecurityClass.S2_Authenticated | SecurityClass.S2_Unauthenticated): Promise<MaybeNotKnown<CommandClasses[]>>;
    reportSupportedCommands(supportedCCs: CommandClasses[]): Promise<void>;
    getKeyExchangeParameters(): Promise<Pick<Security2CCKEXReport, "requestCSA" | "echo" | "supportedKEXSchemes" | "supportedECDHProfiles" | "requestedKeys" | "_reserved"> | undefined>;
    /** Requests the given keys from an including node */
    requestKeys(params: Omit<Security2CCKEXReportOptions, "echo">): Promise<void>;
    /** Grants the joining node the given keys */
    grantKeys(params: Omit<Security2CCKEXSetOptions, "echo">): Promise<void>;
    /** Confirms the keys that were requested by a node */
    confirmRequestedKeys(params: Omit<Security2CCKEXReportOptions, "echo">): Promise<void>;
    /** Confirms the keys that were granted by the including node */
    confirmGrantedKeys(params: Omit<Security2CCKEXSetOptions, "echo">): Promise<Security2CCKEXReport | Security2CCKEXFail | undefined>;
    /** Notifies the other node that the ongoing key exchange was aborted */
    abortKeyExchange(failType: KEXFailType): Promise<void>;
    sendPublicKey(publicKey: Uint8Array, includingNode?: boolean): Promise<void>;
    requestNetworkKey(securityClass: SecurityClass): Promise<void>;
    sendNetworkKey(securityClass: SecurityClass, networkKey: Uint8Array): Promise<void>;
    verifyNetworkKey(): Promise<void>;
    confirmKeyVerification(): Promise<void>;
    endKeyExchange(): Promise<void>;
}
export declare class Security2CC extends CommandClass {
    ccCommand: Security2Command;
    interview(ctx: InterviewContext): Promise<void>;
    /** Tests if a command should be sent secure and thus requires encapsulation */
    static requiresEncapsulation(cc: CommandClass): boolean;
    /** Encapsulates a command that should be sent encrypted */
    static encapsulate(cc: CommandClass, ownNodeId: number, securityManagers: SecurityManagers, options?: {
        securityClass?: SecurityClass;
        multicastOutOfSync?: boolean;
        multicastGroupId?: number;
        verifyDelivery?: boolean;
    }): Security2CCMessageEncapsulation;
}
export type MulticastContext = {
    isMulticast: true;
    groupId: number;
} | {
    isMulticast: false;
    groupId?: number;
};
export interface Security2CCMessageEncapsulationOptions {
    sequenceNumber?: number;
    /** Can be used to override the default security class for the command */
    securityClass?: SecurityClass;
    extensions?: Security2Extension[];
    encapsulated?: CommandClass;
    verifyDelivery?: boolean;
}
export declare class Security2CCMessageEncapsulation extends Security2CC {
    constructor(options: WithAddress<Security2CCMessageEncapsulationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<Security2CCMessageEncapsulation>;
    readonly securityClass?: SecurityClass;
    private key?;
    private iv?;
    private authData?;
    private authTag?;
    private ciphertext?;
    private plaintext?;
    readonly verifyDelivery: boolean;
    sequenceNumber: number | undefined;
    private ensureSequenceNumber;
    encapsulated?: CommandClass;
    extensions: Security2Extension[];
    prepareRetransmission(): void;
    hasMOSExtension(): boolean;
    /** Returns the Sender's Entropy Input if this command contains an SPAN extension */
    getSenderEI(): Uint8Array | undefined;
    /** Returns the multicast group ID if this command contains an MGRP extension */
    getMulticastGroupId(): number | undefined;
    private maybeAddSPANExtension;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type Security2CCNonceReportOptions = {
    sequenceNumber?: number;
} & ({
    MOS: boolean;
    SOS: true;
    receiverEI: Uint8Array;
} | {
    MOS: true;
    SOS: false;
    receiverEI?: undefined;
});
export declare class Security2CCNonceReport extends Security2CC {
    constructor(options: WithAddress<Security2CCNonceReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCNonceReport;
    sequenceNumber: number | undefined;
    private ensureSequenceNumber;
    readonly SOS: boolean;
    readonly MOS: boolean;
    readonly receiverEI?: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCNonceGetOptions {
    sequenceNumber?: number;
}
export declare class Security2CCNonceGet extends Security2CC {
    constructor(options: WithAddress<Security2CCNonceGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCNonceGet;
    sequenceNumber: number | undefined;
    private ensureSequenceNumber;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCKEXReportOptions {
    requestCSA: boolean;
    echo: boolean;
    _reserved?: number;
    supportedKEXSchemes: KEXSchemes[];
    supportedECDHProfiles: ECDHProfiles[];
    requestedKeys: SecurityClass[];
}
export declare class Security2CCKEXReport extends Security2CC {
    constructor(options: WithAddress<Security2CCKEXReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCKEXReport;
    readonly _reserved: number;
    readonly requestCSA: boolean;
    readonly echo: boolean;
    readonly supportedKEXSchemes: readonly KEXSchemes[];
    readonly supportedECDHProfiles: readonly ECDHProfiles[];
    readonly requestedKeys: readonly SecurityClass[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class Security2CCKEXGet extends Security2CC {
}
export interface Security2CCKEXSetOptions {
    permitCSA: boolean;
    echo: boolean;
    _reserved?: number;
    selectedKEXScheme: KEXSchemes;
    selectedECDHProfile: ECDHProfiles;
    grantedKeys: SecurityClass[];
}
export declare class Security2CCKEXSet extends Security2CC {
    constructor(options: WithAddress<Security2CCKEXSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCKEXSet;
    readonly _reserved: number;
    permitCSA: boolean;
    echo: boolean;
    selectedKEXScheme: KEXSchemes;
    selectedECDHProfile: ECDHProfiles;
    grantedKeys: SecurityClass[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCKEXFailOptions {
    failType: KEXFailType;
}
export declare class Security2CCKEXFail extends Security2CC {
    constructor(options: WithAddress<Security2CCKEXFailOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCKEXFail;
    failType: KEXFailType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCPublicKeyReportOptions {
    includingNode: boolean;
    publicKey: Uint8Array;
}
export declare class Security2CCPublicKeyReport extends Security2CC {
    constructor(options: WithAddress<Security2CCPublicKeyReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCPublicKeyReport;
    includingNode: boolean;
    publicKey: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCNetworkKeyReportOptions {
    grantedKey: SecurityClass;
    networkKey: Uint8Array;
}
export declare class Security2CCNetworkKeyReport extends Security2CC {
    constructor(options: WithAddress<Security2CCNetworkKeyReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCNetworkKeyReport;
    grantedKey: SecurityClass;
    networkKey: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCNetworkKeyGetOptions {
    requestedKey: SecurityClass;
}
export declare class Security2CCNetworkKeyGet extends Security2CC {
    constructor(options: WithAddress<Security2CCNetworkKeyGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCNetworkKeyGet;
    requestedKey: SecurityClass;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class Security2CCNetworkKeyVerify extends Security2CC {
}
export interface Security2CCTransferEndOptions {
    keyVerified: boolean;
    keyRequestComplete: boolean;
}
export declare class Security2CCTransferEnd extends Security2CC {
    constructor(options: WithAddress<Security2CCTransferEndOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCTransferEnd;
    keyVerified: boolean;
    keyRequestComplete: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface Security2CCCommandsSupportedReportOptions {
    supportedCCs: CommandClasses[];
}
export declare class Security2CCCommandsSupportedReport extends Security2CC {
    constructor(options: WithAddress<Security2CCCommandsSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Security2CCCommandsSupportedReport;
    readonly supportedCCs: CommandClasses[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class Security2CCCommandsSupportedGet extends Security2CC {
}
//# sourceMappingURL=Security2CC.d.ts.map