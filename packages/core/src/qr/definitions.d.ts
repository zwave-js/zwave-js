import type { Protocols } from "../definitions/Protocol.js";
import type { SecurityClass } from "../definitions/SecurityClass.js";
export declare const onlyDigitsRegex: RegExp;
export declare const minQRCodeLength = 52;
export declare enum QRCodeVersion {
    S2 = 0,
    SmartStart = 1
}
export declare enum ProvisioningInformationType {
    ProductType = 0,
    ProductId = 1,
    MaxInclusionRequestInterval = 2,
    UUID16 = 3,
    SupportedProtocols = 4,
    Name = 50,
    Location = 51,
    SmartStartInclusionSetting = 52,
    AdvancedJoining = 53,
    BootstrappingMode = 54,
    NetworkStatus = 55
}
export interface ProvisioningInformation_ProductType {
    genericDeviceClass: number;
    specificDeviceClass: number;
    installerIconType: number;
}
export interface ProvisioningInformation_ProductId {
    manufacturerId: number;
    productType: number;
    productId: number;
    applicationVersion: string;
}
export interface ProvisioningInformation_MaxInclusionRequestInterval {
    maxInclusionRequestInterval: number;
}
export interface ProvisioningInformation_UUID16 {
    uuid: string;
}
export interface ProvisioningInformation_SupportedProtocols {
    supportedProtocols: Protocols[];
}
export type QRProvisioningInformation = {
    version: QRCodeVersion;
    /**
     * The security classes that were **requested** by the device.
     */
    readonly requestedSecurityClasses: SecurityClass[];
    /**
     * The security classes that will be **granted** to this device.
     * Until this has been changed by a user, this will be identical to {@link requestedSecurityClasses}.
     */
    securityClasses: SecurityClass[];
    dsk: string;
} & ProvisioningInformation_ProductType & ProvisioningInformation_ProductId & Partial<ProvisioningInformation_MaxInclusionRequestInterval> & Partial<ProvisioningInformation_UUID16> & Partial<ProvisioningInformation_SupportedProtocols>;
//# sourceMappingURL=definitions.d.ts.map