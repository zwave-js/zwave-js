import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type ValueID, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { IrrigationCommand, IrrigationSensorPolarity, type ValveId, type ValveTableEntry } from "../lib/_Types.js";
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
export declare class IrrigationCCAPI extends CCAPI {
    supportsCommand(cmd: IrrigationCommand): MaybeNotKnown<boolean>;
    getSystemInfo(): Promise<Pick<IrrigationCCSystemInfoReport, "numValves" | "numValveTables" | "supportsMasterValve" | "maxValveTableSize"> | undefined>;
    getSystemStatus(): Promise<Pick<IrrigationCCSystemStatusReport, "pressure" | "systemVoltage" | "flowSensorActive" | "pressureSensorActive" | "rainSensorActive" | "moistureSensorActive" | "flow" | "shutoffDuration" | "errorNotProgrammed" | "errorEmergencyShutdown" | "errorHighPressure" | "errorLowPressure" | "errorValve" | "masterValveOpen" | "firstOpenZoneId"> | undefined>;
    getSystemConfig(): Promise<Pick<IrrigationCCSystemConfigReport, "masterValveDelay" | "rainSensorPolarity" | "moistureSensorPolarity" | "highPressureThreshold" | "lowPressureThreshold"> | undefined>;
    setSystemConfig(config: IrrigationCCSystemConfigSetOptions): Promise<SupervisionResult | undefined>;
    getValveInfo(valveId: ValveId): Promise<Pick<IrrigationCCValveInfoReport, "nominalCurrent" | "errorShortCircuit" | "errorHighCurrent" | "errorLowCurrent" | "errorMaximumFlow" | "errorHighFlow" | "errorLowFlow" | "connected"> | undefined>;
    setValveConfig(options: IrrigationCCValveConfigSetOptions): Promise<SupervisionResult | undefined>;
    getValveConfig(valveId: ValveId): Promise<Pick<IrrigationCCValveConfigReport, "nominalCurrentHighThreshold" | "nominalCurrentLowThreshold" | "maximumFlow" | "highFlowThreshold" | "lowFlowThreshold" | "useRainSensor" | "useMoistureSensor"> | undefined>;
    runValve(valveId: ValveId, duration: number): Promise<SupervisionResult | undefined>;
    shutoffValve(valveId: ValveId): Promise<SupervisionResult | undefined>;
    setValveTable(tableId: number, entries: ValveTableEntry[]): Promise<SupervisionResult | undefined>;
    getValveTable(tableId: number): Promise<MaybeNotKnown<ValveTableEntry[]>>;
    runTables(tableIDs: number[]): Promise<SupervisionResult | undefined>;
    /**
     * Shuts off the entire system for the given duration.
     * @param duration Shutoff duration in hours. A value of 255 will shut off the entire system permanently and prevents schedules from running.
     */
    shutoffSystem(duration: number): Promise<SupervisionResult | undefined>;
    /** Shuts off the entire system permanently and prevents schedules from running */
    shutoffSystemPermanently(): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class IrrigationCC extends CommandClass {
    ccCommand: IrrigationCommand;
    /**
     * Returns the maximum number of valve table entries reported by the node.
     * This only works AFTER the node has been interviewed.
     */
    static getMaxValveTableSizeCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<number>;
    /**
     * Returns the number of zone valves reported by the node.
     * This only works AFTER the node has been interviewed.
     */
    static getNumValvesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<number>;
    /**
     * Returns whether the node supports a master valve
     * This only works AFTER the node has been interviewed.
     */
    static supportsMasterValveCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    translateProperty(ctx: GetValueDB, property: string | number, propertyKey?: string | number): string;
}
export interface IrrigationCCSystemInfoReportOptions {
    supportsMasterValve: boolean;
    numValves: number;
    numValveTables: number;
    maxValveTableSize: number;
}
export declare class IrrigationCCSystemInfoReport extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCSystemInfoReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IrrigationCCSystemInfoReport;
    readonly numValves: number;
    readonly numValveTables: number;
    readonly supportsMasterValve: boolean;
    readonly maxValveTableSize: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class IrrigationCCSystemInfoGet extends IrrigationCC {
}
export interface IrrigationCCSystemStatusReportOptions {
    systemVoltage: number;
    flowSensorActive: boolean;
    pressureSensorActive: boolean;
    rainSensorActive: boolean;
    moistureSensorActive: boolean;
    flow?: number;
    pressure?: number;
    shutoffDuration: number;
    errorNotProgrammed: boolean;
    errorEmergencyShutdown: boolean;
    errorHighPressure: boolean;
    errorLowPressure: boolean;
    errorValve: boolean;
    masterValveOpen: boolean;
    firstOpenZoneId?: number;
}
export declare class IrrigationCCSystemStatusReport extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCSystemStatusReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IrrigationCCSystemStatusReport;
    systemVoltage: number;
    flowSensorActive: boolean;
    pressureSensorActive: boolean;
    rainSensorActive: boolean;
    moistureSensorActive: boolean;
    flow?: number;
    pressure?: number;
    shutoffDuration: number;
    errorNotProgrammed: boolean;
    errorEmergencyShutdown: boolean;
    errorHighPressure: boolean;
    errorLowPressure: boolean;
    errorValve: boolean;
    masterValveOpen: boolean;
    firstOpenZoneId?: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class IrrigationCCSystemStatusGet extends IrrigationCC {
}
export type IrrigationCCSystemConfigSetOptions = {
    masterValveDelay: number;
    highPressureThreshold: number;
    lowPressureThreshold: number;
    rainSensorPolarity?: IrrigationSensorPolarity;
    moistureSensorPolarity?: IrrigationSensorPolarity;
};
export declare class IrrigationCCSystemConfigSet extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCSystemConfigSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCSystemConfigSet;
    masterValveDelay: number;
    highPressureThreshold: number;
    lowPressureThreshold: number;
    rainSensorPolarity?: IrrigationSensorPolarity;
    moistureSensorPolarity?: IrrigationSensorPolarity;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCSystemConfigReportOptions {
    masterValveDelay: number;
    highPressureThreshold: number;
    lowPressureThreshold: number;
    rainSensorPolarity?: IrrigationSensorPolarity;
    moistureSensorPolarity?: IrrigationSensorPolarity;
}
export declare class IrrigationCCSystemConfigReport extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCSystemConfigReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IrrigationCCSystemConfigReport;
    readonly masterValveDelay: number;
    readonly highPressureThreshold: number;
    readonly lowPressureThreshold: number;
    readonly rainSensorPolarity?: IrrigationSensorPolarity;
    readonly moistureSensorPolarity?: IrrigationSensorPolarity;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class IrrigationCCSystemConfigGet extends IrrigationCC {
}
export interface IrrigationCCValveInfoReportOptions {
    valveId: ValveId;
    connected: boolean;
    nominalCurrent: number;
    errorShortCircuit: boolean;
    errorHighCurrent: boolean;
    errorLowCurrent: boolean;
    errorMaximumFlow?: boolean;
    errorHighFlow?: boolean;
    errorLowFlow?: boolean;
}
export declare class IrrigationCCValveInfoReport extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveInfoReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IrrigationCCValveInfoReport;
    readonly valveId: ValveId;
    readonly connected: boolean;
    readonly nominalCurrent: number;
    readonly errorShortCircuit: boolean;
    readonly errorHighCurrent: boolean;
    readonly errorLowCurrent: boolean;
    readonly errorMaximumFlow?: boolean;
    readonly errorHighFlow?: boolean;
    readonly errorLowFlow?: boolean;
    persistValues(ctx: PersistValuesContext): boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveInfoGetOptions {
    valveId: ValveId;
}
export declare class IrrigationCCValveInfoGet extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveInfoGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveInfoGet;
    valveId: ValveId;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type IrrigationCCValveConfigSetOptions = {
    valveId: ValveId;
    nominalCurrentHighThreshold: number;
    nominalCurrentLowThreshold: number;
    maximumFlow: number;
    highFlowThreshold: number;
    lowFlowThreshold: number;
    useRainSensor: boolean;
    useMoistureSensor: boolean;
};
export declare class IrrigationCCValveConfigSet extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveConfigSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveConfigSet;
    valveId: ValveId;
    nominalCurrentHighThreshold: number;
    nominalCurrentLowThreshold: number;
    maximumFlow: number;
    highFlowThreshold: number;
    lowFlowThreshold: number;
    useRainSensor: boolean;
    useMoistureSensor: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveConfigReportOptions {
    valveId: ValveId;
    nominalCurrentHighThreshold: number;
    nominalCurrentLowThreshold: number;
    maximumFlow: number;
    highFlowThreshold: number;
    lowFlowThreshold: number;
    useRainSensor: boolean;
    useMoistureSensor: boolean;
}
export declare class IrrigationCCValveConfigReport extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveConfigReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IrrigationCCValveConfigReport;
    persistValues(ctx: PersistValuesContext): boolean;
    valveId: ValveId;
    nominalCurrentHighThreshold: number;
    nominalCurrentLowThreshold: number;
    maximumFlow: number;
    highFlowThreshold: number;
    lowFlowThreshold: number;
    useRainSensor: boolean;
    useMoistureSensor: boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveConfigGetOptions {
    valveId: ValveId;
}
export declare class IrrigationCCValveConfigGet extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveConfigGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveConfigGet;
    valveId: ValveId;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveRunOptions {
    valveId: ValveId;
    duration: number;
}
export declare class IrrigationCCValveRun extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveRunOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveRun;
    valveId: ValveId;
    duration: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveTableSetOptions {
    tableId: number;
    entries: ValveTableEntry[];
}
export declare class IrrigationCCValveTableSet extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveTableSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveTableSet;
    tableId: number;
    entries: ValveTableEntry[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveTableReportOptions {
    tableId: number;
    entries: ValveTableEntry[];
}
export declare class IrrigationCCValveTableReport extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveTableReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): IrrigationCCValveTableReport;
    readonly tableId: number;
    readonly entries: ValveTableEntry[];
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveTableGetOptions {
    tableId: number;
}
export declare class IrrigationCCValveTableGet extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveTableGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveTableGet;
    tableId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCValveTableRunOptions {
    tableIDs: number[];
}
export declare class IrrigationCCValveTableRun extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCValveTableRunOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCValveTableRun;
    tableIDs: number[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface IrrigationCCSystemShutoffOptions {
    /**
     * The duration in minutes the system must stay off.
     * 255 or `undefined` will prevent schedules from running.
     */
    duration?: number;
}
export declare class IrrigationCCSystemShutoff extends IrrigationCC {
    constructor(options: WithAddress<IrrigationCCSystemShutoffOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): IrrigationCCSystemShutoff;
    duration?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=IrrigationCC.d.ts.map