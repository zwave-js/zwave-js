import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { ClockCommand, Weekday } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { ClockCCReport, ClockCCSet } from "./ClockCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 1,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};

test("Clock Set parses weekday and time", () => {
	const cc = ClockCCSet.from(
		new CCRaw(
			CommandClasses.Clock,
			ClockCommand.Set,
			Bytes.from([0xf7, 59]),
		),
		ctx,
	);
	expect(cc).toMatchObject({
		nodeId: 2,
		weekday: Weekday.Sunday,
		hour: 23,
		minute: 59,
	});
});

test("Clock Report serializes weekday and time", async () => {
	const cc = new ClockCCReport({
		nodeId: 2,
		weekday: Weekday.Sunday,
		hour: 23,
		minute: 59,
	});
	expect(await cc.serialize(ctx)).toEqual(
		Bytes.from([CommandClasses.Clock, ClockCommand.Report, 0xf7, 59]),
	);
});

test.each([[], [0], [24, 0], [0, 60]].map((payload) => ({ payload })))(
	"Clock Set rejects invalid payload $payload",
	({ payload }) => {
		expect(() =>
			ClockCCSet.from(
				new CCRaw(
					CommandClasses.Clock,
					ClockCommand.Set,
					Bytes.from(payload),
				),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);
