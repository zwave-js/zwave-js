/**
 * ESPHome Noise Socket - Encrypted communication with ESPHome Z-Wave controllers
 *
 * Uses the Noise_NNpsk0_25519_ChaChaPoly_SHA256 protocol for encrypted
 * communication with ESPHome devices that have API encryption enabled.
 */

import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import net from "node:net";
import type { UnderlyingSink, UnderlyingSource } from "node:stream/web";
import { DisconnectRequest } from "../esphome/ConnectionMessages.js";
import {
	DeviceInfoRequest,
	DeviceInfoResponse,
} from "../esphome/DeviceInfoMessages.js";
import { ESPHomeMessage } from "../esphome/ESPHomeMessage.js";
import { HelloRequest, HelloResponse } from "../esphome/HelloMessages.js";
import { encodeVarInt } from "../esphome/ProtobufHelpers.js";
import {
	ESPHomeZWaveProxyRequestType,
	ZWaveProxyFrame,
	ZWaveProxyRequest,
} from "../esphome/ZWaveProxyMessages.js";
import {
	NOISE_INDICATOR,
	type NoiseCipherState,
	NoiseHandshakeState,
	decodeNoiseFrame,
	encodeNoiseFrame,
	parseServerHello,
} from "../esphome/noise/NoiseProtocol.js";
import type { ZWaveSerialBindingFactory } from "./ZWaveSerialStream.js";

export interface ESPHomeNoiseSocketOptions {
	/** The hostname or IP address of the ESPHome device */
	host: string;
	/** The port number (default: 6053) */
	port?: number;
	/** Base64-encoded 32-byte encryption key */
	encryptionKey: string;
}

enum ConnectionState {
	Disconnected = "disconnected",
	Connecting = "connecting",
	ClientHelloSent = "client_hello_sent",
	ServerHelloReceived = "server_hello_received",
	HandshakeMessageSent = "handshake_message_sent",
	HandshakeComplete = "handshake_complete",
	HelloSent = "hello_sent",
	HelloReceived = "hello_received",
	DeviceInfoSent = "device_info_sent",
	DeviceInfoReceived = "device_info_received",
	Ready = "ready",
}

export function createESPHomeNoiseFactory(
	options: ESPHomeNoiseSocketOptions,
): ZWaveSerialBindingFactory {
	return async function() {
		const socket = new net.Socket();
		const host = options.host;
		const port = options.port ?? 6053;
		const timeout = 5000;

		// Decode the encryption key from base64
		const psk = Bytes.from(options.encryptionKey, "base64");
		if (psk.length !== 32) {
			throw new ZWaveError(
				`Invalid encryption key length: expected 32 bytes, got ${psk.length}`,
				ZWaveErrorCodes.Driver_InvalidOptions,
			);
		}

		let connectionState = ConnectionState.Disconnected;
		let deviceInfo: DeviceInfoResponse | undefined;
		let sourceController:
			| ReadableStreamDefaultController<BytesView>
			| undefined;

		// Noise protocol state
		let handshakeState: NoiseHandshakeState | undefined;
		let sendCipher: NoiseCipherState | undefined;
		let receiveCipher: NoiseCipherState | undefined;

		// Buffer for incoming frame reassembly
		let frameBuffer = new Bytes();

		// Queue for sequential frame processing (prevents nonce desync)
		let processingQueue: Promise<void> = Promise.resolve();

		function removeListeners() {
			socket.removeAllListeners("close");
			socket.removeAllListeners("error");
			socket.removeAllListeners("connect");
			socket.removeAllListeners("timeout");
			socket.removeAllListeners("data");
		}

		/**
		 * Send a raw Noise frame (during handshake)
		 */
		function sendNoiseFrame(payload: BytesView): Promise<void> {
			const frame = encodeNoiseFrame(payload);
			return new Promise((resolve, reject) => {
				socket.write(frame, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		}

		/**
		 * Send an encrypted ESPHome message
		 *
		 * Noise protocol uses a different format than plaintext:
		 * [2-byte BE type] [2-byte BE data_len] [payload]
		 */
		async function sendEncryptedMessage(
			message:
				| HelloRequest
				| DeviceInfoRequest
				| DisconnectRequest
				| ZWaveProxyFrame
				| ZWaveProxyRequest,
		): Promise<void> {
			if (!sendCipher) {
				throw new ZWaveError(
					"Cannot send encrypted message: handshake not complete",
					ZWaveErrorCodes.Driver_NotReady,
				);
			}

			// Call serialize() to build the payload (side effect populates message.payload)
			message.serialize();
			const messageType = message.messageType;
			const payload = message.payload;

			// Create the Noise data format: [2-byte BE type] [2-byte BE len] [payload]
			const header = new Bytes(4);
			header[0] = (messageType >> 8) & 0xff;
			header[1] = messageType & 0xff;
			header[2] = (payload.length >> 8) & 0xff;
			header[3] = payload.length & 0xff;
			const messageData = Bytes.concat([header, payload]);

			// Encrypt the message
			const encrypted = await sendCipher.encryptWithAd(
				new Bytes(0),
				messageData,
			);

			// Send as a Noise frame
			await sendNoiseFrame(encrypted);
		}

		async function performNoiseHandshake(): Promise<void> {
			// Send empty ClientHello
			connectionState = ConnectionState.ClientHelloSent;
			await sendNoiseFrame(new Bytes(0));

			// Wait for ServerHello
			await waitForState(ConnectionState.ServerHelloReceived, timeout);

			// Send handshake message 1 (prefixed with 0x00 success byte)
			handshakeState = new NoiseHandshakeState(psk);
			const handshakeMsg1 = await handshakeState.writeMessage(
				new Bytes(0),
			);
			connectionState = ConnectionState.HandshakeMessageSent;
			// Prepend 0x00 status byte to indicate success
			await sendNoiseFrame(
				Bytes.concat([Bytes.from([0x00]), handshakeMsg1]),
			);

			// Wait for handshake message 2
			await waitForState(ConnectionState.HandshakeComplete, timeout);

			// Derive transport keys
			const { sendCipher: sc, receiveCipher: rc } = await handshakeState
				.split();
			sendCipher = sc;
			receiveCipher = rc;
		}

		async function performESPHomeHandshake(): Promise<void> {
			// Send HelloRequest (encrypted)
			connectionState = ConnectionState.HelloSent;
			const helloRequest = new HelloRequest({
				clientInfo: "zwave-js",
				apiVersionMajor: 1,
				apiVersionMinor: 0,
			});
			await sendEncryptedMessage(helloRequest);

			// Wait for HelloResponse
			await waitForState(ConnectionState.HelloReceived, timeout);

			// Send DeviceInfoRequest
			connectionState = ConnectionState.DeviceInfoSent;
			const deviceInfoRequest = new DeviceInfoRequest();
			await sendEncryptedMessage(deviceInfoRequest);

			// Wait for DeviceInfoResponse
			await waitForState(ConnectionState.DeviceInfoReceived, timeout);

			// Check if device supports Z-Wave proxy
			if (!deviceInfo?.hasZWaveProxySupport) {
				throw new ZWaveError(
					"ESPHome device does not support Z-Wave proxy functionality",
					ZWaveErrorCodes.Driver_SerialPortClosed,
				);
			}

			// Subscribe to Z-Wave traffic
			const subscribeRequest = new ZWaveProxyRequest({
				type: ESPHomeZWaveProxyRequestType.Subscribe,
			});
			await sendEncryptedMessage(subscribeRequest);

			connectionState = ConnectionState.Ready;
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
				frameBuffer = Bytes.concat([frameBuffer, data]);

				while (frameBuffer.length > 0) {
					try {
						// Check if we have enough data for the basic header
						if (frameBuffer.length < 3) {
							break;
						}

						// Check frame indicator
						if (frameBuffer[0] !== NOISE_INDICATOR) {
							throw new ZWaveError(
								`Invalid frame indicator: expected 0x01, got 0x${
									frameBuffer[0].toString(16).padStart(2, "0")
								}`,
								ZWaveErrorCodes.PacketFormat_Invalid,
							);
						}

						// Parse the Noise frame
						const { payload, bytesConsumed } = decodeNoiseFrame(
							frameBuffer,
						);

						// Process based on connection state (sequentially to prevent nonce desync)
						processingQueue = processingQueue
							.then(() => processNoiseFrame(payload))
							.catch((err) => {
								console.error(
									"Error processing Noise frame:",
									err,
								);
							});

						// Remove processed frame from buffer
						frameBuffer = frameBuffer.subarray(bytesConsumed);
					} catch (error) {
						if (
							error instanceof ZWaveError
							&& error.code
								=== ZWaveErrorCodes.PacketFormat_Truncated
						) {
							break;
						}
						frameBuffer = new Bytes();
						break;
					}
				}
			} catch {
				frameBuffer = new Bytes();
			}
		}

		async function processNoiseFrame(payload: BytesView): Promise<void> {
			switch (connectionState) {
				case ConnectionState.ClientHelloSent: {
					// This is the ServerHello
					const serverHello = parseServerHello(payload);
					if (serverHello.protocolVersion !== 0x01) {
						throw new ZWaveError(
							`Unsupported Noise protocol version: ${serverHello.protocolVersion}`,
							ZWaveErrorCodes.Driver_InvalidOptions,
						);
					}
					connectionState = ConnectionState.ServerHelloReceived;
					break;
				}

				case ConnectionState.HandshakeMessageSent: {
					// This is handshake message 2
					if (!handshakeState) {
						throw new ZWaveError(
							"Handshake state not initialized",
							ZWaveErrorCodes.Driver_NotReady,
						);
					}

					if (payload.length === 0) {
						throw new ZWaveError(
							"Noise handshake failed: empty response",
							ZWaveErrorCodes.Driver_SerialPortClosed,
						);
					}

					// Check status byte: 0x00 = success, 0x01 = error
					const statusByte = payload[0];
					if (statusByte === 0x01) {
						const errorMessage = new TextDecoder().decode(
							payload.subarray(1),
						);
						throw new ZWaveError(
							`Noise handshake failed: ${errorMessage}`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						);
					} else if (statusByte !== 0x00) {
						throw new ZWaveError(
							`Noise handshake failed: unexpected status byte 0x${
								statusByte.toString(16).padStart(2, "0")
							}`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						);
					}

					// Strip the status byte and process the actual handshake data
					await handshakeState.readMessage(payload.subarray(1));
					connectionState = ConnectionState.HandshakeComplete;
					break;
				}

				default: {
					// Encrypted message - decrypt it
					if (!receiveCipher) {
						throw new ZWaveError(
							"Cannot decrypt message: handshake not complete",
							ZWaveErrorCodes.Driver_NotReady,
						);
					}

					const decrypted = await receiveCipher.decryptWithAd(
						new Bytes(0),
						payload,
					);

					// Parse the decrypted ESPHome message
					processDecryptedMessage(decrypted);
					break;
				}
			}
		}

		function processDecryptedMessage(data: BytesView): void {
			// Noise decrypted data format: [2-byte BE type] [2-byte BE data_len] [payload]
			if (data.length < 4) {
				console.error("Decrypted message too short");
				return;
			}

			const messageType = (data[0] << 8) | data[1];
			const dataLen = (data[2] << 8) | data[3];
			const payload = Bytes.view(data.subarray(4, 4 + dataLen));

			// Reconstruct as a plaintext ESPHome frame for parsing
			const plaintextFrame = Bytes.concat([
				Bytes.from([0x00]), // Indicator
				encodeVarInt(dataLen),
				encodeVarInt(messageType),
				payload,
			]);

			const message = ESPHomeMessage.parse(plaintextFrame);

			if (message instanceof HelloResponse) {
				if (connectionState === ConnectionState.HelloSent) {
					connectionState = ConnectionState.HelloReceived;
				}
			} else if (message instanceof DeviceInfoResponse) {
				if (connectionState === ConnectionState.DeviceInfoSent) {
					deviceInfo = message;
					connectionState = ConnectionState.DeviceInfoReceived;
				}
			} else if (message instanceof ZWaveProxyFrame) {
				if (
					sourceController
					&& connectionState === ConnectionState.Ready
				) {
					sourceController.enqueue(message.data);
				}
			}
		}

		function open(): Promise<void> {
			return new Promise((resolve, reject) => {
				const onClose = () => {
					removeListeners();
					socket.destroy();
					reject(
						new ZWaveError(
							`ESPHome connection closed unexpectedly!`,
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

				const onConnect = async () => {
					removeListeners();
					connectionState = ConnectionState.Connecting;

					socket.setKeepAlive(true, 1000);
					socket.setNoDelay();

					// Set up data listener
					socket.on("data", processIncomingData);

					try {
						// Perform Noise handshake
						await performNoiseHandshake();

						// Perform ESPHome handshake (encrypted)
						await performESPHomeHandshake();

						resolve();
					} catch (error) {
						socket.destroy();
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
				if (
					connectionState !== ConnectionState.Disconnected
					&& sendCipher
				) {
					const disconnectRequest = new DisconnectRequest();
					await sendEncryptedMessage(disconnectRequest);
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

		const sink: UnderlyingSink<BytesView> = {
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
					const writeRequest = new ZWaveProxyFrame({
						data: new Bytes(data),
					});
					await sendEncryptedMessage(writeRequest);
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

		const source: UnderlyingSource<BytesView> = {
			start(controller) {
				sourceController = controller;

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
