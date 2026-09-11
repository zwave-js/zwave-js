import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { TimeCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { TimeCCTimeOffsetSet } from "./TimeCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 2,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};

test.each([
	{ offsets: [0x85, 30, 60], standardOffset: -330, dstOffset: -270 },
	{ offsets: [5, 30, 0x80 | 30], standardOffset: 330, dstOffset: 300 },
])(
	"Time Offset Set parses signed offsets $standardOffset/$dstOffset",
	async ({ offsets, standardOffset, dstOffset }) => {
		const payload = Bytes.from([...offsets, 3, 15, 2, 10, 20, 3]);
		const cc = TimeCCTimeOffsetSet.from(
			new CCRaw(CommandClasses.Time, TimeCommand.TimeOffsetSet, payload),
			ctx,
		);
		const year = new Date().getUTCFullYear();
		expect(cc).toMatchObject({
			standardOffset,
			dstOffset,
			dstStartDate: new Date(Date.UTC(year, 2, 15, 2)),
			dstEndDate: new Date(Date.UTC(year, 9, 20, 3)),
		});
		expect(await cc.serialize(ctx)).toEqual(
			Bytes.concat([
				[CommandClasses.Time, TimeCommand.TimeOffsetSet],
				payload,
			]),
		);
	},
);

test("Time Offset Set rejects truncated dates", () => {
	expect(() =>
		TimeCCTimeOffsetSet.from(
			new CCRaw(
				CommandClasses.Time,
				TimeCommand.TimeOffsetSet,
				new Bytes(8),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
