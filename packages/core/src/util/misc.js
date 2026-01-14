import { ZWaveError, ZWaveErrorCodes } from "../error/ZWaveError.js";
/** Ensures that the values array is consecutive */
export function isConsecutiveArray(values) {
    return values.every((v, i, arr) => (i === 0 ? true : v - 1 === arr[i - 1]));
}
/** Returns an object that includes all non-undefined properties from the original one */
export function stripUndefined(obj) {
    const ret = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined)
            ret[key] = value;
    }
    return ret;
}
function validatePayloadInternal(reason, ...assertions) {
    if (!assertions.every(Boolean)) {
        throw new ZWaveError("The message payload is invalid!", ZWaveErrorCodes.PacketFormat_InvalidPayload, reason);
    }
}
// Export and augment the validatePayload method with a reason
export const validatePayload = validatePayloadInternal.bind(undefined, undefined);
validatePayload.withReason = (reason) => validatePayloadInternal.bind(undefined, reason);
validatePayload.fail = (reason) => validatePayload.withReason(reason)(false);
/**
 * Determines how many bits a value must be shifted to be right-aligned with a given bit mask
 * Example:
 * ```txt
 *   Mask = 00110000
 *             ^---- => 4 bits
 *
 *   Mask = 00110001
 *                 ^ => 0 bits
 * ```
 */
export function getMinimumShiftForBitMask(mask) {
    let i = 0;
    while (mask % 2 === 0) {
        mask >>>= 1;
        if (mask === 0)
            break;
        i++;
    }
    return i;
}
/**
 * Determines how many wide a given bit mask is
 * Example:
 * ```txt
 *   Mask = 00110000
 *            ^^---- => 2 bits
 *
 *   Mask = 00110001
 *            ^....^ => 6 bits
 * ```
 */
export function getBitMaskWidth(mask) {
    mask = mask >>> getMinimumShiftForBitMask(mask);
    let i = 0;
    while (mask > 0) {
        mask >>>= 1;
        i++;
    }
    return i;
}
/**
 * Determines the legal range of values that can be encoded at with the given bit mask
 * Example:
 * ```txt
 *   Mask = 00110000
 *            ^^---- => 0..3 unsigned OR -2..+1 signed
 *
 *   Mask = 00110001
 *            ^....^ => 0..63 unsigned OR -32..+31 signed (with gaps)
 * ```
 */
export function getLegalRangeForBitMask(mask, unsigned) {
    if (mask === 0)
        return [0, 0];
    const bitMaskWidth = getBitMaskWidth(mask);
    const min = unsigned || bitMaskWidth == 1 ? 0 : -(2 ** (bitMaskWidth - 1));
    const max = unsigned || bitMaskWidth == 1
        ? 2 ** bitMaskWidth - 1
        : 2 ** (bitMaskWidth - 1) - 1;
    return [min, max];
}
//# sourceMappingURL=misc.js.map