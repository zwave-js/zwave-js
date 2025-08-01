import type { SendCommand } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, type Duration, type EndpointId, type GetEndpoint, type GetNode, type GetSafeCCVersion, type GetSupportedCCVersion, type GetValueDB, type HostIDs, type ListenBehavior, type LogNode, type MaybeNotKnown, NODE_ID_BROADCAST, NODE_ID_BROADCAST_LR, type NodeId, type PhysicalNodes, type QueryNodeStatus, type SecurityManagers, type SendCommandOptions, type SupervisionResult, type SupportsCC, type TXReport, type ValueChangeOptions, type ValueDB, type ValueID, type VirtualEndpointId } from "@zwave-js/core";
import { type AllOrNone, type OnlyMethods } from "@zwave-js/shared";
import type { GetRefreshValueTimeouts, GetUserPreferences, SchedulePoll } from "./traits.js";
export type ValueIDProperties = Pick<ValueID, "property" | "propertyKey">;
/** Used to identify the method on the CC API class that handles setting values on nodes directly */
export declare const SET_VALUE: unique symbol;
export type SetValueImplementation = (property: ValueIDProperties, value: unknown, options?: SetValueAPIOptions) => Promise<SupervisionResult | undefined>;
export declare const SET_VALUE_HOOKS: unique symbol;
export type SetValueImplementationHooks = AllOrNone<{
    supervisionDelayedUpdates: boolean;
    supervisionOnSuccess: () => void | Promise<void>;
    supervisionOnFailure: () => void | Promise<void>;
}> & {
    optimisticallyUpdateRelatedValues?: (supervisedAndSuccessful: boolean) => void;
    forceVerifyChanges?: () => boolean;
    verifyChanges?: (result?: SupervisionResult) => void | Promise<void>;
};
export type SetValueImplementationHooksFactory = (property: ValueIDProperties, value: unknown, options?: SetValueAPIOptions) => SetValueImplementationHooks | undefined;
/**
 * A generic options bag for the `setValue` API.
 * Each implementation will choose the options that are relevant for it, so you can use the same options everywhere.
 * @publicAPI
 */
export type SetValueAPIOptions = Partial<ValueChangeOptions> & Pick<SendCommandOptions, "onProgress">;
/** Used to identify the method on the CC API class that handles polling values from nodes */
export declare const POLL_VALUE: unique symbol;
export type PollValueImplementation<T = unknown> = (property: ValueIDProperties) => Promise<T | undefined>;
export declare function throwUnsupportedProperty(cc: CommandClasses, property: string | number): never;
export declare function throwUnsupportedPropertyKey(cc: CommandClasses, property: string | number, propertyKey: string | number): never;
export declare function throwMissingPropertyKey(cc: CommandClasses, property: string | number): never;
export declare function throwWrongValueType(cc: CommandClasses, property: string | number, expectedType: string, receivedType: string): never;
export interface CCAPISchedulePollOptions {
    duration?: Duration;
    transition?: "fast" | "slow";
}
export type CCAPIHost<TNode extends CCAPINode = CCAPINode> = HostIDs & GetNode<TNode> & GetValueDB & GetSupportedCCVersion & GetSafeCCVersion & SecurityManagers & GetDeviceConfig & SendCommand & GetRefreshValueTimeouts & GetUserPreferences & SchedulePoll & LogNode;
export type CCAPINode = NodeId & ListenBehavior & QueryNodeStatus;
export type CCAPIEndpoint = ((EndpointId & ControlsCC) | (VirtualEndpointId & {
    node: PhysicalNodes<NodeId & SupportsCC & ControlsCC & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>;
})) & SupportsCC;
export type PhysicalCCAPIEndpoint = CCAPIEndpoint & EndpointId;
export type VirtualCCAPIEndpoint = CCAPIEndpoint & VirtualEndpointId;
/**
 * The base class for all CC APIs exposed via `Node.commandClasses.<CCName>`
 * @publicAPI
 */
export declare class CCAPI {
    protected readonly host: CCAPIHost;
    protected readonly endpoint: CCAPIEndpoint;
    constructor(host: CCAPIHost, endpoint: CCAPIEndpoint);
    static create<T extends CommandClasses>(ccId: T, host: CCAPIHost, endpoint: CCAPIEndpoint, requireSupport?: boolean): CommandClasses extends T ? CCAPI : CCToAPI<T>;
    /**
     * The identifier of the Command Class this API is for
     */
    readonly ccId: CommandClasses;
    protected get [SET_VALUE](): SetValueImplementation | undefined;
    /**
     * Can be used on supported CC APIs to set a CC value by property name (and optionally the property key).
     * **WARNING:** This function is NOT bound to an API instance. It must be called with the correct `this` context!
     */
    get setValue(): SetValueImplementation | undefined;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory | undefined;
    /**
     * Can be implemented by CC APIs to influence the behavior of the setValue API in regards to Supervision and verifying values.
     */
    get setValueHooks(): SetValueImplementationHooksFactory | undefined;
    /** Whether a successful setValue call should imply that the value was successfully updated */
    isSetValueOptimistic(valueId: ValueID): boolean;
    protected get [POLL_VALUE](): PollValueImplementation | undefined;
    /**
     * Can be used on supported CC APIs to poll a CC value by property name (and optionally the property key)
     * **WARNING:** This function is NOT bound to an API instance. It must be called with the correct `this` context!
     */
    get pollValue(): PollValueImplementation | undefined;
    /**
     * Schedules a value to be polled after a given time. Schedules are deduplicated on a per-property basis.
     * @returns `true` if the poll was scheduled, `false` otherwise
     */
    protected schedulePoll({ property, propertyKey }: ValueIDProperties, expectedValue: unknown, { duration, transition }?: CCAPISchedulePollOptions): boolean;
    /**
     * Retrieves the version of the given CommandClass this endpoint implements
     */
    get version(): number;
    /** Determines if this simplified API instance may be used. */
    isSupported(): boolean;
    /**
     * Determine whether the linked node supports a specific command of this command class.
     * {@link NOT_KNOWN} (`undefined`) means that the information has not been received yet
     */
    supportsCommand(command: number): MaybeNotKnown<boolean>;
    protected assertSupportsCommand(commandEnum: unknown, command: number): void;
    protected assertPhysicalEndpoint(endpoint: EndpointId | VirtualEndpointId): asserts endpoint is EndpointId;
    /** Returns the command options to use for sendCommand calls */
    protected get commandOptions(): SendCommandOptions;
    /** Creates an instance of this API, scoped to use the given options */
    withOptions(options: SendCommandOptions): this;
    /** Creates an instance of this API which (if supported) will return TX reports along with the result. */
    withTXReport<T extends this>(): WithTXReport<T>;
    protected isSinglecast(): this is this & {
        endpoint: PhysicalCCAPIEndpoint;
    };
    protected isMulticast(): this is this & {
        endpoint: VirtualCCAPIEndpoint & {
            nodeId: number[];
        };
    };
    protected isBroadcast(): this is this & {
        endpoint: VirtualCCAPIEndpoint & {
            nodeId: typeof NODE_ID_BROADCAST | typeof NODE_ID_BROADCAST_LR;
        };
    };
    /** Returns the value DB for this CC API's node (if it can be safely accessed) */
    protected tryGetValueDB(): ValueDB | undefined;
    /** Returns the value DB for this CC's node (or throws if it cannot be accessed) */
    protected getValueDB(): ValueDB;
}
/** A CC API that is only available for physical endpoints */
export declare class PhysicalCCAPI extends CCAPI {
    constructor(host: CCAPIHost, endpoint: CCAPIEndpoint);
    protected readonly endpoint: PhysicalCCAPIEndpoint;
}
export type APIConstructor<T extends CCAPI = CCAPI> = new (host: CCAPIHost, endpoint: CCAPIEndpoint) => T;
type CCNameMap = {
    "Alarm Sensor": typeof CommandClasses["Alarm Sensor"];
    Association: typeof CommandClasses["Association"];
    "Association Group Information": typeof CommandClasses["Association Group Information"];
    "Barrier Operator": typeof CommandClasses["Barrier Operator"];
    Basic: typeof CommandClasses["Basic"];
    "Basic Window Covering": typeof CommandClasses["Basic Window Covering"];
    Battery: typeof CommandClasses["Battery"];
    "Binary Sensor": typeof CommandClasses["Binary Sensor"];
    "Binary Switch": typeof CommandClasses["Binary Switch"];
    "CRC-16 Encapsulation": typeof CommandClasses["CRC-16 Encapsulation"];
    "Central Scene": typeof CommandClasses["Central Scene"];
    "Climate Control Schedule": typeof CommandClasses["Climate Control Schedule"];
    Clock: typeof CommandClasses["Clock"];
    "Color Switch": typeof CommandClasses["Color Switch"];
    Configuration: typeof CommandClasses["Configuration"];
    "Device Reset Locally": typeof CommandClasses["Device Reset Locally"];
    "Door Lock": typeof CommandClasses["Door Lock"];
    "Door Lock Logging": typeof CommandClasses["Door Lock Logging"];
    "Energy Production": typeof CommandClasses["Energy Production"];
    "Entry Control": typeof CommandClasses["Entry Control"];
    "Firmware Update Meta Data": typeof CommandClasses["Firmware Update Meta Data"];
    "Humidity Control Mode": typeof CommandClasses["Humidity Control Mode"];
    "Humidity Control Operating State": typeof CommandClasses["Humidity Control Operating State"];
    "Humidity Control Setpoint": typeof CommandClasses["Humidity Control Setpoint"];
    "Inclusion Controller": typeof CommandClasses["Inclusion Controller"];
    Indicator: typeof CommandClasses["Indicator"];
    Irrigation: typeof CommandClasses["Irrigation"];
    Language: typeof CommandClasses["Language"];
    Lock: typeof CommandClasses["Lock"];
    "Manufacturer Proprietary": typeof CommandClasses["Manufacturer Proprietary"];
    "Manufacturer Specific": typeof CommandClasses["Manufacturer Specific"];
    Meter: typeof CommandClasses["Meter"];
    "Multi Channel Association": typeof CommandClasses["Multi Channel Association"];
    "Multi Channel": typeof CommandClasses["Multi Channel"];
    "Multi Command": typeof CommandClasses["Multi Command"];
    "Multilevel Sensor": typeof CommandClasses["Multilevel Sensor"];
    "Multilevel Switch": typeof CommandClasses["Multilevel Switch"];
    "No Operation": typeof CommandClasses["No Operation"];
    "Node Naming and Location": typeof CommandClasses["Node Naming and Location"];
    Notification: typeof CommandClasses["Notification"];
    Powerlevel: typeof CommandClasses["Powerlevel"];
    Protection: typeof CommandClasses["Protection"];
    "Scene Activation": typeof CommandClasses["Scene Activation"];
    "Scene Actuator Configuration": typeof CommandClasses["Scene Actuator Configuration"];
    "Scene Controller Configuration": typeof CommandClasses["Scene Controller Configuration"];
    "Schedule Entry Lock": typeof CommandClasses["Schedule Entry Lock"];
    "Security 2": typeof CommandClasses["Security 2"];
    Security: typeof CommandClasses["Security"];
    "Sound Switch": typeof CommandClasses["Sound Switch"];
    Supervision: typeof CommandClasses["Supervision"];
    "Thermostat Fan Mode": typeof CommandClasses["Thermostat Fan Mode"];
    "Thermostat Fan State": typeof CommandClasses["Thermostat Fan State"];
    "Thermostat Mode": typeof CommandClasses["Thermostat Mode"];
    "Thermostat Operating State": typeof CommandClasses["Thermostat Operating State"];
    "Thermostat Setback": typeof CommandClasses["Thermostat Setback"];
    "Thermostat Setpoint": typeof CommandClasses["Thermostat Setpoint"];
    Time: typeof CommandClasses["Time"];
    "Time Parameters": typeof CommandClasses["Time Parameters"];
    "User Code": typeof CommandClasses["User Code"];
    Version: typeof CommandClasses["Version"];
    "Wake Up": typeof CommandClasses["Wake Up"];
    "Window Covering": typeof CommandClasses["Window Covering"];
    "Z-Wave Plus Info": typeof CommandClasses["Z-Wave Plus Info"];
};
export type CCToName<CC extends CommandClasses> = {
    [K in keyof CCNameMap]: CCNameMap[K] extends CC ? K : never;
}[keyof CCNameMap];
export type CCNameOrId = CommandClasses | Extract<keyof CCAPIs, string>;
export type CCToAPI<CC extends CCNameOrId> = CC extends CommandClasses ? CCToName<CC> extends keyof CCAPIs ? CCAPIs[CCToName<CC>] : never : CC extends keyof CCAPIs ? CCAPIs[CC] : never;
export type APIMethodsOf<CC extends CCNameOrId> = Omit<OnlyMethods<CCToAPI<CC>>, "ccId" | "getNode" | "tryGetNode" | "isSetValueOptimistic" | "isSupported" | "pollValue" | "setValue" | "version" | "supportsCommand" | "withOptions" | "withTXReport">;
export type OwnMethodsOf<API extends CCAPI> = Omit<OnlyMethods<API>, keyof OnlyMethods<CCAPI>>;
export type WrapWithTXReport<T> = [T] extends [Promise<infer U>] ? Promise<WrapWithTXReport<U>> : [T] extends [void] ? {
    txReport: TXReport | undefined;
} : {
    result: T;
    txReport: TXReport | undefined;
};
export type ReturnWithTXReport<T> = T extends (...args: any[]) => any ? (...args: Parameters<T>) => WrapWithTXReport<ReturnType<T>> : undefined;
export type WithTXReport<API extends CCAPI> = Omit<API, keyof OwnMethodsOf<API> | "withOptions" | "withTXReport" | "setValue"> & {
    [K in keyof OwnMethodsOf<API> | "setValue" | "pollValue"]: ReturnWithTXReport<API[K]>;
};
export declare function normalizeCCNameOrId(ccNameOrId: number | string): CommandClasses | undefined;
export interface CCAPIs {
    [Symbol.iterator](): Iterator<CCAPI>;
    "Alarm Sensor": import("../cc/AlarmSensorCC.js").AlarmSensorCCAPI;
    Association: import("../cc/AssociationCC.js").AssociationCCAPI;
    "Association Group Information": import("../cc/AssociationGroupInfoCC.js").AssociationGroupInfoCCAPI;
    "Barrier Operator": import("../cc/BarrierOperatorCC.js").BarrierOperatorCCAPI;
    Basic: import("../cc/BasicCC.js").BasicCCAPI;
    "Basic Window Covering": import("../cc/BasicWindowCoveringCC.js").BasicWindowCoveringCCAPI;
    Battery: import("../cc/BatteryCC.js").BatteryCCAPI;
    "Binary Sensor": import("../cc/BinarySensorCC.js").BinarySensorCCAPI;
    "Binary Switch": import("../cc/BinarySwitchCC.js").BinarySwitchCCAPI;
    "CRC-16 Encapsulation": import("../cc/CRC16CC.js").CRC16CCAPI;
    "Central Scene": import("../cc/CentralSceneCC.js").CentralSceneCCAPI;
    "Climate Control Schedule": import("../cc/ClimateControlScheduleCC.js").ClimateControlScheduleCCAPI;
    Clock: import("../cc/ClockCC.js").ClockCCAPI;
    "Color Switch": import("../cc/ColorSwitchCC.js").ColorSwitchCCAPI;
    Configuration: import("../cc/ConfigurationCC.js").ConfigurationCCAPI;
    "Device Reset Locally": import("../cc/DeviceResetLocallyCC.js").DeviceResetLocallyCCAPI;
    "Door Lock": import("../cc/DoorLockCC.js").DoorLockCCAPI;
    "Door Lock Logging": import("../cc/DoorLockLoggingCC.js").DoorLockLoggingCCAPI;
    "Energy Production": import("../cc/EnergyProductionCC.js").EnergyProductionCCAPI;
    "Entry Control": import("../cc/EntryControlCC.js").EntryControlCCAPI;
    "Firmware Update Meta Data": import("../cc/FirmwareUpdateMetaDataCC.js").FirmwareUpdateMetaDataCCAPI;
    "Humidity Control Mode": import("../cc/HumidityControlModeCC.js").HumidityControlModeCCAPI;
    "Humidity Control Operating State": import("../cc/HumidityControlOperatingStateCC.js").HumidityControlOperatingStateCCAPI;
    "Humidity Control Setpoint": import("../cc/HumidityControlSetpointCC.js").HumidityControlSetpointCCAPI;
    "Inclusion Controller": import("../cc/InclusionControllerCC.js").InclusionControllerCCAPI;
    Indicator: import("../cc/IndicatorCC.js").IndicatorCCAPI;
    Irrigation: import("../cc/IrrigationCC.js").IrrigationCCAPI;
    Language: import("../cc/LanguageCC.js").LanguageCCAPI;
    Lock: import("../cc/LockCC.js").LockCCAPI;
    "Manufacturer Proprietary": import("../cc/ManufacturerProprietaryCC.js").ManufacturerProprietaryCCAPI;
    "Manufacturer Specific": import("../cc/ManufacturerSpecificCC.js").ManufacturerSpecificCCAPI;
    Meter: import("../cc/MeterCC.js").MeterCCAPI;
    "Multi Channel Association": import("../cc/MultiChannelAssociationCC.js").MultiChannelAssociationCCAPI;
    "Multi Channel": import("../cc/MultiChannelCC.js").MultiChannelCCAPI;
    "Multi Command": import("../cc/MultiCommandCC.js").MultiCommandCCAPI;
    "Multilevel Sensor": import("../cc/MultilevelSensorCC.js").MultilevelSensorCCAPI;
    "Multilevel Switch": import("../cc/MultilevelSwitchCC.js").MultilevelSwitchCCAPI;
    "No Operation": import("../cc/NoOperationCC.js").NoOperationCCAPI;
    "Node Naming and Location": import("../cc/NodeNamingCC.js").NodeNamingAndLocationCCAPI;
    Notification: import("../cc/NotificationCC.js").NotificationCCAPI;
    Powerlevel: import("../cc/PowerlevelCC.js").PowerlevelCCAPI;
    Protection: import("../cc/ProtectionCC.js").ProtectionCCAPI;
    "Scene Activation": import("../cc/SceneActivationCC.js").SceneActivationCCAPI;
    "Scene Actuator Configuration": import("../cc/SceneActuatorConfigurationCC.js").SceneActuatorConfigurationCCAPI;
    "Scene Controller Configuration": import("../cc/SceneControllerConfigurationCC.js").SceneControllerConfigurationCCAPI;
    "Schedule Entry Lock": import("../cc/ScheduleEntryLockCC.js").ScheduleEntryLockCCAPI;
    "Security 2": import("../cc/Security2CC.js").Security2CCAPI;
    Security: import("../cc/SecurityCC.js").SecurityCCAPI;
    "Sound Switch": import("../cc/SoundSwitchCC.js").SoundSwitchCCAPI;
    Supervision: import("../cc/SupervisionCC.js").SupervisionCCAPI;
    "Thermostat Fan Mode": import("../cc/ThermostatFanModeCC.js").ThermostatFanModeCCAPI;
    "Thermostat Fan State": import("../cc/ThermostatFanStateCC.js").ThermostatFanStateCCAPI;
    "Thermostat Mode": import("../cc/ThermostatModeCC.js").ThermostatModeCCAPI;
    "Thermostat Operating State": import("../cc/ThermostatOperatingStateCC.js").ThermostatOperatingStateCCAPI;
    "Thermostat Setback": import("../cc/ThermostatSetbackCC.js").ThermostatSetbackCCAPI;
    "Thermostat Setpoint": import("../cc/ThermostatSetpointCC.js").ThermostatSetpointCCAPI;
    Time: import("../cc/TimeCC.js").TimeCCAPI;
    "Time Parameters": import("../cc/TimeParametersCC.js").TimeParametersCCAPI;
    "User Code": import("../cc/UserCodeCC.js").UserCodeCCAPI;
    Version: import("../cc/VersionCC.js").VersionCCAPI;
    "Wake Up": import("../cc/WakeUpCC.js").WakeUpCCAPI;
    "Window Covering": import("../cc/WindowCoveringCC.js").WindowCoveringCCAPI;
    "Z-Wave Plus Info": import("../cc/ZWavePlusCC.js").ZWavePlusCCAPI;
}
export {};
//# sourceMappingURL=API.d.ts.map