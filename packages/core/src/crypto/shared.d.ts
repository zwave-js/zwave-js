export declare const BLOCK_SIZE = 16;
export declare function zeroPad(input: Uint8Array, blockSize: number): {
    output: Uint8Array;
    paddingLength: number;
};
/** Left-Shifts a buffer by 1 bit */
export declare function leftShift1(input: Uint8Array): Uint8Array;
/** Computes the byte-wise XOR of two buffers with the same length */
export declare function xor(b1: Uint8Array, b2: Uint8Array): Uint8Array;
/** Increments a multi-byte integer in a buffer */
export declare function increment(buffer: Uint8Array): void;
/** Decodes a DER-encoded x25519 key (PKCS#8 or SPKI) */
export declare function decodeX25519KeyDER(key: Uint8Array): Uint8Array;
/** Encodes an x25519 key from a raw buffer with DER/PKCS#8 */
export declare function encodeX25519KeyDERPKCS8(key: Uint8Array): Uint8Array;
/** Encodes an x25519 key from a raw buffer with DER/SPKI */
export declare function encodeX25519KeyDERSPKI(key: Uint8Array): Uint8Array;
//# sourceMappingURL=shared.d.ts.map