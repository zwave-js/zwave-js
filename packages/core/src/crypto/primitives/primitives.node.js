import { Bytes } from "@zwave-js/shared";
import crypto from "node:crypto";
import { BLOCK_SIZE, decodeX25519KeyDER, encodeX25519KeyDERPKCS8, encodeX25519KeyDERSPKI, zeroPad, } from "../shared.js";
// For Node.js, we use the built-in crypto module since it has better support
// for some algorithms Z-Wave needs than the Web Crypto API, so we can implement
// those without additional operations.
function randomBytes(length) {
    return crypto.randomBytes(length);
}
function encrypt(algorithm, blockSize, trimToInputLength, input, key, iv) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAutoPadding(false);
    const { output: plaintext, paddingLength } = zeroPad(input, blockSize);
    const ret = Bytes.concat([cipher.update(plaintext), cipher.final()]);
    if (trimToInputLength && paddingLength > 0) {
        return ret.subarray(0, -paddingLength);
    }
    else {
        return ret;
    }
}
function decrypt(algorithm, blockSize, trimToInputLength, input, key, iv) {
    const cipher = crypto.createDecipheriv(algorithm, key, iv);
    cipher.setAutoPadding(false);
    const { output: ciphertext, paddingLength } = zeroPad(input, blockSize);
    const ret = Bytes.concat([cipher.update(ciphertext), cipher.final()]);
    if (trimToInputLength && paddingLength > 0) {
        return ret.subarray(0, -paddingLength);
    }
    else {
        return ret;
    }
}
/** Encrypts a payload using AES-128-ECB (as described in SDS10865) */
function encryptAES128ECB(plaintext, key) {
    return Promise.resolve(encrypt("aes-128-ecb", BLOCK_SIZE, false, plaintext, key, new Uint8Array()));
}
/** Encrypts a payload using AES-OFB (as described in SDS10865) */
function encryptAES128OFB(plaintext, key, iv) {
    return Promise.resolve(encrypt("aes-128-ofb", BLOCK_SIZE, true, plaintext, key, iv));
}
/** Decrypts a payload using AES-OFB */
function decryptAES128OFB(ciphertext, key, iv) {
    return Promise.resolve(decrypt("aes-128-ofb", BLOCK_SIZE, true, ciphertext, key, iv));
}
function encryptAES128CBC(plaintext, key, iv) {
    return Promise.resolve(encrypt("aes-128-cbc", BLOCK_SIZE, false, plaintext, key, iv));
}
/** Decrypts a payload using AES-256-CBC */
function decryptAES256CBC(ciphertext, key, iv) {
    return Promise.resolve(decrypt("aes-256-cbc", BLOCK_SIZE, true, ciphertext, key, iv));
}
function encryptAES128CCM(plaintext, key, iv, additionalData, authTagLength) {
    // prepare encryption
    const algorithm = `aes-128-ccm`;
    const cipher = crypto.createCipheriv(algorithm, key, iv, { authTagLength });
    cipher.setAAD(additionalData, { plaintextLength: plaintext.length });
    // do encryption
    const ciphertext = cipher.update(plaintext);
    cipher.final();
    const authTag = cipher.getAuthTag();
    return Promise.resolve({ ciphertext, authTag });
}
function decryptAES128CCM(ciphertext, key, iv, additionalData, authTag) {
    // prepare decryption
    const algorithm = `aes-128-ccm`;
    const decipher = crypto.createDecipheriv(algorithm, key, iv, {
        authTagLength: authTag.length,
    });
    decipher.setAuthTag(authTag);
    decipher.setAAD(additionalData, { plaintextLength: ciphertext.length });
    // do decryption
    const plaintext = decipher.update(ciphertext);
    // verify decryption
    let authOK = false;
    try {
        decipher.final();
        authOK = true;
    }
    catch {
        /* nothing to do */
    }
    return Promise.resolve({ plaintext, authOK });
}
function digest(algorithm, data) {
    // Node.js uses slightly different algorithm names than WebCrypto
    const nodeAlgorithm = algorithm === "sha-1"
        ? "sha1"
        : algorithm === "sha-256"
            ? "sha256"
            : algorithm;
    const hash = crypto.createHash(nodeAlgorithm);
    hash.update(data);
    return Promise.resolve(hash.digest());
}
/** Takes an ECDH public KeyObject and returns the raw key as a buffer */
function extractRawECDHPublicKey(publicKey) {
    return decodeX25519KeyDER(publicKey.export({
        type: "spki",
        format: "der",
    }));
}
/** Converts a raw public key to an ECDH KeyObject */
function importRawECDHPublicKey(publicKey) {
    return crypto.createPublicKey({
        // eslint-disable-next-line no-restricted-globals -- crypto API requires Buffer instances
        key: Buffer.from(encodeX25519KeyDERSPKI(publicKey).buffer),
        format: "der",
        type: "spki",
    });
}
/** Takes an ECDH private KeyObject and returns the raw key as a buffer */
function extractRawECDHPrivateKey(privateKey) {
    return decodeX25519KeyDER(privateKey.export({
        type: "pkcs8",
        format: "der",
    }));
}
/** Converts a raw private key to an ECDH KeyObject */
function importRawECDHPrivateKey(privateKey) {
    return crypto.createPrivateKey({
        // eslint-disable-next-line no-restricted-globals -- crypto API requires Buffer instances
        key: Buffer.from(encodeX25519KeyDERPKCS8(privateKey).buffer),
        format: "der",
        type: "pkcs8",
    });
}
/** Generates an x25519 / ECDH key pair */
function generateECDHKeyPair() {
    const pair = crypto.generateKeyPairSync("x25519");
    const publicKey = extractRawECDHPublicKey(pair.publicKey);
    const privateKey = extractRawECDHPrivateKey(pair.privateKey);
    return Promise.resolve({ publicKey, privateKey });
}
function keyPairFromRawECDHPrivateKey(privateKey) {
    const privateKeyObject = importRawECDHPrivateKey(privateKey);
    const publicKeyObject = crypto.createPublicKey(privateKeyObject);
    const publicKey = extractRawECDHPublicKey(publicKeyObject);
    return Promise.resolve({
        privateKey,
        publicKey,
    });
}
function deriveSharedECDHSecret(keyPair) {
    const publicKey = importRawECDHPublicKey(keyPair.publicKey);
    const privateKey = importRawECDHPrivateKey(keyPair.privateKey);
    const ret = crypto.diffieHellman({ publicKey, privateKey });
    return Promise.resolve(ret);
}
export const primitives = {
    randomBytes,
    encryptAES128ECB,
    encryptAES128CBC,
    encryptAES128OFB,
    decryptAES128OFB,
    encryptAES128CCM,
    decryptAES128CCM,
    decryptAES256CBC,
    digest,
    generateECDHKeyPair,
    keyPairFromRawECDHPrivateKey,
    deriveSharedECDHSecret,
};
//# sourceMappingURL=primitives.node.js.map