import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { ThermostatFanStateCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { ThermostatFanStateCCReport } from "./ThermostatFanStateCC.js";

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
const ccId = CommandClasses["Thermostat Fan State"];

test("Fan state roundtrips with reserved bits cleared", async () => {
	const report = ThermostatFanStateCCReport.from(
		new CCRaw(ccId, ThermostatFanStateCommand.Report, Bytes.from([0xf2])),
		ctx,
	);
	expect(report.state).toBe(2);
	expect(await report.serialize(ctx)).toEqual(Bytes.from([ccId, 3, 2]));
});

test("Fan state rejects an empty payload", () => {
	expect(() =>
		ThermostatFanStateCCReport.from(
			new CCRaw(ccId, ThermostatFanStateCommand.Report, Bytes.from([])),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
