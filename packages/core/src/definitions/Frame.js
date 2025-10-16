export var MPDUHeaderType;
(function (MPDUHeaderType) {
    MPDUHeaderType[MPDUHeaderType["Singlecast"] = 1] = "Singlecast";
    MPDUHeaderType[MPDUHeaderType["Multicast"] = 2] = "Multicast";
    MPDUHeaderType[MPDUHeaderType["Acknowledgement"] = 3] = "Acknowledgement";
    MPDUHeaderType[MPDUHeaderType["Explorer"] = 5] = "Explorer";
    MPDUHeaderType[MPDUHeaderType["Routed"] = 8] = "Routed";
})(MPDUHeaderType || (MPDUHeaderType = {}));
export var BeamingInfo;
(function (BeamingInfo) {
    BeamingInfo[BeamingInfo["None"] = 0] = "None";
    BeamingInfo[BeamingInfo["ShortContinuous"] = 1] = "ShortContinuous";
    BeamingInfo[BeamingInfo["LongContinuous"] = 2] = "LongContinuous";
    BeamingInfo[BeamingInfo["Fragmented"] = 4] = "Fragmented";
})(BeamingInfo || (BeamingInfo = {}));
//# sourceMappingURL=Frame.js.map