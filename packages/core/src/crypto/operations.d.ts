declare const decryptAES128OFB: (ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array) => Promise<Uint8Array>, encryptAES128CBC: (plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array) => Promise<Uint8Array>, encryptAES128ECB: (plaintext: Uint8Array, key: Uint8Array) => Promise<Uint8Array>, encryptAES128OFB: (plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array) => Promise<Uint8Array>, encryptAES128CCM: (plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array, additionalData: Uint8Array, authTagLength: number) => Promise<{
    ciphertext: Uint8Array;
    authTag: Uint8Array;
}>, decryptAES128CCM: (ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array, additionalData: Uint8Array, authTag: Uint8Array) => Promise<{
    plaintext: Uint8Array;
    authOK: boolean;
}>, decryptAES256CBC: (ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array) => Promise<Uint8Array>, randomBytes: (length: number) => Uint8Array, digest: (algorithm: "md5" | "sha-1" | "sha-256", data: Uint8Array) => Promise<Uint8Array>, generateECDHKeyPair: () => Promise<import("@zwave-js/shared/bindings").KeyPair>, deriveSharedECDHSecret: (keyPair: import("@zwave-js/shared/bindings").KeyPair) => Promise<Uint8Array>, keyPairFromRawECDHPrivateKey: (privateKey: Uint8Array) => Promise<import("@zwave-js/shared/bindings").KeyPair>;
export { decryptAES128CCM, decryptAES128OFB, decryptAES256CBC, deriveSharedECDHSecret, digest, encryptAES128CBC, encryptAES128CCM, encryptAES128ECB, encryptAES128OFB, generateECDHKeyPair, keyPairFromRawECDHPrivateKey, randomBytes, };
/** Computes a message authentication code for Security S0 (as described in SDS10865) */
export declare function computeMAC(authData: Uint8Array, key: Uint8Array, iv?: Uint8Array): Promise<Uint8Array>;
/** Computes a message authentication code for Security S2 (as described in SDS13783) */
export declare function computeCMAC(message: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
/** Computes the Pseudo Random Key (PRK) used to derive auth, encryption and nonce keys */
export declare function computePRK(ecdhSharedSecret: Uint8Array, pubKeyA: Uint8Array, pubKeyB: Uint8Array): Promise<Uint8Array>;
/** Derives the temporary auth, encryption and nonce keys from the PRK */
export declare function deriveTempKeys(PRK: Uint8Array): Promise<{
    tempKeyCCM: Uint8Array;
    tempPersonalizationString: Uint8Array;
}>;
/** Derives the CCM, MPAN keys and the personalization string from the permanent network key (PNK) */
export declare function deriveNetworkKeys(PNK: Uint8Array): Promise<{
    keyCCM: Uint8Array;
    keyMPAN: Uint8Array;
    personalizationString: Uint8Array;
}>;
/** Computes the Pseudo Random Key (PRK) used to derive the mixed entropy input (MEI) for nonce generation */
export declare function computeNoncePRK(senderEI: Uint8Array, receiverEI: Uint8Array): Promise<Uint8Array>;
/** Derives the MEI from the nonce PRK */
export declare function deriveMEI(noncePRK: Uint8Array): Promise<Uint8Array>;
//# sourceMappingURL=operations.d.ts.map