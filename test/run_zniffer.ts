import { RFRegion, ZnifferLRChannelConfig } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { wait as _wait } from "alcalzone-shared/async";
import "reflect-metadata";
import { Zniffer } from "zwave-js";

const wait = _wait;

process.on("unhandledRejection", (_r) => {
	debugger;
});

const port = "/dev/ttyACM0";

const zniffer = new Zniffer(port, {
	convertRSSI: true,
	defaultFrequency: RFRegion["Europe (Long Range)"],
	defaultLRChannelConfig: ZnifferLRChannelConfig["Classic & LR B"],
	securityKeys: {
		S2_AccessControl: Bytes.from(
			"31132050077310B6F7032F91C79C2EB8",
			"hex",
		),
		S2_Authenticated: Bytes.from(
			"656EF5C0F020F3C14238C04A1748B7E1",
			"hex",
		),
		S2_Unauthenticated: Bytes.from(
			"5369389EFA18EE2A4894C7FB48347FEA",
			"hex",
		),
		S0_Legacy: Bytes.from("0102030405060708090a0b0c0d0e0f10", "hex"),
	},
	securityKeysLongRange: {
		S2_AccessControl: Bytes.from(
			"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
			"hex",
		),
		S2_Authenticated: Bytes.from(
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"hex",
		),
	},
})
	.on("error", console.error)
	.once("ready", async () => {
		// Test code goes here
		await zniffer.start();

		// zniffer.on("frame", (frame) => {
		// 	console.debug(frame);
		// });

		await wait(600000);

		await zniffer.destroy();
		process.exit(0);
	});
void zniffer.init();
