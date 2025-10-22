// A pseudo-random number generator using AES-ECB as described in NIST SP 800-90A
// This does not implement the full standard, but only the necessary subset needed for Z-Wave Security S2

// The used crypto primitives are async, so the methods in this implementation are async as well

import type { BytesView } from "@zwave-js/shared";
import { encryptAES128ECB } from "../crypto/index.js";
import { increment, xor } from "../crypto/shared.js";

// Warning: This code expects ctr_len to equal BLOCK_LEN.
// See specification on how to handle other cases

const KEY_LEN = 16;
const BLOCK_LEN = 16;
const SEED_LEN = KEY_LEN + BLOCK_LEN;

export class CtrDRBG {
	private key = new Uint8Array(KEY_LEN);
	private v = new Uint8Array(BLOCK_LEN);
	// Reseed counter is not used

	public saveState(): { key: BytesView; v: BytesView } {
		return { key: Uint8Array.from(this.key), v: Uint8Array.from(this.v) };
	}

	public restoreState(state: { key: BytesView; v: BytesView }): void {
		this.key = state.key;
		this.v = state.v;
	}

	public async init(
		entropy: BytesView,
		personalizationString?: BytesView,
	): Promise<void> {
		if (entropy.length !== SEED_LEN) {
			throw new Error(`entropy must be ${SEED_LEN} bytes long`);
		}

		if (personalizationString) {
			if (personalizationString.length > SEED_LEN) {
				throw new Error("Personalization string is too long.");
			}
			for (let i = 0; i < personalizationString.length; i++) {
				entropy[i] ^= personalizationString[i];
			}
		}

		await this.update(entropy);
	}

	public async update(providedData: BytesView | undefined): Promise<void> {
		if (providedData && providedData.length !== SEED_LEN) {
			throw new Error(`providedData must be ${SEED_LEN} bytes long`);
		}

		let temp = new Uint8Array(SEED_LEN);
		let tempOffset = 0;
		while (tempOffset < SEED_LEN) {
			increment(this.v);
			const encrypted = await encryptAES128ECB(this.v, this.key);
			// We know that we're only dealing with full blocks here, otherwise
			// the following line may throw when trying to set a too long last block
			temp.set(encrypted, tempOffset);
			tempOffset += BLOCK_LEN;
		}

		if (providedData) {
			temp = xor(temp, providedData);
		}

		this.key = temp.subarray(0, KEY_LEN);
		this.v = temp.subarray(KEY_LEN);
	}

	public async generate(len: number): Promise<BytesView> {
		// Additional input is not used
		const temp = new Uint8Array(Math.ceil(len / BLOCK_LEN) * BLOCK_LEN);
		let tempOffset = 0;
		while (tempOffset < len) {
			increment(this.v);
			const encrypted = await encryptAES128ECB(this.v, this.key);
			// The size of temp is a multiple of the block size, so this is safe to do:
			temp.set(encrypted, tempOffset);
			tempOffset += BLOCK_LEN;
		}

		await this.update(undefined);

		return temp.subarray(0, len);
	}

	protected async reseed(entropy: BytesView): Promise<void> {
		// Reseeding isn't necessary for this implementation, but all test vectors use it
		await this.update(entropy);
	}
}
