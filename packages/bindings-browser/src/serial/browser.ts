import { type ZWaveSerialBindingFactory } from "@zwave-js/serial";
import { BytesView } from "@zwave-js/shared";

export function createWebSerialPortFactory(
	port: SerialPort,
): ZWaveSerialBindingFactory {
	let writer: WritableStreamDefaultWriter<BytesView> | undefined;

	const sink: UnderlyingSink<BytesView> = {
		async close() {
			writer?.releaseLock();
			// Cancel and release the reader lock before returning. The port
			// itself is intentionally not closed here — its lifecycle is managed
			// externally. If sink.close() called port.close() while source.start()
			// still holds the reader lock it would throw "Cannot cancel a locked
			// stream", and closing the port here would also prevent the binding
			// from being reused across driver restarts.
			const r = reader;
			reader = undefined;
			await r?.cancel();
			r?.releaseLock();
		},
		async write(chunk) {
			writer ??= port.writable!.getWriter();
			await writer.write(chunk);
		},
	};

	let reader: ReadableStreamDefaultReader<BytesView> | undefined;

	const source: UnderlyingDefaultSource<BytesView> = {
		async start(controller) {
			reader = port.readable!.getReader() as ReadableStreamDefaultReader<
				BytesView
			>;
			try {
				while (true) {
					const { value, done } = await reader.read();
					if (done) {
						break;
					}
					controller.enqueue(value);
				}
			} finally {
				reader.releaseLock();
			}
		},
		async cancel() {
			await reader?.cancel();
		},
	};

	// Apparently the types flip-flop between being compatible and not being compatible
	// between the node and browser versions of the Web Streams API
	return () => Promise.resolve({ source, sink }) as any;
}
