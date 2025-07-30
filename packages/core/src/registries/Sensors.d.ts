import { type Scale, type ScaleGroup } from "./Scales.js";
export interface SensorDefinition {
    readonly label: string;
    readonly scaleGroupName?: string;
    readonly scales: ScaleGroup;
}
export interface Sensor extends SensorDefinition {
    readonly key: number;
}
declare const sensors: Readonly<{
    readonly 1: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Air temperature";
    };
    readonly 2: {
        readonly label: "General purpose";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
            readonly 1: {
                readonly label: "Dimensionless value";
            };
        };
    };
    readonly 3: {
        readonly label: "Illuminance";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
            readonly 1: {
                readonly label: "Lux";
                readonly unit: "Lux";
            };
        };
    };
    readonly 4: {
        readonly label: "Power";
        readonly scales: {
            readonly 0: {
                readonly label: "Watt";
                readonly unit: "W";
            };
            readonly 1: {
                readonly label: "Btu/h";
                readonly unit: "Btu/h";
            };
        };
    };
    readonly 5: {
        readonly scaleGroupName: "humidity";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
            readonly 1: {
                readonly label: "Absolute humidity";
                readonly unit: "g/m³";
            };
        };
        readonly label: "Humidity";
    };
    readonly 6: {
        readonly label: "Velocity";
        readonly scales: {
            readonly 0: {
                readonly label: "m/s";
                readonly unit: "m/s";
            };
            readonly 1: {
                readonly label: "Mph";
                readonly unit: "Mph";
            };
        };
    };
    readonly 7: {
        readonly scaleGroupName: "direction";
        readonly scales: {
            readonly 0: {
                readonly label: "Degrees";
                readonly unit: "°";
                readonly description: "0° = no motion detected, 90° = east, 180° = south, 270° = west, 360° = north";
            };
        };
        readonly label: "Direction";
    };
    readonly 8: {
        readonly scaleGroupName: "airPressure";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilopascal";
                readonly unit: "kPa";
            };
            readonly 1: {
                readonly label: "Inches of Mercury";
                readonly unit: "inHg";
            };
        };
        readonly label: "Atmospheric pressure";
    };
    readonly 9: {
        readonly scaleGroupName: "airPressure";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilopascal";
                readonly unit: "kPa";
            };
            readonly 1: {
                readonly label: "Inches of Mercury";
                readonly unit: "inHg";
            };
        };
        readonly label: "Barometric pressure";
    };
    readonly 10: {
        readonly label: "Solar radiation";
        readonly scales: {
            readonly 0: {
                readonly label: "Watt per square meter";
                readonly unit: "W/m²";
            };
        };
    };
    readonly 11: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Dew point";
    };
    readonly 12: {
        readonly label: "Rain rate";
        readonly scales: {
            readonly 0: {
                readonly label: "Millimeter/hour";
                readonly unit: "mm/h";
            };
            readonly 1: {
                readonly label: "Inches per hour";
                readonly unit: "in/h";
            };
        };
    };
    readonly 13: {
        readonly label: "Tide level";
        readonly scales: {
            readonly 0: {
                readonly label: "Meter";
                readonly unit: "m";
            };
            readonly 1: {
                readonly label: "Feet";
                readonly unit: "ft";
            };
        };
    };
    readonly 14: {
        readonly label: "Weight";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilogram";
                readonly unit: "kg";
            };
            readonly 1: {
                readonly label: "Pounds";
                readonly unit: "lb";
            };
        };
    };
    readonly 15: {
        readonly label: "Voltage";
        readonly scales: {
            readonly 0: {
                readonly label: "Volt";
                readonly unit: "V";
            };
            readonly 1: {
                readonly label: "Millivolt";
                readonly unit: "mV";
            };
        };
    };
    readonly 16: {
        readonly label: "Current";
        readonly scales: {
            readonly 0: {
                readonly label: "Ampere";
                readonly unit: "A";
            };
            readonly 1: {
                readonly label: "Milliampere";
                readonly unit: "mA";
            };
        };
    };
    readonly 17: {
        readonly label: "Carbon dioxide (CO₂) level";
        readonly scales: {
            readonly 0: {
                readonly label: "Parts/million";
                readonly unit: "ppm";
            };
        };
    };
    readonly 18: {
        readonly label: "Air flow";
        readonly scales: {
            readonly 0: {
                readonly label: "Cubic meter per hour";
                readonly unit: "m³/h";
            };
            readonly 1: {
                readonly label: "Cubic feet per minute";
                readonly unit: "cfm";
            };
        };
    };
    readonly 19: {
        readonly label: "Tank capacity";
        readonly scales: {
            readonly 0: {
                readonly label: "Liter";
                readonly unit: "l";
            };
            readonly 1: {
                readonly label: "Cubic meter";
                readonly unit: "m³";
            };
            readonly 2: {
                readonly label: "Gallons";
                readonly unit: "gallon";
            };
        };
    };
    readonly 20: {
        readonly label: "Distance";
        readonly scales: {
            readonly 0: {
                readonly label: "Meter";
                readonly unit: "m";
            };
            readonly 1: {
                readonly label: "Centimeter";
                readonly unit: "cm";
            };
            readonly 2: {
                readonly label: "Feet";
                readonly unit: "ft";
            };
        };
    };
    readonly 21: {
        readonly label: "Angle position";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
            readonly 1: {
                readonly label: "Degrees relative to north pole of standing eye view";
                readonly unit: "°N";
            };
            readonly 2: {
                readonly label: "Degrees relative to south pole of standing eye view";
                readonly unit: "°S";
            };
        };
    };
    readonly 22: {
        readonly label: "Rotation";
        readonly scales: {
            readonly 0: {
                readonly label: "Revolutions per minute";
                readonly unit: "rpm";
            };
            readonly 1: {
                readonly label: "Hertz";
                readonly unit: "Hz";
            };
        };
    };
    readonly 23: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Water temperature";
    };
    readonly 24: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Soil temperature";
    };
    readonly 25: {
        readonly label: "Seismic Intensity";
        readonly scales: {
            readonly 0: {
                readonly label: "Mercalli";
            };
            readonly 1: {
                readonly label: "European Macroseismic";
            };
            readonly 2: {
                readonly label: "Liedu";
            };
            readonly 3: {
                readonly label: "Shindo";
            };
        };
    };
    readonly 26: {
        readonly label: "Seismic magnitude";
        readonly scales: {
            readonly 0: {
                readonly label: "Local";
            };
            readonly 1: {
                readonly label: "Moment";
            };
            readonly 2: {
                readonly label: "Surface wave";
            };
            readonly 3: {
                readonly label: "Body wave";
            };
        };
    };
    readonly 27: {
        readonly label: "Ultraviolet";
        readonly scales: {
            readonly 0: {
                readonly label: "UV index";
            };
        };
    };
    readonly 28: {
        readonly label: "Electrical resistivity";
        readonly scales: {
            readonly 0: {
                readonly label: "Ohm meter";
                readonly unit: "Ωm";
            };
        };
    };
    readonly 29: {
        readonly label: "Electrical conductivity";
        readonly scales: {
            readonly 0: {
                readonly label: "Siemens per meter";
                readonly unit: "S/m";
            };
        };
    };
    readonly 30: {
        readonly label: "Loudness";
        readonly scales: {
            readonly 0: {
                readonly label: "Decibel";
                readonly unit: "dB";
            };
            readonly 1: {
                readonly label: "A-weighted decibels";
                readonly unit: "dBA";
            };
        };
    };
    readonly 31: {
        readonly label: "Moisture";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
            readonly 1: {
                readonly label: "Volume water content";
                readonly unit: "m³/m³";
            };
            readonly 2: {
                readonly label: "Impedance";
                readonly unit: "kΩ";
            };
            readonly 3: {
                readonly label: "Water activity";
                readonly unit: "aw";
            };
        };
    };
    readonly 32: {
        readonly label: "Frequency";
        readonly scales: {
            readonly 0: {
                readonly label: "Hertz";
                readonly unit: "Hz";
                readonly description: "MUST be used until 2.147483647 GHz";
            };
            readonly 1: {
                readonly label: "Kilohertz";
                readonly unit: "kHz";
                readonly description: "MUST be used after 2.147483647 GHz";
            };
        };
    };
    readonly 33: {
        readonly label: "Time";
        readonly scales: {
            readonly 0: {
                readonly label: "Second";
                readonly unit: "s";
            };
        };
    };
    readonly 34: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Target temperature";
    };
    readonly 35: {
        readonly label: "Particulate Matter 2.5";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
            readonly 1: {
                readonly label: "Microgram per cubic meter";
                readonly unit: "µg/m³";
            };
        };
    };
    readonly 36: {
        readonly label: "Formaldehyde (CH₂O) level";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
        };
    };
    readonly 37: {
        readonly label: "Radon concentration";
        readonly scales: {
            readonly 0: {
                readonly label: "Becquerel per cubic meter";
                readonly unit: "bq/m³";
            };
            readonly 1: {
                readonly label: "Picocuries per liter";
                readonly unit: "pCi/l";
            };
        };
    };
    readonly 38: {
        readonly label: "Methane (CH₄) density";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
        };
    };
    readonly 39: {
        readonly label: "Volatile Organic Compound level";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
            readonly 1: {
                readonly label: "Parts/million";
                readonly unit: "ppm";
            };
        };
    };
    readonly 40: {
        readonly label: "Carbon monoxide (CO) level";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
            readonly 1: {
                readonly label: "Parts/million";
                readonly unit: "ppm";
            };
        };
    };
    readonly 41: {
        readonly scaleGroupName: "percentage";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
        };
        readonly label: "Soil humidity";
    };
    readonly 42: {
        readonly scaleGroupName: "acidity";
        readonly scales: {
            readonly 0: {
                readonly label: "Acidity";
                readonly unit: "pH";
            };
        };
        readonly label: "Soil reactivity";
    };
    readonly 43: {
        readonly label: "Soil salinity";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
        };
    };
    readonly 44: {
        readonly label: "Heart rate";
        readonly scales: {
            readonly 0: {
                readonly label: "Beats per minute";
                readonly unit: "bpm";
            };
        };
    };
    readonly 45: {
        readonly label: "Blood pressure";
        readonly scales: {
            readonly 0: {
                readonly label: "Systolic";
                readonly unit: "mmHg";
            };
            readonly 1: {
                readonly label: "Diastolic";
                readonly unit: "mmHg";
            };
        };
    };
    readonly 46: {
        readonly scaleGroupName: "mass";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilogram";
                readonly unit: "kg";
            };
        };
        readonly label: "Muscle mass";
    };
    readonly 47: {
        readonly scaleGroupName: "mass";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilogram";
                readonly unit: "kg";
            };
        };
        readonly label: "Fat mass";
    };
    readonly 48: {
        readonly scaleGroupName: "mass";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilogram";
                readonly unit: "kg";
            };
        };
        readonly label: "Bone mass";
    };
    readonly 49: {
        readonly scaleGroupName: "mass";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilogram";
                readonly unit: "kg";
            };
        };
        readonly label: "Total body water (TBW)";
    };
    readonly 50: {
        readonly label: "Basis metabolic rate (BMR)";
        readonly scales: {
            readonly 0: {
                readonly label: "Joule";
                readonly unit: "J";
            };
        };
    };
    readonly 51: {
        readonly label: "Body Mass Index (BMI)";
        readonly scales: {
            readonly 0: {
                readonly label: "Body Mass Index";
            };
        };
    };
    readonly 52: {
        readonly scaleGroupName: "acceleration";
        readonly scales: {
            readonly 0: {
                readonly label: "Meter per square second";
                readonly unit: "m/s²";
            };
        };
        readonly label: "Acceleration X-axis";
    };
    readonly 53: {
        readonly scaleGroupName: "acceleration";
        readonly scales: {
            readonly 0: {
                readonly label: "Meter per square second";
                readonly unit: "m/s²";
            };
        };
        readonly label: "Acceleration Y-axis";
    };
    readonly 54: {
        readonly scaleGroupName: "acceleration";
        readonly scales: {
            readonly 0: {
                readonly label: "Meter per square second";
                readonly unit: "m/s²";
            };
        };
        readonly label: "Acceleration Z-axis";
    };
    readonly 55: {
        readonly scaleGroupName: "percentage";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
        };
        readonly label: "Smoke density";
    };
    readonly 56: {
        readonly label: "Water flow";
        readonly scales: {
            readonly 0: {
                readonly label: "Liter per hour";
                readonly unit: "l/h";
            };
        };
    };
    readonly 57: {
        readonly label: "Water pressure";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilopascal";
                readonly unit: "kPa";
            };
        };
    };
    readonly 58: {
        readonly label: "RF signal strength";
        readonly scales: {
            readonly 0: {
                readonly label: "RSSI";
                readonly unit: "%";
            };
            readonly 1: {
                readonly label: "Power Level";
                readonly unit: "dBm";
            };
        };
    };
    readonly 59: {
        readonly label: "Particulate Matter 10";
        readonly scales: {
            readonly 0: {
                readonly label: "Mole per cubic meter";
                readonly unit: "mol/m³";
            };
            readonly 1: {
                readonly label: "Microgram per cubic meter";
                readonly unit: "µg/m³";
            };
        };
    };
    readonly 60: {
        readonly label: "Respiratory rate";
        readonly scales: {
            readonly 0: {
                readonly label: "Breaths per minute";
                readonly unit: "bpm";
            };
        };
    };
    readonly 61: {
        readonly scaleGroupName: "percentage";
        readonly scales: {
            readonly 0: {
                readonly label: "Percentage value";
                readonly unit: "%";
            };
        };
        readonly label: "Relative Modulation level";
    };
    readonly 62: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Boiler water temperature";
    };
    readonly 63: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Domestic Hot Water (DHW) temperature";
    };
    readonly 64: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Outside temperature";
    };
    readonly 65: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Exhaust temperature";
    };
    readonly 66: {
        readonly label: "Water Chlorine level";
        readonly scales: {
            readonly 0: {
                readonly label: "Milligram per liter";
                readonly unit: "mg/l";
            };
        };
    };
    readonly 67: {
        readonly scaleGroupName: "acidity";
        readonly scales: {
            readonly 0: {
                readonly label: "Acidity";
                readonly unit: "pH";
            };
        };
        readonly label: "Water acidity";
    };
    readonly 68: {
        readonly label: "Water Oxidation reduction potential";
        readonly scales: {
            readonly 0: {
                readonly label: "Millivolt";
                readonly unit: "mV";
            };
        };
    };
    readonly 69: {
        readonly scaleGroupName: "unitless";
        readonly scales: {
            readonly 0: {
                readonly label: "Unitless";
            };
        };
        readonly label: "Heart Rate LF/HF ratio";
    };
    readonly 70: {
        readonly scaleGroupName: "direction";
        readonly scales: {
            readonly 0: {
                readonly label: "Degrees";
                readonly unit: "°";
                readonly description: "0° = no motion detected, 90° = east, 180° = south, 270° = west, 360° = north";
            };
        };
        readonly label: "Motion Direction";
    };
    readonly 71: {
        readonly label: "Applied force on the sensor";
        readonly scales: {
            readonly 0: {
                readonly label: "Newton";
                readonly unit: "N";
            };
        };
    };
    readonly 72: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Return Air temperature";
    };
    readonly 73: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Supply Air temperature";
    };
    readonly 74: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Condenser Coil temperature";
    };
    readonly 75: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Evaporator Coil temperature";
    };
    readonly 76: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Liquid Line temperature";
    };
    readonly 77: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Discharge Line temperature";
    };
    readonly 78: {
        readonly scaleGroupName: "pressure";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilopascal";
                readonly unit: "kPa";
            };
            readonly 1: {
                readonly label: "Pound per square inch";
                readonly unit: "psi";
            };
        };
        readonly label: "Suction Pressure";
    };
    readonly 79: {
        readonly scaleGroupName: "pressure";
        readonly scales: {
            readonly 0: {
                readonly label: "Kilopascal";
                readonly unit: "kPa";
            };
            readonly 1: {
                readonly label: "Pound per square inch";
                readonly unit: "psi";
            };
        };
        readonly label: "Discharge Pressure";
    };
    readonly 80: {
        readonly scaleGroupName: "temperature";
        readonly scales: {
            readonly 0: {
                readonly label: "Celsius";
                readonly unit: "°C";
            };
            readonly 1: {
                readonly label: "Fahrenheit";
                readonly unit: "°F";
            };
        };
        readonly label: "Defrost temperature";
    };
    readonly 81: {
        readonly scaleGroupName: "density";
        readonly scales: {
            readonly 0: {
                readonly label: "Density";
                readonly unit: "µg/m³";
            };
        };
        readonly label: "Ozone";
    };
    readonly 82: {
        readonly scaleGroupName: "density";
        readonly scales: {
            readonly 0: {
                readonly label: "Density";
                readonly unit: "µg/m³";
            };
        };
        readonly label: "Sulfur dioxide";
    };
    readonly 83: {
        readonly scaleGroupName: "density";
        readonly scales: {
            readonly 0: {
                readonly label: "Density";
                readonly unit: "µg/m³";
            };
        };
        readonly label: "Nitrogen dioxide";
    };
    readonly 84: {
        readonly scaleGroupName: "density";
        readonly scales: {
            readonly 0: {
                readonly label: "Density";
                readonly unit: "µg/m³";
            };
        };
        readonly label: "Ammonia";
    };
    readonly 85: {
        readonly scaleGroupName: "density";
        readonly scales: {
            readonly 0: {
                readonly label: "Density";
                readonly unit: "µg/m³";
            };
        };
        readonly label: "Lead";
    };
    readonly 86: {
        readonly scaleGroupName: "density";
        readonly scales: {
            readonly 0: {
                readonly label: "Density";
                readonly unit: "µg/m³";
            };
        };
        readonly label: "Particulate Matter 1";
    };
    readonly 87: {
        readonly scaleGroupName: "unitless";
        readonly scales: {
            readonly 0: {
                readonly label: "Unitless";
            };
        };
        readonly label: "Person counter (entering)";
    };
    readonly 88: {
        readonly scaleGroupName: "unitless";
        readonly scales: {
            readonly 0: {
                readonly label: "Unitless";
            };
        };
        readonly label: "Person counter (exiting)";
    };
}>;
export type Sensors = typeof sensors;
/** Returns the sensor definition for the given sensor type */
export declare function getSensor<Key extends number>(type: Key): Key extends keyof Sensors ? Sensors[Key] : (Sensor | undefined);
export declare function getSensorName(sensorType: number): string;
/** Returns all sensor definitions including their scales */
export declare function getAllSensors(): readonly Sensor[];
/** Returns a scale definition for a scale with known name and key */
export declare function getSensorScale<SensorType extends number, ScaleKey extends number>(type: SensorType, scale: ScaleKey): SensorType extends keyof Sensors ? ScaleKey extends keyof Sensors[SensorType]["scales"] ? ({
    key: ScaleKey;
} & (Sensors[SensorType]["scales"][ScaleKey])) : (Scale | undefined) : (Scale | undefined);
/** Returns all scales of a given sensor */
export declare function getAllSensorScales(sensorType: number): readonly Scale[] | undefined;
export {};
//# sourceMappingURL=Sensors.d.ts.map