import { num2hex } from "@zwave-js/shared";
export const meters = Object.freeze({
    [0x01]: {
        name: "Electric",
        scales: {
            [0x00]: {
                label: "kWh",
                unit: "kWh",
            },
            [0x01]: {
                label: "kVAh",
                unit: "kVAh",
            },
            [0x02]: {
                label: "W",
                unit: "W",
            },
            [0x03]: {
                label: "Pulse count",
            },
            [0x04]: {
                label: "V",
                unit: "V",
            },
            [0x05]: {
                label: "A",
                unit: "A",
            },
            [0x06]: {
                label: "Power Factor",
            },
            [0x07]: {
                label: "kVar",
                unit: "kVar",
            },
            [0x08]: {
                label: "kVarh",
                unit: "kVarh",
            },
        },
    },
    [0x02]: {
        name: "Gas",
        scales: {
            [0x00]: {
                label: "Cubic meters",
                unit: "m³",
            },
            [0x01]: {
                label: "Cubic feet",
                unit: "ft³",
            },
            [0x03]: {
                label: "Pulse count",
            },
        },
    },
    [0x03]: {
        name: "Water",
        scales: {
            [0x00]: {
                label: "Cubic meters",
                unit: "m³",
            },
            [0x01]: {
                label: "Cubic feet",
                unit: "ft³",
            },
            [0x02]: {
                label: "US gallons",
                unit: "gal",
            },
            [0x03]: {
                label: "Pulse count",
            },
        },
    },
    [0x04]: {
        name: "Heating",
        scales: {
            [0x00]: {
                label: "kWh",
                unit: "kWh",
            },
        },
    },
    [0x05]: {
        name: "Cooling",
        scales: {
            [0x00]: {
                label: "kWh",
                unit: "kWh",
            },
        },
    },
});
/** Returns the meter definition for the given key */
export function getMeter(type) {
    const meter = meters[type];
    // @ts-expect-error Undefined is valid if the meter type is not found
    if (!meter)
        return;
    return {
        key: type,
        ...meter,
    };
}
/** Returns all meter definitions including their scales */
export function getAllMeters() {
    return Object.entries(meters)
        .map(([key, value]) => ({ key: parseInt(key, 10), ...value }));
}
export function getMeterName(meterType) {
    return getMeter(meterType)?.name
        ?? `UNKNOWN (${num2hex(meterType)})`;
}
/** Returns a meter scale definition for the given meter type and scale key */
export function getMeterScale(type, scale) {
    const meter = getMeter(type);
    // @ts-expect-error Undefined is valid if the meter is not found
    if (!meter)
        return;
    const scaleDef = (meter?.scales)[scale];
    // @ts-expect-error Undefined is valid if the scale is not found
    if (!scaleDef)
        return;
    return {
        key: scale,
        ...scaleDef,
    };
}
/** Returns a meter scale definition for a scale that is not known */
export function getUnknownMeterScale(key) {
    return {
        key,
        label: `Unknown (${num2hex(key)})`,
    };
}
/** Returns all scales of a given meter */
export function getAllMeterScales(meterType) {
    const meter = getMeter(meterType);
    if (!meter)
        return;
    return Object.entries(meter.scales)
        .map(([key, value]) => ({ key: parseInt(key, 10), ...value }));
}
//# sourceMappingURL=Meters.js.map