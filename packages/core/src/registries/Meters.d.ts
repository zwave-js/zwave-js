export interface MeterScaleDefinition {
    readonly label: string;
    readonly unit?: string;
}
export interface MeterScale extends MeterScaleDefinition {
    readonly key: number;
}
export type MeterScaleGroup = Record<number, MeterScaleDefinition>;
export interface MeterDefinition {
    readonly name: string;
    readonly scales: MeterScaleGroup;
}
export interface Meter extends MeterDefinition {
    readonly key: number;
}
export declare const meters: Readonly<{
    readonly 1: {
        readonly name: "Electric";
        readonly scales: {
            readonly 0: {
                readonly label: "kWh";
                readonly unit: "kWh";
            };
            readonly 1: {
                readonly label: "kVAh";
                readonly unit: "kVAh";
            };
            readonly 2: {
                readonly label: "W";
                readonly unit: "W";
            };
            readonly 3: {
                readonly label: "Pulse count";
            };
            readonly 4: {
                readonly label: "V";
                readonly unit: "V";
            };
            readonly 5: {
                readonly label: "A";
                readonly unit: "A";
            };
            readonly 6: {
                readonly label: "Power Factor";
            };
            readonly 7: {
                readonly label: "kVar";
                readonly unit: "kVar";
            };
            readonly 8: {
                readonly label: "kVarh";
                readonly unit: "kVarh";
            };
        };
    };
    readonly 2: {
        readonly name: "Gas";
        readonly scales: {
            readonly 0: {
                readonly label: "Cubic meters";
                readonly unit: "m³";
            };
            readonly 1: {
                readonly label: "Cubic feet";
                readonly unit: "ft³";
            };
            readonly 3: {
                readonly label: "Pulse count";
            };
        };
    };
    readonly 3: {
        readonly name: "Water";
        readonly scales: {
            readonly 0: {
                readonly label: "Cubic meters";
                readonly unit: "m³";
            };
            readonly 1: {
                readonly label: "Cubic feet";
                readonly unit: "ft³";
            };
            readonly 2: {
                readonly label: "US gallons";
                readonly unit: "gal";
            };
            readonly 3: {
                readonly label: "Pulse count";
            };
        };
    };
    readonly 4: {
        readonly name: "Heating";
        readonly scales: {
            readonly 0: {
                readonly label: "kWh";
                readonly unit: "kWh";
            };
        };
    };
    readonly 5: {
        readonly name: "Cooling";
        readonly scales: {
            readonly 0: {
                readonly label: "kWh";
                readonly unit: "kWh";
            };
        };
    };
}>;
export type Meters = typeof meters;
/** Returns the meter definition for the given key */
export declare function getMeter<MeterType extends number>(type: MeterType): MeterType extends keyof Meters ? ({
    key: MeterType;
} & (Meters[MeterType])) : (Meter | undefined);
/** Returns all meter definitions including their scales */
export declare function getAllMeters(): readonly Meter[];
export declare function getMeterName(meterType: number): string;
/** Returns a meter scale definition for the given meter type and scale key */
export declare function getMeterScale<MeterType extends number, ScaleKey extends number>(type: MeterType, scale: ScaleKey): MeterType extends keyof Meters ? ScaleKey extends keyof Meters[MeterType]["scales"] ? ({
    key: ScaleKey;
} & (Meters[MeterType]["scales"][ScaleKey])) : (MeterScale | undefined) : (MeterScale | undefined);
/** Returns a meter scale definition for a scale that is not known */
export declare function getUnknownMeterScale(key: number): MeterScale;
/** Returns all scales of a given meter */
export declare function getAllMeterScales(meterType: number): readonly MeterScale[] | undefined;
//# sourceMappingURL=Meters.d.ts.map