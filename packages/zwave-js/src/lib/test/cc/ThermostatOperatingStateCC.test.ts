import {
	CommandClass,
	ThermostatOperatingState,
	ThermostatOperatingStateCC,
	ThermostatOperatingStateCCGet,
	ThermostatOperatingStateCCLoggingGet,
	ThermostatOperatingStateCCLoggingReport,
	ThermostatOperatingStateCCLoggingSupportedGet,
	ThermostatOperatingStateCCLoggingSupportedReport,
	ThermostatOperatingStateCCReport,
	ThermostatOperatingStateCommand,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

function buildCCBuffer(payload: Uint8Array): Bytes {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Thermostat Operating State"], // CC
		]),
		payload,
	]);
}

test("the Get command should serialize correctly", async (t) => {
	const cc = new ThermostatOperatingStateCCGet({ nodeId: 1 });
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.Get, // CC Command
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the Report command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.Report, // CC Command
			ThermostatOperatingState["Cooling"], // state
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ThermostatOperatingStateCCReport;
	t.expect(cc.constructor).toBe(ThermostatOperatingStateCCReport);

	t.expect(cc.state).toBe(ThermostatOperatingState["Cooling"]);
});

test("the Report command should deserialize V2-only states", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.Report,
			ThermostatOperatingState["Aux Heating"],
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ThermostatOperatingStateCCReport;
	t.expect(cc.constructor).toBe(ThermostatOperatingStateCCReport);

	t.expect(cc.state).toBe(ThermostatOperatingState["Aux Heating"]);
});

test("the Report command should serialize correctly", async (t) => {
	const cc = new ThermostatOperatingStateCCReport({
		nodeId: 1,
		state: ThermostatOperatingState["Heating"],
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.Report,
			ThermostatOperatingState["Heating"],
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the Logging Supported Get command should serialize correctly", async (t) => {
	const cc = new ThermostatOperatingStateCCLoggingSupportedGet({
		nodeId: 1,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.LoggingSupportedGet,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the Logging Supported Report should be deserialized correctly", async (t) => {
	// Bitmask: bit 1 = Heating, bit 2 = Cooling → 0b00000110 = 0x06
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.LoggingSupportedReport,
			0x06,
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ThermostatOperatingStateCCLoggingSupportedReport;
	t.expect(cc.constructor).toBe(
		ThermostatOperatingStateCCLoggingSupportedReport,
	);

	t.expect(cc.supportedLoggingTypes).toStrictEqual([
		ThermostatOperatingState["Heating"],
		ThermostatOperatingState["Cooling"],
	]);
});

test("the Logging Get command should serialize correctly", async (t) => {
	const cc = new ThermostatOperatingStateCCLoggingGet({
		nodeId: 1,
		requestedStates: [
			ThermostatOperatingState["Heating"],
			ThermostatOperatingState["Cooling"],
		],
	});
	// Bitmask: bit 1 = Heating, bit 2 = Cooling → 0b00000110 = 0x06
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.LoggingGet,
			0x06,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the Logging Report should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.LoggingReport,
			0x00, // reportsToFollow
			0x01, // Reserved[7:4] + Heating[3:0]
			0x05, // usageTodayHours
			0x1e, // usageTodayMinutes (30)
			0x08, // usageYesterdayHours
			0x00, // usageYesterdayMinutes
			0x02, // Reserved[7:4] + Cooling[3:0]
			0x02, // usageTodayHours
			0x0f, // usageTodayMinutes (15)
			0x03, // usageYesterdayHours
			0x2d, // usageYesterdayMinutes (45)
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ThermostatOperatingStateCCLoggingReport;
	t.expect(cc.constructor).toBe(ThermostatOperatingStateCCLoggingReport);

	t.expect(cc.reportsToFollow).toBe(0);
	t.expect(cc.loggingData).toHaveLength(2);

	t.expect(cc.loggingData[0]).toStrictEqual({
		state: ThermostatOperatingState["Heating"],
		usageTodayHours: 5,
		usageTodayMinutes: 30,
		usageYesterdayHours: 8,
		usageYesterdayMinutes: 0,
	});

	t.expect(cc.loggingData[1]).toStrictEqual({
		state: ThermostatOperatingState["Cooling"],
		usageTodayHours: 2,
		usageTodayMinutes: 15,
		usageYesterdayHours: 3,
		usageYesterdayMinutes: 45,
	});
});

test("the Logging Report should mask reserved bits in Operating State Log Type", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.LoggingReport,
			0x00, // reportsToFollow
			// State type byte: upper nibble 0xF (garbage in reserved bits) + Heating (0x01)
			0xf1,
			0x01,
			0x02,
			0x03,
			0x04,
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ThermostatOperatingStateCCLoggingReport;

	t.expect(cc.loggingData[0].state).toBe(
		ThermostatOperatingState["Heating"],
	);
});

test("the Logging Report should serialize correctly", async (t) => {
	const cc = new ThermostatOperatingStateCCLoggingReport({
		nodeId: 1,
		reportsToFollow: 0,
		loggingData: [{
			state: ThermostatOperatingState["Heating"],
			usageTodayHours: 5,
			usageTodayMinutes: 30,
			usageYesterdayHours: 8,
			usageYesterdayMinutes: 0,
		}],
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatOperatingStateCommand.LoggingReport,
			0x00, // reportsToFollow
			0x01, // Heating
			0x05,
			0x1e,
			0x08,
			0x00,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("deserializing an unsupported command should return an unspecified version of ThermostatOperatingStateCC", async (t) => {
	const serializedCC = buildCCBuffer(
		Uint8Array.from([255]), // not a valid command
	);
	const cc = await CommandClass.parse(
		serializedCC,
		{ sourceNodeId: 1 } as any,
	) as ThermostatOperatingStateCC;
	t.expect(cc.constructor).toBe(ThermostatOperatingStateCC);
});
