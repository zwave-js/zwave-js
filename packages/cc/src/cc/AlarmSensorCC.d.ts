import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { AlarmSensorCommand, AlarmSensorType } from "../lib/_Types.js";
export declare const AlarmSensorCCValues: Readonly<{
    state: ((sensorType: AlarmSensorType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly property: "state";
            readonly propertyKey: AlarmSensorType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly endpoint: number;
            readonly property: "state";
            readonly propertyKey: AlarmSensorType;
        };
        readonly meta: {
            readonly label: `${string} state`;
            readonly description: "Whether the alarm is active";
            readonly ccSpecific: {
                readonly sensorType: AlarmSensorType;
            };
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
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
    severity: ((sensorType: AlarmSensorType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly property: "severity";
            readonly propertyKey: AlarmSensorType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly endpoint: number;
            readonly property: "severity";
            readonly propertyKey: AlarmSensorType;
        };
        readonly meta: {
            readonly min: 1;
            readonly max: 100;
            readonly unit: "%";
            readonly label: `${string} severity`;
            readonly ccSpecific: {
                readonly sensorType: AlarmSensorType;
            };
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
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
    duration: ((sensorType: AlarmSensorType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly property: "duration";
            readonly propertyKey: AlarmSensorType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly endpoint: number;
            readonly property: "duration";
            readonly propertyKey: AlarmSensorType;
        };
        readonly meta: {
            readonly unit: "s";
            readonly label: `${string} duration`;
            readonly description: "For how long the alarm should be active";
            readonly ccSpecific: {
                readonly sensorType: AlarmSensorType;
            };
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
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
    supportedSensorTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly property: "supportedSensorTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Alarm Sensor"];
            readonly endpoint: number;
            readonly property: "supportedSensorTypes";
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
export declare class AlarmSensorCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: AlarmSensorCommand): MaybeNotKnown<boolean>;
    /**
     * Retrieves the current value from this sensor
     * @param sensorType The (optional) sensor type to retrieve the value for
     */
    get(sensorType?: AlarmSensorType): Promise<Pick<AlarmSensorCCReport, "duration" | "state" | "severity"> | undefined>;
    getSupportedSensorTypes(): Promise<AlarmSensorType[] | undefined>;
}
export declare class AlarmSensorCC extends CommandClass {
    ccCommand: AlarmSensorCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    /**
     * Returns which sensor types are supported.
     * This only works AFTER the interview process
     */
    static getSupportedSensorTypesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<AlarmSensorType[]>;
    protected createMetadataForSensorType(ctx: GetValueDB, sensorType: AlarmSensorType): void;
}
export interface AlarmSensorCCReportOptions {
    sensorType: AlarmSensorType;
    state: boolean;
    severity?: number;
    duration?: number;
}
export declare class AlarmSensorCCReport extends AlarmSensorCC {
    constructor(options: WithAddress<AlarmSensorCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AlarmSensorCCReport;
    readonly sensorType: AlarmSensorType;
    readonly state: boolean;
    readonly severity: number | undefined;
    readonly duration: number | undefined;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
    persistValues(ctx: PersistValuesContext): boolean;
}
export interface AlarmSensorCCGetOptions {
    sensorType?: AlarmSensorType;
}
export declare class AlarmSensorCCGet extends AlarmSensorCC {
    constructor(options: WithAddress<AlarmSensorCCGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): AlarmSensorCCGet;
    sensorType: AlarmSensorType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface AlarmSensorCCSupportedReportOptions {
    supportedSensorTypes: AlarmSensorType[];
}
export declare class AlarmSensorCCSupportedReport extends AlarmSensorCC {
    constructor(options: WithAddress<AlarmSensorCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): AlarmSensorCCSupportedReport;
    supportedSensorTypes: AlarmSensorType[];
    persistValues(ctx: PersistValuesContext): boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class AlarmSensorCCSupportedGet extends AlarmSensorCC {
}
//# sourceMappingURL=AlarmSensorCC.d.ts.map