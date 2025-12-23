export declare function dskToString(dsk: Uint8Array): string;
export declare function dskFromString(dsk: string): Uint8Array;
export declare function nwiHomeIdFromDSK(dsk: Uint8Array): Uint8Array;
export declare function authHomeIdFromDSK(dsk: Uint8Array): Uint8Array; /**
 * Tries to extract a DSK from a scanned QR code. If the string is a valid DSK (prefixed with "zws2dsk:" or unprefixed), the DSK will be returned.
 * This can then be used to initiate an S2 inclusion with pre-filled DSK.
 */
export declare function tryParseDSKFromQRCodeString(qr: string): string | undefined;
export declare function isValidDSK(dsk: string): boolean;
//# sourceMappingURL=index.d.ts.map