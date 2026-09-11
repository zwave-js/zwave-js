import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { EntryControlCommand, EntryControlDataTypes } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	EntryControlCCNotification,
	EntryControlCCKeySupportedReport,
	EntryControlCCEventSupportedReport,
	EntryControlCCConfigurationReport,
	EntryControlCCConfigurationSet,
} from "./EntryControlCC.js";

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

test.each([
	{ dataType: EntryControlDataTypes.None, eventData: undefined, length: 0 },
	{
		dataType: EntryControlDataTypes.Raw,
		eventData: Bytes.from([0, 255, 1]),
		length: 3,
	},
	{ dataType: EntryControlDataTypes.ASCII, eventData: "1234", length: 16 },
	{
		dataType: EntryControlDataTypes.ASCII,
		eventData: "1".repeat(17),
		length: 32,
	},
	{
		dataType: EntryControlDataTypes.MD5,
		eventData: new Bytes(16).fill(1),
		length: 16,
	},
])(
	"Entry Control notifications round trip data type $dataType and length $length",
	async ({ dataType, eventData, length }) => {
		const cc = new EntryControlCCNotification({
			nodeId: 2,
			sequenceNumber: 7,
			eventType: 2,
			dataType,
			eventData,
		});
		const bytes = await cc.serialize(ctx);
		expect(bytes.subarray(2, 6)).toEqual(
			Bytes.from([7, dataType, 2, length]),
		);
		if (dataType === EntryControlDataTypes.ASCII) {
			expect(bytes.at(-1)).toBe(255);
		}
		expect(
			EntryControlCCNotification.from(CCRaw.parse(bytes), ctx),
		).toMatchObject({ dataType, eventData });
	},
);

test("Entry Control capability masks round trip", async () => {
	const keys = new EntryControlCCKeySupportedReport({
		nodeId: 2,
		supportedKeys: [0, 8],
	});
	const keyBytes = await keys.serialize(ctx);
	expect(keyBytes.subarray(2)).toEqual(Bytes.from([2, 1, 1]));
	expect(
		EntryControlCCKeySupportedReport.from(CCRaw.parse(keyBytes), ctx)
			.supportedKeys,
	).toEqual([0, 8]);
	const options = {
		nodeId: 2,
		supportedDataTypes: [0, 2],
		supportedEventTypes: [0, 8],
		minKeyCacheSize: 1,
		maxKeyCacheSize: 32,
		minKeyCacheTimeout: 1,
		maxKeyCacheTimeout: 255,
	};
	const events = new EntryControlCCEventSupportedReport(options);
	const eventBytes = await events.serialize(ctx);
	expect(eventBytes.subarray(2)).toEqual(
		Bytes.from([1, 5, 2, 1, 1, 1, 32, 1, 255]),
	);
	expect(
		EntryControlCCEventSupportedReport.from(CCRaw.parse(eventBytes), ctx),
	).toMatchObject(options);
});

test("Entry Control configuration round trips", async () => {
	for (const Class of [
		EntryControlCCConfigurationReport,
		EntryControlCCConfigurationSet,
	]) {
		const cc = new Class({
			nodeId: 2,
			keyCacheSize: 32,
			keyCacheTimeout: 255,
		});
		const bytes = await cc.serialize(ctx);
		expect(bytes.subarray(2)).toEqual(Bytes.from([32, 255]));
		expect(Class.from(CCRaw.parse(bytes), ctx)).toMatchObject({
			keyCacheSize: 32,
			keyCacheTimeout: 255,
		});
	}
});

test.each([[], [1], [0, 1], [33, 1]].map((payload) => ({ payload })))(
	"Entry Control configuration rejects $payload",
	({ payload }) => {
		expect(() =>
			EntryControlCCConfigurationSet.from(
				new CCRaw(
					CommandClasses["Entry Control"],
					EntryControlCommand.ConfigurationSet,
					Bytes.from(payload),
				),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);

test("Entry Control rejects truncated event data", () => {
	expect(() =>
		EntryControlCCNotification.from(
			new CCRaw(
				CommandClasses["Entry Control"],
				EntryControlCommand.Notification,
				Bytes.from([1, 1, 1, 2, 0]),
			),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
