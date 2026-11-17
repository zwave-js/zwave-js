import type { OTWFirmwareUpdateTarget } from "@zwave-js/serial/serialapi";

export interface OTWFirmwareUpdateProgress {
	/** Which file of the update is being transmitted, starting at 1 */
	currentFile: number;
	/** How many files the update consists of */
	totalFiles: number;
	/** How many fragments of the current file have been transmitted. */
	sentFragments: number;
	/** How many fragments the current file consists of. */
	totalFragments: number;
	/** The total progress of the firmware update over all files in %, rounded to two digits. */
	progress: number;
}

export enum OTWFirmwareUpdateStatus {
	// An expected response was not received from the controller in time
	Error_Timeout = 0,
	/** The maximum number of retry attempts for a firmware fragments were reached */
	Error_RetryLimitReached,
	/** The update was aborted by the bootloader */
	Error_Aborted,
	/** This controller does not support firmware updates */
	Error_NotSupported,

	OK = 0xff,
}

export interface OTWFirmwareUpdateResult {
	success: boolean;
	status: OTWFirmwareUpdateStatus;
	/**
	 * The error code reported by the bootloader or by the Z-Wave module, if available when the update fails.
	 * For updates through the Firmware Update Serial API command, this is a `FirmwareUpdateCommandStatus`.
	 */
	errorCode?: number;
}

export interface OTWFirmwareUpdateOptions {
	/**
	 * Which part of the Z-Wave module's software the file updates. Default: `OTWFirmwareUpdateTarget.Firmware`.
	 * The module can't tell from the encrypted file, so it must be specified.
	 * Only used when the module supports the Firmware Update Serial API command (0x3E).
	 * Updates from the firmware update service define the target of each file, so this option does not apply to them.
	 */
	target?: OTWFirmwareUpdateTarget;
}
