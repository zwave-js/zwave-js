export declare enum Protocols {
    ZWave = 0,
    ZWaveLongRange = 1
}
export declare enum ZWaveDataRate {
    "9k6" = 1,
    "40k" = 2,
    "100k" = 3
}
export declare function zwaveDataRateToString(rate: ZWaveDataRate): string;
export declare enum ProtocolDataRate {
    ZWave_9k6 = 1,
    ZWave_40k = 2,
    ZWave_100k = 3,
    LongRange_100k = 4
}
export declare function protocolDataRateToString(rate: ProtocolDataRate): string;
export declare enum RouteProtocolDataRate {
    Unspecified = 0,
    ZWave_9k6 = 1,
    ZWave_40k = 2,
    ZWave_100k = 3,
    LongRange_100k = 4
}
export declare enum ZnifferProtocolDataRate {
    ZWave_9k6 = 0,
    ZWave_40k = 1,
    ZWave_100k = 2,
    LongRange_100k = 3
}
/**
 * Converts a ZnifferProtocolDataRate into a human-readable string.
 * @param includeProtocol - Whether to include the protocol name in the output
 */
export declare function znifferProtocolDataRateToString(rate: ZnifferProtocolDataRate, includeProtocol?: boolean): string;
export declare const protocolDataRateMask = 7;
export declare enum ProtocolType {
    "Z-Wave" = 0,
    "Z-Wave AV" = 1,
    "Z-Wave for IP" = 2
}
export declare enum LongRangeChannel {
    /** Indicates that Long Range is not supported by the currently set RF region */
    Unsupported = 0,
    A = 1,
    B = 2,
    /** Z-Wave Long Range Channel automatically selected by the Z-Wave algorithm */
    Auto = 255
}
export declare function isLongRangeNodeId(nodeId: number): boolean;
export declare enum ProtocolVersion {
    "unknown" = 0,
    "2.0" = 1,
    "4.2x / 5.0x" = 2,
    "4.5x / 6.0x" = 3
}
//# sourceMappingURL=Protocol.d.ts.map