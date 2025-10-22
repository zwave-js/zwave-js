import { ZWaveErrorCodes, isZWaveError } from "@zwave-js/core";
import { fs } from "@zwave-js/core/bindings/fs/node";
import { BytesView } from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import path from "pathe";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
	Driver,
	OTWFirmwareUpdateStatus,
	extractFirmware,
	getEnumMemberName,
	guessFirmwareFileFormat,
	tryUnzipFirmwareFile,
} from "zwave-js";

const argv = yargs(hideBin(process.argv)).parseSync();
const [port, filename] = argv._.map(String);

if (!port || !filename) {
	console.error("Usage: flasher <port> <filename>");
	process.exit(1);
}

const verbose = !!argv.verbose;

let firmware: BytesView;

const driver = new Driver(port, {
	logConfig: verbose
		? {
			enabled: true,
			level: "silly",
		}
		: { enabled: false },
	testingHooks: {
		skipNodeInterview: true,
		loadConfiguration: false,
	},
	storage: {
		cacheDir: path.join(process.cwd(), "cache"),
		lockDir: path.join(process.cwd(), "cache/locks"),
	},
	bootloaderMode: "stay",
})
	.on("error", (e) => {
		if (isZWaveError(e) && e.code === ZWaveErrorCodes.Driver_Failed) {
			process.exit(0);
		}
	})
	.once("driver ready", async () => {
		await flash();
	})
	.once("bootloader ready", async () => {
		await flash();
	});

function clearLastLine() {
	if (verbose) return;
	process.stdout.moveCursor(0, -1);
	process.stdout.clearLine(1);
}

async function flash() {
	console.log("Flashing firmware...");
	let lastProgress = 0;
	driver.on("firmware update progress", (p) => {
		const rounded = Math.round(p.progress);
		if (rounded > lastProgress) {
			lastProgress = rounded;
			clearLastLine();
			console.log(
				`Flashing firmware... ${rounded.toString().padStart(3, " ")}%`,
			);
		}
	});
	driver.on("firmware update finished", async (r) => {
		if (r.success) {
			console.log("Firmware update successful");
			await wait(1000);
			process.exit(0);
		} else {
			console.log(
				`Firmware update failed: ${
					getEnumMemberName(
						OTWFirmwareUpdateStatus,
						r.status,
					)
				}`,
			);
			await wait(1000);
			process.exit(2);
		}
	});

	try {
		await driver.firmwareUpdateOTW(firmware);
	} catch (e: any) {
		console.error("Failed to update firmware:", e.message);
		process.exit(1);
	}
}

async function main() {
	let rawFile: BytesView;
	try {
		const fullPath = path.isAbsolute(filename)
			? filename
			: path.join(process.cwd(), filename);
		rawFile = await fs.readFile(fullPath);
	} catch (e: any) {
		console.error("Could not read firmware file:", e.message);
		process.exit(1);
	}

	try {
		let firmwareFile: BytesView;
		let firmwareFilename: string;

		// Check if the file is a ZIP archive and try to extract a single firmware file
		if (filename.toLowerCase().endsWith(".zip")) {
			const unzippedFirmware = tryUnzipFirmwareFile(rawFile);
			if (!unzippedFirmware) {
				console.error(
					"Could not extract a valid firmware file from the ZIP archive. The ZIP must contain exactly one firmware file.",
				);
				process.exit(1);
			}
			console.log(
				`Extracted firmware file "${unzippedFirmware.filename}" from ZIP archive`,
			);
			firmwareFile = unzippedFirmware.rawData;
			firmwareFilename = unzippedFirmware.filename;
		} else {
			firmwareFile = rawFile;
			firmwareFilename = filename;
		}

		const format = guessFirmwareFileFormat(firmwareFilename, firmwareFile);
		firmware = (await extractFirmware(firmwareFile, format)).data;
	} catch (e: any) {
		console.error("Could not parse firmware file:", e.message);
		process.exit(1);
	}

	try {
		console.log("Starting driver...");
		await driver.start();
	} catch (e: any) {
		console.error("The Z-Wave driver could not be started:", e.message);
		process.exit(1);
	}
}

void main().catch(console.error);
