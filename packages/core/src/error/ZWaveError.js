/**
 * Used to identify errors from this library without relying on the specific wording of the error message
 */
export var ZWaveErrorCodes;
(function (ZWaveErrorCodes) {
    ZWaveErrorCodes[ZWaveErrorCodes["PacketFormat_Truncated"] = 0] = "PacketFormat_Truncated";
    ZWaveErrorCodes[ZWaveErrorCodes["PacketFormat_Invalid"] = 1] = "PacketFormat_Invalid";
    ZWaveErrorCodes[ZWaveErrorCodes["PacketFormat_Checksum"] = 2] = "PacketFormat_Checksum";
    // This differs from the above three. It means that the packet has a valid format and checksum,
    // but the data does not match the expectations. This error does not reset the Z-Wave stack
    ZWaveErrorCodes[ZWaveErrorCodes["PacketFormat_InvalidPayload"] = 3] = "PacketFormat_InvalidPayload";
    ZWaveErrorCodes[ZWaveErrorCodes["PacketFormat_DecryptionFailed"] = 4] = "PacketFormat_DecryptionFailed";
    /** The driver failed to start */
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_Failed"] = 100] = "Driver_Failed";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_Reset"] = 101] = "Driver_Reset";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_Destroyed"] = 102] = "Driver_Destroyed";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_NotReady"] = 103] = "Driver_NotReady";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_InvalidDataReceived"] = 104] = "Driver_InvalidDataReceived";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_NotSupported"] = 105] = "Driver_NotSupported";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_NoPriority"] = 106] = "Driver_NoPriority";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_InvalidCache"] = 107] = "Driver_InvalidCache";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_InvalidOptions"] = 108] = "Driver_InvalidOptions";
    /** The driver tried to do something that requires security */
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_NoSecurity"] = 109] = "Driver_NoSecurity";
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_FeatureDisabled"] = 110] = "Driver_FeatureDisabled";
    /** The task was removed from the task queue */
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_TaskRemoved"] = 111] = "Driver_TaskRemoved";
    /** The serial port closed unexpectedly */
    ZWaveErrorCodes[ZWaveErrorCodes["Driver_SerialPortClosed"] = 112] = "Driver_SerialPortClosed";
    /** There was a timeout while waiting for a message from the controller */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_Timeout"] = 200] = "Controller_Timeout";
    /** There was a timeout while waiting for a response from a node */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_NodeTimeout"] = 201] = "Controller_NodeTimeout";
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_MessageDropped"] = 202] = "Controller_MessageDropped";
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_ResponseNOK"] = 203] = "Controller_ResponseNOK";
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_CallbackNOK"] = 204] = "Controller_CallbackNOK";
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_Jammed"] = 205] = "Controller_Jammed";
    /** The controller was reset in the middle of a Serial API command */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_Reset"] = 206] = "Controller_Reset";
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_InclusionFailed"] = 207] = "Controller_InclusionFailed";
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_ExclusionFailed"] = 208] = "Controller_ExclusionFailed";
    /** Tried to do something the controller does not support */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_NotSupported"] = 209] = "Controller_NotSupported";
    /** The interview for this node was restarted by the user */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_InterviewRestarted"] = 210] = "Controller_InterviewRestarted";
    /** The node with the given node ID was not found */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_NodeNotFound"] = 211] = "Controller_NodeNotFound";
    /** The endpoint with the given index was not found on the node */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_EndpointNotFound"] = 212] = "Controller_EndpointNotFound";
    /** The node was removed from the network */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_NodeRemoved"] = 213] = "Controller_NodeRemoved";
    /** Communication with the node will be insecure (no security configured) */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_NodeInsecureCommunication"] = 214] = "Controller_NodeInsecureCommunication";
    /** The message has expired (the given timeout has elapsed) */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_MessageExpired"] = 215] = "Controller_MessageExpired";
    /** A Serial API command resulted in an error response */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_CommandError"] = 216] = "Controller_CommandError";
    /** Tried to send a message that is too large */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_MessageTooLarge"] = 217] = "Controller_MessageTooLarge";
    /** Tried to perform an action for a Long Range node that does not make sense for ZWLR */
    ZWaveErrorCodes[ZWaveErrorCodes["Controller_NotSupportedForLongRange"] = 218] = "Controller_NotSupportedForLongRange";
    /** Could not fetch some information to determine firmware upgrades from a node */
    ZWaveErrorCodes[ZWaveErrorCodes["FWUpdateService_MissingInformation"] = 260] = "FWUpdateService_MissingInformation";
    /** Any error related to HTTP requests during firmware update communication */
    ZWaveErrorCodes[ZWaveErrorCodes["FWUpdateService_RequestError"] = 261] = "FWUpdateService_RequestError";
    /** The integrity check of the downloaded firmware update failed */
    ZWaveErrorCodes[ZWaveErrorCodes["FWUpdateService_IntegrityCheckFailed"] = 262] = "FWUpdateService_IntegrityCheckFailed";
    /** The firmware update is for a different device */
    ZWaveErrorCodes[ZWaveErrorCodes["FWUpdateService_DeviceMismatch"] = 263] = "FWUpdateService_DeviceMismatch";
    /** The given NVM version/format is unsupported */
    ZWaveErrorCodes[ZWaveErrorCodes["NVM_NotSupported"] = 280] = "NVM_NotSupported";
    /** Could not parse the JSON representation of an NVM due to invalid data */
    ZWaveErrorCodes[ZWaveErrorCodes["NVM_InvalidJSON"] = 281] = "NVM_InvalidJSON";
    /** A required NVM3 object was not found while deserializing the NVM */
    ZWaveErrorCodes[ZWaveErrorCodes["NVM_ObjectNotFound"] = 282] = "NVM_ObjectNotFound";
    /** The parsed NVM or NVM content has an invalid format */
    ZWaveErrorCodes[ZWaveErrorCodes["NVM_InvalidFormat"] = 283] = "NVM_InvalidFormat";
    /** Not enough space in the NVM */
    ZWaveErrorCodes[ZWaveErrorCodes["NVM_NoSpace"] = 284] = "NVM_NoSpace";
    /** The NVM hasn't been opened yet */
    ZWaveErrorCodes[ZWaveErrorCodes["NVM_NotOpen"] = 285] = "NVM_NotOpen";
    ZWaveErrorCodes[ZWaveErrorCodes["CC_Invalid"] = 300] = "CC_Invalid";
    ZWaveErrorCodes[ZWaveErrorCodes["CC_NoNodeID"] = 301] = "CC_NoNodeID";
    ZWaveErrorCodes[ZWaveErrorCodes["CC_NotSupported"] = 302] = "CC_NotSupported";
    ZWaveErrorCodes[ZWaveErrorCodes["CC_NotImplemented"] = 303] = "CC_NotImplemented";
    ZWaveErrorCodes[ZWaveErrorCodes["CC_NoAPI"] = 304] = "CC_NoAPI";
    /** Used to communicate that a given operation triggered by another node was not successful */
    ZWaveErrorCodes[ZWaveErrorCodes["CC_OperationFailed"] = 305] = "CC_OperationFailed";
    ZWaveErrorCodes[ZWaveErrorCodes["Deserialization_NotImplemented"] = 320] = "Deserialization_NotImplemented";
    ZWaveErrorCodes[ZWaveErrorCodes["Arithmetic"] = 321] = "Arithmetic";
    ZWaveErrorCodes[ZWaveErrorCodes["Argument_Invalid"] = 322] = "Argument_Invalid";
    ZWaveErrorCodes[ZWaveErrorCodes["Config_Invalid"] = 340] = "Config_Invalid";
    ZWaveErrorCodes[ZWaveErrorCodes["Config_NotFound"] = 341] = "Config_NotFound";
    /** A compound config file has circular imports */
    ZWaveErrorCodes[ZWaveErrorCodes["Config_CircularImport"] = 342] = "Config_CircularImport";
    /** Failed to download the npm registry info for config updates */
    ZWaveErrorCodes[ZWaveErrorCodes["Config_Update_RegistryError"] = 343] = "Config_Update_RegistryError";
    /** Could not detect which package manager to use for updates */
    ZWaveErrorCodes[ZWaveErrorCodes["Config_Update_PackageManagerNotFound"] = 344] = "Config_Update_PackageManagerNotFound";
    /** Installing the configuration update failed */
    ZWaveErrorCodes[ZWaveErrorCodes["Config_Update_InstallFailed"] = 345] = "Config_Update_InstallFailed";
    // Here follow message specific errors
    /** The removal process could not be started or completed due to one or several reasons */
    ZWaveErrorCodes[ZWaveErrorCodes["RemoveFailedNode_Failed"] = 360] = "RemoveFailedNode_Failed";
    /** The removal process was aborted because the node has responded */
    ZWaveErrorCodes[ZWaveErrorCodes["RemoveFailedNode_NodeOK"] = 361] = "RemoveFailedNode_NodeOK";
    /** The replace process could not be started or completed due to one or several reasons */
    ZWaveErrorCodes[ZWaveErrorCodes["ReplaceFailedNode_Failed"] = 362] = "ReplaceFailedNode_Failed";
    /** The replace process was aborted because the node has responded */
    ZWaveErrorCodes[ZWaveErrorCodes["ReplaceFailedNode_NodeOK"] = 363] = "ReplaceFailedNode_NodeOK";
    /** The controller is currently busy with something that prevents an OTW update */
    ZWaveErrorCodes[ZWaveErrorCodes["OTW_Update_Busy"] = 380] = "OTW_Update_Busy";
    /** The node is currently busy with another health check */
    ZWaveErrorCodes[ZWaveErrorCodes["HealthCheck_Busy"] = 400] = "HealthCheck_Busy";
    /** The node is currently busy with another link reliability check */
    ZWaveErrorCodes[ZWaveErrorCodes["LinkReliabilityCheck_Busy"] = 401] = "LinkReliabilityCheck_Busy";
    // Here follow CC specific errors
    /**
     * Used to report the first existing parameter number
     * available in a node's configuration
     */
    ZWaveErrorCodes[ZWaveErrorCodes["ConfigurationCC_FirstParameterNumber"] = 1000] = "ConfigurationCC_FirstParameterNumber";
    /**
     * Used to report that a V3+ node should not have its parameters scanned with get/set commands
     */
    ZWaveErrorCodes[ZWaveErrorCodes["ConfigurationCC_NoLegacyScanOnNewDevices"] = 1001] = "ConfigurationCC_NoLegacyScanOnNewDevices";
    /**
     * Used to report that a node using V3 or less MUST not use the resetToDefault flag
     */
    ZWaveErrorCodes[ZWaveErrorCodes["ConfigurationCC_NoResetToDefaultOnLegacyDevices"] = 1002] = "ConfigurationCC_NoResetToDefaultOnLegacyDevices";
    /**
     * Used to report that the command was not executed by the target node
     */
    ZWaveErrorCodes[ZWaveErrorCodes["SupervisionCC_CommandFailed"] = 1100] = "SupervisionCC_CommandFailed";
    /**
     * Used to report that a ManufacturerProprietaryCC could not be instantiated
     * because of a missing manufacturer ID.
     */
    ZWaveErrorCodes[ZWaveErrorCodes["ManufacturerProprietaryCC_NoManufacturerId"] = 1200] = "ManufacturerProprietaryCC_NoManufacturerId";
    /**
     * Used to report that an invalid group ID was used to address a (Multi Channel) Association
     */
    ZWaveErrorCodes[ZWaveErrorCodes["AssociationCC_InvalidGroup"] = 1300] = "AssociationCC_InvalidGroup";
    /** Cannot add an association because it is not allowed */
    ZWaveErrorCodes[ZWaveErrorCodes["AssociationCC_NotAllowed"] = 1301] = "AssociationCC_NotAllowed";
    /** Used to report that no nonce exists */
    ZWaveErrorCodes[ZWaveErrorCodes["SecurityCC_NoNonce"] = 1400] = "SecurityCC_NoNonce";
    /** Used to report that no SPAN is established between the nodes yet. */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_NoSPAN"] = 1401] = "Security2CC_NoSPAN";
    /** Used to report that the inner state required for this action was not initialized */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_NotInitialized"] = 1402] = "Security2CC_NotInitialized";
    /** Used to report that secure communication with a node is not possible because the node is not secure */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_NotSecure"] = 1403] = "Security2CC_NotSecure";
    /** Gets thrown when a Security S2 command is missing a required extension */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_MissingExtension"] = 1404] = "Security2CC_MissingExtension";
    /** Gets thrown when a Security S2 encapsulated command cannot be decoded by the target node */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_CannotDecode"] = 1405] = "Security2CC_CannotDecode";
    /** Gets thrown when parsing an invalid QR code */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_InvalidQRCode"] = 1406] = "Security2CC_InvalidQRCode";
    /** Used to report that no MPAN has been received from the peer yet, or it is out of sync. */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_NoMPAN"] = 1407] = "Security2CC_NoMPAN";
    /** Gets thrown when a Security S2 Multicast encapsulated command cannot be decoded by the target node */
    ZWaveErrorCodes[ZWaveErrorCodes["Security2CC_CannotDecodeMulticast"] = 1408] = "Security2CC_CannotDecodeMulticast";
    /** The firmware update process is already active on this node */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_Busy"] = 1500] = "FirmwareUpdateCC_Busy";
    /** The selected firmware target is not upgradable */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_NotUpgradable"] = 1501] = "FirmwareUpdateCC_NotUpgradable";
    /** The selected firmware target does not exist */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_TargetNotFound"] = 1502] = "FirmwareUpdateCC_TargetNotFound";
    /** The node reported that it could not start the update */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_FailedToStart"] = 1503] = "FirmwareUpdateCC_FailedToStart";
    /** The node did not confirm the aborted update */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_FailedToAbort"] = 1504] = "FirmwareUpdateCC_FailedToAbort";
    /** The node did not confirm the completed update or the process stalled for too long */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_Timeout"] = 1505] = "FirmwareUpdateCC_Timeout";
    /** An invalid firmware file was provided that cannot be handled by this library */
    ZWaveErrorCodes[ZWaveErrorCodes["Invalid_Firmware_File"] = 1506] = "Invalid_Firmware_File";
    /** An firmware file with an unsupported format was provided */
    ZWaveErrorCodes[ZWaveErrorCodes["Unsupported_Firmware_Format"] = 1507] = "Unsupported_Firmware_Format";
    /** A firmware update is already in progress on the network preventing this action from proceeding */
    ZWaveErrorCodes[ZWaveErrorCodes["FirmwareUpdateCC_NetworkBusy"] = 1508] = "FirmwareUpdateCC_NetworkBusy";
    /** Unsupported target node for a powerlevel test */
    ZWaveErrorCodes[ZWaveErrorCodes["PowerlevelCC_UnsupportedTestNode"] = 1600] = "PowerlevelCC_UnsupportedTestNode";
})(ZWaveErrorCodes || (ZWaveErrorCodes = {}));
export function getErrorSuffix(code) {
    return `ZW${code.toString().padStart(4, "0")}`;
}
function appendErrorSuffix(message, code) {
    const suffix = ` (${getErrorSuffix(code)})`;
    if (!message.endsWith(suffix))
        message += suffix;
    return message;
}
/**
 * Errors thrown in this library are of this type. The `code` property identifies what went wrong.
 */
export class ZWaveError extends Error {
    message;
    code;
    context;
    transactionSource;
    constructor(message, code, 
    /** Additional info required to handle this error (e.g. the Z-Wave message indicating the failure) */
    context, 
    /** If this error corresponds to a failed transaction, this contains the stack where it was created */
    transactionSource) {
        super();
        this.message = message;
        this.code = code;
        this.context = context;
        this.transactionSource = transactionSource;
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
export function isZWaveError(e) {
    return e instanceof Error && Object.getPrototypeOf(e).name === "ZWaveError";
}
export function isTransmissionError(e) {
    return (isZWaveError(e)
        && (e.code === ZWaveErrorCodes.Controller_Timeout
            || e.code === ZWaveErrorCodes.Controller_MessageDropped
            || e.code === ZWaveErrorCodes.Controller_CallbackNOK
            || e.code === ZWaveErrorCodes.Controller_ResponseNOK
            || e.code === ZWaveErrorCodes.Controller_NodeTimeout
            || e.code === ZWaveErrorCodes.Security2CC_CannotDecode));
}
/**
 * Tests is the given error is a "recoverable" error - i.e. something that shouldn't happen unless
 * someone interacted with zwave-js in a weird way, but something we can deal with.
 *
 * This explicitly does not include transmission errors.
 */
export function isRecoverableZWaveError(e) {
    if (!isZWaveError(e))
        return false;
    switch (e.code) {
        case ZWaveErrorCodes.Controller_InterviewRestarted:
        case ZWaveErrorCodes.Controller_NodeRemoved:
            return true;
    }
    return false;
}
export function isMissingControllerACK(e) {
    return isZWaveError(e)
        && e.code === ZWaveErrorCodes.Controller_Timeout
        && e.context === "ACK";
}
export function wasControllerReset(e) {
    return isZWaveError(e)
        && e.code === ZWaveErrorCodes.Controller_Reset;
}
export function isMissingControllerResponse(e) {
    return isZWaveError(e)
        && e.code === ZWaveErrorCodes.Controller_Timeout
        && e.context === "response";
}
export function isMissingControllerCallback(e) {
    return isZWaveError(e)
        && e.code === ZWaveErrorCodes.Controller_Timeout
        && e.context === "callback";
}
//# sourceMappingURL=ZWaveError.js.map