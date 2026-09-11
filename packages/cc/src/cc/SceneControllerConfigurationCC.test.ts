import { CommandClasses, Duration, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { SceneControllerConfigurationCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	SceneControllerConfigurationCCGet,
	SceneControllerConfigurationCCReport,
	SceneControllerConfigurationCCSet,
} from "./SceneControllerConfigurationCC.js";

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
const ccId = CommandClasses["Scene Controller Configuration"];
const raw = (command: SceneControllerConfigurationCommand, payload: number[]) =>
	new CCRaw(ccId, command, Bytes.from(payload));

test.each([0, 5, 0x80, 0xff])(
	"Scene controller Set roundtrips duration byte %i",
	async (duration) => {
		const set = SceneControllerConfigurationCCSet.from(
			raw(SceneControllerConfigurationCommand.Set, [2, 0, duration]),
			ctx,
		);
		expect(set).toMatchObject({
			groupId: 2,
			sceneId: 0,
			dimmingDuration: Duration.parseSet(duration),
		});
		expect(await set.serialize(ctx)).toEqual(
			Bytes.from([ccId, 1, 2, 0, duration]),
		);
	},
);

test.each([new Duration(2, "minutes"), Duration.unknown()])(
	"Scene controller Report roundtrips %j",
	async (dimmingDuration) => {
		const report = new SceneControllerConfigurationCCReport({
			nodeId: 2,
			groupId: 2,
			sceneId: 3,
			dimmingDuration,
		});
		const durationByte = dimmingDuration.unit === "unknown" ? 0xfe : 0x81;
		expect(await report.serialize(ctx)).toEqual(
			Bytes.from([ccId, 3, 2, 3, durationByte]),
		);
		expect(
			SceneControllerConfigurationCCReport.from(
				raw(SceneControllerConfigurationCommand.Report, [
					2,
					3,
					durationByte,
				]),
				ctx,
			),
		).toMatchObject({ groupId: 2, sceneId: 3, dimmingDuration });
	},
);

test("Scene controller Get preserves group zero", async () => {
	const get = SceneControllerConfigurationCCGet.from(
		raw(SceneControllerConfigurationCommand.Get, [0]),
		ctx,
	);
	expect(await get.serialize(ctx)).toEqual(Bytes.from([ccId, 2, 0]));
	expect(() =>
		SceneControllerConfigurationCCGet.from(
			raw(SceneControllerConfigurationCommand.Get, []),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});

test("Scene controller Set rejects truncated payloads", () => {
	expect(() =>
		SceneControllerConfigurationCCSet.from(
			raw(SceneControllerConfigurationCommand.Set, [1, 2]),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
