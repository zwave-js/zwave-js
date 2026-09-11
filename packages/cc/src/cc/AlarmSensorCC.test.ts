import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { AlarmSensorCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	AlarmSensorCCGet,
	AlarmSensorCCReport,
	AlarmSensorCCSupportedReport,
} from "./AlarmSensorCC.js";

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
	setSecurityClass: () => {},
};

test.each([
	{ state: false, severity: undefined, value: 0 },
	{ state: true, severity: undefined, value: 255 },
	{ state: true, severity: 50, value: 50 },
])("Alarm report encodes state $value", async ({ state, severity, value }) => {
	const cc = new AlarmSensorCCReport({
		nodeId: 2,
		sensorType: 1,
		state,
		severity,
		duration: 300,
	});
	const bytes = await cc.serialize(ctx);
	expect(bytes).toEqual(
		Bytes.from([
			CommandClasses["Alarm Sensor"],
			AlarmSensorCommand.Report,
			0,
			1,
			value,
			1,
			44,
		]),
	);
	expect(AlarmSensorCCReport.from(CCRaw.parse(bytes), ctx)).toMatchObject({
		state,
		severity,
		duration: 300,
	});
});

test("Alarm capabilities round trip zero-based sensor types", async () => {
	const cc = new AlarmSensorCCSupportedReport({
		nodeId: 2,
		supportedSensorTypes: [0, 3],
	});
	const bytes = await cc.serialize(ctx);
	expect(bytes.subarray(2)).toEqual(Bytes.from([1, 9]));
	expect(
		AlarmSensorCCSupportedReport.from(CCRaw.parse(bytes), ctx)
			.supportedSensorTypes,
	).toEqual([0, 3]);
});

test("Alarm Get parses the any-sensor sentinel", async () => {
	const cc = new AlarmSensorCCGet({ nodeId: 2 });
	expect(
		AlarmSensorCCGet.from(CCRaw.parse(await cc.serialize(ctx)), ctx)
			.sensorType,
	).toBe(255);
});

test("Alarm codecs reject truncated fields", () => {
	for (const [command, parser, payload] of [
		[AlarmSensorCommand.Get, AlarmSensorCCGet, []],
		[AlarmSensorCommand.Report, AlarmSensorCCReport, [0, 1, 1, 0]],
		[
			AlarmSensorCommand.SupportedReport,
			AlarmSensorCCSupportedReport,
			[2, 1],
		],
	] as const) {
		expect(() =>
			parser.from(
				new CCRaw(
					CommandClasses["Alarm Sensor"],
					command,
					Bytes.from(payload),
				),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	}
});
