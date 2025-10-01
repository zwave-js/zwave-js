export var EncapsulationFlags;
(function (EncapsulationFlags) {
    EncapsulationFlags[EncapsulationFlags["None"] = 0] = "None";
    EncapsulationFlags[EncapsulationFlags["Supervision"] = 1] = "Supervision";
    // Multi Channel is tracked through the endpoint index
    EncapsulationFlags[EncapsulationFlags["Security"] = 2] = "Security";
    EncapsulationFlags[EncapsulationFlags["CRC16"] = 4] = "CRC16";
})(EncapsulationFlags || (EncapsulationFlags = {}));
//# sourceMappingURL=EncapsulationFlags.js.map