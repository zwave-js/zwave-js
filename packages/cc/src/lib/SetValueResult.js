/**
 * Indicates the status of a `setValue` call. This enum is an extension of `SupervisionStatus`
 * with additional status codes to indicate errors that are not related to supervision.
 */
export var SetValueStatus;
(function (SetValueStatus) {
    /** The device reports no support for this command */
    SetValueStatus[SetValueStatus["NoDeviceSupport"] = 0] = "NoDeviceSupport";
    /** The device has accepted the command and is working on it */
    SetValueStatus[SetValueStatus["Working"] = 1] = "Working";
    /** The device has rejected the command */
    SetValueStatus[SetValueStatus["Fail"] = 2] = "Fail";
    /** The endpoint specified in the value ID does not exist */
    SetValueStatus[SetValueStatus["EndpointNotFound"] = 3] = "EndpointNotFound";
    /** The given CC or its API is not implemented (yet) or it has no `setValue` implementation */
    SetValueStatus[SetValueStatus["NotImplemented"] = 4] = "NotImplemented";
    /** The value to set (or a related value) is invalid */
    SetValueStatus[SetValueStatus["InvalidValue"] = 5] = "InvalidValue";
    /** The command was sent successfully, but it is unknown whether it was executed */
    SetValueStatus[SetValueStatus["SuccessUnsupervised"] = 254] = "SuccessUnsupervised";
    /** The device has executed the command successfully */
    SetValueStatus[SetValueStatus["Success"] = 255] = "Success";
})(SetValueStatus || (SetValueStatus = {}));
export function supervisionResultToSetValueResult(result) {
    if (result == undefined) {
        return {
            status: SetValueStatus.SuccessUnsupervised,
        };
    }
    else {
        // @ts-expect-error We only care about the compatible subset of status codes
        return result;
    }
}
/** Tests whether a `SetValueResult` indicates that the device accepted the command. */
export function setValueSucceeded(result) {
    return (result.status === SetValueStatus.Success
        || result.status === SetValueStatus.Working);
}
/** Tests whether a `SetValueResult` indicates that the command could not be sent or the device did not accept the command. */
export function setValueFailed(result) {
    return (result.status === SetValueStatus.NoDeviceSupport
        || result.status === SetValueStatus.Fail
        || result.status === SetValueStatus.EndpointNotFound
        || result.status === SetValueStatus.NotImplemented
        || result.status === SetValueStatus.InvalidValue);
}
/** Tests whether a `SetValueResult` indicates that the command was sent and that the device maybe accepted the command. */
export function setValueWasUnsupervisedOrSucceeded(result) {
    return (result.status === SetValueStatus.SuccessUnsupervised
        || setValueSucceeded(result));
}
//# sourceMappingURL=SetValueResult.js.map