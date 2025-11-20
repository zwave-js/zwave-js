import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, Duration, type EndpointId, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type NodeId, type Notification, type NotificationState, type SinglecastCC, type SupervisionResult, type SupportsCC, type ValueID, type ValueMetadataNumeric, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation } from "../lib/API.js";
import { CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { NotificationCommand } from "../lib/_Types.js";
export declare const NotificationCCValues: Readonly<{
    supportsV1Alarm: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "supportsV1Alarm";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: 0;
            readonly property: "supportsV1Alarm";
        };
        is: (valueId: ValueID) => boolean;
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    supportedNotificationTypes: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "supportedNotificationTypes";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: 0;
            readonly property: "supportedNotificationTypes";
        };
        is: (valueId: ValueID) => boolean;
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    notificationMode: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "notificationMode";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: 0;
            readonly property: "notificationMode";
        };
        is: (valueId: ValueID) => boolean;
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
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    lastRefresh: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "lastRefresh";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: "lastRefresh";
        };
        is: (valueId: ValueID) => boolean;
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
    alarmType: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "alarmType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: "alarmType";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Alarm Type";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
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
    alarmLevel: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "alarmLevel";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: "alarmLevel";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Alarm Level";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
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
    doorStateSimple: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "Access Control";
            readonly propertyKey: "Door state (simple)";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: "Access Control";
            readonly propertyKey: "Door state (simple)";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Door state (simple)";
            readonly states: {
                readonly 22: "Window/door is open";
                readonly 23: "Window/door is closed";
            };
            readonly ccSpecific: {
                readonly notificationType: 6;
            };
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    doorTiltState: {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "Access Control";
            readonly propertyKey: "Door tilt state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: "Access Control";
            readonly propertyKey: "Door tilt state";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Door tilt state";
            readonly states: {
                readonly 0: "Window/door is not tilted";
                readonly 1: "Window/door is tilted";
            };
            readonly ccSpecific: {
                readonly notificationType: 6;
            };
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: false;
        };
    };
    supportedNotificationEvents: ((notificationType: number) => {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: "supportedNotificationEvents";
            readonly propertyKey: number;
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: 0;
            readonly property: "supportedNotificationEvents";
            readonly propertyKey: number;
        };
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    unknownNotificationType: ((notificationType: number) => {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: `Unknown notification (${string})`;
            readonly ccSpecific: {
                readonly notificationType: number;
            };
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    unknownNotificationVariable: ((notificationType: number, notificationName: string) => {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: string;
            readonly propertyKey: "unknown";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: string;
            readonly propertyKey: "unknown";
        };
        readonly meta: {
            readonly label: `${string}: Unknown value`;
            readonly ccSpecific: {
                readonly notificationType: number;
            };
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    notificationVariable: ((notificationName: string, variableName: string) => {
        id: {
            readonly commandClass: CommandClasses.Notification;
            readonly property: string;
            readonly propertyKey: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Notification;
            readonly endpoint: number;
            readonly property: string;
            readonly propertyKey: string;
        };
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare function shouldAutoCreateSimpleDoorSensorValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare class NotificationCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: NotificationCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    sendReport(options: NotificationCCReportOptions): Promise<SupervisionResult | undefined>;
    get(options: NotificationCCGetOptions): Promise<Pick<NotificationCCReport, "sequenceNumber" | "alarmLevel" | "notificationEvent" | "eventParameters" | "notificationStatus"> | undefined>;
    set(notificationType: number, notificationStatus: boolean): Promise<SupervisionResult | undefined>;
    getSupported(): Promise<Pick<NotificationCCSupportedReport, "supportsV1Alarm" | "supportedNotificationTypes"> | undefined>;
    getSupportedEvents(notificationType: number): Promise<MaybeNotKnown<readonly number[]>>;
}
export declare function getNotificationEnumBehavior(notification: Notification, valueConfig: NotificationState): "none" | "extend" | "replace";
export declare function getNotificationStateValueWithEnum(stateValue: number, enumValue: number): number;
/**
 * Returns the metadata to use for a known notification value.
 * Can be used to extend a previously defined metadata,
 * e.g. for V2 notifications that don't allow discovering supported events.
 */
export declare function getNotificationValueMetadata(previous: ValueMetadataNumeric | undefined, notification: Notification, valueConfig: NotificationState): ValueMetadataNumeric;
export declare class NotificationCC extends CommandClass {
    ccCommand: NotificationCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    private determineNotificationMode;
    /** Whether the node implements push or pull notifications */
    static getNotificationMode(ctx: GetValueDB, node: NodeId): MaybeNotKnown<"push" | "pull">;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    shouldRefreshValues(this: SinglecastCC<this>, ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): boolean;
}
export interface NotificationCCSetOptions {
    notificationType: number;
    notificationStatus: boolean;
}
export declare class NotificationCCSet extends NotificationCC {
    constructor(options: WithAddress<NotificationCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NotificationCCSet;
    notificationType: number;
    notificationStatus: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type NotificationCCReportOptions = {
    alarmType?: number;
    alarmLevel?: number;
    notificationType?: number;
    notificationEvent?: number;
    notificationStatus?: number;
    eventParameters?: Uint8Array;
    sequenceNumber?: number;
};
export declare class NotificationCCReport extends NotificationCC {
    constructor(options: WithAddress<NotificationCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NotificationCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    alarmType: number | undefined;
    alarmLevel: number | undefined;
    notificationType: number | undefined;
    notificationStatus: boolean | number | undefined;
    notificationEvent: number | undefined;
    eventParameters: Uint8Array | Duration | Record<string, number> | number | undefined;
    sequenceNumber: number | undefined;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
    private parseEventParameters;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
}
export type NotificationCCGetOptions = {
    alarmType: number;
} | {
    notificationType: number;
    notificationEvent?: number;
};
export declare class NotificationCCGet extends NotificationCC {
    constructor(options: WithAddress<NotificationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NotificationCCGet;
    /** Proprietary V1/V2 alarm type */
    alarmType: number | undefined;
    /** Regulated V3+ notification type */
    notificationType: number | undefined;
    notificationEvent: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface NotificationCCSupportedReportOptions {
    supportsV1Alarm: boolean;
    supportedNotificationTypes: number[];
}
export declare class NotificationCCSupportedReport extends NotificationCC {
    constructor(options: WithAddress<NotificationCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NotificationCCSupportedReport;
    supportsV1Alarm: boolean;
    supportedNotificationTypes: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class NotificationCCSupportedGet extends NotificationCC {
}
export interface NotificationCCEventSupportedReportOptions {
    notificationType: number;
    supportedEvents: number[];
}
export declare class NotificationCCEventSupportedReport extends NotificationCC {
    constructor(options: WithAddress<NotificationCCEventSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NotificationCCEventSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    notificationType: number;
    supportedEvents: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface NotificationCCEventSupportedGetOptions {
    notificationType: number;
}
export declare class NotificationCCEventSupportedGet extends NotificationCC {
    constructor(options: WithAddress<NotificationCCEventSupportedGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): NotificationCCEventSupportedGet;
    notificationType: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=NotificationCC.d.ts.map