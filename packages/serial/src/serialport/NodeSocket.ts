import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { BytesView } from "@zwave-js/shared";
import net from "node:net";
import type { UnderlyingSink, UnderlyingSource } from "node:stream/web";
import type { ZWaveSerialBindingFactory } from "./ZWaveSerialStream.js";
import type { ZWaveSocketOptions } from "./ZWaveSocketOptions.js";

export function createNodeSocketFactory(
	socketOptions: ZWaveSocketOptions,
): ZWaveSerialBindingFactory {
	return async function() {
		const socket = new net.Socket();
		const timeout = 5000;

		function removeListeners() {
			socket.removeAllListeners("close");
			socket.removeAllListeners("error");
			socket.removeAllListeners("timeout");
			socket.removeAllListeners("open");
		}

		function open(): Promise<void> {
			return new Promise((resolve, reject) => {
				const onClose = () => {
					removeListeners();
					// Destroy the socket to prevent further connection attempts
					socket.destroy();
					// detect socket disconnection errors
					reject(
						new ZWaveError(
							`The socket closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				};

				const onError = (err: Error) => {
					removeListeners();
					socket.destroy();
					reject(err);
				};

				const onTimeout = () => {
					removeListeners();
					socket.destroy();
					reject(
						new ZWaveError(
							`Connection timed out after ${timeout}ms`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				};

				const onConnect = () => {
					// During testing, values below 1000 caused the keep alive functionality to silently fail
					socket.setKeepAlive(true, 1000);
					// Prevent communication delays
					socket.setNoDelay();

					removeListeners();
					resolve();
				};

				socket.setTimeout(timeout);
				socket.once("close", onClose);
				socket.once("error", onError);
				socket.once("timeout", onTimeout);
				socket.once("connect", onConnect);

				socket.connect(socketOptions);
			});
		}

		function close(): Promise<void> {
			return new Promise((resolve) => {
				removeListeners();
				if (socket.destroyed) {
					resolve();
				} else {
					socket.once("close", () => resolve()).destroy();
				}
			});
		}

		await open();
		let isOpen = true;

		// Once the socket is opened, wrap it as web streams.
		// This could be done in the start method of the sink, but handling async errors is a pain there.

		const sink: UnderlyingSink<BytesView> = {
			write(data, controller) {
				if (!isOpen) {
					controller.error(new Error("The serial port is not open!"));
				}

				return new Promise((resolve, reject) => {
					socket.write(data, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
			},
			close() {
				return close();
			},
			abort(_reason) {
				return close();
			},
		};

		const source: UnderlyingSource<BytesView> = {
			start(controller) {
				socket.on("data", (data) => controller.enqueue(data));
				// Abort source controller too if the serial port closes
				socket.on("close", () => {
					isOpen = false;
					controller.error(
						new ZWaveError(
							`The serial port closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				});
				socket.on("error", (_e) => {
					isOpen = false;
					controller.error(
						new ZWaveError(
							`The serial port closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				});
			},
			cancel() {
				socket.removeAllListeners();
			},
		};

		return { source, sink };
	};
}
