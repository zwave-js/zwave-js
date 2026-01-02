export interface ScaleDefinition {
    readonly label: string;
    readonly unit?: string;
    readonly description?: string;
}
export interface Scale extends ScaleDefinition {
    readonly key: number;
}
export type ScaleGroup = Record<number, ScaleDefinition>;
export interface NamedScaleGroup {
    name: string;
    scales: Record<number, ScaleDefinition>;
}
declare const namedScales: Readonly<{
    readonly temperature: {
        readonly 0: {
            readonly label: "Celsius";
            readonly unit: "°C";
        };
        readonly 1: {
            readonly label: "Fahrenheit";
            readonly unit: "°F";
        };
    };
    readonly humidity: {
        readonly 0: {
            readonly label: "Percentage value";
            readonly unit: "%";
        };
        readonly 1: {
            readonly label: "Absolute humidity";
            readonly unit: "g/m³";
        };
    };
    readonly mass: {
        readonly 0: {
            readonly label: "Kilogram";
            readonly unit: "kg";
        };
    };
    readonly acceleration: {
        readonly 0: {
            readonly label: "Meter per square second";
            readonly unit: "m/s²";
        };
    };
    readonly percentage: {
        readonly 0: {
            readonly label: "Percentage value";
            readonly unit: "%";
        };
    };
    readonly acidity: {
        readonly 0: {
            readonly label: "Acidity";
            readonly unit: "pH";
        };
    };
    readonly direction: {
        readonly 0: {
            readonly label: "Degrees";
            readonly unit: "°";
            readonly description: "0° = no motion detected, 90° = east, 180° = south, 270° = west, 360° = north";
        };
    };
    readonly pressure: {
        readonly 0: {
            readonly label: "Kilopascal";
            readonly unit: "kPa";
        };
        readonly 1: {
            readonly label: "Pound per square inch";
            readonly unit: "psi";
        };
    };
    readonly airPressure: {
        readonly 0: {
            readonly label: "Kilopascal";
            readonly unit: "kPa";
        };
        readonly 1: {
            readonly label: "Inches of Mercury";
            readonly unit: "inHg";
        };
    };
    readonly density: {
        readonly 0: {
            readonly label: "Density";
            readonly unit: "µg/m³";
        };
    };
    readonly unitless: {
        readonly 0: {
            readonly label: "Unitless";
        };
    };
}>;
export type NamedScales = typeof namedScales;
/** Returns the group of scale definitions with the given name */
export declare function getNamedScaleGroup<Name extends keyof NamedScales>(group: Name): NamedScales[Name];
/** Returns all defined named scale groups */
export declare function getAllNamedScaleGroups(): readonly NamedScaleGroup[];
/** Returns a scale definition for a scale with known name and key */
export declare function getNamedScale<Name extends keyof NamedScales, Key extends (keyof NamedScales[Name]) & number>(group: Name, key: Key): {
    key: Key;
} & (NamedScales[Name][Key]);
/** Returns a scale definition for a scale that is not known */
export declare function getUnknownScale(key: number): Scale;
export {};
//# sourceMappingURL=Scales.d.ts.map