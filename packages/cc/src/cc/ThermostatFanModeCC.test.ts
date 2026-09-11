import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { ThermostatFanModeCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	ThermostatFanModeCCReport,
	ThermostatFanModeCCSet,
	ThermostatFanModeCCSupportedReport,
} from "./ThermostatFanModeCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 5,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};
const ccId = CommandClasses["Thermostat Fan Mode"];

test.each([false, true])(
	"Fan mode codecs preserve off=%s and mask reserved bits",
	async (off) => {
		const value = (off ? 0x80 : 0) | 2;
		const set = ThermostatFanModeCCSet.from(
			new CCRaw(
				ccId,
				ThermostatFanModeCommand.Set,
				Bytes.from([value | 0x70]),
			),
			ctx,
		);
		expect(set).toMatchObject({ mode: 2, off });
		expect(await set.serialize(ctx)).toEqual(Bytes.from([ccId, 1, value]));
		const report = new ThermostatFanModeCCReport({
			nodeId: 2,
			mode: set.mode,
			off,
		});
		expect(await report.serialize(ctx)).toEqual(
			Bytes.from([ccId, 3, value]),
		);
		expect(
			ThermostatFanModeCCReport.from(
				new CCRaw(
					ccId,
					ThermostatFanModeCommand.Report,
					Bytes.from([value]),
				),
				ctx,
			),
		).toMatchObject({ mode: 2, off });
	},
);

test.each([{ supportedModes: [0, 2, 10] }, { supportedModes: [] }])(
	"Fan supported modes roundtrip %j",
	async ({ supportedModes }) => {
		const report = new ThermostatFanModeCCSupportedReport({
			nodeId: 2,
			supportedModes,
		});
		const payload = supportedModes.length ? [5, 4] : [0];
		expect(await report.serialize(ctx)).toEqual(
			Bytes.from([ccId, 5, ...payload]),
		);
		expect(
			ThermostatFanModeCCSupportedReport.from(
				new CCRaw(
					ccId,
					ThermostatFanModeCommand.SupportedReport,
					Bytes.from(payload),
				),
				ctx,
			).supportedModes,
		).toEqual(supportedModes);
	},
);

test("Fan mode Set rejects an empty payload", () => {
	expect(() =>
		ThermostatFanModeCCSet.from(
			new CCRaw(ccId, ThermostatFanModeCommand.Set, Bytes.from([])),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
