export const onlyDigitsRegex = /^\d+$/;
export const minQRCodeLength = 52; // 2 digits Z, 2 digits version, 5 digits checksum, 3 digits keys, 40 digits DSK
export var QRCodeVersion;
(function (QRCodeVersion) {
    QRCodeVersion[QRCodeVersion["S2"] = 0] = "S2";
    QRCodeVersion[QRCodeVersion["SmartStart"] = 1] = "SmartStart";
})(QRCodeVersion || (QRCodeVersion = {}));
export var ProvisioningInformationType;
(function (ProvisioningInformationType) {
    ProvisioningInformationType[ProvisioningInformationType["ProductType"] = 0] = "ProductType";
    ProvisioningInformationType[ProvisioningInformationType["ProductId"] = 1] = "ProductId";
    ProvisioningInformationType[ProvisioningInformationType["MaxInclusionRequestInterval"] = 2] = "MaxInclusionRequestInterval";
    ProvisioningInformationType[ProvisioningInformationType["UUID16"] = 3] = "UUID16";
    ProvisioningInformationType[ProvisioningInformationType["SupportedProtocols"] = 4] = "SupportedProtocols";
    // The ones below are NOT QR code compatible and therefore not implemented here
    ProvisioningInformationType[ProvisioningInformationType["Name"] = 50] = "Name";
    ProvisioningInformationType[ProvisioningInformationType["Location"] = 51] = "Location";
    ProvisioningInformationType[ProvisioningInformationType["SmartStartInclusionSetting"] = 52] = "SmartStartInclusionSetting";
    ProvisioningInformationType[ProvisioningInformationType["AdvancedJoining"] = 53] = "AdvancedJoining";
    ProvisioningInformationType[ProvisioningInformationType["BootstrappingMode"] = 54] = "BootstrappingMode";
    ProvisioningInformationType[ProvisioningInformationType["NetworkStatus"] = 55] = "NetworkStatus";
})(ProvisioningInformationType || (ProvisioningInformationType = {}));
//# sourceMappingURL=definitions.js.map