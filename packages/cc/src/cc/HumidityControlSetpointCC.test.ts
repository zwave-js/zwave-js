import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { HumidityControlSetpointCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	HumidityControlSetpointCCCapabilitiesGet,
	HumidityControlSetpointCCCapabilitiesReport,
	HumidityControlSetpointCCGet,
	HumidityControlSetpointCCReport,
	HumidityControlSetpointCCScaleSupportedGet,
	HumidityControlSetpointCCScaleSupportedReport,
	HumidityControlSetpointCCSet,
	HumidityControlSetpointCCSupportedReport,
} from "./HumidityControlSetpointCC.js";

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
const ccId = CommandClasses["Humidity Control Setpoint"];
const raw = (
	command: HumidityControlSetpointCommand,
	payload: readonly number[],
) => new CCRaw(ccId, command, Bytes.from(payload));

test("Humidity setpoints preserve signed floats and scale", async () => {
	const payload = [1, 0x29, 0xf1];
	const set = HumidityControlSetpointCCSet.from(
		raw(HumidityControlSetpointCommand.Set, [0xf1, ...payload.slice(1)]),
		ctx,
	);
	expect(set).toMatchObject({ setpointType: 1, value: -1.5, scale: 1 });
	expect(await set.serialize(ctx)).toEqual(Bytes.from([ccId, 1, ...payload]));
	const report = new HumidityControlSetpointCCReport({
		nodeId: 2,
		type: 1,
		value: -1.5,
		scale: 1,
	});
	expect(await report.serialize(ctx)).toEqual(
		Bytes.from([ccId, 3, ...payload]),
	);
	expect(
		HumidityControlSetpointCCReport.from(
			raw(HumidityControlSetpointCommand.Report, payload),
			ctx,
		),
	).toMatchObject({ type: 1, value: -1.5, scale: 1 });
});

test("Humidity capabilities encode independent minimum and maximum scales", async () => {
	const options = {
		nodeId: 2,
		type: 1,
		minValue: -1.5,
		minValueScale: 1,
		maxValue: 60,
		maxValueScale: 0,
	};
	const report = new HumidityControlSetpointCCCapabilitiesReport(options);
	const payload = [1, 0x29, 0xf1, 1, 60];
	expect(await report.serialize(ctx)).toEqual(
		Bytes.from([
			ccId,
			HumidityControlSetpointCommand.CapabilitiesReport,
			...payload,
		]),
	);
	expect(
		HumidityControlSetpointCCCapabilitiesReport.from(
			raw(HumidityControlSetpointCommand.CapabilitiesReport, payload),
			ctx,
		),
	).toMatchObject(options);
});

test("Humidity supported reports encode zero-based masks", async () => {
	const types = new HumidityControlSetpointCCSupportedReport({
		nodeId: 2,
		supportedSetpointTypes: [1, 3],
	});
	expect(await types.serialize(ctx)).toEqual(
		Bytes.from([ccId, HumidityControlSetpointCommand.SupportedReport, 10]),
	);
	expect(
		HumidityControlSetpointCCSupportedReport.from(
			raw(HumidityControlSetpointCommand.SupportedReport, [10]),
			ctx,
		).supportedSetpointTypes,
	).toEqual([1, 3]);
	const scales = new HumidityControlSetpointCCScaleSupportedReport({
		nodeId: 2,
		supportedScales: [0, 1, 3],
	});
	expect(await scales.serialize(ctx)).toEqual(
		Bytes.from([
			ccId,
			HumidityControlSetpointCommand.ScaleSupportedReport,
			11,
		]),
	);
	expect(
		HumidityControlSetpointCCScaleSupportedReport.from(
			raw(HumidityControlSetpointCommand.ScaleSupportedReport, [0xfb]),
			ctx,
		).supportedScales,
	).toEqual([0, 1, 3]);
});

test("Humidity Get codecs mask reserved bits and reject empty payloads", async () => {
	for (const [ctor, command] of [
		[HumidityControlSetpointCCGet, HumidityControlSetpointCommand.Get],
		[
			HumidityControlSetpointCCScaleSupportedGet,
			HumidityControlSetpointCommand.ScaleSupportedGet,
		],
		[
			HumidityControlSetpointCCCapabilitiesGet,
			HumidityControlSetpointCommand.CapabilitiesGet,
		],
	] as const) {
		const get = ctor.from(raw(command, [0xf1]), ctx);
		expect(get.setpointType).toBe(1);
		expect(await get.serialize(ctx)).toEqual(
			Bytes.from([ccId, command, 1]),
		);
		expect(() => ctor.from(raw(command, []), ctx)).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	}
});

test.each([{ payload: [] }, { payload: [1] }, { payload: [1, 2, 0] }])(
	"Humidity Set rejects truncated floats %j",
	({ payload }) => {
		expect(() =>
			HumidityControlSetpointCCSet.from(
				raw(HumidityControlSetpointCommand.Set, payload),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);

test("Humidity capabilities reject a missing maximum", () => {
	expect(() =>
		HumidityControlSetpointCCCapabilitiesReport.from(
			raw(HumidityControlSetpointCommand.CapabilitiesReport, [1, 1, 0]),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
