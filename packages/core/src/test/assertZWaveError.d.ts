import type { ExpectStatic } from "vitest";
import type { ZWaveErrorCodes } from "../error/ZWaveError.js";
export interface AssertZWaveErrorOptions {
    messageMatches?: string | RegExp;
    errorCode?: ZWaveErrorCodes;
    context?: unknown;
}
/**
 * Asserts that a value is or a method returns a ZWaveError.
 * @param valueOrFactory An error object or method that is expected to throw
 * @param options Additional assertions
 */
export declare function assertZWaveError<T>(expect: ExpectStatic, valueOrFactory: T, options?: AssertZWaveErrorOptions): T extends () => PromiseLike<any> ? Promise<void> : void;
//# sourceMappingURL=assertZWaveError.d.ts.map