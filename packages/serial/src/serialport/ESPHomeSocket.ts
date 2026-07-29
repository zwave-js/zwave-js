import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type BytesView, noop } from "@zwave-js/shared";
import type { UnderlyingSink, UnderlyingSource } from "node:stream/web";
import { DisconnectRequest } from "../esphome/ConnectionMessages.js";
import {
	DeviceInfoRequest,
	DeviceInfoResponse,
} from "../esphome/DeviceInfoMessages.js";
import { type ESPHomeMessage } from "../esphome/ESPHomeMessage.js";
import { HelloRequest, HelloResponse } from "../esphome/HelloMessages.js";
import {
	ESPHomeZWaveProxyRequestType,
	ZWaveProxyFrame,
	ZWaveProxyRequest,
} from "../esphome/ZWaveProxyMessages.js";
import {
	type NoiseCipherState,
	NoiseHandshakeState,
	encodeNoiseFrame,
	parseServerHello,
} from "../esphome/noise/NoiseProtocol.js";
import { ESPHomeMessageParser } from "../esphome/parsers/ESPHomeMessageParser.js";
import { NoiseDecryptTransform } from "../esphome/parsers/NoiseDecryptTransform.js";
import { NoiseFrameParser } from "../esphome/parsers/NoiseFrameParser.js";
import type { SocketFactory } from "./Bindings.js";
import type { ZWaveSerialBindingFactory } from "./ZWaveSerialStream.js";

export interface ESPHomeSocketOptions {
	/** The hostname or IP address of the ESPHome device */
	host: string;
	/** The port number (default: 6053) */
	port?: number;
	/** Base64-encoded 32-byte encryption key. If provided, Noise encryption is used. */
	encryptionKey?: string;
}

export function createESPHomeFactory(
	connect: SocketFactory,
	options: ESPHomeSocketOptions,
): ZWaveSerialBindingFactory {
	return async function() {
		const timeout = 5000;

		// Determine if we're using encryption
		const useEncryption = !!options.encryptionKey;
		let psk: Bytes | undefined;

		if (useEncryption) {
			psk = Bytes.from(options.encryptionKey!, "base64");
			if (psk.length !== 32) {
				throw new ZWaveError(
					`Invalid encryption key length: expected 32 bytes, got ${psk.length}`,
					ZWaveErrorCodes.Driver_InvalidOptions,
				);
			}
		}

		let deviceInfo: DeviceInfoResponse | undefined;
		let sourceController:
			| ReadableStreamDefaultController<BytesView>
			| undefined;
		let isOpen = false;

		// Noise protocol state (only used when encryption is enabled)
		let sendCipher: NoiseCipherState | undefined;

		const socket = await connect({
			host: options.host,
			port: options.port ?? 6053,
			timeout,
			// During testing, values below 1000 caused the keep alive functionality to silently fail
			keepAliveInterval: 1000,
			// Prevent communication delays
			noDelay: true,
		});
		const writer = socket.writable.getWriter();
		let messageReader:
			| ReadableStreamDefaultReader<ESPHomeMessage>
			| undefined;

		/**
		 * Send a raw Noise frame (during handshake)
		 */
		async function sendNoiseFrame(payload: BytesView): Promise<void> {
			await writer.write(encodeNoiseFrame(payload));
		}

		/**
		 * Send an ESPHome message (encrypted or plaintext depending on mode)
		 */
		async function sendMessage(
			message:
				| HelloRequest
				| DeviceInfoRequest
				| DisconnectRequest
				| ZWaveProxyFrame
				| ZWaveProxyRequest,
		): Promise<void> {
			if (useEncryption) {
				if (!sendCipher) {
					throw new ZWaveError(
						"Cannot send encrypted message: handshake not complete",
						ZWaveErrorCodes.Driver_NotReady,
					);
				}

				// Subclasses populate `this.payload` in their serialize() override,
				// so we must call it before serializeForNoise() which reads `this.payload`.
				message.serialize();

				// Serialize for Noise transport and encrypt
				const messageData = message.serializeForNoise();
				const encrypted = await sendCipher.encryptWithAd(
					new Bytes(0),
					messageData,
				);

				await sendNoiseFrame(encrypted);
			} else {
				// Plaintext mode
				await writer.write(message.serialize());
			}
		}

		/**
		 * Perform the Noise protocol handshake using the provided frame reader
		 */
		async function performNoiseHandshake(
			frameReader: ReadableStreamDefaultReader<Bytes>,
		): Promise<NoiseCipherState> {
			// Helper to read a noise frame with timeout
			const readNoiseFrame = (timeoutMs: number) =>
				readWithTimeout(frameReader, timeoutMs);

			// Send empty ClientHello
			await sendNoiseFrame(new Bytes(0));

			// Wait for ServerHello
			const serverHelloPayload = await readNoiseFrame(timeout);
			const serverHello = parseServerHello(serverHelloPayload);
			if (serverHello.protocolVersion !== 0x01) {
				throw new ZWaveError(
					`Unsupported Noise protocol version: ${serverHello.protocolVersion}`,
					ZWaveErrorCodes.Driver_InvalidOptions,
				);
			}

			// Send handshake message 1 (prefixed with 0x00 success byte)
			const handshakeState = new NoiseHandshakeState(psk!);
			const handshakeMsg1 = await handshakeState.writeMessage(
				new Bytes(0),
			);
			await sendNoiseFrame(
				Bytes.concat([[0x00], handshakeMsg1]),
			);

			// Wait for handshake message 2
			const handshakeMsg2Payload = await readNoiseFrame(timeout);

			if (handshakeMsg2Payload.length === 0) {
				throw new ZWaveError(
					"Noise handshake failed: empty response",
					ZWaveErrorCodes.Driver_SerialPortClosed,
				);
			}

			// Check status byte: 0x00 = success, 0x01 = error
			const statusByte = handshakeMsg2Payload[0];
			if (statusByte === 0x01) {
				const errorMessage = new TextDecoder().decode(
					handshakeMsg2Payload.subarray(1),
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

			// Process handshake message 2
			await handshakeState.readMessage(handshakeMsg2Payload.subarray(1));

			// Derive transport keys
			const { sendCipher: sc, receiveCipher: rc } = await handshakeState
				.split();
			sendCipher = sc;
			return rc;
		}

		async function performESPHomeHandshake(
			reader: ReadableStreamDefaultReader<ESPHomeMessage>,
		): Promise<void> {
			// Helper to read until we get a message of the expected type,
			// skipping any other messages that may arrive during handshake
			async function readExpected<T extends ESPHomeMessage>(
				expectedType: abstract new (...args: any[]) => T,
			): Promise<T> {
				while (true) {
					const message = await readWithTimeout(reader, timeout);
					if (message instanceof expectedType) {
						return message;
					}
					// Skip unexpected messages during handshake
				}
			}

			// Send HelloRequest
			const helloRequest = new HelloRequest({
				clientInfo: "zwave-js",
				apiVersionMajor: 1,
				apiVersionMinor: 0,
			});
			await sendMessage(helloRequest);

			// Wait for HelloResponse
			await readExpected(HelloResponse);

			// Send DeviceInfoRequest to check Z-Wave support
			const deviceInfoRequest = new DeviceInfoRequest();
			await sendMessage(deviceInfoRequest);

			// Wait for DeviceInfoResponse
			deviceInfo = await readExpected(DeviceInfoResponse);

			// Check if device supports Z-Wave proxy
			if (!deviceInfo.hasZWaveProxySupport) {
				throw new ZWaveError(
					"ESPHome device does not support Z-Wave proxy functionality",
					ZWaveErrorCodes.Driver_SerialPortClosed,
				);
			}

			// Subscribe to Z-Wave traffic
			const subscribeRequest = new ZWaveProxyRequest({
				type: ESPHomeZWaveProxyRequestType.Subscribe,
			});
			await sendMessage(subscribeRequest);
		}

		async function readWithTimeout<T>(
			reader: ReadableStreamDefaultReader<T>,
			timeoutMs: number,
		): Promise<T> {
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(
					() =>
						reject(
							new ZWaveError(
								`Timeout waiting for message`,
								ZWaveErrorCodes.Driver_SerialPortClosed,
							),
						),
					timeoutMs,
				);
			});

			const readPromise = reader.read().then(({ value, done }) => {
				if (done || value === undefined) {
					throw new ZWaveError(
						"Stream closed unexpectedly",
						ZWaveErrorCodes.Driver_SerialPortClosed,
					);
				}
				return value;
			});

			return Promise.race([readPromise, timeoutPromise]);
		}

		function processMessages(
			reader: ReadableStreamDefaultReader<ESPHomeMessage>,
		): void {
			// Start reading messages in the background
			void (async () => {
				try {
					// oxlint-disable-next-line no-unmodified-loop-condition
					while (isOpen) {
						const { value: message, done } = await reader.read();
						if (done) break;

						if (message instanceof ZWaveProxyFrame) {
							// Handle Z-Wave proxy frames returned from the device
							// This message may include full payloads or simple ACK/NAK/CAN responses
							if (sourceController) {
								sourceController.enqueue(message.data);
							}
						}
						// Other message types are ignored after handshake
					}
				} catch {
					// Both an error and the end of the stream mean the connection is gone
				}

				if (isOpen) {
					isOpen = false;
					sourceController?.error(
						new ZWaveError(
							`ESPHome connection closed unexpectedly!`,
							ZWaveErrorCodes.Driver_SerialPortClosed,
						),
					);
				}
			})();
		}

		try {
			// Build the appropriate pipeline based on encryption mode
			let parserReadable: ReadableStream<ESPHomeMessage>;

			if (useEncryption) {
				// Encrypted: socket → NoiseFrameParser → [handshake] → NoiseDecryptTransform → ESPHomeMessageParser
				const frameParser = new NoiseFrameParser();
				const noiseFramesStream = socket.readable.pipeThrough(
					frameParser,
				);

				// Get a reader for the Noise handshake
				const frameReader = noiseFramesStream.getReader();

				// Perform Noise handshake using the stream
				const receiveCipher = await performNoiseHandshake(frameReader);

				// Release the reader so we can continue piping
				frameReader.releaseLock();

				// Continue the pipeline with decryption and message parsing
				const decryptTransform = new NoiseDecryptTransform(
					receiveCipher,
				);
				const messageParser = new ESPHomeMessageParser({
					noiseMode: true,
				});

				parserReadable = noiseFramesStream
					.pipeThrough(decryptTransform)
					.pipeThrough(messageParser);
			} else {
				// Plaintext: socket → ESPHomeMessageParser
				const messageParser = new ESPHomeMessageParser();
				parserReadable = socket.readable.pipeThrough(messageParser);
			}

			messageReader = parserReadable.getReader();

			// Perform ESPHome handshake
			await performESPHomeHandshake(messageReader);
			isOpen = true;

			// Start processing messages in the background
			processMessages(messageReader);
		} catch (e) {
			await socket.close();
			throw e;
		}

		async function close(): Promise<void> {
			try {
				// Send disconnect request if connected
				if (isOpen) {
					const disconnectRequest = new DisconnectRequest();
					await sendMessage(disconnectRequest);
				}
			} catch {
				// Ignore errors during disconnect
			}

			isOpen = false;
			// Cancel the reader so processMessages ends even if a host's connect
			// implementation leaves the readable side open on close
			await messageReader?.cancel().catch(noop);
			await socket.close();
		}

		const sink: UnderlyingSink<BytesView> = {
			async write(data, controller) {
				if (!isOpen) {
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
					const writeRequest = new ZWaveProxyFrame({
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

		const source: UnderlyingSource<BytesView> = {
			start(controller) {
				// Store the controller so we can enqueue data when needed
				sourceController = controller;
			},
			cancel() {
				sourceController = undefined;
			},
		};

		return { source, sink };
	};
}
