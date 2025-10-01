import type { Duration, SupervisionResult } from "@zwave-js/core";
/**
 * Indicates the status of a `setValue` call. This enum is an extension of `SupervisionStatus`
 * with additional status codes to indicate errors that are not related to supervision.
 */
export declare enum SetValueStatus {
    /** The device reports no support for this command */
    NoDeviceSupport = 0,
    /** The device has accepted the command and is working on it */
    Working = 1,
    /** The device has rejected the command */
    Fail = 2,
    /** The endpoint specified in the value ID does not exist */
    EndpointNotFound = 3,
    /** The given CC or its API is not implemented (yet) or it has no `setValue` implementation */
    NotImplemented = 4,
    /** The value to set (or a related value) is invalid */
    InvalidValue = 5,
    /** The command was sent successfully, but it is unknown whether it was executed */
    SuccessUnsupervised = 254,
    /** The device has executed the command successfully */
    Success = 255
}
/** Indicates the result of a `setValue` call. */
export type SetValueResult = {
    status: SetValueStatus.NoDeviceSupport | SetValueStatus.Fail | SetValueStatus.Success;
    remainingDuration?: undefined;
    message?: undefined;
} | {
    status: SetValueStatus.Working;
    remainingDuration: Duration;
    message?: undefined;
} | {
    status: SetValueStatus.SuccessUnsupervised;
    remainingDuration?: undefined;
    message?: undefined;
} | {
    status: SetValueStatus.EndpointNotFound | SetValueStatus.NotImplemented | SetValueStatus.InvalidValue;
    remainingDuration?: undefined;
    message: string;
};
export declare function supervisionResultToSetValueResult(result: SupervisionResult | undefined): SetValueResult;
/** Tests whether a `SetValueResult` indicates that the device accepted the command. */
export declare function setValueSucceeded(result: SetValueResult): result is SetValueResult & {
    status: SetValueStatus.Success | SetValueStatus.Working;
};
/** Tests whether a `SetValueResult` indicates that the command could not be sent or the device did not accept the command. */
export declare function setValueFailed(result: SetValueResult): result is SetValueResult & {
    status: SetValueStatus.NoDeviceSupport | SetValueStatus.Fail | SetValueStatus.EndpointNotFound | SetValueStatus.NotImplemented | SetValueStatus.InvalidValue;
};
/** Tests whether a `SetValueResult` indicates that the command was sent and that the device maybe accepted the command. */
export declare function setValueWasUnsupervisedOrSucceeded(result: SetValueResult): result is SetValueResult & {
    status: SetValueStatus.SuccessUnsupervised | SetValueStatus.Success | SetValueStatus.Working;
};
//# sourceMappingURL=SetValueResult.d.ts.map