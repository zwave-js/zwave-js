import { Bytes, type BytesView } from "@zwave-js/shared";
import type { CryptoPrimitives, KeyPair } from "@zwave-js/shared/bindings";
import { BLOCK_SIZE, leftShift1, xor, zeroPad } from "./shared.js";

// Import the correct primitives based on the environment
import { primitives as defaultPrimitives } from "#crypto_primitives";

// Crypto is a property of the runtime rather than of a Z-Wave network, so the implementation is
// process-global and shared by all drivers running in the same process
let primitives: CryptoPrimitives = defaultPrimitives;

/**
 * Replaces the crypto implementation used for all Z-Wave related cryptographic operations.
 * Since this affects the entire process, it must be called before any crypto operation happens.
 */
export function setCryptoPrimitives(impl: CryptoPrimitives): void {
	primitives = impl;
}

export function randomBytes(length: number): BytesView {
	return primitives.randomBytes(length);
}

/** Encrypts a payload using AES-128-ECB */
export function encryptAES128ECB(
	plaintext: BytesView,
	key: BytesView,
): Promise<BytesView> {
	return primitives.encryptAES128ECB(plaintext, key);
}

/** Encrypts a payload using AES-128-CBC */
export function encryptAES128CBC(
	plaintext: BytesView,
	key: BytesView,
	iv: BytesView,
): Promise<BytesView> {
	return primitives.encryptAES128CBC(plaintext, key, iv);
}

/** Encrypts a payload using AES-128-OFB */
export function encryptAES128OFB(
	plaintext: BytesView,
	key: BytesView,
	iv: BytesView,
): Promise<BytesView> {
	return primitives.encryptAES128OFB(plaintext, key, iv);
}

/** Decrypts a payload using AES-128-OFB */
export function decryptAES128OFB(
	ciphertext: BytesView,
	key: BytesView,
	iv: BytesView,
): Promise<BytesView> {
	return primitives.decryptAES128OFB(ciphertext, key, iv);
}

/** Decrypts a payload using AES-256-CBC */
export function decryptAES256CBC(
	ciphertext: BytesView,
	key: BytesView,
	iv: BytesView,
): Promise<BytesView> {
	return primitives.decryptAES256CBC(ciphertext, key, iv);
}

/** Encrypts a payload using AES-256-OFB */
export function encryptAES256OFB(
	plaintext: BytesView,
	key: BytesView,
	iv: BytesView,
): Promise<BytesView> {
	return primitives.encryptAES256OFB(plaintext, key, iv);
}

/** Decrypts a payload using AES-256-OFB */
export function decryptAES256OFB(
	ciphertext: BytesView,
	key: BytesView,
	iv: BytesView,
): Promise<BytesView> {
	return primitives.decryptAES256OFB(ciphertext, key, iv);
}

/** Encrypts and authenticates a payload using AES-128-CCM */
export function encryptAES128CCM(
	plaintext: BytesView,
	key: BytesView,
	iv: BytesView,
	additionalData: BytesView,
	authTagLength: number,
): Promise<{ ciphertext: BytesView; authTag: BytesView }> {
	return primitives.encryptAES128CCM(
		plaintext,
		key,
		iv,
		additionalData,
		authTagLength,
	);
}

/** Decrypts and verifies a payload using AES-128-CCM */
export function decryptAES128CCM(
	ciphertext: BytesView,
	key: BytesView,
	iv: BytesView,
	additionalData: BytesView,
	authTag: BytesView,
): Promise<{ plaintext: BytesView; authOK: boolean }> {
	return primitives.decryptAES128CCM(
		ciphertext,
		key,
		iv,
		additionalData,
		authTag,
	);
}

export function digest(
	algorithm: "md5" | "sha-1" | "sha-256",
	data: BytesView,
): Promise<BytesView> {
	return primitives.digest(algorithm, data);
}

/** Computes HMAC-SHA256 */
export function hmacSHA256(
	key: BytesView,
	data: BytesView,
): Promise<BytesView> {
	return primitives.hmacSHA256(key, data);
}

/** Encrypts and authenticates a payload using ChaCha20-Poly1305 */
export function encryptChaCha20Poly1305(
	key: BytesView,
	nonce: BytesView,
	additionalData: BytesView,
	plaintext: BytesView,
): Promise<{ ciphertext: BytesView; authTag: BytesView }> {
	return primitives.encryptChaCha20Poly1305(
		key,
		nonce,
		additionalData,
		plaintext,
	);
}

/** Decrypts and verifies a payload using ChaCha20-Poly1305 */
export function decryptChaCha20Poly1305(
	key: BytesView,
	nonce: BytesView,
	additionalData: BytesView,
	ciphertext: BytesView,
	authTag: BytesView,
): Promise<{ plaintext: BytesView; authOK: boolean }> {
	return primitives.decryptChaCha20Poly1305(
		key,
		nonce,
		additionalData,
		ciphertext,
		authTag,
	);
}

/** Generates an x25519 / ECDH key pair */
export function generateECDHKeyPair(): Promise<KeyPair> {
	return primitives.generateECDHKeyPair();
}

/** Expand an x25519 / ECDH private key into the full key pair */
export function keyPairFromRawECDHPrivateKey(
	privateKey: BytesView,
): Promise<KeyPair> {
	return primitives.keyPairFromRawECDHPrivateKey(privateKey);
}

/** Derives the shared ECDH secret from an x25519 / ECDH key pair */
export function deriveSharedECDHSecret(keyPair: KeyPair): Promise<BytesView> {
	return primitives.deriveSharedECDHSecret(keyPair);
}

const Z128 = new Uint8Array(16).fill(0);
const R128 = Bytes.from("00000000000000000000000000000087", "hex");
const constantPRK = new Uint8Array(16).fill(0x33);
const constantTE = new Uint8Array(15).fill(0x88);
const constantNK = new Uint8Array(15).fill(0x55);
const constantNonce = new Uint8Array(16).fill(0x26);
const constantEI = new Uint8Array(15).fill(0x88);

/** Computes a message authentication code for Security S0 (as described in SDS10865) */
export async function computeMAC(
	authData: BytesView,
	key: BytesView,
	iv: BytesView = new Uint8Array(BLOCK_SIZE).fill(0),
): Promise<BytesView> {
	const ciphertext = await encryptAES128CBC(authData, key, iv);
	// The MAC is the first 8 bytes of the last 16 byte block
	return ciphertext.subarray(ciphertext.length - BLOCK_SIZE).subarray(0, 8);
}

async function generateAES128CMACSubkeys(
	key: BytesView,
): Promise<[k1: BytesView, k2: BytesView]> {
	// NIST SP 800-38B, chapter 6.1
	const L = await encryptAES128ECB(Z128, key);
	const k1 = !(L[0] & 0x80) ? leftShift1(L) : xor(leftShift1(L), R128);
	const k2 = !(k1[0] & 0x80) ? leftShift1(k1) : xor(leftShift1(k1), R128);
	return [k1, k2];
}

/** Computes a message authentication code for Security S2 (as described in SDS13783) */
export async function computeCMAC(
	message: BytesView,
	key: BytesView,
): Promise<BytesView> {
	const blockSize = 16;
	const numBlocks = Math.ceil(message.length / blockSize);
	let lastBlock = message.subarray((numBlocks - 1) * blockSize);
	const lastBlockIsComplete = message.length > 0
		&& message.length % blockSize === 0;
	if (!lastBlockIsComplete) {
		lastBlock = zeroPad(
			Bytes.concat([lastBlock, [0x80]]),
			blockSize,
		).output;
	}

	// Compute all steps but the last one
	let ret = Z128;
	for (let i = 0; i < numBlocks - 1; i++) {
		ret = xor(ret, message.subarray(i * blockSize, (i + 1) * blockSize));
		ret = await encryptAES128ECB(ret, key);
	}
	// Compute the last step
	const [k1, k2] = await generateAES128CMACSubkeys(key);
	ret = xor(ret, xor(lastBlockIsComplete ? k1 : k2, lastBlock));
	ret = await encryptAES128ECB(ret, key);

	return ret.subarray(0, blockSize);
}

/** Computes the Pseudo Random Key (PRK) used to derive auth, encryption and nonce keys */
export function computePRK(
	ecdhSharedSecret: BytesView,
	pubKeyA: BytesView,
	pubKeyB: BytesView,
): Promise<BytesView> {
	const message = Bytes.concat([ecdhSharedSecret, pubKeyA, pubKeyB]);
	return computeCMAC(message, constantPRK);
}

/** Derives the temporary auth, encryption and nonce keys from the PRK */
export async function deriveTempKeys(
	PRK: BytesView,
): Promise<{ tempKeyCCM: BytesView; tempPersonalizationString: BytesView }> {
	const T1 = await computeCMAC(
		Bytes.concat([constantTE, [0x01]]),
		PRK,
	);
	const T2 = await computeCMAC(
		Bytes.concat([T1, constantTE, [0x02]]),
		PRK,
	);
	const T3 = await computeCMAC(
		Bytes.concat([T2, constantTE, [0x03]]),
		PRK,
	);
	return {
		tempKeyCCM: T1,
		tempPersonalizationString: Bytes.concat([T2, T3]),
	};
}

/** Derives the CCM, MPAN keys and the personalization string from the permanent network key (PNK) */
export async function deriveNetworkKeys(
	PNK: BytesView,
): Promise<
	{
		keyCCM: BytesView;
		keyMPAN: BytesView;
		personalizationString: BytesView;
	}
> {
	const T1 = await computeCMAC(
		Bytes.concat([constantNK, [0x01]]),
		PNK,
	);
	const T2 = await computeCMAC(
		Bytes.concat([T1, constantNK, [0x02]]),
		PNK,
	);
	const T3 = await computeCMAC(
		Bytes.concat([T2, constantNK, [0x03]]),
		PNK,
	);
	const T4 = await computeCMAC(
		Bytes.concat([T3, constantNK, [0x04]]),
		PNK,
	);
	return {
		keyCCM: T1,
		keyMPAN: T4,
		personalizationString: Bytes.concat([T2, T3]),
	};
}

/** Computes the Pseudo Random Key (PRK) used to derive the mixed entropy input (MEI) for nonce generation */
export function computeNoncePRK(
	senderEI: BytesView,
	receiverEI: BytesView,
): Promise<BytesView> {
	const message = Bytes.concat([senderEI, receiverEI]);
	return computeCMAC(message, constantNonce);
}

/** Derives the MEI from the nonce PRK */
export async function deriveMEI(noncePRK: BytesView): Promise<BytesView> {
	const T1 = await computeCMAC(
		Bytes.concat([
			constantEI,
			[0x00],
			constantEI,
			[0x01],
		]),
		noncePRK,
	);
	const T2 = await computeCMAC(
		Bytes.concat([T1, constantEI, [0x02]]),
		noncePRK,
	);
	return Bytes.concat([T1, T2]);
}
