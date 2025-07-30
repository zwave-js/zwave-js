import { type GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type EndpointId, type GetValueDB, type ValueID } from "@zwave-js/core";
import { AlarmSensorType, BinarySensorType, ColorComponent, DeviceIdType, EnergyProductionParameter, RateType, ScheduleEntryLockScheduleKind, SubsystemType, SwitchType, ThermostatSetpointType, type ValveId, Weekday, WindowCoveringParameter } from "../lib/_Types.js";
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
}>;
export declare const AssociationCCValues: Readonly<{
    hasLifeline: {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "hasLifeline";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "hasLifeline";
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
    groupCount: {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "groupCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "groupCount";
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
    maxNodes: ((groupId: number) => {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "maxNodes";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "maxNodes";
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
    nodeIds: ((groupId: number) => {
        id: {
            readonly commandClass: CommandClasses.Association;
            readonly property: "nodeIds";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Association;
            readonly endpoint: number;
            readonly property: "nodeIds";
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
}>;
export declare const AssociationGroupInfoCCValues: Readonly<{
    hasDynamicInfo: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "hasDynamicInfo";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "hasDynamicInfo";
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
    groupName: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "name";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "name";
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
    groupInfo: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "info";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "info";
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
    commands: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly property: "issuedCommands";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Association Group Information"];
            readonly endpoint: number;
            readonly property: "issuedCommands";
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
}>;
export declare const BarrierOperatorCCValues: Readonly<{
    supportedSubsystemTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "supportedSubsystemTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "supportedSubsystemTypes";
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
    position: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "position";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "position";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Barrier Position";
            readonly unit: "%";
            readonly max: 100;
            readonly writeable: false;
            readonly min: 0;
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
    targetState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "targetState";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "targetState";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target Barrier State";
            readonly states: Record<number, string>;
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
    currentState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "currentState";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "currentState";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current Barrier State";
            readonly states: Record<number, string>;
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
    signalingState: ((subsystemType: SubsystemType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly property: "signalingState";
            readonly propertyKey: SubsystemType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
            readonly endpoint: number;
            readonly property: "signalingState";
            readonly propertyKey: SubsystemType;
        };
        readonly meta: {
            readonly label: `Signaling State (${string})`;
            readonly states: Record<number, string>;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
export declare const BasicCCValues: Readonly<{
    currentValue: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "currentValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "currentValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current value";
            readonly writeable: false;
            readonly max: 99;
            readonly min: 0;
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
    targetValue: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "targetValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "targetValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target value";
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
    duration: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration";
            readonly writeable: false;
            readonly type: "duration";
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
    restorePrevious: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "restorePrevious";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "restorePrevious";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Restore previous value";
            readonly states: {
                readonly true: "Restore";
            };
            readonly readable: false;
            readonly type: "boolean";
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
    compatEvent: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "event";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "event";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Event value";
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
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: false;
        };
    };
}>;
export declare const BasicWindowCoveringCCValues: Readonly<{
    levelChangeUp: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly property: "levelChangeUp";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeUp";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Open";
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly readable: false;
            readonly type: "boolean";
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
    levelChangeDown: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly property: "levelChangeDown";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeDown";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Close";
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly readable: false;
            readonly type: "boolean";
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
}>;
export declare const BatteryCCValues: Readonly<{
    level: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "level";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "level";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Battery level";
            readonly writeable: false;
            readonly min: 0;
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
    maximumCapacity: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "maximumCapacity";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "maximumCapacity";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Maximum capacity";
            readonly writeable: false;
            readonly min: 0;
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
    temperature: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "temperature";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "temperature";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Temperature";
            readonly unit: "°C";
            readonly writeable: false;
            readonly min: -128;
            readonly max: 127;
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
    chargingStatus: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "chargingStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "chargingStatus";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Charging status";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
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
    rechargeable: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "rechargeable";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "rechargeable";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Rechargeable";
            readonly writeable: false;
            readonly type: "boolean";
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
    backup: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "backup";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "backup";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Used as backup";
            readonly writeable: false;
            readonly type: "boolean";
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
    overheating: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "overheating";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "overheating";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Overheating";
            readonly writeable: false;
            readonly type: "boolean";
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
    lowFluid: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "lowFluid";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "lowFluid";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Fluid is low";
            readonly writeable: false;
            readonly type: "boolean";
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
    rechargeOrReplace: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "rechargeOrReplace";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "rechargeOrReplace";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Recharge or replace";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
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
    disconnected: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "disconnected";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "disconnected";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Battery is disconnected";
            readonly writeable: false;
            readonly type: "boolean";
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
    lowTemperatureStatus: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "lowTemperatureStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "lowTemperatureStatus";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Battery temperature is low";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
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
}>;
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
export declare const BinarySwitchCCValues: Readonly<{
    currentValue: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly property: "currentValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly endpoint: number;
            readonly property: "currentValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current value";
            readonly writeable: false;
            readonly type: "boolean";
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
    targetValue: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly property: "targetValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly endpoint: number;
            readonly property: "targetValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target value";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly type: "boolean";
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
    duration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration";
            readonly writeable: false;
            readonly type: "duration";
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
}>;
export declare const CentralSceneCCValues: Readonly<{
    sceneCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "sceneCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "sceneCount";
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
    supportsSlowRefresh: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "supportsSlowRefresh";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "supportsSlowRefresh";
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
    supportedKeyAttributes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "supportedKeyAttributes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "supportedKeyAttributes";
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
    slowRefresh: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "slowRefresh";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "slowRefresh";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Send held down notifications at a slow rate";
            readonly description: "When this is true, KeyHeldDown notifications are sent every 55s. When this is false, the notifications are sent every 200ms.";
            readonly type: "boolean";
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
    scene: ((sceneNumber: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "scene";
            readonly propertyKey: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "scene";
            readonly propertyKey: string;
        };
        readonly meta: {
            readonly label: `Scene ${string}`;
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
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare const ClimateControlScheduleCCValues: Readonly<{
    overrideType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly property: "overrideType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly endpoint: number;
            readonly property: "overrideType";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Override type";
            readonly states: Record<number, string>;
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
    overrideState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly property: "overrideState";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly endpoint: number;
            readonly property: "overrideState";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Override state";
            readonly min: -12.8;
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
    schedule: ((weekday: Weekday) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly property: "schedule";
            readonly propertyKey: Weekday;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
            readonly endpoint: number;
            readonly property: "schedule";
            readonly propertyKey: Weekday;
        };
        readonly meta: {
            readonly label: `Schedule (${string})`;
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
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
export declare const ColorSwitchCCValues: Readonly<{
    supportedColorComponents: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "supportedColorComponents";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "supportedColorComponents";
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
    supportsHexColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "supportsHexColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "supportsHexColor";
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
    currentColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "currentColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "currentColor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current color";
            readonly writeable: false;
            readonly type: "any";
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
    targetColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "targetColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "targetColor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target color";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly type: "any";
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
    duration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration";
            readonly writeable: false;
            readonly type: "duration";
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
    hexColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "hexColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "hexColor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly minLength: 6;
            readonly maxLength: 7;
            readonly label: "RGB Color";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly type: "color";
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
    currentColorChannel: ((component: ColorComponent) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "currentColor";
            readonly propertyKey: ColorComponent;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "currentColor";
            readonly propertyKey: ColorComponent;
        };
        readonly meta: {
            readonly label: `Current value (${string})`;
            readonly description: `The current value of the ${string} channel.`;
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
    targetColorChannel: ((component: ColorComponent) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "targetColor";
            readonly propertyKey: ColorComponent;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "targetColor";
            readonly propertyKey: ColorComponent;
        };
        readonly meta: {
            readonly label: `Target value (${string})`;
            readonly description: `The target value of the ${string} channel.`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
export declare const DoorLockCCValues: Readonly<{
    targetMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "targetMode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "targetMode";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target lock mode";
            readonly states: Record<number, string>;
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
    currentMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "currentMode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "currentMode";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current lock mode";
            readonly states: Record<number, string>;
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
    duration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration until target lock mode";
            readonly writeable: false;
            readonly type: "duration";
            readonly readable: true;
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
    supportedOutsideHandles: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "supportedOutsideHandles";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "supportedOutsideHandles";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    outsideHandlesCanOpenDoorConfiguration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "outsideHandlesCanOpenDoorConfiguration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "outsideHandlesCanOpenDoorConfiguration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Which outside handles can open the door (configuration)";
            readonly type: "any";
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
    outsideHandlesCanOpenDoor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "outsideHandlesCanOpenDoor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "outsideHandlesCanOpenDoor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Which outside handles can open the door (actual status)";
            readonly writeable: false;
            readonly type: "any";
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
    supportedInsideHandles: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "supportedInsideHandles";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "supportedInsideHandles";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    insideHandlesCanOpenDoorConfiguration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "insideHandlesCanOpenDoorConfiguration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "insideHandlesCanOpenDoorConfiguration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Which inside handles can open the door (configuration)";
            readonly type: "any";
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
    insideHandlesCanOpenDoor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "insideHandlesCanOpenDoor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "insideHandlesCanOpenDoor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Which inside handles can open the door (actual status)";
            readonly writeable: false;
            readonly type: "any";
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
    operationType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "operationType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "operationType";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Lock operation type";
            readonly states: Record<number, string>;
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
    lockTimeoutConfiguration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "lockTimeoutConfiguration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "lockTimeoutConfiguration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Duration of timed mode in seconds";
            readonly min: 0;
            readonly max: 65535;
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
    lockTimeout: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "lockTimeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "lockTimeout";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Seconds until lock mode times out";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
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
    autoRelockSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "autoRelockSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "autoRelockSupported";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    autoRelockTime: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "autoRelockTime";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "autoRelockTime";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Duration in seconds until lock returns to secure state";
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateAutoRelockConfigValue;
        };
    };
    holdAndReleaseSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "holdAndReleaseSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "holdAndReleaseSupported";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    holdAndReleaseTime: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "holdAndReleaseTime";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "holdAndReleaseTime";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Duration in seconds the latch stays retracted";
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateHoldAndReleaseConfigValue;
        };
    };
    twistAssistSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "twistAssistSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "twistAssistSupported";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    twistAssist: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "twistAssist";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "twistAssist";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Twist Assist enabled";
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateTwistAssistConfigValue;
        };
    };
    blockToBlockSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "blockToBlockSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "blockToBlockSupported";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    blockToBlock: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "blockToBlock";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "blockToBlock";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Block-to-block functionality enabled";
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateBlockToBlockConfigValue;
        };
    };
    latchSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "latchSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "latchSupported";
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
    latchStatus: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "latchStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "latchStatus";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current status of the latch";
            readonly writeable: false;
            readonly type: "any";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateLatchStatusValue;
        };
    };
    boltSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "boltSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "boltSupported";
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
    boltStatus: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "boltStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "boltStatus";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current status of the bolt";
            readonly writeable: false;
            readonly type: "any";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateBoltStatusValue;
        };
    };
    doorSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "doorSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "doorSupported";
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
    doorStatus: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "doorStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "doorStatus";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current status of the door";
            readonly writeable: false;
            readonly type: "any";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: typeof shouldAutoCreateDoorStatusValue;
        };
    };
}>;
declare function shouldAutoCreateAutoRelockConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
declare function shouldAutoCreateHoldAndReleaseConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
declare function shouldAutoCreateTwistAssistConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
declare function shouldAutoCreateBlockToBlockConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
declare function shouldAutoCreateLatchStatusValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
declare function shouldAutoCreateBoltStatusValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
declare function shouldAutoCreateDoorStatusValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare const DoorLockLoggingCCValues: Readonly<{
    recordsCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock Logging"];
            readonly property: "recordsCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock Logging"];
            readonly endpoint: number;
            readonly property: "recordsCount";
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
}>;
export declare const EnergyProductionCCValues: Readonly<{
    value: ((parameter: EnergyProductionParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Energy Production"];
            readonly property: "value";
            readonly propertyKey: EnergyProductionParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Energy Production"];
            readonly endpoint: number;
            readonly property: "value";
            readonly propertyKey: EnergyProductionParameter;
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
        is: (valueId: ValueID) => boolean;
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
        is: (valueId: ValueID) => boolean;
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
}>;
export declare const FirmwareUpdateMetaDataCCValues: Readonly<{
    supportsActivation: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "supportsActivation";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "supportsActivation";
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
    firmwareUpgradable: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "firmwareUpgradable";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "firmwareUpgradable";
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
    additionalFirmwareIDs: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "additionalFirmwareIDs";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "additionalFirmwareIDs";
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
    continuesToFunction: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "continuesToFunction";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "continuesToFunction";
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
    supportsResuming: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "supportsResuming";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "supportsResuming";
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
    supportsNonSecureTransfer: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "supportsNonSecureTransfer";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "supportsNonSecureTransfer";
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
}>;
export declare const HumidityControlModeCCValues: Readonly<{
    mode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly property: "mode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly endpoint: number;
            readonly property: "mode";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Humidity control mode";
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
    supportedModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly property: "supportedModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
            readonly endpoint: number;
            readonly property: "supportedModes";
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
}>;
export declare const HumidityControlOperatingStateCCValues: Readonly<{
    state: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Operating State"];
            readonly property: "state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Operating State"];
            readonly endpoint: number;
            readonly property: "state";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Humidity control operating state";
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
}>;
export declare const HumidityControlSetpointCCValues: Readonly<{
    supportedSetpointTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly property: "supportedSetpointTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly endpoint: number;
            readonly property: "supportedSetpointTypes";
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
    setpoint: ((setpointType: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly property: "setpoint";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly endpoint: number;
            readonly property: "setpoint";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Setpoint (${string})`;
            readonly ccSpecific: {
                readonly setpointType: number;
            };
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    setpointScale: ((setpointType: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly property: "setpointScale";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
            readonly endpoint: number;
            readonly property: "setpointScale";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Setpoint scale (${string})`;
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
}>;
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
export declare const IrrigationCCValues: Readonly<{
    numValves: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "numValves";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "numValves";
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
    numValveTables: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "numValveTables";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "numValveTables";
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
    supportsMasterValve: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "supportsMasterValve";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "supportsMasterValve";
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
    maxValveTableSize: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "maxValveTableSize";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "maxValveTableSize";
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
    systemVoltage: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "systemVoltage";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "systemVoltage";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "System voltage";
            readonly unit: "V";
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
    masterValveDelay: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "masterValveDelay";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "masterValveDelay";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Master valve delay";
            readonly description: "The delay between turning on the master valve and turning on any zone valve";
            readonly unit: "seconds";
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
    flowSensorActive: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "flowSensorActive";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "flowSensorActive";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Flow sensor active";
            readonly writeable: false;
            readonly type: "boolean";
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
    pressureSensorActive: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "pressureSensorActive";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "pressureSensorActive";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Pressure sensor active";
            readonly writeable: false;
            readonly type: "boolean";
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
    rainSensorActive: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "rainSensorActive";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "rainSensorActive";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Rain sensor attached and active";
            readonly writeable: false;
            readonly type: "boolean";
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
    rainSensorPolarity: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "rainSensorPolarity";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "rainSensorPolarity";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Rain sensor polarity";
            readonly min: 0;
            readonly max: 1;
            readonly states: Record<number, string>;
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
    moistureSensorActive: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "moistureSensorActive";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "moistureSensorActive";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Moisture sensor attached and active";
            readonly writeable: false;
            readonly type: "boolean";
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
    moistureSensorPolarity: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "moistureSensorPolarity";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "moistureSensorPolarity";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Moisture sensor polarity";
            readonly min: 0;
            readonly max: 1;
            readonly states: Record<number, string>;
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
    flow: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "flow";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "flow";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Flow";
            readonly unit: "l/h";
            readonly writeable: false;
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
    pressure: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "pressure";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "pressure";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Pressure";
            readonly unit: "kPa";
            readonly writeable: false;
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
    shutoffDuration: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "shutoffDuration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "shutoffDuration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining shutoff duration";
            readonly unit: "hours";
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
    errorNotProgrammed: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "errorNotProgrammed";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "errorNotProgrammed";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Error: device not programmed";
            readonly writeable: false;
            readonly type: "boolean";
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
    errorEmergencyShutdown: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "errorEmergencyShutdown";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "errorEmergencyShutdown";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Error: emergency shutdown";
            readonly writeable: false;
            readonly type: "boolean";
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
    errorHighPressure: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "errorHighPressure";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "errorHighPressure";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Error: high pressure";
            readonly writeable: false;
            readonly type: "boolean";
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
    highPressureThreshold: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "highPressureThreshold";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "highPressureThreshold";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "High pressure threshold";
            readonly unit: "kPa";
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
    errorLowPressure: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "errorLowPressure";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "errorLowPressure";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Error: low pressure";
            readonly writeable: false;
            readonly type: "boolean";
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
    lowPressureThreshold: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "lowPressureThreshold";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "lowPressureThreshold";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Low pressure threshold";
            readonly unit: "kPa";
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
    errorValve: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "errorValve";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "errorValve";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Error: valve reporting error";
            readonly writeable: false;
            readonly type: "boolean";
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
    masterValveOpen: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "masterValveOpen";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "masterValveOpen";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Master valve is open";
            readonly writeable: false;
            readonly type: "boolean";
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
    firstOpenZoneId: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "firstOpenZoneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "firstOpenZoneId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "First open zone valve ID";
            readonly writeable: false;
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
    shutoffSystem: {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: "shutoff";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: "shutoff";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Shutoff system";
            readonly states: {
                readonly true: "Shutoff";
            };
            readonly readable: false;
            readonly type: "boolean";
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
    valveConnected: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "valveConnected";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "valveConnected";
        };
        readonly meta: {
            readonly label: `${string}: Connected`;
            readonly writeable: false;
            readonly type: "boolean";
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
    nominalCurrent: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "nominalCurrent";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "nominalCurrent";
        };
        readonly meta: {
            readonly label: `${string}: Nominal current`;
            readonly unit: "mA";
            readonly writeable: false;
            readonly type: "boolean";
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
    nominalCurrentHighThreshold: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "nominalCurrentHighThreshold";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "nominalCurrentHighThreshold";
        };
        readonly meta: {
            readonly label: `${string}: Nominal current - high threshold`;
            readonly min: 0;
            readonly max: 2550;
            readonly unit: "mA";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    nominalCurrentLowThreshold: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "nominalCurrentLowThreshold";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "nominalCurrentLowThreshold";
        };
        readonly meta: {
            readonly label: `${string}: Nominal current - low threshold`;
            readonly min: 0;
            readonly max: 2550;
            readonly unit: "mA";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    errorShortCircuit: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "errorShortCircuit";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "errorShortCircuit";
        };
        readonly meta: {
            readonly label: `${string}: Error - Short circuit detected`;
            readonly writeable: false;
            readonly type: "boolean";
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
    errorHighCurrent: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "errorHighCurrent";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "errorHighCurrent";
        };
        readonly meta: {
            readonly label: `${string}: Error - Current above high threshold`;
            readonly writeable: false;
            readonly type: "boolean";
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
    errorLowCurrent: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "errorLowCurrent";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "errorLowCurrent";
        };
        readonly meta: {
            readonly label: `${string}: Error - Current below low threshold`;
            readonly writeable: false;
            readonly type: "boolean";
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
    maximumFlow: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "maximumFlow";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "maximumFlow";
        };
        readonly meta: {
            readonly label: `${string}: Maximum flow`;
            readonly min: 0;
            readonly unit: "l/h";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    errorMaximumFlow: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "errorMaximumFlow";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "errorMaximumFlow";
        };
        readonly meta: {
            readonly label: `${string}: Error - Maximum flow detected`;
            readonly writeable: false;
            readonly type: "boolean";
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
    highFlowThreshold: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "highFlowThreshold";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "highFlowThreshold";
        };
        readonly meta: {
            readonly label: `${string}: High flow threshold`;
            readonly min: 0;
            readonly unit: "l/h";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    errorHighFlow: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "errorHighFlow";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "errorHighFlow";
        };
        readonly meta: {
            readonly label: `${string}: Error - Flow above high threshold`;
            readonly writeable: false;
            readonly type: "boolean";
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
    lowFlowThreshold: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "lowFlowThreshold";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "lowFlowThreshold";
        };
        readonly meta: {
            readonly label: `${string}: Low flow threshold`;
            readonly min: 0;
            readonly unit: "l/h";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    errorLowFlow: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "errorLowFlow";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "errorLowFlow";
        };
        readonly meta: {
            readonly label: `${string}: Error - Flow below high threshold`;
            readonly writeable: false;
            readonly type: "boolean";
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
    useRainSensor: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "useRainSensor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "useRainSensor";
        };
        readonly meta: {
            readonly label: `${string}: Use rain sensor`;
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
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
    useMoistureSensor: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "useMoistureSensor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "useMoistureSensor";
        };
        readonly meta: {
            readonly label: `${string}: Use moisture sensor`;
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
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
    valveRunDuration: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "duration";
        };
        readonly meta: {
            readonly label: `${string}: Run duration`;
            readonly min: 1;
            readonly unit: "s";
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    valveRunStartStop: ((valveId: ValveId) => {
        id: {
            readonly commandClass: CommandClasses.Irrigation;
            readonly property: ValveId;
            readonly propertyKey: "startStop";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Irrigation;
            readonly endpoint: number;
            readonly property: ValveId;
            readonly propertyKey: "startStop";
        };
        readonly meta: {
            readonly label: `${string}: Start/Stop`;
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
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
export declare const LanguageCCValues: Readonly<{
    language: {
        id: {
            readonly commandClass: CommandClasses.Language;
            readonly property: "language";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Language;
            readonly endpoint: number;
            readonly property: "language";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Language code";
            readonly writeable: false;
            readonly type: "string";
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
    country: {
        id: {
            readonly commandClass: CommandClasses.Language;
            readonly property: "country";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Language;
            readonly endpoint: number;
            readonly property: "country";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Country code";
            readonly writeable: false;
            readonly type: "string";
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
}>;
export declare const LockCCValues: Readonly<{
    locked: {
        id: {
            readonly commandClass: CommandClasses.Lock;
            readonly property: "locked";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Lock;
            readonly endpoint: number;
            readonly property: "locked";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Locked";
            readonly description: "Whether the lock is locked";
            readonly type: "boolean";
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
}>;
export declare const ManufacturerSpecificCCValues: Readonly<{
    manufacturerId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "manufacturerId";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: 0;
            readonly property: "manufacturerId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Manufacturer ID";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    productType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "productType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: 0;
            readonly property: "productType";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Product type";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    productId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "productId";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: 0;
            readonly property: "productId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Product ID";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    deviceId: ((type: DeviceIdType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "deviceId";
            readonly propertyKey: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: number;
            readonly property: "deviceId";
            readonly propertyKey: string;
        };
        readonly meta: {
            readonly label: `Device ID (${string})`;
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
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
}>;
export declare const MeterCCValues: Readonly<{
    type: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "type";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "type";
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
    supportsReset: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "supportsReset";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "supportsReset";
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
    supportedScales: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "supportedScales";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "supportedScales";
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
    supportedRateTypes: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "supportedRateTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "supportedRateTypes";
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
    resetAll: {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "reset";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "reset";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Reset accumulated values";
            readonly states: {
                readonly true: "Reset";
            };
            readonly readable: false;
            readonly type: "boolean";
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
    resetSingle: ((meterType: number, rateType: RateType, scale: number) => {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "reset";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "reset";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Reset (${string})` | `Reset (Consumption, ${string})` | `Reset (Production, ${string})`;
            readonly states: {
                readonly true: "Reset";
            };
            readonly ccSpecific: {
                readonly meterType: number;
                readonly rateType: RateType;
                readonly scale: number;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
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
    value: ((meterType: number, rateType: RateType, scale: number) => {
        id: {
            readonly commandClass: CommandClasses.Meter;
            readonly property: "value";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Meter;
            readonly endpoint: number;
            readonly property: "value";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly ccSpecific: {
                readonly meterType: number;
                readonly rateType: RateType;
                readonly scale: number;
            };
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
export declare const MultiChannelAssociationCCValues: Readonly<{
    groupCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "groupCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly endpoint: number;
            readonly property: "groupCount";
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
    maxNodes: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "maxNodes";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly endpoint: number;
            readonly property: "maxNodes";
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
    nodeIds: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "nodeIds";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly endpoint: number;
            readonly property: "nodeIds";
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
    endpoints: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly property: "endpoints";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
            readonly endpoint: number;
            readonly property: "endpoints";
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
}>;
export declare const MultiChannelCCValues: Readonly<{
    endpointIndizes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "endpointIndizes";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "endpointIndizes";
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
    individualEndpointCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "individualCount";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "individualCount";
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
    aggregatedEndpointCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "aggregatedCount";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "aggregatedCount";
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
    endpointCountIsDynamic: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "countIsDynamic";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "countIsDynamic";
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
    endpointsHaveIdenticalCapabilities: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "identicalCapabilities";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: 0;
            readonly property: "identicalCapabilities";
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
    endpointCCs: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "commandClasses";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: number;
            readonly property: "commandClasses";
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
    endpointDeviceClass: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "deviceClass";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: number;
            readonly property: "deviceClass";
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
    aggregatedEndpointMembers: ((endpointIndex: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly property: "members";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multi Channel"];
            readonly endpoint: number;
            readonly property: "members";
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
}>;
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
export declare const MultilevelSwitchCCValues: Readonly<{
    currentValue: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "currentValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "currentValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current value";
            readonly writeable: false;
            readonly max: 99;
            readonly min: 0;
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
    targetValue: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "targetValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "targetValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target value";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly max: 99;
            readonly min: 0;
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
    duration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration";
            readonly writeable: false;
            readonly type: "duration";
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
    restorePrevious: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "restorePrevious";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "restorePrevious";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Restore previous value";
            readonly states: {
                readonly true: "Restore";
            };
            readonly readable: false;
            readonly type: "boolean";
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
    compatEvent: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "event";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "event";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Event value";
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
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: (applHost: GetValueDB & GetDeviceConfig, endpoint: EndpointId) => boolean;
        };
    };
    switchType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "switchType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "switchType";
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
    superviseStartStopLevelChange: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "superviseStartStopLevelChange";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: 0;
            readonly property: "superviseStartStopLevelChange";
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
    levelChangeUp: ((switchType: SwitchType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: `Perform a level change (${string})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly switchType: SwitchType;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
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
    levelChangeDown: ((switchType: SwitchType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: `Perform a level change (${string})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly switchType: SwitchType;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
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
export declare const NodeNamingAndLocationCCValues: Readonly<{
    name: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly property: "name";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly endpoint: 0;
            readonly property: "name";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Node name";
            readonly type: "string";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    location: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly property: "location";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
            readonly endpoint: 0;
            readonly property: "location";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Node location";
            readonly type: "string";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
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
            readonly autoCreate: typeof shouldAutoCreateSimpleDoorSensorValue;
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
declare function shouldAutoCreateSimpleDoorSensorValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare const ProtectionCCValues: Readonly<{
    exclusiveControlNodeId: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "exclusiveControlNodeId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "exclusiveControlNodeId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly min: 1;
            readonly max: 232;
            readonly label: "Node ID with exclusive control";
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    localProtectionState: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "local";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "local";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Local protection state";
            readonly states: Record<number, string>;
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
    rfProtectionState: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "rf";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "rf";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "RF protection state";
            readonly states: Record<number, string>;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    timeout: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "timeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "timeout";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "RF protection timeout";
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    supportsExclusiveControl: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportsExclusiveControl";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportsExclusiveControl";
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
    supportsTimeout: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportsTimeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportsTimeout";
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
    supportedLocalStates: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportedLocalStates";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportedLocalStates";
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
    supportedRFStates: {
        id: {
            readonly commandClass: CommandClasses.Protection;
            readonly property: "supportedRFStates";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Protection;
            readonly endpoint: number;
            readonly property: "supportedRFStates";
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
}>;
export declare const SceneActivationCCValues: Readonly<{
    sceneId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly property: "sceneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly endpoint: number;
            readonly property: "sceneId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly min: 1;
            readonly label: "Scene ID";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    dimmingDuration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly property: "dimmingDuration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly endpoint: number;
            readonly property: "dimmingDuration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Dimming duration";
            readonly type: "duration";
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
}>;
export declare const SceneActuatorConfigurationCCValues: Readonly<{
    level: ((sceneId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly property: "level";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly endpoint: number;
            readonly property: "level";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Level (${number})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    dimmingDuration: ((sceneId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly endpoint: number;
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Dimming duration (${number})`;
            readonly type: "duration";
            readonly readable: true;
            readonly writeable: true;
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
export declare const SceneControllerConfigurationCCValues: Readonly<{
    sceneId: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly property: "sceneId";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly endpoint: number;
            readonly property: "sceneId";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Associated Scene ID (${number})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    dimmingDuration: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly endpoint: number;
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Dimming duration (${number})`;
            readonly type: "duration";
            readonly readable: true;
            readonly writeable: true;
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
export declare const ScheduleEntryLockCCValues: Readonly<{
    numWeekDaySlots: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "numWeekDaySlots";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "numWeekDaySlots";
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
    numYearDaySlots: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "numYearDaySlots";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "numYearDaySlots";
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
    numDailyRepeatingSlots: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "numDailyRepeatingSlots";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "numDailyRepeatingSlots";
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
    userEnabled: ((userId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "userEnabled";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "userEnabled";
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
    scheduleKind: ((userId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "scheduleKind";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "scheduleKind";
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
    schedule: ((scheduleKind: ScheduleEntryLockScheduleKind, userId: number, slotId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly property: "schedule";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
            readonly endpoint: number;
            readonly property: "schedule";
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
}>;
export declare const SoundSwitchCCValues: Readonly<{
    volume: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "volume";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "volume";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly min: 0;
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Volume";
            readonly allowManualEntry: true;
            readonly states: {
                readonly 0: "default";
            };
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
    toneId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "toneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "toneId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Play Tone";
            readonly valueChangeOptions: readonly ["volume"];
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
    defaultVolume: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "defaultVolume";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "defaultVolume";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly min: 0;
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Default volume";
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
    defaultToneId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "defaultToneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "defaultToneId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly min: 1;
            readonly max: 254;
            readonly label: "Default tone ID";
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
}>;
export declare const SupervisionCCValues: Readonly<{
    ccSupported: ((ccId: CommandClasses) => {
        id: {
            readonly commandClass: CommandClasses.Supervision;
            readonly property: "ccSupported";
            readonly propertyKey: CommandClasses;
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Supervision;
            readonly endpoint: 0;
            readonly property: "ccSupported";
            readonly propertyKey: CommandClasses;
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
}>;
export declare const ThermostatFanModeCCValues: Readonly<{
    turnedOff: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly property: "off";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly endpoint: number;
            readonly property: "off";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Thermostat fan turned off";
            readonly type: "boolean";
            readonly readable: true;
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
    fanMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly property: "mode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly endpoint: number;
            readonly property: "mode";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Thermostat fan mode";
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
    supportedFanModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly property: "supportedModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
            readonly endpoint: number;
            readonly property: "supportedModes";
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
}>;
export declare const ThermostatFanStateCCValues: Readonly<{
    fanState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan State"];
            readonly property: "state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Fan State"];
            readonly endpoint: number;
            readonly property: "state";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Thermostat fan state";
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
}>;
export declare const ThermostatModeCCValues: Readonly<{
    thermostatMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly property: "mode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly endpoint: number;
            readonly property: "mode";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly states: Record<number, string>;
            readonly label: "Thermostat mode";
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
    manufacturerData: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly property: "manufacturerData";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly endpoint: number;
            readonly property: "manufacturerData";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Manufacturer data";
            readonly writeable: false;
            readonly type: "buffer";
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
    supportedModes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly property: "supportedModes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
            readonly endpoint: number;
            readonly property: "supportedModes";
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
}>;
export declare const ThermostatOperatingStateCCValues: Readonly<{
    operatingState: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Operating State"];
            readonly property: "state";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Operating State"];
            readonly endpoint: number;
            readonly property: "state";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Operating state";
            readonly states: Record<number, string>;
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
}>;
export declare const ThermostatSetpointCCValues: Readonly<{
    supportedSetpointTypes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly property: "supportedSetpointTypes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly endpoint: number;
            readonly property: "supportedSetpointTypes";
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
    setpoint: ((setpointType: ThermostatSetpointType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly property: "setpoint";
            readonly propertyKey: ThermostatSetpointType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly endpoint: number;
            readonly property: "setpoint";
            readonly propertyKey: ThermostatSetpointType;
        };
        readonly meta: {
            readonly label: `Setpoint (${string})`;
            readonly ccSpecific: {
                readonly setpointType: ThermostatSetpointType;
            };
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
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
    setpointScale: ((setpointType: ThermostatSetpointType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly property: "setpointScale";
            readonly propertyKey: ThermostatSetpointType;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
            readonly endpoint: number;
            readonly property: "setpointScale";
            readonly propertyKey: ThermostatSetpointType;
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
}>;
export declare const TimeParametersCCValues: Readonly<{
    dateAndTime: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Time Parameters"];
            readonly property: "dateAndTime";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Time Parameters"];
            readonly endpoint: number;
            readonly property: "dateAndTime";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Date and Time";
            readonly type: "any";
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
}>;
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
        is: (valueId: ValueID) => boolean;
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
        is: (valueId: ValueID) => boolean;
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
        is: (valueId: ValueID) => boolean;
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
export declare const VersionCCValues: Readonly<{
    firmwareVersions: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "firmwareVersions";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "firmwareVersions";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly type: "string[]";
            readonly label: "Z-Wave chip firmware versions";
            readonly writeable: false;
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    libraryType: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "libraryType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "libraryType";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Library type";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    protocolVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "protocolVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "protocolVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave protocol version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    hardwareVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "hardwareVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "hardwareVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave chip hardware version";
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    supportsZWaveSoftwareGet: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "supportsZWaveSoftwareGet";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: number;
            readonly property: "supportsZWaveSoftwareGet";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    sdkVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "sdkVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "sdkVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "SDK version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationFrameworkAPIVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationFrameworkAPIVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationFrameworkAPIVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave application framework API version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationFrameworkBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationFrameworkBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationFrameworkBuildNumber";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave application framework API build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    serialAPIVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "hostInterfaceVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "hostInterfaceVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Serial API version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    serialAPIBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "hostInterfaceBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "hostInterfaceBuildNumber";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Serial API build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    zWaveProtocolVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "zWaveProtocolVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "zWaveProtocolVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave protocol version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    zWaveProtocolBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "zWaveProtocolBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "zWaveProtocolBuildNumber";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave protocol build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationVersion";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Application version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationBuildNumber";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Application build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
export declare const WakeUpCCValues: Readonly<{
    controllerNodeId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly property: "controllerNodeId";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly endpoint: 0;
            readonly property: "controllerNodeId";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Node ID of the controller";
            readonly writeable: false;
            readonly type: "any";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    wakeUpInterval: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly property: "wakeUpInterval";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly endpoint: 0;
            readonly property: "wakeUpInterval";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Wake Up interval";
            readonly min: 0;
            readonly max: 16777215;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    wakeUpOnDemandSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly property: "wakeUpOnDemandSupported";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly endpoint: 0;
            readonly property: "wakeUpOnDemandSupported";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
export declare const WindowCoveringCCValues: Readonly<{
    supportedParameters: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "supportedParameters";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "supportedParameters";
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
    currentValue: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "currentValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "currentValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `Current value - ${string}`;
            readonly states: Record<number, string>;
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly writeable: false;
            readonly max: 99;
            readonly min: 0;
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
    targetValue: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "targetValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "targetValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `Target value - ${string}`;
            readonly writeable: boolean;
            readonly states: Record<number, string>;
            readonly allowManualEntry: boolean;
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly max: 99;
            readonly min: 0;
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
    duration: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "duration";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "duration";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `Remaining duration - ${string}`;
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly writeable: false;
            readonly type: "duration";
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
    levelChangeUp: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "levelChangeUp";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeUp";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `${string} - ${string}`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
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
    levelChangeDown: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "levelChangeDown";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeDown";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `${string} - ${string}`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
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
export declare const ZWavePlusCCValues: Readonly<{
    zwavePlusVersion: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "zwavePlusVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: 0;
            readonly property: "zwavePlusVersion";
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
    nodeType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "nodeType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: 0;
            readonly property: "nodeType";
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
    roleType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "roleType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: 0;
            readonly property: "roleType";
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
    userIcon: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "userIcon";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: number;
            readonly property: "userIcon";
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
    installerIcon: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "installerIcon";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: number;
            readonly property: "installerIcon";
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
}>;
export declare const CCValues: {
    156: Readonly<{
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
    }>;
    133: Readonly<{
        hasLifeline: {
            id: {
                readonly commandClass: CommandClasses.Association;
                readonly property: "hasLifeline";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Association;
                readonly endpoint: number;
                readonly property: "hasLifeline";
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
        groupCount: {
            id: {
                readonly commandClass: CommandClasses.Association;
                readonly property: "groupCount";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Association;
                readonly endpoint: number;
                readonly property: "groupCount";
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
        maxNodes: ((groupId: number) => {
            id: {
                readonly commandClass: CommandClasses.Association;
                readonly property: "maxNodes";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Association;
                readonly endpoint: number;
                readonly property: "maxNodes";
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
        nodeIds: ((groupId: number) => {
            id: {
                readonly commandClass: CommandClasses.Association;
                readonly property: "nodeIds";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Association;
                readonly endpoint: number;
                readonly property: "nodeIds";
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
    }>;
    89: Readonly<{
        hasDynamicInfo: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly property: "hasDynamicInfo";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly endpoint: number;
                readonly property: "hasDynamicInfo";
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
        groupName: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly property: "name";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly endpoint: number;
                readonly property: "name";
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
        groupInfo: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly property: "info";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly endpoint: number;
                readonly property: "info";
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
        commands: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly property: "issuedCommands";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Association Group Information"];
                readonly endpoint: number;
                readonly property: "issuedCommands";
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
    }>;
    102: Readonly<{
        supportedSubsystemTypes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly property: "supportedSubsystemTypes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly endpoint: number;
                readonly property: "supportedSubsystemTypes";
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
        position: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly property: "position";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly endpoint: number;
                readonly property: "position";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Barrier Position";
                readonly unit: "%";
                readonly max: 100;
                readonly writeable: false;
                readonly min: 0;
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
        targetState: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly property: "targetState";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly endpoint: number;
                readonly property: "targetState";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Target Barrier State";
                readonly states: Record<number, string>;
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
        currentState: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly property: "currentState";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly endpoint: number;
                readonly property: "currentState";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current Barrier State";
                readonly states: Record<number, string>;
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
        signalingState: ((subsystemType: SubsystemType) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly property: "signalingState";
                readonly propertyKey: SubsystemType;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Barrier Operator"];
                readonly endpoint: number;
                readonly property: "signalingState";
                readonly propertyKey: SubsystemType;
            };
            readonly meta: {
                readonly label: `Signaling State (${string})`;
                readonly states: Record<number, string>;
                readonly min: 0;
                readonly max: 255;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
    32: Readonly<{
        currentValue: {
            id: {
                readonly commandClass: CommandClasses.Basic;
                readonly property: "currentValue";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Basic;
                readonly endpoint: number;
                readonly property: "currentValue";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current value";
                readonly writeable: false;
                readonly max: 99;
                readonly min: 0;
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
        targetValue: {
            id: {
                readonly commandClass: CommandClasses.Basic;
                readonly property: "targetValue";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Basic;
                readonly endpoint: number;
                readonly property: "targetValue";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Target value";
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
        duration: {
            id: {
                readonly commandClass: CommandClasses.Basic;
                readonly property: "duration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Basic;
                readonly endpoint: number;
                readonly property: "duration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Remaining duration";
                readonly writeable: false;
                readonly type: "duration";
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
        restorePrevious: {
            id: {
                readonly commandClass: CommandClasses.Basic;
                readonly property: "restorePrevious";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Basic;
                readonly endpoint: number;
                readonly property: "restorePrevious";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Restore previous value";
                readonly states: {
                    readonly true: "Restore";
                };
                readonly readable: false;
                readonly type: "boolean";
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
        compatEvent: {
            id: {
                readonly commandClass: CommandClasses.Basic;
                readonly property: "event";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Basic;
                readonly endpoint: number;
                readonly property: "event";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Event value";
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
                readonly stateful: false;
                readonly supportsEndpoints: true;
                readonly autoCreate: false;
            };
        };
    }>;
    80: Readonly<{
        levelChangeUp: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
                readonly property: "levelChangeUp";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
                readonly endpoint: number;
                readonly property: "levelChangeUp";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Open";
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly readable: false;
                readonly type: "boolean";
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
        levelChangeDown: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
                readonly property: "levelChangeDown";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
                readonly endpoint: number;
                readonly property: "levelChangeDown";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Close";
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly readable: false;
                readonly type: "boolean";
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
    }>;
    128: Readonly<{
        level: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "level";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "level";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly max: 100;
                readonly unit: "%";
                readonly label: "Battery level";
                readonly writeable: false;
                readonly min: 0;
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
        maximumCapacity: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "maximumCapacity";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "maximumCapacity";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly max: 100;
                readonly unit: "%";
                readonly label: "Maximum capacity";
                readonly writeable: false;
                readonly min: 0;
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
        temperature: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "temperature";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "temperature";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Temperature";
                readonly unit: "°C";
                readonly writeable: false;
                readonly min: -128;
                readonly max: 127;
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
        chargingStatus: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "chargingStatus";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "chargingStatus";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Charging status";
                readonly states: Record<number, string>;
                readonly writeable: false;
                readonly min: 0;
                readonly max: 255;
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
        rechargeable: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "rechargeable";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "rechargeable";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Rechargeable";
                readonly writeable: false;
                readonly type: "boolean";
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
        backup: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "backup";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "backup";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Used as backup";
                readonly writeable: false;
                readonly type: "boolean";
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
        overheating: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "overheating";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "overheating";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Overheating";
                readonly writeable: false;
                readonly type: "boolean";
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
        lowFluid: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "lowFluid";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "lowFluid";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Fluid is low";
                readonly writeable: false;
                readonly type: "boolean";
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
        rechargeOrReplace: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "rechargeOrReplace";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "rechargeOrReplace";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Recharge or replace";
                readonly states: Record<number, string>;
                readonly writeable: false;
                readonly min: 0;
                readonly max: 255;
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
        disconnected: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "disconnected";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "disconnected";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Battery is disconnected";
                readonly writeable: false;
                readonly type: "boolean";
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
        lowTemperatureStatus: {
            id: {
                readonly commandClass: CommandClasses.Battery;
                readonly property: "lowTemperatureStatus";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Battery;
                readonly endpoint: number;
                readonly property: "lowTemperatureStatus";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Battery temperature is low";
                readonly writeable: false;
                readonly type: "boolean";
                readonly readable: true;
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
    }>;
    48: Readonly<{
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
    37: Readonly<{
        currentValue: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Binary Switch"];
                readonly property: "currentValue";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Binary Switch"];
                readonly endpoint: number;
                readonly property: "currentValue";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current value";
                readonly writeable: false;
                readonly type: "boolean";
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
        targetValue: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Binary Switch"];
                readonly property: "targetValue";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Binary Switch"];
                readonly endpoint: number;
                readonly property: "targetValue";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Target value";
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly type: "boolean";
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
        duration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Binary Switch"];
                readonly property: "duration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Binary Switch"];
                readonly endpoint: number;
                readonly property: "duration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Remaining duration";
                readonly writeable: false;
                readonly type: "duration";
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
    }>;
    91: Readonly<{
        sceneCount: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly property: "sceneCount";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly endpoint: number;
                readonly property: "sceneCount";
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
        supportsSlowRefresh: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly property: "supportsSlowRefresh";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly endpoint: number;
                readonly property: "supportsSlowRefresh";
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
        supportedKeyAttributes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly property: "supportedKeyAttributes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly endpoint: number;
                readonly property: "supportedKeyAttributes";
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
        slowRefresh: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly property: "slowRefresh";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly endpoint: number;
                readonly property: "slowRefresh";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Send held down notifications at a slow rate";
                readonly description: "When this is true, KeyHeldDown notifications are sent every 55s. When this is false, the notifications are sent every 200ms.";
                readonly type: "boolean";
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
        scene: ((sceneNumber: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly property: "scene";
                readonly propertyKey: string;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Central Scene"];
                readonly endpoint: number;
                readonly property: "scene";
                readonly propertyKey: string;
            };
            readonly meta: {
                readonly label: `Scene ${string}`;
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
                readonly stateful: false;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
    }>;
    70: Readonly<{
        overrideType: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
                readonly property: "overrideType";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
                readonly endpoint: number;
                readonly property: "overrideType";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Override type";
                readonly states: Record<number, string>;
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
        overrideState: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
                readonly property: "overrideState";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
                readonly endpoint: number;
                readonly property: "overrideState";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Override state";
                readonly min: -12.8;
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
        schedule: ((weekday: Weekday) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
                readonly property: "schedule";
                readonly propertyKey: Weekday;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Climate Control Schedule"];
                readonly endpoint: number;
                readonly property: "schedule";
                readonly propertyKey: Weekday;
            };
            readonly meta: {
                readonly label: `Schedule (${string})`;
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
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
    51: Readonly<{
        supportedColorComponents: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "supportedColorComponents";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "supportedColorComponents";
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
        supportsHexColor: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "supportsHexColor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "supportsHexColor";
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
        currentColor: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "currentColor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "currentColor";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current color";
                readonly writeable: false;
                readonly type: "any";
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
        targetColor: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "targetColor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "targetColor";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Target color";
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly type: "any";
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
        duration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "duration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "duration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Remaining duration";
                readonly writeable: false;
                readonly type: "duration";
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
        hexColor: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "hexColor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "hexColor";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly minLength: 6;
                readonly maxLength: 7;
                readonly label: "RGB Color";
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly type: "color";
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
        currentColorChannel: ((component: ColorComponent) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "currentColor";
                readonly propertyKey: ColorComponent;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "currentColor";
                readonly propertyKey: ColorComponent;
            };
            readonly meta: {
                readonly label: `Current value (${string})`;
                readonly description: `The current value of the ${string} channel.`;
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
        targetColorChannel: ((component: ColorComponent) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly property: "targetColor";
                readonly propertyKey: ColorComponent;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Color Switch"];
                readonly endpoint: number;
                readonly property: "targetColor";
                readonly propertyKey: ColorComponent;
            };
            readonly meta: {
                readonly label: `Target value (${string})`;
                readonly description: `The target value of the ${string} channel.`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly min: 0;
                readonly max: 255;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
    112: Readonly<{
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
    98: Readonly<{
        targetMode: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "targetMode";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "targetMode";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Target lock mode";
                readonly states: Record<number, string>;
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
        currentMode: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "currentMode";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "currentMode";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current lock mode";
                readonly states: Record<number, string>;
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
        duration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "duration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "duration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Remaining duration until target lock mode";
                readonly writeable: false;
                readonly type: "duration";
                readonly readable: true;
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
        supportedOutsideHandles: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "supportedOutsideHandles";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "supportedOutsideHandles";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        outsideHandlesCanOpenDoorConfiguration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "outsideHandlesCanOpenDoorConfiguration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "outsideHandlesCanOpenDoorConfiguration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Which outside handles can open the door (configuration)";
                readonly type: "any";
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
        outsideHandlesCanOpenDoor: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "outsideHandlesCanOpenDoor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "outsideHandlesCanOpenDoor";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Which outside handles can open the door (actual status)";
                readonly writeable: false;
                readonly type: "any";
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
        supportedInsideHandles: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "supportedInsideHandles";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "supportedInsideHandles";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        insideHandlesCanOpenDoorConfiguration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "insideHandlesCanOpenDoorConfiguration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "insideHandlesCanOpenDoorConfiguration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Which inside handles can open the door (configuration)";
                readonly type: "any";
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
        insideHandlesCanOpenDoor: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "insideHandlesCanOpenDoor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "insideHandlesCanOpenDoor";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Which inside handles can open the door (actual status)";
                readonly writeable: false;
                readonly type: "any";
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
        operationType: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "operationType";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "operationType";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Lock operation type";
                readonly states: Record<number, string>;
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
        lockTimeoutConfiguration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "lockTimeoutConfiguration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "lockTimeoutConfiguration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Duration of timed mode in seconds";
                readonly min: 0;
                readonly max: 65535;
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
        lockTimeout: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "lockTimeout";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "lockTimeout";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Seconds until lock mode times out";
                readonly writeable: false;
                readonly min: 0;
                readonly max: 65535;
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
        autoRelockSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "autoRelockSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "autoRelockSupported";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        autoRelockTime: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "autoRelockTime";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "autoRelockTime";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Duration in seconds until lock returns to secure state";
                readonly min: 0;
                readonly max: 65535;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateAutoRelockConfigValue;
            };
        };
        holdAndReleaseSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "holdAndReleaseSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "holdAndReleaseSupported";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        holdAndReleaseTime: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "holdAndReleaseTime";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "holdAndReleaseTime";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Duration in seconds the latch stays retracted";
                readonly min: 0;
                readonly max: 65535;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateHoldAndReleaseConfigValue;
            };
        };
        twistAssistSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "twistAssistSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "twistAssistSupported";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        twistAssist: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "twistAssist";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "twistAssist";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Twist Assist enabled";
                readonly type: "boolean";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateTwistAssistConfigValue;
            };
        };
        blockToBlockSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "blockToBlockSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "blockToBlockSupported";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        blockToBlock: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "blockToBlock";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "blockToBlock";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Block-to-block functionality enabled";
                readonly type: "boolean";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 4;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateBlockToBlockConfigValue;
            };
        };
        latchSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "latchSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "latchSupported";
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
        latchStatus: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "latchStatus";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "latchStatus";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current status of the latch";
                readonly writeable: false;
                readonly type: "any";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateLatchStatusValue;
            };
        };
        boltSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "boltSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "boltSupported";
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
        boltStatus: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "boltStatus";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "boltStatus";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current status of the bolt";
                readonly writeable: false;
                readonly type: "any";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateBoltStatusValue;
            };
        };
        doorSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "doorSupported";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "doorSupported";
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
        doorStatus: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly property: "doorStatus";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock"];
                readonly endpoint: number;
                readonly property: "doorStatus";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current status of the door";
                readonly writeable: false;
                readonly type: "any";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: typeof shouldAutoCreateDoorStatusValue;
            };
        };
    }>;
    76: Readonly<{
        recordsCount: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Door Lock Logging"];
                readonly property: "recordsCount";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Door Lock Logging"];
                readonly endpoint: number;
                readonly property: "recordsCount";
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
    }>;
    144: Readonly<{
        value: ((parameter: EnergyProductionParameter) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Energy Production"];
                readonly property: "value";
                readonly propertyKey: EnergyProductionParameter;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Energy Production"];
                readonly endpoint: number;
                readonly property: "value";
                readonly propertyKey: EnergyProductionParameter;
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
    111: Readonly<{
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
            is: (valueId: ValueID) => boolean;
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
            is: (valueId: ValueID) => boolean;
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
    }>;
    122: Readonly<{
        supportsActivation: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly property: "supportsActivation";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly endpoint: number;
                readonly property: "supportsActivation";
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
        firmwareUpgradable: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly property: "firmwareUpgradable";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly endpoint: number;
                readonly property: "firmwareUpgradable";
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
        additionalFirmwareIDs: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly property: "additionalFirmwareIDs";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly endpoint: number;
                readonly property: "additionalFirmwareIDs";
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
        continuesToFunction: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly property: "continuesToFunction";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly endpoint: number;
                readonly property: "continuesToFunction";
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
        supportsResuming: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly property: "supportsResuming";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly endpoint: number;
                readonly property: "supportsResuming";
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
        supportsNonSecureTransfer: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly property: "supportsNonSecureTransfer";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
                readonly endpoint: number;
                readonly property: "supportsNonSecureTransfer";
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
    }>;
    109: Readonly<{
        mode: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
                readonly property: "mode";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
                readonly endpoint: number;
                readonly property: "mode";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly states: Record<number, string>;
                readonly label: "Humidity control mode";
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
        supportedModes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
                readonly property: "supportedModes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Mode"];
                readonly endpoint: number;
                readonly property: "supportedModes";
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
    }>;
    110: Readonly<{
        state: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Operating State"];
                readonly property: "state";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Operating State"];
                readonly endpoint: number;
                readonly property: "state";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly states: Record<number, string>;
                readonly label: "Humidity control operating state";
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
    }>;
    100: Readonly<{
        supportedSetpointTypes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
                readonly property: "supportedSetpointTypes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
                readonly endpoint: number;
                readonly property: "supportedSetpointTypes";
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
        setpoint: ((setpointType: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
                readonly property: "setpoint";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
                readonly endpoint: number;
                readonly property: "setpoint";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Setpoint (${string})`;
                readonly ccSpecific: {
                    readonly setpointType: number;
                };
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        setpointScale: ((setpointType: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
                readonly property: "setpointScale";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Humidity Control Setpoint"];
                readonly endpoint: number;
                readonly property: "setpointScale";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Setpoint scale (${string})`;
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
    }>;
    135: Readonly<{
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
    107: Readonly<{
        numValves: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "numValves";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "numValves";
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
        numValveTables: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "numValveTables";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "numValveTables";
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
        supportsMasterValve: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "supportsMasterValve";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "supportsMasterValve";
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
        maxValveTableSize: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "maxValveTableSize";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "maxValveTableSize";
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
        systemVoltage: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "systemVoltage";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "systemVoltage";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "System voltage";
                readonly unit: "V";
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
        masterValveDelay: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "masterValveDelay";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "masterValveDelay";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Master valve delay";
                readonly description: "The delay between turning on the master valve and turning on any zone valve";
                readonly unit: "seconds";
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
        flowSensorActive: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "flowSensorActive";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "flowSensorActive";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Flow sensor active";
                readonly writeable: false;
                readonly type: "boolean";
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
        pressureSensorActive: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "pressureSensorActive";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "pressureSensorActive";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Pressure sensor active";
                readonly writeable: false;
                readonly type: "boolean";
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
        rainSensorActive: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "rainSensorActive";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "rainSensorActive";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Rain sensor attached and active";
                readonly writeable: false;
                readonly type: "boolean";
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
        rainSensorPolarity: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "rainSensorPolarity";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "rainSensorPolarity";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Rain sensor polarity";
                readonly min: 0;
                readonly max: 1;
                readonly states: Record<number, string>;
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
        moistureSensorActive: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "moistureSensorActive";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "moistureSensorActive";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Moisture sensor attached and active";
                readonly writeable: false;
                readonly type: "boolean";
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
        moistureSensorPolarity: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "moistureSensorPolarity";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "moistureSensorPolarity";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Moisture sensor polarity";
                readonly min: 0;
                readonly max: 1;
                readonly states: Record<number, string>;
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
        flow: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "flow";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "flow";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Flow";
                readonly unit: "l/h";
                readonly writeable: false;
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
        pressure: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "pressure";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "pressure";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Pressure";
                readonly unit: "kPa";
                readonly writeable: false;
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
        shutoffDuration: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "shutoffDuration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "shutoffDuration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Remaining shutoff duration";
                readonly unit: "hours";
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
        errorNotProgrammed: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "errorNotProgrammed";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "errorNotProgrammed";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Error: device not programmed";
                readonly writeable: false;
                readonly type: "boolean";
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
        errorEmergencyShutdown: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "errorEmergencyShutdown";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "errorEmergencyShutdown";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Error: emergency shutdown";
                readonly writeable: false;
                readonly type: "boolean";
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
        errorHighPressure: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "errorHighPressure";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "errorHighPressure";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Error: high pressure";
                readonly writeable: false;
                readonly type: "boolean";
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
        highPressureThreshold: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "highPressureThreshold";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "highPressureThreshold";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "High pressure threshold";
                readonly unit: "kPa";
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
        errorLowPressure: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "errorLowPressure";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "errorLowPressure";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Error: low pressure";
                readonly writeable: false;
                readonly type: "boolean";
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
        lowPressureThreshold: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "lowPressureThreshold";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "lowPressureThreshold";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Low pressure threshold";
                readonly unit: "kPa";
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
        errorValve: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "errorValve";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "errorValve";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Error: valve reporting error";
                readonly writeable: false;
                readonly type: "boolean";
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
        masterValveOpen: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "masterValveOpen";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "masterValveOpen";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Master valve is open";
                readonly writeable: false;
                readonly type: "boolean";
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
        firstOpenZoneId: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "firstOpenZoneId";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "firstOpenZoneId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "First open zone valve ID";
                readonly writeable: false;
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
        shutoffSystem: {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: "shutoff";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: "shutoff";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Shutoff system";
                readonly states: {
                    readonly true: "Shutoff";
                };
                readonly readable: false;
                readonly type: "boolean";
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
        valveConnected: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "valveConnected";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "valveConnected";
            };
            readonly meta: {
                readonly label: `${string}: Connected`;
                readonly writeable: false;
                readonly type: "boolean";
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
        nominalCurrent: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "nominalCurrent";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "nominalCurrent";
            };
            readonly meta: {
                readonly label: `${string}: Nominal current`;
                readonly unit: "mA";
                readonly writeable: false;
                readonly type: "boolean";
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
        nominalCurrentHighThreshold: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "nominalCurrentHighThreshold";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "nominalCurrentHighThreshold";
            };
            readonly meta: {
                readonly label: `${string}: Nominal current - high threshold`;
                readonly min: 0;
                readonly max: 2550;
                readonly unit: "mA";
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        nominalCurrentLowThreshold: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "nominalCurrentLowThreshold";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "nominalCurrentLowThreshold";
            };
            readonly meta: {
                readonly label: `${string}: Nominal current - low threshold`;
                readonly min: 0;
                readonly max: 2550;
                readonly unit: "mA";
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        errorShortCircuit: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "errorShortCircuit";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "errorShortCircuit";
            };
            readonly meta: {
                readonly label: `${string}: Error - Short circuit detected`;
                readonly writeable: false;
                readonly type: "boolean";
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
        errorHighCurrent: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "errorHighCurrent";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "errorHighCurrent";
            };
            readonly meta: {
                readonly label: `${string}: Error - Current above high threshold`;
                readonly writeable: false;
                readonly type: "boolean";
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
        errorLowCurrent: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "errorLowCurrent";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "errorLowCurrent";
            };
            readonly meta: {
                readonly label: `${string}: Error - Current below low threshold`;
                readonly writeable: false;
                readonly type: "boolean";
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
        maximumFlow: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "maximumFlow";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "maximumFlow";
            };
            readonly meta: {
                readonly label: `${string}: Maximum flow`;
                readonly min: 0;
                readonly unit: "l/h";
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        errorMaximumFlow: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "errorMaximumFlow";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "errorMaximumFlow";
            };
            readonly meta: {
                readonly label: `${string}: Error - Maximum flow detected`;
                readonly writeable: false;
                readonly type: "boolean";
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
        highFlowThreshold: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "highFlowThreshold";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "highFlowThreshold";
            };
            readonly meta: {
                readonly label: `${string}: High flow threshold`;
                readonly min: 0;
                readonly unit: "l/h";
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        errorHighFlow: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "errorHighFlow";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "errorHighFlow";
            };
            readonly meta: {
                readonly label: `${string}: Error - Flow above high threshold`;
                readonly writeable: false;
                readonly type: "boolean";
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
        lowFlowThreshold: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "lowFlowThreshold";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "lowFlowThreshold";
            };
            readonly meta: {
                readonly label: `${string}: Low flow threshold`;
                readonly min: 0;
                readonly unit: "l/h";
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        errorLowFlow: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "errorLowFlow";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "errorLowFlow";
            };
            readonly meta: {
                readonly label: `${string}: Error - Flow below high threshold`;
                readonly writeable: false;
                readonly type: "boolean";
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
        useRainSensor: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "useRainSensor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "useRainSensor";
            };
            readonly meta: {
                readonly label: `${string}: Use rain sensor`;
                readonly type: "boolean";
                readonly readable: true;
                readonly writeable: true;
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
        useMoistureSensor: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "useMoistureSensor";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "useMoistureSensor";
            };
            readonly meta: {
                readonly label: `${string}: Use moisture sensor`;
                readonly type: "boolean";
                readonly readable: true;
                readonly writeable: true;
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
        valveRunDuration: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "duration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "duration";
            };
            readonly meta: {
                readonly label: `${string}: Run duration`;
                readonly min: 1;
                readonly unit: "s";
                readonly max: 65535;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        valveRunStartStop: ((valveId: ValveId) => {
            id: {
                readonly commandClass: CommandClasses.Irrigation;
                readonly property: ValveId;
                readonly propertyKey: "startStop";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Irrigation;
                readonly endpoint: number;
                readonly property: ValveId;
                readonly propertyKey: "startStop";
            };
            readonly meta: {
                readonly label: `${string}: Start/Stop`;
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly type: "boolean";
                readonly readable: true;
                readonly writeable: true;
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
    137: Readonly<{
        language: {
            id: {
                readonly commandClass: CommandClasses.Language;
                readonly property: "language";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Language;
                readonly endpoint: number;
                readonly property: "language";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Language code";
                readonly writeable: false;
                readonly type: "string";
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
        country: {
            id: {
                readonly commandClass: CommandClasses.Language;
                readonly property: "country";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Language;
                readonly endpoint: number;
                readonly property: "country";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Country code";
                readonly writeable: false;
                readonly type: "string";
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
    }>;
    118: Readonly<{
        locked: {
            id: {
                readonly commandClass: CommandClasses.Lock;
                readonly property: "locked";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Lock;
                readonly endpoint: number;
                readonly property: "locked";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Locked";
                readonly description: "Whether the lock is locked";
                readonly type: "boolean";
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
    }>;
    114: Readonly<{
        manufacturerId: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly property: "manufacturerId";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly endpoint: 0;
                readonly property: "manufacturerId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Manufacturer ID";
                readonly writeable: false;
                readonly min: 0;
                readonly max: 65535;
                readonly type: "number";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        productType: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly property: "productType";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly endpoint: 0;
                readonly property: "productType";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Product type";
                readonly writeable: false;
                readonly min: 0;
                readonly max: 65535;
                readonly type: "number";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        productId: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly property: "productId";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly endpoint: 0;
                readonly property: "productId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Product ID";
                readonly writeable: false;
                readonly min: 0;
                readonly max: 65535;
                readonly type: "number";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        deviceId: ((type: DeviceIdType) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly property: "deviceId";
                readonly propertyKey: string;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
                readonly endpoint: number;
                readonly property: "deviceId";
                readonly propertyKey: string;
            };
            readonly meta: {
                readonly label: `Device ID (${string})`;
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
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
    }>;
    50: Readonly<{
        type: {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "type";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "type";
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
        supportsReset: {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "supportsReset";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "supportsReset";
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
        supportedScales: {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "supportedScales";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "supportedScales";
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
        supportedRateTypes: {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "supportedRateTypes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "supportedRateTypes";
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
        resetAll: {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "reset";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "reset";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Reset accumulated values";
                readonly states: {
                    readonly true: "Reset";
                };
                readonly readable: false;
                readonly type: "boolean";
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
        resetSingle: ((meterType: number, rateType: RateType, scale: number) => {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "reset";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "reset";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Reset (${string})` | `Reset (Consumption, ${string})` | `Reset (Production, ${string})`;
                readonly states: {
                    readonly true: "Reset";
                };
                readonly ccSpecific: {
                    readonly meterType: number;
                    readonly rateType: RateType;
                    readonly scale: number;
                };
                readonly readable: false;
                readonly type: "boolean";
                readonly writeable: true;
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
        value: ((meterType: number, rateType: RateType, scale: number) => {
            id: {
                readonly commandClass: CommandClasses.Meter;
                readonly property: "value";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Meter;
                readonly endpoint: number;
                readonly property: "value";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly ccSpecific: {
                    readonly meterType: number;
                    readonly rateType: RateType;
                    readonly scale: number;
                };
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
    142: Readonly<{
        groupCount: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly property: "groupCount";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly endpoint: number;
                readonly property: "groupCount";
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
        maxNodes: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly property: "maxNodes";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly endpoint: number;
                readonly property: "maxNodes";
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
        nodeIds: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly property: "nodeIds";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly endpoint: number;
                readonly property: "nodeIds";
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
        endpoints: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly property: "endpoints";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel Association"];
                readonly endpoint: number;
                readonly property: "endpoints";
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
    }>;
    96: Readonly<{
        endpointIndizes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "endpointIndizes";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: 0;
                readonly property: "endpointIndizes";
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
        individualEndpointCount: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "individualCount";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: 0;
                readonly property: "individualCount";
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
        aggregatedEndpointCount: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "aggregatedCount";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: 0;
                readonly property: "aggregatedCount";
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
        endpointCountIsDynamic: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "countIsDynamic";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: 0;
                readonly property: "countIsDynamic";
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
        endpointsHaveIdenticalCapabilities: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "identicalCapabilities";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: 0;
                readonly property: "identicalCapabilities";
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
        endpointCCs: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "commandClasses";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: number;
                readonly property: "commandClasses";
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
        endpointDeviceClass: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "deviceClass";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: number;
                readonly property: "deviceClass";
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
        aggregatedEndpointMembers: ((endpointIndex: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly property: "members";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multi Channel"];
                readonly endpoint: number;
                readonly property: "members";
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
    }>;
    49: Readonly<{
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
    38: Readonly<{
        currentValue: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "currentValue";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: "currentValue";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Current value";
                readonly writeable: false;
                readonly max: 99;
                readonly min: 0;
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
        targetValue: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "targetValue";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: "targetValue";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Target value";
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly max: 99;
                readonly min: 0;
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
        duration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "duration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: "duration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Remaining duration";
                readonly writeable: false;
                readonly type: "duration";
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
        restorePrevious: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "restorePrevious";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: "restorePrevious";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Restore previous value";
                readonly states: {
                    readonly true: "Restore";
                };
                readonly readable: false;
                readonly type: "boolean";
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
        compatEvent: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "event";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: "event";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Event value";
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
                readonly stateful: false;
                readonly supportsEndpoints: true;
                readonly autoCreate: (applHost: GetValueDB & GetDeviceConfig, endpoint: EndpointId) => boolean;
            };
        };
        switchType: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "switchType";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: "switchType";
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
        superviseStartStopLevelChange: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: "superviseStartStopLevelChange";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: 0;
                readonly property: "superviseStartStopLevelChange";
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
        levelChangeUp: ((switchType: SwitchType) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: string;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: string;
            };
            readonly meta: {
                readonly label: `Perform a level change (${string})`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly ccSpecific: {
                    readonly switchType: SwitchType;
                };
                readonly readable: false;
                readonly type: "boolean";
                readonly writeable: true;
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
        levelChangeDown: ((switchType: SwitchType) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly property: string;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
                readonly endpoint: number;
                readonly property: string;
            };
            readonly meta: {
                readonly label: `Perform a level change (${string})`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly ccSpecific: {
                    readonly switchType: SwitchType;
                };
                readonly readable: false;
                readonly type: "boolean";
                readonly writeable: true;
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
    119: Readonly<{
        name: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
                readonly property: "name";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
                readonly endpoint: 0;
                readonly property: "name";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Node name";
                readonly type: "string";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        location: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
                readonly property: "location";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Node Naming and Location"];
                readonly endpoint: 0;
                readonly property: "location";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Node location";
                readonly type: "string";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
    }>;
    113: Readonly<{
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
                readonly autoCreate: typeof shouldAutoCreateSimpleDoorSensorValue;
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
    117: Readonly<{
        exclusiveControlNodeId: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "exclusiveControlNodeId";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "exclusiveControlNodeId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly min: 1;
                readonly max: 232;
                readonly label: "Node ID with exclusive control";
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        localProtectionState: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "local";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "local";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Local protection state";
                readonly states: Record<number, string>;
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
        rfProtectionState: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "rf";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "rf";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "RF protection state";
                readonly states: Record<number, string>;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        timeout: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "timeout";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "timeout";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "RF protection timeout";
                readonly min: 0;
                readonly max: 255;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        supportsExclusiveControl: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "supportsExclusiveControl";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "supportsExclusiveControl";
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
        supportsTimeout: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "supportsTimeout";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "supportsTimeout";
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
        supportedLocalStates: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "supportedLocalStates";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "supportedLocalStates";
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
        supportedRFStates: {
            id: {
                readonly commandClass: CommandClasses.Protection;
                readonly property: "supportedRFStates";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Protection;
                readonly endpoint: number;
                readonly property: "supportedRFStates";
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
    }>;
    43: Readonly<{
        sceneId: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Scene Activation"];
                readonly property: "sceneId";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Scene Activation"];
                readonly endpoint: number;
                readonly property: "sceneId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly min: 1;
                readonly label: "Scene ID";
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly max: 255;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: false;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        dimmingDuration: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Scene Activation"];
                readonly property: "dimmingDuration";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Scene Activation"];
                readonly endpoint: number;
                readonly property: "dimmingDuration";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Dimming duration";
                readonly type: "duration";
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
    }>;
    44: Readonly<{
        level: ((sceneId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
                readonly property: "level";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
                readonly endpoint: number;
                readonly property: "level";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Level (${number})`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly min: 0;
                readonly max: 255;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        dimmingDuration: ((sceneId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
                readonly property: "dimmingDuration";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
                readonly endpoint: number;
                readonly property: "dimmingDuration";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Dimming duration (${number})`;
                readonly type: "duration";
                readonly readable: true;
                readonly writeable: true;
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
    45: Readonly<{
        sceneId: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
                readonly property: "sceneId";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
                readonly endpoint: number;
                readonly property: "sceneId";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Associated Scene ID (${number})`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly min: 0;
                readonly max: 255;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        dimmingDuration: ((groupId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
                readonly property: "dimmingDuration";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
                readonly endpoint: number;
                readonly property: "dimmingDuration";
                readonly propertyKey: number;
            };
            readonly meta: {
                readonly label: `Dimming duration (${number})`;
                readonly type: "duration";
                readonly readable: true;
                readonly writeable: true;
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
    78: Readonly<{
        numWeekDaySlots: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly property: "numWeekDaySlots";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly endpoint: number;
                readonly property: "numWeekDaySlots";
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
        numYearDaySlots: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly property: "numYearDaySlots";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly endpoint: number;
                readonly property: "numYearDaySlots";
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
        numDailyRepeatingSlots: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly property: "numDailyRepeatingSlots";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly endpoint: number;
                readonly property: "numDailyRepeatingSlots";
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
        userEnabled: ((userId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly property: "userEnabled";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly endpoint: number;
                readonly property: "userEnabled";
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
        scheduleKind: ((userId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly property: "scheduleKind";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly endpoint: number;
                readonly property: "scheduleKind";
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
        schedule: ((scheduleKind: ScheduleEntryLockScheduleKind, userId: number, slotId: number) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly property: "schedule";
                readonly propertyKey: number;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Schedule Entry Lock"];
                readonly endpoint: number;
                readonly property: "schedule";
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
    }>;
    121: Readonly<{
        volume: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly property: "volume";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly endpoint: number;
                readonly property: "volume";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly min: 0;
                readonly max: 100;
                readonly unit: "%";
                readonly label: "Volume";
                readonly allowManualEntry: true;
                readonly states: {
                    readonly 0: "default";
                };
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
        toneId: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly property: "toneId";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly endpoint: number;
                readonly property: "toneId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Play Tone";
                readonly valueChangeOptions: readonly ["volume"];
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
        defaultVolume: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly property: "defaultVolume";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly endpoint: number;
                readonly property: "defaultVolume";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly min: 0;
                readonly max: 100;
                readonly unit: "%";
                readonly label: "Default volume";
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
        defaultToneId: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly property: "defaultToneId";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Sound Switch"];
                readonly endpoint: number;
                readonly property: "defaultToneId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly min: 1;
                readonly max: 254;
                readonly label: "Default tone ID";
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
    }>;
    108: Readonly<{
        ccSupported: ((ccId: CommandClasses) => {
            id: {
                readonly commandClass: CommandClasses.Supervision;
                readonly property: "ccSupported";
                readonly propertyKey: CommandClasses;
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Supervision;
                readonly endpoint: 0;
                readonly property: "ccSupported";
                readonly propertyKey: CommandClasses;
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
    }>;
    68: Readonly<{
        turnedOff: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
                readonly property: "off";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
                readonly endpoint: number;
                readonly property: "off";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Thermostat fan turned off";
                readonly type: "boolean";
                readonly readable: true;
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
        fanMode: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
                readonly property: "mode";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
                readonly endpoint: number;
                readonly property: "mode";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly states: Record<number, string>;
                readonly label: "Thermostat fan mode";
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
        supportedFanModes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
                readonly property: "supportedModes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan Mode"];
                readonly endpoint: number;
                readonly property: "supportedModes";
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
    }>;
    69: Readonly<{
        fanState: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan State"];
                readonly property: "state";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Fan State"];
                readonly endpoint: number;
                readonly property: "state";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly states: Record<number, string>;
                readonly label: "Thermostat fan state";
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
    }>;
    64: Readonly<{
        thermostatMode: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
                readonly property: "mode";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
                readonly endpoint: number;
                readonly property: "mode";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly states: Record<number, string>;
                readonly label: "Thermostat mode";
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
        manufacturerData: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
                readonly property: "manufacturerData";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
                readonly endpoint: number;
                readonly property: "manufacturerData";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Manufacturer data";
                readonly writeable: false;
                readonly type: "buffer";
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
        supportedModes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
                readonly property: "supportedModes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Mode"];
                readonly endpoint: number;
                readonly property: "supportedModes";
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
    }>;
    66: Readonly<{
        operatingState: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Operating State"];
                readonly property: "state";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Operating State"];
                readonly endpoint: number;
                readonly property: "state";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Operating state";
                readonly states: Record<number, string>;
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
    }>;
    67: Readonly<{
        supportedSetpointTypes: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
                readonly property: "supportedSetpointTypes";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
                readonly endpoint: number;
                readonly property: "supportedSetpointTypes";
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
        setpoint: ((setpointType: ThermostatSetpointType) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
                readonly property: "setpoint";
                readonly propertyKey: ThermostatSetpointType;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
                readonly endpoint: number;
                readonly property: "setpoint";
                readonly propertyKey: ThermostatSetpointType;
            };
            readonly meta: {
                readonly label: `Setpoint (${string})`;
                readonly ccSpecific: {
                    readonly setpointType: ThermostatSetpointType;
                };
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
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
        setpointScale: ((setpointType: ThermostatSetpointType) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
                readonly property: "setpointScale";
                readonly propertyKey: ThermostatSetpointType;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Thermostat Setpoint"];
                readonly endpoint: number;
                readonly property: "setpointScale";
                readonly propertyKey: ThermostatSetpointType;
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
    }>;
    139: Readonly<{
        dateAndTime: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Time Parameters"];
                readonly property: "dateAndTime";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Time Parameters"];
                readonly endpoint: number;
                readonly property: "dateAndTime";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Date and Time";
                readonly type: "any";
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
    }>;
    99: Readonly<{
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
            is: (valueId: ValueID) => boolean;
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
            is: (valueId: ValueID) => boolean;
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
            is: (valueId: ValueID) => boolean;
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
    134: Readonly<{
        firmwareVersions: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "firmwareVersions";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "firmwareVersions";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly type: "string[]";
                readonly label: "Z-Wave chip firmware versions";
                readonly writeable: false;
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        libraryType: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "libraryType";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "libraryType";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Library type";
                readonly states: Record<number, string>;
                readonly writeable: false;
                readonly type: "number";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        protocolVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "protocolVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "protocolVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Z-Wave protocol version";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        hardwareVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "hardwareVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "hardwareVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Z-Wave chip hardware version";
                readonly writeable: false;
                readonly type: "number";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 2;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        supportsZWaveSoftwareGet: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "supportsZWaveSoftwareGet";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: number;
                readonly property: "supportsZWaveSoftwareGet";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: true;
                readonly autoCreate: true;
            };
        };
        sdkVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "sdkVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "sdkVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "SDK version";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        applicationFrameworkAPIVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "applicationFrameworkAPIVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "applicationFrameworkAPIVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Z-Wave application framework API version";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        applicationFrameworkBuildNumber: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "applicationFrameworkBuildNumber";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "applicationFrameworkBuildNumber";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Z-Wave application framework API build number";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        serialAPIVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "hostInterfaceVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "hostInterfaceVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Serial API version";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        serialAPIBuildNumber: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "hostInterfaceBuildNumber";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "hostInterfaceBuildNumber";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Serial API build number";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        zWaveProtocolVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "zWaveProtocolVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "zWaveProtocolVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Z-Wave protocol version";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        zWaveProtocolBuildNumber: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "zWaveProtocolBuildNumber";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "zWaveProtocolBuildNumber";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Z-Wave protocol build number";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        applicationVersion: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "applicationVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "applicationVersion";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Application version";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        applicationBuildNumber: {
            id: {
                readonly commandClass: CommandClasses.Version;
                readonly property: "applicationBuildNumber";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: CommandClasses.Version;
                readonly endpoint: 0;
                readonly property: "applicationBuildNumber";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Application build number";
                readonly writeable: false;
                readonly type: "string";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
    }>;
    132: Readonly<{
        controllerNodeId: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Wake Up"];
                readonly property: "controllerNodeId";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Wake Up"];
                readonly endpoint: 0;
                readonly property: "controllerNodeId";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Node ID of the controller";
                readonly writeable: false;
                readonly type: "any";
                readonly readable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        wakeUpInterval: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Wake Up"];
                readonly property: "wakeUpInterval";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Wake Up"];
                readonly endpoint: 0;
                readonly property: "wakeUpInterval";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: {
                readonly label: "Wake Up interval";
                readonly min: 0;
                readonly max: 16777215;
                readonly type: "number";
                readonly readable: true;
                readonly writeable: true;
            };
            options: {
                readonly internal: false;
                readonly minVersion: 1;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
        wakeUpOnDemandSupported: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Wake Up"];
                readonly property: "wakeUpOnDemandSupported";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Wake Up"];
                readonly endpoint: 0;
                readonly property: "wakeUpOnDemandSupported";
            };
            is: (valueId: ValueID) => boolean;
            readonly meta: Readonly<{
                readonly type: "any";
                readonly readable: true;
                readonly writeable: true;
            }>;
            options: {
                readonly internal: true;
                readonly minVersion: 3;
                readonly secret: false;
                readonly stateful: true;
                readonly supportsEndpoints: false;
                readonly autoCreate: true;
            };
        };
    }>;
    106: Readonly<{
        supportedParameters: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly property: "supportedParameters";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly endpoint: number;
                readonly property: "supportedParameters";
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
        currentValue: ((parameter: WindowCoveringParameter) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly property: "currentValue";
                readonly propertyKey: WindowCoveringParameter;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly endpoint: number;
                readonly property: "currentValue";
                readonly propertyKey: WindowCoveringParameter;
            };
            readonly meta: {
                readonly label: `Current value - ${string}`;
                readonly states: Record<number, string>;
                readonly ccSpecific: {
                    readonly parameter: WindowCoveringParameter;
                };
                readonly writeable: false;
                readonly max: 99;
                readonly min: 0;
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
        targetValue: ((parameter: WindowCoveringParameter) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly property: "targetValue";
                readonly propertyKey: WindowCoveringParameter;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly endpoint: number;
                readonly property: "targetValue";
                readonly propertyKey: WindowCoveringParameter;
            };
            readonly meta: {
                readonly label: `Target value - ${string}`;
                readonly writeable: boolean;
                readonly states: Record<number, string>;
                readonly allowManualEntry: boolean;
                readonly ccSpecific: {
                    readonly parameter: WindowCoveringParameter;
                };
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly max: 99;
                readonly min: 0;
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
        duration: ((parameter: WindowCoveringParameter) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly property: "duration";
                readonly propertyKey: WindowCoveringParameter;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly endpoint: number;
                readonly property: "duration";
                readonly propertyKey: WindowCoveringParameter;
            };
            readonly meta: {
                readonly label: `Remaining duration - ${string}`;
                readonly ccSpecific: {
                    readonly parameter: WindowCoveringParameter;
                };
                readonly writeable: false;
                readonly type: "duration";
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
        levelChangeUp: ((parameter: WindowCoveringParameter) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly property: "levelChangeUp";
                readonly propertyKey: WindowCoveringParameter;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly endpoint: number;
                readonly property: "levelChangeUp";
                readonly propertyKey: WindowCoveringParameter;
            };
            readonly meta: {
                readonly label: `${string} - ${string}`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly ccSpecific: {
                    readonly parameter: WindowCoveringParameter;
                };
                readonly readable: false;
                readonly type: "boolean";
                readonly writeable: true;
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
        levelChangeDown: ((parameter: WindowCoveringParameter) => {
            id: {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly property: "levelChangeDown";
                readonly propertyKey: WindowCoveringParameter;
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Window Covering"];
                readonly endpoint: number;
                readonly property: "levelChangeDown";
                readonly propertyKey: WindowCoveringParameter;
            };
            readonly meta: {
                readonly label: `${string} - ${string}`;
                readonly valueChangeOptions: readonly ["transitionDuration"];
                readonly states: {
                    readonly true: "Start";
                    readonly false: "Stop";
                };
                readonly ccSpecific: {
                    readonly parameter: WindowCoveringParameter;
                };
                readonly readable: false;
                readonly type: "boolean";
                readonly writeable: true;
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
    94: Readonly<{
        zwavePlusVersion: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly property: "zwavePlusVersion";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly endpoint: 0;
                readonly property: "zwavePlusVersion";
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
        nodeType: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly property: "nodeType";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly endpoint: 0;
                readonly property: "nodeType";
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
        roleType: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly property: "roleType";
            };
            endpoint: (_endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly endpoint: 0;
                readonly property: "roleType";
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
        userIcon: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly property: "userIcon";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly endpoint: number;
                readonly property: "userIcon";
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
        installerIcon: {
            id: {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly property: "installerIcon";
            };
            endpoint: (endpoint?: number) => {
                readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
                readonly endpoint: number;
                readonly property: "installerIcon";
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
    }>;
};
export {};
//# sourceMappingURL=_CCValues.generated.d.ts.map