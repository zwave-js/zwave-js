import {
	ActiveScheduleReportReason,
	ActiveScheduleScheduleKind,
	ScheduleWeekday,
} from "@zwave-js/cc";
import {
	ActiveScheduleCCDailyRepeatingScheduleReport,
	ActiveScheduleCCEnableReport,
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
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import {
	ScheduleKind,
	type ScheduleTarget,
	ScheduleTargetType,
	SetScheduleResult,
} from "../../node/feature-apis/Scheduling.js";
import { StateKeys } from "../../node/mockCCBehaviors/ActiveSchedule.js";
import { integrationTest } from "../integrationTestSuite.js";

const user1: ScheduleTarget = { type: ScheduleTargetType.User, userId: 1 };
const user2: ScheduleTarget = { type: ScheduleTargetType.User, userId: 2 };

const U3C = CommandClasses["User Credential"];

const mockScheduleStateKey = (
	kind: ActiveScheduleScheduleKind,
	targetId: number,
	slotId: number,
) => StateKeys.schedule(kind, U3C, targetId, slotId);

const defaultNodeCapabilities = {
	commandClasses: [
		CommandClasses.Version,
		ccCaps({
			ccId: CommandClasses["Active Schedule"],
			version: 1,
			targets: new Map([
				[U3C, {
					numSupportedTargets: 3,
					numYearDaySlotsPerTarget: 2,
					numDailyRepeatingSlotsPerTarget: 2,
				}],
			]),
		}),
	],
};

// =============================================================================
// Capabilities
// =============================================================================

integrationTest(
	"Capabilities are translated correctly for Active Schedule CC",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const caps = node.scheduling!.getCapabilitiesCached();
			t.expect(caps.targets.size).toBe(1);

			const userCaps = caps.targets.get(ScheduleTargetType.User);
			t.expect(userCaps).toBeDefined();
			t.expect(userCaps!.numTargets).toBe(3);
			// Active Schedule targets can mix schedule kinds
			t.expect(userCaps!.supportsMixedKinds).toBe(true);
			t.expect(userCaps!.yearDay).toStrictEqual({ numSlots: 2 });
			t.expect(userCaps!.dailyRepeating).toStrictEqual({
				numSlots: 2,
				maxWeekdays: 7,
				supportsWrapAround: true,
			});
		},
	},
);

// =============================================================================
// Writing schedules
// =============================================================================

integrationTest(
	"setSchedule stores a daily repeating schedule and emits schedule added + schedule enabled changed",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const addedEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule added",
				(_endpoint, args) => addedEvent.resolve(args),
			);
			const enabledEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule enabled changed",
				(_endpoint, args) => enabledEvent.resolve(args),
			);

			const schedule = {
				kind: ScheduleKind.DailyRepeating as const,
				weekdays: [ScheduleWeekday.Monday, ScheduleWeekday.Wednesday],
				timespan: {
					startHour: 9,
					startMinute: 0,
					durationHour: 8,
					durationMinute: 30,
				},
			};
			const result = await node.scheduling!.setSchedule(
				user1,
				1,
				schedule,
			);
			t.expect(result).toBe(SetScheduleResult.OK);

			t.expect(await addedEvent).toMatchObject({
				target: user1,
				slot: 1,
				...schedule,
			});
			t.expect(await enabledEvent).toMatchObject({
				target: user1,
				enabled: true,
			});

			// The schedule is cached and scheduling is enabled on the device
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.DailyRepeating,
					1,
				),
			).toMatchObject(schedule);
			t.expect(node.scheduling!.getEnabledCached(user1)).toBe(true);
			await t.expect(node.scheduling!.getEnabled(user1)).resolves.toBe(
				true,
			);
		},
	},
);

integrationTest(
	"setSchedule emits schedule modified when overwriting an occupied slot",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const schedule = {
				kind: ScheduleKind.DailyRepeating as const,
				weekdays: [ScheduleWeekday.Monday],
				timespan: {
					startHour: 9,
					startMinute: 0,
					durationHour: 8,
					durationMinute: 0,
				},
			};
			await node.scheduling!.setSchedule(user1, 1, schedule);

			const modifiedEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule modified",
				(_endpoint, args) => modifiedEvent.resolve(args),
			);

			const changed = {
				...schedule,
				timespan: { ...schedule.timespan, startHour: 10 },
			};
			await node.scheduling!.setSchedule(user1, 1, changed);

			t.expect(await modifiedEvent).toMatchObject({
				target: user1,
				slot: 1,
				...changed,
			});
		},
	},
);

integrationTest(
	"setSchedule allows mixing schedule kinds for the same target",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const daily = {
				kind: ScheduleKind.DailyRepeating as const,
				weekdays: [ScheduleWeekday.Monday],
				timespan: {
					startHour: 9,
					startMinute: 0,
					durationHour: 8,
					durationMinute: 0,
				},
			};
			const yearDay = {
				kind: ScheduleKind.YearDay as const,
				startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
				stopDate: {
					year: 2026,
					month: 7,
					day: 15,
					hour: 18,
					minute: 0,
				},
			};

			t.expect(await node.scheduling!.setSchedule(user1, 1, daily))
				.toBe(SetScheduleResult.OK);
			t.expect(await node.scheduling!.setSchedule(user1, 1, yearDay))
				.toBe(SetScheduleResult.OK);

			// Both schedules coexist
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.DailyRepeating,
					1,
				),
			).toMatchObject(daily);
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.YearDay,
					1,
				),
			).toMatchObject(yearDay);
		},
	},
);

integrationTest(
	"setSchedule supports year day schedules with full 16-bit years",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const schedule = {
				kind: ScheduleKind.YearDay as const,
				startDate: {
					year: 2101,
					month: 1,
					day: 1,
					hour: 0,
					minute: 0,
				},
				stopDate: {
					year: 2101,
					month: 12,
					day: 31,
					hour: 23,
					minute: 59,
				},
			};
			const result = await node.scheduling!.setSchedule(
				user1,
				1,
				schedule,
			);
			t.expect(result).toBe(SetScheduleResult.OK);

			const readBack = await node.scheduling!.getSchedule(
				user1,
				ScheduleKind.YearDay,
				1,
			);
			t.expect(readBack).toMatchObject(schedule);

			// Schedule kinds combine with AND on this CC, so unqueried slots
			// of the other kind keep the result inconclusive
			t.expect(
				node.scheduling!.isScheduleActiveCached(
					user1,
					new Date(2101, 5, 15, 12, 0),
				),
			).toBeUndefined();
			// Once all slots are known, the result is definitive
			await node.scheduling!.getSchedules(user1);
			t.expect(
				node.scheduling!.isScheduleActiveCached(
					user1,
					new Date(2101, 5, 15, 12, 0),
				),
			).toBe(true);
			t.expect(
				node.scheduling!.isScheduleActiveCached(
					user1,
					new Date(2102, 5, 15, 12, 0),
				),
			).toBe(false);
		},
	},
);

// =============================================================================
// Deleting schedules
// =============================================================================

integrationTest(
	"deleteSchedule erases the slot and emits schedule deleted",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.scheduling!.setSchedule(user1, 1, {
				kind: ScheduleKind.DailyRepeating,
				weekdays: [ScheduleWeekday.Monday],
				timespan: {
					startHour: 9,
					startMinute: 0,
					durationHour: 8,
					durationMinute: 0,
				},
			});

			const deletedEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule deleted",
				(_endpoint, args) => deletedEvent.resolve(args),
			);

			const result = await node.scheduling!.deleteSchedule(
				user1,
				ScheduleKind.DailyRepeating,
				1,
			);
			t.expect(result).toBe(SetScheduleResult.OK);
			t.expect(await deletedEvent).toStrictEqual({
				target: user1,
				kind: ScheduleKind.DailyRepeating,
				slot: 1,
			});

			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						ActiveScheduleScheduleKind.DailyRepeating,
						1,
						1,
					),
				),
			).toBeUndefined();
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.DailyRepeating,
					1,
				),
			).toBe(false);
		},
	},
);

integrationTest(
	"deleteSchedules uses the batch erase with slot ID 0",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.scheduling!.setSchedule(user1, 1, {
				kind: ScheduleKind.YearDay,
				startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
				stopDate: {
					year: 2026,
					month: 7,
					day: 15,
					hour: 18,
					minute: 0,
				},
			});
			await node.scheduling!.setSchedule(user1, 2, {
				kind: ScheduleKind.YearDay,
				startDate: { year: 2026, month: 8, day: 1, hour: 8, minute: 0 },
				stopDate: {
					year: 2026,
					month: 8,
					day: 15,
					hour: 18,
					minute: 0,
				},
			});
			await node.scheduling!.setSchedule(user2, 1, {
				kind: ScheduleKind.YearDay,
				startDate: { year: 2026, month: 9, day: 1, hour: 8, minute: 0 },
				stopDate: {
					year: 2026,
					month: 9,
					day: 15,
					hour: 18,
					minute: 0,
				},
			});

			const deletedSlots: unknown[] = [];
			node.on(
				"schedule deleted",
				(_endpoint, args) => deletedSlots.push(args),
			);

			const result = await node.scheduling!.deleteSchedules({
				target: user1,
				kind: ScheduleKind.YearDay,
			});
			t.expect(result).toBe(SetScheduleResult.OK);

			// A single erase command with slot ID 0 wipes all slots
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ActiveScheduleCCYearDayScheduleSet
					&& frame.payload.slotId === 0
					&& frame.payload.targetId === 1,
				{
					errorMessage:
						"Expected a batch erase command with slot ID 0",
				},
			);

			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						ActiveScheduleScheduleKind.YearDay,
						1,
						1,
					),
				),
			).toBeUndefined();
			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						ActiveScheduleScheduleKind.YearDay,
						1,
						2,
					),
				),
			).toBeUndefined();
			// Schedules of other users are not affected
			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						ActiveScheduleScheduleKind.YearDay,
						2,
						1,
					),
				),
			).toBeDefined();

			// Both previously known schedules are reported as deleted
			t.expect(deletedSlots).toStrictEqual([
				{ target: user1, kind: ScheduleKind.YearDay, slot: 1 },
				{ target: user1, kind: ScheduleKind.YearDay, slot: 2 },
			]);
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.YearDay,
					1,
				),
			).toBe(false);
		},
	},
);

integrationTest(
	"deleteSchedules without a target erases the schedules of all targets",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.scheduling!.setSchedule(user1, 1, {
				kind: ScheduleKind.DailyRepeating,
				weekdays: [ScheduleWeekday.Monday],
				timespan: {
					startHour: 9,
					startMinute: 0,
					durationHour: 8,
					durationMinute: 0,
				},
			});
			await node.scheduling!.setSchedule(user2, 1, {
				kind: ScheduleKind.DailyRepeating,
				weekdays: [ScheduleWeekday.Friday],
				timespan: {
					startHour: 20,
					startMinute: 0,
					durationHour: 2,
					durationMinute: 0,
				},
			});

			const result = await node.scheduling!.deleteSchedules();
			t.expect(result).toBe(SetScheduleResult.OK);

			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						ActiveScheduleScheduleKind.DailyRepeating,
						1,
						1,
					),
				),
			).toBeUndefined();
			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						ActiveScheduleScheduleKind.DailyRepeating,
						2,
						1,
					),
				),
			).toBeUndefined();
		},
	},
);

// =============================================================================
// Reading schedules
// =============================================================================

integrationTest(
	"getSchedules discovers schedules programmed by other controllers",
	{
		nodeCapabilities: defaultNodeCapabilities,

		// The device has schedules Z-Wave JS knows nothing about
		customSetup: async (driver, controller, mockNode) => {
			mockNode.state.set(
				mockScheduleStateKey(ActiveScheduleScheduleKind.YearDay, 2, 2),
				{
					startDate: {
						year: 2026,
						month: 7,
						day: 1,
						hour: 8,
						minute: 0,
					},
					stopDate: {
						year: 2026,
						month: 7,
						day: 15,
						hour: 18,
						minute: 0,
					},
				},
			);
			mockNode.state.set(
				mockScheduleStateKey(
					ActiveScheduleScheduleKind.DailyRepeating,
					2,
					1,
				),
				{
					weekdays: [ScheduleWeekday.Monday],
					timespan: {
						startHour: 9,
						startMinute: 0,
						durationHour: 8,
						durationMinute: 30,
					},
				},
			);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const schedules = await node.scheduling!.getSchedules(user2);
			t.expect(schedules).toStrictEqual([
				{
					target: user2,
					slot: 2,
					kind: ScheduleKind.YearDay,
					startDate: {
						year: 2026,
						month: 7,
						day: 1,
						hour: 8,
						minute: 0,
					},
					stopDate: {
						year: 2026,
						month: 7,
						day: 15,
						hour: 18,
						minute: 0,
					},
				},
				{
					target: user2,
					slot: 1,
					kind: ScheduleKind.DailyRepeating,
					weekdays: [ScheduleWeekday.Monday],
					timespan: {
						startHour: 9,
						startMinute: 0,
						durationHour: 8,
						durationMinute: 30,
					},
				},
			]);
		},
	},
);

// =============================================================================
// Enabling and disabling schedules
// =============================================================================

integrationTest(
	"getEnabled queries the enabled state from the device",
	{
		nodeCapabilities: defaultNodeCapabilities,

		// Scheduling was enabled by another controller
		customSetup: async (driver, controller, mockNode) => {
			mockNode.state.set(StateKeys.enabled(U3C, 1), true);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The cache knows nothing yet
			t.expect(node.scheduling!.getEnabledCached(user1))
				.toBeUndefined();

			await t.expect(node.scheduling!.getEnabled(user1)).resolves.toBe(
				true,
			);
			// The response updated the cache
			t.expect(node.scheduling!.getEnabledCached(user1)).toBe(true);
		},
	},
);

integrationTest(
	"setEnabled emits schedule enabled changed",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.scheduling!.setSchedule(user1, 1, {
				kind: ScheduleKind.DailyRepeating,
				weekdays: [ScheduleWeekday.Monday],
				timespan: {
					startHour: 9,
					startMinute: 0,
					durationHour: 8,
					durationMinute: 0,
				},
			});

			const enabledEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule enabled changed",
				(_endpoint, args) => enabledEvent.resolve(args),
			);

			const result = await node.scheduling!.setEnabled(false, user1);
			t.expect(result).toBe(SetScheduleResult.OK);
			t.expect(await enabledEvent).toStrictEqual({
				target: user1,
				enabled: false,
			});
			t.expect(node.scheduling!.getEnabledCached(user1)).toBe(false);
			await t.expect(node.scheduling!.getEnabled(user1)).resolves.toBe(
				false,
			);
		},
	},
);

// =============================================================================
// Unsolicited reports
// =============================================================================

integrationTest(
	"externally modified schedules are reported via events",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const modifiedEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule modified",
				(_endpoint, args) => modifiedEvent.resolve(args),
			);

			const schedule = {
				startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
				stopDate: {
					year: 2026,
					month: 7,
					day: 15,
					hour: 18,
					minute: 0,
				},
			};
			const cc = new ActiveScheduleCCYearDayScheduleReport({
				nodeId: mockNode.id,
				targetCC: U3C,
				targetId: 1,
				slotId: 1,
				reportReason: ActiveScheduleReportReason.ModifiedExternal,
				nextSlotId: 0,
				...schedule,
			});
			await mockNode.sendToController(createMockZWaveRequestFrame(cc));

			t.expect(await modifiedEvent).toStrictEqual({
				target: user1,
				slot: 1,
				kind: ScheduleKind.YearDay,
				...schedule,
			});

			// The report also updated the cache
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.YearDay,
					1,
				),
			).toMatchObject(schedule);
		},
	},
);

integrationTest(
	"externally erased schedules and enable changes are reported via events",
	{
		nodeCapabilities: defaultNodeCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			const deletedEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule deleted",
				(_endpoint, args) => deletedEvent.resolve(args),
			);
			const enabledEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule enabled changed",
				(_endpoint, args) => enabledEvent.resolve(args),
			);

			const scheduleReport =
				new ActiveScheduleCCDailyRepeatingScheduleReport({
					nodeId: mockNode.id,
					targetCC: U3C,
					targetId: 2,
					slotId: 1,
					reportReason: ActiveScheduleReportReason.ModifiedExternal,
					nextSlotId: 0,
				});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(scheduleReport),
			);

			t.expect(await deletedEvent).toStrictEqual({
				target: user2,
				kind: ScheduleKind.DailyRepeating,
				slot: 1,
			});

			const enableReport = new ActiveScheduleCCEnableReport({
				nodeId: mockNode.id,
				targetCC: U3C,
				targetId: 2,
				reportReason: ActiveScheduleReportReason.ModifiedExternal,
				enabled: false,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(enableReport),
			);

			t.expect(await enabledEvent).toStrictEqual({
				target: user2,
				enabled: false,
			});
			// The report also updated the cache
			t.expect(node.scheduling!.getEnabledCached(user2)).toBe(false);
		},
	},
);

integrationTest(
	"reports in response to queries do not emit events",
	{
		nodeCapabilities: defaultNodeCapabilities,

		// The device has a schedule Z-Wave JS knows nothing about
		customSetup: async (driver, controller, mockNode) => {
			mockNode.state.set(
				mockScheduleStateKey(ActiveScheduleScheduleKind.YearDay, 1, 1),
				{
					startDate: {
						year: 2026,
						month: 7,
						day: 1,
						hour: 8,
						minute: 0,
					},
					stopDate: {
						year: 2026,
						month: 7,
						day: 15,
						hour: 18,
						minute: 0,
					},
				},
			);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			let eventEmitted = false;
			node.on("schedule added", () => {
				eventEmitted = true;
			});
			node.on("schedule modified", () => {
				eventEmitted = true;
			});

			const schedule = await node.scheduling!.getSchedule(
				user1,
				ScheduleKind.YearDay,
				1,
			);
			t.expect(schedule).toBeDefined();

			await wait(100);
			t.expect(eventEmitted).toBe(false);
		},
	},
);
