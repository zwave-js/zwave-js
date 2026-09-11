import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { VersionCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { VersionCCZWaveSoftwareReport } from "./VersionCC.js";

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

test("Z-Wave Software Report encodes versions and big-endian build numbers", async () => {
	const options = {
		nodeId: 2,
		sdkVersion: "7.20.1",
		applicationFrameworkAPIVersion: "1.2.3",
		applicationFrameworkBuildNumber: 0x1234,
		hostInterfaceVersion: "4.5.6",
		hostInterfaceBuildNumber: 0x5678,
		zWaveProtocolVersion: "7.8.9",
		zWaveProtocolBuildNumber: 0x9abc,
		applicationVersion: "10.11.12",
		applicationBuildNumber: 0xdef0,
	};
	const cc = new VersionCCZWaveSoftwareReport(options);
	const payload = Bytes.from([
		7, 20, 1, 1, 2, 3, 0x12, 0x34, 4, 5, 6, 0x56, 0x78, 7, 8, 9, 0x9a, 0xbc,
		10, 11, 12, 0xde, 0xf0,
	]);
	expect(await cc.serialize(ctx)).toEqual(
		Bytes.concat([[0x86, 0x18], payload]),
	);
	expect(
		VersionCCZWaveSoftwareReport.from(
			new CCRaw(
				CommandClasses.Version,
				VersionCommand.ZWaveSoftwareReport,
				payload,
			),
			ctx,
		),
	).toMatchObject(options);
});

test("Z-Wave Software Report zeros unused components and builds", async () => {
	const cc = new VersionCCZWaveSoftwareReport({
		nodeId: 2,
		sdkVersion: "unused",
		applicationFrameworkAPIVersion: "unused",
		applicationFrameworkBuildNumber: 1,
		hostInterfaceVersion: "unused",
		hostInterfaceBuildNumber: 2,
		zWaveProtocolVersion: "unused",
		zWaveProtocolBuildNumber: 3,
		applicationVersion: "unused",
		applicationBuildNumber: 4,
	});
	expect(await cc.serialize(ctx)).toEqual(
		Bytes.concat([[0x86, 0x18], new Bytes(23)]),
	);
});

test("Z-Wave Software Report rejects truncated build numbers", () => {
	expect(() =>
		VersionCCZWaveSoftwareReport.from(
			new CCRaw(
				CommandClasses.Version,
				VersionCommand.ZWaveSoftwareReport,
				new Bytes(22),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
