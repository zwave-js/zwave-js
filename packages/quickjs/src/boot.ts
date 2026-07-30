import { log as createLogContainer } from "@zwave-js/core/bindings/log/browser";
import { Bytes } from "@zwave-js/shared";
import { Driver } from "zwave-js";
import { db } from "./bindings/db.js";
import { fs } from "./bindings/fs.js";
import { serial } from "./bindings/serial.js";
import "./setImmediate.js";

const configDir = tjs.env.ZWAVEJS_CONFIG_DIR
	?? `${import.meta.dirname}/../../config/config`;
const cacheDir = tjs.env.ZWAVEJS_CACHE_DIR
	?? `${tjs.tmpDir}/zwave-js-quickjs-cache`;
const port = tjs.env.ZWAVEJS_PORT ?? "tcp://127.0.0.1:5555";

async function main(): Promise<void> {
	console.log(`config dir: ${configDir}`);
	console.log(`cache dir:  ${cacheDir}`);
	console.log(`port:       ${port}`);

	const indexPath = `${configDir}/devices/index.json`;
	const indexMtimeBefore = await fs.stat(indexPath)
		.then((s) => s.mtime.getTime())
		.catch(() => undefined);

	const driver = new Driver(port, {
		host: { fs, db, serial, log: createLogContainer },
		storage: {
			cacheDir,
			deviceConfigEmbeddedDir: configDir,
		},
		logConfig: {
			enabled: !!tjs.env.ZWAVEJS_LOGLEVEL,
			level: tjs.env.ZWAVEJS_LOGLEVEL,
		},
		// Must match packages/quickjs/mock-config.mjs so S2 communication works
		securityKeys: {
			S0_Legacy: Bytes.from("0102030405060708090a0b0c0d0e0f10", "hex"),
			S2_Unauthenticated: Bytes.from(
				"11111111111111111111111111111111",
				"hex",
			),
			S2_Authenticated: Bytes.from(
				"22222222222222222222222222222222",
				"hex",
			),
			S2_AccessControl: Bytes.from(
				"33333333333333333333333333333333",
				"hex",
			),
		},
	});

	const ready = new Promise<void>((resolve, reject) => {
		driver.once("driver ready", () => resolve());
		driver.on("error", reject);
	});

	await driver.start();
	await ready;

	const controller = driver.controller;
	console.log(
		`driver ready: home ID 0x${
			controller.homeId!.toString(16)
		}, own node ID ${controller.ownNodeId}, ${controller.nodes.size} node(s)`,
	);

	for (const node of controller.nodes.values()) {
		if (node.isControllerNode) continue;
		await new Promise<void>((resolve) => {
			if (node.ready) resolve();
			else node.once("ready", () => resolve());
		});
		console.log(
			`node ${node.id} interviewed: ${node.getDefinedValueIDs().length} value ID(s)`,
		);
	}

	// Regenerating is legitimate when the device files are newer than the index, e.g.
	// right after a checkout. What must not happen is regenerating on every run, so it
	// is the second boot in a row that carries the signal
	const indexMtimeAfter = (await fs.stat(indexPath)).mtime.getTime();
	if (indexMtimeBefore == undefined) {
		console.log("device index: generated (no index existed)");
	} else if (indexMtimeAfter !== indexMtimeBefore) {
		console.log("device index: regenerated");
	} else {
		console.log("device index: reused");
	}

	await driver.destroy();
	console.log("driver destroyed");
}

await main();

// The MessageChannel backing setImmediate keeps a libuv handle alive, so the event
// loop would never drain on its own
tjs.exit(0);
