import { getEnumMemberName } from "@zwave-js/shared";
/**
 * @publicAPI
 * A dictionary of all command classes as of 2018-03-30
 */
export var CommandClasses;
(function (CommandClasses) {
    // "Alarm" = 0x71, // superseded by Notification
    CommandClasses[CommandClasses["Alarm Sensor"] = 156] = "Alarm Sensor";
    CommandClasses[CommandClasses["Alarm Silence"] = 157] = "Alarm Silence";
    CommandClasses[CommandClasses["All Switch"] = 39] = "All Switch";
    CommandClasses[CommandClasses["Anti-Theft"] = 93] = "Anti-Theft";
    CommandClasses[CommandClasses["Anti-Theft Unlock"] = 126] = "Anti-Theft Unlock";
    CommandClasses[CommandClasses["Application Capability"] = 87] = "Application Capability";
    CommandClasses[CommandClasses["Application Status"] = 34] = "Application Status";
    CommandClasses[CommandClasses["Association"] = 133] = "Association";
    CommandClasses[CommandClasses["Association Command Configuration"] = 155] = "Association Command Configuration";
    CommandClasses[CommandClasses["Association Group Information"] = 89] = "Association Group Information";
    CommandClasses[CommandClasses["Authentication"] = 161] = "Authentication";
    CommandClasses[CommandClasses["Authentication Media Write"] = 162] = "Authentication Media Write";
    CommandClasses[CommandClasses["Barrier Operator"] = 102] = "Barrier Operator";
    CommandClasses[CommandClasses["Basic"] = 32] = "Basic";
    CommandClasses[CommandClasses["Basic Tariff Information"] = 54] = "Basic Tariff Information";
    CommandClasses[CommandClasses["Basic Window Covering"] = 80] = "Basic Window Covering";
    CommandClasses[CommandClasses["Battery"] = 128] = "Battery";
    CommandClasses[CommandClasses["Binary Sensor"] = 48] = "Binary Sensor";
    CommandClasses[CommandClasses["Binary Switch"] = 37] = "Binary Switch";
    CommandClasses[CommandClasses["Binary Toggle Switch"] = 40] = "Binary Toggle Switch";
    CommandClasses[CommandClasses["Central Scene"] = 91] = "Central Scene";
    CommandClasses[CommandClasses["Climate Control Schedule"] = 70] = "Climate Control Schedule";
    CommandClasses[CommandClasses["Clock"] = 129] = "Clock";
    CommandClasses[CommandClasses["Color Switch"] = 51] = "Color Switch";
    CommandClasses[CommandClasses["Configuration"] = 112] = "Configuration";
    CommandClasses[CommandClasses["Controller Replication"] = 33] = "Controller Replication";
    CommandClasses[CommandClasses["CRC-16 Encapsulation"] = 86] = "CRC-16 Encapsulation";
    CommandClasses[CommandClasses["Demand Control Plan Configuration"] = 58] = "Demand Control Plan Configuration";
    CommandClasses[CommandClasses["Demand Control Plan Monitor"] = 59] = "Demand Control Plan Monitor";
    CommandClasses[CommandClasses["Device Reset Locally"] = 90] = "Device Reset Locally";
    CommandClasses[CommandClasses["Door Lock"] = 98] = "Door Lock";
    CommandClasses[CommandClasses["Door Lock Logging"] = 76] = "Door Lock Logging";
    CommandClasses[CommandClasses["Energy Production"] = 144] = "Energy Production";
    CommandClasses[CommandClasses["Entry Control"] = 111] = "Entry Control";
    CommandClasses[CommandClasses["Firmware Update Meta Data"] = 122] = "Firmware Update Meta Data";
    CommandClasses[CommandClasses["Generic Schedule"] = 163] = "Generic Schedule";
    CommandClasses[CommandClasses["Geographic Location"] = 140] = "Geographic Location";
    CommandClasses[CommandClasses["Grouping Name"] = 123] = "Grouping Name";
    CommandClasses[CommandClasses["Hail"] = 130] = "Hail";
    CommandClasses[CommandClasses["HRV Control"] = 57] = "HRV Control";
    CommandClasses[CommandClasses["HRV Status"] = 55] = "HRV Status";
    CommandClasses[CommandClasses["Humidity Control Mode"] = 109] = "Humidity Control Mode";
    CommandClasses[CommandClasses["Humidity Control Operating State"] = 110] = "Humidity Control Operating State";
    CommandClasses[CommandClasses["Humidity Control Setpoint"] = 100] = "Humidity Control Setpoint";
    CommandClasses[CommandClasses["Inclusion Controller"] = 116] = "Inclusion Controller";
    CommandClasses[CommandClasses["Indicator"] = 135] = "Indicator";
    CommandClasses[CommandClasses["IP Association"] = 92] = "IP Association";
    CommandClasses[CommandClasses["IP Configuration"] = 154] = "IP Configuration";
    CommandClasses[CommandClasses["IR Repeater"] = 160] = "IR Repeater";
    CommandClasses[CommandClasses["Irrigation"] = 107] = "Irrigation";
    CommandClasses[CommandClasses["Language"] = 137] = "Language";
    CommandClasses[CommandClasses["Lock"] = 118] = "Lock";
    CommandClasses[CommandClasses["Mailbox"] = 105] = "Mailbox";
    CommandClasses[CommandClasses["Manufacturer Proprietary"] = 145] = "Manufacturer Proprietary";
    CommandClasses[CommandClasses["Manufacturer Specific"] = 114] = "Manufacturer Specific";
    CommandClasses[CommandClasses["Meter"] = 50] = "Meter";
    CommandClasses[CommandClasses["Meter Table Configuration"] = 60] = "Meter Table Configuration";
    CommandClasses[CommandClasses["Meter Table Monitor"] = 61] = "Meter Table Monitor";
    CommandClasses[CommandClasses["Meter Table Push Configuration"] = 62] = "Meter Table Push Configuration";
    CommandClasses[CommandClasses["Move To Position Window Covering"] = 81] = "Move To Position Window Covering";
    CommandClasses[CommandClasses["Multi Channel"] = 96] = "Multi Channel";
    CommandClasses[CommandClasses["Multi Channel Association"] = 142] = "Multi Channel Association";
    CommandClasses[CommandClasses["Multi Command"] = 143] = "Multi Command";
    CommandClasses[CommandClasses["Multilevel Sensor"] = 49] = "Multilevel Sensor";
    CommandClasses[CommandClasses["Multilevel Switch"] = 38] = "Multilevel Switch";
    CommandClasses[CommandClasses["Multilevel Toggle Switch"] = 41] = "Multilevel Toggle Switch";
    CommandClasses[CommandClasses["Network Management Basic Node"] = 77] = "Network Management Basic Node";
    CommandClasses[CommandClasses["Network Management Inclusion"] = 52] = "Network Management Inclusion";
    CommandClasses[CommandClasses["Network Management Installation and Maintenance"] = 103] = "Network Management Installation and Maintenance";
    CommandClasses[CommandClasses["Network Management Primary"] = 84] = "Network Management Primary";
    CommandClasses[CommandClasses["Network Management Proxy"] = 82] = "Network Management Proxy";
    CommandClasses[CommandClasses["No Operation"] = 0] = "No Operation";
    CommandClasses[CommandClasses["Node Naming and Location"] = 119] = "Node Naming and Location";
    CommandClasses[CommandClasses["Node Provisioning"] = 120] = "Node Provisioning";
    CommandClasses[CommandClasses["Notification"] = 113] = "Notification";
    CommandClasses[CommandClasses["Powerlevel"] = 115] = "Powerlevel";
    CommandClasses[CommandClasses["Prepayment"] = 63] = "Prepayment";
    CommandClasses[CommandClasses["Prepayment Encapsulation"] = 65] = "Prepayment Encapsulation";
    CommandClasses[CommandClasses["Proprietary"] = 136] = "Proprietary";
    CommandClasses[CommandClasses["Protection"] = 117] = "Protection";
    CommandClasses[CommandClasses["Pulse Meter"] = 53] = "Pulse Meter";
    CommandClasses[CommandClasses["Rate Table Configuration"] = 72] = "Rate Table Configuration";
    CommandClasses[CommandClasses["Rate Table Monitor"] = 73] = "Rate Table Monitor";
    CommandClasses[CommandClasses["Remote Association Activation"] = 124] = "Remote Association Activation";
    CommandClasses[CommandClasses["Remote Association Configuration"] = 125] = "Remote Association Configuration";
    CommandClasses[CommandClasses["Scene Activation"] = 43] = "Scene Activation";
    CommandClasses[CommandClasses["Scene Actuator Configuration"] = 44] = "Scene Actuator Configuration";
    CommandClasses[CommandClasses["Scene Controller Configuration"] = 45] = "Scene Controller Configuration";
    CommandClasses[CommandClasses["Schedule"] = 83] = "Schedule";
    CommandClasses[CommandClasses["Schedule Entry Lock"] = 78] = "Schedule Entry Lock";
    CommandClasses[CommandClasses["Screen Attributes"] = 147] = "Screen Attributes";
    CommandClasses[CommandClasses["Screen Meta Data"] = 146] = "Screen Meta Data";
    CommandClasses[CommandClasses["Security"] = 152] = "Security";
    CommandClasses[CommandClasses["Security 2"] = 159] = "Security 2";
    CommandClasses[CommandClasses["Security Mark"] = 61696] = "Security Mark";
    CommandClasses[CommandClasses["Sensor Configuration"] = 158] = "Sensor Configuration";
    CommandClasses[CommandClasses["Simple AV Control"] = 148] = "Simple AV Control";
    CommandClasses[CommandClasses["Sound Switch"] = 121] = "Sound Switch";
    CommandClasses[CommandClasses["Supervision"] = 108] = "Supervision";
    CommandClasses[CommandClasses["Support/Control Mark"] = 239] = "Support/Control Mark";
    CommandClasses[CommandClasses["Tariff Table Configuration"] = 74] = "Tariff Table Configuration";
    CommandClasses[CommandClasses["Tariff Table Monitor"] = 75] = "Tariff Table Monitor";
    CommandClasses[CommandClasses["Thermostat Fan Mode"] = 68] = "Thermostat Fan Mode";
    CommandClasses[CommandClasses["Thermostat Fan State"] = 69] = "Thermostat Fan State";
    CommandClasses[CommandClasses["Thermostat Mode"] = 64] = "Thermostat Mode";
    CommandClasses[CommandClasses["Thermostat Operating State"] = 66] = "Thermostat Operating State";
    CommandClasses[CommandClasses["Thermostat Setback"] = 71] = "Thermostat Setback";
    CommandClasses[CommandClasses["Thermostat Setpoint"] = 67] = "Thermostat Setpoint";
    CommandClasses[CommandClasses["Time"] = 138] = "Time";
    CommandClasses[CommandClasses["Time Parameters"] = 139] = "Time Parameters";
    CommandClasses[CommandClasses["Transport Service"] = 85] = "Transport Service";
    CommandClasses[CommandClasses["User Code"] = 99] = "User Code";
    CommandClasses[CommandClasses["User Credential"] = 131] = "User Credential";
    CommandClasses[CommandClasses["Version"] = 134] = "Version";
    CommandClasses[CommandClasses["Wake Up"] = 132] = "Wake Up";
    CommandClasses[CommandClasses["Window Covering"] = 106] = "Window Covering";
    CommandClasses[CommandClasses["Z-Wave Plus Info"] = 94] = "Z-Wave Plus Info";
    CommandClasses[CommandClasses["Z/IP"] = 35] = "Z/IP";
    CommandClasses[CommandClasses["Z/IP 6LoWPAN"] = 79] = "Z/IP 6LoWPAN";
    CommandClasses[CommandClasses["Z/IP Gateway"] = 95] = "Z/IP Gateway";
    CommandClasses[CommandClasses["Z/IP Naming and Location"] = 104] = "Z/IP Naming and Location";
    CommandClasses[CommandClasses["Z/IP ND"] = 88] = "Z/IP ND";
    CommandClasses[CommandClasses["Z/IP Portal"] = 97] = "Z/IP Portal";
    // Internal CCs which are not used directly by applications
    CommandClasses[CommandClasses["Z-Wave Protocol"] = 1] = "Z-Wave Protocol";
    CommandClasses[CommandClasses["Z-Wave Long Range"] = 4] = "Z-Wave Long Range";
    // Long gone:
    // "AV Content Directory Metadata" = 0x95,
    // "AV Content Search Metadata" = 0x97,
    // "AV Renderer Status" = 0x96,
    // "AV Tagging Metadata" = 0x99,
    // "Chimney Fan" = 0x2a,
    // "DMX" = 0x65,
    // "Thermostat Heating" = 0x38,
    // "Security Panel Mode" = 0x24,
    // "Security Panel Zone" = 0x2e,
    // "Security Panel Zone Sensor" = 0x2f,
    // "Zensor Net" = 0x02,
})(CommandClasses || (CommandClasses = {}));
export function getCCName(cc) {
    return getEnumMemberName(CommandClasses, cc);
}
/**
 * An array of all defined CCs
 */
export const allCCs = Object.freeze(Object.keys(CommandClasses)
    .filter((key) => /^\d+$/.test(key))
    .map((key) => parseInt(key))
    .filter((key) => key >= 0 && key !== CommandClasses["Z-Wave Protocol"]));
/**
 * Defines which CCs are considered Actuator CCs
 */
// Is defined in SDS13781
export const actuatorCCs = [
    CommandClasses["Barrier Operator"],
    CommandClasses["Binary Switch"],
    CommandClasses["Color Switch"],
    CommandClasses["Door Lock"],
    CommandClasses["Multilevel Switch"],
    CommandClasses["Simple AV Control"],
    CommandClasses["Sound Switch"],
    CommandClasses["Thermostat Setpoint"],
    CommandClasses["Thermostat Mode"],
    CommandClasses["Window Covering"],
];
const actuatorCCsAsSet = new Set(actuatorCCs);
/** Returns if the given CC is an Actuator CC */
export function isActuatorCC(cc) {
    return actuatorCCsAsSet.has(cc);
}
/**
 * Defines which CCs are considered Sensor CCs
 */
export const sensorCCs = [
    CommandClasses["Alarm Sensor"],
    CommandClasses.Battery,
    CommandClasses["Binary Sensor"],
    CommandClasses["Energy Production"],
    CommandClasses.Meter,
    CommandClasses["Multilevel Sensor"],
    CommandClasses.Notification, // For pull nodes
    CommandClasses["Pulse Meter"],
];
const sensorCCsAsSet = new Set(sensorCCs);
/** Returns if the given CC is a Sensor CC */
export function isSensorCC(cc) {
    return sensorCCsAsSet.has(cc);
}
/**
 * Defines which CCs are considered Application CCs
 */
// Is defined in SDS13781
export const applicationCCs = [
    CommandClasses["Alarm Sensor"],
    CommandClasses["Alarm Silence"],
    CommandClasses["All Switch"],
    CommandClasses["Anti-Theft"],
    CommandClasses["Barrier Operator"],
    CommandClasses.Basic,
    CommandClasses["Basic Tariff Information"],
    CommandClasses["Basic Window Covering"],
    CommandClasses["Binary Sensor"],
    CommandClasses["Binary Switch"],
    CommandClasses["Binary Toggle Switch"],
    CommandClasses["Climate Control Schedule"],
    CommandClasses["Central Scene"],
    CommandClasses.Clock,
    CommandClasses["Color Switch"],
    CommandClasses.Configuration,
    CommandClasses["Controller Replication"],
    CommandClasses["Demand Control Plan Configuration"],
    CommandClasses["Demand Control Plan Monitor"],
    CommandClasses["Door Lock"],
    CommandClasses["Door Lock Logging"],
    CommandClasses["Energy Production"],
    CommandClasses["Entry Control"],
    CommandClasses["Generic Schedule"],
    CommandClasses["Geographic Location"],
    CommandClasses["HRV Status"],
    CommandClasses["HRV Control"],
    CommandClasses["Humidity Control Mode"],
    CommandClasses["Humidity Control Operating State"],
    CommandClasses["Humidity Control Setpoint"],
    CommandClasses["IR Repeater"],
    CommandClasses.Irrigation,
    CommandClasses.Language,
    CommandClasses.Lock,
    CommandClasses["Manufacturer Proprietary"],
    CommandClasses.Meter,
    CommandClasses["Meter Table Configuration"],
    CommandClasses["Meter Table Monitor"],
    CommandClasses["Meter Table Push Configuration"],
    CommandClasses["Move To Position Window Covering"],
    CommandClasses["Multilevel Sensor"],
    CommandClasses["Multilevel Switch"],
    CommandClasses["Multilevel Toggle Switch"],
    CommandClasses.Notification,
    CommandClasses.Prepayment,
    CommandClasses["Prepayment Encapsulation"],
    CommandClasses.Proprietary,
    CommandClasses.Protection,
    CommandClasses["Pulse Meter"],
    CommandClasses["Rate Table Configuration"],
    CommandClasses["Rate Table Monitor"],
    CommandClasses["Scene Activation"],
    CommandClasses["Scene Actuator Configuration"],
    CommandClasses["Scene Controller Configuration"],
    CommandClasses.Schedule,
    CommandClasses["Schedule Entry Lock"],
    CommandClasses["Screen Attributes"],
    CommandClasses["Screen Meta Data"],
    CommandClasses["Sensor Configuration"],
    CommandClasses["Simple AV Control"],
    CommandClasses["Sound Switch"],
    CommandClasses["Tariff Table Configuration"],
    CommandClasses["Tariff Table Monitor"],
    CommandClasses["Thermostat Fan Mode"],
    CommandClasses["Thermostat Fan State"],
    CommandClasses["Thermostat Mode"],
    CommandClasses["Thermostat Operating State"],
    CommandClasses["Thermostat Setback"],
    CommandClasses["Thermostat Setpoint"],
    CommandClasses["User Code"],
    CommandClasses["User Credential"],
    CommandClasses["Window Covering"],
];
const applicationCCsAsSet = new Set(applicationCCs);
/** Returns if the given CC is an Application CC */
export function isApplicationCC(cc) {
    return applicationCCsAsSet.has(cc);
}
/**
 * Defines which CCs are considered Encapsulation CCs
 */
export const encapsulationCCs = [
    CommandClasses["CRC-16 Encapsulation"],
    CommandClasses["Multi Channel"],
    CommandClasses["Multi Command"],
    CommandClasses.Security,
    CommandClasses["Security 2"],
    CommandClasses.Supervision,
    CommandClasses["Transport Service"],
];
const encapsulationCCsAsSet = new Set(encapsulationCCs);
/** Returns if the given CC is an Encapsulation CC */
export function isEncapsulationCC(cc) {
    return encapsulationCCsAsSet.has(cc);
}
/**
 * Defines which CCs are considered Management CCs
 */
export const managementCCs = [
    CommandClasses["Application Capability"],
    CommandClasses["Application Status"],
    CommandClasses.Association,
    CommandClasses["Association Command Configuration"],
    CommandClasses["Association Group Information"],
    // Battery is in the Management CC specs, but we consider it a Sensor CC
    CommandClasses["Device Reset Locally"],
    CommandClasses["Firmware Update Meta Data"],
    CommandClasses["Grouping Name"],
    CommandClasses.Hail,
    CommandClasses.Indicator,
    CommandClasses["IP Association"],
    CommandClasses["Manufacturer Specific"],
    CommandClasses["Multi Channel Association"],
    CommandClasses["Node Naming and Location"],
    CommandClasses["Remote Association Activation"],
    CommandClasses["Remote Association Configuration"],
    CommandClasses.Time,
    CommandClasses["Time Parameters"],
    CommandClasses.Version,
    CommandClasses["Wake Up"],
    CommandClasses["Z/IP Naming and Location"],
    CommandClasses["Z-Wave Plus Info"],
];
const managementCCsAsSet = new Set(managementCCs);
/** Returns if the given CC is a Management CC */
export function isManagementCC(cc) {
    return managementCCsAsSet.has(cc);
}
/**
 * An array of all defined CCs that are not application CCs
 */
export const nonApplicationCCs = Object.freeze(allCCs.filter((cc) => !applicationCCs.includes(cc)));
export function isCCInfoEqual(a, b) {
    return (a.isSupported === b.isSupported
        && a.isControlled === b.isControlled
        && a.secure === b.secure
        && a.version === b.version);
}
//# sourceMappingURL=CommandClasses.js.map