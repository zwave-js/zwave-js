import type { KeyPair } from "@zwave-js/shared/bindings";
declare function randomBytes(length: number): Uint8Array;
/** Encrypts a payload using AES-128-ECB (as described in SDS10865) */
declare function encryptAES128ECB(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
/** Encrypts a payload using AES-OFB (as described in SDS10865) */
declare function encryptAES128OFB(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;
/** Decrypts a payload using AES-OFB */
declare function decryptAES128OFB(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;
declare function encryptAES128CBC(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;
/** Decrypts a payload using AES-256-CBC */
declare function decryptAES256CBC(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;
declare function encryptAES128CCM(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array, additionalData: Uint8Array, authTagLength: number): Promise<{
    ciphertext: Uint8Array;
    authTag: Uint8Array;
}>;
declare function decryptAES128CCM(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array, additionalData: Uint8Array, authTag: Uint8Array): Promise<{
    plaintext: Uint8Array;
    authOK: boolean;
}>;
declare function digest(algorithm: "md5" | "sha-1" | "sha-256", data: Uint8Array): Promise<Uint8Array>;
/** Generates an x25519 / ECDH key pair */
declare function generateECDHKeyPair(): Promise<KeyPair>;
declare function keyPairFromRawECDHPrivateKey(privateKey: Uint8Array): Promise<KeyPair>;
declare function deriveSharedECDHSecret(keyPair: KeyPair): Promise<Uint8Array>;
export declare const primitives: {
    randomBytes: typeof randomBytes;
    encryptAES128ECB: typeof encryptAES128ECB;
    encryptAES128CBC: typeof encryptAES128CBC;
    encryptAES128OFB: typeof encryptAES128OFB;
    decryptAES128OFB: typeof decryptAES128OFB;
    encryptAES128CCM: typeof encryptAES128CCM;
    decryptAES128CCM: typeof decryptAES128CCM;
    decryptAES256CBC: typeof decryptAES256CBC;
    digest: typeof digest;
    generateECDHKeyPair: typeof generateECDHKeyPair;
    keyPairFromRawECDHPrivateKey: typeof keyPairFromRawECDHPrivateKey;
    deriveSharedECDHSecret: typeof deriveSharedECDHSecret;
};
export {};
//# sourceMappingURL=primitives.node.d.ts.map