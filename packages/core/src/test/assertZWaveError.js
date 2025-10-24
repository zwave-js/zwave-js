/**
 * Asserts that a value is or a method returns a ZWaveError.
 * @param valueOrFactory An error object or method that is expected to throw
 * @param options Additional assertions
 */
export function assertZWaveError(expect, valueOrFactory, options = {}) {
    const { messageMatches, errorCode, context } = options;
    function _assertZWaveError(e) {
        expect(e.constructor.name).toBe("ZWaveError");
        expect(e.code).toBeTypeOf("number");
    }
    function handleError(e) {
        _assertZWaveError(e);
        if (messageMatches != undefined) {
            const regex = messageMatches instanceof RegExp
                ? messageMatches
                : new RegExp(messageMatches);
            expect(e.message).toMatch(regex);
        }
        if (errorCode != undefined)
            expect(e.code).toBe(errorCode);
        if (context != undefined)
            expect(e.context).toBe(context);
    }
    function fail() {
        // We should not be here
        throw new Error("The factory function did not throw any error!");
    }
    if (typeof valueOrFactory === "function") {
        try {
            // This call is expected to throw if valueOrFactory is a synchronous function
            const result = valueOrFactory();
            if (result instanceof Promise) {
                return result.then(fail, // If valueOrFactory is an async function the promise should be rejected
                handleError);
            }
        }
        catch (e) {
            return void handleError(e);
        }
        fail();
    }
    else {
        // Directly assert the error object
        handleError(valueOrFactory);
    }
    return undefined;
}
//# sourceMappingURL=assertZWaveError.js.map