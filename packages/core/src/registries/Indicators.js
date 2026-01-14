export var Indicator;
(function (Indicator) {
    Indicator[Indicator["Armed"] = 1] = "Armed";
    Indicator[Indicator["Not armed / disarmed"] = 2] = "Not armed / disarmed";
    Indicator[Indicator["Ready"] = 3] = "Ready";
    Indicator[Indicator["Fault"] = 4] = "Fault";
    Indicator[Indicator["Busy"] = 5] = "Busy";
    Indicator[Indicator["Enter ID"] = 6] = "Enter ID";
    Indicator[Indicator["Enter PIN"] = 7] = "Enter PIN";
    Indicator[Indicator["Code accepted"] = 8] = "Code accepted";
    Indicator[Indicator["Code not accepted"] = 9] = "Code not accepted";
    Indicator[Indicator["Armed Stay"] = 10] = "Armed Stay";
    Indicator[Indicator["Armed Away"] = 11] = "Armed Away";
    Indicator[Indicator["Alarming"] = 12] = "Alarming";
    Indicator[Indicator["Alarming: Burglar"] = 13] = "Alarming: Burglar";
    Indicator[Indicator["Alarming: Smoke / Fire"] = 14] = "Alarming: Smoke / Fire";
    Indicator[Indicator["Alarming: Carbon Monoxide"] = 15] = "Alarming: Carbon Monoxide";
    Indicator[Indicator["Bypass challenge"] = 16] = "Bypass challenge";
    Indicator[Indicator["Entry Delay"] = 17] = "Entry Delay";
    Indicator[Indicator["Exit Delay"] = 18] = "Exit Delay";
    Indicator[Indicator["Alarming: Medical"] = 19] = "Alarming: Medical";
    Indicator[Indicator["Alarming: Freeze warning"] = 20] = "Alarming: Freeze warning";
    Indicator[Indicator["Alarming: Water leak"] = 21] = "Alarming: Water leak";
    Indicator[Indicator["Alarming: Panic"] = 22] = "Alarming: Panic";
    Indicator[Indicator["Zone 1 armed"] = 32] = "Zone 1 armed";
    Indicator[Indicator["Zone 2 armed"] = 33] = "Zone 2 armed";
    Indicator[Indicator["Zone 3 armed"] = 34] = "Zone 3 armed";
    Indicator[Indicator["Zone 4 armed"] = 35] = "Zone 4 armed";
    Indicator[Indicator["Zone 5 armed"] = 36] = "Zone 5 armed";
    Indicator[Indicator["Zone 6 armed"] = 37] = "Zone 6 armed";
    Indicator[Indicator["Zone 7 armed"] = 38] = "Zone 7 armed";
    Indicator[Indicator["Zone 8 armed"] = 39] = "Zone 8 armed";
    Indicator[Indicator["LCD backlight"] = 48] = "LCD backlight";
    Indicator[Indicator["Button backlight letters"] = 64] = "Button backlight letters";
    Indicator[Indicator["Button backlight digits"] = 65] = "Button backlight digits";
    Indicator[Indicator["Button backlight command"] = 66] = "Button backlight command";
    Indicator[Indicator["Button 1 indication"] = 67] = "Button 1 indication";
    Indicator[Indicator["Button 2 indication"] = 68] = "Button 2 indication";
    Indicator[Indicator["Button 3 indication"] = 69] = "Button 3 indication";
    Indicator[Indicator["Button 4 indication"] = 70] = "Button 4 indication";
    Indicator[Indicator["Button 5 indication"] = 71] = "Button 5 indication";
    Indicator[Indicator["Button 6 indication"] = 72] = "Button 6 indication";
    Indicator[Indicator["Button 7 indication"] = 73] = "Button 7 indication";
    Indicator[Indicator["Button 8 indication"] = 74] = "Button 8 indication";
    Indicator[Indicator["Button 9 indication"] = 75] = "Button 9 indication";
    Indicator[Indicator["Button 10 indication"] = 76] = "Button 10 indication";
    Indicator[Indicator["Button 11 indication"] = 77] = "Button 11 indication";
    Indicator[Indicator["Button 12 indication"] = 78] = "Button 12 indication";
    Indicator[Indicator["Node Identify"] = 80] = "Node Identify";
    Indicator[Indicator["Generic event sound notification 1"] = 96] = "Generic event sound notification 1";
    Indicator[Indicator["Generic event sound notification 2"] = 97] = "Generic event sound notification 2";
    Indicator[Indicator["Generic event sound notification 3"] = 98] = "Generic event sound notification 3";
    Indicator[Indicator["Generic event sound notification 4"] = 99] = "Generic event sound notification 4";
    Indicator[Indicator["Generic event sound notification 5"] = 100] = "Generic event sound notification 5";
    Indicator[Indicator["Generic event sound notification 6"] = 101] = "Generic event sound notification 6";
    Indicator[Indicator["Generic event sound notification 7"] = 102] = "Generic event sound notification 7";
    Indicator[Indicator["Generic event sound notification 8"] = 103] = "Generic event sound notification 8";
    Indicator[Indicator["Generic event sound notification 9"] = 104] = "Generic event sound notification 9";
    Indicator[Indicator["Generic event sound notification 10"] = 105] = "Generic event sound notification 10";
    Indicator[Indicator["Generic event sound notification 11"] = 106] = "Generic event sound notification 11";
    Indicator[Indicator["Generic event sound notification 12"] = 107] = "Generic event sound notification 12";
    Indicator[Indicator["Generic event sound notification 13"] = 108] = "Generic event sound notification 13";
    Indicator[Indicator["Generic event sound notification 14"] = 109] = "Generic event sound notification 14";
    Indicator[Indicator["Generic event sound notification 15"] = 110] = "Generic event sound notification 15";
    Indicator[Indicator["Generic event sound notification 16"] = 111] = "Generic event sound notification 16";
    Indicator[Indicator["Generic event sound notification 17"] = 112] = "Generic event sound notification 17";
    Indicator[Indicator["Generic event sound notification 18"] = 113] = "Generic event sound notification 18";
    Indicator[Indicator["Generic event sound notification 19"] = 114] = "Generic event sound notification 19";
    Indicator[Indicator["Generic event sound notification 20"] = 115] = "Generic event sound notification 20";
    Indicator[Indicator["Generic event sound notification 21"] = 116] = "Generic event sound notification 21";
    Indicator[Indicator["Generic event sound notification 22"] = 117] = "Generic event sound notification 22";
    Indicator[Indicator["Generic event sound notification 23"] = 118] = "Generic event sound notification 23";
    Indicator[Indicator["Generic event sound notification 24"] = 119] = "Generic event sound notification 24";
    Indicator[Indicator["Generic event sound notification 25"] = 120] = "Generic event sound notification 25";
    Indicator[Indicator["Generic event sound notification 26"] = 121] = "Generic event sound notification 26";
    Indicator[Indicator["Generic event sound notification 27"] = 122] = "Generic event sound notification 27";
    Indicator[Indicator["Generic event sound notification 28"] = 123] = "Generic event sound notification 28";
    Indicator[Indicator["Generic event sound notification 29"] = 124] = "Generic event sound notification 29";
    Indicator[Indicator["Generic event sound notification 30"] = 125] = "Generic event sound notification 30";
    Indicator[Indicator["Generic event sound notification 31"] = 126] = "Generic event sound notification 31";
    Indicator[Indicator["Generic event sound notification 32"] = 127] = "Generic event sound notification 32";
    Indicator[Indicator["Manufacturer defined 1"] = 128] = "Manufacturer defined 1";
    Indicator[Indicator["Manufacturer defined 2"] = 129] = "Manufacturer defined 2";
    Indicator[Indicator["Manufacturer defined 3"] = 130] = "Manufacturer defined 3";
    Indicator[Indicator["Manufacturer defined 4"] = 131] = "Manufacturer defined 4";
    Indicator[Indicator["Manufacturer defined 5"] = 132] = "Manufacturer defined 5";
    Indicator[Indicator["Manufacturer defined 6"] = 133] = "Manufacturer defined 6";
    Indicator[Indicator["Manufacturer defined 7"] = 134] = "Manufacturer defined 7";
    Indicator[Indicator["Manufacturer defined 8"] = 135] = "Manufacturer defined 8";
    Indicator[Indicator["Manufacturer defined 9"] = 136] = "Manufacturer defined 9";
    Indicator[Indicator["Manufacturer defined 10"] = 137] = "Manufacturer defined 10";
    Indicator[Indicator["Manufacturer defined 11"] = 138] = "Manufacturer defined 11";
    Indicator[Indicator["Manufacturer defined 12"] = 139] = "Manufacturer defined 12";
    Indicator[Indicator["Manufacturer defined 13"] = 140] = "Manufacturer defined 13";
    Indicator[Indicator["Manufacturer defined 14"] = 141] = "Manufacturer defined 14";
    Indicator[Indicator["Manufacturer defined 15"] = 142] = "Manufacturer defined 15";
    Indicator[Indicator["Manufacturer defined 16"] = 143] = "Manufacturer defined 16";
    Indicator[Indicator["Manufacturer defined 17"] = 144] = "Manufacturer defined 17";
    Indicator[Indicator["Manufacturer defined 18"] = 145] = "Manufacturer defined 18";
    Indicator[Indicator["Manufacturer defined 19"] = 146] = "Manufacturer defined 19";
    Indicator[Indicator["Manufacturer defined 20"] = 147] = "Manufacturer defined 20";
    Indicator[Indicator["Manufacturer defined 21"] = 148] = "Manufacturer defined 21";
    Indicator[Indicator["Manufacturer defined 22"] = 149] = "Manufacturer defined 22";
    Indicator[Indicator["Manufacturer defined 23"] = 150] = "Manufacturer defined 23";
    Indicator[Indicator["Manufacturer defined 24"] = 151] = "Manufacturer defined 24";
    Indicator[Indicator["Manufacturer defined 25"] = 152] = "Manufacturer defined 25";
    Indicator[Indicator["Manufacturer defined 26"] = 153] = "Manufacturer defined 26";
    Indicator[Indicator["Manufacturer defined 27"] = 154] = "Manufacturer defined 27";
    Indicator[Indicator["Manufacturer defined 28"] = 155] = "Manufacturer defined 28";
    Indicator[Indicator["Manufacturer defined 29"] = 156] = "Manufacturer defined 29";
    Indicator[Indicator["Manufacturer defined 30"] = 157] = "Manufacturer defined 30";
    Indicator[Indicator["Manufacturer defined 31"] = 158] = "Manufacturer defined 31";
    Indicator[Indicator["Manufacturer defined 32"] = 159] = "Manufacturer defined 32";
    Indicator[Indicator["Buzzer"] = 240] = "Buzzer";
})(Indicator || (Indicator = {}));
const indicatorProperties = Object.freeze({
    [0x01]: {
        label: "Multilevel",
        exposeAsValue: true,
    },
    [0x02]: {
        label: "Binary",
        type: "boolean",
        exposeAsValue: true,
    },
    [0x03]: {
        label: "On/Off Period: Duration",
        description: "Sets the duration of an on/off period in 1/10th seconds. Must be set together with \"On/Off Cycle Count\"",
    },
    [0x04]: {
        label: "On/Off Cycle Count",
        description: "Sets the number of on/off periods. 0xff means infinite. Must be set together with \"On/Off Period duration\"",
    },
    [0x05]: {
        label: "On/Off Period: On time",
        description: "This property is used to set the length of the On time during an On/Off period. It allows asymmetric On/Off periods. The value 0x00 MUST represent symmetric On/Off period (On time equal to Off time)",
    },
    [0x0a]: {
        label: "Timeout: Hours",
        description: "Turns the indicator of after this amount of hours. Can be used together with other timeout properties",
    },
    [0x06]: {
        label: "Timeout: Minutes",
        description: "Turns the indicator of after this amount of minutes. Can be used together with other timeout properties",
    },
    [0x07]: {
        label: "Timeout: Seconds",
        description: "Turns the indicator of after this amount of seconds. Can be used together with other timeout properties",
    },
    [0x08]: {
        label: "Timeout: 1/100th seconds",
        description: "Turns the indicator of after this amount of 1/100th seconds. Can be used together with other timeout properties",
    },
    [0x09]: {
        label: "Sound level",
        description: "This property is used to set the volume of a indicator. 0 means off/mute.",
        max: 100,
        exposeAsValue: true,
    },
    [0x10]: {
        label: "Low power",
        description: "This property MAY be used to by a supporting node advertise that the indicator can continue working in sleep mode.",
        readonly: true,
        type: "boolean",
    },
});
/** Returns the indicator property definition for the given id */
export function getIndicatorProperty(id) {
    const property = indicatorProperties[id];
    // @ts-expect-error Undefined is valid if the property is not found
    if (!property)
        return;
    return {
        id,
        ...property,
    };
}
/** Returns all defined indicator properties */
export function getAllIndicatorProperties() {
    return Object.entries(indicatorProperties)
        .map(([id, value]) => ({ id: parseInt(id, 10), ...value }));
}
//# sourceMappingURL=Indicators.js.map