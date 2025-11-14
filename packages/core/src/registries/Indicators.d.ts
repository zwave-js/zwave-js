import type { ValueType } from "../values/Metadata.js";
export declare enum Indicator {
    "Armed" = 1,
    "Not armed / disarmed" = 2,
    "Ready" = 3,
    "Fault" = 4,
    "Busy" = 5,
    "Enter ID" = 6,
    "Enter PIN" = 7,
    "Code accepted" = 8,
    "Code not accepted" = 9,
    "Armed Stay" = 10,
    "Armed Away" = 11,
    "Alarming" = 12,
    "Alarming: Burglar" = 13,
    "Alarming: Smoke / Fire" = 14,
    "Alarming: Carbon Monoxide" = 15,
    "Bypass challenge" = 16,
    "Entry Delay" = 17,
    "Exit Delay" = 18,
    "Alarming: Medical" = 19,
    "Alarming: Freeze warning" = 20,
    "Alarming: Water leak" = 21,
    "Alarming: Panic" = 22,
    "Zone 1 armed" = 32,
    "Zone 2 armed" = 33,
    "Zone 3 armed" = 34,
    "Zone 4 armed" = 35,
    "Zone 5 armed" = 36,
    "Zone 6 armed" = 37,
    "Zone 7 armed" = 38,
    "Zone 8 armed" = 39,
    "LCD backlight" = 48,
    "Button backlight letters" = 64,
    "Button backlight digits" = 65,
    "Button backlight command" = 66,
    "Button 1 indication" = 67,
    "Button 2 indication" = 68,
    "Button 3 indication" = 69,
    "Button 4 indication" = 70,
    "Button 5 indication" = 71,
    "Button 6 indication" = 72,
    "Button 7 indication" = 73,
    "Button 8 indication" = 74,
    "Button 9 indication" = 75,
    "Button 10 indication" = 76,
    "Button 11 indication" = 77,
    "Button 12 indication" = 78,
    "Node Identify" = 80,
    "Generic event sound notification 1" = 96,
    "Generic event sound notification 2" = 97,
    "Generic event sound notification 3" = 98,
    "Generic event sound notification 4" = 99,
    "Generic event sound notification 5" = 100,
    "Generic event sound notification 6" = 101,
    "Generic event sound notification 7" = 102,
    "Generic event sound notification 8" = 103,
    "Generic event sound notification 9" = 104,
    "Generic event sound notification 10" = 105,
    "Generic event sound notification 11" = 106,
    "Generic event sound notification 12" = 107,
    "Generic event sound notification 13" = 108,
    "Generic event sound notification 14" = 109,
    "Generic event sound notification 15" = 110,
    "Generic event sound notification 16" = 111,
    "Generic event sound notification 17" = 112,
    "Generic event sound notification 18" = 113,
    "Generic event sound notification 19" = 114,
    "Generic event sound notification 20" = 115,
    "Generic event sound notification 21" = 116,
    "Generic event sound notification 22" = 117,
    "Generic event sound notification 23" = 118,
    "Generic event sound notification 24" = 119,
    "Generic event sound notification 25" = 120,
    "Generic event sound notification 26" = 121,
    "Generic event sound notification 27" = 122,
    "Generic event sound notification 28" = 123,
    "Generic event sound notification 29" = 124,
    "Generic event sound notification 30" = 125,
    "Generic event sound notification 31" = 126,
    "Generic event sound notification 32" = 127,
    "Manufacturer defined 1" = 128,
    "Manufacturer defined 2" = 129,
    "Manufacturer defined 3" = 130,
    "Manufacturer defined 4" = 131,
    "Manufacturer defined 5" = 132,
    "Manufacturer defined 6" = 133,
    "Manufacturer defined 7" = 134,
    "Manufacturer defined 8" = 135,
    "Manufacturer defined 9" = 136,
    "Manufacturer defined 10" = 137,
    "Manufacturer defined 11" = 138,
    "Manufacturer defined 12" = 139,
    "Manufacturer defined 13" = 140,
    "Manufacturer defined 14" = 141,
    "Manufacturer defined 15" = 142,
    "Manufacturer defined 16" = 143,
    "Manufacturer defined 17" = 144,
    "Manufacturer defined 18" = 145,
    "Manufacturer defined 19" = 146,
    "Manufacturer defined 20" = 147,
    "Manufacturer defined 21" = 148,
    "Manufacturer defined 22" = 149,
    "Manufacturer defined 23" = 150,
    "Manufacturer defined 24" = 151,
    "Manufacturer defined 25" = 152,
    "Manufacturer defined 26" = 153,
    "Manufacturer defined 27" = 154,
    "Manufacturer defined 28" = 155,
    "Manufacturer defined 29" = 156,
    "Manufacturer defined 30" = 157,
    "Manufacturer defined 31" = 158,
    "Manufacturer defined 32" = 159,
    "Buzzer" = 240
}
export interface IndicatorPropertyDefinition {
    readonly label: string;
    readonly description?: string;
    readonly min?: number;
    readonly max?: number;
    readonly readonly?: boolean;
    readonly type?: ValueType;
    /** Whether this property should be exposed as a CC value. Default: false */
    readonly exposeAsValue?: boolean;
}
export interface IndicatorProperty extends IndicatorPropertyDefinition {
    readonly id: number;
}
declare const indicatorProperties: Readonly<{
    readonly 1: {
        readonly label: "Multilevel";
        readonly exposeAsValue: true;
    };
    readonly 2: {
        readonly label: "Binary";
        readonly type: "boolean";
        readonly exposeAsValue: true;
    };
    readonly 3: {
        readonly label: "On/Off Period: Duration";
        readonly description: "Sets the duration of an on/off period in 1/10th seconds. Must be set together with \"On/Off Cycle Count\"";
    };
    readonly 4: {
        readonly label: "On/Off Cycle Count";
        readonly description: "Sets the number of on/off periods. 0xff means infinite. Must be set together with \"On/Off Period duration\"";
    };
    readonly 5: {
        readonly label: "On/Off Period: On time";
        readonly description: "This property is used to set the length of the On time during an On/Off period. It allows asymmetric On/Off periods. The value 0x00 MUST represent symmetric On/Off period (On time equal to Off time)";
    };
    readonly 10: {
        readonly label: "Timeout: Hours";
        readonly description: "Turns the indicator of after this amount of hours. Can be used together with other timeout properties";
    };
    readonly 6: {
        readonly label: "Timeout: Minutes";
        readonly description: "Turns the indicator of after this amount of minutes. Can be used together with other timeout properties";
    };
    readonly 7: {
        readonly label: "Timeout: Seconds";
        readonly description: "Turns the indicator of after this amount of seconds. Can be used together with other timeout properties";
    };
    readonly 8: {
        readonly label: "Timeout: 1/100th seconds";
        readonly description: "Turns the indicator of after this amount of 1/100th seconds. Can be used together with other timeout properties";
    };
    readonly 9: {
        readonly label: "Sound level";
        readonly description: "This property is used to set the volume of a indicator. 0 means off/mute.";
        readonly max: 100;
        readonly exposeAsValue: true;
    };
    readonly 16: {
        readonly label: "Low power";
        readonly description: "This property MAY be used to by a supporting node advertise that the indicator can continue working in sleep mode.";
        readonly readonly: true;
        readonly type: "boolean";
    };
}>;
export type IndicatorProperties = typeof indicatorProperties;
/** Returns the indicator property definition for the given id */
export declare function getIndicatorProperty<ID extends number>(id: ID): ID extends keyof IndicatorProperties ? ({
    id: ID;
} & (IndicatorProperties[ID])) : (IndicatorProperty | undefined);
/** Returns all defined indicator properties */
export declare function getAllIndicatorProperties(): readonly IndicatorProperty[];
export {};
//# sourceMappingURL=Indicators.d.ts.map