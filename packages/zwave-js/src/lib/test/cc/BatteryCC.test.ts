import {
	BatteryCC,
	BatteryCCGet,
	BatteryCCHealthReport,
	BatteryCCReport,
	BatteryCCValues,
	BatteryChargingStatus,
	BatteryCommand,
	BatteryReplacementStatus,
	CommandClass,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { test } from "vitest";
import { integrationTest } from "../integrationTestSuite.js";

test("the Get command should serialize correctly", async (t) => {
	const batteryCC = new BatteryCCGet({ nodeId: 1 });
	const expected = Bytes.from([
		CommandClasses.Battery, // CC
		BatteryCommand.Get, // CC Command
	]);
	await t.expect(batteryCC.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the Report command (v1) should be deserialized correctly: when the battery is not low", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses.Battery, // CC
		BatteryCommand.Report, // CC Command
		55, // current value
	]);
	const batteryCC = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 7 } as any,
	) as BatteryCCReport;
	t.expect(batteryCC.constructor).toBe(BatteryCCReport);

	t.expect(batteryCC.level).toBe(55);
	t.expect(batteryCC.isLow).toBe(false);
});

test("the Report command (v1) should be deserialized correctly: when the battery is low", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses.Battery, // CC
		BatteryCommand.Report, // CC Command
		0xff, // current value
	]);
	const batteryCC = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 7 } as any,
	) as BatteryCCReport;
	t.expect(batteryCC.constructor).toBe(BatteryCCReport);

	t.expect(batteryCC.level).toBe(0);
	t.expect(batteryCC.isLow).toBe(true);
});

test("the Report command (v2) should be deserialized correctly: all flags set", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses.Battery, // CC
		BatteryCommand.Report, // CC Command
		55, // current value
		0b00_1111_00,
		1, // disconnected
	]);
	const batteryCC = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 7 } as any,
	) as BatteryCCReport;
	t.expect(batteryCC.constructor).toBe(BatteryCCReport);

	t.expect(batteryCC.rechargeable).toBe(true);
	t.expect(batteryCC.backup).toBe(true);
	t.expect(batteryCC.overheating).toBe(true);
	t.expect(batteryCC.lowFluid).toBe(true);
	t.expect(batteryCC.disconnected).toBe(true);
});

test("the Report command (v2) should be deserialized correctly: charging status", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses.Battery, // CC
		BatteryCommand.Report, // CC Command
		55,
		0b10_000000, // Maintaining
		0,
	]);
	const batteryCC = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 7 } as any,
	) as BatteryCCReport;
	t.expect(batteryCC.constructor).toBe(BatteryCCReport);

	t.expect(batteryCC.chargingStatus).toBe(BatteryChargingStatus.Maintaining);
});

test("the Report command (v2) should be deserialized correctly: recharge or replace", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses.Battery, // CC
		BatteryCommand.Report, // CC Command
		55,
		0b11, // Maintaining
		0,
	]);
	const batteryCC = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 7 } as any,
	) as BatteryCCReport;
	t.expect(batteryCC.constructor).toBe(BatteryCCReport);

	t.expect(batteryCC.rechargeOrReplace).toBe(BatteryReplacementStatus.Now);
});

test("deserializing an unsupported command should return an unspecified version of BatteryCC", async (t) => {
	const serializedCC = Uint8Array.from([
		CommandClasses.Battery, // CC
		255, // not a valid command
	]);
	const batteryCC = await CommandClass.parse(
		serializedCC,
		{ sourceNodeId: 7 } as any,
	) as BatteryCCReport;
	t.expect(batteryCC.constructor).toBe(BatteryCC);
});

integrationTest(
	"If the temperature field is omitted from a HealthReport, the unit does not get deleted",
	{
		// debug: true,
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Battery,
			],
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const healthReport = new BatteryCCHealthReport({
				nodeId: node.id,
				maximumCapacity: 100,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(healthReport, {
					ackRequested: false,
				}),
			);

			await wait(100);
			t.expect(node.getValue(BatteryCCValues.maximumCapacity.id)).toBe(
				100,
			);
			t.expect(node.getValue(BatteryCCValues.temperature.id))
				.toBeUndefined();
			t.expect(node.getValueMetadata(BatteryCCValues.temperature.id))
				.toMatchObject({
					unit: "°C",
				});
		},
	},
);
