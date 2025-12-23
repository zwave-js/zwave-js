import { Duration } from "../values/Duration.js";
export declare enum SupervisionStatus {
    NoSupport = 0,
    Working = 1,
    Fail = 2,
    Success = 255
}
export type SupervisionResult = {
    status: SupervisionStatus.NoSupport | SupervisionStatus.Fail | SupervisionStatus.Success;
    remainingDuration?: undefined;
} | {
    status: SupervisionStatus.Working;
    remainingDuration: Duration;
};
export type SupervisionUpdateHandler = (update: SupervisionResult) => void;
export declare function isSupervisionResult(obj: unknown): obj is SupervisionResult;
export declare function supervisedCommandSucceeded(result: unknown): result is SupervisionResult & {
    status: SupervisionStatus.Success | SupervisionStatus.Working;
};
export declare function supervisedCommandFailed(result: unknown): result is SupervisionResult & {
    status: SupervisionStatus.Fail | SupervisionStatus.NoSupport;
};
export declare function isUnsupervisedOrSucceeded(result: SupervisionResult | undefined): result is undefined | (SupervisionResult & {
    status: SupervisionStatus.Success | SupervisionStatus.Working;
});
/** Figures out the final supervision result from an array of things that may be supervision results */
export declare function mergeSupervisionResults(results: unknown[]): SupervisionResult | undefined;
export declare const MAX_SUPERVISION_SESSION_ID = 63;
//# sourceMappingURL=Supervision.d.ts.map