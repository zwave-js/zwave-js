import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import type { NotificationEventPayload } from "../lib/NotificationEventPayload.js";
import { KeypadMode, UserCodeCommand, UserIDStatus } from "../lib/_Types.js";
export declare const UserCodeCCValues: Readonly<{
    supportedUsers: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportedUsers";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportedUsers";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportsAdminCode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsAdminCode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsAdminCode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportsAdminCodeDeactivation: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsAdminCodeDeactivation";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsAdminCodeDeactivation";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    _deprecated_supportsMasterCode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsMasterCode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsMasterCode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    _deprecated_supportsMasterCodeDeactivation: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsMasterCodeDeactivation";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsMasterCodeDeactivation";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportsUserCodeChecksum: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsUserCodeChecksum";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsUserCodeChecksum";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportsMultipleUserCodeReport: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsMultipleUserCodeReport";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsMultipleUserCodeReport";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportsMultipleUserCodeSet: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportsMultipleUserCodeSet";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportsMultipleUserCodeSet";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportedUserIDStatuses: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportedUserIDStatuses";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportedUserIDStatuses";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportedKeypadModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportedKeypadModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportedKeypadModes";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportedASCIIChars: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "supportedASCIIChars";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "supportedASCIIChars";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    userCodeChecksum: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "userCodeChecksum";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "userCodeChecksum";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    keypadMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "keypadMode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "keypadMode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Keypad Mode";
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    adminCode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "adminCode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "adminCode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Admin Code";
            readonly minLength: 4;
            readonly maxLength: 10;
            readonly type: "string";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: true;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    userIdStatus: ((userId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "userIdStatus";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "userIdStatus";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `User ID status (${number})`;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    userCode: ((userId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly property: "userCode";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["User Code"];
            readonly endpoint: number;
            readonly property: "userCode";
            readonly propertyKey: number;
        };
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: true;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
/** Formats a user code in a way that's safe to print in public logs */
export declare function userCodeToLogString(userCode: string | Uint8Array): string;
export declare class UserCodeCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: UserCodeCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    getUsersCount(): Promise<MaybeNotKnown<number>>;
    get(userId: number, multiple?: false): Promise<MaybeNotKnown<Pick<UserCode, "userIdStatus" | "userCode">>>;
    get(userId: number, multiple: true): Promise<MaybeNotKnown<{
        userCodes: readonly UserCode[];
        nextUserId: number;
    }>>;
    /** Configures a single user code */
    set(userId: number, userIdStatus: Exclude<UserIDStatus, UserIDStatus.Available | UserIDStatus.StatusNotAvailable>, userCode: string | Uint8Array): Promise<SupervisionResult | undefined>;
    /** Configures multiple user codes */
    setMany(codes: UserCodeCCSetOptions[]): Promise<SupervisionResult | undefined>;
    /**
     * Clears one or all user code
     * @param userId The user code to clear. If none or 0 is given, all codes are cleared
     */
    clear(userId?: number): Promise<SupervisionResult | undefined>;
    getCapabilities(): Promise<Pick<UserCodeCCCapabilitiesReport, "supportsAdminCode" | "supportsAdminCodeDeactivation" | "supportsUserCodeChecksum" | "supportsMultipleUserCodeReport" | "supportsMultipleUserCodeSet" | "supportedUserIDStatuses" | "supportedKeypadModes" | "supportedASCIIChars"> | undefined>;
    getKeypadMode(): Promise<MaybeNotKnown<KeypadMode>>;
    setKeypadMode(keypadMode: KeypadMode): Promise<SupervisionResult | undefined>;
    getAdminCode(): Promise<MaybeNotKnown<string>>;
    setAdminCode(adminCode: string): Promise<SupervisionResult | undefined>;
    getUserCodeChecksum(): Promise<MaybeNotKnown<number>>;
}
export declare class UserCodeCC extends CommandClass {
    ccCommand: UserCodeCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    /**
     * Returns the number of supported users.
     * This only works AFTER the interview process
     */
    static getSupportedUsersCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<number>;
    /**
     * Returns the supported keypad modes.
     * This only works AFTER the interview process
     */
    static getSupportedKeypadModesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<KeypadMode[]>;
    /**
     * Returns the supported user ID statuses.
     * This only works AFTER the interview process
     */
    static getSupportedUserIDStatusesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<UserIDStatus[]>;
    /**
     * Returns the supported ASCII characters.
     * This only works AFTER the interview process
     */
    static getSupportedASCIICharsCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<string>;
    /**
     * Returns whether the admin code functionality is supported.
     * This only works AFTER the interview process
     */
    static supportsAdminCodeCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns whether deactivating the admin code is supported.
     * This only works AFTER the interview process
     */
    static supportsAdminCodeDeactivationCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns whether setting multiple user codes at once is supported.
     * This only works AFTER the interview process
     */
    static supportsMultipleUserCodeSetCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns the current status of a user ID.
     * This only works AFTER the user IDs have been queried.
     */
    static getUserIdStatusCached(ctx: GetValueDB, endpoint: EndpointId, userId: number): MaybeNotKnown<UserIDStatus>;
    /**
     * Returns the current code belonging to a user ID.
     * This only works AFTER the user IDs have been queried.
     */
    static getUserCodeCached(ctx: GetValueDB, endpoint: EndpointId, userId: number): MaybeNotKnown<string | Uint8Array>;
}
export type UserCodeCCSetOptions = {
    userId: 0;
    userIdStatus: UserIDStatus.Available;
    userCode?: undefined;
} | {
    userId: number;
    userIdStatus: UserIDStatus.Available;
    userCode?: undefined;
} | {
    userId: number;
    userIdStatus: Exclude<UserIDStatus, UserIDStatus.Available | UserIDStatus.StatusNotAvailable>;
    userCode: string | Uint8Array;
};
export declare class UserCodeCCSet extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCSet;
    userId: number;
    userIdStatus: UserIDStatus;
    userCode: string | Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface UserCodeCCReportOptions {
    userId: number;
    userIdStatus: UserIDStatus;
    userCode?: string | Bytes;
}
export declare class UserCodeCCReport extends UserCodeCC implements NotificationEventPayload {
    constructor(options: WithAddress<UserCodeCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCReport;
    readonly userId: number;
    readonly userIdStatus: UserIDStatus;
    readonly userCode: string | Bytes;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
    toNotificationEventParameters(): {
        userId: number;
    };
}
export interface UserCodeCCGetOptions {
    userId: number;
}
export declare class UserCodeCCGet extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCGet;
    userId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface UserCodeCCUsersNumberReportOptions {
    supportedUsers: number;
}
export declare class UserCodeCCUsersNumberReport extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCUsersNumberReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCUsersNumberReport;
    readonly supportedUsers: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class UserCodeCCUsersNumberGet extends UserCodeCC {
}
export interface UserCodeCCCapabilitiesReportOptions {
    supportsAdminCode: boolean;
    supportsAdminCodeDeactivation: boolean;
    supportsUserCodeChecksum: boolean;
    supportsMultipleUserCodeReport: boolean;
    supportsMultipleUserCodeSet: boolean;
    supportedUserIDStatuses: readonly UserIDStatus[];
    supportedKeypadModes: readonly KeypadMode[];
    supportedASCIIChars: string;
}
export declare class UserCodeCCCapabilitiesReport extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCCapabilitiesReport;
    readonly supportsAdminCode: boolean;
    readonly supportsAdminCodeDeactivation: boolean;
    readonly supportsUserCodeChecksum: boolean;
    readonly supportsMultipleUserCodeReport: boolean;
    readonly supportsMultipleUserCodeSet: boolean;
    readonly supportedUserIDStatuses: readonly UserIDStatus[];
    readonly supportedKeypadModes: readonly KeypadMode[];
    readonly supportedASCIIChars: string;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class UserCodeCCCapabilitiesGet extends UserCodeCC {
}
export interface UserCodeCCKeypadModeSetOptions {
    keypadMode: KeypadMode;
}
export declare class UserCodeCCKeypadModeSet extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCKeypadModeSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCKeypadModeSet;
    keypadMode: KeypadMode;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface UserCodeCCKeypadModeReportOptions {
    keypadMode: KeypadMode;
}
export declare class UserCodeCCKeypadModeReport extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCKeypadModeReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCKeypadModeReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly keypadMode: KeypadMode;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class UserCodeCCKeypadModeGet extends UserCodeCC {
}
export interface UserCodeCCAdminCodeSetOptions {
    adminCode: string;
}
export declare class UserCodeCCAdminCodeSet extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCAdminCodeSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCAdminCodeSet;
    adminCode: string;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface UserCodeCCAdminCodeReportOptions {
    adminCode: string;
}
export declare class UserCodeCCAdminCodeReport extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCAdminCodeReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCAdminCodeReport;
    readonly adminCode: string;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class UserCodeCCAdminCodeGet extends UserCodeCC {
}
export interface UserCodeCCUserCodeChecksumReportOptions {
    userCodeChecksum: number;
}
export declare class UserCodeCCUserCodeChecksumReport extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCUserCodeChecksumReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCUserCodeChecksumReport;
    readonly userCodeChecksum: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class UserCodeCCUserCodeChecksumGet extends UserCodeCC {
}
export interface UserCodeCCExtendedUserCodeSetOptions {
    userCodes: UserCodeCCSetOptions[];
}
export interface UserCode {
    userId: number;
    userIdStatus: UserIDStatus;
    userCode: string;
}
export declare class UserCodeCCExtendedUserCodeSet extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCExtendedUserCodeSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): UserCodeCCExtendedUserCodeSet;
    userCodes: UserCodeCCSetOptions[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface UserCodeCCExtendedUserCodeReportOptions {
    userCodes: UserCode[];
    nextUserId: number;
}
export declare class UserCodeCCExtendedUserCodeReport extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCExtendedUserCodeReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): UserCodeCCExtendedUserCodeReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly userCodes: readonly UserCode[];
    readonly nextUserId: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface UserCodeCCExtendedUserCodeGetOptions {
    userId: number;
    reportMore?: boolean;
}
export declare class UserCodeCCExtendedUserCodeGet extends UserCodeCC {
    constructor(options: WithAddress<UserCodeCCExtendedUserCodeGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): UserCodeCCExtendedUserCodeGet;
    userId: number;
    reportMore: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=UserCodeCC.d.ts.map