import { num2hex } from "@zwave-js/shared";
export var Protocols;
(function (Protocols) {
    Protocols[Protocols["ZWave"] = 0] = "ZWave";
    Protocols[Protocols["ZWaveLongRange"] = 1] = "ZWaveLongRange";
})(Protocols || (Protocols = {}));
export var ZWaveDataRate;
(function (ZWaveDataRate) {
    ZWaveDataRate[ZWaveDataRate["9k6"] = 1] = "9k6";
    ZWaveDataRate[ZWaveDataRate["40k"] = 2] = "40k";
    ZWaveDataRate[ZWaveDataRate["100k"] = 3] = "100k";
})(ZWaveDataRate || (ZWaveDataRate = {}));
export function zwaveDataRateToString(rate) {
    switch (rate) {
        case ZWaveDataRate["9k6"]:
            return "9.6 kbit/s";
        case ZWaveDataRate["40k"]:
            return "40 kbit/s";
        case ZWaveDataRate["100k"]:
            return "100 kbit/s";
    }
    return `Unknown (${num2hex(rate)})`;
}
export var ProtocolDataRate;
(function (ProtocolDataRate) {
    ProtocolDataRate[ProtocolDataRate["ZWave_9k6"] = 1] = "ZWave_9k6";
    ProtocolDataRate[ProtocolDataRate["ZWave_40k"] = 2] = "ZWave_40k";
    ProtocolDataRate[ProtocolDataRate["ZWave_100k"] = 3] = "ZWave_100k";
    ProtocolDataRate[ProtocolDataRate["LongRange_100k"] = 4] = "LongRange_100k";
})(ProtocolDataRate || (ProtocolDataRate = {}));
export function protocolDataRateToString(rate) {
    switch (rate) {
        case ProtocolDataRate.ZWave_9k6:
            return "Z-Wave, 9.6 kbit/s";
        case ProtocolDataRate.ZWave_40k:
            return "Z-Wave, 40 kbit/s";
        case ProtocolDataRate.ZWave_100k:
            return "Z-Wave, 100 kbit/s";
        case ProtocolDataRate.LongRange_100k:
            return "Z-Wave Long Range, 100 kbit/s";
    }
    return `Unknown (${num2hex(rate)})`;
}
// Same as ProtocolDataRate, but with the ability to NOT specify a data rate
export var RouteProtocolDataRate;
(function (RouteProtocolDataRate) {
    RouteProtocolDataRate[RouteProtocolDataRate["Unspecified"] = 0] = "Unspecified";
    RouteProtocolDataRate[RouteProtocolDataRate["ZWave_9k6"] = 1] = "ZWave_9k6";
    RouteProtocolDataRate[RouteProtocolDataRate["ZWave_40k"] = 2] = "ZWave_40k";
    RouteProtocolDataRate[RouteProtocolDataRate["ZWave_100k"] = 3] = "ZWave_100k";
    RouteProtocolDataRate[RouteProtocolDataRate["LongRange_100k"] = 4] = "LongRange_100k";
})(RouteProtocolDataRate || (RouteProtocolDataRate = {}));
// Like ProtocolDataRate, but for use in the Zniffer protocol, which
// shifts the values by one for some reason
export var ZnifferProtocolDataRate;
(function (ZnifferProtocolDataRate) {
    ZnifferProtocolDataRate[ZnifferProtocolDataRate["ZWave_9k6"] = 0] = "ZWave_9k6";
    ZnifferProtocolDataRate[ZnifferProtocolDataRate["ZWave_40k"] = 1] = "ZWave_40k";
    ZnifferProtocolDataRate[ZnifferProtocolDataRate["ZWave_100k"] = 2] = "ZWave_100k";
    ZnifferProtocolDataRate[ZnifferProtocolDataRate["LongRange_100k"] = 3] = "LongRange_100k";
})(ZnifferProtocolDataRate || (ZnifferProtocolDataRate = {}));
/**
 * Converts a ZnifferProtocolDataRate into a human-readable string.
 * @param includeProtocol - Whether to include the protocol name in the output
 */
export function znifferProtocolDataRateToString(rate, includeProtocol = true) {
    if (includeProtocol) {
        switch (rate) {
            case ZnifferProtocolDataRate.ZWave_9k6:
                return "Z-Wave, 9.6 kbit/s";
            case ZnifferProtocolDataRate.ZWave_40k:
                return "Z-Wave, 40 kbit/s";
            case ZnifferProtocolDataRate.ZWave_100k:
                return "Z-Wave, 100 kbit/s";
            case ZnifferProtocolDataRate.LongRange_100k:
                return "Z-Wave Long Range, 100 kbit/s";
        }
    }
    else {
        switch (rate) {
            case ZnifferProtocolDataRate.ZWave_9k6:
                return "9.6 kbit/s";
            case ZnifferProtocolDataRate.ZWave_40k:
                return "40 kbit/s";
            case ZnifferProtocolDataRate.ZWave_100k:
            case ZnifferProtocolDataRate.LongRange_100k:
                return "100 kbit/s";
        }
    }
    return `Unknown (${num2hex(rate)})`;
}
export const protocolDataRateMask = 0b111;
export var ProtocolType;
(function (ProtocolType) {
    ProtocolType[ProtocolType["Z-Wave"] = 0] = "Z-Wave";
    ProtocolType[ProtocolType["Z-Wave AV"] = 1] = "Z-Wave AV";
    ProtocolType[ProtocolType["Z-Wave for IP"] = 2] = "Z-Wave for IP";
})(ProtocolType || (ProtocolType = {}));
export var LongRangeChannel;
(function (LongRangeChannel) {
    /** Indicates that Long Range is not supported by the currently set RF region */
    LongRangeChannel[LongRangeChannel["Unsupported"] = 0] = "Unsupported";
    LongRangeChannel[LongRangeChannel["A"] = 1] = "A";
    LongRangeChannel[LongRangeChannel["B"] = 2] = "B";
    // 0x03..0xFE are reserved and must not be used
    /** Z-Wave Long Range Channel automatically selected by the Z-Wave algorithm */
    LongRangeChannel[LongRangeChannel["Auto"] = 255] = "Auto";
})(LongRangeChannel || (LongRangeChannel = {}));
export function isLongRangeNodeId(nodeId) {
    return nodeId > 255;
}
export var ProtocolVersion;
(function (ProtocolVersion) {
    ProtocolVersion[ProtocolVersion["unknown"] = 0] = "unknown";
    ProtocolVersion[ProtocolVersion["2.0"] = 1] = "2.0";
    ProtocolVersion[ProtocolVersion["4.2x / 5.0x"] = 2] = "4.2x / 5.0x";
    ProtocolVersion[ProtocolVersion["4.5x / 6.0x"] = 3] = "4.5x / 6.0x";
})(ProtocolVersion || (ProtocolVersion = {}));
//# sourceMappingURL=Protocol.js.map