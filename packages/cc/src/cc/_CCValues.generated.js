/// This file is auto-generated. All manual changes will be lost!
import { CommandClasses, MAX_NODES, ValueMetadata, ZWaveLibraryTypes, enumValuesToMetadataStates, } from "@zwave-js/core";
import { getEnumMemberName, num2hex } from "@zwave-js/shared";
import { irrigationValveIdToMetadataPrefix, meterTypesToPropertyKey, multilevelSwitchTypeProperties, multilevelSwitchTypeToActions, windowCoveringParameterToLevelChangeLabel, windowCoveringParameterToMetadataStates, } from "../lib/CCValueUtils.js";
import { AlarmSensorType, BarrierState, BatteryChargingStatus, BatteryReplacementStatus, BinarySensorType, ColorComponent, DeviceIdType, DoorLockMode, DoorLockOperationType, EnergyProductionParameter, HumidityControlMode, HumidityControlOperatingState, HumidityControlSetpointType, IrrigationSensorPolarity, LocalProtectionState, RFProtectionState, RateType, ScheduleOverrideType, SubsystemState, SubsystemType, SwitchType, ThermostatFanMode, ThermostatFanState, ThermostatMode, ThermostatOperatingState, ThermostatSetpointType, Weekday, WindowCoveringParameter, } from "../lib/_Types.js";
export const AlarmSensorCCValues = Object.freeze({
    state: Object.assign((sensorType) => {
        const property = "state";
        const propertyKey = sensorType;
        return {
            id: {
                commandClass: CommandClasses["Alarm Sensor"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Alarm Sensor"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                const alarmName = getEnumMemberName(AlarmSensorType, sensorType);
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${alarmName} state`,
                    description: "Whether the alarm is active",
                    ccSpecific: { sensorType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Alarm Sensor"]
                && (({ property, propertyKey }) => property === "state"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    severity: Object.assign((sensorType) => {
        const property = "severity";
        const propertyKey = sensorType;
        return {
            id: {
                commandClass: CommandClasses["Alarm Sensor"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Alarm Sensor"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                const alarmName = getEnumMemberName(AlarmSensorType, sensorType);
                return {
                    ...ValueMetadata.ReadOnlyNumber,
                    min: 1,
                    max: 100,
                    unit: "%",
                    label: `${alarmName} severity`,
                    ccSpecific: { sensorType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Alarm Sensor"]
                && (({ property, propertyKey }) => property === "severity"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    duration: Object.assign((sensorType) => {
        const property = "duration";
        const propertyKey = sensorType;
        return {
            id: {
                commandClass: CommandClasses["Alarm Sensor"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Alarm Sensor"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                const alarmName = getEnumMemberName(AlarmSensorType, sensorType);
                return {
                    ...ValueMetadata.ReadOnlyNumber,
                    unit: "s",
                    label: `${alarmName} duration`,
                    description: "For how long the alarm should be active",
                    ccSpecific: { sensorType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Alarm Sensor"]
                && (({ property, propertyKey }) => property === "duration"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    supportedSensorTypes: {
        id: {
            commandClass: CommandClasses["Alarm Sensor"],
            property: "supportedSensorTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Alarm Sensor"],
            endpoint,
            property: "supportedSensorTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Alarm Sensor"]
                && valueId.property === "supportedSensorTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const AssociationCCValues = Object.freeze({
    hasLifeline: {
        id: {
            commandClass: CommandClasses.Association,
            property: "hasLifeline",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Association,
            endpoint,
            property: "hasLifeline",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Association
                && valueId.property === "hasLifeline"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    groupCount: {
        id: {
            commandClass: CommandClasses.Association,
            property: "groupCount",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Association,
            endpoint,
            property: "groupCount",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Association
                && valueId.property === "groupCount"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    maxNodes: Object.assign((groupId) => {
        const property = "maxNodes";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses.Association,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Association,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Association
                && (({ property, propertyKey }) => property === "maxNodes"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    nodeIds: Object.assign((groupId) => {
        const property = "nodeIds";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses.Association,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Association,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Association
                && (({ property, propertyKey }) => property === "nodeIds"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const AssociationGroupInfoCCValues = Object.freeze({
    hasDynamicInfo: {
        id: {
            commandClass: CommandClasses["Association Group Information"],
            property: "hasDynamicInfo",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Association Group Information"],
            endpoint,
            property: "hasDynamicInfo",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Association Group Information"]
                && valueId.property === "hasDynamicInfo"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    groupName: Object.assign((groupId) => {
        const property = "name";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Association Group Information"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Association Group Information"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Association Group Information"]
                && (({ property, propertyKey }) => property === "name" && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    groupInfo: Object.assign((groupId) => {
        const property = "info";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Association Group Information"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Association Group Information"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Association Group Information"]
                && (({ property, propertyKey }) => property === "info" && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    commands: Object.assign((groupId) => {
        const property = "issuedCommands";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Association Group Information"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Association Group Information"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Association Group Information"]
                && (({ property, propertyKey }) => property === "issuedCommands"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const BarrierOperatorCCValues = Object.freeze({
    supportedSubsystemTypes: {
        id: {
            commandClass: CommandClasses["Barrier Operator"],
            property: "supportedSubsystemTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Barrier Operator"],
            endpoint,
            property: "supportedSubsystemTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Barrier Operator"]
                && valueId.property === "supportedSubsystemTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    position: {
        id: {
            commandClass: CommandClasses["Barrier Operator"],
            property: "position",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Barrier Operator"],
            endpoint,
            property: "position",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Barrier Operator"]
                && valueId.property === "position"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Barrier Position",
                unit: "%",
                max: 100,
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    targetState: {
        id: {
            commandClass: CommandClasses["Barrier Operator"],
            property: "targetState",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Barrier Operator"],
            endpoint,
            property: "targetState",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Barrier Operator"]
                && valueId.property === "targetState"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Target Barrier State",
                states: enumValuesToMetadataStates(BarrierState, [
                    BarrierState.Open,
                    BarrierState.Closed,
                ]),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    currentState: {
        id: {
            commandClass: CommandClasses["Barrier Operator"],
            property: "currentState",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Barrier Operator"],
            endpoint,
            property: "currentState",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Barrier Operator"]
                && valueId.property === "currentState"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Current Barrier State",
                states: enumValuesToMetadataStates(BarrierState),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    signalingState: Object.assign((subsystemType) => {
        const property = "signalingState";
        const propertyKey = subsystemType;
        return {
            id: {
                commandClass: CommandClasses["Barrier Operator"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Barrier Operator"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.UInt8,
                    label: `Signaling State (${getEnumMemberName(SubsystemType, subsystemType)})`,
                    states: enumValuesToMetadataStates(SubsystemState),
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Barrier Operator"]
                && (({ property, propertyKey }) => property === "signalingState"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const BasicCCValues = Object.freeze({
    currentValue: {
        id: {
            commandClass: CommandClasses.Basic,
            property: "currentValue",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Basic,
            endpoint,
            property: "currentValue",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Basic
                && valueId.property === "currentValue"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyLevel,
                label: "Current value",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    targetValue: {
        id: {
            commandClass: CommandClasses.Basic,
            property: "targetValue",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Basic,
            endpoint,
            property: "targetValue",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Basic
                && valueId.property === "targetValue"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Target value",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    duration: {
        id: {
            commandClass: CommandClasses.Basic,
            property: "duration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Basic,
            endpoint,
            property: "duration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Basic
                && valueId.property === "duration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyDuration,
                label: "Remaining duration",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    restorePrevious: {
        id: {
            commandClass: CommandClasses.Basic,
            property: "restorePrevious",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Basic,
            endpoint,
            property: "restorePrevious",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Basic
                && valueId.property === "restorePrevious"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: "Restore previous value",
                states: {
                    true: "Restore",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    compatEvent: {
        id: {
            commandClass: CommandClasses.Basic,
            property: "event",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Basic,
            endpoint,
            property: "event",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Basic
                && valueId.property === "event"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Event value",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: false,
            supportsEndpoints: true,
            autoCreate: false,
        },
    },
});
export const BasicWindowCoveringCCValues = Object.freeze({
    levelChangeUp: {
        id: {
            commandClass: CommandClasses["Basic Window Covering"],
            property: "levelChangeUp",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Basic Window Covering"],
            endpoint,
            property: "levelChangeUp",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Basic Window Covering"]
                && valueId.property === "levelChangeUp"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: "Open",
                states: {
                    true: "Start",
                    false: "Stop",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    levelChangeDown: {
        id: {
            commandClass: CommandClasses["Basic Window Covering"],
            property: "levelChangeDown",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Basic Window Covering"],
            endpoint,
            property: "levelChangeDown",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Basic Window Covering"]
                && valueId.property === "levelChangeDown"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: "Close",
                states: {
                    true: "Start",
                    false: "Stop",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const BatteryCCValues = Object.freeze({
    level: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "level",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "level",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "level"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                max: 100,
                unit: "%",
                label: "Battery level",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    maximumCapacity: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "maximumCapacity",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "maximumCapacity",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "maximumCapacity"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                max: 100,
                unit: "%",
                label: "Maximum capacity",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    temperature: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "temperature",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "temperature",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "temperature"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyInt8,
                label: "Temperature",
                // For now, only °C is specified as a valid unit
                // If this ever changes, update the unit in persistValues on the fly
                unit: "°C",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    chargingStatus: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "chargingStatus",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "chargingStatus",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "chargingStatus"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Charging status",
                states: enumValuesToMetadataStates(BatteryChargingStatus),
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    rechargeable: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "rechargeable",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "rechargeable",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "rechargeable"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Rechargeable",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    backup: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "backup",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "backup",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "backup"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Used as backup",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    overheating: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "overheating",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "overheating",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "overheating"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Overheating",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    lowFluid: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "lowFluid",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "lowFluid",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "lowFluid"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Fluid is low",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    rechargeOrReplace: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "rechargeOrReplace",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "rechargeOrReplace",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "rechargeOrReplace"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Recharge or replace",
                states: enumValuesToMetadataStates(BatteryReplacementStatus),
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    disconnected: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "disconnected",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "disconnected",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "disconnected"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Battery is disconnected",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    lowTemperatureStatus: {
        id: {
            commandClass: CommandClasses.Battery,
            property: "lowTemperatureStatus",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Battery,
            endpoint,
            property: "lowTemperatureStatus",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Battery
                && valueId.property === "lowTemperatureStatus"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Battery temperature is low",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const BinarySensorCCValues = Object.freeze({
    supportedSensorTypes: {
        id: {
            commandClass: CommandClasses["Binary Sensor"],
            property: "supportedSensorTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Binary Sensor"],
            endpoint,
            property: "supportedSensorTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Binary Sensor"]
                && valueId.property === "supportedSensorTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    state: Object.assign((sensorType) => {
        const property = getEnumMemberName(BinarySensorType, sensorType);
        return {
            id: {
                commandClass: CommandClasses["Binary Sensor"],
                property,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Binary Sensor"],
                endpoint,
                property: property,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `Sensor state (${getEnumMemberName(BinarySensorType, sensorType)})`,
                    ccSpecific: { sensorType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Binary Sensor"]
                && (({ property }) => typeof property === "string"
                    && property in BinarySensorType)(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const BinarySwitchCCValues = Object.freeze({
    currentValue: {
        id: {
            commandClass: CommandClasses["Binary Switch"],
            property: "currentValue",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Binary Switch"],
            endpoint,
            property: "currentValue",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Binary Switch"]
                && valueId.property === "currentValue"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Current value",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    targetValue: {
        id: {
            commandClass: CommandClasses["Binary Switch"],
            property: "targetValue",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Binary Switch"],
            endpoint,
            property: "targetValue",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Binary Switch"]
                && valueId.property === "targetValue"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Boolean,
                label: "Target value",
                valueChangeOptions: ["transitionDuration"],
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    duration: {
        id: {
            commandClass: CommandClasses["Binary Switch"],
            property: "duration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Binary Switch"],
            endpoint,
            property: "duration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Binary Switch"]
                && valueId.property === "duration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyDuration,
                label: "Remaining duration",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const CentralSceneCCValues = Object.freeze({
    sceneCount: {
        id: {
            commandClass: CommandClasses["Central Scene"],
            property: "sceneCount",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Central Scene"],
            endpoint,
            property: "sceneCount",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Central Scene"]
                && valueId.property === "sceneCount"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsSlowRefresh: {
        id: {
            commandClass: CommandClasses["Central Scene"],
            property: "supportsSlowRefresh",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Central Scene"],
            endpoint,
            property: "supportsSlowRefresh",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Central Scene"]
                && valueId.property === "supportsSlowRefresh"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedKeyAttributes: {
        id: {
            commandClass: CommandClasses["Central Scene"],
            property: "supportedKeyAttributes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Central Scene"],
            endpoint,
            property: "supportedKeyAttributes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Central Scene"]
                && valueId.property === "supportedKeyAttributes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    slowRefresh: {
        id: {
            commandClass: CommandClasses["Central Scene"],
            property: "slowRefresh",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Central Scene"],
            endpoint,
            property: "slowRefresh",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Central Scene"]
                && valueId.property === "slowRefresh"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Boolean,
                label: "Send held down notifications at a slow rate",
                description: "When this is true, KeyHeldDown notifications are sent every 55s. When this is false, the notifications are sent every 200ms.",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    scene: Object.assign((sceneNumber) => {
        const property = "scene";
        const propertyKey = sceneNumber.toString().padStart(3, "0");
        return {
            id: {
                commandClass: CommandClasses["Central Scene"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Central Scene"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyUInt8,
                    label: `Scene ${sceneNumber.toString().padStart(3, "0")}`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Central Scene"]
                && (({ property, propertyKey }) => property === "scene"
                    && typeof propertyKey === "string"
                    && /^\d{3}$/.test(propertyKey))(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: false,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const ClimateControlScheduleCCValues = Object.freeze({
    overrideType: {
        id: {
            commandClass: CommandClasses["Climate Control Schedule"],
            property: "overrideType",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Climate Control Schedule"],
            endpoint,
            property: "overrideType",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Climate Control Schedule"]
                && valueId.property === "overrideType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "Override type",
                states: enumValuesToMetadataStates(ScheduleOverrideType),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    overrideState: {
        id: {
            commandClass: CommandClasses["Climate Control Schedule"],
            property: "overrideState",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Climate Control Schedule"],
            endpoint,
            property: "overrideState",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Climate Control Schedule"]
                && valueId.property === "overrideState"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "Override state",
                min: -12.8,
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    schedule: Object.assign((weekday) => {
        const property = "schedule";
        const propertyKey = weekday;
        return {
            id: {
                commandClass: CommandClasses["Climate Control Schedule"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Climate Control Schedule"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Any,
                    label: `Schedule (${getEnumMemberName(Weekday, weekday)})`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Climate Control Schedule"]
                && (({ property, propertyKey }) => property === "switchPoints"
                    && typeof propertyKey === "number"
                    && propertyKey >= Weekday.Monday
                    && propertyKey <= Weekday.Sunday)(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const ColorSwitchCCValues = Object.freeze({
    supportedColorComponents: {
        id: {
            commandClass: CommandClasses["Color Switch"],
            property: "supportedColorComponents",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Color Switch"],
            endpoint,
            property: "supportedColorComponents",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && valueId.property === "supportedColorComponents"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsHexColor: {
        id: {
            commandClass: CommandClasses["Color Switch"],
            property: "supportsHexColor",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Color Switch"],
            endpoint,
            property: "supportsHexColor",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && valueId.property === "supportsHexColor"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    currentColor: {
        id: {
            commandClass: CommandClasses["Color Switch"],
            property: "currentColor",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Color Switch"],
            endpoint,
            property: "currentColor",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && valueId.property === "currentColor"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: `Current color`,
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    targetColor: {
        id: {
            commandClass: CommandClasses["Color Switch"],
            property: "targetColor",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Color Switch"],
            endpoint,
            property: "targetColor",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && valueId.property === "targetColor"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Any,
                label: `Target color`,
                valueChangeOptions: ["transitionDuration"],
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    duration: {
        id: {
            commandClass: CommandClasses["Color Switch"],
            property: "duration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Color Switch"],
            endpoint,
            property: "duration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && valueId.property === "duration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyDuration,
                label: "Remaining duration",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    hexColor: {
        id: {
            commandClass: CommandClasses["Color Switch"],
            property: "hexColor",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Color Switch"],
            endpoint,
            property: "hexColor",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && valueId.property === "hexColor"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Color,
                minLength: 6,
                maxLength: 7, // to allow #rrggbb
                label: `RGB Color`,
                valueChangeOptions: ["transitionDuration"],
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    currentColorChannel: Object.assign((component) => {
        const property = "currentColor";
        const propertyKey = component;
        return {
            id: {
                commandClass: CommandClasses["Color Switch"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Color Switch"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                const colorName = getEnumMemberName(ColorComponent, component);
                return {
                    ...ValueMetadata.ReadOnlyUInt8,
                    label: `Current value (${colorName})`,
                    description: `The current value of the ${colorName} channel.`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && (({ property, propertyKey }) => property === "currentColor"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    targetColorChannel: Object.assign((component) => {
        const property = "targetColor";
        const propertyKey = component;
        return {
            id: {
                commandClass: CommandClasses["Color Switch"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Color Switch"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                const colorName = getEnumMemberName(ColorComponent, component);
                return {
                    ...ValueMetadata.UInt8,
                    label: `Target value (${colorName})`,
                    description: `The target value of the ${colorName} channel.`,
                    valueChangeOptions: ["transitionDuration"],
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Color Switch"]
                && (({ property, propertyKey }) => property === "targetColor"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const ConfigurationCCValues = Object.freeze({
    isParamInformationFromConfig: {
        id: {
            commandClass: CommandClasses.Configuration,
            property: "isParamInformationFromConfig",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Configuration,
            endpoint: 0, // no endpoint support!
            property: "isParamInformationFromConfig",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Configuration
                && valueId.property === "isParamInformationFromConfig"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    paramInformation: Object.assign((parameter, bitMask) => {
        const property = parameter;
        const propertyKey = bitMask;
        return {
            id: {
                commandClass: CommandClasses.Configuration,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Configuration,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Configuration
                && (({ property, propertyKey }) => typeof property === "number"
                    && (typeof propertyKey === "number"
                        || propertyKey == undefined))(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const DoorLockCCValues = Object.freeze({
    targetMode: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "targetMode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "targetMode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "targetMode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Target lock mode",
                states: enumValuesToMetadataStates(DoorLockMode),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    currentMode: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "currentMode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "currentMode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "currentMode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Current lock mode",
                states: enumValuesToMetadataStates(DoorLockMode),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    duration: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "duration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "duration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "duration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyDuration,
                label: "Remaining duration until target lock mode",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedOutsideHandles: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "supportedOutsideHandles",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "supportedOutsideHandles",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "supportedOutsideHandles"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    outsideHandlesCanOpenDoorConfiguration: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "outsideHandlesCanOpenDoorConfiguration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "outsideHandlesCanOpenDoorConfiguration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "outsideHandlesCanOpenDoorConfiguration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Any,
                label: "Which outside handles can open the door (configuration)",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    outsideHandlesCanOpenDoor: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "outsideHandlesCanOpenDoor",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "outsideHandlesCanOpenDoor",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "outsideHandlesCanOpenDoor"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: "Which outside handles can open the door (actual status)",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedInsideHandles: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "supportedInsideHandles",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "supportedInsideHandles",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "supportedInsideHandles"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    insideHandlesCanOpenDoorConfiguration: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "insideHandlesCanOpenDoorConfiguration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "insideHandlesCanOpenDoorConfiguration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "insideHandlesCanOpenDoorConfiguration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Any,
                label: "Which inside handles can open the door (configuration)",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    insideHandlesCanOpenDoor: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "insideHandlesCanOpenDoor",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "insideHandlesCanOpenDoor",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "insideHandlesCanOpenDoor"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: "Which inside handles can open the door (actual status)",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    operationType: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "operationType",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "operationType",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "operationType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Lock operation type",
                states: enumValuesToMetadataStates(DoorLockOperationType),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    lockTimeoutConfiguration: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "lockTimeoutConfiguration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "lockTimeoutConfiguration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "lockTimeoutConfiguration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt16,
                label: "Duration of timed mode in seconds",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    lockTimeout: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "lockTimeout",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "lockTimeout",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "lockTimeout"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt16,
                label: "Seconds until lock mode times out",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    autoRelockSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "autoRelockSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "autoRelockSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "autoRelockSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    autoRelockTime: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "autoRelockTime",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "autoRelockTime",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "autoRelockTime"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt16,
                label: "Duration in seconds until lock returns to secure state",
            };
        },
        options: {
            internal: false,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateAutoRelockConfigValue,
        },
    },
    holdAndReleaseSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "holdAndReleaseSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "holdAndReleaseSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "holdAndReleaseSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    holdAndReleaseTime: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "holdAndReleaseTime",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "holdAndReleaseTime",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "holdAndReleaseTime"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt16,
                label: "Duration in seconds the latch stays retracted",
            };
        },
        options: {
            internal: false,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateHoldAndReleaseConfigValue,
        },
    },
    twistAssistSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "twistAssistSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "twistAssistSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "twistAssistSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    twistAssist: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "twistAssist",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "twistAssist",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "twistAssist"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Boolean,
                label: "Twist Assist enabled",
            };
        },
        options: {
            internal: false,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateTwistAssistConfigValue,
        },
    },
    blockToBlockSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "blockToBlockSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "blockToBlockSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "blockToBlockSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    blockToBlock: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "blockToBlock",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "blockToBlock",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "blockToBlock"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Boolean,
                label: "Block-to-block functionality enabled",
            };
        },
        options: {
            internal: false,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateBlockToBlockConfigValue,
        },
    },
    latchSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "latchSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "latchSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "latchSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    latchStatus: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "latchStatus",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "latchStatus",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "latchStatus"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: "Current status of the latch",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateLatchStatusValue,
        },
    },
    boltSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "boltSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "boltSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "boltSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    boltStatus: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "boltStatus",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "boltStatus",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "boltStatus"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: "Current status of the bolt",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateBoltStatusValue,
        },
    },
    doorSupported: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "doorSupported",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "doorSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "doorSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    doorStatus: {
        id: {
            commandClass: CommandClasses["Door Lock"],
            property: "doorStatus",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock"],
            endpoint,
            property: "doorStatus",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock"]
                && valueId.property === "doorStatus"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: "Current status of the door",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateDoorStatusValue,
        },
    },
});
function shouldAutoCreateAutoRelockConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.autoRelockSupported.endpoint(endpoint.index));
}
function shouldAutoCreateHoldAndReleaseConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.holdAndReleaseSupported.endpoint(endpoint.index));
}
function shouldAutoCreateTwistAssistConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.twistAssistSupported.endpoint(endpoint.index));
}
function shouldAutoCreateBlockToBlockConfigValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.blockToBlockSupported.endpoint(endpoint.index));
}
function shouldAutoCreateLatchStatusValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.latchSupported.endpoint(endpoint.index));
}
function shouldAutoCreateBoltStatusValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.boltSupported.endpoint(endpoint.index));
}
function shouldAutoCreateDoorStatusValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    return !!valueDB.getValue(DoorLockCCValues.doorSupported.endpoint(endpoint.index));
}
export const DoorLockLoggingCCValues = Object.freeze({
    recordsCount: {
        id: {
            commandClass: CommandClasses["Door Lock Logging"],
            property: "recordsCount",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Door Lock Logging"],
            endpoint,
            property: "recordsCount",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Door Lock Logging"]
                && valueId.property === "recordsCount"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const EnergyProductionCCValues = Object.freeze({
    value: Object.assign((parameter) => {
        const property = "value";
        const propertyKey = parameter;
        return {
            id: {
                commandClass: CommandClasses["Energy Production"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Energy Production"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyNumber,
                    label: getEnumMemberName(EnergyProductionParameter, parameter),
                    // unit and ccSpecific are set dynamically
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Energy Production"]
                && (({ property, propertyKey }) => property === "value"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const EntryControlCCValues = Object.freeze({
    keyCacheSize: {
        id: {
            commandClass: CommandClasses["Entry Control"],
            property: "keyCacheSize",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Entry Control"],
            endpoint,
            property: "keyCacheSize",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Entry Control"]
                && valueId.property === "keyCacheSize"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Key cache size",
                description: "Number of character that must be stored before sending",
                min: 1,
                max: 32,
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    keyCacheTimeout: {
        id: {
            commandClass: CommandClasses["Entry Control"],
            property: "keyCacheTimeout",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Entry Control"],
            endpoint,
            property: "keyCacheTimeout",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Entry Control"]
                && valueId.property === "keyCacheTimeout"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Key cache timeout",
                unit: "seconds",
                description: "How long the key cache must wait for additional characters",
                min: 1,
                max: 10,
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedDataTypes: {
        id: {
            commandClass: CommandClasses["Entry Control"],
            property: "supportedDataTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Entry Control"],
            endpoint,
            property: "supportedDataTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Entry Control"]
                && valueId.property === "supportedDataTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedEventTypes: {
        id: {
            commandClass: CommandClasses["Entry Control"],
            property: "supportedEventTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Entry Control"],
            endpoint,
            property: "supportedEventTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Entry Control"]
                && valueId.property === "supportedEventTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedKeys: {
        id: {
            commandClass: CommandClasses["Entry Control"],
            property: "supportedKeys",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Entry Control"],
            endpoint,
            property: "supportedKeys",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Entry Control"]
                && valueId.property === "supportedKeys"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const FirmwareUpdateMetaDataCCValues = Object.freeze({
    supportsActivation: {
        id: {
            commandClass: CommandClasses["Firmware Update Meta Data"],
            property: "supportsActivation",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Firmware Update Meta Data"],
            endpoint,
            property: "supportsActivation",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Firmware Update Meta Data"]
                && valueId.property === "supportsActivation"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    firmwareUpgradable: {
        id: {
            commandClass: CommandClasses["Firmware Update Meta Data"],
            property: "firmwareUpgradable",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Firmware Update Meta Data"],
            endpoint,
            property: "firmwareUpgradable",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Firmware Update Meta Data"]
                && valueId.property === "firmwareUpgradable"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    additionalFirmwareIDs: {
        id: {
            commandClass: CommandClasses["Firmware Update Meta Data"],
            property: "additionalFirmwareIDs",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Firmware Update Meta Data"],
            endpoint,
            property: "additionalFirmwareIDs",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Firmware Update Meta Data"]
                && valueId.property === "additionalFirmwareIDs"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    continuesToFunction: {
        id: {
            commandClass: CommandClasses["Firmware Update Meta Data"],
            property: "continuesToFunction",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Firmware Update Meta Data"],
            endpoint,
            property: "continuesToFunction",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Firmware Update Meta Data"]
                && valueId.property === "continuesToFunction"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsResuming: {
        id: {
            commandClass: CommandClasses["Firmware Update Meta Data"],
            property: "supportsResuming",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Firmware Update Meta Data"],
            endpoint,
            property: "supportsResuming",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Firmware Update Meta Data"]
                && valueId.property === "supportsResuming"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsNonSecureTransfer: {
        id: {
            commandClass: CommandClasses["Firmware Update Meta Data"],
            property: "supportsNonSecureTransfer",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Firmware Update Meta Data"],
            endpoint,
            property: "supportsNonSecureTransfer",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Firmware Update Meta Data"]
                && valueId.property === "supportsNonSecureTransfer"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const HumidityControlModeCCValues = Object.freeze({
    mode: {
        id: {
            commandClass: CommandClasses["Humidity Control Mode"],
            property: "mode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Humidity Control Mode"],
            endpoint,
            property: "mode",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Humidity Control Mode"]
                && valueId.property === "mode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                states: enumValuesToMetadataStates(HumidityControlMode),
                label: "Humidity control mode",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedModes: {
        id: {
            commandClass: CommandClasses["Humidity Control Mode"],
            property: "supportedModes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Humidity Control Mode"],
            endpoint,
            property: "supportedModes",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Humidity Control Mode"]
                && valueId.property === "supportedModes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const HumidityControlOperatingStateCCValues = Object.freeze({
    state: {
        id: {
            commandClass: CommandClasses["Humidity Control Operating State"],
            property: "state",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Humidity Control Operating State"],
            endpoint,
            property: "state",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Humidity Control Operating State"]
                && valueId.property === "state"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                states: enumValuesToMetadataStates(HumidityControlOperatingState),
                label: "Humidity control operating state",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const HumidityControlSetpointCCValues = Object.freeze({
    supportedSetpointTypes: {
        id: {
            commandClass: CommandClasses["Humidity Control Setpoint"],
            property: "supportedSetpointTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Humidity Control Setpoint"],
            endpoint,
            property: "supportedSetpointTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Humidity Control Setpoint"]
                && valueId.property === "supportedSetpointTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    setpoint: Object.assign((setpointType) => {
        const property = "setpoint";
        const propertyKey = setpointType;
        return {
            id: {
                commandClass: CommandClasses["Humidity Control Setpoint"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Humidity Control Setpoint"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    // This is the base metadata that will be extended on the fly
                    ...ValueMetadata.Number,
                    label: `Setpoint (${getEnumMemberName(HumidityControlSetpointType, setpointType)})`,
                    ccSpecific: { setpointType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Humidity Control Setpoint"]
                && (({ property, propertyKey }) => property === "setpoint"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    setpointScale: Object.assign((setpointType) => {
        const property = "setpointScale";
        const propertyKey = setpointType;
        return {
            id: {
                commandClass: CommandClasses["Humidity Control Setpoint"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Humidity Control Setpoint"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyUInt8,
                    label: `Setpoint scale (${getEnumMemberName(HumidityControlSetpointType, setpointType)})`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Humidity Control Setpoint"]
                && (({ property, propertyKey }) => property === "setpointScale"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const IndicatorCCValues = Object.freeze({
    supportedIndicatorIds: {
        id: {
            commandClass: CommandClasses.Indicator,
            property: "supportedIndicatorIds",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Indicator,
            endpoint,
            property: "supportedIndicatorIds",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && valueId.property === "supportedIndicatorIds"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    valueV1: {
        id: {
            commandClass: CommandClasses.Indicator,
            property: "value",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Indicator,
            endpoint,
            property: "value",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && valueId.property === "value"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Indicator value",
                ccSpecific: {
                    indicatorId: 0,
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    identify: {
        id: {
            commandClass: CommandClasses.Indicator,
            property: "identify",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Indicator,
            endpoint,
            property: "identify",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && valueId.property === "identify"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: "Identify",
                states: {
                    true: "Identify",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedPropertyIDs: Object.assign((indicatorId) => {
        const property = "supportedPropertyIDs";
        const propertyKey = indicatorId;
        return {
            id: {
                commandClass: CommandClasses.Indicator,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Indicator,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && (({ property, propertyKey }) => property === "supportedPropertyIDs"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    valueV2: Object.assign((indicatorId, propertyId) => {
        const property = indicatorId;
        const propertyKey = propertyId;
        return {
            id: {
                commandClass: CommandClasses.Indicator,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Indicator,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Any,
                    ccSpecific: {
                        indicatorId,
                        propertyId,
                    },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && (({ property, propertyKey }) => typeof property === "number"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    timeout: Object.assign((indicatorId) => {
        const property = indicatorId;
        const propertyKey = "timeout";
        return {
            id: {
                commandClass: CommandClasses.Indicator,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Indicator,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.String,
                    label: "Timeout",
                    ccSpecific: {
                        indicatorId,
                    },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && (({ property, propertyKey }) => typeof property === "number"
                    && propertyKey === "timeout")(valueId);
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    indicatorDescription: Object.assign((indicatorId) => {
        const property = indicatorId;
        return {
            id: {
                commandClass: CommandClasses.Indicator,
                property,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Indicator,
                endpoint,
                property: property,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Indicator
                && (({ property }) => typeof property === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 4,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const IrrigationCCValues = Object.freeze({
    numValves: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "numValves",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "numValves",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "numValves"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    numValveTables: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "numValveTables",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "numValveTables",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "numValveTables"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsMasterValve: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "supportsMasterValve",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "supportsMasterValve",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "supportsMasterValve"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    maxValveTableSize: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "maxValveTableSize",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "maxValveTableSize",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "maxValveTableSize"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    systemVoltage: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "systemVoltage",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "systemVoltage",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "systemVoltage"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "System voltage",
                unit: "V",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    masterValveDelay: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "masterValveDelay",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "masterValveDelay",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "masterValveDelay"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Master valve delay",
                description: "The delay between turning on the master valve and turning on any zone valve",
                unit: "seconds",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    flowSensorActive: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "flowSensorActive",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "flowSensorActive",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "flowSensorActive"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Flow sensor active",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    pressureSensorActive: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "pressureSensorActive",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "pressureSensorActive",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "pressureSensorActive"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Pressure sensor active",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    rainSensorActive: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "rainSensorActive",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "rainSensorActive",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "rainSensorActive"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Rain sensor attached and active",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    rainSensorPolarity: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "rainSensorPolarity",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "rainSensorPolarity",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "rainSensorPolarity"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "Rain sensor polarity",
                min: 0,
                max: 1,
                states: enumValuesToMetadataStates(IrrigationSensorPolarity),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    moistureSensorActive: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "moistureSensorActive",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "moistureSensorActive",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "moistureSensorActive"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Moisture sensor attached and active",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    moistureSensorPolarity: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "moistureSensorPolarity",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "moistureSensorPolarity",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "moistureSensorPolarity"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "Moisture sensor polarity",
                min: 0,
                max: 1,
                states: enumValuesToMetadataStates(IrrigationSensorPolarity),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    flow: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "flow",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "flow",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "flow"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyNumber,
                label: "Flow",
                unit: "l/h",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    pressure: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "pressure",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "pressure",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "pressure"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyNumber,
                label: "Pressure",
                unit: "kPa",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    shutoffDuration: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "shutoffDuration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "shutoffDuration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "shutoffDuration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Remaining shutoff duration",
                unit: "hours",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    errorNotProgrammed: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "errorNotProgrammed",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "errorNotProgrammed",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "errorNotProgrammed"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Error: device not programmed",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    errorEmergencyShutdown: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "errorEmergencyShutdown",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "errorEmergencyShutdown",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "errorEmergencyShutdown"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Error: emergency shutdown",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    errorHighPressure: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "errorHighPressure",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "errorHighPressure",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "errorHighPressure"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Error: high pressure",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    highPressureThreshold: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "highPressureThreshold",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "highPressureThreshold",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "highPressureThreshold"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "High pressure threshold",
                unit: "kPa",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    errorLowPressure: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "errorLowPressure",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "errorLowPressure",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "errorLowPressure"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Error: low pressure",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    lowPressureThreshold: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "lowPressureThreshold",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "lowPressureThreshold",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "lowPressureThreshold"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "Low pressure threshold",
                unit: "kPa",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    errorValve: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "errorValve",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "errorValve",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "errorValve"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Error: valve reporting error",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    masterValveOpen: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "masterValveOpen",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "masterValveOpen",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "masterValveOpen"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Master valve is open",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    firstOpenZoneId: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "firstOpenZoneId",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "firstOpenZoneId",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "firstOpenZoneId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyNumber,
                label: "First open zone valve ID",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    shutoffSystem: {
        id: {
            commandClass: CommandClasses.Irrigation,
            property: "shutoff",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Irrigation,
            endpoint,
            property: "shutoff",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && valueId.property === "shutoff"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: `Shutoff system`,
                states: {
                    true: "Shutoff",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    valveConnected: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "valveConnected";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Connected`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "valveConnected")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    nominalCurrent: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "nominalCurrent";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Nominal current`,
                    unit: "mA",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "nominalCurrent")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    nominalCurrentHighThreshold: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "nominalCurrentHighThreshold";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Nominal current - high threshold`,
                    min: 0,
                    max: 2550,
                    unit: "mA",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "nominalCurrentHighThreshold")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    nominalCurrentLowThreshold: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "nominalCurrentLowThreshold";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Nominal current - low threshold`,
                    min: 0,
                    max: 2550,
                    unit: "mA",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "nominalCurrentLowThreshold")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    errorShortCircuit: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "errorShortCircuit";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Short circuit detected`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "errorShortCircuit")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    errorHighCurrent: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "errorHighCurrent";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Current above high threshold`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "errorHighCurrent")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    errorLowCurrent: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "errorLowCurrent";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Current below low threshold`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "errorLowCurrent")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    maximumFlow: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "maximumFlow";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Maximum flow`,
                    min: 0,
                    unit: "l/h",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "maximumFlow")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    errorMaximumFlow: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "errorMaximumFlow";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Maximum flow detected`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "errorMaximumFlow")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    highFlowThreshold: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "highFlowThreshold";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: High flow threshold`,
                    min: 0,
                    unit: "l/h",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "highFlowThreshold")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    errorHighFlow: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "errorHighFlow";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Flow above high threshold`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "errorHighFlow")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    lowFlowThreshold: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "lowFlowThreshold";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Low flow threshold`,
                    min: 0,
                    unit: "l/h",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "lowFlowThreshold")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    errorLowFlow: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "errorLowFlow";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyBoolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Error - Flow below high threshold`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "errorLowFlow")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    useRainSensor: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "useRainSensor";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Boolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Use rain sensor`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "useRainSensor")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    useMoistureSensor: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "useMoistureSensor";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Boolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Use moisture sensor`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "useMoistureSensor")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    valveRunDuration: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "duration";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.UInt16,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Run duration`,
                    min: 1,
                    unit: "s",
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "duration")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    valveRunStartStop: Object.assign((valveId) => {
        const property = valveId;
        const propertyKey = "startStop";
        return {
            id: {
                commandClass: CommandClasses.Irrigation,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Irrigation,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Boolean,
                    label: `${irrigationValveIdToMetadataPrefix(valveId)}: Start/Stop`,
                    states: {
                        true: "Start",
                        false: "Stop",
                    },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Irrigation
                && (({ property, propertyKey }) => (typeof property === "number" || property === "master")
                    && propertyKey === "startStop")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const LanguageCCValues = Object.freeze({
    language: {
        id: {
            commandClass: CommandClasses.Language,
            property: "language",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Language,
            endpoint,
            property: "language",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Language
                && valueId.property === "language"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Language code",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    country: {
        id: {
            commandClass: CommandClasses.Language,
            property: "country",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Language,
            endpoint,
            property: "country",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Language
                && valueId.property === "country"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Country code",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const LockCCValues = Object.freeze({
    locked: {
        id: {
            commandClass: CommandClasses.Lock,
            property: "locked",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Lock,
            endpoint,
            property: "locked",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Lock
                && valueId.property === "locked"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Boolean,
                label: "Locked",
                description: "Whether the lock is locked",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const ManufacturerSpecificCCValues = Object.freeze({
    manufacturerId: {
        id: {
            commandClass: CommandClasses["Manufacturer Specific"],
            property: "manufacturerId",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Manufacturer Specific"],
            endpoint: 0, // no endpoint support!
            property: "manufacturerId",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Manufacturer Specific"]
                && valueId.property === "manufacturerId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt16,
                label: "Manufacturer ID",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    productType: {
        id: {
            commandClass: CommandClasses["Manufacturer Specific"],
            property: "productType",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Manufacturer Specific"],
            endpoint: 0, // no endpoint support!
            property: "productType",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Manufacturer Specific"]
                && valueId.property === "productType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt16,
                label: "Product type",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    productId: {
        id: {
            commandClass: CommandClasses["Manufacturer Specific"],
            property: "productId",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Manufacturer Specific"],
            endpoint: 0, // no endpoint support!
            property: "productId",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Manufacturer Specific"]
                && valueId.property === "productId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt16,
                label: "Product ID",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    deviceId: Object.assign((type) => {
        const property = "deviceId";
        const propertyKey = getEnumMemberName(DeviceIdType, type);
        return {
            id: {
                commandClass: CommandClasses["Manufacturer Specific"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Manufacturer Specific"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyString,
                    label: `Device ID (${getEnumMemberName(DeviceIdType, type)})`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Manufacturer Specific"]
                && (({ property, propertyKey }) => property === "deviceId"
                    && typeof propertyKey === "string"
                    && propertyKey in DeviceIdType)(valueId);
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const MeterCCValues = Object.freeze({
    type: {
        id: {
            commandClass: CommandClasses.Meter,
            property: "type",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Meter,
            endpoint,
            property: "type",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && valueId.property === "type"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsReset: {
        id: {
            commandClass: CommandClasses.Meter,
            property: "supportsReset",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Meter,
            endpoint,
            property: "supportsReset",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && valueId.property === "supportsReset"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedScales: {
        id: {
            commandClass: CommandClasses.Meter,
            property: "supportedScales",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Meter,
            endpoint,
            property: "supportedScales",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && valueId.property === "supportedScales"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedRateTypes: {
        id: {
            commandClass: CommandClasses.Meter,
            property: "supportedRateTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Meter,
            endpoint,
            property: "supportedRateTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && valueId.property === "supportedRateTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    resetAll: {
        id: {
            commandClass: CommandClasses.Meter,
            property: "reset",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Meter,
            endpoint,
            property: "reset",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && valueId.property === "reset"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: `Reset accumulated values`,
                states: {
                    true: "Reset",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    resetSingle: Object.assign((meterType, rateType, scale) => {
        const property = "reset";
        const propertyKey = meterTypesToPropertyKey(meterType, rateType, scale);
        return {
            id: {
                commandClass: CommandClasses.Meter,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Meter,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.WriteOnlyBoolean,
                    // This is only a placeholder label. A config manager is needed to
                    // determine the actual label.
                    label: `Reset (${rateType === RateType.Consumed
                        ? "Consumption, "
                        : rateType === RateType.Produced
                            ? "Production, "
                            : ""}${num2hex(scale)})`,
                    states: {
                        true: "Reset",
                    },
                    ccSpecific: {
                        meterType,
                        rateType,
                        scale,
                    },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && (({ property, propertyKey }) => property === "reset"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    value: Object.assign((meterType, rateType, scale) => {
        const property = "value";
        const propertyKey = meterTypesToPropertyKey(meterType, rateType, scale);
        return {
            id: {
                commandClass: CommandClasses.Meter,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Meter,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyNumber,
                    // Label and unit can only be determined with a config manager
                    ccSpecific: {
                        meterType,
                        rateType,
                        scale,
                    },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Meter
                && (({ property, propertyKey }) => property === "value"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const MultiChannelAssociationCCValues = Object.freeze({
    groupCount: {
        id: {
            commandClass: CommandClasses["Multi Channel Association"],
            property: "groupCount",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multi Channel Association"],
            endpoint,
            property: "groupCount",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multi Channel Association"]
                && valueId.property === "groupCount"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    maxNodes: Object.assign((groupId) => {
        const property = "maxNodes";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Multi Channel Association"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multi Channel Association"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multi Channel Association"]
                && (({ property, propertyKey }) => property === "maxNodes"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    nodeIds: Object.assign((groupId) => {
        const property = "nodeIds";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Multi Channel Association"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multi Channel Association"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multi Channel Association"]
                && (({ property, propertyKey }) => property === "nodeIds"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    endpoints: Object.assign((groupId) => {
        const property = "endpoints";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Multi Channel Association"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multi Channel Association"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multi Channel Association"]
                && (({ property, propertyKey }) => property === "endpoints"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const MultiChannelCCValues = Object.freeze({
    endpointIndizes: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "endpointIndizes",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint: 0, // no endpoint support!
            property: "endpointIndizes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "endpointIndizes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    individualEndpointCount: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "individualCount",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint: 0, // no endpoint support!
            property: "individualCount",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "individualCount"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    aggregatedEndpointCount: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "aggregatedCount",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint: 0, // no endpoint support!
            property: "aggregatedCount",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "aggregatedCount"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    endpointCountIsDynamic: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "countIsDynamic",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint: 0, // no endpoint support!
            property: "countIsDynamic",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "countIsDynamic"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    endpointsHaveIdenticalCapabilities: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "identicalCapabilities",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint: 0, // no endpoint support!
            property: "identicalCapabilities",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "identicalCapabilities"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    endpointCCs: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "commandClasses",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint,
            property: "commandClasses",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "commandClasses"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    endpointDeviceClass: {
        id: {
            commandClass: CommandClasses["Multi Channel"],
            property: "deviceClass",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multi Channel"],
            endpoint,
            property: "deviceClass",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && valueId.property === "deviceClass"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    aggregatedEndpointMembers: Object.assign((endpointIndex) => {
        const property = "members";
        const propertyKey = endpointIndex;
        return {
            id: {
                commandClass: CommandClasses["Multi Channel"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multi Channel"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multi Channel"]
                && (({ property, propertyKey }) => property === "members"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const MultilevelSensorCCValues = Object.freeze({
    supportedSensorTypes: {
        id: {
            commandClass: CommandClasses["Multilevel Sensor"],
            property: "supportedSensorTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Sensor"],
            endpoint,
            property: "supportedSensorTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Sensor"]
                && valueId.property === "supportedSensorTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedScales: Object.assign((sensorType) => {
        const property = "supportedScales";
        const propertyKey = sensorType;
        return {
            id: {
                commandClass: CommandClasses["Multilevel Sensor"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multilevel Sensor"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multilevel Sensor"]
                && (({ property, propertyKey }) => property === "supportedScales"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    value: Object.assign((sensorTypeName) => {
        const property = sensorTypeName;
        return {
            id: {
                commandClass: CommandClasses["Multilevel Sensor"],
                property,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multilevel Sensor"],
                endpoint,
                property: property,
            }),
            get meta() {
                return {
                    // Just the base metadata, to be extended using a config manager
                    ...ValueMetadata.ReadOnlyNumber,
                    label: sensorTypeName,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multilevel Sensor"]
                && (({ property, propertyKey }) => typeof property === "string"
                    && property !== "supportedSensorTypes"
                    && property !== "supportedScales"
                    && propertyKey == undefined)(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const MultilevelSwitchCCValues = Object.freeze({
    currentValue: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "currentValue",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint,
            property: "currentValue",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "currentValue"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyLevel,
                label: "Current value",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    targetValue: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "targetValue",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint,
            property: "targetValue",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "targetValue"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Level,
                label: "Target value",
                valueChangeOptions: ["transitionDuration"],
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    duration: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "duration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint,
            property: "duration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "duration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyDuration,
                label: "Remaining duration",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    restorePrevious: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "restorePrevious",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint,
            property: "restorePrevious",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "restorePrevious"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.WriteOnlyBoolean,
                label: "Restore previous value",
                states: {
                    true: "Restore",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    compatEvent: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "event",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint,
            property: "event",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "event"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Event value",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: false,
            supportsEndpoints: true,
            autoCreate: (applHost, endpoint) => !!applHost.getDeviceConfig?.(endpoint.nodeId)?.compat
                ?.treatMultilevelSwitchSetAsEvent,
        },
    },
    switchType: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "switchType",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint,
            property: "switchType",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "switchType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    superviseStartStopLevelChange: {
        id: {
            commandClass: CommandClasses["Multilevel Switch"],
            property: "superviseStartStopLevelChange",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Multilevel Switch"],
            endpoint: 0, // no endpoint support!
            property: "superviseStartStopLevelChange",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Multilevel Switch"]
                && valueId.property === "superviseStartStopLevelChange"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    levelChangeUp: Object.assign((switchType) => {
        const property = (() => {
            {
                const switchTypeName = getEnumMemberName(SwitchType, switchType);
                const [, up] = multilevelSwitchTypeToActions(switchTypeName);
                return up;
            }
        })();
        return {
            id: {
                commandClass: CommandClasses["Multilevel Switch"],
                property,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multilevel Switch"],
                endpoint,
                property: property,
            }),
            get meta() {
                const switchTypeName = getEnumMemberName(SwitchType, switchType);
                const [, up] = multilevelSwitchTypeToActions(switchTypeName);
                return {
                    ...ValueMetadata.WriteOnlyBoolean,
                    label: `Perform a level change (${up})`,
                    valueChangeOptions: ["transitionDuration"],
                    states: {
                        true: "Start",
                        false: "Stop",
                    },
                    ccSpecific: { switchType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multilevel Switch"]
                && (({ property }) => typeof property === "string"
                    && multilevelSwitchTypeProperties.indexOf(property) % 2
                        === 1)(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    levelChangeDown: Object.assign((switchType) => {
        const property = (() => {
            {
                const switchTypeName = getEnumMemberName(SwitchType, switchType);
                const [down] = multilevelSwitchTypeToActions(switchTypeName);
                return down;
            }
        })();
        return {
            id: {
                commandClass: CommandClasses["Multilevel Switch"],
                property,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Multilevel Switch"],
                endpoint,
                property: property,
            }),
            get meta() {
                const switchTypeName = getEnumMemberName(SwitchType, switchType);
                const [down] = multilevelSwitchTypeToActions(switchTypeName);
                return {
                    ...ValueMetadata.WriteOnlyBoolean,
                    label: `Perform a level change (${down})`,
                    valueChangeOptions: ["transitionDuration"],
                    states: {
                        true: "Start",
                        false: "Stop",
                    },
                    ccSpecific: { switchType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Multilevel Switch"]
                && (({ property }) => typeof property === "string"
                    && multilevelSwitchTypeProperties.indexOf(property) % 2
                        === 0)(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const NodeNamingAndLocationCCValues = Object.freeze({
    name: {
        id: {
            commandClass: CommandClasses["Node Naming and Location"],
            property: "name",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Node Naming and Location"],
            endpoint: 0, // no endpoint support!
            property: "name",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Node Naming and Location"]
                && valueId.property === "name"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.String,
                label: "Node name",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    location: {
        id: {
            commandClass: CommandClasses["Node Naming and Location"],
            property: "location",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Node Naming and Location"],
            endpoint: 0, // no endpoint support!
            property: "location",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Node Naming and Location"]
                && valueId.property === "location"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.String,
                label: "Node location",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
});
export const NotificationCCValues = Object.freeze({
    supportsV1Alarm: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "supportsV1Alarm",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Notification,
            endpoint: 0, // no endpoint support!
            property: "supportsV1Alarm",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "supportsV1Alarm"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    supportedNotificationTypes: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "supportedNotificationTypes",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Notification,
            endpoint: 0, // no endpoint support!
            property: "supportedNotificationTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "supportedNotificationTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    notificationMode: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "notificationMode",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Notification,
            endpoint: 0, // no endpoint support!
            property: "notificationMode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "notificationMode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    lastRefresh: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "lastRefresh",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Notification,
            endpoint,
            property: "lastRefresh",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "lastRefresh"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    alarmType: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "alarmType",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Notification,
            endpoint,
            property: "alarmType",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "alarmType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Alarm Type",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    alarmLevel: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "alarmLevel",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Notification,
            endpoint,
            property: "alarmLevel",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "alarmLevel"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Alarm Level",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    doorStateSimple: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "Access Control",
            propertyKey: "Door state (simple)",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Notification,
            endpoint,
            property: "Access Control",
            propertyKey: "Door state (simple)",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "Access Control"
                && valueId.propertyKey == "Door state (simple)";
        },
        get meta() {
            return {
                // Must be a number for compatibility reasons
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Door state (simple)",
                states: {
                    [0x16]: "Window/door is open",
                    [0x17]: "Window/door is closed",
                },
                ccSpecific: {
                    notificationType: 0x06,
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: shouldAutoCreateSimpleDoorSensorValue,
        },
    },
    doorTiltState: {
        id: {
            commandClass: CommandClasses.Notification,
            property: "Access Control",
            propertyKey: "Door tilt state",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Notification,
            endpoint,
            property: "Access Control",
            propertyKey: "Door tilt state",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && valueId.property === "Access Control"
                && valueId.propertyKey == "Door tilt state";
        },
        get meta() {
            return {
                // Must be a number for compatibility reasons
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Door tilt state",
                states: {
                    [0x00]: "Window/door is not tilted",
                    [0x01]: "Window/door is tilted",
                },
                ccSpecific: {
                    notificationType: 0x06,
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: false,
        },
    },
    supportedNotificationEvents: Object.assign((notificationType) => {
        const property = "supportedNotificationEvents";
        const propertyKey = notificationType;
        return {
            id: {
                commandClass: CommandClasses.Notification,
                property,
                propertyKey,
            },
            endpoint: (_endpoint) => ({
                commandClass: CommandClasses.Notification,
                endpoint: 0, // no endpoint support!
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && (({ property, propertyKey }) => property === "supportedNotificationEvents"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    }),
    unknownNotificationType: Object.assign((notificationType) => {
        const property = `UNKNOWN_${num2hex(notificationType)}`;
        return {
            id: {
                commandClass: CommandClasses.Notification,
                property,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Notification,
                endpoint,
                property: property,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyUInt8,
                    label: `Unknown notification (${num2hex(notificationType)})`,
                    ccSpecific: { notificationType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && (({ property }) => typeof property === "string"
                    && property.startsWith("UNKNOWN_0x"))(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    unknownNotificationVariable: Object.assign((notificationType, notificationName) => {
        const property = notificationName;
        const propertyKey = "unknown";
        return {
            id: {
                commandClass: CommandClasses.Notification,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Notification,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyUInt8,
                    label: `${notificationName}: Unknown value`,
                    ccSpecific: { notificationType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && (({ property, propertyKey }) => typeof property === "string"
                    && propertyKey === "unknown")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    notificationVariable: Object.assign((notificationName, variableName) => {
        const property = notificationName;
        const propertyKey = variableName;
        return {
            id: {
                commandClass: CommandClasses.Notification,
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses.Notification,
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Notification
                && (({ property, propertyKey }) => typeof property === "string"
                    && typeof propertyKey === "string")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
function shouldAutoCreateSimpleDoorSensorValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    const supportedACEvents = valueDB.getValue(NotificationCCValues.supportedNotificationEvents(
    // Access Control
    0x06).endpoint(endpoint.index));
    if (!supportedACEvents)
        return false;
    return (supportedACEvents.includes(
    // Window/door is open
    0x16)
        && supportedACEvents.includes(
        // Window/door is closed
        0x17));
}
export const ProtectionCCValues = Object.freeze({
    exclusiveControlNodeId: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "exclusiveControlNodeId",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "exclusiveControlNodeId",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "exclusiveControlNodeId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                min: 1,
                max: MAX_NODES,
                label: "Node ID with exclusive control",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    localProtectionState: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "local",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "local",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "local"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "Local protection state",
                states: enumValuesToMetadataStates(LocalProtectionState),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    rfProtectionState: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "rf",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "rf",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "rf"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                label: "RF protection state",
                states: enumValuesToMetadataStates(RFProtectionState),
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    timeout: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "timeout",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "timeout",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "timeout"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "RF protection timeout",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsExclusiveControl: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "supportsExclusiveControl",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "supportsExclusiveControl",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "supportsExclusiveControl"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsTimeout: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "supportsTimeout",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "supportsTimeout",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "supportsTimeout"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedLocalStates: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "supportedLocalStates",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "supportedLocalStates",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "supportedLocalStates"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedRFStates: {
        id: {
            commandClass: CommandClasses.Protection,
            property: "supportedRFStates",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Protection,
            endpoint,
            property: "supportedRFStates",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Protection
                && valueId.property === "supportedRFStates"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const SceneActivationCCValues = Object.freeze({
    sceneId: {
        id: {
            commandClass: CommandClasses["Scene Activation"],
            property: "sceneId",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Scene Activation"],
            endpoint,
            property: "sceneId",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Scene Activation"]
                && valueId.property === "sceneId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                min: 1,
                label: "Scene ID",
                valueChangeOptions: ["transitionDuration"],
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: false,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    dimmingDuration: {
        id: {
            commandClass: CommandClasses["Scene Activation"],
            property: "dimmingDuration",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Scene Activation"],
            endpoint,
            property: "dimmingDuration",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Scene Activation"]
                && valueId.property === "dimmingDuration"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Duration,
                label: "Dimming duration",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const SceneActuatorConfigurationCCValues = Object.freeze({
    level: Object.assign((sceneId) => {
        const property = "level";
        const propertyKey = sceneId;
        return {
            id: {
                commandClass: CommandClasses["Scene Actuator Configuration"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Scene Actuator Configuration"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.UInt8,
                    label: `Level (${sceneId})`,
                    valueChangeOptions: ["transitionDuration"],
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Scene Actuator Configuration"]
                && (({ property, propertyKey }) => property === "level"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    dimmingDuration: Object.assign((sceneId) => {
        const property = "dimmingDuration";
        const propertyKey = sceneId;
        return {
            id: {
                commandClass: CommandClasses["Scene Actuator Configuration"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Scene Actuator Configuration"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Duration,
                    label: `Dimming duration (${sceneId})`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Scene Actuator Configuration"]
                && (({ property, propertyKey }) => property === "dimmingDuration"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const SceneControllerConfigurationCCValues = Object.freeze({
    sceneId: Object.assign((groupId) => {
        const property = "sceneId";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Scene Controller Configuration"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Scene Controller Configuration"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.UInt8,
                    label: `Associated Scene ID (${groupId})`,
                    valueChangeOptions: ["transitionDuration"],
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Scene Controller Configuration"]
                && (({ property, propertyKey }) => property === "sceneId"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    dimmingDuration: Object.assign((groupId) => {
        const property = "dimmingDuration";
        const propertyKey = groupId;
        return {
            id: {
                commandClass: CommandClasses["Scene Controller Configuration"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Scene Controller Configuration"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Duration,
                    label: `Dimming duration (${groupId})`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Scene Controller Configuration"]
                && (({ property, propertyKey }) => property === "dimmingDuration"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const ScheduleEntryLockCCValues = Object.freeze({
    numWeekDaySlots: {
        id: {
            commandClass: CommandClasses["Schedule Entry Lock"],
            property: "numWeekDaySlots",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Schedule Entry Lock"],
            endpoint,
            property: "numWeekDaySlots",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Schedule Entry Lock"]
                && valueId.property === "numWeekDaySlots"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    numYearDaySlots: {
        id: {
            commandClass: CommandClasses["Schedule Entry Lock"],
            property: "numYearDaySlots",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Schedule Entry Lock"],
            endpoint,
            property: "numYearDaySlots",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Schedule Entry Lock"]
                && valueId.property === "numYearDaySlots"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    numDailyRepeatingSlots: {
        id: {
            commandClass: CommandClasses["Schedule Entry Lock"],
            property: "numDailyRepeatingSlots",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Schedule Entry Lock"],
            endpoint,
            property: "numDailyRepeatingSlots",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Schedule Entry Lock"]
                && valueId.property === "numDailyRepeatingSlots"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    userEnabled: Object.assign((userId) => {
        const property = "userEnabled";
        const propertyKey = userId;
        return {
            id: {
                commandClass: CommandClasses["Schedule Entry Lock"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Schedule Entry Lock"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Schedule Entry Lock"]
                && (({ property, propertyKey }) => property === "userEnabled"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    scheduleKind: Object.assign((userId) => {
        const property = "scheduleKind";
        const propertyKey = userId;
        return {
            id: {
                commandClass: CommandClasses["Schedule Entry Lock"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Schedule Entry Lock"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Schedule Entry Lock"]
                && (({ property, propertyKey }) => property === "scheduleKind"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    schedule: Object.assign((scheduleKind, userId, slotId) => {
        const property = "schedule";
        const propertyKey = (scheduleKind << 16) | (userId << 8) | slotId;
        return {
            id: {
                commandClass: CommandClasses["Schedule Entry Lock"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Schedule Entry Lock"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Schedule Entry Lock"]
                && (({ property, propertyKey }) => property === "schedule"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const SoundSwitchCCValues = Object.freeze({
    volume: {
        id: {
            commandClass: CommandClasses["Sound Switch"],
            property: "volume",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Sound Switch"],
            endpoint,
            property: "volume",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Sound Switch"]
                && valueId.property === "volume"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                min: 0,
                max: 100,
                unit: "%",
                label: "Volume",
                allowManualEntry: true,
                states: {
                    0: "default",
                },
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    toneId: {
        id: {
            commandClass: CommandClasses["Sound Switch"],
            property: "toneId",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Sound Switch"],
            endpoint,
            property: "toneId",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Sound Switch"]
                && valueId.property === "toneId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                label: "Play Tone",
                valueChangeOptions: ["volume"],
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    defaultVolume: {
        id: {
            commandClass: CommandClasses["Sound Switch"],
            property: "defaultVolume",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Sound Switch"],
            endpoint,
            property: "defaultVolume",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Sound Switch"]
                && valueId.property === "defaultVolume"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                min: 0,
                max: 100,
                unit: "%",
                label: "Default volume",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    defaultToneId: {
        id: {
            commandClass: CommandClasses["Sound Switch"],
            property: "defaultToneId",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Sound Switch"],
            endpoint,
            property: "defaultToneId",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Sound Switch"]
                && valueId.property === "defaultToneId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Number,
                min: 1,
                max: 254,
                label: "Default tone ID",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const SupervisionCCValues = Object.freeze({
    ccSupported: Object.assign((ccId) => {
        const property = "ccSupported";
        const propertyKey = ccId;
        return {
            id: {
                commandClass: CommandClasses.Supervision,
                property,
                propertyKey,
            },
            endpoint: (_endpoint) => ({
                commandClass: CommandClasses.Supervision,
                endpoint: 0, // no endpoint support!
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Supervision
                && (({ property, propertyKey }) => property === "commandSupported"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    }),
});
export const ThermostatFanModeCCValues = Object.freeze({
    turnedOff: {
        id: {
            commandClass: CommandClasses["Thermostat Fan Mode"],
            property: "off",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Fan Mode"],
            endpoint,
            property: "off",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Fan Mode"]
                && valueId.property === "off"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Boolean,
                label: "Thermostat fan turned off",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    fanMode: {
        id: {
            commandClass: CommandClasses["Thermostat Fan Mode"],
            property: "mode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Fan Mode"],
            endpoint,
            property: "mode",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Fan Mode"]
                && valueId.property === "mode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                states: enumValuesToMetadataStates(ThermostatFanMode),
                label: "Thermostat fan mode",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedFanModes: {
        id: {
            commandClass: CommandClasses["Thermostat Fan Mode"],
            property: "supportedModes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Fan Mode"],
            endpoint,
            property: "supportedModes",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Fan Mode"]
                && valueId.property === "supportedModes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const ThermostatFanStateCCValues = Object.freeze({
    fanState: {
        id: {
            commandClass: CommandClasses["Thermostat Fan State"],
            property: "state",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Fan State"],
            endpoint,
            property: "state",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Fan State"]
                && valueId.property === "state"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                states: enumValuesToMetadataStates(ThermostatFanState),
                label: "Thermostat fan state",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const ThermostatModeCCValues = Object.freeze({
    thermostatMode: {
        id: {
            commandClass: CommandClasses["Thermostat Mode"],
            property: "mode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Mode"],
            endpoint,
            property: "mode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Thermostat Mode"]
                && valueId.property === "mode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt8,
                states: enumValuesToMetadataStates(ThermostatMode),
                label: "Thermostat mode",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    manufacturerData: {
        id: {
            commandClass: CommandClasses["Thermostat Mode"],
            property: "manufacturerData",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Mode"],
            endpoint,
            property: "manufacturerData",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Thermostat Mode"]
                && valueId.property === "manufacturerData"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyBuffer,
                label: "Manufacturer data",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedModes: {
        id: {
            commandClass: CommandClasses["Thermostat Mode"],
            property: "supportedModes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Mode"],
            endpoint,
            property: "supportedModes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Thermostat Mode"]
                && valueId.property === "supportedModes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const ThermostatOperatingStateCCValues = Object.freeze({
    operatingState: {
        id: {
            commandClass: CommandClasses["Thermostat Operating State"],
            property: "state",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Operating State"],
            endpoint,
            property: "state",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Operating State"]
                && valueId.property === "state"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyUInt8,
                label: "Operating state",
                states: enumValuesToMetadataStates(ThermostatOperatingState),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const ThermostatSetpointCCValues = Object.freeze({
    supportedSetpointTypes: {
        id: {
            commandClass: CommandClasses["Thermostat Setpoint"],
            property: "supportedSetpointTypes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Thermostat Setpoint"],
            endpoint,
            property: "supportedSetpointTypes",
        }),
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Setpoint"]
                && valueId.property === "supportedSetpointTypes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    setpoint: Object.assign((setpointType) => {
        const property = "setpoint";
        const propertyKey = setpointType;
        return {
            id: {
                commandClass: CommandClasses["Thermostat Setpoint"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Thermostat Setpoint"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `Setpoint (${getEnumMemberName(ThermostatSetpointType, setpointType)})`,
                    ccSpecific: { setpointType },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Setpoint"]
                && (({ property, propertyKey }) => property === "setpoint"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    setpointScale: Object.assign((setpointType) => {
        const property = "setpointScale";
        const propertyKey = setpointType;
        return {
            id: {
                commandClass: CommandClasses["Thermostat Setpoint"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Thermostat Setpoint"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Thermostat Setpoint"]
                && (({ property, propertyKey }) => property === "setpointScale"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const TimeParametersCCValues = Object.freeze({
    dateAndTime: {
        id: {
            commandClass: CommandClasses["Time Parameters"],
            property: "dateAndTime",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Time Parameters"],
            endpoint,
            property: "dateAndTime",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Time Parameters"]
                && valueId.property === "dateAndTime"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.Any,
                label: "Date and Time",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const UserCodeCCValues = Object.freeze({
    supportedUsers: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportedUsers",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportedUsers",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportedUsers"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsAdminCode: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsAdminCode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsAdminCode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsAdminCode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsAdminCodeDeactivation: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsAdminCodeDeactivation",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsAdminCodeDeactivation",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsAdminCodeDeactivation"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    _deprecated_supportsMasterCode: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsMasterCode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsMasterCode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsMasterCode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    _deprecated_supportsMasterCodeDeactivation: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsMasterCodeDeactivation",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsMasterCodeDeactivation",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsMasterCodeDeactivation"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsUserCodeChecksum: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsUserCodeChecksum",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsUserCodeChecksum",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsUserCodeChecksum"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsMultipleUserCodeReport: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsMultipleUserCodeReport",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsMultipleUserCodeReport",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsMultipleUserCodeReport"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportsMultipleUserCodeSet: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportsMultipleUserCodeSet",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportsMultipleUserCodeSet",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportsMultipleUserCodeSet"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedUserIDStatuses: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportedUserIDStatuses",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportedUserIDStatuses",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportedUserIDStatuses"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedKeypadModes: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportedKeypadModes",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportedKeypadModes",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportedKeypadModes"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    supportedASCIIChars: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "supportedASCIIChars",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "supportedASCIIChars",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "supportedASCIIChars"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    userCodeChecksum: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "userCodeChecksum",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "userCodeChecksum",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "userCodeChecksum"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    keypadMode: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "keypadMode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "keypadMode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "keypadMode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyNumber,
                label: "Keypad Mode",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    adminCode: {
        id: {
            commandClass: CommandClasses["User Code"],
            property: "adminCode",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["User Code"],
            endpoint,
            property: "adminCode",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && valueId.property === "adminCode"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.String,
                label: "Admin Code",
                minLength: 4,
                maxLength: 10,
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: true,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    userIdStatus: Object.assign((userId) => {
        const property = "userIdStatus";
        const propertyKey = userId;
        return {
            id: {
                commandClass: CommandClasses["User Code"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["User Code"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.Number,
                    label: `User ID status (${userId})`,
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && (({ property, propertyKey }) => property === "userIdStatus"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    userCode: Object.assign((userId) => {
        const property = "userCode";
        const propertyKey = userId;
        return {
            id: {
                commandClass: CommandClasses["User Code"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["User Code"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return ValueMetadata.Any;
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["User Code"]
                && (({ property, propertyKey }) => property === "userCode"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: true,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const VersionCCValues = Object.freeze({
    firmwareVersions: {
        id: {
            commandClass: CommandClasses.Version,
            property: "firmwareVersions",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "firmwareVersions",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "firmwareVersions"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                type: "string[]",
                label: "Z-Wave chip firmware versions",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    libraryType: {
        id: {
            commandClass: CommandClasses.Version,
            property: "libraryType",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "libraryType",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "libraryType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyNumber,
                label: "Library type",
                states: enumValuesToMetadataStates(ZWaveLibraryTypes),
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    protocolVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "protocolVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "protocolVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "protocolVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Z-Wave protocol version",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    hardwareVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "hardwareVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "hardwareVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "hardwareVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyNumber,
                label: "Z-Wave chip hardware version",
            };
        },
        options: {
            internal: false,
            minVersion: 2,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    supportsZWaveSoftwareGet: {
        id: {
            commandClass: CommandClasses.Version,
            property: "supportsZWaveSoftwareGet",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses.Version,
            endpoint,
            property: "supportsZWaveSoftwareGet",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "supportsZWaveSoftwareGet"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    sdkVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "sdkVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "sdkVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "sdkVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "SDK version",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    applicationFrameworkAPIVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "applicationFrameworkAPIVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "applicationFrameworkAPIVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "applicationFrameworkAPIVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Z-Wave application framework API version",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    applicationFrameworkBuildNumber: {
        id: {
            commandClass: CommandClasses.Version,
            property: "applicationFrameworkBuildNumber",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "applicationFrameworkBuildNumber",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "applicationFrameworkBuildNumber"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Z-Wave application framework API build number",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    serialAPIVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "hostInterfaceVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "hostInterfaceVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "hostInterfaceVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Serial API version",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    serialAPIBuildNumber: {
        id: {
            commandClass: CommandClasses.Version,
            property: "hostInterfaceBuildNumber",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "hostInterfaceBuildNumber",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "hostInterfaceBuildNumber"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Serial API build number",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    zWaveProtocolVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "zWaveProtocolVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "zWaveProtocolVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "zWaveProtocolVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Z-Wave protocol version",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    zWaveProtocolBuildNumber: {
        id: {
            commandClass: CommandClasses.Version,
            property: "zWaveProtocolBuildNumber",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "zWaveProtocolBuildNumber",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "zWaveProtocolBuildNumber"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Z-Wave protocol build number",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    applicationVersion: {
        id: {
            commandClass: CommandClasses.Version,
            property: "applicationVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "applicationVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "applicationVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Application version",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    applicationBuildNumber: {
        id: {
            commandClass: CommandClasses.Version,
            property: "applicationBuildNumber",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses.Version,
            endpoint: 0, // no endpoint support!
            property: "applicationBuildNumber",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses.Version
                && valueId.property === "applicationBuildNumber"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnlyString,
                label: "Application build number",
            };
        },
        options: {
            internal: false,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
});
export const WakeUpCCValues = Object.freeze({
    controllerNodeId: {
        id: {
            commandClass: CommandClasses["Wake Up"],
            property: "controllerNodeId",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Wake Up"],
            endpoint: 0, // no endpoint support!
            property: "controllerNodeId",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Wake Up"]
                && valueId.property === "controllerNodeId"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.ReadOnly,
                label: "Node ID of the controller",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    wakeUpInterval: {
        id: {
            commandClass: CommandClasses["Wake Up"],
            property: "wakeUpInterval",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Wake Up"],
            endpoint: 0, // no endpoint support!
            property: "wakeUpInterval",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Wake Up"]
                && valueId.property === "wakeUpInterval"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return {
                ...ValueMetadata.UInt24,
                label: "Wake Up interval",
            };
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    wakeUpOnDemandSupported: {
        id: {
            commandClass: CommandClasses["Wake Up"],
            property: "wakeUpOnDemandSupported",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Wake Up"],
            endpoint: 0, // no endpoint support!
            property: "wakeUpOnDemandSupported",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Wake Up"]
                && valueId.property === "wakeUpOnDemandSupported"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 3,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
});
export const WindowCoveringCCValues = Object.freeze({
    supportedParameters: {
        id: {
            commandClass: CommandClasses["Window Covering"],
            property: "supportedParameters",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Window Covering"],
            endpoint,
            property: "supportedParameters",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Window Covering"]
                && valueId.property === "supportedParameters"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    currentValue: Object.assign((parameter) => {
        const property = "currentValue";
        const propertyKey = parameter;
        return {
            id: {
                commandClass: CommandClasses["Window Covering"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Window Covering"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyLevel,
                    label: `Current value - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
                    states: windowCoveringParameterToMetadataStates(parameter),
                    ccSpecific: { parameter },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Window Covering"]
                && (({ property, propertyKey }) => property === "currentValue"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    targetValue: Object.assign((parameter) => {
        const property = "targetValue";
        const propertyKey = parameter;
        return {
            id: {
                commandClass: CommandClasses["Window Covering"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Window Covering"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                // Only odd-numbered parameters have position support and are writable
                const writeable = parameter % 2 === 1;
                return {
                    ...ValueMetadata.Level,
                    label: `Target value - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
                    // Only odd-numbered parameters have position support and are writable
                    writeable: parameter % 2 === 1,
                    states: windowCoveringParameterToMetadataStates(parameter),
                    allowManualEntry: writeable,
                    ccSpecific: { parameter },
                    valueChangeOptions: ["transitionDuration"],
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Window Covering"]
                && (({ property, propertyKey }) => property === "targetValue"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    duration: Object.assign((parameter) => {
        const property = "duration";
        const propertyKey = parameter;
        return {
            id: {
                commandClass: CommandClasses["Window Covering"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Window Covering"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.ReadOnlyDuration,
                    label: `Remaining duration - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
                    ccSpecific: {
                        parameter,
                    },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Window Covering"]
                && (({ property, propertyKey }) => property === "duration"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    levelChangeUp: Object.assign((parameter) => {
        const property = "levelChangeUp";
        const propertyKey = parameter;
        return {
            id: {
                commandClass: CommandClasses["Window Covering"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Window Covering"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.WriteOnlyBoolean,
                    label: `${windowCoveringParameterToLevelChangeLabel(parameter, "up")} - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
                    valueChangeOptions: ["transitionDuration"],
                    states: {
                        true: "Start",
                        false: "Stop",
                    },
                    ccSpecific: { parameter },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Window Covering"]
                && (({ property, propertyKey }) => property === "levelChangeUp"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
    levelChangeDown: Object.assign((parameter) => {
        const property = "levelChangeDown";
        const propertyKey = parameter;
        return {
            id: {
                commandClass: CommandClasses["Window Covering"],
                property,
                propertyKey,
            },
            endpoint: (endpoint = 0) => ({
                commandClass: CommandClasses["Window Covering"],
                endpoint,
                property: property,
                propertyKey: propertyKey,
            }),
            get meta() {
                return {
                    ...ValueMetadata.WriteOnlyBoolean,
                    label: `${windowCoveringParameterToLevelChangeLabel(parameter, "down")} - ${getEnumMemberName(WindowCoveringParameter, parameter)}`,
                    valueChangeOptions: ["transitionDuration"],
                    states: {
                        true: "Start",
                        false: "Stop",
                    },
                    ccSpecific: { parameter },
                };
            },
        };
    }, {
        is: (valueId) => {
            return valueId.commandClass
                === CommandClasses["Window Covering"]
                && (({ property, propertyKey }) => property === "levelChangeDown"
                    && typeof propertyKey === "number")(valueId);
        },
        options: {
            internal: false,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    }),
});
export const ZWavePlusCCValues = Object.freeze({
    zwavePlusVersion: {
        id: {
            commandClass: CommandClasses["Z-Wave Plus Info"],
            property: "zwavePlusVersion",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Z-Wave Plus Info"],
            endpoint: 0, // no endpoint support!
            property: "zwavePlusVersion",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Z-Wave Plus Info"]
                && valueId.property === "zwavePlusVersion"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    nodeType: {
        id: {
            commandClass: CommandClasses["Z-Wave Plus Info"],
            property: "nodeType",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Z-Wave Plus Info"],
            endpoint: 0, // no endpoint support!
            property: "nodeType",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Z-Wave Plus Info"]
                && valueId.property === "nodeType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    roleType: {
        id: {
            commandClass: CommandClasses["Z-Wave Plus Info"],
            property: "roleType",
        },
        endpoint: (_endpoint) => ({
            commandClass: CommandClasses["Z-Wave Plus Info"],
            endpoint: 0, // no endpoint support!
            property: "roleType",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Z-Wave Plus Info"]
                && valueId.property === "roleType"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: false,
            autoCreate: true,
        },
    },
    userIcon: {
        id: {
            commandClass: CommandClasses["Z-Wave Plus Info"],
            property: "userIcon",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Z-Wave Plus Info"],
            endpoint,
            property: "userIcon",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Z-Wave Plus Info"]
                && valueId.property === "userIcon"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
    installerIcon: {
        id: {
            commandClass: CommandClasses["Z-Wave Plus Info"],
            property: "installerIcon",
        },
        endpoint: (endpoint = 0) => ({
            commandClass: CommandClasses["Z-Wave Plus Info"],
            endpoint,
            property: "installerIcon",
        }),
        is: (valueId) => {
            return valueId.commandClass === CommandClasses["Z-Wave Plus Info"]
                && valueId.property === "installerIcon"
                && valueId.propertyKey == undefined;
        },
        get meta() {
            return ValueMetadata.Any;
        },
        options: {
            internal: true,
            minVersion: 1,
            secret: false,
            stateful: true,
            supportsEndpoints: true,
            autoCreate: true,
        },
    },
});
export const CCValues = {
    [CommandClasses["Alarm Sensor"]]: AlarmSensorCCValues,
    [CommandClasses.Association]: AssociationCCValues,
    [CommandClasses["Association Group Information"]]: AssociationGroupInfoCCValues,
    [CommandClasses["Barrier Operator"]]: BarrierOperatorCCValues,
    [CommandClasses.Basic]: BasicCCValues,
    [CommandClasses["Basic Window Covering"]]: BasicWindowCoveringCCValues,
    [CommandClasses.Battery]: BatteryCCValues,
    [CommandClasses["Binary Sensor"]]: BinarySensorCCValues,
    [CommandClasses["Binary Switch"]]: BinarySwitchCCValues,
    [CommandClasses["Central Scene"]]: CentralSceneCCValues,
    [CommandClasses["Climate Control Schedule"]]: ClimateControlScheduleCCValues,
    [CommandClasses["Color Switch"]]: ColorSwitchCCValues,
    [CommandClasses.Configuration]: ConfigurationCCValues,
    [CommandClasses["Door Lock"]]: DoorLockCCValues,
    [CommandClasses["Door Lock Logging"]]: DoorLockLoggingCCValues,
    [CommandClasses["Energy Production"]]: EnergyProductionCCValues,
    [CommandClasses["Entry Control"]]: EntryControlCCValues,
    [CommandClasses["Firmware Update Meta Data"]]: FirmwareUpdateMetaDataCCValues,
    [CommandClasses["Humidity Control Mode"]]: HumidityControlModeCCValues,
    [CommandClasses["Humidity Control Operating State"]]: HumidityControlOperatingStateCCValues,
    [CommandClasses["Humidity Control Setpoint"]]: HumidityControlSetpointCCValues,
    [CommandClasses.Indicator]: IndicatorCCValues,
    [CommandClasses.Irrigation]: IrrigationCCValues,
    [CommandClasses.Language]: LanguageCCValues,
    [CommandClasses.Lock]: LockCCValues,
    [CommandClasses["Manufacturer Specific"]]: ManufacturerSpecificCCValues,
    [CommandClasses.Meter]: MeterCCValues,
    [CommandClasses["Multi Channel Association"]]: MultiChannelAssociationCCValues,
    [CommandClasses["Multi Channel"]]: MultiChannelCCValues,
    [CommandClasses["Multilevel Sensor"]]: MultilevelSensorCCValues,
    [CommandClasses["Multilevel Switch"]]: MultilevelSwitchCCValues,
    [CommandClasses["Node Naming and Location"]]: NodeNamingAndLocationCCValues,
    [CommandClasses.Notification]: NotificationCCValues,
    [CommandClasses.Protection]: ProtectionCCValues,
    [CommandClasses["Scene Activation"]]: SceneActivationCCValues,
    [CommandClasses["Scene Actuator Configuration"]]: SceneActuatorConfigurationCCValues,
    [CommandClasses["Scene Controller Configuration"]]: SceneControllerConfigurationCCValues,
    [CommandClasses["Schedule Entry Lock"]]: ScheduleEntryLockCCValues,
    [CommandClasses["Sound Switch"]]: SoundSwitchCCValues,
    [CommandClasses.Supervision]: SupervisionCCValues,
    [CommandClasses["Thermostat Fan Mode"]]: ThermostatFanModeCCValues,
    [CommandClasses["Thermostat Fan State"]]: ThermostatFanStateCCValues,
    [CommandClasses["Thermostat Mode"]]: ThermostatModeCCValues,
    [CommandClasses["Thermostat Operating State"]]: ThermostatOperatingStateCCValues,
    [CommandClasses["Thermostat Setpoint"]]: ThermostatSetpointCCValues,
    [CommandClasses["Time Parameters"]]: TimeParametersCCValues,
    [CommandClasses["User Code"]]: UserCodeCCValues,
    [CommandClasses.Version]: VersionCCValues,
    [CommandClasses["Wake Up"]]: WakeUpCCValues,
    [CommandClasses["Window Covering"]]: WindowCoveringCCValues,
    [CommandClasses["Z-Wave Plus Info"]]: ZWavePlusCCValues,
};
//# sourceMappingURL=_CCValues.generated.js.map