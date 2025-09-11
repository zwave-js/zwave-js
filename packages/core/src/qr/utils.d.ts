import { ProvisioningInformationType, type ProvisioningInformation_MaxInclusionRequestInterval, type ProvisioningInformation_ProductId, type ProvisioningInformation_ProductType, type ProvisioningInformation_SupportedProtocols, type ProvisioningInformation_UUID16 } from "./definitions.js";
export declare function fail(reason: string): never;
/** Reads a number between 0 and 99 (2 decimal digits) */
export declare function readLevel(qr: string, offset: number): number;
/** Reads a byte (3 decimal digits) */
export declare function readUInt8(qr: string, offset: number): number;
/** Reads a 2-byte value (5 decimal digits) */
export declare function readUInt16(qr: string, offset: number): number;
export declare function parseTLVData(type: ProvisioningInformationType, data: string): ProvisioningInformation_ProductType | ProvisioningInformation_ProductId | ProvisioningInformation_MaxInclusionRequestInterval | ProvisioningInformation_UUID16 | ProvisioningInformation_SupportedProtocols | undefined;
export declare function parseTLV(qr: string): {
    entry: {
        type: ProvisioningInformationType;
    } & Record<string, any>;
    charsRead: number;
};
//# sourceMappingURL=utils.d.ts.map