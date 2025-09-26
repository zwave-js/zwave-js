import { Bytes } from "@zwave-js/shared";
declare enum S2ExtensionType {
    SPAN = 1,
    MPAN = 2,
    MGRP = 3,
    MOS = 4
}
/** Defines which S2 extension type a subclass of S2Extension has */
export declare const extensionType: <TTarget extends typeof Security2Extension>(type: S2ExtensionType) => import("@zwave-js/shared").TypedClassDecorator<TTarget>;
/** Returns which S2 extension type a subclass of S2Extension has */
export declare const getExtensionType: (target: Security2Extension) => S2ExtensionType | undefined;
/**
 * Looks up the S2 extension constructor for a given S2 extension type
 */
export declare const getS2ExtensionConstructor: (type: S2ExtensionType) => Security2ExtensionConstructor<Security2Extension> | undefined;
export type Security2ExtensionConstructor<T extends Security2Extension> = typeof Security2Extension & {
    new (options: Security2ExtensionOptions): T;
};
export declare enum ValidateS2ExtensionResult {
    OK = 0,
    DiscardExtension = 1,
    DiscardCommand = 2
}
/** Tests if the extension may be accepted */
export declare function validateS2Extension(ext: Security2Extension, wasEncrypted: boolean): ValidateS2ExtensionResult;
export declare class Security2ExtensionRaw {
    type: S2ExtensionType;
    critical: boolean;
    readonly moreToFollow: boolean;
    payload: Uint8Array;
    constructor(type: S2ExtensionType, critical: boolean, moreToFollow: boolean, payload: Uint8Array);
    static parse(data: Uint8Array): Security2ExtensionRaw;
    withPayload(payload: Bytes): Security2ExtensionRaw;
}
interface Security2ExtensionBaseOptions {
    critical?: boolean;
    moreToFollow?: boolean;
}
interface Security2ExtensionOptions extends Security2ExtensionBaseOptions {
    type?: S2ExtensionType;
    payload?: Uint8Array;
}
export declare class Security2Extension {
    constructor(options: Security2ExtensionOptions);
    static parse(data: Uint8Array): Security2Extension;
    /** Creates an instance of the message that is serialized in the given buffer */
    static from(raw: Security2ExtensionRaw): Security2Extension;
    type: S2ExtensionType;
    critical: boolean;
    readonly moreToFollow?: boolean;
    payload: Uint8Array;
    isEncrypted(): boolean;
    serialize(moreToFollow: boolean): Bytes;
    /** Returns the number of bytes the first extension in the buffer occupies */
    static getExtensionLength(data: Uint8Array): {
        expected?: number;
        actual: number;
    };
    /** Returns the number of bytes the serialized extension will occupy */
    computeLength(): number;
    toLogEntry(): string;
}
export declare class InvalidExtension extends Security2Extension {
}
interface SPANExtensionOptions {
    senderEI: Uint8Array;
}
export declare class SPANExtension extends Security2Extension {
    constructor(options: SPANExtensionOptions & Security2ExtensionBaseOptions);
    static from(raw: Security2ExtensionRaw): Security2Extension;
    senderEI: Uint8Array;
    static readonly expectedLength = 18;
    serialize(moreToFollow: boolean): Bytes;
    toLogEntry(): string;
}
interface MPANExtensionOptions {
    groupId: number;
    innerMPANState: Uint8Array;
}
export declare class MPANExtension extends Security2Extension {
    constructor(options: MPANExtensionOptions & Security2ExtensionBaseOptions);
    static from(raw: Security2ExtensionRaw): Security2Extension;
    groupId: number;
    innerMPANState: Uint8Array;
    isEncrypted(): boolean;
    static readonly expectedLength = 19;
    serialize(moreToFollow: boolean): Bytes;
    toLogEntry(): string;
}
interface MGRPExtensionOptions {
    groupId: number;
}
export declare class MGRPExtension extends Security2Extension {
    constructor(options: MGRPExtensionOptions & Security2ExtensionBaseOptions);
    static from(raw: Security2ExtensionRaw): Security2Extension;
    groupId: number;
    static readonly expectedLength = 3;
    serialize(moreToFollow: boolean): Bytes;
    toLogEntry(): string;
}
export declare class MOSExtension extends Security2Extension {
    constructor(options?: Security2ExtensionBaseOptions);
    static readonly expectedLength = 2;
}
export {};
//# sourceMappingURL=Extension.d.ts.map