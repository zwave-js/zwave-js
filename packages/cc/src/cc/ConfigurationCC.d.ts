import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig, ParamInfoMap } from "@zwave-js/config";
import { CommandClasses, ConfigValueFormat, type ConfigurationMetadata, type ControlsCC, type EndpointId, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type NodeId, type SupervisionResult, type SupportsCC, type ValueID, type WithAddress, ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { type ConfigValue, ConfigurationCommand } from "../lib/_Types.js";
export declare class ConfigurationCCError extends ZWaveError {
    readonly message: string;
    readonly code: ZWaveErrorCodes;
    readonly argument: number;
    constructor(message: string, code: ZWaveErrorCodes, argument: number);
}
export declare const ConfigurationCCValues: Readonly<{
    isParamInformationFromConfig: {
        id: {
            readonly commandClass: CommandClasses.Configuration;
            readonly property: "isParamInformationFromConfig";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Configuration;
            readonly endpoint: 0;
            readonly property: "isParamInformationFromConfig";
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
    paramInformation: ((parameter: number, bitMask?: number) => {
        id: {
            readonly commandClass: CommandClasses.Configuration;
            readonly property: number;
            readonly propertyKey: number | undefined;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Configuration;
            readonly endpoint: number;
            readonly property: number;
            readonly propertyKey: number | undefined;
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
/** @publicAPI */
export type ConfigurationCCAPISetOptions = {
    parameter: number;
} & ({
    bitMask?: undefined;
    value: ConfigValue;
} | {
    bitMask?: undefined;
    value: ConfigValue;
    valueSize: 1 | 2 | 4;
    valueFormat: ConfigValueFormat;
} | {
    bitMask: number;
    value: number;
});
/**
 * Updates the stored metadata labels and descriptions from the device config file.
 */
export declare function refreshMetadataStringsFromConfigFile(ctx: GetValueDB & GetDeviceConfig, nodeId: number, endpointIndex: number): void;
export declare class ConfigurationCCAPI extends CCAPI {
    supportsCommand(cmd: ConfigurationCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    /**
     * Requests the current value of a given config parameter from the device.
     * This may timeout and return `undefined` if the node does not respond.
     * If the node replied with a different parameter number, a `ConfigurationCCError`
     * is thrown with the `argument` property set to the reported parameter number.
     */
    get(parameter: number, options?: {
        valueBitMask?: number;
        allowUnexpectedResponse?: boolean;
    }): Promise<MaybeNotKnown<ConfigValue>>;
    /**
     * Requests the current value of the config parameters from the device.
     * When the node does not respond due to a timeout, the `value` in the returned array will be `undefined`.
     */
    getBulk(options: {
        parameter: number;
        bitMask?: number;
    }[]): Promise<{
        parameter: number;
        bitMask?: number;
        value: MaybeNotKnown<ConfigValue>;
    }[]>;
    /**
     * Sets a new value for a given config parameter of the device.
     */
    set(options: ConfigurationCCAPISetOptions): Promise<SupervisionResult | undefined>;
    /**
     * Sets new values for multiple config parameters of the device. Uses the `BulkSet` command if supported, otherwise falls back to individual `Set` commands.
     */
    setBulk(values: ConfigurationCCAPISetOptions[]): Promise<SupervisionResult | undefined>;
    /**
     * Resets a configuration parameter to its default value.
     *
     * WARNING: This will throw on legacy devices (ConfigurationCC v3 and below)
     */
    reset(parameter: number): Promise<SupervisionResult | undefined>;
    /**
     * Resets multiple configuration parameters to their default value. Uses BulkSet if supported, otherwise falls back to individual Set commands.
     *
     * WARNING: This will throw on legacy devices (ConfigurationCC v3 and below)
     */
    resetBulk(parameters: number[]): Promise<SupervisionResult | undefined>;
    /** Resets all configuration parameters to their default value */
    resetAll(): Promise<void>;
    getProperties(parameter: number): Promise<Pick<ConfigurationCCPropertiesReport, "minValue" | "maxValue" | "valueSize" | "defaultValue" | "isAdvanced" | "valueFormat" | "nextParameter" | "altersCapabilities" | "isReadonly" | "noBulkSupport"> | undefined>;
    /** Requests the name of a configuration parameter from the node */
    getName(parameter: number): Promise<MaybeNotKnown<string>>;
    /** Requests usage info for a configuration parameter from the node */
    getInfo(parameter: number): Promise<MaybeNotKnown<string>>;
    /**
     * This scans the node for the existing parameters. Found parameters will be reported
     * through the `value added` and `value updated` events.
     *
     * WARNING: This method throws for newer devices.
     *
     * WARNING: On nodes implementing V1 and V2, this process may take
     * **up to an hour**, depending on the configured timeout.
     *
     * WARNING: On nodes implementing V2, all parameters after 255 will be ignored.
     */
    scanParametersLegacy(): Promise<void>;
}
export declare class ConfigurationCC extends CommandClass {
    ccCommand: ConfigurationCommand;
    /** Applies configuration parameters from the node's provisioning entry, if any */
    private applyProvisioningConfigParameters;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    /**
     * Whether this node's param information was loaded from a config file.
     * If this is true, we don't trust what the node reports
     */
    protected paramExistsInConfigFile(ctx: GetValueDB & GetDeviceConfig, parameter: number, valueBitMask?: number): boolean;
    /**
     * **INTERNAL:** Returns the param info that was queried for this node. This returns the information that was returned by the node
     * and does not include partial parameters.
     */
    getQueriedParamInfos(ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): Record<number, ConfigurationMetadata>;
    /**
     * Returns stored config parameter metadata for all partial config params addressed with the given parameter number
     */
    getPartialParamInfos(ctx: GetValueDB, parameter: number): (ValueID & {
        metadata: ConfigurationMetadata;
    })[];
    /**
     * Computes the full value of a parameter after applying a partial param value
     */
    composePartialParamValue(ctx: GetValueDB, parameter: number, bitMask: number, partialValue: number): number;
    /**
     * Computes the full value of a parameter after applying multiple partial param values
     */
    composePartialParamValues(ctx: GetValueDB, parameter: number, partials: {
        bitMask: number;
        partialValue: number;
    }[]): number;
    /** Deserializes the config parameter info from a config file */
    deserializeParamInformationFromConfig(ctx: GetValueDB & GetDeviceConfig, config: ParamInfoMap): void;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey?: string | number): string | undefined;
    translateProperty(ctx: GetValueDB, property: string | number, propertyKey?: string | number): string;
}
/** @publicAPI */
export interface ConfigurationCCReportOptions {
    parameter: number;
    value: ConfigValue;
    valueSize: number;
    valueFormat?: ConfigValueFormat;
}
export declare class ConfigurationCCReport extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCReport;
    parameter: number;
    value: ConfigValue;
    valueSize: number;
    private valueFormat?;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ConfigurationCCGetOptions {
    parameter: number;
    /**
     * If this is `true`, responses with different parameters than expected are accepted
     * and treated as hints for the first parameter number.
     */
    allowUnexpectedResponse?: boolean;
}
export declare class ConfigurationCCGet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCGet;
    parameter: number;
    allowUnexpectedResponse: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ConfigurationCCSetOptions = {
    parameter: number;
    resetToDefault: true;
} | {
    parameter: number;
    resetToDefault?: false;
    valueSize: number;
    /** How the value is encoded. Defaults to SignedInteger */
    valueFormat?: ConfigValueFormat;
    value: ConfigValue;
};
export declare class ConfigurationCCSet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCSet;
    resetToDefault: boolean;
    parameter: number;
    valueSize: number | undefined;
    valueFormat: ConfigValueFormat | undefined;
    value: ConfigValue | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ConfigurationCCBulkSetOptions = {
    parameters: number[];
    handshake?: boolean;
} & ({
    resetToDefault: true;
} | {
    resetToDefault?: false;
    valueSize: number;
    valueFormat?: ConfigValueFormat;
    values: number[];
});
export declare class ConfigurationCCBulkSet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCBulkSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ConfigurationCCBulkSet;
    private _parameters;
    get parameters(): number[];
    private _resetToDefault;
    get resetToDefault(): boolean;
    private _valueSize;
    get valueSize(): number;
    private _valueFormat;
    get valueFormat(): ConfigValueFormat;
    private _values;
    get values(): number[];
    private _handshake;
    get handshake(): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ConfigurationCCBulkReportOptions {
    reportsToFollow: number;
    defaultValues: boolean;
    isHandshakeResponse: boolean;
    valueSize: number;
    values: Record<number, ConfigValue>;
}
export declare class ConfigurationCCBulkReport extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCBulkReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCBulkReport;
    persistValues(ctx: PersistValuesContext): boolean;
    reportsToFollow: number;
    defaultValues: boolean;
    isHandshakeResponse: boolean;
    valueSize: number;
    private _values;
    get values(): ReadonlyMap<number, ConfigValue>;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ConfigurationCCBulkGetOptions {
    parameters: number[];
}
export declare class ConfigurationCCBulkGet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCBulkGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ConfigurationCCBulkGet;
    private _parameters;
    get parameters(): number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
/** @publicAPI */
export interface ConfigurationCCNameReportOptions {
    parameter: number;
    name: string;
    reportsToFollow: number;
}
export declare class ConfigurationCCNameReport extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCNameReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCNameReport;
    readonly parameter: number;
    name: string;
    readonly reportsToFollow: number;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: ConfigurationCCNameReport[], _ctx: CCParsingContext): Promise<void>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ConfigurationCCNameGet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCNameGet;
    parameter: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
/** @publicAPI */
export interface ConfigurationCCInfoReportOptions {
    parameter: number;
    info: string;
    reportsToFollow: number;
}
export declare class ConfigurationCCInfoReport extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCInfoReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCInfoReport;
    readonly parameter: number;
    info: string;
    readonly reportsToFollow: number;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    getPartialCCSessionId(): Record<string, any> | undefined;
    expectMoreMessages(): boolean;
    mergePartialCCs(partials: ConfigurationCCInfoReport[], _ctx: CCParsingContext): Promise<void>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ConfigurationCCInfoGet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCInfoGet;
    parameter: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
/** @publicAPI */
export interface ConfigurationCCPropertiesReportOptions {
    parameter: number;
    valueSize: number;
    valueFormat: ConfigValueFormat;
    minValue?: ConfigValue;
    maxValue?: ConfigValue;
    defaultValue?: ConfigValue;
    nextParameter: number;
    altersCapabilities?: boolean;
    isReadonly?: boolean;
    isAdvanced?: boolean;
    noBulkSupport?: boolean;
}
export declare class ConfigurationCCPropertiesReport extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCPropertiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCPropertiesReport;
    persistValues(ctx: PersistValuesContext): boolean;
    parameter: number;
    valueSize: number;
    valueFormat: ConfigValueFormat;
    minValue: MaybeNotKnown<ConfigValue>;
    maxValue: MaybeNotKnown<ConfigValue>;
    defaultValue: MaybeNotKnown<ConfigValue>;
    nextParameter: number;
    altersCapabilities: MaybeNotKnown<boolean>;
    isReadonly: MaybeNotKnown<boolean>;
    isAdvanced: MaybeNotKnown<boolean>;
    noBulkSupport: MaybeNotKnown<boolean>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ConfigurationCCPropertiesGet extends ConfigurationCC {
    constructor(options: WithAddress<ConfigurationCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ConfigurationCCPropertiesGet;
    parameter: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ConfigurationCCDefaultReset extends ConfigurationCC {
}
//# sourceMappingURL=ConfigurationCC.d.ts.map