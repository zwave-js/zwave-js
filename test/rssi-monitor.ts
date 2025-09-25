// demo.ts
import { Buffer } from "node:buffer";
import { exit } from "node:process";
import { Driver } from "zwave-js";

const MINIMUN_RSSI = -120;
const INTERVAL = 3_000; // The interval between RSSI polls when in high-frequency mode. in milliseconds. Must be between pollBackgroundRSSIMin and pollBackgroundRSSIMax
const HF_MODE_TIMEOUT = 300_000; // The amount of time to keep high-frequency mode enabled. in milliseconds
const PORT = "/dev/ttyACM0"; // Adjust this to your USB stick port (e.g., /dev/tty.usbmodemXYZ or /dev/ttyACM0)


/**
 * @param current The current RSSI value
 * @param width The amount of characters the progress bar will use
 * @returns The progress bar string
 */
function drawRSSIProgressBar(current: number, width = 40): string {
	const ratio = current / MINIMUN_RSSI;
	const empty = Math.round(ratio * width);
	const filled = width - empty;
	// Ensure no negative values in case of very good RSSI
	if (empty < 0) {
		return `[${"█".repeat(width)}]`;
	}
	return `[${"█".repeat(filled)}${"·".repeat(empty)}]`;
}

// Generates a random 16-byte key
function generateRandomKey(): Buffer<ArrayBuffer> {
	const key = Buffer.alloc(16);
	for (let i = 0; i < 16; i++) {
		key[i] = Math.floor(Math.random() * 256);
	}
	return key;
}

async function main(args: string[] = process.argv.slice(2)) {
	if (args.includes("--help") || args.includes("-h")) {
		console.log(`Usage: yarn ts test/rssi-monitor.ts [serial-port]`);
		exit(0);
	}

	const driver = new Driver(
		args[0] || PORT, // Read the first param as the port if provided
		{
			securityKeys: {
				S0_Legacy: generateRandomKey(),
				S2_Unauthenticated: generateRandomKey(),
				S2_AccessControl: generateRandomKey(),
				S2_Authenticated: generateRandomKey(),
			},
			securityKeysLongRange: {
				S2_Authenticated: generateRandomKey(),
				S2_AccessControl: generateRandomKey(),
			},
			timeouts: {
				pollBackgroundRSSIMin: 3_000,
				pollBackgroundRSSIMax: 15000,
			},
			logConfig: {
				enabled: true,
				level: "error",
			},
		},
	);

	driver.on("error", (err) => {
		console.error("Driver error:", err);
	});

	driver.on("driver ready", () => {
		// Clear the console
		process.stdout.write("\x1Bc");

		driver.on("rssi hf status", (enabled, _timeout) => {
			if (enabled) {
				console.log(
					`\r\x1b[8;1HHigh frequency background RSSI polling enabled`,
				);
			} else {
				console.log(
					"\r\x1b[8;1HHigh frequency background RSSI polling disabled",
				);
			}
		});

		// Raw mode keystroke handling (no need to press Enter)
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
			process.stdin.setEncoding("utf8");
			process.stdin.resume();
		}

		const handleKey = (key: string) => {
			// Ctrl+C or 'x' exits
			if (key === "\u0003" || key === "x") {
				// cleanup raw mode
				if (process.stdin.isTTY) process.stdin.setRawMode(false);
				process.stdin.removeListener("data", handleKey as any);
				exit(0);
			}
			// 'h' toggles high-frequency mode
			if (key === "h") {
				if (!driver.poolBackgroundRSSIHFModeEnabled) {
					driver.enableBackgroundRSSIHFMode(
						INTERVAL,
						HF_MODE_TIMEOUT,
					);
				} else {
					driver.disableBackgroundRSSIHFMode();
				}
			}
		};

		process.stdin.on("data", handleKey);

		driver.controller.on("statistics updated", (stats) => {
			// Clear the whole console each update

			function writeChannelRow(
				row: number,
				channel: 0 | 1 | 2 | 3,
			) {
				// increment row to leave a space for the header
				row++;
				// check if channel exists. if not, write N/A
				if (
					stats.backgroundRSSI?.[`channel${channel}`]?.current
						=== undefined
				) {
					process.stdout.write(
						`
						\r\x1b[${row};1HChannel ${channel + 1}:
						\r\x1b[${row};12H ${
							drawRSSIProgressBar(
								0,
								30,
							)
						}
						\x1b[${row};45H${"N/A".padStart(4)} dBm
						\x1b[${row};56H${"N/A".padStart(4)} dBm`,
					);

					return;
				}
				process.stdout.write(
					`
					\r\x1b[${row};1HChannel ${channel + 1}: 
					\r\x1b[${row};12H${
						drawRSSIProgressBar(
							stats.backgroundRSSI?.[`channel${channel}`]?.current
								|| -120,
							30,
						)
					} 
					\x1b[${row};45H${
						stats.backgroundRSSI?.[`channel${channel}`]?.current
							.toString().padStart(4)
					} dBm
					\x1b[${row};56H${
						stats.backgroundRSSI?.[`channel${channel}`]?.average
							.toString().padStart(4)
					} dBm
					`,
				);
			}

			// Clear the entire console
			process.stdout.write("\x1Bc");
			// Write the header in the first line
			process.stdout.write(
				`\r\x1b[1;1HChannel\x1b[1;16H Noise - Less is Better \x1b[1;46HCurrent\x1b[1;56H Average`,
			);

			// Write lines for channels 0-3 (looped)
			const channels = [0, 1, 2, 3] as const;
			channels.forEach((channel) => {
				writeChannelRow(channel + 1, channel);
			});
			// Write the footer
			process.stdout.write(
				`\r\x1b[6;1HSerial: ${PORT} - HF mode: ${
					driver.poolBackgroundRSSIHFModeEnabled
						? `enabled (${INTERVAL} ms)`
						: "disabled"
				}
				\r\x1b[7;1H(type "h" to enable HF mode, "x" to exit)`,
			);
		});
	});

	await driver.start();
}

main().catch((e) => {
	console.error(e);
	exit(1);
});
