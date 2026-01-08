/**
 * ESPHome Noise Protocol Implementation
 *
 * Implements the Noise_NNpsk0_25519_ChaChaPoly_SHA256 handshake pattern
 * for encrypted communication with ESPHome devices.
 *
 * Reference: https://noiseprotocol.org/noise.html
 */

import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import {
	decryptChaCha20Poly1305,
	deriveSharedECDHSecret,
	digest,
	encryptChaCha20Poly1305,
	generateECDHKeyPair,
	hmacSHA256,
} from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import type { KeyPair } from "@zwave-js/shared/bindings";

// ============================================================================
// Constants
// ============================================================================

export const NOISE_INDICATOR = 0x01;
export const PLAINTEXT_INDICATOR = 0x00;
const NOISE_PROTOCOL_NAME = "Noise_NNpsk0_25519_ChaChaPoly_SHA256";
const NOISE_PROLOGUE = Bytes.from("NoiseAPIInit\x00\x00");
const TAG_SIZE = 16;

// ============================================================================
// Frame Codec
// ============================================================================

export interface ServerHello {
	protocolVersion: number;
	deviceName: string;
	macAddress: string;
}

/**
 * Parse the ServerHello message sent by ESPHome during Noise handshake
 */
export function parseServerHello(data: BytesView): ServerHello {
	if (data.length < 1) {
		throw new ZWaveError(
			"ServerHello too short",
			ZWaveErrorCodes.PacketFormat_Truncated,
		);
	}

	const protocolVersion = data[0];

	// Find null-terminated strings
	let offset = 1;
	let deviceNameEnd = offset;
	while (deviceNameEnd < data.length && data[deviceNameEnd] !== 0) {
		deviceNameEnd++;
	}
	const deviceName = new TextDecoder().decode(
		data.subarray(offset, deviceNameEnd),
	);

	offset = deviceNameEnd + 1;
	let macAddressEnd = offset;
	while (macAddressEnd < data.length && data[macAddressEnd] !== 0) {
		macAddressEnd++;
	}
	const macAddress = new TextDecoder().decode(
		data.subarray(offset, macAddressEnd),
	);

	return { protocolVersion, deviceName, macAddress };
}

/**
 * Encode a Noise frame with indicator and size header
 */
export function encodeNoiseFrame(payload: BytesView): Bytes {
	const frame = new Bytes(3 + payload.length);
	frame[0] = NOISE_INDICATOR;
	frame[1] = (payload.length >> 8) & 0xff;
	frame[2] = payload.length & 0xff;
	frame.set(payload, 3);
	return frame;
}

/**
 * Decode a Noise frame, extracting the payload
 * Returns the payload and number of bytes consumed
 */
export function decodeNoiseFrame(
	data: BytesView,
): { payload: Bytes; bytesRead: number } {
	if (data.length < 3) {
		throw new ZWaveError(
			"Noise frame too short",
			ZWaveErrorCodes.PacketFormat_Truncated,
		);
	}

	if (data[0] !== NOISE_INDICATOR) {
		throw new ZWaveError(
			`Invalid Noise frame indicator: expected 0x01, got 0x${
				data[0].toString(16).padStart(2, "0")
			}`,
			ZWaveErrorCodes.PacketFormat_Invalid,
		);
	}

	const payloadSize = (data[1] << 8) | data[2];
	const totalSize = 3 + payloadSize;

	if (data.length < totalSize) {
		throw new ZWaveError(
			"Noise frame truncated",
			ZWaveErrorCodes.PacketFormat_Truncated,
		);
	}

	const payload = Bytes.view(data.subarray(3, totalSize));
	return { payload, bytesRead: totalSize };
}

// ============================================================================
// HKDF Implementation
// ============================================================================

/**
 * HKDF as specified in the Noise protocol
 */
async function hkdf(
	chainingKey: BytesView,
	inputKeyMaterial: BytesView,
	numOutputs: 2 | 3,
): Promise<BytesView[]> {
	// HKDF-Extract
	const tempKey = await hmacSHA256(chainingKey, inputKeyMaterial);

	// HKDF-Expand
	const output1 = await hmacSHA256(tempKey, Bytes.from([0x01]));
	const output2 = await hmacSHA256(
		tempKey,
		Bytes.concat([output1, Bytes.from([0x02])]),
	);

	if (numOutputs === 2) {
		return [output1, output2];
	}

	const output3 = await hmacSHA256(
		tempKey,
		Bytes.concat([output2, Bytes.from([0x03])]),
	);
	return [output1, output2, output3];
}

// ============================================================================
// NoiseCipherState
// ============================================================================

/**
 * Cipher state for Noise protocol encryption/decryption
 */
export class NoiseCipherState {
	private k: Bytes | undefined;
	private n: bigint = 0n;

	/**
	 * Initialize the cipher with a key
	 */
	initializeKey(key: BytesView): void {
		this.k = Bytes.view(key);
		this.n = 0n;
	}

	/**
	 * Check if a key has been set
	 */
	hasKey(): boolean {
		return this.k !== undefined;
	}

	/**
	 * Get the current nonce as a 12-byte buffer (4 zero bytes + 8-byte LE counter)
	 */
	private getNonce(): Bytes {
		const nonce = new Bytes(12);
		const view = new DataView(nonce.buffer);
		// First 4 bytes are zero
		// Next 8 bytes are the counter in little-endian
		view.setBigUint64(4, this.n, true);
		return nonce;
	}

	/**
	 * Encrypt with associated data
	 */
	async encryptWithAd(ad: BytesView, plaintext: BytesView): Promise<Bytes> {
		if (!this.k) {
			// If no key, return plaintext unchanged
			return Bytes.view(plaintext);
		}

		const nonce = this.getNonce();
		const { ciphertext, authTag } = await encryptChaCha20Poly1305(
			this.k,
			nonce,
			ad,
			plaintext,
		);
		this.n++;

		return Bytes.concat([ciphertext, authTag]);
	}

	/**
	 * Decrypt with associated data
	 */
	async decryptWithAd(ad: BytesView, ciphertext: BytesView): Promise<Bytes> {
		if (!this.k) {
			// If no key, return ciphertext unchanged
			return Bytes.view(ciphertext);
		}

		if (ciphertext.length < TAG_SIZE) {
			throw new ZWaveError(
				"Ciphertext too short for authentication tag",
				ZWaveErrorCodes.PacketFormat_Invalid,
			);
		}

		const nonce = this.getNonce();
		const encryptedData = ciphertext.subarray(0, -TAG_SIZE);
		const authTag = ciphertext.subarray(-TAG_SIZE);

		const { plaintext, authOK } = await decryptChaCha20Poly1305(
			this.k,
			nonce,
			ad,
			encryptedData,
			authTag,
		);

		if (!authOK) {
			throw new ZWaveError(
				"Noise decryption failed: authentication tag mismatch",
				ZWaveErrorCodes.PacketFormat_Invalid,
			);
		}

		this.n++;
		return Bytes.view(plaintext);
	}
}

// ============================================================================
// NoiseSymmetricState
// ============================================================================

/**
 * Symmetric state for Noise protocol handshake
 */
export class NoiseSymmetricState {
	private ck: Bytes; // Chaining key
	private h: Bytes; // Handshake hash
	private cipherState: NoiseCipherState;

	private constructor(ck: Bytes, h: Bytes) {
		this.ck = ck;
		this.h = h;
		this.cipherState = new NoiseCipherState();
	}

	/**
	 * Initialize symmetric state with protocol name
	 */
	static async initialize(
		protocolName: string,
	): Promise<NoiseSymmetricState> {
		const nameBytes = new TextEncoder().encode(protocolName);
		let h: Bytes;

		if (nameBytes.length <= 32) {
			// Pad with zeros to 32 bytes
			h = new Bytes(32);
			h.set(nameBytes);
		} else {
			// Hash if longer than 32 bytes
			h = Bytes.view(await digest("sha-256", nameBytes));
		}

		return new NoiseSymmetricState(Bytes.view(h), Bytes.view(h));
	}

	/**
	 * Mix key material into the chaining key
	 */
	async mixKey(inputKeyMaterial: BytesView): Promise<void> {
		const [ck, tempK] = await hkdf(this.ck, inputKeyMaterial, 2);
		this.ck = Bytes.view(ck);
		this.cipherState.initializeKey(tempK);
	}

	/**
	 * Mix data into the handshake hash
	 */
	async mixHash(data: BytesView): Promise<void> {
		this.h = Bytes.view(
			await digest("sha-256", Bytes.concat([this.h, data])),
		);
	}

	/**
	 * Mix key and hash (for PSK)
	 */
	async mixKeyAndHash(inputKeyMaterial: BytesView): Promise<void> {
		const [ck, tempH, tempK] = await hkdf(this.ck, inputKeyMaterial, 3);
		this.ck = Bytes.view(ck);
		await this.mixHash(tempH);
		this.cipherState.initializeKey(tempK);
	}

	/**
	 * Encrypt and mix into hash
	 */
	async encryptAndHash(plaintext: BytesView): Promise<Bytes> {
		const ciphertext = await this.cipherState.encryptWithAd(
			this.h,
			plaintext,
		);
		await this.mixHash(ciphertext);
		return ciphertext;
	}

	/**
	 * Decrypt and mix into hash
	 */
	async decryptAndHash(ciphertext: BytesView): Promise<Bytes> {
		const plaintext = await this.cipherState.decryptWithAd(
			this.h,
			ciphertext,
		);
		await this.mixHash(ciphertext);
		return plaintext;
	}

	/**
	 * Split into two cipher states for transport
	 */
	async split(): Promise<{ c1: NoiseCipherState; c2: NoiseCipherState }> {
		const [tempK1, tempK2] = await hkdf(this.ck, new Bytes(0), 2);

		const c1 = new NoiseCipherState();
		c1.initializeKey(tempK1);

		const c2 = new NoiseCipherState();
		c2.initializeKey(tempK2);

		return { c1, c2 };
	}

	/**
	 * Get the current handshake hash (for debugging)
	 */
	getHandshakeHash(): Bytes {
		return this.h;
	}
}

// ============================================================================
// NoiseHandshakeState
// ============================================================================

/**
 * Handshake state implementing the NNpsk0 pattern for initiator (client)
 *
 * NNpsk0 pattern:
 *   -> psk, e
 *   <- e, ee
 */
export class NoiseHandshakeState {
	private symmetricState!: NoiseSymmetricState;
	private e: KeyPair | undefined; // Our ephemeral key pair
	private re: Bytes | undefined; // Remote ephemeral public key
	private psk: Bytes;
	private messageIndex = 0;
	private initialized = false;

	constructor(psk: BytesView) {
		this.psk = Bytes.view(psk);
	}

	/**
	 * Initialize the handshake state (must be called before writeMessage/readMessage)
	 */
	async initialize(): Promise<void> {
		this.symmetricState = await NoiseSymmetricState.initialize(
			NOISE_PROTOCOL_NAME,
		);
		await this.symmetricState.mixHash(NOISE_PROLOGUE);
		this.initialized = true;
	}

	/**
	 * Write the first handshake message: -> psk, e
	 */
	async writeMessage(payload: BytesView): Promise<Bytes> {
		if (!this.initialized) {
			await this.initialize();
		}

		if (this.messageIndex !== 0) {
			throw new ZWaveError(
				"Unexpected handshake message index",
				ZWaveErrorCodes.Driver_InvalidOptions,
			);
		}

		// psk token: mixKeyAndHash(psk)
		await this.symmetricState.mixKeyAndHash(this.psk);

		// e token: generate ephemeral key pair
		this.e = await generateECDHKeyPair();
		await this.symmetricState.mixHash(this.e.publicKey);
		await this.symmetricState.mixKey(this.e.publicKey);

		// Encrypt and send payload
		const encryptedPayload = await this.symmetricState.encryptAndHash(
			payload,
		);

		this.messageIndex++;

		// Message is: e.publicKey || encryptedPayload
		return Bytes.concat([this.e.publicKey, encryptedPayload]);
	}

	/**
	 * Read the second handshake message: <- e, ee
	 */
	async readMessage(message: BytesView): Promise<Bytes> {
		if (!this.initialized) {
			await this.initialize();
		}

		if (this.messageIndex !== 1) {
			throw new ZWaveError(
				"Unexpected handshake message index",
				ZWaveErrorCodes.Driver_InvalidOptions,
			);
		}

		// e token: read remote ephemeral public key (32 bytes for X25519)
		if (message.length < 32) {
			throw new ZWaveError(
				"Handshake message too short for ephemeral key",
				ZWaveErrorCodes.PacketFormat_Truncated,
			);
		}

		this.re = Bytes.view(message.subarray(0, 32));
		await this.symmetricState.mixHash(this.re);
		await this.symmetricState.mixKey(this.re);

		// ee token: compute DH(e, re)
		if (!this.e) {
			throw new ZWaveError(
				"Ephemeral key not initialized",
				ZWaveErrorCodes.Driver_InvalidOptions,
			);
		}

		const dhResult = await deriveSharedECDHSecret({
			privateKey: this.e.privateKey,
			publicKey: this.re,
		});
		await this.symmetricState.mixKey(dhResult);

		// Decrypt payload
		const encryptedPayload = message.subarray(32);
		const payload = await this.symmetricState.decryptAndHash(
			encryptedPayload,
		);

		this.messageIndex++;

		return payload;
	}

	/**
	 * Split into transport cipher states after handshake completion
	 */
	async split(): Promise<{
		sendCipher: NoiseCipherState;
		receiveCipher: NoiseCipherState;
	}> {
		if (this.messageIndex < 2) {
			throw new ZWaveError(
				"Handshake not complete",
				ZWaveErrorCodes.Driver_InvalidOptions,
			);
		}

		const { c1, c2 } = await this.symmetricState.split();

		// For initiator: c1 is for sending, c2 is for receiving
		return { sendCipher: c1, receiveCipher: c2 };
	}
}
