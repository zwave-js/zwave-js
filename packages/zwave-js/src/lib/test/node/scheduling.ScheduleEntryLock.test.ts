import { ScheduleEntryLockScheduleKind, ScheduleWeekday } from "@zwave-js/cc";
import { ScheduleEntryLockCCValues } from "@zwave-js/cc/ScheduleEntryLockCC";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps } from "@zwave-js/testing";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import {
	ScheduleKind,
	type ScheduleTarget,
	ScheduleTargetType,
	SetScheduleResult,
} from "../../node/feature-apis/Scheduling.js";
import { integrationTest } from "../integrationTestSuite.js";

const user1: ScheduleTarget = { type: ScheduleTargetType.User, userId: 1 };
const user2: ScheduleTarget = { type: ScheduleTargetType.User, userId: 2 };

// State keys used by the Schedule Entry Lock mock CC behaviors
const mockScheduleStateKey = (
	userId: number,
	slotId: number,
	kind: ScheduleEntryLockScheduleKind,
) => `ScheduleEntryLock_schedule_${userId}_${slotId}_${kind}`;

// =============================================================================
// Capabilities
// =============================================================================

integrationTest(
	"Capabilities are translated correctly for Schedule Entry Lock CC V3",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 5,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 7,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const caps = node.scheduling!.getCapabilitiesCached();
			t.expect(caps.targets.size).toBe(1);

			const userCaps = caps.targets.get(ScheduleTargetType.User);
			t.expect(userCaps).toBeDefined();
			t.expect(userCaps!.numTargets).toBe(3);
			t.expect(userCaps!.supportsMixedKinds).toBe(false);
			t.expect(userCaps!.yearDay).toStrictEqual({ numSlots: 2 });
			// Native daily repeating slots take precedence over week day slots
			t.expect(userCaps!.dailyRepeating).toStrictEqual({
				numSlots: 7,
				maxWeekdays: 7,
				supportsWrapAround: true,
			});
		},
	},
);

integrationTest(
	"Week day slots back the daily repeating kind on Schedule Entry Lock CC V1",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 1,
					numWeekDaySlots: 4,
					numYearDaySlots: 0,
					numDailyRepeatingSlots: 0,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const userCaps = node.scheduling!.getCapabilitiesCached()
				.targets.get(ScheduleTargetType.User);
			t.expect(userCaps).toBeDefined();
			t.expect(userCaps!.yearDay).toBeUndefined();
			t.expect(userCaps!.dailyRepeating).toStrictEqual({
				numSlots: 4,
				maxWeekdays: 1,
				supportsWrapAround: false,
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
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

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

			// The schedule is cached and the enabled state is assumed
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.DailyRepeating,
					1,
				),
			).toMatchObject(schedule);
			t.expect(node.scheduling!.getEnabledCached(user1)).toBe(true);
		},
	},
);

integrationTest(
	"setSchedule emits schedule modified when overwriting an occupied slot",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

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
	"setSchedule routes recurring schedules to week day slots on V1 devices",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 1,
					numWeekDaySlots: 4,
					numYearDaySlots: 0,
					numDailyRepeatingSlots: 0,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const schedule = {
				kind: ScheduleKind.DailyRepeating as const,
				weekdays: [ScheduleWeekday.Tuesday],
				timespan: {
					startHour: 8,
					startMinute: 15,
					durationHour: 2,
					durationMinute: 50,
				},
			};
			const result = await node.scheduling!.setSchedule(
				user1,
				2,
				schedule,
			);
			t.expect(result).toBe(SetScheduleResult.OK);

			// The device stores this as a week day schedule with a stop time
			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						1,
						2,
						ScheduleEntryLockScheduleKind.WeekDay,
					),
				),
			).toStrictEqual({
				weekday: ScheduleWeekday.Tuesday,
				startHour: 8,
				startMinute: 15,
				stopHour: 11,
				stopMinute: 5,
			});

			// Reading it back returns the unified representation
			t.expect(
				node.scheduling!.getScheduleCached(
					user1,
					ScheduleKind.DailyRepeating,
					2,
				),
			).toMatchObject(schedule);
		},
	},
);

integrationTest(
	"setSchedule rejects schedules exceeding the week day slot constraints on V1 devices",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 1,
					numWeekDaySlots: 4,
					numYearDaySlots: 0,
					numDailyRepeatingSlots: 0,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Multiple weekdays require native daily repeating slots
			await t.expect(
				node.scheduling!.setSchedule(user1, 1, {
					kind: ScheduleKind.DailyRepeating,
					weekdays: [
						ScheduleWeekday.Monday,
						ScheduleWeekday.Tuesday,
					],
					timespan: {
						startHour: 9,
						startMinute: 0,
						durationHour: 1,
						durationMinute: 0,
					},
				}),
			).rejects.toThrow("weekday");

			// Week day slots cannot extend past midnight
			await t.expect(
				node.scheduling!.setSchedule(user1, 1, {
					kind: ScheduleKind.DailyRepeating,
					weekdays: [ScheduleWeekday.Monday],
					timespan: {
						startHour: 22,
						startMinute: 0,
						durationHour: 6,
						durationMinute: 0,
					},
				}),
			).rejects.toThrow("midnight");
		},
	},
);

integrationTest(
	"setSchedule converts year day schedules to 2-digit years and back",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const schedule = {
				kind: ScheduleKind.YearDay as const,
				startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
				stopDate: {
					year: 2026,
					month: 7,
					day: 15,
					hour: 18,
					minute: 30,
				},
			};
			const result = await node.scheduling!.setSchedule(
				user1,
				1,
				schedule,
			);
			t.expect(result).toBe(SetScheduleResult.OK);

			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						1,
						1,
						ScheduleEntryLockScheduleKind.YearDay,
					),
				),
			).toMatchObject({ startYear: 26, stopYear: 26 });

			const readBack = await node.scheduling!.getSchedule(
				user1,
				ScheduleKind.YearDay,
				1,
			);
			t.expect(readBack).toMatchObject(schedule);

			// With the schedule kind known, the active state can be computed
			t.expect(
				node.scheduling!.isScheduleActiveCached(
					user1,
					new Date(2026, 6, 10, 12, 0),
				),
			).toBe(true);
			// While slot 2 is unqueried, it could contain an active schedule
			t.expect(
				node.scheduling!.isScheduleActiveCached(
					user1,
					new Date(2026, 6, 20, 12, 0),
				),
			).toBeUndefined();
			// Once all slots are known, the result is definitive
			await node.scheduling!.getSchedule(user1, ScheduleKind.YearDay, 2);
			t.expect(
				node.scheduling!.isScheduleActiveCached(
					user1,
					new Date(2026, 6, 20, 12, 0),
				),
			).toBe(false);
		},
	},
);

integrationTest(
	"setSchedule rejects a schedule kind conflicting with existing schedules",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

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

			await t.expect(
				node.scheduling!.setSchedule(user1, 1, {
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
				}),
			).rejects.toThrow("one schedule kind");

			// Other users are not affected
			const result = await node.scheduling!.setSchedule(user2, 1, {
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
			t.expect(result).toBe(SetScheduleResult.OK);
		},
	},
);

// =============================================================================
// Deleting schedules
// =============================================================================

integrationTest(
	"deleteSchedule erases the slot and emits schedule deleted",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

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
						1,
						1,
						ScheduleEntryLockScheduleKind.DailyRepeating,
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
	"deleteSchedule does not emit events for a slot that is known to be empty",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Querying the slot caches it as empty
			await node.scheduling!.getSchedule(
				user1,
				ScheduleKind.DailyRepeating,
				1,
			);

			let eventEmitted = false;
			node.on("schedule deleted", () => {
				eventEmitted = true;
			});

			const result = await node.scheduling!.deleteSchedule(
				user1,
				ScheduleKind.DailyRepeating,
				1,
			);
			t.expect(result).toBe(SetScheduleResult.OK);
			t.expect(eventEmitted).toBe(false);
		},
	},
);

integrationTest(
	"deleteSchedules erases all schedules of a target across all pools",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 2,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 2,
				}),
			],
		},

		// Simulate schedules from another controller in the week day pool
		customSetup: async (driver, controller, mockNode) => {
			mockNode.state.set(
				mockScheduleStateKey(
					1,
					1,
					ScheduleEntryLockScheduleKind.WeekDay,
				),
				{
					weekday: ScheduleWeekday.Monday,
					startHour: 9,
					startMinute: 0,
					stopHour: 17,
					stopMinute: 0,
				},
			);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
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

			const result = await node.scheduling!.deleteSchedules({
				target: user1,
			});
			t.expect(result).toBe(SetScheduleResult.OK);

			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						1,
						1,
						ScheduleEntryLockScheduleKind.WeekDay,
					),
				),
			).toBeUndefined();

			// Schedules of other users are not affected
			t.expect(
				mockNode.state.get(
					mockScheduleStateKey(
						2,
						1,
						ScheduleEntryLockScheduleKind.DailyRepeating,
					),
				),
			).toBeDefined();
		},
	},
);

// =============================================================================
// Reading schedules
// =============================================================================

integrationTest(
	"getSchedules discovers schedules programmed by other controllers and refreshes the kind cache",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 2,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 2,
				}),
			],
		},

		// The device has a week day schedule Z-Wave JS knows nothing about
		customSetup: async (driver, controller, mockNode) => {
			mockNode.state.set(
				mockScheduleStateKey(
					2,
					1,
					ScheduleEntryLockScheduleKind.WeekDay,
				),
				{
					weekday: ScheduleWeekday.Monday,
					startHour: 9,
					startMinute: 0,
					stopHour: 17,
					stopMinute: 30,
				},
			);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const schedules = await node.scheduling!.getSchedules(user2);
			t.expect(schedules).toStrictEqual([
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

			// Finding schedules in a single pool reveals the user's kind
			t.expect(
				node.valueDB.getValue(
					ScheduleEntryLockCCValues.scheduleKind(2).id,
				),
			).toBe(ScheduleEntryLockScheduleKind.WeekDay);
		},
	},
);

// =============================================================================
// Enabling and disabling schedules
// =============================================================================

integrationTest(
	"setEnabled emits schedule enabled changed",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Setting a schedule enables scheduling for the user
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
		},
	},
);

integrationTest(
	"setEnabled without a target affects all targets",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 3,
				}),
				ccCaps({
					ccId: CommandClasses["Schedule Entry Lock"],
					version: 3,
					numWeekDaySlots: 0,
					numYearDaySlots: 2,
					numDailyRepeatingSlots: 3,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const enabledEvent = createDeferredPromise<unknown>();
			node.on(
				"schedule enabled changed",
				(_endpoint, args) => enabledEvent.resolve(args),
			);

			const result = await node.scheduling!.setEnabled(true);
			t.expect(result).toBe(SetScheduleResult.OK);
			t.expect(await enabledEvent).toStrictEqual({
				target: undefined,
				enabled: true,
			});

			// The cached enabled state is updated for every user
			for (let userId = 1; userId <= 3; userId++) {
				t.expect(
					node.scheduling!.getEnabledCached({
						type: ScheduleTargetType.User,
						userId,
					}),
				).toBe(true);
			}
		},
	},
);
