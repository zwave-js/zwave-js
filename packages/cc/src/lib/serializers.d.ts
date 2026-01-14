import { Bytes } from "@zwave-js/shared";
import type { SetbackSpecialState, SetbackState, Switchpoint, Timezone } from "./_Types.js";
export declare const setbackSpecialStateValues: Record<SetbackSpecialState, number>;
/**
 * @publicAPI
 * Encodes a setback state to use in a ThermostatSetbackCC
 */
export declare function encodeSetbackState(state: SetbackState): Bytes;
/**
 * @publicAPI
 * Decodes a setback state used in a ThermostatSetbackCC
 */
export declare function decodeSetbackState(data: Uint8Array, offset?: number): SetbackState | undefined;
/**
 * @publicAPI
 * Decodes a switch point used in a ClimateControlScheduleCC
 */
export declare function decodeSwitchpoint(data: Uint8Array): Switchpoint;
/**
 * @publicAPI
 * Encodes a switch point to use in a ClimateControlScheduleCC
 */
export declare function encodeSwitchpoint(point: Switchpoint): Bytes;
/**
 * @publicAPI
 * Decodes timezone information used in time related CCs
 */
export declare function parseTimezone(data: Uint8Array): Timezone;
/**
 * @publicAPI
 * Decodes timezone information used in time related CCs
 */
export declare function encodeTimezone(tz: Timezone): Bytes;
//# sourceMappingURL=serializers.d.ts.map