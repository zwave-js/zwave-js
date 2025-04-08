import { wait as _wait } from "alcalzone-shared/async";
import path from "node:path";
import "reflect-metadata";
import { NODE_ID_BROADCAST, Protocols, SecurityClass } from "@zwave-js/core";
import _os from "node:os";
import { fileURLToPath } from "node:url";
import {
	BinarySwitchCCSet,
	type CCEncodingContext,
	RCPHost,
	getEnumMemberName,
	getImplementedVersion,
} from "zwave-js";
import {
	RCPTransmitKind,
	type RCPTransmitOptions,
	RCPTransmitResult,
} from "../packages/zwave-js/src/lib/rcp/_Types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wait = _wait;
const os = _os;

process.on("unhandledRejection", (_r) => {
	// debugger;
});

const port = "/dev/serial/by-id/usb-Nabu_Casa_ZWA-2_D83BDA7524E4-if00";

const driver = new RCPHost(port, {
	logConfig: {
		// level: "verbose",
	},
	// logConfig: {
	// 	logToFile: true,
	// 	forceConsole: true,
	// },
})
	.on("error", console.error)
	.once("ready", async () => {
		// Test code goes here
		// const ONN = Bytes.from("ecab54510141040f032501ffff", "hex");
		// const OFF = Bytes.from("ecab54510141040f03250100ff", "hex");
		// const ROUTED_ON = Bytes.from(
		// 	"ecab545101810812030010022501ffffc9ff00",
		// 	"hex",
		// );

		const ownNodeId = 1;
		const homeId = 0xecab5451;

		const ccctx: CCEncodingContext = {
			ownNodeId: 1,
			homeId,
			getDeviceConfig: () => undefined,
			getHighestSecurityClass: () => SecurityClass.None,
			hasSecurityClass: () => false,
			securityManager: undefined,
			securityManager2: undefined,
			securityManagerLR: undefined,
			setSecurityClass: () => {},
			getSupportedCCVersion: (cc) => getImplementedVersion(cc),
		};

		// const mpdu = new SinglecastZWaveMPDU({
		// 	homeId,
		// 	ackRequested: true,
		// 	sourceNodeId: ownNodeId,
		// 	destinationNodeId: 3,
		// 	sequenceNumber: 1,
		// });
		const cc = new BinarySwitchCCSet({
			nodeId: NODE_ID_BROADCAST,
			targetValue: true,
		});
		// mpdu.payload = await cc.serialize(ccctx);

		const data = await cc.serialize(ccctx);
		const options: RCPTransmitOptions = {
			homeId,
			ackRequested: true,
			sourceNodeId: ownNodeId,
			destination: {
				kind: RCPTransmitKind.Broadcast,
				// nodeId: cc.nodeId as number,
			},
			protocol: Protocols.ZWaveLongRange,
		};

		const result = await driver.transmit(data, options);
		console.log(getEnumMemberName(RCPTransmitResult, result));

		// const nope = Bytes.from("ecab54510141040f03250100ff", "hex");
		// const result = await driver.transmit(mpdu, 0);
		// if (result === TransmitCallbackStatus.Completed) {
		// 	const ackPromise = driver.waitForMPDU(
		// 		(m) =>
		// 			m.headerType === MPDUHeaderType.Acknowledgement
		// 			&& m.sourceNodeId === mpdu.destinationNodeId
		// 			&& m.sequenceNumber === mpdu.sequenceNumber,
		// 		150,
		// 	);
		// 	const ack = await ackPromise.catch(() => undefined);
		// 	if (!ack) {
		// 		console.log("No ACK received");
		// 	}
		// }

		// await wait(2500);
		// process.exit(0);

		// for (let i = 0; i < 2; i++) {
		// 	const result = await driver.transmit(0, i % 2 === 0 ? ONN : OFF);
		// 	console.dir(result);
		// 	await wait(500);
		// }
	});
void driver.start();

process.on("SIGINT", async () => {
	await driver.destroy();
});
