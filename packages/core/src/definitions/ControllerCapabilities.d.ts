import type { NodeType } from "./NodeInfo.js";
import type { ZWaveApiVersion } from "./ZWaveApiVersion.js";
import type { UnknownZWaveChipType } from "./ZWaveChipTypes.js";
export declare enum ControllerCapabilityFlags {
    Secondary = 1,
    OnOtherNetwork = 2,
    SISPresent = 4,
    WasRealPrimary = 8,
    SUC = 16,
    NoNodesIncluded = 32
}
export declare enum ControllerRole {
    /** The controller is the primary controller */
    Primary = 0,
    /** The controller is a secondary controller that cannot perform any network functions */
    Secondary = 1,
    /**
     * The controller is a secondary controller.
     * Either itself or the primary is the SIS, so it can perform network functions
     */
    Inclusion = 2
}
export interface ControllerCapabilities {
    isSecondary: boolean;
    isUsingHomeIdFromOtherNetwork: boolean;
    isSISPresent: boolean;
    wasRealPrimary: boolean;
    isSUC: boolean;
    noNodesIncluded: boolean;
}
export interface SerialApiInitData {
    zwaveApiVersion: ZWaveApiVersion;
    isPrimary: boolean;
    nodeType: NodeType;
    supportsTimers: boolean;
    isSIS: boolean;
    nodeIds: number[];
    zwaveChipType?: string | UnknownZWaveChipType;
}
//# sourceMappingURL=ControllerCapabilities.d.ts.map