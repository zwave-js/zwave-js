import {
	ActiveScheduleCommand,
	ActiveScheduleReportReason,
	ActiveScheduleSetAction,
	CommandClass,
	InvalidCC,
	ScheduleWeekday,
} from "@zwave-js/cc";
import {
	ActiveScheduleCCCapabilitiesReport,
	ActiveScheduleCCDailyRepeatingScheduleReport,
	ActiveScheduleCCDailyRepeatingScheduleSet,
	ActiveScheduleCCEnableReport,
	ActiveScheduleCCYearDayScheduleReport,
	ActiveScheduleCCYearDayScheduleSet,
} from "@zwave-js/cc/ActiveScheduleCC";
import { CommandClasses } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import { test } from "vitest";

function buildCCBuffer(payload: BytesView): BytesView {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Active Schedule"], // CC
		]),
		payload,
	]);
}

const TARGET_CC = CommandClasses["Binary Switch"];

test("the Enable Report command should be parsed correctly, ignoring reserved bits", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.EnableReport, // CC Command
			TARGET_CC,
			0x00,
			0x01, // Target ID
			// CC:00A4.01.03.11.001: All other bits are reserved and MUST be
			// set low (0) by the sending node. If any of the reserved bits are
			// high (1), they MUST be ignored by the receiving node.
			0b1111_0011, // Reserved | Report Code = 1 | Enabled = 1
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 5 } as any,
	) as ActiveScheduleCCEnableReport;
	t.expect(cc.constructor).toBe(ActiveScheduleCCEnableReport);

	t.expect(cc.targetCC).toBe(TARGET_CC);
	t.expect(cc.targetId).toBe(1);
	t.expect(cc.reportReason).toBe(
		ActiveScheduleReportReason.ModifiedExternal,
	);
	t.expect(cc.enabled).toBe(true);
});

test("the Capabilities Report command should be ignored when it contains no target CCs", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.CapabilitiesReport, // CC Command
			// CC:00A4.01.02.11.001: A node advertising support for this CC
			// MUST support at least one (1) valid Target CC.
			0, // Number of Supported Target CCs
		]),
	);
	const cc = await CommandClass.parse(ccData, { sourceNodeId: 5 } as any);
	t.expect(cc.constructor).toBe(InvalidCC);
});

test("the Year Day Schedule Set command should be ignored when it uses a reserved Set Action", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.YearDayScheduleSet, // CC Command
			// CC:00A4.01.06.11.004: All other values are reserved and MUST
			// NOT be used by a sending node. Reserved values MUST be ignored
			// by a receiving node.
			0b10, // Set Action (reserved value)
			TARGET_CC,
			0x00,
			0x01, // Target ID
			0x00,
			0x01, // Schedule Slot ID
		]),
	);
	const cc = await CommandClass.parse(ccData, { sourceNodeId: 5 } as any);
	t.expect(cc.constructor).toBe(InvalidCC);
});

test("the Year Day Schedule Set command with Erase action should serialize without schedule fields", async (t) => {
	const cc = new ActiveScheduleCCYearDayScheduleSet({
		nodeId: 2,
		action: ActiveScheduleSetAction.Erase,
		targetCC: TARGET_CC,
		targetId: 1,
		slotId: 2,
	});
	// CC:00A4.01.06.13.005: During an Erase Operation, all other fields with
	// the exception of the Target and Schedule Slot fields are not required
	// and MAY be set to zero or omitted.
	const expected = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.YearDayScheduleSet, // CC Command
			ActiveScheduleSetAction.Erase, // Set Action
			TARGET_CC,
			0x00,
			0x01, // Target ID
			0x00,
			0x02, // Schedule Slot ID
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("the Year Day Schedule Report command should treat all-zero time fields as an empty slot", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.YearDayScheduleReport, // CC Command
			ActiveScheduleReportReason.ResponseToGet, // Report Code
			TARGET_CC,
			0x00,
			0x01, // Target ID
			0x00,
			0x02, // Schedule Slot ID
			0x00,
			0x00, // Next Schedule Slot ID
			// CC:00A4.01.08.11.004: If a requested schedule slot is
			// erased/empty the time fields MUST be set to 0x00.
			0x00,
			0x00, // Start Year
			0x00, // Start Month
			0x00, // Start Day
			0x00, // Start Hour
			0x00, // Start Minute
			0x00,
			0x00, // Stop Year
			0x00, // Stop Month
			0x00, // Stop Day
			0x00, // Stop Hour
			0x00, // Stop Minute
			0x00, // Metadata Length
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 5 } as any,
	) as ActiveScheduleCCYearDayScheduleReport;
	t.expect(cc.constructor).toBe(ActiveScheduleCCYearDayScheduleReport);

	t.expect(cc.slotId).toBe(2);
	t.expect(cc.startDate).toBeUndefined();
	t.expect(cc.stopDate).toBeUndefined();
});

test("the Daily Repeating Schedule Report command should be parsed correctly, ignoring the reserved weekday bit", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.DailyRepeatingScheduleReport, // CC Command
			ActiveScheduleReportReason.ResponseToGet, // Report Code
			TARGET_CC,
			0x00,
			0x01, // Target ID
			0x00,
			0x01, // Schedule Slot ID
			0x00,
			0x00, // Next Schedule Slot ID
			// CC:00A4.01.09.11.008: Reserved bits MUST be ignored by a
			// receiving node.
			0b1000_0010, // Week Day Bitmask (Res + Monday)
			8, // Start Hour
			0, // Start Minute
			1, // Duration Hour
			30, // Duration Minute
			0, // Metadata Length
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 5 } as any,
	) as ActiveScheduleCCDailyRepeatingScheduleReport;
	t.expect(cc.constructor).toBe(ActiveScheduleCCDailyRepeatingScheduleReport);

	t.expect(cc.weekdays).toStrictEqual([ScheduleWeekday.Monday]);
	t.expect(cc.timespan).toStrictEqual({
		startHour: 8,
		startMinute: 0,
		durationHour: 1,
		durationMinute: 30,
	});
});

test("the Daily Repeating Schedule Report command should treat a weekday bitmask with only the reserved bit set as an empty slot", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.DailyRepeatingScheduleReport, // CC Command
			ActiveScheduleReportReason.ResponseToGet, // Report Code
			TARGET_CC,
			0x00,
			0x01, // Target ID
			0x00,
			0x01, // Schedule Slot ID
			0x00,
			0x00, // Next Schedule Slot ID
			// CC:00A4.01.0B.11.003: If a requested schedule slot is
			// erased/empty the time fields MUST be set to 0x00.
			0b1000_0000, // Week Day Bitmask (only the reserved bit)
			0, // Start Hour
			0, // Start Minute
			0, // Duration Hour
			0, // Duration Minute
			0, // Metadata Length
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 5 } as any,
	) as ActiveScheduleCCDailyRepeatingScheduleReport;
	t.expect(cc.constructor).toBe(ActiveScheduleCCDailyRepeatingScheduleReport);

	t.expect(cc.weekdays).toBeUndefined();
	t.expect(cc.timespan).toBeUndefined();
});

test("the Daily Repeating Schedule Set command should keep the reserved weekday bit zero when serializing", async (t) => {
	const cc = new ActiveScheduleCCDailyRepeatingScheduleSet({
		nodeId: 2,
		action: ActiveScheduleSetAction.Modify,
		targetCC: TARGET_CC,
		targetId: 1,
		slotId: 1,
		weekdays: [ScheduleWeekday.Sunday, ScheduleWeekday.Saturday],
		timespan: {
			startHour: 20,
			startMinute: 0,
			durationHour: 12,
			durationMinute: 0,
		},
	});
	// CC:00A4.01.09.11.007: The 'Res' bit is reserved and MUST be set to zero
	// by a sending node.
	const expected = buildCCBuffer(
		Uint8Array.from([
			ActiveScheduleCommand.DailyRepeatingScheduleSet, // CC Command
			ActiveScheduleSetAction.Modify, // Set Action
			TARGET_CC,
			0x00,
			0x01, // Target ID
			0x00,
			0x01, // Schedule Slot ID
			0b0100_0001, // Week Day Bitmask (Sat + Sun)
			20, // Start Hour
			0, // Start Minute
			12, // Duration Hour
			0, // Duration Minute
			0, // Metadata Length
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("the Capabilities Report command should round-trip", async (t) => {
	const targetCapabilities = new Map([
		[TARGET_CC, {
			numSupportedTargets: 3,
			numYearDaySlotsPerTarget: 5,
			numDailyRepeatingSlotsPerTarget: 7,
		}],
	]);
	const report = new ActiveScheduleCCCapabilitiesReport({
		nodeId: 2,
		targetCapabilities,
	});
	const serialized = await report.serialize({} as any);

	const cc = await CommandClass.parse(
		serialized,
		{ sourceNodeId: 5 } as any,
	) as ActiveScheduleCCCapabilitiesReport;
	t.expect(cc.constructor).toBe(ActiveScheduleCCCapabilitiesReport);

	t.expect(cc.supportedTargetCCs).toStrictEqual([TARGET_CC]);
	t.expect([...cc.targetCapabilities]).toStrictEqual([
		...targetCapabilities,
	]);
});
