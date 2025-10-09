export var SPANState;
(function (SPANState) {
    /** No entry exists */
    SPANState[SPANState["None"] = 0] = "None";
    /* The other node's receiver's entropy input is known but, but we didn't send it our sender's EI yet */
    SPANState[SPANState["RemoteEI"] = 1] = "RemoteEI";
    /* We've sent the other node our receiver's entropy input, but we didn't receive its sender's EI yet */
    SPANState[SPANState["LocalEI"] = 2] = "LocalEI";
    /* An SPAN with the other node has been established */
    SPANState[SPANState["SPAN"] = 3] = "SPAN";
})(SPANState || (SPANState = {}));
export var MPANState;
(function (MPANState) {
    /** No entry exists */
    MPANState[MPANState["None"] = 0] = "None";
    /** The group is in use, but no MPAN was received yet, or it is out of sync */
    MPANState[MPANState["OutOfSync"] = 1] = "OutOfSync";
    /** An MPAN has been established */
    MPANState[MPANState["MPAN"] = 2] = "MPAN";
})(MPANState || (MPANState = {}));
//# sourceMappingURL=Manager2Types.js.map