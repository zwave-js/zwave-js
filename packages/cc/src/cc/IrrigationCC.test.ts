import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw, type CommandClass } from "../lib/CommandClass.js";
import { IrrigationCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	IrrigationCCSystemConfigReport,
	IrrigationCCSystemConfigSet,
	IrrigationCCSystemInfoReport,
	IrrigationCCSystemShutoff,
	IrrigationCCSystemStatusReport,
	IrrigationCCValveConfigGet,
	IrrigationCCValveConfigReport,
	IrrigationCCValveConfigSet,
	IrrigationCCValveInfoGet,
	IrrigationCCValveInfoReport,
	IrrigationCCValveRun,
	IrrigationCCValveTableGet,
	IrrigationCCValveTableReport,
	IrrigationCCValveTableRun,
	IrrigationCCValveTableSet,
} from "./IrrigationCC.js";

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

const systemConfig = {
	nodeId: 2,
	masterValveDelay: 255,
	highPressureThreshold: 123.5,
	lowPressureThreshold: 0,
	rainSensorPolarity: 0,
	moistureSensorPolarity: 1,
};
const valveConfig = {
	nodeId: 2,
	valveId: "master" as const,
	nominalCurrentHighThreshold: 2550,
	nominalCurrentLowThreshold: 0,
	maximumFlow: 1000,
	highFlowThreshold: 123.5,
	lowFlowThreshold: 0,
	useRainSensor: true,
	useMoistureSensor: false,
};
const table = {
	nodeId: 2,
	tableId: 255,
	entries: [
		{ valveId: 1, duration: 0 },
		{ valveId: 255, duration: 65535 },
	],
};

const cases: {
	cc: CommandClass;
	parse: (raw: CCRaw, ctx: CCParsingContext) => CommandClass;
	expected: object;
}[] = [
	{
		cc: new IrrigationCCSystemConfigSet(systemConfig),
		parse: IrrigationCCSystemConfigSet.from.bind(
			IrrigationCCSystemConfigSet,
		),
		expected: systemConfig,
	},
	{
		cc: new IrrigationCCSystemConfigReport(systemConfig),
		parse: IrrigationCCSystemConfigReport.from.bind(
			IrrigationCCSystemConfigReport,
		),
		expected: systemConfig,
	},
	{
		cc: new IrrigationCCValveConfigSet(valveConfig),
		parse: IrrigationCCValveConfigSet.from.bind(IrrigationCCValveConfigSet),
		expected: valveConfig,
	},
	{
		cc: new IrrigationCCValveConfigReport(valveConfig),
		parse: IrrigationCCValveConfigReport.from.bind(
			IrrigationCCValveConfigReport,
		),
		expected: valveConfig,
	},
	{
		cc: new IrrigationCCValveTableSet(table),
		parse: IrrigationCCValveTableSet.from.bind(IrrigationCCValveTableSet),
		expected: table,
	},
	{
		cc: new IrrigationCCValveTableReport(table),
		parse: IrrigationCCValveTableReport.from.bind(
			IrrigationCCValveTableReport,
		),
		expected: table,
	},
	{
		cc: new IrrigationCCValveInfoGet({ nodeId: 2, valveId: "master" }),
		parse: IrrigationCCValveInfoGet.from.bind(IrrigationCCValveInfoGet),
		expected: { valveId: "master" },
	},
	{
		cc: new IrrigationCCValveConfigGet({ nodeId: 2, valveId: 255 }),
		parse: IrrigationCCValveConfigGet.from.bind(IrrigationCCValveConfigGet),
		expected: { valveId: 255 },
	},
	{
		cc: new IrrigationCCValveRun({
			nodeId: 2,
			valveId: 255,
			duration: 65535,
		}),
		parse: IrrigationCCValveRun.from.bind(IrrigationCCValveRun),
		expected: { valveId: 255, duration: 65535 },
	},
	{
		cc: new IrrigationCCValveTableGet({ nodeId: 2, tableId: 255 }),
		parse: IrrigationCCValveTableGet.from.bind(IrrigationCCValveTableGet),
		expected: { tableId: 255 },
	},
	{
		cc: new IrrigationCCValveTableRun({ nodeId: 2, tableIDs: [0, 1, 255] }),
		parse: IrrigationCCValveTableRun.from.bind(IrrigationCCValveTableRun),
		expected: { tableIDs: [0, 1, 255] },
	},
	{
		cc: new IrrigationCCSystemShutoff({ nodeId: 2 }),
		parse: IrrigationCCSystemShutoff.from.bind(IrrigationCCSystemShutoff),
		expected: { duration: 255 },
	},
];

for (const { cc, parse, expected } of cases) {
	test(`${cc.constructor.name} roundtrips`, async () => {
		const serialized = await cc.serialize(ctx);
		const parsed = parse(CCRaw.parse(serialized), ctx);
		expect(parsed).toMatchObject(expected);
		expect(await parsed.serialize(ctx)).toEqual(serialized);
	});

	test(`${cc.constructor.name} rejects truncated payloads`, async () => {
		const raw = CCRaw.parse(await cc.serialize(ctx));
		const minimumLength =
			cc instanceof IrrigationCCValveTableRun ? 1 : raw.payload.length;
		for (let length = 0; length < minimumLength; length++) {
			if (
				(cc instanceof IrrigationCCValveTableSet
					|| cc instanceof IrrigationCCValveTableReport)
				&& length >= 1
				&& (length - 1) % 3 === 0
			)
				continue;
			expect(() =>
				parse(
					new CCRaw(
						raw.ccId,
						raw.ccCommand,
						raw.payload.subarray(0, length),
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
}

test("System Info Report serializes capability fields", async () => {
	const options = {
		nodeId: 2,
		supportsMasterValve: true,
		numValves: 255,
		numValveTables: 255,
		maxValveTableSize: 15,
	};
	const bytes = await new IrrigationCCSystemInfoReport(options).serialize(
		ctx,
	);
	expect([...bytes.subarray(2)]).toEqual([1, 255, 255, 15]);
	expect(
		IrrigationCCSystemInfoReport.from(CCRaw.parse(bytes), ctx),
	).toMatchObject(options);
});

test.each([true, false])(
	"System Status Report roundtrips active sensors: %s",
	async (active) => {
		const options = {
			nodeId: 2,
			systemVoltage: 24,
			flowSensorActive: active,
			pressureSensorActive: active,
			rainSensorActive: true,
			moistureSensorActive: false,
			flow: active ? 123.5 : undefined,
			pressure: active ? 400 : undefined,
			shutoffDuration: 255,
			errorNotProgrammed: true,
			errorEmergencyShutdown: false,
			errorHighPressure: true,
			errorLowPressure: false,
			errorValve: true,
			masterValveOpen: active,
			firstOpenZoneId: active ? 255 : undefined,
		};
		const bytes = await new IrrigationCCSystemStatusReport(
			options,
		).serialize(ctx);
		expect(
			IrrigationCCSystemStatusReport.from(CCRaw.parse(bytes), ctx),
		).toMatchObject(options);
		expect(bytes[3]).toBe(active ? 7 : 4);
	},
);

test.each(["master", 255] as const)(
	"Valve Info Report roundtrips %s valve",
	async (valveId) => {
		const options = {
			nodeId: 2,
			valveId,
			connected: true,
			nominalCurrent: 2550,
			errorShortCircuit: true,
			errorHighCurrent: false,
			errorLowCurrent: true,
			errorMaximumFlow: valveId === "master" ? true : undefined,
			errorHighFlow: valveId === "master" ? false : undefined,
			errorLowFlow: valveId === "master" ? true : undefined,
		};
		const bytes = await new IrrigationCCValveInfoReport(options).serialize(
			ctx,
		);
		expect([...bytes.subarray(2)]).toEqual(
			valveId === "master" ? [3, 1, 255, 45] : [2, 255, 255, 5],
		);
		expect(
			IrrigationCCValveInfoReport.from(CCRaw.parse(bytes), ctx),
		).toMatchObject(options);
	},
);

test("System Config encodes polarity values and validity", async () => {
	for (const ctor of [
		IrrigationCCSystemConfigSet,
		IrrigationCCSystemConfigReport,
	]) {
		expect((await new ctor(systemConfig).serialize(ctx)).at(-1)).toBe(0x82);
		const bytes = await new ctor({
			...systemConfig,
			rainSensorPolarity: undefined,
			moistureSensorPolarity: undefined,
		}).serialize(ctx);
		expect(bytes.at(-1)).toBe(0);
		expect(
			IrrigationCCSystemConfigSet.from(CCRaw.parse(bytes), ctx),
		).toMatchObject({
			rainSensorPolarity: undefined,
			moistureSensorPolarity: undefined,
		});
	}
});

test("Config commands reject unsupported float scales", async () => {
	for (const { cc, parse } of cases.slice(0, 4)) {
		const raw = CCRaw.parse(await cc.serialize(ctx));
		raw.payload[
			cc instanceof IrrigationCCSystemConfigSet
			|| cc instanceof IrrigationCCSystemConfigReport
				? 1
				: 4
		] |= 0x08;
		expect(() => parse(raw, ctx)).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	}
});

test("Valve Table Set supports empty tables", () => {
	const cc = IrrigationCCValveTableSet.from(
		new CCRaw(
			CommandClasses.Irrigation,
			IrrigationCommand.ValveTableSet,
			Bytes.from([1]),
		),
		ctx,
	);
	expect(cc.entries).toEqual([]);
});
