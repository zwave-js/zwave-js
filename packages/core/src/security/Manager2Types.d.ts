import type { S2SecurityClass, SecurityClass } from "../definitions/SecurityClass.js";
import type { CtrDRBG } from "./ctr_drbg.js";
export interface NetworkKeys {
    pnk: Uint8Array;
    keyCCM: Uint8Array;
    keyMPAN: Uint8Array;
    personalizationString: Uint8Array;
}
export interface TempNetworkKeys {
    keyCCM: Uint8Array;
    personalizationString: Uint8Array;
}
export declare enum SPANState {
    /** No entry exists */
    None = 0,
    RemoteEI = 1,
    LocalEI = 2,
    SPAN = 3
}
export declare enum MPANState {
    /** No entry exists */
    None = 0,
    /** The group is in use, but no MPAN was received yet, or it is out of sync */
    OutOfSync = 1,
    /** An MPAN has been established */
    MPAN = 2
}
export type SPANTableEntry = {
    type: SPANState.RemoteEI;
    receiverEI: Uint8Array;
} | {
    type: SPANState.LocalEI;
    receiverEI: Uint8Array;
} | {
    type: SPANState.SPAN;
    securityClass: SecurityClass;
    rng: CtrDRBG;
    /** The most recent generated SPAN */
    currentSPAN?: {
        nonce: Uint8Array;
        expires: number;
    };
};
export type MPANTableEntry = {
    type: MPANState.OutOfSync;
} | {
    type: MPANState.MPAN;
    currentMPAN: Uint8Array;
};
export interface MulticastGroup {
    nodeIDs: readonly number[];
    securityClass: S2SecurityClass;
    sequenceNumber: number;
}
//# sourceMappingURL=Manager2Types.d.ts.map