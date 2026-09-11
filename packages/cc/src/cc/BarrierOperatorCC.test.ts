import { CommandClasses, UNKNOWN_STATE, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import {
	BarrierOperatorCommand,
	BarrierState,
	SubsystemState,
	SubsystemType,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	BarrierOperatorCCSet,
	BarrierOperatorCCReport,
	BarrierOperatorCCSignalingCapabilitiesReport,
	BarrierOperatorCCEventSignalingSet,
	BarrierOperatorCCEventSignalingGet,
	BarrierOperatorCCEventSignalingReport,
} from "./BarrierOperatorCC.js";

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

test.each([0, 30, 99, 252, 253, 254, 255])(
	"Barrier state %i round trips",
	async (value) => {
		const raw = new CCRaw(
			CommandClasses["Barrier Operator"],
			BarrierOperatorCommand.Report,
			Bytes.from([value]),
		);
		const cc = BarrierOperatorCCReport.from(raw, ctx);
		expect((await cc.serialize(ctx)).subarray(2)).toEqual(raw.payload);
	},
);

test("Barrier unknown state remains unknown", async () => {
	const cc = new BarrierOperatorCCReport({
		nodeId: 2,
		position: UNKNOWN_STATE,
		currentState: UNKNOWN_STATE,
	});
	expect(
		BarrierOperatorCCReport.from(CCRaw.parse(await cc.serialize(ctx)), ctx),
	).toMatchObject({ position: UNKNOWN_STATE, currentState: UNKNOWN_STATE });
});

test("Barrier Set and signaling commands round trip", async () => {
	const set = new BarrierOperatorCCSet({
		nodeId: 2,
		targetState: BarrierState.Open,
	});
	expect(
		BarrierOperatorCCSet.from(CCRaw.parse(await set.serialize(ctx)), ctx)
			.targetState,
	).toBe(255);
	for (const Class of [
		BarrierOperatorCCEventSignalingSet,
		BarrierOperatorCCEventSignalingReport,
	]) {
		const cc = new Class({
			nodeId: 2,
			subsystemType: SubsystemType.Audible,
			subsystemState: SubsystemState.On,
		});
		const bytes = await cc.serialize(ctx);
		expect(bytes.subarray(2)).toEqual(Bytes.from([1, 255]));
		expect(Class.from(CCRaw.parse(bytes), ctx)).toMatchObject({
			subsystemType: 1,
			subsystemState: 255,
		});
	}
	const get = new BarrierOperatorCCEventSignalingGet({
		nodeId: 2,
		subsystemType: SubsystemType.Visual,
	});
	expect(
		BarrierOperatorCCEventSignalingGet.from(
			CCRaw.parse(await get.serialize(ctx)),
			ctx,
		).subsystemType,
	).toBe(2);
	const caps = new BarrierOperatorCCSignalingCapabilitiesReport({
		nodeId: 2,
		supportedSubsystemTypes: [SubsystemType.Audible, SubsystemType.Visual],
	});
	const bytes = await caps.serialize(ctx);
	expect(bytes.subarray(2)).toEqual(Bytes.from([3]));
	expect(
		BarrierOperatorCCSignalingCapabilitiesReport.from(
			CCRaw.parse(bytes),
			ctx,
		).supportedSubsystemTypes,
	).toEqual([1, 2]);
});

test("Barrier parsers reject malformed commands", () => {
	for (const [Class, payload] of [
		[BarrierOperatorCCSet, []],
		[BarrierOperatorCCSet, [20]],
		[BarrierOperatorCCEventSignalingSet, [1]],
		[BarrierOperatorCCEventSignalingSet, [1, 20]],
		[BarrierOperatorCCEventSignalingGet, []],
		[BarrierOperatorCCEventSignalingGet, [99]],
	] as const) {
		expect(() =>
			Class.from(
				new CCRaw(
					CommandClasses["Barrier Operator"],
					0,
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
