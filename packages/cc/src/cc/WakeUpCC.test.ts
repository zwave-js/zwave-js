import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { WakeUpCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	WakeUpCCIntervalCapabilitiesReport,
	WakeUpCCIntervalReport,
} from "./WakeUpCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 3,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};

test("Wake Up Interval Report serializes a 24-bit interval", async () => {
	const cc = new WakeUpCCIntervalReport({
		nodeId: 2,
		wakeUpInterval: 0x123456,
		controllerNodeId: 5,
	});
	const payload = Bytes.from([0x12, 0x34, 0x56, 5]);
	expect(await cc.serialize(ctx)).toEqual(Bytes.concat([[0x84, 6], payload]));
	expect(
		WakeUpCCIntervalReport.from(
			new CCRaw(
				CommandClasses["Wake Up"],
				WakeUpCommand.IntervalReport,
				payload,
			),
			ctx,
		),
	).toMatchObject({ wakeUpInterval: 0x123456, controllerNodeId: 5 });
});

test.each([false, true])(
	"Wake Up Capabilities serializes on-demand support %s",
	async (wakeUpOnDemandSupported) => {
		const options = {
			nodeId: 2,
			minWakeUpInterval: 0x010203,
			maxWakeUpInterval: 0xffffff,
			defaultWakeUpInterval: 0x040506,
			wakeUpIntervalSteps: 0x070809,
			wakeUpOnDemandSupported,
		};
		const cc = new WakeUpCCIntervalCapabilitiesReport(options);
		const payload = Bytes.from([
			1,
			2,
			3,
			255,
			255,
			255,
			4,
			5,
			6,
			7,
			8,
			9,
			+wakeUpOnDemandSupported,
		]);
		expect(await cc.serialize(ctx)).toEqual(
			Bytes.concat([[0x84, 10], payload]),
		);
		expect(
			WakeUpCCIntervalCapabilitiesReport.from(
				new CCRaw(
					CommandClasses["Wake Up"],
					WakeUpCommand.IntervalCapabilitiesReport,
					payload,
				),
				ctx,
			),
		).toMatchObject(options);
	},
);

test("Wake Up reports reject truncated intervals", () => {
	expect(() =>
		WakeUpCCIntervalReport.from(
			new CCRaw(
				CommandClasses["Wake Up"],
				WakeUpCommand.IntervalReport,
				new Bytes(3),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
	expect(() =>
		WakeUpCCIntervalCapabilitiesReport.from(
			new CCRaw(
				CommandClasses["Wake Up"],
				WakeUpCommand.IntervalCapabilitiesReport,
				new Bytes(11),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
