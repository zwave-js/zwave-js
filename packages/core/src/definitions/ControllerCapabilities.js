// These flags are a mess and sometimes have a different meaning than their name implies
export var ControllerCapabilityFlags;
(function (ControllerCapabilityFlags) {
    // The controller is a secondary controller and no SIS is present on the network,
    // so it can not include or exclude other nodes.
    // Fully redundant with the SISPresent flag: Secondary == !SISPresent (?)
    ControllerCapabilityFlags[ControllerCapabilityFlags["Secondary"] = 1] = "Secondary";
    // The controller is a secondary controller
    // in a network it did not start (?) TODO: confirm
    ControllerCapabilityFlags[ControllerCapabilityFlags["OnOtherNetwork"] = 2] = "OnOtherNetwork";
    // There's a Node ID server (SIS) on the network
    ControllerCapabilityFlags[ControllerCapabilityFlags["SISPresent"] = 4] = "SISPresent";
    // This is the primary controller that started this network
    // TODO: Figure out if this changes on transferring the primary role
    ControllerCapabilityFlags[ControllerCapabilityFlags["WasRealPrimary"] = 8] = "WasRealPrimary";
    // This controller is the SUC
    ControllerCapabilityFlags[ControllerCapabilityFlags["SUC"] = 16] = "SUC";
    // This controller is the primary and hasn't included any other nodes yet
    ControllerCapabilityFlags[ControllerCapabilityFlags["NoNodesIncluded"] = 32] = "NoNodesIncluded";
})(ControllerCapabilityFlags || (ControllerCapabilityFlags = {}));
export var ControllerRole;
(function (ControllerRole) {
    /** The controller is the primary controller */
    ControllerRole[ControllerRole["Primary"] = 0] = "Primary";
    /** The controller is a secondary controller that cannot perform any network functions */
    ControllerRole[ControllerRole["Secondary"] = 1] = "Secondary";
    /**
     * The controller is a secondary controller.
     * Either itself or the primary is the SIS, so it can perform network functions
     */
    ControllerRole[ControllerRole["Inclusion"] = 2] = "Inclusion";
})(ControllerRole || (ControllerRole = {}));
//# sourceMappingURL=ControllerCapabilities.js.map