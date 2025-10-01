export declare enum RFRegion {
    "Europe" = 0,
    "USA" = 1,
    "Australia/New Zealand" = 2,
    "Hong Kong" = 3,
    "India" = 5,
    "Israel" = 6,
    "Russia" = 7,
    "China" = 8,
    "USA (Long Range)" = 9,
    "Europe (Long Range)" = 11,
    "Japan" = 32,
    "Korea" = 33,
    "Unknown" = 254,
    "Default (EU)" = 255
}
export interface RFRegionInfo {
    region: RFRegion;
    supportsZWave: boolean;
    supportsLongRange: boolean;
    includesRegion?: RFRegion;
}
export declare enum ZnifferRegion {
    "Europe" = 0,
    "USA" = 1,
    "Australia/New Zealand" = 2,
    "Hong Kong" = 3,
    "India" = 5,
    "Israel" = 6,
    "Russia" = 7,
    "China" = 8,
    "USA (Long Range)" = 9,
    "USA (Long Range, backup)" = 10,
    "Europe (Long Range)" = 11,
    "Japan" = 32,
    "Korea" = 33,
    "USA (Long Range, end device)" = 48,
    "Unknown" = 254,
    "Default (EU)" = 255
}
/** Definitions for Zniffer regions on legacy (500 series and older) Zniffers */
export declare enum ZnifferRegionLegacy {
    EU = 0,
    US = 1,
    ANZ = 2,
    HK = 3,
    MY = 8,
    IN = 9,
    JP = 10,
    RU = 26,
    IL = 27,
    KR = 28,
    CN = 29,
    TF_866 = 4,
    TF_870 = 5,
    TF_906 = 6,
    TF_910 = 7,
    TF_878 = 11,
    TF_882 = 12,
    TF_886 = 13,
    TF_932_3CH = 14,
    TF_940_3CH = 15,
    TF_835_3CH = 24,
    TF_840_3CH = 16,
    TF_850_3CH = 17
}
export declare enum ZnifferLRChannelConfig {
    "Classic & LR A" = 1,
    "Classic & LR B" = 2,
    "LR A & B" = 3
}
export declare function getLegalPowerlevelMesh(region: RFRegion): number | undefined;
export declare function getLegalPowerlevelLR(region: RFRegion): number | undefined;
//# sourceMappingURL=RFRegion.d.ts.map