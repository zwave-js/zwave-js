import type { MaybeNotKnown } from "../values/Primitive.js";
/** Checks if the SDK version is greater than the given one */
export declare function sdkVersionGt(sdkVersion: MaybeNotKnown<string>, compareVersion: string): MaybeNotKnown<boolean>;
/** Checks if the SDK version is greater than or equal to the given one */
export declare function sdkVersionGte(sdkVersion: MaybeNotKnown<string>, compareVersion: string): MaybeNotKnown<boolean>;
/** Checks if the SDK version is lower than the given one */
export declare function sdkVersionLt(sdkVersion: MaybeNotKnown<string>, compareVersion: string): MaybeNotKnown<boolean>;
/** Checks if the SDK version is lower than or equal to the given one */
export declare function sdkVersionLte(sdkVersion: MaybeNotKnown<string>, compareVersion: string): MaybeNotKnown<boolean>;
//# sourceMappingURL=compareVersions.d.ts.map