import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, type EndpointId, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type NodeId, type Scale, type SinglecastCC, type SupervisionResult, type SupportsCC, type ValueID, type WithAddress } from "@zwave-js/core";
import { type AllOrNone, Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { MultilevelSensorCommand, type MultilevelSensorValue } from "../lib/_Types.js";
export declare const MultilevelSensorCCValues: Readonly<{
    supportedSensorTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Sensor"];
            readonly property: "supportedSensorTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Sensor"];
            readonly endpoint: number;
            readonly property: "supportedSensorTypes";
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
    supportedScales: ((sensorType: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Sensor"];
            readonly property: "supportedScales";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Sensor"];
            readonly endpoint: number;
            readonly property: "supportedScales";
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
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    value: ((sensorTypeName: string) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Sensor"];
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Sensor"];
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: string;
            readonly writeable: false;
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
}>;
export declare class MultilevelSensorCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: MultilevelSensorCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    /** Query the default sensor value */
    get(): Promise<MaybeNotKnown<MultilevelSensorValue & {
        type: number;
    }>>;
    /** Query the sensor value for the given sensor type using the preferred sensor scale */
    get(sensorType: number): Promise<MaybeNotKnown<MultilevelSensorValue>>;
    /** Query the sensor value for the given sensor type using the given sensor scale */
    get(sensorType: number, scale: number): Promise<MaybeNotKnown<number>>;
    getSupportedSensorTypes(): Promise<MaybeNotKnown<readonly number[]>>;
    getSupportedScales(sensorType: number): Promise<MaybeNotKnown<readonly number[]>>;
    sendReport(sensorType: number, scale: number | Scale, value: number): Promise<SupervisionResult | undefined>;
}
export declare class MultilevelSensorCC extends CommandClass {
    ccCommand: MultilevelSensorCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    shouldRefreshValues(this: SinglecastCC<this>, ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): boolean;
    /**
     * Returns which sensor types are supported.
     * This only works AFTER the interview process
     */
    static getSupportedSensorTypesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<number[]>;
    /**
     * Returns which scales are supported for a given sensor type.
     * This only works AFTER the interview process
     */
    static getSupportedScalesCached(ctx: GetValueDB, endpoint: EndpointId, sensorType: number): MaybeNotKnown<number[]>;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
}
export interface MultilevelSensorCCReportOptions {
    type: number;
    scale: number | Scale;
    value: number;
}
export declare class MultilevelSensorCCReport extends MultilevelSensorCC {
    constructor(options: WithAddress<MultilevelSensorCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSensorCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: number;
    scale: number;
    value: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type MultilevelSensorCCGetOptions = AllOrNone<{
    sensorType: number;
    scale: number;
}>;
export declare class MultilevelSensorCCGet extends MultilevelSensorCC {
    constructor(options: WithAddress<MultilevelSensorCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSensorCCGet;
    sensorType: number | undefined;
    scale: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultilevelSensorCCSupportedSensorReportOptions {
    supportedSensorTypes: readonly number[];
}
export declare class MultilevelSensorCCSupportedSensorReport extends MultilevelSensorCC {
    constructor(options: WithAddress<MultilevelSensorCCSupportedSensorReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSensorCCSupportedSensorReport;
    supportedSensorTypes: readonly number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MultilevelSensorCCGetSupportedSensor extends MultilevelSensorCC {
}
export interface MultilevelSensorCCSupportedScaleReportOptions {
    sensorType: number;
    supportedScales: readonly number[];
}
export declare class MultilevelSensorCCSupportedScaleReport extends MultilevelSensorCC {
    constructor(options: WithAddress<MultilevelSensorCCSupportedScaleReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSensorCCSupportedScaleReport;
    readonly sensorType: number;
    readonly supportedScales: readonly number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultilevelSensorCCGetSupportedScaleOptions {
    sensorType: number;
}
export declare class MultilevelSensorCCGetSupportedScale extends MultilevelSensorCC {
    constructor(options: WithAddress<MultilevelSensorCCGetSupportedScaleOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSensorCCGetSupportedScale;
    sensorType: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=MultilevelSensorCC.d.ts.map