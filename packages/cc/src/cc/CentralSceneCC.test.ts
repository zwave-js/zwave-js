import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { CentralSceneCommand, CentralSceneKeys } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	CentralSceneCCNotification,
	CentralSceneCCSupportedReport,
	CentralSceneCCConfigurationReport,
	CentralSceneCCConfigurationSet,
} from "./CentralSceneCC.js";

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
	setSecurityClass: () => {},
};

test("Central Scene notifications encode slow refresh only for held keys", async () => {
	for (const keyAttribute of [
		CentralSceneKeys.KeyPressed,
		CentralSceneKeys.KeyHeldDown,
	]) {
		const cc = new CentralSceneCCNotification({
			nodeId: 2,
			sequenceNumber: 255,
			sceneNumber: 2,
			keyAttribute,
			slowRefresh: true,
		});
		const bytes = await cc.serialize(ctx);
		expect(bytes.subarray(2)).toEqual(
			Bytes.from([
				255,
				keyAttribute === CentralSceneKeys.KeyHeldDown ? 0x82 : 0,
				2,
			]),
		);
		expect(
			CentralSceneCCNotification.from(CCRaw.parse(bytes), ctx),
		).toMatchObject({
			keyAttribute,
			sceneNumber: 2,
			slowRefresh:
				keyAttribute === CentralSceneKeys.KeyHeldDown
					? true
					: undefined,
		});
	}
});

test("Central Scene capabilities encode each scene mask", async () => {
	const cc = new CentralSceneCCSupportedReport({
		nodeId: 2,
		sceneCount: 2,
		supportsSlowRefresh: true,
		supportedKeyAttributes: { 1: [0, 2], 2: [1, 6] },
	});
	const bytes = await cc.serialize(ctx);
	expect(bytes.subarray(2)).toEqual(Bytes.from([2, 0x82, 5, 66]));
	expect(
		CentralSceneCCSupportedReport.from(CCRaw.parse(bytes), ctx)
			.supportedKeyAttributes,
	).toEqual(
		new Map([
			[1, [0, 2]],
			[2, [1, 6]],
		]),
	);
});

test("Central Scene configuration round trips and ignores reserved bits", async () => {
	const cc = new CentralSceneCCConfigurationReport({
		nodeId: 2,
		slowRefresh: true,
	});
	expect((await cc.serialize(ctx)).subarray(2)).toEqual(Bytes.from([0x80]));
	const parsed = CentralSceneCCConfigurationSet.from(
		new CCRaw(
			CommandClasses["Central Scene"],
			CentralSceneCommand.ConfigurationSet,
			Bytes.from([0xff]),
		),
		ctx,
	);
	expect(parsed.slowRefresh).toBe(true);
	expect((await parsed.serialize(ctx)).subarray(2)).toEqual(
		Bytes.from([0x80]),
	);
});

test("Central Scene configuration rejects an empty payload", () => {
	expect(() =>
		CentralSceneCCConfigurationSet.from(
			new CCRaw(
				CommandClasses["Central Scene"],
				CentralSceneCommand.ConfigurationSet,
				new Bytes(0),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
