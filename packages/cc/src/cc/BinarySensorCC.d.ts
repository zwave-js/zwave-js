import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { BinarySensorCommand, BinarySensorType } from "../lib/_Types.js";
export declare const BinarySensorCCValues: Readonly<{
    supportedSensorTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Binary Sensor"];
            readonly property: "supportedSensorTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Sensor"];
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
    state: ((sensorType: BinarySensorType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Binary Sensor"];
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Sensor"];
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: `Sensor state (${string})`;
            readonly ccSpecific: {
                readonly sensorType: BinarySensorType;
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
}>;
export declare class BinarySensorCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: BinarySensorCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    /**
     * Retrieves the current value from this sensor
     * @param sensorType The (optional) sensor type to retrieve the value for
     */
    get(sensorType?: BinarySensorType): Promise<MaybeNotKnown<boolean>>;
    sendReport(value: boolean, sensorType?: BinarySensorType): Promise<SupervisionResult | undefined>;
    getSupportedSensorTypes(): Promise<readonly BinarySensorType[] | undefined>;
    reportSupportedSensorTypes(supported: BinarySensorType[]): Promise<SupervisionResult | undefined>;
}
export declare class BinarySensorCC extends CommandClass {
    ccCommand: BinarySensorCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    /**
     * Returns which sensor types are supported.
     * This only works AFTER the interview process
     */
    static getSupportedSensorTypesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<BinarySensorType[]>;
    setMappedBasicValue(ctx: GetValueDB, value: number): boolean;
}
export interface BinarySensorCCReportOptions {
    type?: BinarySensorType;
    value: boolean;
}
export declare class BinarySensorCCReport extends BinarySensorCC {
    constructor(options: WithAddress<BinarySensorCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BinarySensorCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    type: BinarySensorType;
    value: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BinarySensorCCGetOptions {
    sensorType?: BinarySensorType;
}
export declare class BinarySensorCCGet extends BinarySensorCC {
    constructor(options: WithAddress<BinarySensorCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BinarySensorCCGet;
    sensorType: BinarySensorType | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BinarySensorCCSupportedReportOptions {
    supportedSensorTypes: BinarySensorType[];
}
export declare class BinarySensorCCSupportedReport extends BinarySensorCC {
    constructor(options: WithAddress<BinarySensorCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BinarySensorCCSupportedReport;
    supportedSensorTypes: BinarySensorType[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BinarySensorCCSupportedGet extends BinarySensorCC {
}
//# sourceMappingURL=BinarySensorCC.d.ts.map