import type { BytesView } from "@zwave-js/shared";

export type FirmwareFileFormat =
	| "aeotec"
	| "otz"
	| "ota"
	| "hex"
	| "hec"
	| "gecko"
	| "bin";

export interface Firmware {
	data: BytesView;
	firmwareTarget?: number;
	firmwareId?: number;
}
