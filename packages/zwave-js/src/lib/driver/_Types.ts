export interface OTWFirmwareUpdateProgress {
	/** How many fragments of the firmware update have been transmitted. Together with `totalFragments` this can be used to display progress. */
	sentFragments: number;
	/** How many fragments the firmware update consists of. */
	totalFragments: number;
	/** The total progress of the firmware update in %, rounded to two digits. */
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
}
