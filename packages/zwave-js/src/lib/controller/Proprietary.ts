import type { SetValueResult } from "@zwave-js/cc";
import type { TranslatedValueID, ValueID } from "@zwave-js/core";
import type { Message } from "@zwave-js/serial";
import type { Driver } from "../driver/Driver.js";
import type { ZWaveController } from "./Controller.js";
import { ControllerProprietary_NabuCasa } from "./proprietary/NabuCasa.js";
import { ControllerProprietary_ZWaveMeUZB1 } from "./proprietary/ZWaveMeUZB1.js";

export interface ControllerProprietary {
	"Nabu Casa"?: ControllerProprietary_NabuCasa;
	"Z-Wave.me UZB1"?: ControllerProprietary_ZWaveMeUZB1;
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
			"Nabu Casa": new ControllerProprietary_NabuCasa(driver, controller),
		};
	}

	// Z-Wave.me UZB1
	if (
		controller.manufacturerId === 0x0115
		&& controller.productType === 0x0000
		&& controller.productId === 0x0000
	) {
		return {
			"Z-Wave.me UZB1": new ControllerProprietary_ZWaveMeUZB1(
				driver,
				controller,
			),
		};
	}

	return {};
}

export interface ControllerProprietaryCommon {
	interview(): Promise<void>;
	getDefinedValueIDs(): TranslatedValueID[];
	// getValueMetadata(valueId: ValueID): ValueMetadata;
	pollValue(valueId: ValueID): Promise<unknown>;
	setValue(valueId: ValueID, value: unknown): Promise<SetValueResult>;
	handleUnsolicited(msg: Message): Promise<boolean>;
}
