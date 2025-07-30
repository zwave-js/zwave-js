export var RssiError;
(function (RssiError) {
    RssiError[RssiError["NotAvailable"] = 127] = "NotAvailable";
    RssiError[RssiError["ReceiverSaturated"] = 126] = "ReceiverSaturated";
    RssiError[RssiError["NoSignalDetected"] = 125] = "NoSignalDetected";
})(RssiError || (RssiError = {}));
export function isRssiError(rssi) {
    return rssi >= RssiError.NoSignalDetected;
}
/** Averages RSSI measurements using an exponential moving average with the given weight for the accumulator */
export function averageRSSI(acc, rssi, weight) {
    if (isRssiError(rssi)) {
        switch (rssi) {
            case RssiError.NotAvailable:
                // If we don't have a value yet, return 0
                return acc ?? 0;
            case RssiError.ReceiverSaturated:
                // Assume rssi is 0 dBm
                rssi = 0;
                break;
            case RssiError.NoSignalDetected:
                // Assume rssi is -128 dBm
                rssi = -128;
                break;
        }
    }
    if (acc == undefined)
        return rssi;
    return Math.round(acc * weight + rssi * (1 - weight));
}
/**
 * Converts an RSSI value to a human readable format, i.e. the measurement including the unit or the corresponding error message.
 */
export function rssiToString(rssi) {
    switch (rssi) {
        case RssiError.NotAvailable:
            return "N/A";
        case RssiError.ReceiverSaturated:
            return "Receiver saturated";
        case RssiError.NoSignalDetected:
            return "No signal detected";
        default:
            return `${rssi} dBm`;
    }
}
//# sourceMappingURL=RSSI.js.map