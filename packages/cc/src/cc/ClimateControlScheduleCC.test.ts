import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { ClimateControlScheduleCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	ClimateControlScheduleCCChangedReport,
	ClimateControlScheduleCCGet,
	ClimateControlScheduleCCOverrideReport,
	ClimateControlScheduleCCOverrideSet,
	ClimateControlScheduleCCReport,
	ClimateControlScheduleCCSet,
} from "./ClimateControlScheduleCC.js";

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
const ccId = CommandClasses["Climate Control Schedule"];
const raw = (
	command: ClimateControlScheduleCommand,
	payload: readonly number[],
) => new CCRaw(ccId, command, Bytes.from(payload));

test("Schedule Set and Report preserve nine wire slots and omit unused entries", async () => {
	const payload = [
		2,
		6,
		30,
		0xf1,
		...Array.from({ length: 8 }, () => [0, 0, 0x7f]).flat(),
	];
	const set = ClimateControlScheduleCCSet.from(
		raw(ClimateControlScheduleCommand.Set, payload),
		ctx,
	);
	expect(set.switchPoints).toEqual([{ hour: 6, minute: 30, state: -1.5 }]);
	expect(await set.serialize(ctx)).toEqual(Bytes.from([ccId, 1, ...payload]));
	const report = new ClimateControlScheduleCCReport({
		nodeId: 2,
		weekday: 2,
		schedule: set.switchPoints,
	});
	expect(await report.serialize(ctx)).toEqual(
		Bytes.from([ccId, 3, ...payload]),
	);
	expect(
		ClimateControlScheduleCCReport.from(
			raw(ClimateControlScheduleCommand.Report, payload),
			ctx,
		).schedule,
	).toEqual(set.switchPoints);
});

test("Schedule Get masks reserved weekday bits", async () => {
	const get = ClimateControlScheduleCCGet.from(
		raw(ClimateControlScheduleCommand.Get, [0xfa]),
		ctx,
	);
	expect(get.weekday).toBe(2);
	expect(await get.serialize(ctx)).toEqual(Bytes.from([ccId, 2, 2]));
});

test.each([0, 0xf1, 0x79, 0x7a, 0x7f])(
	"Override codecs preserve setback byte %i",
	async (state) => {
		const set = ClimateControlScheduleCCOverrideSet.from(
			raw(ClimateControlScheduleCommand.OverrideSet, [0xfd, state]),
			ctx,
		);
		expect(set.overrideType).toBe(1);
		expect(await set.serialize(ctx)).toEqual(
			Bytes.from([ccId, 6, 1, state]),
		);
		const report = new ClimateControlScheduleCCOverrideReport({
			nodeId: 2,
			overrideType: set.overrideType,
			overrideState: set.overrideState,
		});
		expect(await report.serialize(ctx)).toEqual(
			Bytes.from([ccId, 8, 1, state]),
		);
		expect(
			ClimateControlScheduleCCOverrideReport.from(
				raw(ClimateControlScheduleCommand.OverrideReport, [1, state]),
				ctx,
			).overrideState,
		).toEqual(set.overrideState);
	},
);

test("Changed Report serializes its counter", async () => {
	const report = new ClimateControlScheduleCCChangedReport({
		nodeId: 2,
		changeCounter: 255,
	});
	expect(await report.serialize(ctx)).toEqual(Bytes.from([ccId, 5, 255]));
	expect(
		ClimateControlScheduleCCChangedReport.from(
			raw(ClimateControlScheduleCommand.ChangedReport, [255]),
			ctx,
		).changeCounter,
	).toBe(255);
});

test("Schedule parsers reject truncated payloads", () => {
	for (const [parse, command, payload] of [
		[
			ClimateControlScheduleCCSet.from.bind(ClimateControlScheduleCCSet),
			ClimateControlScheduleCommand.Set,
			Array(27).fill(0),
		],
		[
			ClimateControlScheduleCCGet.from.bind(ClimateControlScheduleCCGet),
			ClimateControlScheduleCommand.Get,
			[],
		],
		[
			ClimateControlScheduleCCOverrideSet.from.bind(
				ClimateControlScheduleCCOverrideSet,
			),
			ClimateControlScheduleCommand.OverrideSet,
			[1],
		],
	] as const) {
		expect(() => parse(raw(command, payload), ctx)).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	}
});
