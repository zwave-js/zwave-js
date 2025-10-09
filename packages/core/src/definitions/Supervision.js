import { isObject } from "alcalzone-shared/typeguards";
import { Duration } from "../values/Duration.js";
export var SupervisionStatus;
(function (SupervisionStatus) {
    SupervisionStatus[SupervisionStatus["NoSupport"] = 0] = "NoSupport";
    SupervisionStatus[SupervisionStatus["Working"] = 1] = "Working";
    SupervisionStatus[SupervisionStatus["Fail"] = 2] = "Fail";
    SupervisionStatus[SupervisionStatus["Success"] = 255] = "Success";
})(SupervisionStatus || (SupervisionStatus = {}));
export function isSupervisionResult(obj) {
    return (isObject(obj)
        && "status" in obj
        && typeof SupervisionStatus[obj.status] === "string");
}
export function supervisedCommandSucceeded(result) {
    return (isSupervisionResult(result)
        && (result.status === SupervisionStatus.Success
            || result.status === SupervisionStatus.Working));
}
export function supervisedCommandFailed(result) {
    return (isSupervisionResult(result)
        && (result.status === SupervisionStatus.Fail
            || result.status === SupervisionStatus.NoSupport));
}
export function isUnsupervisedOrSucceeded(result) {
    return !result || supervisedCommandSucceeded(result);
}
/** Figures out the final supervision result from an array of things that may be supervision results */
export function mergeSupervisionResults(results) {
    const supervisionResults = results.filter(isSupervisionResult);
    if (!supervisionResults.length)
        return undefined;
    if (supervisionResults.some((r) => r.status === SupervisionStatus.Fail)) {
        return {
            status: SupervisionStatus.Fail,
        };
    }
    else if (supervisionResults.some((r) => r.status === SupervisionStatus.NoSupport)) {
        return {
            status: SupervisionStatus.NoSupport,
        };
    }
    const working = supervisionResults.filter((r) => r.status === SupervisionStatus.Working);
    if (working.length > 0) {
        const durations = working.map((r) => r.remainingDuration.serializeSet());
        const maxDuration = (durations.length > 0
            && Duration.parseReport(Math.max(...durations)))
            || Duration.unknown();
        return {
            status: SupervisionStatus.Working,
            remainingDuration: maxDuration,
        };
    }
    return {
        status: SupervisionStatus.Success,
    };
}
export const MAX_SUPERVISION_SESSION_ID = 0b111111;
//# sourceMappingURL=Supervision.js.map