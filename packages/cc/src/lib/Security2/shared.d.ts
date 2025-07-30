/** @publicAPI */
export declare enum KEXSchemes {
    KEXScheme1 = 1
}
/** @publicAPI */
export declare enum ECDHProfiles {
    Curve25519 = 0
}
/** @publicAPI */
export declare enum KEXFailType {
    NoKeyMatch = 1,// KEX_KEY
    NoSupportedScheme = 2,// KEX_SCHEME
    NoSupportedCurve = 3,// KEX_CURVES
    Decrypt = 5,
    BootstrappingCanceled = 6,// CANCEL
    WrongSecurityLevel = 7,// AUTH
    KeyNotGranted = 8,// GET
    NoVerify = 9,// VERIFY
    DifferentKey = 10
}
/** @publicAPI */
export declare const inclusionTimeouts: Readonly<{
    readonly TA1: 10000;
    readonly TA2: 10000;
    readonly TA3: 10000;
    readonly TA4: 10000;
    readonly TA5: 10000;
    readonly TAI1: 240000;
    readonly TAI2: 240000;
    readonly TB1: 30000;
    readonly TB2: 240000;
    readonly TB3: 10000;
    readonly TB4: 10000;
    readonly TB5: 10000;
    readonly TBI1: 240000;
}>;
//# sourceMappingURL=shared.d.ts.map