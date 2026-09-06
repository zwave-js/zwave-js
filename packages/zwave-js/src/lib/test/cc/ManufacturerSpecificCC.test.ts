import {
	CommandClass,
	DeviceIdType,
	ManufacturerSpecificCCDeviceSpecificGet,
	ManufacturerSpecificCCDeviceSpecificReport,
	ManufacturerSpecificCCGet,
	ManufacturerSpecificCCReport,
	ManufacturerSpecificCommand,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

function buildCCBuffer(payload: BytesView): BytesView {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Manufacturer Specific"], // CC
		]),
		payload,
	]);
}

test("the Get command should serialize correctly", async (t) => {
	const cc = new ManufacturerSpecificCCGet({ nodeId: 1 });
	const expected = buildCCBuffer(
		Uint8Array.from([
			ManufacturerSpecificCommand.Get, // CC Command
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the Report command (v1) should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ManufacturerSpecificCommand.Report, // CC Command
			0x01,
			0x02,
			0x03,
			0x04,
			0x05,
			0x06,
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 2 } as any,
	) as ManufacturerSpecificCCReport;
	t.expect(cc.constructor).toBe(ManufacturerSpecificCCReport);

	t.expect(cc.manufacturerId).toBe(0x0102);
	t.expect(cc.productType).toBe(0x0304);
	t.expect(cc.productId).toBe(0x0506);
});

test("the Device Specific Get command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ManufacturerSpecificCommand.DeviceSpecificGet,
			DeviceIdType.PseudoRandom,
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 2 } as any,
	) as ManufacturerSpecificCCDeviceSpecificGet;

	t.expect(cc.constructor).toBe(ManufacturerSpecificCCDeviceSpecificGet);
	t.expect(cc.deviceIdType).toBe(DeviceIdType.PseudoRandom);
});

test("the Device Specific Report command should serialize a binary ID correctly", async (t) => {
	const cc = new ManufacturerSpecificCCDeviceSpecificReport({
		nodeId: 1,
		type: DeviceIdType.SerialNumber,
		deviceId: Uint8Array.from([0x12, 0x34, 0x56, 0x78]),
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ManufacturerSpecificCommand.DeviceSpecificReport,
			DeviceIdType.SerialNumber,
			0b001_00100,
			0x12,
			0x34,
			0x56,
			0x78,
		]),
	);

	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("the Device Specific Report command should serialize a string ID as UTF-8", async (t) => {
	const cc = new ManufacturerSpecificCCDeviceSpecificReport({
		nodeId: 1,
		type: DeviceIdType.SerialNumber,
		deviceId: "0x12",
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ManufacturerSpecificCommand.DeviceSpecificReport,
			DeviceIdType.SerialNumber,
			0b000_00100,
			0x30,
			0x78,
			0x31,
			0x32,
		]),
	);

	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});
