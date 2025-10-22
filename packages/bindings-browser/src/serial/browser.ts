import { type ZWaveSerialBindingFactory } from "@zwave-js/serial";
import { BytesView } from "@zwave-js/shared";

export function createWebSerialPortFactory(
	port: SerialPort,
): ZWaveSerialBindingFactory {
	let writer: WritableStreamDefaultWriter<BytesView> | undefined;

	const sink: UnderlyingSink<BytesView> = {
		close() {
			writer?.releaseLock();
			port.close();
		},
		async write(chunk) {
			writer ??= port.writable!.getWriter();
			await writer.write(chunk);
		},
	};

	let reader: ReadableStreamDefaultReader<BytesView> | undefined;

	const source: UnderlyingDefaultSource<BytesView> = {
		async start(controller) {
			reader = port.readable!.getReader() as ReadableStreamDefaultReader<BytesView>;
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
