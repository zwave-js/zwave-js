import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SerialPort } from "serialport";
import type { EnumeratedPort, Serial } from "../serialport/Bindings.js";
import { createNodeSerialPortFactory } from "../serialport/NodeSerialPort.js";
import { createNodeSocketFactory } from "../serialport/NodeSocket.js";

/** An implementation of the Serial bindings for Node.js */
export const serial: Serial = {
	async createFactoryByPath(path) {
		if (path.startsWith("tcp://")) {
			const url = new URL(path);
			return createNodeSocketFactory({
				host: url.hostname,
				port: parseInt(url.port),
			});
		} else if (path.startsWith("esphome://")) {
			const url = new URL(path);
			try {
				// Use string import to avoid TypeScript module resolution issues at build time
				const { createESPHomeFactory } = await import(
					"@zwave-js/bindings-esphome"
				);
				return createESPHomeFactory({
					host: url.hostname,
					port: url.port ? parseInt(url.port) : undefined,
				});
			} catch (error) {
				throw new Error(
					`ESPHome bindings are not available. Please install @zwave-js/bindings-esphome to use esphome:// URLs. ${
						String(error)
					}`,
				);
			}
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
};
