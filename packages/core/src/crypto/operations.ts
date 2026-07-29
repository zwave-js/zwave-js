import { Bytes, type BytesView } from "@zwave-js/shared";
import type { CryptoPrimitives } from "@zwave-js/shared/bindings";
import { BLOCK_SIZE, leftShift1, xor, zeroPad } from "./shared.js";

// Import the correct primitives based on the environment
import { primitives as defaultPrimitives } from "#crypto_primitives";

// Re-exported as mutable bindings, so importers observe a replaced implementation
// without an extra layer of wrapper functions in front of every operation
export let randomBytes: CryptoPrimitives["randomBytes"];
export let encryptAES128ECB: CryptoPrimitives["encryptAES128ECB"];
export let encryptAES128CBC: CryptoPrimitives["encryptAES128CBC"];
export let encryptAES128OFB: CryptoPrimitives["encryptAES128OFB"];
export let decryptAES128OFB: CryptoPrimitives["decryptAES128OFB"];
export let decryptAES256CBC: CryptoPrimitives["decryptAES256CBC"];
export let encryptAES256OFB: CryptoPrimitives["encryptAES256OFB"];
export let decryptAES256OFB: CryptoPrimitives["decryptAES256OFB"];
export let encryptAES128CCM: CryptoPrimitives["encryptAES128CCM"];
export let decryptAES128CCM: CryptoPrimitives["decryptAES128CCM"];
export let digest: CryptoPrimitives["digest"];
export let hmacSHA256: CryptoPrimitives["hmacSHA256"];
export let encryptChaCha20Poly1305: CryptoPrimitives["encryptChaCha20Poly1305"];
export let decryptChaCha20Poly1305: CryptoPrimitives["decryptChaCha20Poly1305"];
export let generateECDHKeyPair: CryptoPrimitives["generateECDHKeyPair"];
export let keyPairFromRawECDHPrivateKey:
	CryptoPrimitives["keyPairFromRawECDHPrivateKey"];
export let deriveSharedECDHSecret: CryptoPrimitives["deriveSharedECDHSecret"];

/**
 * Replaces the crypto implementation used for all Z-Wave related cryptographic operations.
 * Since crypto is a property of the runtime rather than of a Z-Wave network, this affects
 * the entire process and must be called before any crypto operation happens.
 */
export function setCryptoPrimitives(impl: CryptoPrimitives): void {
	// Bound to the implementation, so a host may pass an object whose methods use `this`
	randomBytes = impl.randomBytes.bind(impl);
	encryptAES128ECB = impl.encryptAES128ECB.bind(impl);
	encryptAES128CBC = impl.encryptAES128CBC.bind(impl);
	encryptAES128OFB = impl.encryptAES128OFB.bind(impl);
	decryptAES128OFB = impl.decryptAES128OFB.bind(impl);
	decryptAES256CBC = impl.decryptAES256CBC.bind(impl);
	encryptAES256OFB = impl.encryptAES256OFB.bind(impl);
	decryptAES256OFB = impl.decryptAES256OFB.bind(impl);
	encryptAES128CCM = impl.encryptAES128CCM.bind(impl);
	decryptAES128CCM = impl.decryptAES128CCM.bind(impl);
	digest = impl.digest.bind(impl);
	hmacSHA256 = impl.hmacSHA256.bind(impl);
	encryptChaCha20Poly1305 = impl.encryptChaCha20Poly1305.bind(impl);
	decryptChaCha20Poly1305 = impl.decryptChaCha20Poly1305.bind(impl);
	generateECDHKeyPair = impl.generateECDHKeyPair.bind(impl);
	keyPairFromRawECDHPrivateKey = impl.keyPairFromRawECDHPrivateKey.bind(impl);
	deriveSharedECDHSecret = impl.deriveSharedECDHSecret.bind(impl);
}

setCryptoPrimitives(defaultPrimitives);

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
