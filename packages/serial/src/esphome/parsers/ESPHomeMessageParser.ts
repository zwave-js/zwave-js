import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import type { Transformer } from "node:stream/web";
import { ESPHomeMessage } from "../ESPHomeMessage.js";

export interface ESPHomeMessageParserOptions {
	/**
	 * When true, parse Noise-decrypted data format: [2-byte BE type][2-byte BE len][payload]
	 * When false (default), parse plaintext frame format: [0x00][VarInt...][payload]
	 */
	noiseMode?: boolean;
}

class ESPHomeMessageParserTransformer
	implements Transformer<BytesView, ESPHomeMessage>
{
	private receiveBuffer = new Bytes();
	private noiseMode: boolean;

	constructor(options: ESPHomeMessageParserOptions = {}) {
		this.noiseMode = options.noiseMode ?? false;
	}

	transform(
		chunk: BytesView,
		controller: TransformStreamDefaultController<ESPHomeMessage>,
	) {
		this.receiveBuffer = Bytes.concat([this.receiveBuffer, chunk]);

		while (this.receiveBuffer.length > 0) {
			try {
				if (this.noiseMode) {
					this.parseNoiseMessage(controller);
				} else {
					this.parsePlaintextMessage(controller);
				}
			} catch (error) {
				// If we can't decode a complete frame yet, wait for more data
				if (
					error instanceof ZWaveError
					&& error.code === ZWaveErrorCodes.PacketFormat_Truncated
				) {
					break;
				}
				// For other errors, reset the buffer and continue
				this.receiveBuffer = new Bytes();
				break;
			}
		}
	}

	/**
	 * Parse plaintext ESPHome message format: [0x00][VarInt size][VarInt type][payload]
	 */
	private parsePlaintextMessage(
		controller: TransformStreamDefaultController<ESPHomeMessage>,
	): void {
		const { message, bytesRead } = ESPHomeMessage.parse(this.receiveBuffer);
		this.receiveBuffer = this.receiveBuffer.subarray(bytesRead);
		controller.enqueue(message);
	}

	/**
	 * Parse Noise-decrypted message format: [2-byte BE type][2-byte BE len][payload]
	 */
	private parseNoiseMessage(
		controller: TransformStreamDefaultController<ESPHomeMessage>,
	): void {
		const { message, bytesRead } = ESPHomeMessage.parseFromNoise(
			this.receiveBuffer,
		);
		this.receiveBuffer = this.receiveBuffer.subarray(bytesRead);
		controller.enqueue(message);
	}
}

/**
 * Transform stream that parses ESPHome messages.
 * Input: Raw BytesView chunks (plaintext) or decrypted data (noise mode)
 * Output: ESPHomeMessage instances
 *
 * Supports two modes:
 * - Plaintext (default): Parses frames with format [0x00][VarInt size][VarInt type][payload]
 * - Noise mode: Parses decrypted data with format [2-byte BE type][2-byte BE len][payload]
 */
export class ESPHomeMessageParser extends TransformStream<
	BytesView,
	ESPHomeMessage
> {
	constructor(options: ESPHomeMessageParserOptions = {}) {
		super(new ESPHomeMessageParserTransformer(options));
	}
}
