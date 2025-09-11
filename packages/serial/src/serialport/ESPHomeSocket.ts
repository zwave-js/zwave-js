import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, buffer2hex } from "@zwave-js/shared";
import dayjs from "dayjs";
import net from "node:net";
import type { UnderlyingSink, UnderlyingSource } from "node:stream/web";
import {
	DeviceInfoRequest,
	DeviceInfoResponse,
	DisconnectRequest,
	ESPHomeMessage,
	ESPHomeMessageRaw,
	HelloRequest,
	HelloResponse,
	ZWaveProxyFrameFromDevice,
	ZWaveProxyFrameToDevice,
	ZWaveProxySubscribeRequest,
} from "../esphome/index.js";
import type { ZWaveSerialBindingFactory } from "./ZWaveSerialStream.js";

export interface ESPHomeSocketOptions {
	/** The hostname or IP address of the ESPHome device */
	host: string;
	/** The port number (default: 6053) */
	port?: number;
}

enum ConnectionState {
	Disconnected = "disconnected",
	Connecting = "connecting",
	HelloSent = "hello_sent",
	HelloReceived = "hello_received",
	DeviceInfoSent = "device_info_sent",
	DeviceInfoReceived = "device_info_received",
	Ready = "ready",
}

export function createESPHomeFactory(
	options: ESPHomeSocketOptions,
): ZWaveSerialBindingFactory {
	return async function() {
		const socket = new net.Socket();
		const host = options.host;
		const port = options.port ?? 6053;
		const timeout = 5000;

		let connectionState = ConnectionState.Disconnected;
		let deviceInfo: DeviceInfoResponse | undefined;
		let sourceController:
			| ReadableStreamDefaultController<Uint8Array>
			| undefined;

		// Buffer for incoming frame reassembly
		let frameBuffer = new Uint8Array(0);

		function removeListeners() {
			socket.removeAllListeners("close");
			socket.removeAllListeners("error");
			socket.removeAllListeners("connect");
			socket.removeAllListeners("timeout");
			socket.removeAllListeners("data");
		}

		function sendMessage(
			message:
				| HelloRequest
				| DeviceInfoRequest
				| DisconnectRequest
				| ZWaveProxyFrameToDevice,
		): Promise<void> {
			const frame = message.serialize();
			console.error(
				dayjs(new Date()).format("HH:mm:ss.SSS"),
				"OUTGOING:",
				buffer2hex(frame),
			);

			return new Promise((resolve, reject) => {
				socket.write(frame, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		}

		async function performHandshake(): Promise<void> {
			// Send HelloRequest
			connectionState = ConnectionState.HelloSent;
			const helloRequest = new HelloRequest({
				clientInfo: "zwave-js",
				apiVersionMajor: 1,
				apiVersionMinor: 0,
			});
			await sendMessage(helloRequest);

			// Wait for HelloResponse (handled in data event)
			await waitForState(ConnectionState.HelloReceived, timeout);

			// Send DeviceInfoRequest to check Z-Wave support
			connectionState = ConnectionState.DeviceInfoSent;
			const deviceInfoRequest = new DeviceInfoRequest();
			await sendMessage(deviceInfoRequest);

			// Wait for DeviceInfoResponse
			await waitForState(ConnectionState.DeviceInfoReceived, timeout);

			// Check if device supports Z-Wave proxy
			if (!deviceInfo?.hasZWaveProxySupport) {
				throw new ZWaveError(
					"ESPHome device does not support Z-Wave proxy functionality",
					ZWaveErrorCodes.Driver_SerialPortClosed,
				);
			}

			console.log(
				`Z-Wave proxy support detected with feature flags: 0x${
					deviceInfo.zwaveProxyFeatureFlags.toString(16)
				}`,
			);

			// Subscribe to Z-Wave traffic
			const subscribeRequest = new ZWaveProxySubscribeRequest();
			await sendMessage(subscribeRequest);

			// Connection is ready - no service discovery needed
			connectionState = ConnectionState.Ready;
			console.log("ESPHome connection ready.");
		}

		async function subscribeZWaveProxy(): Promise<void> {
			const subscribeRequest = new ZWaveProxySubscribeRequest();
			await sendMessage(subscribeRequest);
		}

		function waitForState(
			targetState: ConnectionState,
			timeoutMs: number,
		): Promise<void> {
			return new Promise((resolve, reject) => {
				if (connectionState === targetState) {
					resolve();
					return;
				}

				const startTime = Date.now();
				const checkInterval = setInterval(() => {
					if (connectionState === targetState) {
						clearInterval(checkInterval);
						resolve();
					} else if (Date.now() - startTime > timeoutMs) {
						clearInterval(checkInterval);
						reject(
							new ZWaveError(
								`Timeout waiting for connection state ${targetState}`,
								ZWaveErrorCodes.Driver_SerialPortClosed,
							),
						);
					}
				}, 10);
			});
		}

		function processIncomingData(data: Buffer): void {
			try {
				console.error(
					dayjs(new Date()).format("HH:mm:ss.SSS"),
					"INCOMING:",
					buffer2hex(data),
				);
				// Append new data to buffer
				const newBuffer = new Uint8Array(
					frameBuffer.length + data.length,
				);
				newBuffer.set(frameBuffer);
				newBuffer.set(data, frameBuffer.length);
				frameBuffer = newBuffer;

				// Try to extract complete frames
				while (frameBuffer.length > 0) {
					try {
						// Check if we have enough data for the basic header
						if (frameBuffer.length < 3) {
							break; // Need more data
						}

						// Parse the raw message from buffer
						const rawMessage = ESPHomeMessageRaw.parse(frameBuffer);

						// Calculate frame length
						const frameLength = 1 // indicator
							+ getVarIntLength(rawMessage.payload.length) // payload size
							+ getVarIntLength(rawMessage.messageType) // message type
							+ rawMessage.payload.length; // payload

						// Parse into specific message types and process
						const message = ESPHomeMessage.parse(frameBuffer);
						processIncomingMessage(message);

						// Remove the processed frame from the buffer
						frameBuffer = frameBuffer.slice(frameLength);
					} catch (error) {
						// If we can't decode a complete frame yet, wait for more data
						if (
							error instanceof ZWaveError
							&& error.code === ZWaveErrorCodes.Argument_Invalid
							&& error.message.includes("too short")
						) {
							break;
						}
						// For other errors, reset the buffer and continue
						console.error("Frame parsing error:", error);
						frameBuffer = new Uint8Array(0);
						break;
					}
				}
			} catch {
				// Reset buffer on any parsing error
				frameBuffer = new Uint8Array(0);
			}
		}

		function processIncomingMessage(
			message: ESPHomeMessage,
		): void {
			if (message instanceof HelloResponse) {
				if (connectionState === ConnectionState.HelloSent) {
					console.log(
						`Connected to ESPHome device: ${message.name} (${message.serverInfo})`,
					);
					console.log(
						`API version: ${message.apiVersionMajor}.${message.apiVersionMinor}`,
					);
					connectionState = ConnectionState.HelloReceived;
				}
			} else if (message instanceof DeviceInfoResponse) {
				if (connectionState === ConnectionState.DeviceInfoSent) {
					console.log(
						`Device info received: ${message.name} (${message.esphomeVersion})`,
					);
					console.log(`Model: ${message.model}`);
					console.log(`MAC: ${message.macAddress}`);
					if (message.hasZWaveProxySupport) {
						console.log(
							`Z-Wave proxy feature flags: 0x${
								message.zwaveProxyFeatureFlags.toString(16)
							}`,
						);
					}
					deviceInfo = message;
					connectionState = ConnectionState.DeviceInfoReceived;
				}
			} else if (message instanceof ZWaveProxyFrameFromDevice) {
				// Handle Z-Wave proxy frames returned from the device
				// This message may include full payloads or simple ACK/NAK/CAN responses

				// If we have a source controller, enqueue any remaining data for Z-Wave processing
				// (This would be for any data that's not ESPHome protocol messages)
				if (
					sourceController
					&& connectionState === ConnectionState.Ready
				) {
					// TODO: why is this offset adjustment necessary for large frames???
					const startByte = message.payload.length < 128 ? 2 : 3;
					const dataFrame = message.payload.subarray(startByte);
					// Enqueue frame to handle Z-Wave data as needed
					sourceController.enqueue(dataFrame);
				}
			}
		}

		function open(): Promise<void> {
			return new Promise((resolve, reject) => {
				const onClose = () => {
					removeListeners();
					reject(
						new ZWaveError(
							`ESPHome connection closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				};

				const onError = (err: Error) => {
					removeListeners();
					reject(err);
				};

				const onTimeout = () => {
					removeListeners();
					reject(
						new ZWaveError(
							`ESPHome connection timed out after ${timeout}ms`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				};

				const onConnect = async () => {
					removeListeners();
					connectionState = ConnectionState.Connecting;

					// Set up data listener before performing handshake
					socket.on("data", processIncomingData);

					try {
						await performHandshake();
						await subscribeZWaveProxy();
						resolve();
					} catch (error) {
						reject(
							error instanceof Error
								? error
								: new Error(String(error)),
						);
					}
				};

				socket.setTimeout(timeout);
				socket.once("close", onClose);
				socket.once("error", onError);
				socket.once("timeout", onTimeout);
				socket.once("connect", onConnect);

				socket.connect(port, host);
			});
		}

		async function close(): Promise<void> {
			try {
				// Send disconnect request if connected
				if (connectionState !== ConnectionState.Disconnected) {
					const disconnectRequest = new DisconnectRequest();
					await sendMessage(disconnectRequest);
				}
			} catch {
				// Ignore errors during disconnect
			}

			return new Promise((resolve) => {
				removeListeners();
				connectionState = ConnectionState.Disconnected;
				if (socket.destroyed) {
					resolve();
				} else {
					socket.once("close", () => resolve()).destroy();
				}
			});
		}

		await open();
		let isOpen = true;

		const sink: UnderlyingSink<Uint8Array> = {
			async write(data, controller) {
				if (!isOpen || connectionState !== ConnectionState.Ready) {
					controller.error(
						new Error("ESPHome connection is not ready!"),
					);
					return;
				}

				if (!deviceInfo?.hasZWaveProxySupport) {
					controller.error(
						new Error("Z-Wave proxy support not available!"),
					);
					return;
				}

				try {
					// Create Z-Wave proxy write request with Bytes data
					const writeRequest = new ZWaveProxyFrameToDevice({
						data: new Bytes(data),
					});

					// Send the Z-Wave proxy write request
					await sendMessage(writeRequest);
				} catch (error) {
					controller.error(error);
				}
			},
			close() {
				return close();
			},
			abort(_reason) {
				return close();
			},
		};

		const source: UnderlyingSource<Uint8Array> = {
			start(controller) {
				// Store the controller so we can enqueue data when needed
				sourceController = controller;

				// Handle ESPHome connection events
				socket.on("close", () => {
					isOpen = false;
					connectionState = ConnectionState.Disconnected;
					controller.error(
						new ZWaveError(
							`ESPHome connection closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				});

				socket.on("error", (_e) => {
					isOpen = false;
					connectionState = ConnectionState.Disconnected;
					controller.error(
						new ZWaveError(
							`ESPHome connection error!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				});
			},
			cancel() {
				sourceController = undefined;
				socket.removeAllListeners();
			},
		};

		return { source, sink };
	};
}

/**
 * Helper function to calculate VarInt length
 */
function getVarIntLength(value: number): number {
	let length = 1;
	while (value >= 0x80) {
		value >>>= 7;
		length++;
	}
	return length;
}
