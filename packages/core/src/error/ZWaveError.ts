/**
 * Used to identify errors from this library without relying on the specific wording of the error message
 */
export enum ZWaveErrorCodes {
	PacketFormat_Truncated,
	PacketFormat_Invalid,
	PacketFormat_Checksum,
	// This differs from the above three. It means that the packet has a valid format and checksum,
	// but the data does not match the expectations. This error does not reset the Z-Wave stack
	PacketFormat_InvalidPayload,
	PacketFormat_DecryptionFailed,

	/** The driver failed to start */
	Driver_Failed = 100,
	Driver_Reset, // FIXME: This is not used
	Driver_Destroyed,
	Driver_NotReady,
	Driver_InvalidDataReceived,
	Driver_NotSupported,
	Driver_NoPriority,
	Driver_InvalidCache,
	Driver_InvalidOptions,
	/** The driver tried to do something that requires security */
	Driver_NoSecurity,
	Driver_FeatureDisabled,

	/** The task was removed from the task queue */
	Driver_TaskRemoved,

	/** The serial port closed unexpectedly */
	Driver_SerialPortClosed,

	/** There was a timeout while waiting for a message from the controller */
	Controller_Timeout = 200,
	/** There was a timeout while waiting for a response from a node */
	Controller_NodeTimeout,
	Controller_MessageDropped,
	Controller_ResponseNOK,
	Controller_CallbackNOK,
	Controller_Jammed,
	/** The controller was reset in the middle of a Serial API command */
	Controller_Reset,

	Controller_InclusionFailed,
	Controller_ExclusionFailed,

	/** Tried to do something the controller does not support */
	Controller_NotSupported,

	/** The interview for this node was restarted by the user */
	Controller_InterviewRestarted,

	/** The node with the given node ID was not found */
	Controller_NodeNotFound,
	/** The endpoint with the given index was not found on the node */
	Controller_EndpointNotFound,
	/** The node was removed from the network */
	Controller_NodeRemoved,
	/** Communication with the node will be insecure (no security configured) */
	Controller_NodeInsecureCommunication,

	/** The message has expired (the given timeout has elapsed) */
	Controller_MessageExpired,

	/** A Serial API command resulted in an error response */
	Controller_CommandError,

	/** Tried to send a message that is too large */
	Controller_MessageTooLarge,

	/** Tried to perform an action for a Long Range node that does not make sense for ZWLR */
	Controller_NotSupportedForLongRange,

	/** Could not fetch some information to determine firmware upgrades from a node */
	FWUpdateService_MissingInformation = 260,
	/** Any error related to HTTP requests during firmware update communication */
	FWUpdateService_RequestError,
	/** The integrity check of the downloaded firmware update failed */
	FWUpdateService_IntegrityCheckFailed,
	/** The firmware update is for a different device */
	FWUpdateService_DeviceMismatch,

	/** The given NVM version/format is unsupported */
	NVM_NotSupported = 280,
	/** Could not parse the JSON representation of an NVM due to invalid data */
	NVM_InvalidJSON,
	/** A required NVM3 object was not found while deserializing the NVM */
	NVM_ObjectNotFound,
	/** The parsed NVM or NVM content has an invalid format */
	NVM_InvalidFormat,
	/** Not enough space in the NVM */
	NVM_NoSpace,
	/** The NVM hasn't been opened yet */
	NVM_NotOpen,

	CC_Invalid = 300,
	CC_NoNodeID,
	CC_NotSupported,
	CC_NotImplemented,
	CC_NoAPI,
	/** Used to communicate that a given operation triggered by another node was not successful */
	CC_OperationFailed,

	Deserialization_NotImplemented = 320,
	Arithmetic,
	Argument_Invalid,

	Config_Invalid = 340,
	Config_NotFound,
	/** A compound config file has circular imports */
	Config_CircularImport,

	/** Failed to download the npm registry info for config updates */
	Config_Update_RegistryError,
	/** Could not detect which package manager to use for updates */
	Config_Update_PackageManagerNotFound,
	/** Installing the configuration update failed */
	Config_Update_InstallFailed,

	// Here follow message specific errors

	/** The removal process could not be started or completed due to one or several reasons */
	RemoveFailedNode_Failed = 360,
	/** The removal process was aborted because the node has responded */
	RemoveFailedNode_NodeOK,
	/** The replace process could not be started or completed due to one or several reasons */
	ReplaceFailedNode_Failed,
	/** The replace process was aborted because the node has responded */
	ReplaceFailedNode_NodeOK,

	/** The controller is currently busy with something that prevents an OTW update */
	OTW_Update_Busy = 380,

	/** The node is currently busy with another health check */
	HealthCheck_Busy = 400,
	/** The node is currently busy with another link reliability check */
	LinkReliabilityCheck_Busy,

	// Here follow CC specific errors

	/**
	 * Used to report the first existing parameter number
	 * available in a node's configuration
	 */
	ConfigurationCC_FirstParameterNumber = 1000,
	/**
	 * Used to report that a V3+ node should not have its parameters scanned with get/set commands
	 */
	ConfigurationCC_NoLegacyScanOnNewDevices,
	/**
	 * Used to report that a node using V3 or less MUST not use the resetToDefault flag
	 */
	ConfigurationCC_NoResetToDefaultOnLegacyDevices,

	/**
	 * Used to report that the command was not executed by the target node
	 */
	SupervisionCC_CommandFailed = 1100,

	/**
	 * Used to report that a ManufacturerProprietaryCC could not be instantiated
	 * because of a missing manufacturer ID.
	 */
	ManufacturerProprietaryCC_NoManufacturerId = 1200,

	/**
	 * Used to report that an invalid group ID was used to address a (Multi Channel) Association
	 */
	AssociationCC_InvalidGroup = 1300,
	/** Cannot add an association because it is not allowed */
	AssociationCC_NotAllowed,

	/** Used to report that no nonce exists */
	SecurityCC_NoNonce = 1400,
	/** Used to report that no SPAN is established between the nodes yet. */
	Security2CC_NoSPAN,
	/** Used to report that the inner state required for this action was not initialized */
	Security2CC_NotInitialized,
	/** Used to report that secure communication with a node is not possible because the node is not secure */
	Security2CC_NotSecure,
	/** Gets thrown when a Security S2 command is missing a required extension */
	Security2CC_MissingExtension,
	/** Gets thrown when a Security S2 encapsulated command cannot be decoded by the target node */
	Security2CC_CannotDecode,
	/** Gets thrown when parsing an invalid QR code */
	Security2CC_InvalidQRCode,
	/** Used to report that no MPAN has been received from the peer yet, or it is out of sync. */
	Security2CC_NoMPAN,
	/** Gets thrown when a Security S2 Multicast encapsulated command cannot be decoded by the target node */
	Security2CC_CannotDecodeMulticast,

	/** The firmware update process is already active on this node */
	FirmwareUpdateCC_Busy = 1500,
	/** The selected firmware target is not upgradable */
	FirmwareUpdateCC_NotUpgradable,
	/** The selected firmware target does not exist */
	FirmwareUpdateCC_TargetNotFound,
	/** The node reported that it could not start the update */
	FirmwareUpdateCC_FailedToStart,
	/** The node did not confirm the aborted update */
	FirmwareUpdateCC_FailedToAbort,
	/** The node did not confirm the completed update or the process stalled for too long */
	FirmwareUpdateCC_Timeout,

	/** An invalid firmware file was provided that cannot be handled by this library */
	Invalid_Firmware_File,
	/** An firmware file with an unsupported format was provided */
	Unsupported_Firmware_Format,

	/** A firmware update is already in progress on the network preventing this action from proceeding */
	FirmwareUpdateCC_NetworkBusy,

	/** Unsupported target node for a powerlevel test */
	PowerlevelCC_UnsupportedTestNode = 1600,
}

export function getErrorSuffix(code: ZWaveErrorCodes): string {
	return `ZW${code.toString().padStart(4, "0")}`;
}

function appendErrorSuffix(message: string, code: ZWaveErrorCodes): string {
	const suffix = ` (${getErrorSuffix(code)})`;
	if (!message.endsWith(suffix)) message += suffix;
	return message;
}

/**
 * Errors thrown in this library are of this type. The `code` property identifies what went wrong.
 */
export class ZWaveError extends Error {
	public constructor(
		public readonly message: string,
		public readonly code: ZWaveErrorCodes,
		/** Additional info required to handle this error (e.g. the Z-Wave message indicating the failure) */
		public readonly context?: unknown,
		/** If this error corresponds to a failed transaction, this contains the stack where it was created */
		public readonly transactionSource?: string,
	) {
		super();

		// Add the error code to the message to be able to identify it even when the stack trace is garbled somehow
		this.message = appendErrorSuffix(message, code);

		// We need to set the prototype explicitly
		Object.setPrototypeOf(this, ZWaveError.prototype);
		Object.getPrototypeOf(this).name = "ZWaveError";

		// If there's a better stack, use it
		if (typeof transactionSource === "string") {
			this.stack = `ZWaveError: ${this.message}\n${transactionSource}`;
		}
	}
}

export function isZWaveError(e: unknown): e is ZWaveError {
	return e instanceof Error && Object.getPrototypeOf(e).name === "ZWaveError";
}

export function isTransmissionError(e: unknown): e is ZWaveError & {
	code:
		| ZWaveErrorCodes.Controller_Timeout
		| ZWaveErrorCodes.Controller_MessageDropped
		| ZWaveErrorCodes.Controller_CallbackNOK
		| ZWaveErrorCodes.Controller_ResponseNOK
		| ZWaveErrorCodes.Controller_NodeTimeout
		| ZWaveErrorCodes.Security2CC_CannotDecode;
} {
	return (
		isZWaveError(e)
		&& (e.code === ZWaveErrorCodes.Controller_Timeout
			|| e.code === ZWaveErrorCodes.Controller_MessageDropped
			|| e.code === ZWaveErrorCodes.Controller_CallbackNOK
			|| e.code === ZWaveErrorCodes.Controller_ResponseNOK
			|| e.code === ZWaveErrorCodes.Controller_NodeTimeout
			|| e.code === ZWaveErrorCodes.Security2CC_CannotDecode)
	);
}

/**
 * Tests is the given error is a "recoverable" error - i.e. something that shouldn't happen unless
 * someone interacted with zwave-js in a weird way, but something we can deal with.
 *
 * This explicitly does not include transmission errors.
 */
export function isRecoverableZWaveError(e: unknown): e is ZWaveError & {
	code:
		| ZWaveErrorCodes.Controller_InterviewRestarted
		| ZWaveErrorCodes.Controller_NodeRemoved;
} {
	if (!isZWaveError(e)) return false;
	switch (e.code) {
		case ZWaveErrorCodes.Controller_InterviewRestarted:
		case ZWaveErrorCodes.Controller_NodeRemoved:
			return true;
	}
	return false;
}

export function isMissingControllerACK(
	e: unknown,
): e is ZWaveError & {
	code: ZWaveErrorCodes.Controller_Timeout;
	context: "ACK";
} {
	return isZWaveError(e)
		&& e.code === ZWaveErrorCodes.Controller_Timeout
		&& e.context === "ACK";
}

export function wasControllerReset(
	e: unknown,
): e is ZWaveError & {
	code: ZWaveErrorCodes.Controller_Reset;
} {
	return isZWaveError(e)
		&& e.code === ZWaveErrorCodes.Controller_Reset;
}

export function isMissingControllerResponse(
	e: unknown,
): e is ZWaveError & {
	code: ZWaveErrorCodes.Controller_Timeout;
	context: "response";
} {
	return isZWaveError(e)
		&& e.code === ZWaveErrorCodes.Controller_Timeout
		&& e.context === "response";
}

export function isMissingControllerCallback(
	e: unknown,
): e is ZWaveError & {
	code: ZWaveErrorCodes.Controller_Timeout;
	context: "callback";
} {
	return isZWaveError(e)
		&& e.code === ZWaveErrorCodes.Controller_Timeout
		&& e.context === "callback";
}
