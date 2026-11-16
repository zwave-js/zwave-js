import { CRC16_CCITT } from "@zwave-js/core";
import {
	FunctionType,
	MessageHeaders,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
	XModemMessageHeaders,
} from "@zwave-js/serial";
import { Bytes, type BytesView } from "@zwave-js/shared";
import type { MockController, MockControllerBehavior } from "@zwave-js/testing";

// Timeouts used by the XMODEM receiver in Gecko Bootloader 3.0.x
const C_INTERVAL_MS = 1000;
const PACKET_TIMEOUT_MS = 3000;
const C_RETRIES = 60;

const XMODEM_PACKET_SIZE = 133;

/** Describes a fault to inject while the mock bootloader receives an XMODEM block */
export type MockXModemFault =
	// One byte of the block is lost between host and bootloader
	| "drop-host-byte"
	// The bootloader accepts the block, but its ACK never reaches the host
	| "drop-ack"
	// The bootloader accepts the block, but its ACK and the next NAK never reach the host
	| "drop-ack-and-nak"
	// The bootloader takes this long to process the block before it ACKs
	| { delayAck: number };

export interface MockGeckoBootloaderOptions {
	/** Start in the bootloader instead of the Serial API application */
	startInBootloader?: boolean;
	/** Whether the application can be started. Default: true */
	appValid?: boolean;
	/** Ignore CAN and other unknown headers during an upload, like a receiver that is stuck */
	ignoreCancel?: boolean;
	/**
	 * Gets called for every XMODEM block the bootloader receives.
	 * `attempt` counts how often this block number was received during the current upload, starting at 1.
	 * `upload` counts the uploads, starting at 1.
	 */
	injectFault?: (info: {
		block: number;
		attempt: number;
		upload: number;
	}) => MockXModemFault | undefined;
}

export interface MockGeckoBootloader {
	behavior: MockControllerBehavior;
	readonly state: {
		mode: "app" | "bootloader";
		appValid: boolean;
		/** Number of blocks the bootloader accepted during the current upload */
		acceptedBlocks: number;
		/** Number of uploads that were started */
		uploads: number;
		/** Number of uploads that completed successfully */
		completedUploads: number;
	};
	destroy(): void;
}

/** Waits for `ms` milliseconds or until `signal` aborts */
function delay(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		if (signal.aborted) return resolve();
		const timer = setTimeout(done, ms);
		signal.addEventListener("abort", done, { once: true });
		function done() {
			clearTimeout(timer);
			signal.removeEventListener("abort", done);
			resolve();
		}
	});
}

class ByteQueue {
	private buffer: number[] = [];
	private waiter: (() => void) | undefined;

	public push(data: BytesView): void {
		this.buffer.push(...data);
		this.waiter?.();
	}

	public get available(): number {
		return this.buffer.length;
	}

	public flush(): void {
		this.buffer = [];
	}

	/** Waits until at least one byte is available or the timeout elapses */
	public async waitForData(
		timeoutMs: number,
		signal: AbortSignal,
	): Promise<boolean> {
		const deadline = Date.now() + timeoutMs;
		while (this.buffer.length === 0 && !signal.aborted) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;
			await this.waitForPush(remaining, signal);
		}
		return this.buffer.length > 0;
	}

	/** Reads up to `count` bytes, waiting at most `timeoutMs` for all of them */
	public async read(
		count: number,
		timeoutMs: number,
		signal: AbortSignal,
	): Promise<number[]> {
		const deadline = Date.now() + timeoutMs;
		while (this.buffer.length < count && !signal.aborted) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;
			await this.waitForPush(remaining, signal);
		}
		return this.buffer.splice(0, count);
	}

	private async waitForPush(
		timeoutMs: number,
		signal: AbortSignal,
	): Promise<void> {
		await new Promise<void>((resolve) => {
			const timer = setTimeout(done, timeoutMs);
			signal.addEventListener("abort", done, { once: true });
			function done() {
				clearTimeout(timer);
				signal.removeEventListener("abort", done);
				resolve();
			}
			this.waiter = done;
		});
		this.waiter = undefined;
	}
}

function isEnterBootloaderRequest(data: BytesView): boolean {
	return (
		data.length >= 5
		&& data[0] === MessageHeaders.SOF
		&& data[1] === 0x03
		&& data[2] === 0x00
		&& data[3] === FunctionType.EnterBootloader
	);
}

/**
 * Simulates a ZWA-2 style standalone Gecko Bootloader with an XMODEM-CRC receiver.
 * The state machine follows `btl_comm_xmodem_common.c` from Simplicity SDK 2024.12.
 * Like the real bootloader, it overwrites the application as soon as it accepts the first block.
 */
export function createMockGeckoBootloader(
	options: MockGeckoBootloaderOptions = {},
): MockGeckoBootloader {
	const state: MockGeckoBootloader["state"] = {
		mode: options.startInBootloader ? "bootloader" : "app",
		appValid: options.appValid ?? true,
		acceptedBlocks: 0,
		uploads: 0,
		completedUploads: 0,
	};
	const rx = new ByteQueue();
	const abort = new AbortController();
	const signal = abort.signal;
	const attempts = new Map<number, number>();
	let controller: MockController | undefined;
	let running = false;

	function send(data: string | number[]): void {
		// The mock must stay silent once the test has destroyed it
		if (signal.aborted) return;
		const bytes =
			typeof data === "string"
				? Bytes.from(data, "ascii")
				: Uint8Array.from(data);
		controller?.mockPort.emitData(bytes);
	}

	function sendFlowControl(cmd: XModemMessageHeaders): void {
		// The bootloader sends CAN three times
		send(cmd === XModemMessageHeaders.CAN ? [cmd, cmd, cmd] : [cmd]);
	}

	function hex(byte: number): string {
		return byte.toString(16).padStart(2, "0").toUpperCase();
	}

	function printMenu(): void {
		send(
			"\r\nGecko Bootloader v3.00.01\r\n1. upload gbl\r\n2. run\r\n3. ebl info\r\nBL > \0",
		);
	}

	function printAborted(errorCode: number): void {
		// The real bootloader sends the NUL of the error prefix before the code
		send("\r\nSerial upload aborted\r\n\0");
		send(`\r\nblock error 0x\0${hex(errorCode)}\r\n`);
	}

	async function startApplication(): Promise<void> {
		state.mode = "app";
		running = false;
		rx.flush();
		await delay(10, signal);
		const msg = new SerialAPIStartedRequest({
			wakeUpReason: SerialAPIWakeUpReason.Reset,
			watchdogEnabled: false,
			genericDeviceClass: 0x02,
			specificDeviceClass: 0x07,
			isListening: true,
			supportedCCs: [],
			controlledCCs: [],
			supportsLongRange: false,
		});
		if (signal.aborted) return;
		await controller?.sendMessageToHost(msg).catch(() => {});
	}

	/** Receives one XMODEM packet. Returns `undefined` when it is incomplete */
	async function receivePacket(): Promise<
		{ packet: number[]; fault?: MockXModemFault } | undefined
	> {
		const [header] = await rx.read(1, PACKET_TIMEOUT_MS, signal);
		if (header == undefined) return undefined;
		if (header !== XModemMessageHeaders.SOF) return { packet: [header] };

		// The rest of the packet must arrive within one packet timeout
		const deadline = Date.now() + PACKET_TIMEOUT_MS;
		const remaining = () => Math.max(0, deadline - Date.now());

		const blockHeader = await rx.read(2, remaining(), signal);
		const block = blockHeader[0];
		const attempt = (attempts.get(block) ?? 0) + 1;
		attempts.set(block, attempt);
		const fault =
			block != undefined
				? options.injectFault?.({
						block,
						attempt,
						upload: state.uploads,
					})
				: undefined;
		if (fault === "drop-host-byte") {
			await rx.read(1, remaining(), signal);
		}

		const rest = await rx.read(XMODEM_PACKET_SIZE - 3, remaining(), signal);
		const packet = [header, ...blockHeader, ...rest];
		if (packet.length !== XMODEM_PACKET_SIZE) return undefined;
		return { packet, fault };
	}

	/** Runs the XMODEM receiver until it returns to the menu */
	async function upload(): Promise<void> {
		state.uploads++;
		state.acceptedBlocks = 0;
		attempts.clear();
		let lastBlock = 0;
		let started = false;
		let dropNextNak = false;

		async function acknowledge(fault: MockXModemFault | undefined) {
			if (typeof fault === "object") await delay(fault.delayAck, signal);
			if (fault === "drop-ack-and-nak") {
				dropNextNak = true;
			} else if (fault !== "drop-ack") {
				sendFlowControl(XModemMessageHeaders.ACK);
			}
		}

		send("\r\nbegin upload\r\n\0");
		await delay(5, signal);
		rx.flush();

		// Send C until the host starts the transfer
		let retries = C_RETRIES;
		while (!signal.aborted) {
			sendFlowControl(XModemMessageHeaders.C);
			if (await rx.waitForData(C_INTERVAL_MS, signal)) break;
			if (--retries === 0) {
				sendFlowControl(XModemMessageHeaders.CAN);
				return;
			}
		}

		while (!signal.aborted) {
			const received = await receivePacket();
			if (!received) {
				if (dropNextNak) {
					dropNextNak = false;
				} else {
					sendFlowControl(XModemMessageHeaders.NAK);
				}
				continue;
			}
			const { packet, fault } = received;

			const header = packet[0];
			if (header === XModemMessageHeaders.EOT) {
				if (state.acceptedBlocks > 0) {
					sendFlowControl(XModemMessageHeaders.ACK);
					rx.flush();
					await delay(10, signal);
					send("\r\nSerial upload complete\r\n\0");
					state.appValid = true;
					state.completedUploads++;
				} else {
					sendFlowControl(XModemMessageHeaders.CAN);
					rx.flush();
					await delay(10, signal);
					printAborted(0x18);
				}
				return;
			} else if (header !== XModemMessageHeaders.SOF) {
				if (options.ignoreCancel) continue;
				// CAN, C, Ctrl+C and unknown headers cancel the transfer
				sendFlowControl(XModemMessageHeaders.CAN);
				rx.flush();
				await delay(10, signal);
				printAborted(
					header === XModemMessageHeaders.CAN
						|| header === XModemMessageHeaders.C
						|| header === 0x03
						? 0x18
						: 0x21,
				);
				return;
			}

			const [, block, blockC] = packet;
			if (started && block === lastBlock) {
				// Replay of the last accepted block
				await acknowledge(fault);
				continue;
			}
			if (
				(!started && block !== 1)
				|| (started && block !== ((lastBlock + 1) & 0xff))
				|| block + blockC !== 0xff
			) {
				sendFlowControl(XModemMessageHeaders.NAK);
				continue;
			}
			const data = Uint8Array.from(packet.slice(3, 131));
			const crc = (packet[131] << 8) | packet[132];
			if (CRC16_CCITT(data, 0x0000) !== crc) {
				sendFlowControl(XModemMessageHeaders.NAK);
				continue;
			}

			started = true;
			lastBlock = block;
			state.acceptedBlocks++;
			// The standalone bootloader writes the new image over the application
			state.appValid = false;

			await acknowledge(fault);
		}
	}

	/** Runs the bootloader menu loop */
	async function run(): Promise<void> {
		if (running) return;
		running = true;
		await delay(10, signal);
		printMenu();
		while (!signal.aborted && state.mode === "bootloader") {
			const [c] = await rx.read(1, 1000, signal);
			if (c == undefined) continue;
			switch (c) {
				case 0x31: // "1"
					await upload();
					printMenu();
					break;
				case 0x32: // "2"
					if (state.appValid) {
						await startApplication();
						return;
					}
					// Reset into the bootloader again
					await delay(10, signal);
					printMenu();
					break;
				default:
					printMenu();
					break;
			}
		}
		running = false;
	}

	const behavior: MockControllerBehavior = {
		onHostData(self, data) {
			controller = self;
			if (state.mode === "bootloader") {
				rx.push(data);
				if (!running) void run();
				return true;
			}
			if (isEnterBootloaderRequest(data)) {
				send([MessageHeaders.ACK]);
				state.mode = "bootloader";
				void run();
				return true;
			}
			return false;
		},
	};

	return {
		behavior,
		state,
		destroy() {
			abort.abort();
		},
	};
}
