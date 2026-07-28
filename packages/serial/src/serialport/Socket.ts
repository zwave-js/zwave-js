import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import type { BytesView } from "@zwave-js/shared";
import type { UnderlyingSink, UnderlyingSource } from "node:stream/web";
import type { SocketConnect } from "./Bindings.js";
import type { ZWaveSerialBindingFactory } from "./ZWaveSerialStream.js";

/** The version of the Z-Wave serial binding factory for controllers that are reachable over a socket */
export function createSocketFactory(
	connect: SocketConnect,
	host: string,
	port: number,
): ZWaveSerialBindingFactory {
	return async function() {
		const socket = await connect({
			host,
			port,
			timeout: 5000,
			// During testing, values below 1000 caused the keep alive functionality to silently fail
			keepAliveInterval: 1000,
			// Prevent communication delays
			noDelay: true,
		});

		let isOpen = true;
		const writer = socket.writable.getWriter();
		const reader = socket.readable.getReader();

		async function close(): Promise<void> {
			isOpen = false;
			await socket.close();
		}

		const sink: UnderlyingSink<BytesView> = {
			async write(data, controller) {
				if (!isOpen) {
					controller.error(new Error("The serial port is not open!"));
					return;
				}

				await writer.write(data);
			},
			close() {
				return close();
			},
			abort(_reason) {
				return close();
			},
		};

		const source: UnderlyingSource<BytesView> = {
			async start(controller) {
				// Reading only ends when the connection is gone, so this keeps
				// running in the background for the lifetime of the socket
				try {
					while (true) {
						const { value, done } = await reader.read();
						if (done) break;
						controller.enqueue(value);
					}
				} catch {
					// Both an error and the end of the stream mean the connection is gone
				}

				if (isOpen) {
					isOpen = false;
					controller.error(
						new ZWaveError(
							`The serial port closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				}
			},
			cancel() {
				return reader.cancel();
			},
		};

		return { source, sink };
	};
}
