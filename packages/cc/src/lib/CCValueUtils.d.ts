import { type RateType, type ValveId, WindowCoveringParameter } from "./_Types.js";
/**
 * Translates a switch type into two actions that may be performed. Unknown types default to Down/Up
 */
export declare function multilevelSwitchTypeToActions(switchType: string): [down: string, up: string];
/**
 * The property names are organized so that positive motions are at odd indices and negative motions at even indices
 */
export declare const multilevelSwitchTypeProperties: string[];
export declare function windowCoveringParameterToMetadataStates(parameter: WindowCoveringParameter): Record<number, string>;
export declare function windowCoveringParameterToLevelChangeLabel(parameter: WindowCoveringParameter, direction: "up" | "down"): string;
export declare function meterTypesToPropertyKey(meterType: number, rateType: RateType, scale: number): number;
export declare function irrigationValveIdToMetadataPrefix(valveId: ValveId): string;
//# sourceMappingURL=CCValueUtils.d.ts.map