import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { HumidityControlModeCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	HumidityControlModeCCReport,
	HumidityControlModeCCSet,
	HumidityControlModeCCSupportedReport,
} from "./HumidityControlModeCC.js";

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
const ccId = CommandClasses["Humidity Control Mode"];

test("Humidity mode codecs mask reserved bits", async () => {
	const set = HumidityControlModeCCSet.from(
		new CCRaw(ccId, HumidityControlModeCommand.Set, Bytes.from([0xf2])),
		ctx,
	);
	expect(set.mode).toBe(2);
	expect(await set.serialize(ctx)).toEqual(Bytes.from([ccId, 1, 2]));
	const report = new HumidityControlModeCCReport({
		nodeId: 2,
		mode: set.mode,
	});
	expect(await report.serialize(ctx)).toEqual(Bytes.from([ccId, 3, 2]));
	expect(
		HumidityControlModeCCReport.from(
			new CCRaw(ccId, HumidityControlModeCommand.Report, Bytes.from([2])),
			ctx,
		).mode,
	).toBe(2);
});

test("Humidity supported modes encode zero-based bits", async () => {
	const report = new HumidityControlModeCCSupportedReport({
		nodeId: 2,
		supportedModes: [0, 2, 3],
	});
	expect(await report.serialize(ctx)).toEqual(Bytes.from([ccId, 5, 0x0d]));
	expect(
		HumidityControlModeCCSupportedReport.from(
			new CCRaw(
				ccId,
				HumidityControlModeCommand.SupportedReport,
				Bytes.from([0x0d]),
			),
			ctx,
		).supportedModes,
	).toEqual([0, 2, 3]);
});

test("Humidity mode Set rejects an empty payload", () => {
	expect(() =>
		HumidityControlModeCCSet.from(
			new CCRaw(ccId, HumidityControlModeCommand.Set, Bytes.from([])),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
