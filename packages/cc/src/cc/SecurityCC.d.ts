import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SecurityManager, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { SecurityCommand } from "../lib/_Types.js";
export declare class SecurityCCAPI extends PhysicalCCAPI {
    supportsCommand(_cmd: SecurityCommand): MaybeNotKnown<boolean>;
    sendEncapsulated(encapsulated: CommandClass, requestNextNonce?: boolean): Promise<void>;
    /**
     * Requests a new nonce for Security CC encapsulation which is not directly linked to a specific command.
     */
    getNonce(): Promise<Uint8Array | undefined>;
    /**
     * Responds to a NonceGet request. The message is sent without any retransmission etc.
     * The return value indicates whether a nonce was successfully sent
     */
    sendNonce(): Promise<boolean>;
    getSecurityScheme(): Promise<[0]>;
    reportSecurityScheme(encapsulated: boolean): Promise<void>;
    inheritSecurityScheme(): Promise<void>;
    setNetworkKey(networkKey: Uint8Array): Promise<void>;
    verifyNetworkKey(): Promise<void>;
    getSupportedCommands(): Promise<Pick<SecurityCCCommandsSupportedReport, "supportedCCs" | "controlledCCs"> | undefined>;
    reportSupportedCommands(supportedCCs: CommandClasses[], controlledCCs: CommandClasses[]): Promise<void>;
}
export declare class SecurityCC extends CommandClass {
    ccCommand: SecurityCommand;
    nodeId: number;
    interview(ctx: InterviewContext): Promise<void>;
    /** Tests if a command should be sent secure and thus requires encapsulation */
    static requiresEncapsulation(cc: CommandClass): boolean;
    /** Encapsulates a command that should be sent encrypted */
    static encapsulate(ownNodeId: number, securityManager: SecurityManager, cc: CommandClass): SecurityCCCommandEncapsulation;
}
interface SecurityCCNonceReportOptions {
    nonce: Uint8Array;
}
export declare class SecurityCCNonceReport extends SecurityCC {
    constructor(options: WithAddress<SecurityCCNonceReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SecurityCCNonceReport;
    nonce: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SecurityCCNonceGet extends SecurityCC {
}
export type SecurityCCCommandEncapsulationOptions = {
    alternativeNetworkKey?: Uint8Array;
} & ({
    encapsulated: CommandClass;
} | {
    decryptedCCBytes: Uint8Array;
    sequenced: boolean;
    secondFrame: boolean;
    sequenceCounter: number;
});
export declare class SecurityCCCommandEncapsulation extends SecurityCC {
    constructor(options: WithAddress<SecurityCCCommandEncapsulationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<SecurityCCCommandEncapsulation>;
    private sequenced;
    private secondFrame;
    private sequenceCounter;
    private decryptedCCBytes;
    encapsulated: CommandClass;
    private alternativeNetworkKey?;
    get nonceId(): number | undefined;
    nonce: Uint8Array | undefined;
    private iv?;
    private authData?;
    private authCode?;
    private ciphertext?;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: SecurityCCCommandEncapsulation[], ctx: CCParsingContext): Promise<void>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SecurityCCCommandEncapsulationNonceGet extends SecurityCCCommandEncapsulation {
}
export declare class SecurityCCSchemeReport extends SecurityCC {
    static from(raw: CCRaw, ctx: CCParsingContext): SecurityCCSchemeReport;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SecurityCCSchemeGet extends SecurityCC {
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SecurityCCSchemeInherit extends SecurityCC {
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SecurityCCNetworkKeyVerify extends SecurityCC {
}
export interface SecurityCCNetworkKeySetOptions {
    networkKey: Uint8Array;
}
export declare class SecurityCCNetworkKeySet extends SecurityCC {
    constructor(options: WithAddress<SecurityCCNetworkKeySetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SecurityCCNetworkKeySet;
    networkKey: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SecurityCCCommandsSupportedReportOptions {
    reportsToFollow?: number;
    supportedCCs: CommandClasses[];
    controlledCCs: CommandClasses[];
}
export declare class SecurityCCCommandsSupportedReport extends SecurityCC {
    constructor(options: WithAddress<SecurityCCCommandsSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SecurityCCCommandsSupportedReport;
    reportsToFollow: number;
    supportedCCs: CommandClasses[];
    controlledCCs: CommandClasses[];
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: SecurityCCCommandsSupportedReport[]): Promise<void>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SecurityCCCommandsSupportedGet extends SecurityCC {
}
export {};
//# sourceMappingURL=SecurityCC.d.ts.map