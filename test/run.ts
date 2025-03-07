import { wait as _wait } from "alcalzone-shared/async";
import path from "node:path";
import "reflect-metadata";
import { Bytes, getEnumMemberName } from "@zwave-js/shared/safe";
import _os from "node:os";
import { fileURLToPath } from "node:url";
import {
	Driver,
	type IndexedRGB,
	NabuCasaCommand,
	type Vector,
} from "zwave-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wait = _wait;
const os = _os;

process.on("unhandledRejection", (_r) => {
	debugger;
});

const port = "/dev/ttyACM0";

const red: IndexedRGB[] = [
	{ index: 0, r: 255, g: 0, b: 0 },
	{ index: 1, r: 255, g: 0, b: 0 },
	{ index: 2, r: 255, g: 0, b: 0 },
	{ index: 3, r: 255, g: 0, b: 0 },
];

const yellow: IndexedRGB[] = [
	{ index: 0, r: 200, g: 140, b: 0 },
	{ index: 1, r: 200, g: 140, b: 0 },
	{ index: 2, r: 200, g: 140, b: 0 },
	{ index: 3, r: 200, g: 140, b: 0 },
];

const green: IndexedRGB[] = [
	{ index: 0, r: 0, g: 255, b: 0 },
	{ index: 1, r: 0, g: 255, b: 0 },
	{ index: 2, r: 0, g: 255, b: 0 },
	{ index: 3, r: 0, g: 255, b: 0 },
];

const driver = new Driver(port, {
	// logConfig: {
	// 	logToFile: true,
	// 	forceConsole: true,
	// },
	// testingHooks: {
	// 	skipNodeInterview: true,
	// },
	securityKeys: {
		S0_Legacy: Bytes.from("0102030405060708090a0b0c0d0e0f10", "hex"),
		S2_Unauthenticated: Bytes.from(
			"5369389EFA18EE2A4894C7FB48347FEA",
			"hex",
		),
		S2_Authenticated: Bytes.from(
			"656EF5C0F020F3C14238C04A1748B7E1",
			"hex",
		),
		S2_AccessControl: Bytes.from(
			"31132050077310B6F7032F91C79C2EB8",
			"hex",
		),
	},
	securityKeysLongRange: {
		S2_Authenticated: Bytes.from(
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"hex",
		),
		S2_AccessControl: Bytes.from(
			"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
			"hex",
		),
	},
	rf: {
		preferLRRegion: false,
	},
	storage: {
		cacheDir: path.join(__dirname, "cache"),
		lockDir: path.join(__dirname, "cache/locks"),
		deviceConfigExternalDir: path.join(__dirname, "config"),
	},
	bootloaderMode: "allow",
})
	.on("error", console.error)
	.once("driver ready", async () => {
		// Test code goes here
		const nc = driver.controller.proprietary["Nabu Casa"];
		if (!nc) return;

		const supportedCommands = await nc.getSupportedCommands();
		console.log(
			`supported commands: ${
				supportedCommands.map((c) =>
					getEnumMemberName(NabuCasaCommand, c)
				).join(", ")
			}`,
		);

		for (let i = 0; i < 20; i++) {
			await wait(500);
			const gyro = await nc.readGyro();
			const angle = vectorAngle(gyro!, { x: 0, y: 0, z: -1 });
			console.log("angle from vertical: ", angle);

			if (angle < 20) {
				await nc.setLED(green);
			} else if (angle < 45) {
				await nc.setLED(yellow);
			} else {
				await nc.setLED(red);
			}
		}
	})
	.once("bootloader ready", async () => {
		// What to do when stuck in the bootloader
	});
void driver.start();
// driver.enableStatistics({
// 	applicationName: "test",
// 	applicationVersion: "0.0.1",
// });

process.on("SIGINT", async () => {
	await driver.destroy();
});

function vectorAngle(v1: Vector, v2: Vector): number {
	const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	const magnitudeV1 = Math.hypot(v1.x, v1.y, v1.z);
	const magnitudeV2 = Math.hypot(v2.x, v2.y, v2.z);
	const cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);
	return Math.acos(cosTheta) * (180 / Math.PI); // Winkel in Grad
}
