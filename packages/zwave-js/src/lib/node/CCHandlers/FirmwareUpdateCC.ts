import {
	FirmwareDownloadStatus,
	FirmwareUpdateMetaDataCC,
	type FirmwareUpdateMetaDataCCGet,
	type FirmwareUpdateMetaDataCCMetaDataGet,
	type FirmwareUpdateMetaDataCCPrepareGet,
	type FirmwareUpdateMetaDataCCRequestGet,
	FirmwareUpdateRequestStatus,
	type PersistValuesContext,
	getEffectiveCCVersion,
} from "@zwave-js/cc";
import {
	CommandClasses,
	EncapsulationFlags,
	type LogNode,
} from "@zwave-js/core";
import { randomBytes } from "node:crypto";
import { type Driver } from "../../driver/Driver.js";
import { type ZWaveOptions } from "../../driver/ZWaveOptions.js";
import { type ZWaveNode } from "../Node.js";

export async function handleUnexpectedFirmwareUpdateGet(
	driver: Driver,
	node: ZWaveNode,
	command: FirmwareUpdateMetaDataCCGet,
): Promise<void> {
	// This method will only be called under two circumstances:
	// 1. The node is currently busy responding to a firmware update request -> remember the request
	if (node.isFirmwareUpdateInProgress()) {
		this._firmwareUpdatePrematureRequest = command;
		return;
	}

	// 2. No firmware update is in progress -> abort
	driver.controllerLog.logNode(node.id, {
		message:
			`Received Firmware Update Get, but no firmware update is in progress. Forcing the node to abort...`,
		direction: "inbound",
	});

	// Since no update is in progress, we need to determine the fragment size again
	const fcc = new FirmwareUpdateMetaDataCC({ nodeId: node.id });
	fcc.toggleEncapsulationFlag(
		EncapsulationFlags.Security,
		!!(command.encapsulationFlags & EncapsulationFlags.Security),
	);
	const ccVersion = getEffectiveCCVersion(driver, fcc);
	const fragmentSize = driver.computeNetCCPayloadSize(fcc)
		- 2 // report number
		- (ccVersion >= 2 ? 2 : 0); // checksum
	const fragment = randomBytes(fragmentSize);
	try {
		await node.sendCorruptedFirmwareUpdateReport(
			command.reportNumber,
			fragment,
		);
	} catch {
		// ignore
	}
}

export async function handleFirmwareUpdateMetaDataGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: FirmwareUpdateMetaDataCCMetaDataGet,
	vendorInfo: ZWaveOptions["vendor"],
): Promise<void> {
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	// We are being queried, so the device may actually not support the CC, just control it.
	// Using the commandClasses property would throw in that case
	const api = endpoint
		.createAPI(CommandClasses["Firmware Update Meta Data"], false)
		.withOptions({
			// Answer with the same encapsulation as asked, but omit
			// Supervision as it shouldn't be used for Get-Report flows
			encapsulationFlags: command.encapsulationFlags
				& ~EncapsulationFlags.Supervision,
		});

	// We do not support the firmware to be upgraded.
	await api.reportMetaData({
		manufacturerId: vendorInfo?.manufacturerId ?? 0xffff,
		firmwareUpgradable: false,
		hardwareVersion: vendorInfo?.hardwareVersion ?? 0,
		// We must advertise Z-Wave JS itself as firmware 1
		// No firmware is upgradable, so we advertise firmware id 0
		additionalFirmwareIDs: [0],
	});
}

export async function handleFirmwareUpdateRequestGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: FirmwareUpdateMetaDataCCRequestGet,
): Promise<void> {
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	// We are being queried, so the device may actually not support the CC, just control it.
	// Using the commandClasses property would throw in that case
	const api = endpoint
		.createAPI(CommandClasses["Firmware Update Meta Data"], false)
		.withOptions({
			// Answer with the same encapsulation as asked, but omit
			// Supervision as it shouldn't be used for Get-Report flows
			encapsulationFlags: command.encapsulationFlags
				& ~EncapsulationFlags.Supervision,
		});

	// We do not support the firmware to be upgraded.
	await api.respondToUpdateRequest({
		status: FirmwareUpdateRequestStatus.Error_NotUpgradable,
	});
}

export async function handleFirmwareUpdatePrepareGet(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: FirmwareUpdateMetaDataCCPrepareGet,
): Promise<void> {
	const endpoint = node.getEndpoint(command.endpointIndex) ?? node;

	// We are being queried, so the device may actually not support the CC, just control it.
	// Using the commandClasses property would throw in that case
	const api = endpoint
		.createAPI(CommandClasses["Firmware Update Meta Data"], false)
		.withOptions({
			// Answer with the same encapsulation as asked, but omit
			// Supervision as it shouldn't be used for Get-Report flows
			encapsulationFlags: command.encapsulationFlags
				& ~EncapsulationFlags.Supervision,
		});

	// We do not support the firmware to be downloaded
	await api.respondToDownloadRequest({
		status: FirmwareDownloadStatus.Error_NotDownloadable,
		checksum: 0x0000,
	});
}
