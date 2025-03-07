import { type Driver } from "../driver/Driver.js";
import { type ZWaveController } from "./Controller.js";
import { ControllerProprietary_NabuCasa } from "./proprietary/NabuCasa.js";

export interface ControllerProprietary {
	"Nabu Casa"?: ControllerProprietary_NabuCasa;
}

export function getControllerProprietary(
	driver: Driver,
	controller: ZWaveController,
): ControllerProprietary {
	// TODO: Make this configurable with config files or so.  For now, just hard code it.

	if (
		controller.manufacturerId === 0x0466
		&& controller.productType === 0x0001
		&& controller.productId === 0x0001
	) {
		return {
			"Nabu Casa": new ControllerProprietary_NabuCasa(driver),
		};
	}
	return {};
}
