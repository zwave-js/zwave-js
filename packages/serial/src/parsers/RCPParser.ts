import { Bytes } from "@zwave-js/shared";
import { type Transformer } from "node:stream/web";
import type { SerialLogger } from "../log/Logger.js";
import { MessageHeaders } from "../message/MessageHeaders.js";
import {
	type RCPChunk,
	type RCPSerialFrame,
	RCPSerialFrameType,
} from "./RCPSerialFrame.js";

/**
 * Checks if there's enough data in the buffer to deserialize a complete message
 */
function containsCompleteMessage(data?: Uint8Array): boolean {
	return !!data && data.length >= 5 && data.length >= getMessageLength(data);
}

/** Given a buffer that starts with SOF, this method returns the number of bytes the first message occupies in the buffer */
function getMessageLength(data: Uint8Array): number {
	const remainingLength = data[1];
	return remainingLength + 2;
}

type RCPParserTransformerOutput = RCPSerialFrame & {
	type:
		| RCPSerialFrameType.RCP
		| RCPSerialFrameType.Discarded;
};

function wrapRCPChunk(
	chunk: RCPChunk,
): RCPParserTransformerOutput {
	return {
		type: RCPSerialFrameType.RCP,
		data: chunk,
	};
}

class RCPParserTransformer implements
	Transformer<
		Uint8Array,
		RCPParserTransformerOutput
	>
{
	constructor(private logger?: SerialLogger) {}

	private receiveBuffer = new Bytes();

	// Allow ignoring the high nibble of an ACK once to work around an issue in the 700 series firmware
	public ignoreAckHighNibble: boolean = false;

	transform(
		chunk: Uint8Array,
		controller: TransformStreamDefaultController<
			RCPParserTransformerOutput
		>,
	) {
		this.receiveBuffer = Bytes.concat([this.receiveBuffer, chunk]);

		while (this.receiveBuffer.length > 0) {
			if (this.receiveBuffer[0] !== MessageHeaders.SOF) {
				let skip = 1;

				switch (this.receiveBuffer[0]) {
					// Emit the single-byte messages directly
					case MessageHeaders.ACK: {
						this.logger?.ACK("inbound");
						controller.enqueue(
							wrapRCPChunk(MessageHeaders.ACK),
						);
						this.ignoreAckHighNibble = false;
						break;
					}
					case MessageHeaders.NAK: {
						this.logger?.NAK("inbound");
						controller.enqueue(
							wrapRCPChunk(MessageHeaders.NAK),
						);
						break;
					}
					// case MessageHeaders.CAN: {
					// 	this.logger?.CAN("inbound");
					// 	controller.enqueue(
					// 		wrapRCPChunk(MessageHeaders.CAN),
					// 	);
					// 	break;
					// }
					default: {
						// Scan ahead until the next valid byte and log the invalid bytes
						while (skip < this.receiveBuffer.length) {
							const byte = this.receiveBuffer[skip];
							if (
								byte === MessageHeaders.SOF
								|| byte === MessageHeaders.ACK
								|| byte === MessageHeaders.NAK
								// || byte === MessageHeaders.CAN
							) {
								// Next byte is valid, keep it
								break;
							}
							skip++;
						}
						const discarded = this.receiveBuffer.subarray(0, skip);
						this.logger?.discarded(discarded);
						controller.enqueue({
							type: RCPSerialFrameType.Discarded,
							data: discarded,
						});
					}
				}
				// Continue with the next valid byte
				this.receiveBuffer = this.receiveBuffer.subarray(skip);
				continue;
			}

			if (!containsCompleteMessage(this.receiveBuffer)) {
				// The buffer contains no complete message, we're done here for now
				break;
			} else {
				// We have at least one complete message
				const msgLength = getMessageLength(this.receiveBuffer);
				// emit it and slice the read bytes from the buffer
				const msg = this.receiveBuffer.subarray(0, msgLength);
				this.receiveBuffer = this.receiveBuffer.subarray(msgLength);

				this.logger?.data("inbound", msg);
				controller.enqueue(wrapRCPChunk(msg));
			}
		}
	}
}
export class RCPParser extends TransformStream {
	constructor(
		logger?: SerialLogger,
	) {
		const transformer = new RCPParserTransformer(logger);
		super(transformer);
		this.#transformer = transformer;
	}

	#transformer: RCPParserTransformer;
}
