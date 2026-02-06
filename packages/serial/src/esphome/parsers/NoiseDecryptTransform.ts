import { Bytes, type BytesView } from "@zwave-js/shared";
import type { Transformer } from "node:stream/web";
import type { NoiseCipherState } from "../noise/NoiseProtocol.js";

class NoiseDecryptTransformer implements Transformer<BytesView, Bytes> {
	private receiveCipher: NoiseCipherState;

	constructor(receiveCipher: NoiseCipherState) {
		this.receiveCipher = receiveCipher;
	}

	// transform() is called sequentially by the stream API,
	// which ensures nonce synchronization without needing a processingQueue
	async transform(
		chunk: BytesView,
		controller: TransformStreamDefaultController<Bytes>,
	) {
		// Decrypt the payload
		const decrypted = await this.receiveCipher.decryptWithAd(
			new Bytes(0),
			chunk,
		);
		controller.enqueue(decrypted);
	}
}

/**
 * Transform stream that decrypts Noise frame payloads.
 * Input: Encrypted Noise frame payloads
 * Output: Decrypted data
 *
 * Requires cipher state from completed handshake.
 * The transform() method is called sequentially by the stream API,
 * which ensures nonce synchronization without needing a processingQueue.
 */
export class NoiseDecryptTransform extends TransformStream<BytesView, Bytes> {
	constructor(receiveCipher: NoiseCipherState) {
		super(new NoiseDecryptTransformer(receiveCipher));
	}
}
