import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { HumidityControlOperatingStateCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { HumidityControlOperatingStateCCReport } from "./HumidityControlOperatingStateCC.js";

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
const ccId = CommandClasses["Humidity Control Operating State"];

test("Humidity operating state roundtrips with reserved bits cleared", async () => {
	const report = HumidityControlOperatingStateCCReport.from(
		new CCRaw(
			ccId,
			HumidityControlOperatingStateCommand.Report,
			Bytes.from([0xf2]),
		),
		ctx,
	);
	expect(report.state).toBe(2);
	expect(await report.serialize(ctx)).toEqual(Bytes.from([ccId, 2, 2]));
});

test("Humidity operating state rejects an empty payload", () => {
	expect(() =>
		HumidityControlOperatingStateCCReport.from(
			new CCRaw(
				ccId,
				HumidityControlOperatingStateCommand.Report,
				Bytes.from([]),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
