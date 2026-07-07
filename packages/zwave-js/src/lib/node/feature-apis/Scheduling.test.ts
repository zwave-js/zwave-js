import { ScheduleWeekday } from "@zwave-js/cc";
import { test } from "vitest";
import { ScheduleKind, isScheduleActive } from "./Scheduling.js";

test("isScheduleActive() handles year day schedules", (t) => {
	const schedule = {
		kind: ScheduleKind.YearDay as const,
		startDate: { year: 2026, month: 7, day: 1, hour: 8, minute: 0 },
		stopDate: { year: 2026, month: 7, day: 15, hour: 18, minute: 30 },
	};

	// Within the window
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 10, 12, 0)),
	).toBe(true);
	// Exactly at the boundaries
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 1, 8, 0)),
	).toBe(true);
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 15, 18, 30)),
	).toBe(true);
	// Outside the window
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 1, 7, 59)),
	).toBe(false);
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 15, 18, 31)),
	).toBe(false);
	t.expect(
		isScheduleActive(schedule, new Date(2027, 6, 10, 12, 0)),
	).toBe(false);
});

test("isScheduleActive() handles daily repeating schedules", (t) => {
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

	// 2026-07-06 is a Monday
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 6, 12, 0)),
	).toBe(true);
	// Start is inclusive, end is exclusive
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 6, 9, 0)),
	).toBe(true);
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 6, 17, 30)),
	).toBe(false);
	// Before the window
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 6, 8, 59)),
	).toBe(false);
	// Tuesday is not included
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 7, 12, 0)),
	).toBe(false);
	// Wednesday is included
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 8, 12, 0)),
	).toBe(true);
});

test("isScheduleActive() handles daily repeating schedules that wrap past midnight", (t) => {
	const schedule = {
		kind: ScheduleKind.DailyRepeating as const,
		weekdays: [ScheduleWeekday.Friday],
		timespan: {
			startHour: 22,
			startMinute: 0,
			durationHour: 6,
			durationMinute: 0,
		},
	};

	// 2026-07-10 is a Friday
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 10, 23, 0)),
	).toBe(true);
	// Saturday morning is still part of Friday's window
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 11, 3, 59)),
	).toBe(true);
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 11, 4, 0)),
	).toBe(false);
	// Friday morning is not
	t.expect(
		isScheduleActive(schedule, new Date(2026, 6, 10, 3, 0)),
	).toBe(false);
});
