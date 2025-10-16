// demo.ts
import { exit } from "node:process";
import { type ControllerStatistics, Driver } from "zwave-js";

const MINIMUM_RSSI = -120;
const HF_MODE_TIMEOUT = 300_000; // The amount of time to keep high-frequency mode enabled. in milliseconds
const PORT = "/dev/ttyACM0"; // Adjust this to your USB stick port (e.g., /dev/tty.usbmodemXYZ or /dev/ttyACM0)

/**
 * @param current The current RSSI value
 * @param width The amount of characters the progress bar will use
 * @returns The progress bar string
 */
function drawRSSIProgressBar(current: number, width = 40): string {
	const ratio = current / MINIMUM_RSSI;
	const empty = Math.round(ratio * width);
	const filled = width - empty;
	// Ensure no negative values in case of very good RSSI
	if (empty < 0) {
		return `[${"█".repeat(width)}]`;
	}
	return `[${"█".repeat(filled)}${"·".repeat(empty)}]`;
}

// It draws a row with all the channel information in the terminal
function writeChannelRow(
	row: number,
	rowOffset: number,
	channel: { id: number; average?: number; current?: number },
) {
	// increment row to leave a space for the header
	row += rowOffset;
	// Writing the progress bar
	if (!channel?.current) { // If current is undefined or 0
		process.stdout.write(
			`
				\r\x1b[${row};12H ${drawRSSIProgressBar(0, 30)}`,
		);
	} else { // If current has a valid value
		process.stdout.write(
			`
				\r\x1b[${row};1HChannel ${channel.id + 1}: 
				\r\x1b[${row};12H${
				drawRSSIProgressBar(
					channel.current
						|| MINIMUM_RSSI,
					30,
				)
			} `,
		);
	}

	// Writing the current and average columns
	process.stdout.write(
		`
		\x1b[${row};45H${(channel.current || "N/A").toString().padStart(4)} dBm
		\x1b[${row};56H${(channel.average || "N/A").toString().padStart(4)} dBm
					`,
	);
}

function updateChannelsDisplay(
	stats: ControllerStatistics,
	hfEnabled: boolean,
) {
	// Disable console cursor
	process.stdout.write("\x1B[?25l");
	// Clear the entire console
	process.stdout.write("\x1Bc");
	// Write the header in the first line
	process.stdout.write(
		`\r\x1b[1;1HChannel\x1b[1;16H Noise - Less is Better \x1b[1;46HCurrent\x1b[1;56H Average`,
	);

	// Write lines for channels 0-3 (looped)
	const channels = [0, 1, 2, 3] as const;
	channels.forEach((id) => {
		const channel = stats.backgroundRSSI?.[`channel${id}`];
		if (channel) {
			writeChannelRow(
				id + 1,
				1,
				{
					id: id,
					average: channel?.average,
					current: channel?.current,
				},
			);
		}
	});
	// Write the footer
	process.stdout.write(
		`
			\r\x1b[6;1HSerial: ${PORT} - HF mode: ${
			hfEnabled
				? `enabled`
				: "disabled"
		}
			\r\x1b[7;1H(type "h" to enable HF mode, "x" to exit)`,
	);

	showTemporalUpdateHint();
}

let lastHintTimeout: NodeJS.Timeout;

/* We use this to show a temporal hint that the stats have been updated	*/
function showTemporalUpdateHint() {
	// Clear any previous timeout
	if (lastHintTimeout) clearTimeout(lastHintTimeout);
	// write on line 6 a red square
	process.stdout.write(
		`\r\x1b[7;63HX`,
	);

	lastHintTimeout = setTimeout(() => {
		// clear the red square
		process.stdout.write(
			`\r\x1b[7;63H `,
		);
	}, 300);
}

async function main(args: string[] = process.argv.slice(2)) {
	if (args.includes("--help") || args.includes("-h")) {
		console.log(`Usage: yarn ts test/rssi-monitor.ts [serial-port]`);
		exit(0);
	}

	let storedStats: ControllerStatistics;

	const driver = new Driver(
		args[0] || PORT, // Read the first param as the port if provided
		{
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
				if (!driver.isFrequentRSSIMonitoringEnabled) {
					driver.enableFrequentRSSIMonitoring(
						HF_MODE_TIMEOUT,
					);
				} else {
					driver.disableFrequentRSSIMonitoring();
				}
				// Update stats to show the new HF mode status
				updateChannelsDisplay(
					storedStats,
					driver.isFrequentRSSIMonitoringEnabled,
				);
			}
		};

		process.stdin.on("data", handleKey);

		driver.controller.on("statistics updated", (stats) => {
			storedStats = stats;
			// Update the stats to reflect the new values
			updateChannelsDisplay(
				storedStats,
				driver.isFrequentRSSIMonitoringEnabled,
			);
		});
	});

	await driver.start();
}

main().catch((e) => {
	console.error(e);
	exit(1);
});
