import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type ValueID, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { IndicatorCommand, type IndicatorTimeout } from "../lib/_Types.js";
export declare const IndicatorCCValues: Readonly<{
    supportedIndicatorIds: {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: "supportedIndicatorIds";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: "supportedIndicatorIds";
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
    valueV1: {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: "value";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: "value";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Indicator value";
            readonly ccSpecific: {
                readonly indicatorId: 0;
            };
            readonly min: 0;
            readonly max: 255;
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
    identify: {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: "identify";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: "identify";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Identify";
            readonly states: {
                readonly true: "Identify";
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    supportedPropertyIDs: ((indicatorId: number) => {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: "supportedPropertyIDs";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: "supportedPropertyIDs";
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
    valueV2: ((indicatorId: number, propertyId: number) => {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: number;
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: number;
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly ccSpecific: {
                readonly indicatorId: number;
                readonly propertyId: number;
            };
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        };
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    timeout: ((indicatorId: number) => {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: number;
            readonly propertyKey: "timeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: number;
            readonly propertyKey: "timeout";
        };
        readonly meta: {
            readonly label: "Timeout";
            readonly ccSpecific: {
                readonly indicatorId: number;
            };
            readonly type: "string";
            readonly readable: true;
            readonly writeable: true;
        };
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    indicatorDescription: ((indicatorId: number) => {
        id: {
            readonly commandClass: CommandClasses.Indicator;
            readonly property: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Indicator;
            readonly endpoint: number;
            readonly property: number;
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
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare function shouldExposeIndicatorValue(indicatorId: number, propertyId: number): boolean;
export declare class IndicatorCCAPI extends CCAPI {
    supportsCommand(cmd: IndicatorCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(indicatorId?: number): Promise<MaybeNotKnown<number | IndicatorObject[]>>;
    set(value: number | IndicatorObject[]): Promise<SupervisionResult | undefined>;
    sendReport(options: IndicatorCCReportOptions): Promise<void>;
    getSupported(indicatorId: number): Promise<{
        indicatorId?: number;
        supportedProperties: readonly number[];
        nextIndicatorId: number;
    } | undefined>;
    reportSupported(indicatorId: number, supportedProperties: readonly number[], nextIndicatorId: number): Promise<void>;
    reportDescription(indicatorId: number, description: string): Promise<void>;
    /**
     * Instructs the node to identify itself. Available starting with V3 of this CC.
     */
    identify(): Promise<SupervisionResult | undefined>;
    /**
     * Set a timeout for a given indicator ID after which the indicator will be turned off.
     * @param timeout The timeout in one of the supported forms:
     * 	- a timeout string in the form `12h18m17.59s`. All parts (hours, minutes, seconds, hundredths) are optional, but must be specified in this order. An empty string will be treated like `undefined`.
     * 	- an object specifying the timeout parts. An empty object will be treated like `undefined`.
     * 	- `undefined` to disable the timeout.
     */
    setTimeout(indicatorId: number, timeout: IndicatorTimeout | string | undefined): Promise<SupervisionResult | undefined>;
    /**
     * Returns the timeout after which the given indicator will be turned off.
     */
    getTimeout(indicatorId: number): Promise<MaybeNotKnown<IndicatorTimeout>>;
    getDescription(indicatorId: number): Promise<MaybeNotKnown<string>>;
}
export declare class IndicatorCC extends CommandClass {
    ccCommand: IndicatorCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
    translateProperty(ctx: GetValueDB, property: string | number, propertyKey?: string | number): string;
    protected supportsV2Indicators(ctx: GetValueDB): boolean;
    protected getManufacturerDefinedIndicatorLabel(ctx: GetValueDB, indicatorId: number): string | undefined;
    static getSupportedPropertyIDsCached(ctx: GetValueDB, endpoint: EndpointId, indicatorId: number): MaybeNotKnown<number[]>;
}
export interface IndicatorObject {
    indicatorId: number;
    propertyId: number;
    value: number | boolean;
}
export type IndicatorCCSetOptions = {
    value: number;
} | {
    values: IndicatorObject[];
};
export declare class IndicatorCCSet extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCSet;
    indicator0Value: number | undefined;
    values: IndicatorObject[] | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type IndicatorCCReportOptions = {
    value: number;
} | {
    values: IndicatorObject[];
};
export declare class IndicatorCCReport extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly indicator0Value: number | undefined;
    readonly values: IndicatorObject[] | undefined;
    private setIndicatorValue;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IndicatorCCGetOptions {
    indicatorId?: number;
}
export declare class IndicatorCCGet extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCGet;
    indicatorId: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IndicatorCCSupportedReportOptions {
    indicatorId: number;
    nextIndicatorId: number;
    supportedProperties: readonly number[];
}
export declare class IndicatorCCSupportedReport extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly indicatorId: number;
    readonly nextIndicatorId: number;
    readonly supportedProperties: readonly number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IndicatorCCSupportedGetOptions {
    indicatorId: number;
}
export declare class IndicatorCCSupportedGet extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCSupportedGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCSupportedGet;
    indicatorId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IndicatorCCDescriptionReportOptions {
    indicatorId: number;
    description: string;
}
export declare class IndicatorCCDescriptionReport extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCDescriptionReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCDescriptionReport;
    indicatorId: number;
    description: string;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IndicatorCCDescriptionGetOptions {
    indicatorId: number;
}
export declare class IndicatorCCDescriptionGet extends IndicatorCC {
    constructor(options: WithAddress<IndicatorCCDescriptionGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IndicatorCCDescriptionGet;
    indicatorId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=IndicatorCC.d.ts.map