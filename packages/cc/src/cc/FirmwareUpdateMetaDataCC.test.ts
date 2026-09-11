import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { FirmwareUpdateMetaDataCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { FirmwareUpdateMetaDataCCReport } from "./FirmwareUpdateMetaDataCC.js";

const parsingContext: CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: () => {},
};

const ctx: CCEncodingContext & CCParsingContext = {
	...parsingContext,
	getSupportedCCVersion: () => 2,
};

test("Firmware V1 fragments preserve checksum-shaped firmware bytes", async () => {
	const v1Context = { ...ctx, getSupportedCCVersion: () => 1 };
	const options = {
		nodeId: 2,
		isLast: true,
		reportNumber: 1,
		firmwareData: Bytes.from([0, 1, 2, 3]),
	};
	const cc = new FirmwareUpdateMetaDataCCReport(options);
	const bytes = await cc.serialize(v1Context);
	expect(bytes.subarray(2)).toEqual(Bytes.from([0x80, 1, 0, 1, 2, 3]));
	expect(
		FirmwareUpdateMetaDataCCReport.from(CCRaw.parse(bytes), v1Context),
	).toMatchObject(options);
});

test("Firmware parsing defaults to checksum validation without version information", async () => {
	const cc = new FirmwareUpdateMetaDataCCReport({
		nodeId: 2,
		isLast: true,
		reportNumber: 1,
		firmwareData: Bytes.from([7]),
	});
	const raw = CCRaw.parse(await cc.serialize(ctx));
	expect(
		FirmwareUpdateMetaDataCCReport.from(raw, parsingContext).firmwareData,
	).toEqual(Bytes.from([7]));
	raw.payload[2] ^= 1;
	expect(() =>
		FirmwareUpdateMetaDataCCReport.from(raw, parsingContext),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});

test.each([false, true])(
	"Firmware fragments round trip with last=%s",
	async (isLast) => {
		const options = {
			nodeId: 2,
			isLast,
			reportNumber: 0x1234,
			firmwareData: Bytes.from([0, 1, 255, 128]),
		};
		const cc = new FirmwareUpdateMetaDataCCReport(options);
		const bytes = await cc.serialize(ctx);
		expect(bytes.subarray(2, -2)).toEqual(
			Bytes.from([isLast ? 0x92 : 0x12, 0x34, 0, 1, 255, 128]),
		);
		expect(
			FirmwareUpdateMetaDataCCReport.from(CCRaw.parse(bytes), ctx),
		).toMatchObject(options);
		bytes[4] ^= 1;
		expect(() =>
			FirmwareUpdateMetaDataCCReport.from(CCRaw.parse(bytes), ctx),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);

test.each(
	[[], [0], [0, 1], [0, 1, 0], [0, 1, 0, 0]].map((payload) => ({ payload })),
)("Firmware fragment rejects short payload $payload", ({ payload }) => {
	expect(() =>
		FirmwareUpdateMetaDataCCReport.from(
			new CCRaw(
				CommandClasses["Firmware Update Meta Data"],
				FirmwareUpdateMetaDataCommand.Report,
				Bytes.from(payload),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
