import { CommandClasses, Duration, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { SceneActuatorConfigurationCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	SceneActuatorConfigurationCCGet,
	SceneActuatorConfigurationCCReport,
	SceneActuatorConfigurationCCSet,
} from "./SceneActuatorConfigurationCC.js";

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
const ccId = CommandClasses["Scene Actuator Configuration"];
const raw = (command: SceneActuatorConfigurationCommand, payload: number[]) =>
	new CCRaw(ccId, command, Bytes.from(payload));

test.each([false, true])(
	"Scene actuator Set decodes override=%s and default duration",
	async (override) => {
		const set = SceneActuatorConfigurationCCSet.from(
			raw(SceneActuatorConfigurationCommand.Set, [
				2,
				255,
				override ? 0xff : 0x7f,
				40,
			]),
			ctx,
		);
		expect(set.level).toBe(override ? 40 : undefined);
		expect(set.dimmingDuration).toEqual(Duration.default());
		expect(await set.serialize(ctx)).toEqual(
			Bytes.from([
				ccId,
				1,
				2,
				255,
				override ? 0x80 : 0,
				override ? 40 : 255,
			]),
		);
	},
);

test("Scene actuator Report serializes minute duration", async () => {
	const report = new SceneActuatorConfigurationCCReport({
		nodeId: 2,
		sceneId: 2,
		level: 40,
		dimmingDuration: new Duration(2, "minutes"),
	});
	expect(await report.serialize(ctx)).toEqual(
		Bytes.from([ccId, 3, 2, 40, 0x81]),
	);
	expect(
		SceneActuatorConfigurationCCReport.from(
			raw(SceneActuatorConfigurationCommand.Report, [2, 40, 0x81]),
			ctx,
		),
	).toMatchObject({
		sceneId: 2,
		level: 40,
		dimmingDuration: new Duration(2, "minutes"),
	});
});

test("Scene actuator inactive Report clears ignored fields", async () => {
	const report = new SceneActuatorConfigurationCCReport({
		nodeId: 2,
		sceneId: 0,
	});
	expect(await report.serialize(ctx)).toEqual(Bytes.from([ccId, 3, 0, 0, 0]));
	expect(
		SceneActuatorConfigurationCCReport.from(
			raw(SceneActuatorConfigurationCommand.Report, [0, 0, 0]),
			ctx,
		),
	).toMatchObject({
		sceneId: 0,
		level: undefined,
		dimmingDuration: undefined,
	});
});

test("Scene actuator Get preserves scene zero", async () => {
	const get = SceneActuatorConfigurationCCGet.from(
		raw(SceneActuatorConfigurationCommand.Get, [0]),
		ctx,
	);
	expect(await get.serialize(ctx)).toEqual(Bytes.from([ccId, 2, 0]));
	expect(() =>
		SceneActuatorConfigurationCCGet.from(
			raw(SceneActuatorConfigurationCommand.Get, []),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});

test.each([{ payload: [1, 0, 0] }, { payload: [0, 0, 0, 0] }])(
	"Scene actuator Set rejects invalid payload %j",
	({ payload }) => {
		expect(() =>
			SceneActuatorConfigurationCCSet.from(
				raw(SceneActuatorConfigurationCommand.Set, payload),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);
