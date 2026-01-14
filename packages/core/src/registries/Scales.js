import { num2hex } from "@zwave-js/shared";
import { ZWaveError, ZWaveErrorCodes } from "../error/ZWaveError.js";
const namedScales = Object.freeze({
    temperature: {
        [0x00]: {
            label: "Celsius",
            unit: "°C",
        },
        [0x01]: {
            label: "Fahrenheit",
            unit: "°F",
        },
    },
    humidity: {
        [0x00]: {
            label: "Percentage value",
            unit: "%",
        },
        [0x01]: {
            label: "Absolute humidity",
            unit: "g/m³",
        },
    },
    mass: {
        [0x00]: {
            label: "Kilogram",
            unit: "kg",
        },
    },
    acceleration: {
        [0x00]: {
            label: "Meter per square second",
            unit: "m/s²",
        },
    },
    percentage: {
        [0x00]: {
            label: "Percentage value",
            unit: "%",
        },
    },
    acidity: {
        [0x00]: {
            label: "Acidity",
            unit: "pH",
        },
    },
    direction: {
        [0x00]: {
            label: "Degrees",
            unit: "°",
            description: "0° = no motion detected, 90° = east, 180° = south, 270° = west, 360° = north",
        },
    },
    pressure: {
        [0x00]: {
            label: "Kilopascal",
            unit: "kPa",
        },
        [0x01]: {
            label: "Pound per square inch",
            unit: "psi",
        },
    },
    airPressure: {
        [0x00]: {
            label: "Kilopascal",
            unit: "kPa",
        },
        [0x01]: {
            label: "Inches of Mercury",
            unit: "inHg",
        },
    },
    density: {
        [0x00]: {
            label: "Density",
            unit: "µg/m³",
        },
    },
    unitless: {
        [0x00]: {
            label: "Unitless",
        },
    },
});
/** Returns the group of scale definitions with the given name */
export function getNamedScaleGroup(group) {
    const scaleGroup = namedScales[group];
    if (!scaleGroup) {
        throw new ZWaveError(`The scale group with name ${group} does not exist`, ZWaveErrorCodes.Argument_Invalid);
    }
    return scaleGroup;
}
/** Returns all defined named scale groups */
export function getAllNamedScaleGroups() {
    return Object.entries(namedScales)
        .map(([name, scales]) => ({ name, scales }));
}
/** Returns a scale definition for a scale with known name and key */
export function getNamedScale(group, key) {
    const scaleGroup = getNamedScaleGroup(group);
    const scaleDef = scaleGroup[key];
    if (!scaleDef) {
        throw new ZWaveError(`The scale group ${group} does not contain a scale with key ${key}`, ZWaveErrorCodes.Argument_Invalid);
    }
    return {
        key: key,
        ...scaleDef,
    };
}
/** Returns a scale definition for a scale that is not known */
export function getUnknownScale(key) {
    return {
        key,
        label: `Unknown (${num2hex(key)})`,
    };
}
//# sourceMappingURL=Scales.js.map