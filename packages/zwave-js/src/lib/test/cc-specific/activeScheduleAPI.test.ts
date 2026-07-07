import {
	type ActiveScheduleDailyRepeatingSchedule,
	ActiveScheduleReportReason,
	type ActiveScheduleYearDaySchedule,
	ScheduleWeekday,
} from "@zwave-js/cc";
import {
	ActiveScheduleCCDailyRepeatingScheduleSet,
	ActiveScheduleCCEnableReport,
	ActiveScheduleCCEnableSet,
	ActiveScheduleCCValues,
	ActiveScheduleCCYearDayScheduleReport,
	ActiveScheduleCCYearDayScheduleSet,
} from "@zwave-js/cc/ActiveScheduleCC";
import { CommandClasses } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

const TARGET_CC = CommandClasses["Binary Switch"];

// The mock node advertises multiple targets, so no schedules are queried
// during the interview and the test bodies only see their own frames
const nodeCapabilities = {
	commandClasses: [
		CommandClasses.Version,
		CommandClasses["Binary Switch"],
		ccCaps({
			ccId: CommandClasses["Active Schedule"],
			isSupported: true,
			version: 1,
			targets: new Map([
				[TARGET_CC, {
					numSupportedTargets: 3,
					numYearDaySlotsPerTarget: 5,
					numDailyRepeatingSlotsPerTarget: 5,
				}],
			]),
		}),
	],
};

const yearDaySchedule: ActiveScheduleYearDaySchedule = {
	startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
	stopDate: { year: 2026, month: 7, day: 31, hour: 20, minute: 30 },
};

const dailyRepeatingSchedule: ActiveScheduleDailyRepeatingSchedule = {
	weekdays: [ScheduleWeekday.Monday, ScheduleWeekday.Friday],
	timespan: {
		startHour: 8,
		startMinute: 0,
		durationHour: 9,
		durationMinute: 30,
	},
};

integrationTest(
	"Active Schedule CC API: enabling/disabling and querying the enabled state",
	{
		nodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const api = node.commandClasses["Active Schedule"];
			const target = { targetCC: TARGET_CC, targetId: 1 };
			const enabledValue = ActiveScheduleCCValues.enabled(TARGET_CC, 1);

			// CL:00A4.01.51.01.1: If the supporting node supports both the
			// Active Schedule Command Class, version 1 and a compatible
			// command class in in the Supported Target CCs table, and the
			// respective Target CC enables scheduling, the device MUST allow
			// the controller to enable and disable all schedules attached to
			// a target using the Active Schedule Enable Set Command.
			await api.setEnabled(target, true);
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ActiveScheduleCCEnableSet
					&& frame.payload.enabled,
				{
					errorMessage: "Should have sent EnableSet",
				},
			);
			// The enabled state is cached optimistically on success
			t.expect(node.getValue(enabledValue.id)).toBe(true);

			// CL:00A4.01.31.01.1: If the supporting node supports both the
			// Active Schedule Command Class, version 1 and a compatible
			// command class in in the Supported Target CCs table, and the
			// respective Target CC enables scheduling, the device MUST allow
			// the controller to query a Target's scheduling enabled/disabled
			// state using the Active Schedule Enable Get Command.
			t.expect(await api.getEnabled(target)).toBe(true);

			await api.setEnabled(target, false);
			t.expect(node.getValue(enabledValue.id)).toBe(false);
			t.expect(await api.getEnabled(target)).toBe(false);
		},
	},
);

integrationTest("Active Schedule CC API: year day schedule lifecycle", {
	nodeCapabilities,

	testBody: async (t, driver, node, mockController, mockNode) => {
		const api = node.commandClasses["Active Schedule"];
		const target = { targetCC: TARGET_CC, targetId: 1 };
		const enabledValue = ActiveScheduleCCValues.enabled(TARGET_CC, 1);

		// CL:00A4.01.21.01.1: If the supporting node supports both the Active
		// Schedule Command Class, version 1 and a compatible command class in
		// in the Supported Target CCs table, and the respective Target CC
		// enables scheduling, the device MUST allow adding, modifying and
		// deleting schedules for a target by the controller using the Active
		// Schedule Year Day Schedule Set Command or the Active Schedule Daily
		// Repeating Schedule Set Command.
		await api.setYearDaySchedule(
			{ ...target, slotId: 2 },
			yearDaySchedule,
		);
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof ActiveScheduleCCYearDayScheduleSet
				&& frame.payload.slotId === 2,
			{
				errorMessage: "Should have sent YearDayScheduleSet",
			},
		);
		// The schedule is cached optimistically on success
		t.expect(
			node.getValue(
				ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 2).id,
			),
		).toEqual(yearDaySchedule);
		// CC:00A4.01.06.11.001: When set successfully, scheduling as reported
		// in the Active Schedule Enable Report Command MUST be automatically
		// enabled for the identified Target.
		t.expect(node.getValue(enabledValue.id)).toBe(true);
		t.expect(await api.getEnabled(target)).toBe(true);

		// CC:00A4.01.07.11.004: A Schedule Slot ID of zero MUST signify to
		// the receiving node that the first occupied Schedule Slot for the
		// given Target is to be returned the report.
		const firstOccupied = await api.getYearDaySchedule({
			...target,
			slotId: 0,
		});
		// The report echoes slot 2, so a slot-0 cursor walk knows the real slot
		t.expect(firstOccupied).toEqual({
			...yearDaySchedule,
			metadata: undefined,
			slotId: 2,
			nextSlotId: 0,
		});

		// CC:00A4.01.08.11.004: If a requested schedule slot is erased/empty
		// the time fields MUST be set to 0x00.
		// The API translates such a report to `false`
		t.expect(
			await api.getYearDaySchedule({ ...target, slotId: 3 }),
		).toBe(false);

		// The report for an occupied slot advertises the next occupied slot
		await api.setYearDaySchedule(
			{ ...target, slotId: 4 },
			yearDaySchedule,
		);
		const withNext = await api.getYearDaySchedule({
			...target,
			slotId: 2,
		});
		t.expect(withNext && withNext.slotId).toBe(2);
		t.expect(withNext && withNext.nextSlotId).toBe(4);

		// Erasing a single slot marks the cached schedule as empty
		await api.setYearDaySchedule({ ...target, slotId: 2 }, undefined);
		t.expect(
			node.getValue(
				ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 2).id,
			),
		).toBe(false);
		t.expect(
			await api.getYearDaySchedule({ ...target, slotId: 2 }),
		).toBe(false);
	},
});

integrationTest("Active Schedule CC API: daily repeating schedule lifecycle", {
	nodeCapabilities,

	testBody: async (t, driver, node, mockController, mockNode) => {
		const api = node.commandClasses["Active Schedule"];
		const target = { targetCC: TARGET_CC, targetId: 2 };
		const enabledValue = ActiveScheduleCCValues.enabled(TARGET_CC, 2);

		// CL:00A4.01.21.01.1: If the supporting node supports both the Active
		// Schedule Command Class, version 1 and a compatible command class in
		// in the Supported Target CCs table, and the respective Target CC
		// enables scheduling, the device MUST allow adding, modifying and
		// deleting schedules for a target by the controller using the Active
		// Schedule Year Day Schedule Set Command or the Active Schedule Daily
		// Repeating Schedule Set Command.
		await api.setDailyRepeatingSchedule(
			{ ...target, slotId: 1 },
			dailyRepeatingSchedule,
		);
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload
					instanceof ActiveScheduleCCDailyRepeatingScheduleSet
				&& frame.payload.slotId === 1,
			{
				errorMessage: "Should have sent DailyRepeatingScheduleSet",
			},
		);
		// The schedule is cached optimistically on success
		t.expect(
			node.getValue(
				ActiveScheduleCCValues.dailyRepeatingSchedule(TARGET_CC, 2, 1)
					.id,
			),
		).toEqual(dailyRepeatingSchedule);
		// CC:00A4.01.09.11.001: When set successfully, scheduling as reported
		// in the Active Schedule Enable Report Command MUST be automatically
		// enabled for the identified Target.
		t.expect(node.getValue(enabledValue.id)).toBe(true);

		// CC:00A4.01.0A.11.004: A Schedule Slot ID of zero MUST signify to
		// the receiving node that the first occupied Schedule Slot for the
		// given Target is to be returned the report.
		const firstOccupied = await api.getDailyRepeatingSchedule({
			...target,
			slotId: 0,
		});
		// The report echoes slot 1, so a slot-0 cursor walk knows the real slot
		t.expect(firstOccupied).toEqual({
			...dailyRepeatingSchedule,
			metadata: undefined,
			slotId: 1,
			nextSlotId: 0,
		});

		// CC:00A4.01.0B.11.003: If a requested schedule slot is erased/empty
		// the time fields MUST be set to 0x00.
		// The API translates such a report to `false`
		t.expect(
			await api.getDailyRepeatingSchedule({ ...target, slotId: 2 }),
		).toBe(false);

		// Erasing a single slot marks the cached schedule as empty
		await api.setDailyRepeatingSchedule(
			{ ...target, slotId: 1 },
			undefined,
		);
		t.expect(
			node.getValue(
				ActiveScheduleCCValues.dailyRepeatingSchedule(TARGET_CC, 2, 1)
					.id,
			),
		).toBe(false);
		t.expect(
			await api.getDailyRepeatingSchedule({ ...target, slotId: 1 }),
		).toBe(false);
	},
});

integrationTest("Active Schedule CC API: batch erase clears cached schedules", {
	nodeCapabilities,

	testBody: async (t, driver, node, mockController, mockNode) => {
		const api = node.commandClasses["Active Schedule"];
		const target = { targetCC: TARGET_CC, targetId: 1 };

		await api.setYearDaySchedule(
			{ ...target, slotId: 2 },
			yearDaySchedule,
		);
		await api.setYearDaySchedule(
			{ ...target, slotId: 4 },
			yearDaySchedule,
		);
		// Schedules of a different target must not be affected by the erase
		await api.setYearDaySchedule(
			{ targetCC: TARGET_CC, targetId: 2, slotId: 1 },
			yearDaySchedule,
		);

		// CC:00A4.01.06.11.007: A Schedule Slot ID value of zero during an
		// Erase Set Action signifies a batch erase operation. Assuming that
		// the target is otherwise valid, the operation MUST execute based on
		// the target values outlined in the Schedule Erase Definitions table:
		// "Erase all schedules of this type attached to the Target."
		await api.setYearDaySchedule({ ...target, slotId: 0 }, undefined);

		t.expect(
			node.getValue(
				ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 2).id,
			),
		).toBe(false);
		t.expect(
			node.getValue(
				ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 4).id,
			),
		).toBe(false);
		t.expect(
			node.getValue(
				ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 2, 1).id,
			),
		).toEqual(yearDaySchedule);

		// The mock node erased its schedules as well
		t.expect(
			await api.getYearDaySchedule({ ...target, slotId: 0 }),
		).toBe(false);
		t.expect(
			await api.getYearDaySchedule({
				targetCC: TARGET_CC,
				targetId: 2,
				slotId: 1,
			}),
		).toEqual({
			...yearDaySchedule,
			metadata: undefined,
			slotId: 1,
			nextSlotId: 0,
		});
	},
});

integrationTest(
	"Active Schedule CC API: a slot-0 cursor walk enumerates occupied slots",
	{
		nodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const api = node.commandClasses["Active Schedule"];
			const target = { targetCC: TARGET_CC, targetId: 1 };

			// Occupy slots out of order to prove the walk follows nextSlotId
			await api.setYearDaySchedule(
				{ ...target, slotId: 4 },
				yearDaySchedule,
			);
			await api.setYearDaySchedule(
				{ ...target, slotId: 2 },
				yearDaySchedule,
			);

			// CC:00A4.01.07.11.004: A Schedule Slot ID of zero MUST signify to
			// the receiving node that the first occupied Schedule Slot for the
			// given Target is to be returned the report.
			// The report's Next Schedule Slot ID field allows walking the
			// chain of occupied slots until it ends
			const visited: number[] = [];
			let slotId = 0;
			for (let i = 0; i < 10; i++) {
				const result = await api.getYearDaySchedule({
					...target,
					slotId,
				});
				if (!result) break;
				// The result identifies its own slot, so the walk can record it
				visited.push(result.slotId);
				if (result.nextSlotId === 0) break;
				slotId = result.nextSlotId;
			}

			t.expect(visited).toStrictEqual([2, 4]);
		},
	},
);

integrationTest("Active Schedule CC API: rejects invalid arguments", {
	nodeCapabilities,

	testBody: async (t, driver, node, mockController, mockNode) => {
		const api = node.commandClasses["Active Schedule"];
		const target = { targetCC: TARGET_CC, targetId: 1 };

		// CC:00A4.01.06.11.002: The stop parameters of the time fence MUST
		// occur after the start parameters.
		await t.expect(
			api.setYearDaySchedule({ ...target, slotId: 1 }, {
				startDate: yearDaySchedule.stopDate,
				stopDate: yearDaySchedule.startDate,
			}),
		).rejects.toThrow("stop date");

		// CC:00A4.01.06.11.008: If any of the values above are not in the
		// respective provided ranges, the command MUST be ignored.
		await t.expect(
			api.setYearDaySchedule({ ...target, slotId: 1 }, {
				startDate: {
					year: 2026,
					month: 13,
					day: 1,
					hour: 0,
					minute: 0,
				},
				stopDate: { year: 2027, month: 1, day: 1, hour: 0, minute: 0 },
			}),
		).rejects.toThrow();

		// CC:00A4.01.00.11.018: Schedule Metadata MUST be less than or equal
		// to seven (7) bytes in length.
		await t.expect(
			api.setYearDaySchedule({ ...target, slotId: 1 }, {
				...yearDaySchedule,
				metadata: new Uint8Array(8),
			}),
		).rejects.toThrow("metadata");

		// CC:00A4.01.06.13.006: This value MAY be equal to zero *ONLY* when
		// coupled with an **Erase** Set Action.
		await t.expect(
			api.setYearDaySchedule({ ...target, slotId: 0 }, yearDaySchedule),
		).rejects.toThrow("slot ID");

		// CC:00A4.01.09.11.009: If any of the numeric values above are not in
		// the respective provided ranges, the command MUST be ignored by the
		// receiving node.
		await t.expect(
			api.setDailyRepeatingSchedule({ ...target, slotId: 1 }, {
				...dailyRepeatingSchedule,
				timespan: {
					startHour: 8,
					startMinute: 0,
					durationHour: 24,
					durationMinute: 0,
				},
			}),
		).rejects.toThrow("timespan");

		// An empty weekday bitmask signifies an empty slot, so a schedule
		// must apply to at least one weekday
		await t.expect(
			api.setDailyRepeatingSchedule({ ...target, slotId: 1 }, {
				...dailyRepeatingSchedule,
				weekdays: [],
			}),
		).rejects.toThrow("weekday");

		// None of the rejected calls may send a command
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& (frame.payload instanceof ActiveScheduleCCYearDayScheduleSet
					|| frame.payload
						instanceof ActiveScheduleCCDailyRepeatingScheduleSet),
			{
				noMatch: true,
				errorMessage:
					"Should NOT have sent a Set command for invalid arguments",
			},
		);
	},
});

integrationTest(
	"Active Schedule CC: unsolicited reports update the cache",
	{
		nodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// CC:00A4.01.05.11.001: The value of this field MUST comply with
			// the Active Schedule::Report Code table.
			// (Report Code 0x01, Schedule(s) Modified
			// (External)): The data in the specified applicable schedule
			// slot(s) was/were overwritten with the provided data from an
			// external source. Reports of this type MUST be sent to the
			// lifeline.
			let cc:
				| ActiveScheduleCCEnableReport
				| ActiveScheduleCCYearDayScheduleReport =
					new ActiveScheduleCCEnableReport({
						nodeId: mockNode.id,
						targetCC: TARGET_CC,
						targetId: 1,
						reportReason:
							ActiveScheduleReportReason.ModifiedExternal,
						enabled: true,
					});
			await mockNode.sendToController(createMockZWaveRequestFrame(cc));
			await wait(100);

			t.expect(
				node.getValue(
					ActiveScheduleCCValues.enabled(TARGET_CC, 1).id,
				),
			).toBe(true);

			cc = new ActiveScheduleCCYearDayScheduleReport({
				nodeId: mockNode.id,
				targetCC: TARGET_CC,
				targetId: 1,
				slotId: 3,
				nextSlotId: 0,
				reportReason: ActiveScheduleReportReason.ModifiedExternal,
				...yearDaySchedule,
			});
			await mockNode.sendToController(createMockZWaveRequestFrame(cc));
			await wait(100);

			t.expect(
				node.getValue(
					ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 3).id,
				),
			).toEqual(yearDaySchedule);
		},
	},
);
