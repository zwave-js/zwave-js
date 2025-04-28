import { wait } from "alcalzone-shared/async";
import type { UnderlyingSink, UnderlyingSource } from "node:stream/web";
import {
	type ZWaveSerialBindingFactory,
	type ZWaveSerialStream,
	ZWaveSerialStreamFactory,
} from "../serialport/ZWaveSerialStream.js";

export class MockPort {
	public constructor() {
		const { readable, writable: sink } = new TransformStream<Uint8Array>();
		this.#sink = sink;
		this.readable = readable;
	}

	/** How long each write operation should take */
	public writeDelay: number = 0;

	// Remembers the last written data
	public lastWrite: Uint8Array | undefined;

	// Internal stream to allow emitting data from the port
	#sourceController: ReadableStreamDefaultController<Uint8Array> | undefined;

	// Public readable stream to allow handling the written data
	#sink: WritableStream<Uint8Array>;
	/** Exposes the data written by the host as a readable stream */
	public readonly readable: ReadableStream<Uint8Array>;

	public factory(): ZWaveSerialBindingFactory {
		return () => {
			let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
			const sink: UnderlyingSink<Uint8Array> = {
				write: async (chunk, _controller) => {
					// Remember the last written data
					this.lastWrite = chunk;
					// Only write to the sink if its readable side has a reader attached.
					// Otherwise, we get backpressure on the writable side of the mock port
					if (this.readable.locked) {
						writer ??= this.#sink.getWriter();
						// Simulate a slow write if necessary
						if (this.writeDelay > 0) {
							await wait(this.writeDelay);
						}
						// This will finish immediately on the mock port
						await writer.write(chunk);
					}
				},
				close: () => {
					writer?.releaseLock();
				},
			};

			const source: UnderlyingSource<Uint8Array> = {
				start: (controller) => {
					this.#sourceController = controller;
				},
			};

			return Promise.resolve({ sink, source });
		};
	}

	public emitData(data: Uint8Array): void {
		this.#sourceController?.enqueue(data);
	}

	public destroy(): void {
		try {
			this.#sourceController?.close();
			this.#sourceController = undefined;
		} catch {
			// Ignore - the controller might already be closed
		}
	}
}

export async function createAndOpenMockedZWaveSerialPort(): Promise<{
	port: MockPort;
	serial: ZWaveSerialStream;
}> {
	const port = new MockPort();
	const factory = new ZWaveSerialStreamFactory(
		port.factory(),
		(await import("@zwave-js/core/bindings/log/node")).log({
			enabled: false,
		}),
	);
	const serial = await factory.createStream();
	return { port, serial };
}
