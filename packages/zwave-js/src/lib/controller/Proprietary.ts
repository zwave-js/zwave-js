import type { SetValueResult } from "@zwave-js/cc";
import type { RFRegion, TranslatedValueID, ValueID } from "@zwave-js/core";
import type { Message } from "@zwave-js/serial";
import type { Driver } from "../driver/Driver.js";
import type { ZWaveController } from "./Controller.js";
import { ControllerProprietary_Aeotec } from "./proprietary/Aeotec.js";
import { ControllerProprietary_NabuCasa } from "./proprietary/NabuCasa.js";
import {
	ControllerProprietary_ZWaveMe,
	ControllerProprietary_ZWaveMe700,
} from "./proprietary/ZWaveMe.js";

export interface ControllerProprietary {
	"Nabu Casa"?: ControllerProprietary_NabuCasa;
	Aeotec?: ControllerProprietary_Aeotec;
	// Generic Z-Wave.me controllers (UZB / Razberry 5)
	"Z-Wave.me"?: ControllerProprietary_ZWaveMe;
	// 700-series Z-Wave.me controllers (RaZberry 7 family, Z-Station). Inherits the generic functionality.
	"Z-Wave.me 700"?: ControllerProprietary_ZWaveMe700;
}

// Known Z-Wave.me controllers, identified exactly by their config file entries
// as [manufacturerId, productType, productId].
const ZWAVEME_GENERIC_DEVICES: readonly (readonly [number, number, number])[] =
	[
		[0x0115, 0x0400, 0x0001], // UZB
		[0x0115, 0x0000, 0x0000], // ZME_UZB1
		[0x0115, 0x0001, 0x0001], // Razberry 500
		[0x0147, 0x0002, 0x0003], // RaZberry (daughtercard)
		[0x0147, 0x0400, 0x0001], // RaZberry Controller 2016 Z-Wave+
		[0x0147, 0x0400, 0x0002], // RaZberry Controller 2016 Z-Wave+
	];
// The 700 series supports a superset of the commands
const ZWAVEME_700_DEVICES: readonly (readonly [number, number, number])[] = [
	[0x0147, 0x0401, 0x0001], // RaZberry 7
	[0x0147, 0x0401, 0x0101], // RaZberry 7 Pro
	[0x0147, 0x0401, 0x0301], // Z-Station
];

function isControllerModel(
	controller: ZWaveController,
	models: readonly (readonly [number, number, number])[],
): boolean {
	return models.some(
		([manufacturerId, productType, productId]) =>
			controller.manufacturerId === manufacturerId
			&& controller.productType === productType
			&& controller.productId === productId,
	);
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

	// Aeotec Z-Stick Gen5(+)
	if (
		controller.manufacturerId === 0x0086
		&& controller.productId === 0x005a
		// The product type differs per region (EU/US/ANZ)
		&& (controller.productType === 0x0001
			|| controller.productType === 0x0101
			|| controller.productType === 0x0201)
	) {
		return {
			Aeotec: new ControllerProprietary_Aeotec(driver, controller),
		};
	}

	// Z-Wave.me 700 series
	if (isControllerModel(controller, ZWAVEME_700_DEVICES)) {
		return {
			"Z-Wave.me 700": new ControllerProprietary_ZWaveMe700(
				driver,
				controller,
			),
		};
	}

	// Older Z-Wave.me controllers (UZB / Razberry 5)
	if (isControllerModel(controller, ZWAVEME_GENERIC_DEVICES)) {
		return {
			"Z-Wave.me": new ControllerProprietary_ZWaveMe(driver, controller),
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
	/** Reads the RF region, if this controller configures it through proprietary commands */
	getRFRegion?(): Promise<RFRegion>;
	/** Configures the RF region, if this controller configures it through proprietary commands */
	setRFRegion?(region: RFRegion): Promise<void>;
}
