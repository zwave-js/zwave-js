import {
	CommandClass,
	MeterTableMonitorCCCurrentDataGet,
	MeterTableMonitorCCCurrentDataReport,
	MeterTableMonitorCCTableCapabilityReport,
	MeterTableMonitorCCTableIdReport,
	type MeterTableMonitorCCTablePointAdmNoReport,
	MeterTableMonitorCCValues,
	MeterTableMonitorCommand,
	MeterTableMeterType,
	MeterTablePayMeter,
	MeterTableRateType,
	getMeterTableScale,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { createTestingHost } from "@zwave-js/host";
import { Bytes, type BytesView } from "@zwave-js/shared";
import { test } from "vitest";

const host = createTestingHost();

function buildCCBuffer(payload: BytesView): BytesView {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Meter Table Monitor"], // CC
		]),
		payload,
	]);
}

test("the CurrentDataGet command should serialize correctly", async (t) => {
	const cc = new MeterTableMonitorCCCurrentDataGet({
		nodeId: 2,
		datasets: 0x110000,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.CurrentDataGet, // CC Command
			0x11, // Datasets (MSB first)
			0x00,
			0x00,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

// Reported by a P1 meter reader (Quby 6500-1400-6000), endpoint 6
test("the CurrentDataReport command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.CurrentDataReport, // CC Command
			0x00, // Reports to follow
			0x01, // Rate type: import
			0x11, // Datasets 16 and 20
			0x00,
			0x00,
			0x07, // Year 2022
			0xe6,
			0x01, // Month
			0x09, // Day
			0x0d, // Hour
			0x1d, // Minute
			0x00, // Second
			0b011_00000, // Precision 3, scale 0
			0x00,
			0x6f,
			0xbc,
			0x9d,
			0b011_00111, // Precision 3, scale 7
			0x00,
			0x00,
			0x13,
			0xb0,
		]),
	);
	const cc = (await CommandClass.parse(ccData, {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(cc.constructor).toBe(MeterTableMonitorCCCurrentDataReport);

	t.expect(cc.reportsToFollow).toBe(0);
	t.expect(cc.rateType).toBe(MeterTableRateType.Import);
	t.expect(cc.operatingStatusIndication).toBe(false);
	t.expect(cc.datasets).toBe(0x110000);
	t.expect(cc.timestamp).toStrictEqual(
		new Date(Date.UTC(2022, 0, 9, 13, 29, 0)),
	);
	t.expect(
		cc.readings.map((r) => [r.dataset, r.scale.key, r.value]),
	).toStrictEqual([
		[16, 0, 7322.781],
		[20, 7, 5.04],
	]);
});

test("a CurrentDataReport from a meter without a set clock has no timestamp", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.CurrentDataReport, // CC Command
			0x00, // Reports to follow
			0x81, // Operating status indication, rate type: import
			0x03, // Datasets 16 and 17
			0x00,
			0x00,
			0x07, // Year 1970
			0xb2,
			0x01,
			0x01,
			0x00,
			0x04,
			0x28,
			0b011_00000, // Precision 3, scale 0
			0x00,
			0x00,
			0x00,
			0x00,
			0b011_01000, // Precision 3, scale 8
			0x00,
			0x00,
			0x00,
			0x00,
		]),
	);
	const cc = (await CommandClass.parse(ccData, {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCCurrentDataReport;

	t.expect(cc.operatingStatusIndication).toBe(true);
	t.expect(cc.timestamp).toBeUndefined();
	t.expect(
		cc.readings.map((r) => [r.dataset, r.scale.key, r.value]),
	).toStrictEqual([
		[16, 0, 0],
		[17, 8, 0],
	]);
});

test("a CurrentDataReport with fewer values than datasets is rejected", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.CurrentDataReport, // CC Command
			0x00,
			0x01,
			0x11, // two datasets...
			0x00,
			0x00,
			0x07,
			0xe6,
			0x01,
			0x09,
			0x0d,
			0x1d,
			0x00,
			0b011_00000, // ...but only one value
			0x00,
			0x6f,
			0xbc,
			0x9d,
		]),
	);
	const cc = await CommandClass.parse(ccData, { sourceNodeId: 2 } as any);
	t.expect(cc.constructor).not.toBe(MeterTableMonitorCCCurrentDataReport);
});

test("the CurrentDataReport command should serialize correctly", async (t) => {
	const cc = new MeterTableMonitorCCCurrentDataReport({
		nodeId: 2,
		reportsToFollow: 0,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0x110000,
		timestamp: new Date(Date.UTC(2022, 0, 9, 13, 29, 0)),
		readings: [
			{ dataset: 16, scale: { key: 0, label: "" }, value: 7322.781 },
			{ dataset: 20, scale: { key: 7, label: "" }, value: 5.04 },
		],
	});
	const serialized = await cc.serialize({} as any);
	const parsed = (await CommandClass.parse(serialized, {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(
		parsed.readings.map((r) => [r.dataset, r.scale.key, r.value]),
	).toStrictEqual([
		[16, 0, 7322.781],
		[20, 7, 5.04],
	]);
	t.expect(parsed.timestamp).toStrictEqual(cc.timestamp);
});

test("the TableCapabilityReport command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.TableCapabilityReport, // CC Command
			0b01_000100, // Rate type: import, meter type: twin-E electric
			0x01, // Pay meter: credit meter
			0x11, // Supported datasets
			0x00,
			0x00,
			0x11, // Supported history datasets
			0x00,
			0x00,
			0x00, // Supported history data
			0x00,
			0x00,
		]),
	);
	const cc = (await CommandClass.parse(ccData, {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCTableCapabilityReport;
	t.expect(cc.constructor).toBe(MeterTableMonitorCCTableCapabilityReport);

	t.expect(cc.meterType).toBe(MeterTableMeterType["Twin-E electric"]);
	t.expect(cc.rateType).toBe(MeterTableRateType.Import);
	t.expect(cc.payMeter).toBe(MeterTablePayMeter["Credit meter"]);
	t.expect(cc.supportedDatasets).toBe(0x110000);
	t.expect(cc.supportedHistoryDatasets).toBe(0x110000);
	t.expect(cc.supportedHistoryData).toBe(0);
});

test("the TableIdReport command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.TableIdReport, // CC Command
			0x07, // Number of characters
			...Bytes.from("Unknown", "ascii"),
		]),
	);
	const cc = (await CommandClass.parse(ccData, {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCTableIdReport;
	t.expect(cc.constructor).toBe(MeterTableMonitorCCTableIdReport);
	t.expect(cc.meterId).toBe("Unknown");
});

test("trailing NUL characters are removed from the meter ID", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.TablePointAdmNoReport, // CC Command
			0x01, // Number of characters
			0x00,
		]),
	);
	const cc = (await CommandClass.parse(ccData, {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCTablePointAdmNoReport;
	t.expect(cc.pointAdmNumber).toBe("");
});

test("getMeterTableScale() knows the electricity and gas scales", (t) => {
	t.expect(
		getMeterTableScale(MeterTableMeterType["Twin-E electric"], 0).unit,
	).toBe("kWh");
	t.expect(
		getMeterTableScale(MeterTableMeterType["Single-E electric"], 7).unit,
	).toBe("kW");
	t.expect(getMeterTableScale(MeterTableMeterType.Gas, 0).unit).toBe("m³");
	t.expect(getMeterTableScale(MeterTableMeterType.Gas, 8).unit).toBe("m³/h");
	t.expect(getMeterTableScale(MeterTableMeterType.Heating, 8)).toStrictEqual({
		key: 8,
		label: "Scale 8",
	});
});

function report(
	nodeId: number,
	rateType: MeterTableRateType,
	value: number,
	reportsToFollow = 0,
	dataset = 16,
): MeterTableMonitorCCCurrentDataReport {
	return new MeterTableMonitorCCCurrentDataReport({
		nodeId,
		reportsToFollow,
		rateType,
		operatingStatusIndication: false,
		datasets: 1 << dataset,
		readings: [{ dataset, scale: { key: 0, label: "" }, value }],
	});
}

function storeCapabilities(
	nodeId: number,
	meterType: number | undefined,
	rateType: MeterTableRateType,
): void {
	const valueDB = host.getValueDB(nodeId);
	if (meterType != undefined) {
		valueDB.setValue(
			MeterTableMonitorCCValues.meterType.endpoint(0),
			meterType,
		);
	}
	valueDB.setValue(MeterTableMonitorCCValues.rateType.endpoint(0), rateType);
}

function storedValue(nodeId: number, rateType: MeterTableRateType) {
	const valueDB = host.getValueDB(nodeId);
	const meterType =
		valueDB.getValue<number>(
			MeterTableMonitorCCValues.meterType.endpoint(0),
		) ?? 0;
	const valueId = MeterTableMonitorCCValues.value(
		meterType,
		rateType,
		16,
	).endpoint(0);
	return {
		value: valueDB.getValue(valueId),
		meta: valueDB.getMetadata(valueId),
	};
}

test("import and export of a meter that measures both are stored separately", (t) => {
	const nodeId = 10;
	storeCapabilities(
		nodeId,
		MeterTableMeterType["Single-E electric"],
		MeterTableRateType["Import and export"],
	);
	report(nodeId, MeterTableRateType.Import, 100).persistValues(host);
	report(nodeId, MeterTableRateType.Export, 25).persistValues(host);

	const imported = storedValue(nodeId, MeterTableRateType.Import);
	const exported = storedValue(nodeId, MeterTableRateType.Export);
	t.expect(imported.value).toBe(100);
	t.expect(exported.value).toBe(25);
	t.expect(imported.meta?.label).toBe("Single-E electric import: Energy");
	t.expect(exported.meta?.label).toBe("Single-E electric export: Energy");
	t.expect(exported.meta).toMatchObject({
		unit: "kWh",
		ccSpecific: {
			meterType: MeterTableMeterType["Single-E electric"],
			rateType: MeterTableRateType.Export,
			dataset: 16,
			scale: 0,
		},
	});
});

test("an unspecified rate type in a report means the meter's rate type", (t) => {
	const nodeId = 11;
	storeCapabilities(
		nodeId,
		MeterTableMeterType.Gas,
		MeterTableRateType.Import,
	);
	report(nodeId, MeterTableRateType.Unspecified, 3.5).persistValues(host);
	t.expect(storedValue(nodeId, MeterTableRateType.Import).value).toBe(3.5);
});

test("readings are not stored before the meter type is known", (t) => {
	const nodeId = 12;
	storeCapabilities(nodeId, undefined, MeterTableRateType.Import);
	report(nodeId, MeterTableRateType.Import, 100).persistValues(host);
	const stored = storedValue(nodeId, MeterTableRateType.Import);
	t.expect(stored.value).toBeUndefined();
	t.expect(
		host
			.getValueDB(nodeId)
			.hasMetadata(
				MeterTableMonitorCCValues.value(
					0,
					MeterTableRateType.Import,
					16,
				).endpoint(0),
			),
	).toBe(false);
});

test("the property key holds the meter type, rate type and dataset", (t) => {
	t.expect(
		MeterTableMonitorCCValues.value(
			MeterTableMeterType["Twin-E electric"],
			MeterTableRateType.Export,
			20,
		).id.propertyKey,
	).toBe(0x04_02_14);
});

test("CurrentDataReports split over several frames are merged", async (t) => {
	const first = report(2, MeterTableRateType.Import, 100, 1, 16);
	const last = report(2, MeterTableRateType.Import, 5, 0, 20);
	t.expect(first.getRemainingSegments()).toBe(1);
	t.expect(first.getPartialCCSessionId()).toStrictEqual(
		last.getPartialCCSessionId(),
	);

	await last.mergePartialCCs([first], {} as any);
	t.expect(last.datasets).toBe(0x110000);
	t.expect(last.readings.map((r) => [r.dataset, r.value])).toStrictEqual([
		[16, 100],
		[20, 5],
	]);
});

test("an import and an export report in one chain are merged and stored apart", async (t) => {
	const nodeId = 13;
	storeCapabilities(
		nodeId,
		MeterTableMeterType["Single-E electric"],
		MeterTableRateType["Import and export"],
	);
	const first = report(nodeId, MeterTableRateType.Import, 100, 1);
	const last = report(nodeId, MeterTableRateType.Export, 25, 0);
	t.expect(first.getPartialCCSessionId()).toStrictEqual(
		last.getPartialCCSessionId(),
	);
	await last.mergePartialCCs([first], {} as any);
	last.persistValues(host);

	t.expect(storedValue(nodeId, MeterTableRateType.Import).value).toBe(100);
	t.expect(storedValue(nodeId, MeterTableRateType.Export).value).toBe(25);
});

test("rate type 3 in a data report means the meter's rate type", (t) => {
	const nodeId = 14;
	storeCapabilities(
		nodeId,
		MeterTableMeterType.Gas,
		MeterTableRateType.Import,
	);
	report(nodeId, MeterTableRateType["Import and export"], 7).persistValues(
		host,
	);
	t.expect(storedValue(nodeId, MeterTableRateType.Import).value).toBe(7);
});

test("a CurrentDataGet only takes a report with a requested dataset as its answer", (t) => {
	const get = new MeterTableMonitorCCCurrentDataGet({
		nodeId: 2,
		datasets: 1 << 20,
	});
	t.expect(
		get.isExpectedCCResponse(
			{} as any,
			report(2, MeterTableRateType.Import, 1, 0, 20),
		),
	).toBe(true);
	t.expect(
		get.isExpectedCCResponse(
			{} as any,
			report(2, MeterTableRateType.Import, 1, 0, 16),
		),
	).toBe(false);
});

function reportWithTime(time: number[]): BytesView {
	return buildCCBuffer(
		Uint8Array.from([
			MeterTableMonitorCommand.CurrentDataReport, // CC Command
			0x00, // Reports to follow
			0x01, // Rate type: import
			0x01, // Dataset 16
			0x00,
			0x00,
			...time, // Year (2 bytes), month, day, hour, minute, second
			0b011_00000, // Precision 3, scale 0
			0x00,
			0x00,
			0x00,
			0x01,
		]),
	);
}

test("a meter time that is not a real date and time is not set", async (t) => {
	for (const time of [
		[0x07, 0xea, 11, 0, 0, 0, 0], // day 0
		[0x07, 0xea, 2, 30, 0, 0, 0], // 30 February
		[0x07, 0xea, 11, 7, 0xff, 0, 0], // hour 255
	]) {
		const cc = (await CommandClass.parse(reportWithTime(time), {
			sourceNodeId: 2,
		} as any)) as MeterTableMonitorCCCurrentDataReport;
		t.expect(cc.timestamp, time.join(",")).toBeUndefined();
	}
	const cc = (await CommandClass.parse(
		reportWithTime([0x07, 0xd0, 1, 1, 0, 0, 0]), // 2000-01-01
		{ sourceNodeId: 2 } as any,
	)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(cc.timestamp).toStrictEqual(
		new Date(Date.UTC(2000, 0, 1, 0, 0, 0)),
	);
});

test("large and precise values survive serializing", async (t) => {
	const cc = new MeterTableMonitorCCCurrentDataReport({
		nodeId: 2,
		reportsToFollow: 0,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0x030000,
		readings: [
			{ dataset: 16, scale: { key: 0, label: "" }, value: 5_000_000 },
			{ dataset: 17, scale: { key: 8, label: "" }, value: 1.2345 },
		],
	});
	const parsed = (await CommandClass.parse(await cc.serialize({} as any), {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(parsed.readings.map((r) => r.value)).toStrictEqual([
		5_000_000, 1.2345,
	]);
});

test("a meter with an unspecified rate type keeps each dataset under one value", (t) => {
	const nodeId = 15;
	storeCapabilities(
		nodeId,
		MeterTableMeterType.Water,
		MeterTableRateType.Unspecified,
	);
	report(nodeId, MeterTableRateType.Import, 1).persistValues(host);
	report(nodeId, MeterTableRateType.Unspecified, 2).persistValues(host);

	t.expect(storedValue(nodeId, MeterTableRateType.Unspecified).value).toBe(2);
	t.expect(
		storedValue(nodeId, MeterTableRateType.Import).value,
	).toBeUndefined();
});

test("the meter's own rate type wins over the one in a report", (t) => {
	const nodeId = 16;
	storeCapabilities(
		nodeId,
		MeterTableMeterType.Gas,
		MeterTableRateType.Import,
	);
	report(nodeId, MeterTableRateType.Export, 3).persistValues(host);
	t.expect(storedValue(nodeId, MeterTableRateType.Import).value).toBe(3);
	t.expect(
		storedValue(nodeId, MeterTableRateType.Export).value,
	).toBeUndefined();
});

test("a meter that measures both directions must say which one a reading is", (t) => {
	const nodeId = 17;
	storeCapabilities(
		nodeId,
		MeterTableMeterType["Single-E electric"],
		MeterTableRateType["Import and export"],
	);
	report(nodeId, MeterTableRateType.Unspecified, 9).persistValues(host);
	t.expect(
		storedValue(nodeId, MeterTableRateType.Unspecified).value,
	).toBeUndefined();
});

test("the property key is shown as rate type and dataset", (t) => {
	const cc = new MeterTableMonitorCCCurrentDataGet({
		nodeId: 2,
		datasets: 0,
	});
	t.expect(cc.translatePropertyKey(host, "value", 0x02_01_10)).toBe(
		"Gas_Import_dataset_16",
	);
	t.expect(cc.translatePropertyKey(host, "value", 0x08_00_14)).toBe(
		"Heating_dataset_20",
	);
});

test("the meter time keeps its clock fields, also in a daylight saving gap", async (t) => {
	// 2026-03-29 02:30 does not exist in Europe/Amsterdam
	const cc = (await CommandClass.parse(
		reportWithTime([0x07, 0xea, 3, 29, 2, 30, 0]),
		{ sourceNodeId: 2 } as any,
	)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(cc.timestamp?.getUTCHours()).toBe(2);
	const parsed = (await CommandClass.parse(await cc.serialize({} as any), {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(parsed.timestamp).toStrictEqual(cc.timestamp);
});

test("a CurrentDataReport serializes its values in dataset order", async (t) => {
	const cc = new MeterTableMonitorCCCurrentDataReport({
		nodeId: 2,
		reportsToFollow: 0,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0,
		readings: [
			{ dataset: 20, scale: { key: 7, label: "" }, value: 5 },
			{ dataset: 16, scale: { key: 0, label: "" }, value: 100 },
		],
	});
	const parsed = (await CommandClass.parse(await cc.serialize({} as any), {
		sourceNodeId: 2,
	} as any)) as MeterTableMonitorCCCurrentDataReport;
	t.expect(parsed.datasets).toBe(0x110000);
	t.expect(parsed.readings.map((r) => [r.dataset, r.value])).toStrictEqual([
		[16, 100],
		[20, 5],
	]);
});

test("a CurrentDataReport with readings of another rate type can't be serialized", (t) => {
	const cc = new MeterTableMonitorCCCurrentDataReport({
		nodeId: 2,
		reportsToFollow: 0,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0,
		readings: [
			{
				dataset: 16,
				rateType: MeterTableRateType.Export,
				scale: { key: 0, label: "" },
				value: 1,
			},
		],
	});
	t.expect(() => cc.serialize({} as any)).toThrow("rate type");
});

test("report chains of different endpoints are separate sessions", (t) => {
	const options = {
		nodeId: 2,
		reportsToFollow: 1,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0x010000,
		readings: [{ dataset: 16, scale: { key: 0, label: "" }, value: 1 }],
	};
	const ep1 = new MeterTableMonitorCCCurrentDataReport({
		...options,
		endpointIndex: 1,
	});
	const ep4 = new MeterTableMonitorCCCurrentDataReport({
		...options,
		endpointIndex: 4,
	});
	t.expect(ep1.getPartialCCSessionId()).not.toStrictEqual(
		ep4.getPartialCCSessionId(),
	);
});

test("a CurrentDataReport with two readings of one dataset can't be serialized", (t) => {
	const cc = new MeterTableMonitorCCCurrentDataReport({
		nodeId: 2,
		reportsToFollow: 0,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0,
		readings: [
			{ dataset: 16, scale: { key: 0, label: "" }, value: 1 },
			{ dataset: 16, scale: { key: 0, label: "" }, value: 2 },
		],
	});
	t.expect(() => cc.serialize({} as any)).toThrow("one reading per dataset");
});

test("a meter ID that is not short ASCII can't be serialized", (t) => {
	const cc = new MeterTableMonitorCCTableIdReport({
		nodeId: 2,
		meterId: "é",
	});
	t.expect(() => cc.serialize({} as any)).toThrow("ASCII");
});

test("datasets outside 0 to 23 can't be serialized", (t) => {
	const report = new MeterTableMonitorCCCurrentDataReport({
		nodeId: 2,
		reportsToFollow: 0,
		rateType: MeterTableRateType.Import,
		operatingStatusIndication: false,
		datasets: 0,
		readings: [{ dataset: 24, scale: { key: 0, label: "" }, value: 1 }],
	});
	t.expect(() => report.serialize({} as any)).toThrow("0 to 23");
	const get = new MeterTableMonitorCCCurrentDataGet({
		nodeId: 2,
		datasets: 0x100_0000,
	});
	t.expect(() => get.serialize({} as any)).toThrow("24 bits");
});

test("negative or too large values can't be serialized", (t) => {
	for (const value of [-5, 5e9]) {
		const cc = new MeterTableMonitorCCCurrentDataReport({
			nodeId: 2,
			reportsToFollow: 0,
			rateType: MeterTableRateType.Import,
			operatingStatusIndication: false,
			datasets: 0,
			readings: [{ dataset: 16, scale: { key: 0, label: "" }, value }],
		});
		t.expect(() => cc.serialize({} as any), String(value)).toThrow(
			"between 0 and",
		);
	}
});

test("an operating status event in any report of a chain is kept", async (t) => {
	const options = {
		nodeId: 2,
		rateType: MeterTableRateType.Import,
		datasets: 0x010000,
		readings: [{ dataset: 16, scale: { key: 0, label: "" }, value: 1 }],
	};
	const first = new MeterTableMonitorCCCurrentDataReport({
		...options,
		reportsToFollow: 1,
		operatingStatusIndication: true,
	});
	const last = new MeterTableMonitorCCCurrentDataReport({
		...options,
		reportsToFollow: 0,
		operatingStatusIndication: false,
	});
	await last.mergePartialCCs([first], {} as any);
	t.expect(last.operatingStatusIndication).toBe(true);
});
