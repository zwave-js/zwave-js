import { wait as _wait } from "alcalzone-shared/async";
import path from "node:path";
import "reflect-metadata";
import _os from "node:os";
import { fileURLToPath } from "node:url";
import { RCPHost } from "zwave-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wait = _wait;
const os = _os;

process.on("unhandledRejection", (_r) => {
	debugger;
});

const port = "/dev/serial/by-id/usb-Nabu_Casa_ZWA-2_D83BDA7524E4-if00";

const driver = new RCPHost(port, {
	// logConfig: {
	// 	logToFile: true,
	// 	forceConsole: true,
	// },
})
	.on("error", console.error)
	.once("ready", async () => {
		// Test code goes here
	});
void driver.start();

process.on("SIGINT", async () => {
	await driver.destroy();
});
