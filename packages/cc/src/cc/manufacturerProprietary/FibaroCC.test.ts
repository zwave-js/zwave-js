import { CommandClasses, UNKNOWN_STATE, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../../lib/CommandClass.js";
import type { CCEncodingContext, CCParsingContext } from "../../lib/traits.js";

import {
	FibaroVenetianBlindCCReport,
	FibaroVenetianBlindCCSet,
} from "./FibaroCC.js";

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
const raw = (payload: number[]) =>
	new CCRaw(
		CommandClasses["Manufacturer Proprietary"],
		undefined,
		Bytes.from(payload),
	);

test.each([
	{
		payload: [0xfe, 25, 88],
		position: 25,
		tilt: undefined,
		encoded: [2, 25, 0],
	},
	{
		payload: [1, 88, 40],
		position: undefined,
		tilt: 40,
		encoded: [1, 0, 40],
	},
	{ payload: [3, 25, 40], position: 25, tilt: 40, encoded: [3, 25, 40] },
])(
	"Fibaro Set parses selected fields $payload",
	async ({ payload, position, tilt, encoded }) => {
		const cc = FibaroVenetianBlindCCSet.from(raw(payload), ctx);
		expect(cc).toMatchObject({ position, tilt });
		expect(await cc.serialize(ctx)).toEqual(
			Bytes.from([0x91, 1, 0x0f, 0x26, 1, ...encoded]),
		);
	},
);

test.each([
	{ position: 25, tilt: 40, payload: [3, 25, 40] },
	{ position: UNKNOWN_STATE, tilt: undefined, payload: [2, 0xfe, 0] },
	{ position: undefined, tilt: UNKNOWN_STATE, payload: [1, 0, 0xfe] },
	{ position: undefined, tilt: undefined, payload: [0, 0, 0] },
])(
	"Fibaro Report encodes selected and unknown values $payload",
	async ({ position, tilt, payload }) => {
		const cc = new FibaroVenetianBlindCCReport({
			nodeId: 2,
			position,
			tilt,
		});
		const expected = Bytes.from([0x91, 1, 0x0f, 0x26, 3, ...payload]);
		expect(await cc.serialize(ctx)).toEqual(expected);
		expect(await cc.serialize(ctx)).toEqual(expected);
		expect(
			FibaroVenetianBlindCCReport.from(raw(payload), ctx),
		).toMatchObject({ position, tilt });
	},
);

test.each([[], [3], [3, 1], [0, 1, 2]].map((payload) => ({ payload })))(
	"Fibaro Set rejects malformed payload $payload",
	({ payload }) => {
		expect(() => FibaroVenetianBlindCCSet.from(raw(payload), ctx)).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);
