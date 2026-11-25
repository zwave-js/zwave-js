import {
	CommandClass,
	MeterTablePushConfigurationCCReport,
	MeterTablePushConfigurationCCSet,
	MeterTablePushConfigurationCommand,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import { test } from "vitest";

function buildCCBuffer(payload: BytesView): BytesView {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Meter Table Push Configuration"], // CC
		]),
		payload,
	]);
}

// As reported by a P1 meter reader (Quby 6500-1400-6000) on its root device
test("the Report command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTablePushConfigurationCommand.Report, // CC Command
			0x02, // PS: no, operating status push mode: 2
			0x03, // Push dataset
			0x00,
			0x00,
			0x00, // Interval months
			0x00, // Interval days
			0x00, // Interval hours
			0x00, // Interval minutes
			0x01, // Push node ID
		]),
	);
	const cc = (await CommandClass.parse(ccData, {
		sourceNodeId: 2,
	} as any)) as MeterTablePushConfigurationCCReport;
	t.expect(cc.constructor).toBe(MeterTablePushConfigurationCCReport);

	t.expect(cc.operatingStatusPushMode).toBe(2);
	t.expect(cc.pushStatus).toBe(false);
	t.expect(cc.pushDataset).toBe(0x030000);
	t.expect(cc.intervalMonths).toBe(0);
	t.expect(cc.intervalDays).toBe(0);
	t.expect(cc.intervalHours).toBe(0);
	t.expect(cc.intervalMinutes).toBe(0);
	t.expect(cc.pushNodeId).toBe(1);
});

test("the Set command should serialize correctly", async (t) => {
	const cc = new MeterTablePushConfigurationCCSet({
		nodeId: 2,
		operatingStatusPushMode: 2,
		pushStatus: true,
		pushDataset: 0x110000,
		intervalMonths: 0,
		intervalDays: 0,
		intervalHours: 0,
		intervalMinutes: 5,
		pushNodeId: 1,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			MeterTablePushConfigurationCommand.Set, // CC Command
			0b0001_0010, // PS, operating status push mode 2
			0x11, // Push dataset
			0x00,
			0x00,
			0x00, // Interval months
			0x00, // Interval days
			0x00, // Interval hours
			0x05, // Interval minutes
			0x01, // Push node ID
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("a Set with a value out of range can't be serialized", (t) => {
	const valid = {
		nodeId: 2,
		operatingStatusPushMode: 2,
		pushStatus: false,
		pushDataset: 0x110000,
		intervalMonths: 0,
		intervalDays: 0,
		intervalHours: 0,
		intervalMinutes: 5,
		pushNodeId: 1,
	};
	for (const wrong of [
		{ intervalMinutes: 300 },
		{ pushNodeId: 256 },
		{ operatingStatusPushMode: 16 },
		{ pushDataset: 0x100_0000 },
	]) {
		const cc = new MeterTablePushConfigurationCCSet({ ...valid, ...wrong });
		t.expect(() => cc.serialize({} as any), JSON.stringify(wrong)).toThrow(
			"out of range",
		);
	}
});
