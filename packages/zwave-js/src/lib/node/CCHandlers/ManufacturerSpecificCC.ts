import {
	type ManufacturerSpecificCCGet,
	type PersistValuesContext,
} from "@zwave-js/cc";
import {
	CommandClasses,
	EncapsulationFlags,
	type LogNode,
} from "@zwave-js/core";
import { type ZWaveOptions } from "../../driver/ZWaveOptions.js";
import { type ZWaveNode } from "../Node.js";

export async function handleManufacturerSpecificGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: ManufacturerSpecificCCGet,
	vendorInfo: ZWaveOptions["vendor"],
): Promise<void> {
	// We are being queried, so the device may actually not support the CC, just control it.
	// Using the commandClasses property would throw in that case
	const api = node
		.createAPI(CommandClasses["Manufacturer Specific"], false)
		.withOptions({
			// Answer with the same encapsulation as asked, but omit
			// Supervision as it shouldn't be used for Get-Report flows
			encapsulationFlags: command.encapsulationFlags
				& ~EncapsulationFlags.Supervision,
		});

	await api.sendReport({
		// Reserved manufacturer ID, definitely invalid!
		manufacturerId: vendorInfo?.manufacturerId ?? 0xffff,
		productType: vendorInfo?.productType ?? 0xffff,
		productId: vendorInfo?.productId ?? 0xffff,
	});
}
