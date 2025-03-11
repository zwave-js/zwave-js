import {
	type RateType,
	SwitchType,
	type ValveId,
	WindowCoveringParameter,
} from "./_Types.js";

/**
 * Translates a switch type into two actions that may be performed. Unknown types default to Down/Up
 */

export function multilevelSwitchTypeToActions(
	switchType: string,
): [down: string, up: string] {
	if (!switchType.includes("/")) switchType = SwitchType[0x02]; // Down/Up
	return switchType.split("/", 2) as any;
}
/**
 * The property names are organized so that positive motions are at odd indices and negative motions at even indices
 */

export const multilevelSwitchTypeProperties = Object.keys(SwitchType)
	.filter((key) => key.includes("/"))
	.map((key) => multilevelSwitchTypeToActions(key))
	.reduce<string[]>((acc, cur) => acc.concat(...cur), []);

export function windowCoveringParameterToMetadataStates(
	parameter: WindowCoveringParameter,
): Record<number, string> {
	switch (parameter) {
		case WindowCoveringParameter["Vertical Slats Angle (no position)"]:
		case WindowCoveringParameter["Vertical Slats Angle"]:
			return {
				0: "Closed (right inside)",
				50: "Open",
				99: "Closed (left inside)",
			};

		case WindowCoveringParameter["Horizontal Slats Angle (no position)"]:
		case WindowCoveringParameter["Horizontal Slats Angle"]:
			return {
				0: "Closed (up inside)",
				50: "Open",
				99: "Closed (down inside)",
			};
	}

	return {
		0: "Closed",
		99: "Open",
	};
}

export function windowCoveringParameterToLevelChangeLabel(
	parameter: WindowCoveringParameter,
	direction: "up" | "down",
): string {
	switch (parameter) {
		// For angle control, both directions are closed, so we specify it explicitly
		case WindowCoveringParameter["Vertical Slats Angle (no position)"]:
		case WindowCoveringParameter["Vertical Slats Angle"]:
			return `Change tilt (${
				direction === "up" ? "left inside" : "right inside"
			})`;

		case WindowCoveringParameter["Horizontal Slats Angle (no position)"]:
		case WindowCoveringParameter["Horizontal Slats Angle"]:
			// Horizontal slats refer to the position of the inner side of the slats
			// where a high level (99) actually means they face down
			return `Change tilt (${
				direction === "up" ? "down inside" : "up inside"
			})`;
	}
	// For all other parameters, refer to the amount of light that is let in
	return direction === "up" ? "Open" : "Close";
}

export function meterTypesToPropertyKey(
	meterType: number,
	rateType: RateType,
	scale: number,
): number {
	return (meterType << 16) | (scale << 8) | rateType;
}

export function irrigationValveIdToMetadataPrefix(valveId: ValveId): string {
	if (valveId === "master") return "Master valve";
	return `Valve ${valveId.toString().padStart(3, "0")}`;
}
