import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { EntryControlCommand, EntryControlDataTypes, EntryControlEventTypes } from "../lib/_Types.js";
export declare const EntryControlCCValues: Readonly<{
    keyCacheSize: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly property: "keyCacheSize";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly endpoint: number;
            readonly property: "keyCacheSize";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Key cache size";
            readonly description: "Number of character that must be stored before sending";
            readonly min: 1;
            readonly max: 32;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    keyCacheTimeout: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly property: "keyCacheTimeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly endpoint: number;
            readonly property: "keyCacheTimeout";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Key cache timeout";
            readonly unit: "seconds";
            readonly description: "How long the key cache must wait for additional characters";
            readonly min: 1;
            readonly max: 10;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportedDataTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly property: "supportedDataTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly endpoint: number;
            readonly property: "supportedDataTypes";
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
    supportedEventTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly property: "supportedEventTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly endpoint: number;
            readonly property: "supportedEventTypes";
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
    supportedKeys: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly property: "supportedKeys";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Entry Control"];
            readonly endpoint: number;
            readonly property: "supportedKeys";
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
}>;
export declare class EntryControlCCAPI extends CCAPI {
    supportsCommand(cmd: EntryControlCommand): MaybeNotKnown<boolean>;
    getSupportedKeys(): Promise<readonly number[] | undefined>;
    getEventCapabilities(): Promise<Pick<EntryControlCCEventSupportedReport, "supportedDataTypes" | "supportedEventTypes" | "minKeyCacheSize" | "maxKeyCacheSize" | "minKeyCacheTimeout" | "maxKeyCacheTimeout"> | undefined>;
    getConfiguration(): Promise<Pick<EntryControlCCConfigurationReport, "keyCacheSize" | "keyCacheTimeout"> | undefined>;
    setConfiguration(keyCacheSize: number, keyCacheTimeout: number): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class EntryControlCC extends CommandClass {
    ccCommand: EntryControlCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface EntryControlCCNotificationOptions {
    sequenceNumber: number;
    dataType: EntryControlDataTypes;
    eventType: EntryControlEventTypes;
    eventData?: string | Bytes;
}
export declare class EntryControlCCNotification extends EntryControlCC {
    constructor(options: WithAddress<EntryControlCCNotificationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): EntryControlCCNotification;
    readonly sequenceNumber: number;
    readonly dataType: EntryControlDataTypes;
    readonly eventType: EntryControlEventTypes;
    readonly eventData?: Uint8Array | string;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface EntryControlCCKeySupportedReportOptions {
    supportedKeys: number[];
}
export declare class EntryControlCCKeySupportedReport extends EntryControlCC {
    constructor(options: WithAddress<EntryControlCCKeySupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): EntryControlCCKeySupportedReport;
    readonly supportedKeys: readonly number[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class EntryControlCCKeySupportedGet extends EntryControlCC {
}
export interface EntryControlCCEventSupportedReportOptions {
    supportedDataTypes: EntryControlDataTypes[];
    supportedEventTypes: EntryControlEventTypes[];
    minKeyCacheSize: number;
    maxKeyCacheSize: number;
    minKeyCacheTimeout: number;
    maxKeyCacheTimeout: number;
}
export declare class EntryControlCCEventSupportedReport extends EntryControlCC {
    constructor(options: WithAddress<EntryControlCCEventSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): EntryControlCCEventSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly supportedDataTypes: readonly EntryControlDataTypes[];
    readonly supportedEventTypes: readonly EntryControlEventTypes[];
    readonly minKeyCacheSize: number;
    readonly maxKeyCacheSize: number;
    readonly minKeyCacheTimeout: number;
    readonly maxKeyCacheTimeout: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class EntryControlCCEventSupportedGet extends EntryControlCC {
}
export interface EntryControlCCConfigurationReportOptions {
    keyCacheSize: number;
    keyCacheTimeout: number;
}
export declare class EntryControlCCConfigurationReport extends EntryControlCC {
    constructor(options: WithAddress<EntryControlCCConfigurationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): EntryControlCCConfigurationReport;
    readonly keyCacheSize: number;
    readonly keyCacheTimeout: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class EntryControlCCConfigurationGet extends EntryControlCC {
}
export interface EntryControlCCConfigurationSetOptions {
    keyCacheSize: number;
    keyCacheTimeout: number;
}
export declare class EntryControlCCConfigurationSet extends EntryControlCC {
    constructor(options: WithAddress<EntryControlCCConfigurationSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): EntryControlCCConfigurationSet;
    readonly keyCacheSize: number;
    readonly keyCacheTimeout: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=EntryControlCC.d.ts.map