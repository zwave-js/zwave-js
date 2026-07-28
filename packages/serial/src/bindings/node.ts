import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import type { BytesView } from "@zwave-js/shared";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { SerialPort } from "serialport";
import type {
	ByteStreamSocket,
	EnumeratedPort,
	Serial,
	SocketConnectOptions,
} from "../serialport/Bindings.js";
import { createESPHomeFactory } from "../serialport/ESPHomeSocket.js";
import { createNodeSerialPortFactory } from "../serialport/NodeSerialPort.js";
import { createSocketFactory } from "../serialport/Socket.js";

async function connect(
	options: SocketConnectOptions,
): Promise<ByteStreamSocket> {
	const { host, port, timeout = 5000, keepAliveInterval, noDelay } = options;
	const socket = new net.Socket();

	function removeConnectListeners() {
		socket.removeAllListeners("close");
		socket.removeAllListeners("error");
		socket.removeAllListeners("timeout");
		socket.removeAllListeners("connect");
	}

	await new Promise<void>((resolve, reject) => {
		const fail = (error: Error) => {
			removeConnectListeners();
			// Destroy the socket to prevent further connection attempts
			socket.destroy();
			reject(error);
		};

		socket.setTimeout(timeout);
		socket.once("close", () =>
			fail(
				new ZWaveError(
					`The socket closed unexpectedly!`,
					ZWaveErrorCodes.Driver_SerialPortClosed,
				),
			));
		socket.once("error", fail);
		socket.once("timeout", () =>
			fail(
				new ZWaveError(
					`Connection timed out after ${timeout}ms`,
					ZWaveErrorCodes.Driver_SerialPortClosed,
				),
			));
		socket.once("connect", () => {
			removeConnectListeners();
			// The idle timer only limits how long the connection attempt may take
			socket.setTimeout(0);
			if (keepAliveInterval !== undefined) {
				socket.setKeepAlive(true, keepAliveInterval);
			}
			if (noDelay) socket.setNoDelay();
			resolve();
		});

		socket.connect(port, host);
	});

	// FIXME: We should set the SO_RCVBUF to 2 MB or so
	// like aioesphome does, but Node.js does not expose
	// a way to do that natively.
	// https://github.com/derhuerst/node-sockopt might help.

	const readable = new ReadableStream<BytesView>({
		start(controller) {
			socket.on("data", (data) => controller.enqueue(data));
			socket.on("close", () =>
				controller.error(
					new ZWaveError(
						`The socket closed unexpectedly!`,
						ZWaveErrorCodes.Driver_SerialPortClosed,
					),
				));
			socket.on("error", (e) => controller.error(e));
		},
		cancel() {
			socket.removeAllListeners();
		},
	});

	const writable = new WritableStream<BytesView>({
		write(data) {
			return new Promise((resolve, reject) => {
				socket.write(data, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
	});

	return {
		readable,
		writable,
		close() {
			return new Promise((resolve) => {
				if (socket.destroyed) {
					resolve();
				} else {
					socket.once("close", () => resolve()).destroy();
				}
			});
		},
	};
}

/** An implementation of the Serial bindings for Node.js */
export const serial: Serial = {
	async createFactoryByPath(path) {
		if (path.startsWith("tcp://")) {
			const url = new URL(path);
			return createSocketFactory(
				connect,
				url.hostname,
				parseInt(url.port),
			);
		} else if (path.startsWith("esphome://")) {
			// ESPHome connection: esphome://host:port or esphome://host:port?key=base64key
			// If key parameter is present, use encrypted (Noise) connection
			const url = new URL(path);
			const encryptionKey = url.searchParams.get("key") ?? undefined;

			return createESPHomeFactory(connect, {
				host: url.hostname,
				port: url.port ? parseInt(url.port) : undefined,
				encryptionKey,
			});
		} else {
			return createNodeSerialPortFactory(
				path,
			);
		}
	},

	async list() {
		// Put symlinks to the serial ports first if possible
		const ret: EnumeratedPort[] = [];
		if (os.platform() === "linux") {
			const dir = "/dev/serial/by-id";
			const symlinks = await fs.readdir(dir).catch(() => []);

			for (const l of symlinks) {
				try {
					const fullPath = path.join(dir, l);
					const target = path.join(
						dir,
						await fs.readlink(fullPath),
					);
					if (!target.startsWith("/dev/tty")) continue;

					ret.push({
						type: "link",
						path: fullPath,
					});
				} catch {
					// Ignore. The target might not exist or we might not have access.
				}
			}
		}

		// Then the actual serial ports
		const ports = await SerialPort.list();
		ret.push(...ports.map((port) => ({
			type: "tty" as const,
			path: port.path,
		})));

		return ret;
	},

	connect,
};
