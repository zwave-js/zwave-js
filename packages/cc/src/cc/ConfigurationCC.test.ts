import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { ConfigurationCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	ConfigurationCCBulkGet,
	ConfigurationCCBulkReport,
	ConfigurationCCBulkSet,
} from "./ConfigurationCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 4,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};

test.each([1, 2, 3, 4])(
	"Bulk Set roundtrips signed values of size %s",
	async (valueSize) => {
		const options = {
			nodeId: 2,
			parameters: [65534, 65535],
			handshake: true,
			valueSize,
			values: [-(2 ** (8 * valueSize - 1)), 2 ** (8 * valueSize - 1) - 1],
		};
		const bytes = await new ConfigurationCCBulkSet(options).serialize(ctx);
		const cc = ConfigurationCCBulkSet.from(CCRaw.parse(bytes), ctx);
		expect(cc).toMatchObject(options);
		expect(await cc.serialize(ctx)).toEqual(bytes);
	},
);

test("Bulk Set parses reset and handshake flags", async () => {
	const options = {
		nodeId: 2,
		parameters: [256, 257],
		handshake: true,
		resetToDefault: true as const,
	};
	const bytes = await new ConfigurationCCBulkSet(options).serialize(ctx);
	expect([...bytes.subarray(2)]).toEqual([1, 0, 2, 0xc1, 0, 0]);
	expect(ConfigurationCCBulkSet.from(CCRaw.parse(bytes), ctx)).toMatchObject(
		options,
	);
});

test("Bulk Get roundtrips the maximum parameter number", async () => {
	const bytes = await new ConfigurationCCBulkGet({
		nodeId: 2,
		parameters: [65535],
	}).serialize(ctx);
	expect([...bytes.subarray(2)]).toEqual([255, 255, 1]);
	expect(
		ConfigurationCCBulkGet.from(CCRaw.parse(bytes), ctx).parameters,
	).toEqual([65535]);
});

test("Bulk Get parses the maximum parameter count", () => {
	const cc = ConfigurationCCBulkGet.from(
		new CCRaw(
			CommandClasses.Configuration,
			ConfigurationCommand.BulkGet,
			Bytes.from([0, 0, 255]),
		),
		ctx,
	);
	expect(cc.parameters).toHaveLength(255);
	expect(cc.parameters[0]).toBe(0);
	expect(cc.parameters.at(-1)).toBe(254);
});

test.each(
	[[], [0, 1, 1, 0], [0, 1, 1, 0, 5], [0, 1, 1, 0, 2, 0]].map((payload) => ({
		payload,
	})),
)("Bulk Report rejects malformed payload $payload", ({ payload }) => {
	expect(() =>
		ConfigurationCCBulkReport.from(
			new CCRaw(
				CommandClasses.Configuration,
				ConfigurationCommand.BulkReport,
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

test.each([
	{
		command: ConfigurationCommand.BulkGet,
		parse: ConfigurationCCBulkGet.from.bind(ConfigurationCCBulkGet),
		payloads: [[], [0], [0, 1], [0, 1, 0], [255, 255, 2]],
	},
	{
		command: ConfigurationCommand.BulkSet,
		parse: ConfigurationCCBulkSet.from.bind(ConfigurationCCBulkSet),
		payloads: [
			[],
			[0, 1, 1],
			[0, 1, 1, 0],
			[0, 1, 1, 5],
			[0, 1, 0, 1],
			[0, 1, 1, 2, 0],
			[255, 255, 2, 1, 0, 0],
		],
	},
])(
	"Configuration command $command rejects malformed payloads",
	({ command, parse, payloads }) => {
		for (const payload of payloads) {
			expect(() =>
				parse(
					new CCRaw(
						CommandClasses.Configuration,
						command,
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
	},
);

test.each([1, 2, 3, 4])(
	"Bulk Report roundtrips signed values of size %s",
	async (valueSize) => {
		const values = {
			256: -(2 ** (8 * valueSize - 1)),
			257: 2 ** (8 * valueSize - 1) - 1,
		};
		const options = {
			nodeId: 2,
			reportsToFollow: 255,
			defaultValues: true,
			isHandshakeResponse: true,
			valueSize,
			values,
		};
		const bytes = await new ConfigurationCCBulkReport(options).serialize(
			ctx,
		);
		expect([...bytes.subarray(2, 7)]).toEqual([
			1,
			0,
			2,
			255,
			0xc0 | valueSize,
		]);
		const parsed = ConfigurationCCBulkReport.from(CCRaw.parse(bytes), ctx);
		expect(parsed.values).toEqual(
			new Map(
				Object.entries(values).map(([key, value]) => [
					Number(key),
					value,
				]),
			),
		);
		expect(await parsed.serialize(ctx)).toEqual(bytes);
	},
);

test("Bulk Report serializes unsigned values as their wire representation", async () => {
	const bytes = await new ConfigurationCCBulkReport({
		nodeId: 2,
		reportsToFollow: 0,
		defaultValues: false,
		isHandshakeResponse: false,
		valueSize: 1,
		values: { 1: 255 },
	}).serialize(ctx);
	expect([...bytes.subarray(2)]).toEqual([0, 1, 1, 0, 1, 255]);
	expect(
		ConfigurationCCBulkReport.from(CCRaw.parse(bytes), ctx).values.get(1),
	).toBe(-1);
});

test("Bulk Report preserves empty reports with size zero", async () => {
	const raw = new CCRaw(
		CommandClasses.Configuration,
		ConfigurationCommand.BulkReport,
		Bytes.from([0, 0, 0, 0, 0]),
	);
	const cc = ConfigurationCCBulkReport.from(raw, ctx);
	expect(cc.values.size).toBe(0);
	expect(cc.valueSize).toBe(0);
	expect(CCRaw.parse(await cc.serialize(ctx)).payload).toEqual(raw.payload);
});

test.each([
	{ valueSize: 1, values: { 1: 0, 3: 0 } },
	{ valueSize: 0, values: { 1: 0 } },
	{ valueSize: 5, values: { 1: 0 } },
	{ valueSize: 1, values: { 1: 256 } },
	{ valueSize: 1, values: { 1: -129 } },
])("Bulk Report rejects unencodable values: $values", (options) => {
	expect(() =>
		new ConfigurationCCBulkReport({
			nodeId: 2,
			reportsToFollow: 0,
			defaultValues: false,
			isHandshakeResponse: false,
			...options,
		}).serialize(ctx),
	).toThrow(
		expect.objectContaining({ code: ZWaveErrorCodes.Argument_Invalid }),
	);
});
