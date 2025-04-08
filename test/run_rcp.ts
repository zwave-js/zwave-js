import { wait as _wait } from "alcalzone-shared/async";
import path from "node:path";
import "reflect-metadata";
import { type LogConfig } from "@zwave-js/core";
import _os from "node:os";
import { fileURLToPath } from "node:url";
import { type PHYLayer, ProtocolController, RCPHost } from "zwave-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wait = _wait;
const os = _os;

process.on("unhandledRejection", (_r) => {
	// debugger;
});

const port = "/dev/serial/by-id/usb-Nabu_Casa_ZWA-2_D83BDA7524E4-if00";

const logConfig: Partial<LogConfig> = {
	// 	logToFile: true,
	// 	forceConsole: true,
	// level: "verbose",
};

function phyFactory(): Promise<PHYLayer> {
	return new Promise(async (resolve) => {
		const phy = new RCPHost(port, {
			logConfig,
		})
			.on("error", console.error)
			.once("ready", () => resolve(phy));
		await phy.start();
	});
}

const driver = new ProtocolController({
	phy: phyFactory,
	logConfig,
})
	.on("error", console.error)
	.once("ready", async () => {
		const ownNodeId = 260;
		const homeId = 0xecab5451;

		driver.ownHomeId = homeId;
		driver.ownNodeId = ownNodeId;

		// const ccctx: CCEncodingContext = {
		// 	ownNodeId,
		// 	homeId,
		// 	getDeviceConfig: () => undefined,
		// 	getHighestSecurityClass: () => SecurityClass.None,
		// 	hasSecurityClass: () => false,
		// 	securityManager: undefined,
		// 	securityManager2: undefined,
		// 	securityManagerLR: undefined,
		// 	setSecurityClass: () => {},
		// 	getSupportedCCVersion: (cc) => getImplementedVersion(cc),
		// };

		// const cc = new BinarySwitchCCSet({
		// 	nodeId: 3,
		// 	targetValue: true,
		// });

		// const data = await cc.serialize(ccctx);
		// const options: RCPTransmitOptions = {
		// 	homeId,
		// 	ackRequested: true,
		// 	sourceNodeId: ownNodeId,
		// 	destination: {
		// 		kind: RCPTransmitKind.Singlecast,
		// 		nodeId: cc.nodeId as number,
		// 	},
		// 	protocol: Protocols.ZWaveLongRange,
		// };

		// const result = await driver.transmit(data, options);
		// console.log(getEnumMemberName(RCPTransmitResult, result));
	});
void driver.start();

process.on("SIGINT", async () => {
	await driver.destroy();
});
