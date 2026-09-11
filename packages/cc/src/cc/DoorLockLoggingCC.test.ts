import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { DoorLockLoggingCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	DoorLockLoggingCCRecordGet,
	DoorLockLoggingCCRecordReport,
	DoorLockLoggingCCRecordsSupportedReport,
} from "./DoorLockLoggingCC.js";

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

test("Door Lock Logging encodes empty records and supported counts", async () => {
	const empty = new DoorLockLoggingCCRecordReport({
		nodeId: 2,
		recordNumber: 3,
	});
	const bytes = await empty.serialize(ctx);
	expect(bytes.subarray(2)).toEqual(
		Bytes.from([3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
	);
	expect(
		DoorLockLoggingCCRecordReport.from(CCRaw.parse(bytes), ctx).record,
	).toBeUndefined();
	const caps = new DoorLockLoggingCCRecordsSupportedReport({
		nodeId: 2,
		recordsCount: 30,
	});
	expect((await caps.serialize(ctx)).subarray(2)).toEqual(Bytes.from([30]));
});

test.each(["1234", Bytes.from([0xff, 0x80, 0])])(
	"Door Lock Logging encodes timestamps and user codes %s",
	async (userCode) => {
		const record = {
			timestamp: new Date(2025, 5, 12, 14, 30, 45).toISOString(),
			eventType: 1,
			label: "Locked via Access Code",
			userId: 7,
			userCode,
		};
		const cc = new DoorLockLoggingCCRecordReport({
			nodeId: 2,
			recordNumber: 2,
			record,
		});
		const bytes = await cc.serialize(ctx);
		expect(bytes.subarray(2, 13)).toEqual(
			Bytes.from([2, 7, 233, 6, 12, 0x2e, 30, 45, 1, 7, userCode.length]),
		);
		expect(
			DoorLockLoggingCCRecordReport.from(CCRaw.parse(bytes), ctx).record,
		).toEqual(record);
	},
);

test("Door Lock Logging Get round trips latest-record sentinel", async () => {
	const cc = new DoorLockLoggingCCRecordGet({ nodeId: 2, recordNumber: 0 });
	expect(
		DoorLockLoggingCCRecordGet.from(
			CCRaw.parse(await cc.serialize(ctx)),
			ctx,
		).recordNumber,
	).toBe(0);
	expect(() =>
		DoorLockLoggingCCRecordGet.from(
			new CCRaw(
				CommandClasses["Door Lock Logging"],
				DoorLockLoggingCommand.RecordGet,
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

test("Door Lock Logging rejects a truncated user code", () => {
	expect(() =>
		DoorLockLoggingCCRecordReport.from(
			new CCRaw(
				CommandClasses["Door Lock Logging"],
				DoorLockLoggingCommand.RecordReport,
				Bytes.from([2, 7, 233, 6, 12, 0x2e, 30, 45, 1, 7, 2, 49]),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
