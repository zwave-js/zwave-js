/** A number between -128 and +124 dBm or one of the special values in {@link RssiError} indicating an error */
export type RSSI = number | RssiError;
export declare enum RssiError {
    NotAvailable = 127,
    ReceiverSaturated = 126,
    NoSignalDetected = 125
}
export declare function isRssiError(rssi: RSSI): rssi is RssiError;
/** Averages RSSI measurements using an exponential moving average with the given weight for the accumulator */
export declare function averageRSSI(acc: number | undefined, rssi: RSSI, weight: number): number;
/**
 * Converts an RSSI value to a human readable format, i.e. the measurement including the unit or the corresponding error message.
 */
export declare function rssiToString(rssi: RSSI): string;
//# sourceMappingURL=RSSI.d.ts.map