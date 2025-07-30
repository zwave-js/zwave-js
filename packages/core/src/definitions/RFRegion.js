export var RFRegion;
(function (RFRegion) {
    RFRegion[RFRegion["Europe"] = 0] = "Europe";
    RFRegion[RFRegion["USA"] = 1] = "USA";
    RFRegion[RFRegion["Australia/New Zealand"] = 2] = "Australia/New Zealand";
    RFRegion[RFRegion["Hong Kong"] = 3] = "Hong Kong";
    // 0x04 is deprecated
    RFRegion[RFRegion["India"] = 5] = "India";
    RFRegion[RFRegion["Israel"] = 6] = "Israel";
    RFRegion[RFRegion["Russia"] = 7] = "Russia";
    RFRegion[RFRegion["China"] = 8] = "China";
    RFRegion[RFRegion["USA (Long Range)"] = 9] = "USA (Long Range)";
    // 0x0a is deprecated
    RFRegion[RFRegion["Europe (Long Range)"] = 11] = "Europe (Long Range)";
    RFRegion[RFRegion["Japan"] = 32] = "Japan";
    RFRegion[RFRegion["Korea"] = 33] = "Korea";
    RFRegion[RFRegion["Unknown"] = 254] = "Unknown";
    RFRegion[RFRegion["Default (EU)"] = 255] = "Default (EU)";
})(RFRegion || (RFRegion = {}));
export var ZnifferRegion;
(function (ZnifferRegion) {
    ZnifferRegion[ZnifferRegion["Europe"] = 0] = "Europe";
    ZnifferRegion[ZnifferRegion["USA"] = 1] = "USA";
    ZnifferRegion[ZnifferRegion["Australia/New Zealand"] = 2] = "Australia/New Zealand";
    ZnifferRegion[ZnifferRegion["Hong Kong"] = 3] = "Hong Kong";
    ZnifferRegion[ZnifferRegion["India"] = 5] = "India";
    ZnifferRegion[ZnifferRegion["Israel"] = 6] = "Israel";
    ZnifferRegion[ZnifferRegion["Russia"] = 7] = "Russia";
    ZnifferRegion[ZnifferRegion["China"] = 8] = "China";
    ZnifferRegion[ZnifferRegion["USA (Long Range)"] = 9] = "USA (Long Range)";
    ZnifferRegion[ZnifferRegion["USA (Long Range, backup)"] = 10] = "USA (Long Range, backup)";
    ZnifferRegion[ZnifferRegion["Europe (Long Range)"] = 11] = "Europe (Long Range)";
    ZnifferRegion[ZnifferRegion["Japan"] = 32] = "Japan";
    ZnifferRegion[ZnifferRegion["Korea"] = 33] = "Korea";
    ZnifferRegion[ZnifferRegion["USA (Long Range, end device)"] = 48] = "USA (Long Range, end device)";
    ZnifferRegion[ZnifferRegion["Unknown"] = 254] = "Unknown";
    ZnifferRegion[ZnifferRegion["Default (EU)"] = 255] = "Default (EU)";
})(ZnifferRegion || (ZnifferRegion = {}));
/** Definitions for Zniffer regions on legacy (500 series and older) Zniffers */
export var ZnifferRegionLegacy;
(function (ZnifferRegionLegacy) {
    ZnifferRegionLegacy[ZnifferRegionLegacy["EU"] = 0] = "EU";
    ZnifferRegionLegacy[ZnifferRegionLegacy["US"] = 1] = "US";
    ZnifferRegionLegacy[ZnifferRegionLegacy["ANZ"] = 2] = "ANZ";
    ZnifferRegionLegacy[ZnifferRegionLegacy["HK"] = 3] = "HK";
    ZnifferRegionLegacy[ZnifferRegionLegacy["MY"] = 8] = "MY";
    ZnifferRegionLegacy[ZnifferRegionLegacy["IN"] = 9] = "IN";
    ZnifferRegionLegacy[ZnifferRegionLegacy["JP"] = 10] = "JP";
    ZnifferRegionLegacy[ZnifferRegionLegacy["RU"] = 26] = "RU";
    ZnifferRegionLegacy[ZnifferRegionLegacy["IL"] = 27] = "IL";
    ZnifferRegionLegacy[ZnifferRegionLegacy["KR"] = 28] = "KR";
    ZnifferRegionLegacy[ZnifferRegionLegacy["CN"] = 29] = "CN";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_866"] = 4] = "TF_866";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_870"] = 5] = "TF_870";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_906"] = 6] = "TF_906";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_910"] = 7] = "TF_910";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_878"] = 11] = "TF_878";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_882"] = 12] = "TF_882";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_886"] = 13] = "TF_886";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_932_3CH"] = 14] = "TF_932_3CH";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_940_3CH"] = 15] = "TF_940_3CH";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_835_3CH"] = 24] = "TF_835_3CH";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_840_3CH"] = 16] = "TF_840_3CH";
    ZnifferRegionLegacy[ZnifferRegionLegacy["TF_850_3CH"] = 17] = "TF_850_3CH";
})(ZnifferRegionLegacy || (ZnifferRegionLegacy = {}));
export var ZnifferLRChannelConfig;
(function (ZnifferLRChannelConfig) {
    ZnifferLRChannelConfig[ZnifferLRChannelConfig["Classic & LR A"] = 1] = "Classic & LR A";
    ZnifferLRChannelConfig[ZnifferLRChannelConfig["Classic & LR B"] = 2] = "Classic & LR B";
    ZnifferLRChannelConfig[ZnifferLRChannelConfig["LR A & B"] = 3] = "LR A & B";
})(ZnifferLRChannelConfig || (ZnifferLRChannelConfig = {}));
export function getLegalPowerlevelMesh(region) {
    switch (region) {
        case RFRegion.Europe:
        case RFRegion["Europe (Long Range)"]:
            return +13; // dBm
        case RFRegion.USA:
        case RFRegion["USA (Long Range)"]:
            return -1; // dBm
    }
    // Nobody knows
}
export function getLegalPowerlevelLR(region) {
    switch (region) {
        case RFRegion.Europe:
        case RFRegion["Europe (Long Range)"]:
            return +14; // dBm
        case RFRegion.USA:
        case RFRegion["USA (Long Range)"]:
            return +20; // dBm
    }
    // Nobody knows
}
//# sourceMappingURL=RFRegion.js.map