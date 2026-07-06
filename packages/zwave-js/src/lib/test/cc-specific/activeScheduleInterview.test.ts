import {
	type ActiveScheduleDailyRepeatingSchedule,
	ActiveScheduleScheduleKind,
	type ActiveScheduleYearDaySchedule,
	ScheduleWeekday,
} from "@zwave-js/cc";
import {
	ActiveScheduleCCCapabilitiesGet,
	ActiveScheduleCCDailyRepeatingScheduleGet,
	ActiveScheduleCCEnableGet,
	ActiveScheduleCCValues,
	ActiveScheduleCCYearDayScheduleGet,
} from "@zwave-js/cc/ActiveScheduleCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { StateKeys } from "../../node/mockCCBehaviors/ActiveSchedule.js";
import { integrationTest } from "../integrationTestSuite.js";

const TARGET_CC = CommandClasses["Binary Switch"];

const yearDaySchedule2: ActiveScheduleYearDaySchedule = {
	startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
	stopDate: { year: 2026, month: 7, day: 31, hour: 20, minute: 30 },
};

const yearDaySchedule5: ActiveScheduleYearDaySchedule = {
	startDate: { year: 2026, month: 12, day: 24, hour: 18, minute: 0 },
	stopDate: { year: 2026, month: 12, day: 26, hour: 23, minute: 59 },
};

const dailyRepeatingSchedule3: ActiveScheduleDailyRepeatingSchedule = {
	weekdays: [ScheduleWeekday.Monday, ScheduleWeekday.Friday],
	timespan: {
		startHour: 8,
		startMinute: 0,
		durationHour: 9,
		durationMinute: 30,
	},
};

integrationTest(
	"Active Schedule CC interview: queries capabilities and all schedules of single-target CCs",
	{
		clearMessageStatsBeforeTest: false,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Binary Switch"],
				ccCaps({
					ccId: CommandClasses["Active Schedule"],
					isSupported: true,
					version: 1,
					targets: new Map([
						[TARGET_CC, {
							numSupportedTargets: 1,
							numYearDaySlotsPerTarget: 10,
							numDailyRepeatingSlotsPerTarget: 10,
						}],
					]),
				}),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Occupy year day slots 2 and 5 and daily repeating slot 3 on the
			// mock node, so the interview has slot chains to follow
			mockNode.state.set(
				StateKeys.schedule(
					ActiveScheduleScheduleKind.YearDay,
					TARGET_CC,
					1,
					2,
				),
				yearDaySchedule2,
			);
			mockNode.state.set(
				StateKeys.schedule(
					ActiveScheduleScheduleKind.YearDay,
					TARGET_CC,
					1,
					5,
				),
				yearDaySchedule5,
			);
			mockNode.state.set(
				StateKeys.schedule(
					ActiveScheduleScheduleKind.DailyRepeating,
					TARGET_CC,
					1,
					3,
				),
				dailyRepeatingSchedule3,
			);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// CL:00A4.01.11.01.1: A node controlling this Command Class MUST
			// perform a supporting node interview according to the figure
			// "Active Schedule Command Class Interview"
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ActiveScheduleCCCapabilitiesGet,
				{
					errorMessage:
						"Should have sent CapabilitiesGet during the interview",
				},
			);

			// CL:00A4.01.11.02.1: Any time schedule data for a Target
			// (distinct combination of Target CC and Target ID) is queried by
			// a controlling node, it MUST follow the process defined in the
			// figure "Active Schedule Target Interview"
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCYearDayScheduleGet
					&& frame.payload.slotId === 0,
				{
					errorMessage:
						"Should have queried the first occupied year day slot",
				},
			);
			// The report for slot ID 0 contains slot 2 and points to slot 5
			// as the next occupied slot, which must be queried next
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCYearDayScheduleGet
					&& frame.payload.slotId === 5,
				{
					errorMessage:
						"Should have followed the year day slot chain to slot 5",
				},
			);
			// Slot 2 is returned by the slot 0 query already and must not be
			// queried again
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCYearDayScheduleGet
					&& frame.payload.slotId === 2,
				{
					noMatch: true,
					errorMessage: "Should NOT have queried slot 2 directly",
				},
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCDailyRepeatingScheduleGet
					&& frame.payload.slotId === 0,
				{
					errorMessage:
						"Should have queried the first occupied daily repeating slot",
				},
			);

			// CL:00A4.01.61.01.1: A controlling node MUST display a UI
			// showing the following:
			// - Which Targets on the node have (a) schedule(s) attached
			// - If that Target's schedules(s) is/are enabled
			// The interview queries the enabled state to make it available
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ActiveScheduleCCEnableGet,
				{
					errorMessage:
						"Should have queried the enabled state of the target",
				},
			);

			// All queried information must be cached
			t.expect(
				node.getValue(
					ActiveScheduleCCValues.supportedTargetCCs.id,
				),
			).toStrictEqual([TARGET_CC]);
			t.expect(
				node.getValue(
					ActiveScheduleCCValues.targetCapabilities(TARGET_CC).id,
				),
			).toStrictEqual({
				numSupportedTargets: 1,
				numYearDaySlotsPerTarget: 10,
				numDailyRepeatingSlotsPerTarget: 10,
			});
			t.expect(
				node.getValue(
					ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 2).id,
				),
			).toEqual(yearDaySchedule2);
			t.expect(
				node.getValue(
					ActiveScheduleCCValues.yearDaySchedule(TARGET_CC, 1, 5).id,
				),
			).toEqual(yearDaySchedule5);
			t.expect(
				node.getValue(
					ActiveScheduleCCValues.dailyRepeatingSchedule(
						TARGET_CC,
						1,
						3,
					).id,
				),
			).toEqual(dailyRepeatingSchedule3);
			t.expect(
				node.getValue(
					ActiveScheduleCCValues.enabled(TARGET_CC, 1).id,
				),
			).toBe(false);
		},
	},
);

integrationTest(
	"Active Schedule CC interview: does not query schedules of multi-target CCs",
	{
		clearMessageStatsBeforeTest: false,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Binary Switch"],
				ccCaps({
					ccId: CommandClasses["Active Schedule"],
					isSupported: true,
					version: 1,
					targets: new Map([
						[TARGET_CC, {
							numSupportedTargets: 5,
							numYearDaySlotsPerTarget: 10,
							numDailyRepeatingSlotsPerTarget: 10,
						}],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ActiveScheduleCCCapabilitiesGet,
				{
					errorMessage:
						"Should have sent CapabilitiesGet during the interview",
				},
			);

			// Per the figure "Active Schedule Command Class Interview",
			// schedules of Target CCs with more than one Target are
			// interviewed during their respective Target CC interview
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& (frame.payload
							instanceof ActiveScheduleCCYearDayScheduleGet
						|| frame.payload
							instanceof ActiveScheduleCCDailyRepeatingScheduleGet
						|| frame.payload instanceof ActiveScheduleCCEnableGet),
				{
					noMatch: true,
					errorMessage:
						"Should NOT have queried schedules of a multi-target CC",
				},
			);
		},
	},
);

integrationTest(
	"Active Schedule CC interview: skips schedule types with no supported slots",
	{
		clearMessageStatsBeforeTest: false,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Binary Switch"],
				ccCaps({
					ccId: CommandClasses["Active Schedule"],
					isSupported: true,
					version: 1,
					targets: new Map([
						[TARGET_CC, {
							numSupportedTargets: 1,
							numYearDaySlotsPerTarget: 0,
							numDailyRepeatingSlotsPerTarget: 5,
						}],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Per the figure "Active Schedule Target Interview", each schedule
			// type is only queried if the target supports slots of that type
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCYearDayScheduleGet,
				{
					noMatch: true,
					errorMessage: "Should NOT have queried year day schedules",
				},
			);
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCDailyRepeatingScheduleGet,
				{
					errorMessage:
						"Should have queried daily repeating schedules",
				},
			);
		},
	},
);
