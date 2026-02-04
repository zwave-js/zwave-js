import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import type { Transformer } from "node:stream/web";
import { NOISE_INDICATOR, decodeNoiseFrame } from "../noise/NoiseProtocol.js";

class NoiseFrameParserTransformer implements Transformer<BytesView, Bytes> {
	private receiveBuffer = new Bytes();

	transform(
		chunk: BytesView,
		controller: TransformStreamDefaultController<Bytes>,
	) {
		this.receiveBuffer = Bytes.concat([this.receiveBuffer, chunk]);

		while (this.receiveBuffer.length > 0) {
			try {
				// Check if we have enough data for the basic header
				if (this.receiveBuffer.length < 3) {
					break; // Need more data
				}

				// Check frame indicator
				if (this.receiveBuffer[0] !== NOISE_INDICATOR) {
					throw new ZWaveError(
						`Invalid frame indicator: expected 0x01, got 0x${
							this.receiveBuffer[0].toString(16).padStart(2, "0")
						}`,
						ZWaveErrorCodes.PacketFormat_Invalid,
					);
				}

				// Decode the Noise frame
				const { payload, bytesRead } = decodeNoiseFrame(
					this.receiveBuffer,
				);

				// Emit the raw payload (not decrypted)
				controller.enqueue(payload);

				// Remove processed frame from buffer
				this.receiveBuffer = this.receiveBuffer.subarray(bytesRead);
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
}

/**
 * Transform stream that parses Noise frames from raw socket data.
 * Input: Raw BytesView chunks from socket
 * Output: Raw Noise frame payloads (not decrypted)
 *
 * Frame format: [0x01][2-byte BE length][payload]
 */
export class NoiseFrameParser extends TransformStream<BytesView, Bytes> {
	constructor() {
		super(new NoiseFrameParserTransformer());
	}
}
