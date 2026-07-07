import {
	type ScheduleDate,
	type ScheduleEntryLockDailyRepeatingSchedule,
	ScheduleEntryLockScheduleKind,
	type ScheduleEntryLockWeekDaySchedule,
	type ScheduleEntryLockWeekday,
	type ScheduleEntryLockYearDaySchedule,
	type ScheduleTimespan,
	ScheduleWeekday,
} from "@zwave-js/cc";
import {
	type ActiveScheduleCCAPI,
	ActiveScheduleCCValues,
} from "@zwave-js/cc/ActiveScheduleCC";
import {
	type ScheduleEntryLockCCAPI,
	ScheduleEntryLockCCValues,
} from "@zwave-js/cc/ScheduleEntryLockCC";
import { UserCodeCCValues } from "@zwave-js/cc/UserCodeCC";
import {
	CommandClasses,
	type MaybeNotKnown,
	ZWaveError,
	ZWaveErrorCodes,
	supervisedCommandSucceeded,
} from "@zwave-js/core";
import { getEnumMemberName } from "@zwave-js/shared";
import { FeatureAPI } from "./FeatureAPI.js";

/**
 * The kind of a schedule. The unified model uses the schedule kinds defined
 * by the Active Schedule CC. Week day schedules from older Schedule Entry Lock
 * versions are represented as daily repeating schedules with a single weekday.
 */
export enum ScheduleKind {
	YearDay = 0,
	DailyRepeating = 1,
}

/**
 * The type of construct a schedule is attached to. Currently only users are
 * schedulable, but the Active Schedule CC is designed to allow other target
 * types in future specification versions.
 */
export enum ScheduleTargetType {
	User = 0,
}

export interface UserScheduleTarget {
	type: ScheduleTargetType.User;
	/** The ID of the user this schedule belongs to, shared with the `accessControl` API */
	userId: number;
}

export type ScheduleTarget = UserScheduleTarget;

/** A one-time schedule that is active between two absolute points in time */
export interface YearDaySchedule {
	startDate: ScheduleDate;
	stopDate: ScheduleDate;
}

/** A recurring schedule that is active on the given weekdays during the given timespan */
export interface DailyRepeatingSchedule {
	weekdays: ScheduleWeekday[];
	timespan: ScheduleTimespan;
}

export type Schedule =
	| ({ kind: ScheduleKind.YearDay } & YearDaySchedule)
	| ({ kind: ScheduleKind.DailyRepeating } & DailyRepeatingSchedule);

export type ScheduleData = Schedule & {
	target: ScheduleTarget;
	slot: number;
};

export interface ScheduleTargetCapabilities {
	/** How many targets of this type can have schedules */
	numTargets: number;
	/** Support for one-time schedules. `undefined` if not supported. All slot counts are per target. */
	yearDay?: {
		numSlots: number;
	};
	/** Support for recurring schedules. `undefined` if not supported. All slot counts are per target. */
	dailyRepeating?: {
		numSlots: number;
		/** How many weekdays a single schedule can span. Devices where recurring schedules are backed by week day schedules only support 1. */
		maxWeekdays: number;
		/** Whether a schedule's duration may extend past midnight into the next day */
		supportsWrapAround: boolean;
	};
	/**
	 * Whether a target can have schedules of multiple kinds at the same time.
	 * When `false`, existing schedules must be deleted before setting a
	 * schedule of a different kind.
	 */
	supportsMixedKinds: boolean;
}

export interface SchedulingCapabilities {
	targets: ReadonlyMap<ScheduleTargetType, ScheduleTargetCapabilities>;
}

/** Result of a setSchedule / deleteSchedule(s) / setEnabled call */
export enum SetScheduleResult {
	OK = 0,
	Error_Unknown = 0xff,
}

export interface DeleteSchedulesOptions {
	/** Only delete schedules for this target. Takes precedence over {@link DeleteSchedulesOptions.targetType}. */
	target?: ScheduleTarget;
	/** Only delete schedules for targets of this type */
	targetType?: ScheduleTargetType;
	/** Only delete schedules of this kind. When omitted, schedules of all kinds are deleted. */
	kind?: ScheduleKind;
}

/**
 * Returns whether the given schedule is active at the given time.
 * The time is interpreted as the device's local time.
 */
export function isScheduleActive(
	schedule: Schedule,
	at: Date = new Date(),
): boolean {
	if (schedule.kind === ScheduleKind.YearDay) {
		const start = new Date(
			schedule.startDate.year,
			schedule.startDate.month - 1,
			schedule.startDate.day,
			schedule.startDate.hour,
			schedule.startDate.minute,
		);
		const stop = new Date(
			schedule.stopDate.year,
			schedule.stopDate.month - 1,
			schedule.stopDate.day,
			schedule.stopDate.hour,
			schedule.stopDate.minute,
		);
		return at >= start && at <= stop;
	} else {
		const { timespan } = schedule;
		const startMinute = timespan.startHour * 60 + timespan.startMinute;
		const durationMinutes = timespan.durationHour * 60
			+ timespan.durationMinute;
		const nowMinute = at.getHours() * 60 + at.getMinutes();
		const weekday = at.getDay() as ScheduleWeekday;

		// A window that started today
		if (
			schedule.weekdays.includes(weekday)
			&& nowMinute >= startMinute
			&& nowMinute < startMinute + durationMinutes
		) {
			return true;
		}

		// A window that started yesterday and wraps past midnight
		const yesterday = ((weekday + 6) % 7) as ScheduleWeekday;
		return schedule.weekdays.includes(yesterday)
			&& startMinute + durationMinutes > 1440
			&& nowMinute < startMinute + durationMinutes - 1440;
	}
}

function selWeekDayToDailyRepeating(
	schedule: ScheduleEntryLockWeekDaySchedule,
): DailyRepeatingSchedule {
	let durationHour = schedule.stopHour - schedule.startHour;
	let durationMinute = schedule.stopMinute - schedule.startMinute;
	if (durationMinute < 0) {
		durationMinute += 60;
		durationHour -= 1;
	}
	return {
		weekdays: [schedule.weekday as number as ScheduleWeekday],
		timespan: {
			startHour: schedule.startHour,
			startMinute: schedule.startMinute,
			durationHour,
			durationMinute,
		},
	};
}

function dailyRepeatingToSELWeekDay(
	schedule: DailyRepeatingSchedule,
): ScheduleEntryLockWeekDaySchedule {
	const { timespan } = schedule;
	let stopHour = timespan.startHour + timespan.durationHour;
	let stopMinute = timespan.startMinute + timespan.durationMinute;
	if (stopMinute >= 60) {
		stopMinute -= 60;
		stopHour += 1;
	}
	return {
		weekday: schedule.weekdays[0] as number as ScheduleEntryLockWeekday,
		startHour: timespan.startHour,
		startMinute: timespan.startMinute,
		stopHour,
		stopMinute,
	};
}

function selYearDayToUnified(
	schedule: ScheduleEntryLockYearDaySchedule,
): YearDaySchedule {
	return {
		startDate: {
			// Schedule Entry Lock uses 2-digit years
			year: schedule.startYear + 2000,
			month: schedule.startMonth,
			day: schedule.startDay,
			hour: schedule.startHour,
			minute: schedule.startMinute,
		},
		stopDate: {
			year: schedule.stopYear + 2000,
			month: schedule.stopMonth,
			day: schedule.stopDay,
			hour: schedule.stopHour,
			minute: schedule.stopMinute,
		},
	};
}

function unifiedYearDayToSEL(
	schedule: YearDaySchedule,
): ScheduleEntryLockYearDaySchedule {
	return {
		startYear: schedule.startDate.year - 2000,
		startMonth: schedule.startDate.month,
		startDay: schedule.startDate.day,
		startHour: schedule.startDate.hour,
		startMinute: schedule.startDate.minute,
		stopYear: schedule.stopDate.year - 2000,
		stopMonth: schedule.stopDate.month,
		stopDay: schedule.stopDate.day,
		stopHour: schedule.stopDate.hour,
		stopMinute: schedule.stopDate.minute,
	};
}

function scheduleEquals(a: Schedule, b: Schedule): boolean {
	if (a.kind !== b.kind) return false;
	if (a.kind === ScheduleKind.YearDay && b.kind === ScheduleKind.YearDay) {
		const date = (d: ScheduleDate) =>
			[d.year, d.month, d.day, d.hour, d.minute].join("-");
		return date(a.startDate) === date(b.startDate)
			&& date(a.stopDate) === date(b.stopDate);
	} else if (
		a.kind === ScheduleKind.DailyRepeating
		&& b.kind === ScheduleKind.DailyRepeating
	) {
		return a.timespan.startHour === b.timespan.startHour
			&& a.timespan.startMinute === b.timespan.startMinute
			&& a.timespan.durationHour === b.timespan.durationHour
			&& a.timespan.durationMinute === b.timespan.durationMinute
			&& a.weekdays.length === b.weekdays.length
			&& a.weekdays.every((day) => b.weekdays.includes(day));
	}
	return false;
}

function assertValidDate(
	date: ScheduleDate,
	which: string,
	minYear: number,
	maxYear: number,
): void {
	if (
		date.year < minYear
		|| date.year > maxYear
		|| date.month < 1
		|| date.month > 12
		|| date.day < 1
		|| date.day > 31
		|| date.hour < 0
		|| date.hour > 23
		|| date.minute < 0
		|| date.minute > 59
	) {
		throw new ZWaveError(
			`The ${which} date of the schedule is invalid`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

/** High-level API for managing schedules on supporting devices, e.g. door locks */
export class SchedulingAPI extends FeatureAPI {
	// Devices supporting both Schedule Entry Lock CC and Active Schedule CC
	// are required to migrate to the latter, so it takes precedence
	get #usesActiveScheduleCC(): boolean {
		return this.endpoint.supportsCC(CommandClasses["Active Schedule"]);
	}

	#selAPI(): ScheduleEntryLockCCAPI {
		return this.endpoint.commandClasses[
			"Schedule Entry Lock"
		] as unknown as ScheduleEntryLockCCAPI;
	}

	#ascAPI(): ActiveScheduleCCAPI {
		return this.endpoint.commandClasses[
			"Active Schedule"
		] as unknown as ActiveScheduleCCAPI;
	}

	// ==========================================================================
	// Capabilities
	// ==========================================================================

	/**
	 * Returns the scheduling capabilities of this endpoint, grouped by
	 * target type.
	 * This method uses cached information from the most recent interview.
	 */
	public getCapabilitiesCached(): SchedulingCapabilities {
		const targets = new Map<
			ScheduleTargetType,
			ScheduleTargetCapabilities
		>();

		if (this.#usesActiveScheduleCC) {
			const userCaps = this.#ascUserTargetCapabilities();
			if (userCaps) {
				const caps: ScheduleTargetCapabilities = {
					numTargets: userCaps.numSupportedTargets,
					supportsMixedKinds: true,
				};
				if (userCaps.numYearDaySlotsPerTarget > 0) {
					caps.yearDay = {
						numSlots: userCaps.numYearDaySlotsPerTarget,
					};
				}
				if (userCaps.numDailyRepeatingSlotsPerTarget > 0) {
					caps.dailyRepeating = {
						numSlots: userCaps.numDailyRepeatingSlotsPerTarget,
						maxWeekdays: 7,
						supportsWrapAround: true,
					};
				}
				targets.set(ScheduleTargetType.User, caps);
			}
		} else {
			const caps: ScheduleTargetCapabilities = {
				numTargets: this.#numUsersSEL,
				// Schedule Entry Lock users can only use one schedule kind at a time
				supportsMixedKinds: false,
			};
			if (this.#selNumSlots(ScheduleEntryLockScheduleKind.YearDay) > 0) {
				caps.yearDay = {
					numSlots: this.#selNumSlots(
						ScheduleEntryLockScheduleKind.YearDay,
					),
				};
			}
			const numDaily = this.#selNumSlots(
				ScheduleEntryLockScheduleKind.DailyRepeating,
			);
			const numWeekDay = this.#selNumSlots(
				ScheduleEntryLockScheduleKind.WeekDay,
			);
			if (numDaily > 0) {
				caps.dailyRepeating = {
					numSlots: numDaily,
					maxWeekdays: 7,
					supportsWrapAround: true,
				};
			} else if (numWeekDay > 0) {
				// Recurring schedules are backed by week day slots, which span
				// a single day each and cannot extend past midnight
				caps.dailyRepeating = {
					numSlots: numWeekDay,
					maxWeekdays: 1,
					supportsWrapAround: false,
				};
			}
			targets.set(ScheduleTargetType.User, caps);
		}

		return { targets };
	}

	// ==========================================================================
	// Writing schedules
	// ==========================================================================

	/**
	 * Creates, replaces or updates a schedule in the given slot.
	 * This communicates with the node and verifies that the change was applied.
	 *
	 * Setting a schedule automatically enables scheduling for the target.
	 */
	public async setSchedule(
		target: ScheduleTarget,
		slot: number,
		schedule: Schedule,
	): Promise<SetScheduleResult> {
		this.#assertValidTarget(target);
		this.#assertValidSchedule(schedule);

		if (this.#usesActiveScheduleCC) {
			const numSlots = schedule.kind === ScheduleKind.YearDay
				? this.#ascNumSlots(ScheduleKind.YearDay)
				: this.#ascNumSlots(ScheduleKind.DailyRepeating);
			this.#assertValidSlot(schedule.kind, slot, numSlots);

			return this.#setOrEraseScheduleASC(target, slot, schedule);
		} else {
			const selKind = schedule.kind === ScheduleKind.YearDay
				? ScheduleEntryLockScheduleKind.YearDay
				: this.#selDefaultRecurringKind;
			this.#assertValidSlot(
				schedule.kind,
				slot,
				this.#selNumSlots(selKind),
			);
			this.#assertNoKindConflictSEL(target.userId, selKind);

			return this.#setOrEraseScheduleSEL(target, selKind, slot, schedule);
		}
	}

	/**
	 * Deletes the schedule in the given slot.
	 * This communicates with the node and verifies that the change was applied.
	 */
	public async deleteSchedule(
		target: ScheduleTarget,
		kind: ScheduleKind,
		slot: number,
	): Promise<SetScheduleResult> {
		this.#assertValidTarget(target);

		if (this.#usesActiveScheduleCC) {
			this.#assertValidSlot(kind, slot, this.#ascNumSlots(kind));
			return this.#eraseScheduleASC(target, kind, slot);
		} else {
			const selKind = kind === ScheduleKind.YearDay
				? ScheduleEntryLockScheduleKind.YearDay
				: this.#selRecurringKindForUser(target.userId);
			this.#assertValidSlot(kind, slot, this.#selNumSlots(selKind));

			return this.#setOrEraseScheduleSEL(
				target,
				selKind,
				slot,
				undefined,
			);
		}
	}

	/**
	 * Deletes multiple schedules matching the given filters at once. When no
	 * filters are given, ALL schedules on this endpoint are deleted.
	 *
	 * On devices using the Active Schedule CC this uses a single command per
	 * schedule kind. Devices using the Schedule Entry Lock CC require erasing
	 * each slot individually, which can take a long time when not limited to
	 * a single target.
	 */
	public async deleteSchedules(
		options: DeleteSchedulesOptions = {},
	): Promise<SetScheduleResult> {
		const { target, targetType, kind } = options;
		if (target) {
			this.#assertValidTarget(target);
		} else if (
			targetType != undefined
			&& targetType !== ScheduleTargetType.User
		) {
			throw new ZWaveError(
				`Scheduling for ${
					getEnumMemberName(ScheduleTargetType, targetType)
				} targets is not supported by this node`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		const kinds = kind != undefined
			? [kind]
			: [ScheduleKind.YearDay, ScheduleKind.DailyRepeating];

		if (this.#usesActiveScheduleCC) {
			let result = SetScheduleResult.OK;
			for (const k of kinds) {
				if (this.#ascNumSlots(k) === 0) continue;
				const kindResult = await this.#batchEraseASC(target, k);
				if (kindResult !== SetScheduleResult.OK) result = kindResult;
			}
			return result;
		}

		const userIds = target
			? [target.userId]
			: Array.from({ length: this.#numUsersSEL }, (_, i) => i + 1);

		// Both week day and daily repeating pools back the unified daily
		// repeating kind, so wipe them both
		const selKinds: ScheduleEntryLockScheduleKind[] = [];
		if (kinds.includes(ScheduleKind.YearDay)) {
			selKinds.push(ScheduleEntryLockScheduleKind.YearDay);
		}
		if (kinds.includes(ScheduleKind.DailyRepeating)) {
			selKinds.push(
				ScheduleEntryLockScheduleKind.WeekDay,
				ScheduleEntryLockScheduleKind.DailyRepeating,
			);
		}

		let result = SetScheduleResult.OK;
		for (const userId of userIds) {
			const userTarget: ScheduleTarget = {
				type: ScheduleTargetType.User,
				userId,
			};
			for (const selKind of selKinds) {
				const numSlots = this.#selNumSlots(selKind);
				for (let slot = 1; slot <= numSlots; slot++) {
					// Skip slots that are known to be empty
					const prior = this.getValue(
						ScheduleEntryLockCCValues.schedule(
							selKind,
							userId,
							slot,
						).endpoint(this.endpoint.index),
					);
					if (prior === false) continue;

					const slotResult = await this.#setOrEraseScheduleSEL(
						userTarget,
						selKind,
						slot,
						undefined,
					);
					if (slotResult !== SetScheduleResult.OK) {
						result = slotResult;
					}
				}
			}
		}
		return result;
	}

	// ==========================================================================
	// Reading schedules
	// ==========================================================================

	/**
	 * Returns the schedule in the given slot, or `undefined` if the slot is
	 * empty.
	 * This communicates with the node to retrieve fresh information.
	 */
	public async getSchedule(
		target: ScheduleTarget,
		kind: ScheduleKind,
		slot: number,
	): Promise<ScheduleData | undefined> {
		this.#assertValidTarget(target);

		if (this.#usesActiveScheduleCC) {
			this.#assertValidSlot(kind, slot, this.#ascNumSlots(kind));
			const schedule = await this.#getScheduleASC(target, kind, slot);
			if (!schedule) return undefined;
			return { target, slot, ...schedule };
		} else {
			const selKind = kind === ScheduleKind.YearDay
				? ScheduleEntryLockScheduleKind.YearDay
				: this.#selRecurringKindForUser(target.userId);
			this.#assertValidSlot(kind, slot, this.#selNumSlots(selKind));

			const schedule = await this.#getScheduleSEL(
				target.userId,
				selKind,
				slot,
			);
			if (!schedule) return undefined;

			// Discovering a schedule reveals which kind the user actually uses
			this.#setCachedSELKind(target.userId, selKind);

			return { target, slot, ...schedule };
		}
	}

	/**
	 * Returns the schedule in the given slot, or `false` if the slot is known
	 * to be empty, or `undefined` (`NOT_KNOWN`) if the slot was never queried.
	 * This method uses cached information.
	 */
	public getScheduleCached(
		target: ScheduleTarget,
		kind: ScheduleKind,
		slot: number,
	): MaybeNotKnown<ScheduleData | false> {
		let cached: MaybeNotKnown<Schedule | false>;
		if (this.#usesActiveScheduleCC) {
			cached = this.#getCachedASCSchedule(target, kind, slot);
		} else {
			const selKind = kind === ScheduleKind.YearDay
				? ScheduleEntryLockScheduleKind.YearDay
				: this.#selRecurringKindForUser(target.userId);
			cached = this.#getCachedSELSchedule(target.userId, selKind, slot);
		}
		if (cached == undefined || cached === false) return cached;
		return { target, slot, ...cached };
	}

	/**
	 * Returns all schedules configured for the given target by scanning all
	 * supported schedule slots. This also detects schedules that were
	 * programmed by other controllers.
	 * This communicates with the node and can take a while on devices with
	 * many schedule slots.
	 */
	public async getSchedules(
		target: ScheduleTarget,
	): Promise<ScheduleData[]> {
		this.#assertValidTarget(target);

		const ret: ScheduleData[] = [];

		if (this.#usesActiveScheduleCC) {
			for (
				const kind of [
					ScheduleKind.YearDay,
					ScheduleKind.DailyRepeating,
				]
			) {
				const numSlots = this.#ascNumSlots(kind);
				for (let slot = 1; slot <= numSlots; slot++) {
					const schedule = await this.#getScheduleASC(
						target,
						kind,
						slot,
					);
					if (!schedule) continue;
					ret.push({ target, slot, ...schedule });
				}
			}
			return ret;
		}

		const kindsWithSchedules: ScheduleEntryLockScheduleKind[] = [];
		for (
			const selKind of [
				ScheduleEntryLockScheduleKind.WeekDay,
				ScheduleEntryLockScheduleKind.YearDay,
				ScheduleEntryLockScheduleKind.DailyRepeating,
			]
		) {
			const numSlots = this.#selNumSlots(selKind);
			let found = false;
			for (let slot = 1; slot <= numSlots; slot++) {
				const schedule = await this.#getScheduleSEL(
					target.userId,
					selKind,
					slot,
				);
				if (!schedule) continue;
				found = true;
				ret.push({ target, slot, ...schedule });
			}
			if (found) kindsWithSchedules.push(selKind);
		}

		// Schedule Entry Lock users use a single schedule kind at a time, so
		// finding schedules in exactly one pool reveals the user's active kind
		if (kindsWithSchedules.length === 1) {
			this.#setCachedSELKind(target.userId, kindsWithSchedules[0]);
		}

		return ret;
	}

	/**
	 * Returns all cached schedules, optionally filtered to a single target.
	 * This method uses cached information and only includes slots that are
	 * known to be occupied.
	 */
	public getSchedulesCached(target?: ScheduleTarget): ScheduleData[] {
		const numTargets = this.getCapabilitiesCached().targets.get(
			ScheduleTargetType.User,
		)?.numTargets ?? 0;
		const userIds = target
			? [target.userId]
			: Array.from({ length: numTargets }, (_, i) => i + 1);

		const ret: ScheduleData[] = [];
		for (const userId of userIds) {
			const userTarget: ScheduleTarget = {
				type: ScheduleTargetType.User,
				userId,
			};
			if (this.#usesActiveScheduleCC) {
				for (
					const kind of [
						ScheduleKind.YearDay,
						ScheduleKind.DailyRepeating,
					]
				) {
					const numSlots = this.#ascNumSlots(kind);
					for (let slot = 1; slot <= numSlots; slot++) {
						const cached = this.#getCachedASCSchedule(
							userTarget,
							kind,
							slot,
						);
						if (!cached) continue;
						ret.push({ target: userTarget, slot, ...cached });
					}
				}
			} else {
				for (
					const selKind of [
						ScheduleEntryLockScheduleKind.WeekDay,
						ScheduleEntryLockScheduleKind.YearDay,
						ScheduleEntryLockScheduleKind.DailyRepeating,
					]
				) {
					const numSlots = this.#selNumSlots(selKind);
					for (let slot = 1; slot <= numSlots; slot++) {
						const cached = this.#getCachedSELSchedule(
							userId,
							selKind,
							slot,
						);
						if (!cached) continue;
						ret.push({ target: userTarget, slot, ...cached });
					}
				}
			}
		}
		return ret;
	}

	// ==========================================================================
	// Enabling and disabling schedules
	// ==========================================================================

	/**
	 * Enables or disables all schedules for the given target, or for all
	 * targets if none is given.
	 *
	 * While schedules are disabled, the device grants the target permanent
	 * access.
	 */
	public async setEnabled(
		enabled: boolean,
		target?: ScheduleTarget,
	): Promise<SetScheduleResult> {
		if (target) this.#assertValidTarget(target);

		const enabledBefore = target
			? this.getEnabledCached(target)
			: undefined;

		let succeeded: boolean;
		if (this.#usesActiveScheduleCC) {
			const api = this.#ascAPI();
			if (target) {
				const result = await api.setEnabled(
					this.#ascTarget(target),
					enabled,
				);
				succeeded = result == undefined
					|| supervisedCommandSucceeded(result);
			} else {
				// The Active Schedule CC has no "all targets" command, so
				// iterate all users
				succeeded = true;
				const numTargets = this.#ascUserTargetCapabilities()
					?.numSupportedTargets ?? 0;
				for (let userId = 1; userId <= numTargets; userId++) {
					const result = await api.setEnabled(
						{
							targetCC: CommandClasses["User Credential"],
							targetId: userId,
						},
						enabled,
					);
					if (
						result != undefined
						&& !supervisedCommandSucceeded(result)
					) {
						succeeded = false;
					}
				}
			}
		} else {
			const api = this.#selAPI();
			const result = await api.setEnabled(enabled, target?.userId);
			// The enabled state cannot be queried, so assume success unless
			// supervision reported a failure
			succeeded = result == undefined
				|| supervisedCommandSucceeded(result);
		}

		if (succeeded && enabledBefore !== enabled) {
			this.endpoint.tryGetNode()?.emit(
				"schedule enabled changed",
				this.endpoint as any,
				{ target, enabled },
			);
		}

		return succeeded
			? SetScheduleResult.OK
			: SetScheduleResult.Error_Unknown;
	}

	/**
	 * Returns whether scheduling is enabled for the given target.
	 *
	 * On devices using the Active Schedule CC, this communicates with the
	 * node. The Schedule Entry Lock CC provides no way to query this, so this
	 * returns the same cached information as
	 * {@link SchedulingAPI.getEnabledCached} there.
	 */
	public async getEnabled(
		target: ScheduleTarget,
	): Promise<MaybeNotKnown<boolean>> {
		this.#assertValidTarget(target);
		if (this.#usesActiveScheduleCC) {
			return this.#ascAPI().getEnabled(this.#ascTarget(target));
		}
		return this.getEnabledCached(target);
	}

	/**
	 * Returns whether scheduling is enabled for the given target.
	 * This method uses cached information, which on Schedule Entry Lock
	 * devices may be wrong for schedules that were programmed by other
	 * controllers.
	 */
	public getEnabledCached(
		target: ScheduleTarget,
	): MaybeNotKnown<boolean> {
		if (this.#usesActiveScheduleCC) {
			return this.getValue<boolean>(
				ActiveScheduleCCValues.enabled(
					CommandClasses["User Credential"],
					target.userId,
				).endpoint(this.endpoint.index),
			);
		}
		return this.getValue<boolean>(
			ScheduleEntryLockCCValues.userEnabled(target.userId).endpoint(
				this.endpoint.index,
			),
		);
	}

	/**
	 * Returns whether at least one of the target's schedules is active at the
	 * given time, following the evaluation rules of the User Credential CC:
	 * per-kind schedules are combined with OR, the kinds themselves with AND.
	 *
	 * Returns `NOT_KNOWN` when the cached information does not allow a
	 * definitive answer, e.g. when not all slots have been queried yet.
	 *
	 * Note that while scheduling is disabled for the target, the device
	 * grants permanent access regardless of this result.
	 */
	public isScheduleActiveCached(
		target: ScheduleTarget,
		at: Date = new Date(),
	): MaybeNotKnown<boolean> {
		interface KindState {
			hasKnownSchedules: boolean;
			active: boolean;
			hasUnknownSlots: boolean;
		}

		let states: KindState[];
		if (this.#usesActiveScheduleCC) {
			states = [ScheduleKind.YearDay, ScheduleKind.DailyRepeating].map(
				(kind) => {
					const state: KindState = {
						hasKnownSchedules: false,
						active: false,
						hasUnknownSlots: false,
					};
					const numSlots = this.#ascNumSlots(kind);
					for (let slot = 1; slot <= numSlots; slot++) {
						const cached = this.#getCachedASCSchedule(
							target,
							kind,
							slot,
						);
						if (cached == undefined) {
							state.hasUnknownSlots = true;
						} else if (cached !== false) {
							state.hasKnownSchedules = true;
							if (isScheduleActive(cached, at)) {
								state.active = true;
							}
						}
					}
					return state;
				},
			);
		} else {
			// Both recurring pools contribute to the unified daily repeating
			// kind
			let kindPools: ScheduleEntryLockScheduleKind[][] = [
				[ScheduleEntryLockScheduleKind.YearDay],
				[
					ScheduleEntryLockScheduleKind.WeekDay,
					ScheduleEntryLockScheduleKind.DailyRepeating,
				],
			];

			// Users can only use one schedule kind at a time, so when the
			// kind is known, unqueried slots of other kinds cannot contain
			// schedules
			const cachedKind = this.#getCachedSELKind(target.userId);
			if (cachedKind != undefined) {
				kindPools = kindPools
					.map((pools) => pools.filter((p) => p === cachedKind))
					.filter((pools) => pools.length > 0);
			}

			states = kindPools.map((pools) => {
				const state: KindState = {
					hasKnownSchedules: false,
					active: false,
					hasUnknownSlots: false,
				};
				for (const selKind of pools) {
					const numSlots = this.#selNumSlots(selKind);
					for (let slot = 1; slot <= numSlots; slot++) {
						const cached = this.#getCachedSELSchedule(
							target.userId,
							selKind,
							slot,
						);
						if (cached == undefined) {
							state.hasUnknownSlots = true;
						} else if (cached !== false) {
							state.hasKnownSchedules = true;
							if (isScheduleActive(cached, at)) {
								state.active = true;
							}
						}
					}
				}
				return state;
			});
		}

		const attached = states.filter((s) => s.hasKnownSchedules);
		const maybeAttached = states.filter(
			(s) => !s.hasKnownSchedules && s.hasUnknownSlots,
		);

		if (attached.length === 0) {
			// A target without any schedules is considered inactive
			if (maybeAttached.length === 0) return false;
			return undefined;
		}

		for (const state of attached) {
			if (state.active) continue;
			// Unqueried slots of this kind could contain an active schedule
			if (state.hasUnknownSlots) return undefined;
			return false;
		}

		// All kinds known to have schedules are active, but another kind might
		// be attached through unqueried slots and render the AND inactive
		if (maybeAttached.length > 0) return undefined;
		return true;
	}

	// ==========================================================================
	// Active Schedule CC backend
	// ==========================================================================

	#ascTarget(target: ScheduleTarget): {
		targetCC: CommandClasses;
		targetId: number;
	} {
		return {
			targetCC: CommandClasses["User Credential"],
			targetId: target.userId,
		};
	}

	#ascUserTargetCapabilities():
		| {
			numSupportedTargets: number;
			numYearDaySlotsPerTarget: number;
			numDailyRepeatingSlotsPerTarget: number;
		}
		| undefined
	{
		return this.getValue(
			ActiveScheduleCCValues.targetCapabilities(
				CommandClasses["User Credential"],
			).endpoint(this.endpoint.index),
		);
	}

	#ascNumSlots(kind: ScheduleKind): number {
		const caps = this.#ascUserTargetCapabilities();
		if (!caps) return 0;
		return kind === ScheduleKind.YearDay
			? caps.numYearDaySlotsPerTarget
			: caps.numDailyRepeatingSlotsPerTarget;
	}

	#getCachedASCSchedule(
		target: ScheduleTarget,
		kind: ScheduleKind,
		slot: number,
	): MaybeNotKnown<Schedule | false> {
		const { targetCC, targetId } = this.#ascTarget(target);
		if (kind === ScheduleKind.YearDay) {
			const cached = this.getValue<YearDaySchedule | false>(
				ActiveScheduleCCValues.yearDaySchedule(
					targetCC,
					targetId,
					slot,
				).endpoint(this.endpoint.index),
			);
			if (cached == undefined || cached === false) return cached;
			return {
				kind: ScheduleKind.YearDay,
				startDate: cached.startDate,
				stopDate: cached.stopDate,
			};
		} else {
			const cached = this.getValue<DailyRepeatingSchedule | false>(
				ActiveScheduleCCValues.dailyRepeatingSchedule(
					targetCC,
					targetId,
					slot,
				).endpoint(this.endpoint.index),
			);
			if (cached == undefined || cached === false) return cached;
			return {
				kind: ScheduleKind.DailyRepeating,
				weekdays: cached.weekdays,
				timespan: cached.timespan,
			};
		}
	}

	async #getScheduleASC(
		target: ScheduleTarget,
		kind: ScheduleKind,
		slot: number,
	): Promise<Schedule | undefined> {
		const api = this.#ascAPI();
		const slotId = { ...this.#ascTarget(target), slotId: slot };

		if (kind === ScheduleKind.YearDay) {
			const result = await api.getYearDaySchedule(slotId);
			if (!result) return undefined;
			return {
				kind: ScheduleKind.YearDay,
				startDate: result.startDate,
				stopDate: result.stopDate,
			};
		} else {
			const result = await api.getDailyRepeatingSchedule(slotId);
			if (!result) return undefined;
			return {
				kind: ScheduleKind.DailyRepeating,
				weekdays: result.weekdays,
				timespan: result.timespan,
			};
		}
	}

	async #setOrEraseScheduleASC(
		target: ScheduleTarget,
		slot: number,
		schedule: Schedule,
	): Promise<SetScheduleResult> {
		const api = this.#ascAPI();
		const slotId = { ...this.#ascTarget(target), slotId: slot };

		// Capture the prior state before the CC API updates the cache
		const prior = this.#getCachedASCSchedule(target, schedule.kind, slot);
		const enabledBefore = this.getEnabledCached(target);

		let result;
		if (schedule.kind === ScheduleKind.YearDay) {
			result = await api.setYearDaySchedule(slotId, {
				startDate: schedule.startDate,
				stopDate: schedule.stopDate,
			});
		} else {
			result = await api.setDailyRepeatingSchedule(slotId, {
				weekdays: schedule.weekdays,
				timespan: schedule.timespan,
			});
		}

		let succeeded: boolean;
		if (result != undefined && supervisedCommandSucceeded(result)) {
			succeeded = true;
		} else {
			// Unsupervised, or the device reported failure.
			// Read the slot back to determine the actual state. This also
			// corrects the optimistically updated cache.
			const verified = await this.#getScheduleASC(
				target,
				schedule.kind,
				slot,
			);
			succeeded = verified != undefined
				&& scheduleEquals(schedule, verified);
		}

		if (succeeded) {
			// Setting a schedule automatically enables scheduling for the
			// target (CC:00A4.01.06.11.001)
			const { targetCC, targetId } = this.#ascTarget(target);
			this.endpoint.tryGetNode()?.valueDB.setValue(
				ActiveScheduleCCValues.enabled(targetCC, targetId)
					.endpoint(this.endpoint.index),
				true,
			);

			const node = this.endpoint.tryGetNode();
			if (node) {
				const data: ScheduleData = { target, slot, ...schedule };
				node.emit(
					prior ? "schedule modified" : "schedule added",
					this.endpoint as any,
					data,
				);
				if (enabledBefore !== true) {
					node.emit(
						"schedule enabled changed",
						this.endpoint as any,
						{ target, enabled: true },
					);
				}
			}
		}

		return succeeded
			? SetScheduleResult.OK
			: SetScheduleResult.Error_Unknown;
	}

	async #eraseScheduleASC(
		target: ScheduleTarget,
		kind: ScheduleKind,
		slot: number,
	): Promise<SetScheduleResult> {
		const api = this.#ascAPI();
		const slotId = { ...this.#ascTarget(target), slotId: slot };

		const prior = this.#getCachedASCSchedule(target, kind, slot);

		const result = kind === ScheduleKind.YearDay
			? await api.setYearDaySchedule(slotId)
			: await api.setDailyRepeatingSchedule(slotId);

		let succeeded: boolean;
		if (result != undefined && supervisedCommandSucceeded(result)) {
			succeeded = true;
		} else {
			const verified = await this.#getScheduleASC(target, kind, slot);
			succeeded = verified == undefined;
		}

		if (succeeded && prior) {
			this.endpoint.tryGetNode()?.emit(
				"schedule deleted",
				this.endpoint as any,
				{ target, kind, slot },
			);
		}

		return succeeded
			? SetScheduleResult.OK
			: SetScheduleResult.Error_Unknown;
	}

	/**
	 * Erases all schedules of a kind for one or all targets using the
	 * Active Schedule CC's batch erase (slot ID 0)
	 */
	async #batchEraseASC(
		target: ScheduleTarget | undefined,
		kind: ScheduleKind,
	): Promise<SetScheduleResult> {
		const api = this.#ascAPI();
		const targetCC = CommandClasses["User Credential"];
		// Target ID 0 erases the schedules of all targets of the CC
		const targetId = target?.userId ?? 0;
		const slotId = { targetCC, targetId, slotId: 0 };

		// Capture the occupied slots before the CC API marks them as erased
		const numTargets = this.#ascUserTargetCapabilities()
			?.numSupportedTargets ?? 0;
		const userIds = target
			? [target.userId]
			: Array.from({ length: numTargets }, (_, i) => i + 1);
		const numSlots = this.#ascNumSlots(kind);
		const occupied: { target: ScheduleTarget; slot: number }[] = [];
		for (const userId of userIds) {
			const userTarget: ScheduleTarget = {
				type: ScheduleTargetType.User,
				userId,
			};
			for (let slot = 1; slot <= numSlots; slot++) {
				if (this.#getCachedASCSchedule(userTarget, kind, slot)) {
					occupied.push({ target: userTarget, slot });
				}
			}
		}

		const result = kind === ScheduleKind.YearDay
			? await api.setYearDaySchedule(slotId)
			: await api.setDailyRepeatingSchedule(slotId);

		const succeeded = result == undefined
			|| supervisedCommandSucceeded(result);
		if (!succeeded) return SetScheduleResult.Error_Unknown;

		const node = this.endpoint.tryGetNode();
		for (const { target: userTarget, slot } of occupied) {
			node?.emit("schedule deleted", this.endpoint as any, {
				target: userTarget,
				kind,
				slot,
			});
		}

		return SetScheduleResult.OK;
	}

	// ==========================================================================
	// Schedule Entry Lock backend
	// ==========================================================================

	get #numUsersSEL(): number {
		return this.getValue<number>(
			UserCodeCCValues.supportedUsers.endpoint(this.endpoint.index),
		) ?? 0;
	}

	/** The Schedule Entry Lock schedule kind that backs unified daily repeating schedules on this endpoint */
	get #selDefaultRecurringKind(): ScheduleEntryLockScheduleKind {
		return this.#selNumSlots(ScheduleEntryLockScheduleKind.DailyRepeating)
				> 0
			? ScheduleEntryLockScheduleKind.DailyRepeating
			: ScheduleEntryLockScheduleKind.WeekDay;
	}

	#getCachedSELKind(
		userId: number,
	): MaybeNotKnown<ScheduleEntryLockScheduleKind> {
		return this.getValue<ScheduleEntryLockScheduleKind>(
			ScheduleEntryLockCCValues.scheduleKind(userId).endpoint(
				this.endpoint.index,
			),
		);
	}

	#setCachedSELKind(
		userId: number,
		kind: ScheduleEntryLockScheduleKind,
	): void {
		this.endpoint.tryGetNode()?.valueDB.setValue(
			ScheduleEntryLockCCValues.scheduleKind(userId).endpoint(
				this.endpoint.index,
			),
			kind,
		);
	}

	/**
	 * Returns the Schedule Entry Lock schedule kind used to read or erase a
	 * user's recurring schedules. Users with discovered week day schedules
	 * keep using that pool, everyone else uses the endpoint default.
	 */
	#selRecurringKindForUser(userId: number): ScheduleEntryLockScheduleKind {
		const cached = this.#getCachedSELKind(userId);
		if (
			cached === ScheduleEntryLockScheduleKind.WeekDay
			|| cached === ScheduleEntryLockScheduleKind.DailyRepeating
		) {
			return cached;
		}
		return this.#selDefaultRecurringKind;
	}

	#selNumSlots(kind: ScheduleEntryLockScheduleKind): number {
		switch (kind) {
			case ScheduleEntryLockScheduleKind.WeekDay:
				return this.getValue<number>(
					ScheduleEntryLockCCValues.numWeekDaySlots.endpoint(
						this.endpoint.index,
					),
				) ?? 0;
			case ScheduleEntryLockScheduleKind.YearDay:
				return this.getValue<number>(
					ScheduleEntryLockCCValues.numYearDaySlots.endpoint(
						this.endpoint.index,
					),
				) ?? 0;
			case ScheduleEntryLockScheduleKind.DailyRepeating:
				return this.getValue<number>(
					ScheduleEntryLockCCValues.numDailyRepeatingSlots.endpoint(
						this.endpoint.index,
					),
				) ?? 0;
		}
	}

	async #getScheduleSEL(
		userId: number,
		selKind: ScheduleEntryLockScheduleKind,
		slot: number,
	): Promise<Schedule | undefined> {
		const api = this.#selAPI();
		const slotId = { userId, slotId: slot };

		switch (selKind) {
			case ScheduleEntryLockScheduleKind.WeekDay: {
				const result = await api.getWeekDaySchedule(slotId);
				if (!result) return undefined;
				return {
					kind: ScheduleKind.DailyRepeating,
					...selWeekDayToDailyRepeating(result),
				};
			}
			case ScheduleEntryLockScheduleKind.YearDay: {
				const result = await api.getYearDaySchedule(slotId);
				if (!result) return undefined;
				return {
					kind: ScheduleKind.YearDay,
					...selYearDayToUnified(result),
				};
			}
			case ScheduleEntryLockScheduleKind.DailyRepeating: {
				const result = await api.getDailyRepeatingSchedule(slotId);
				if (!result) return undefined;
				return {
					kind: ScheduleKind.DailyRepeating,
					weekdays: result.weekdays as number[] as ScheduleWeekday[],
					timespan: {
						startHour: result.startHour,
						startMinute: result.startMinute,
						durationHour: result.durationHour,
						durationMinute: result.durationMinute,
					},
				};
			}
		}
	}

	#getCachedSELSchedule(
		userId: number,
		selKind: ScheduleEntryLockScheduleKind,
		slot: number,
	): MaybeNotKnown<Schedule | false> {
		const cached = this.getValue<
			| ScheduleEntryLockWeekDaySchedule
			| ScheduleEntryLockYearDaySchedule
			| ScheduleEntryLockDailyRepeatingSchedule
			| false
		>(
			ScheduleEntryLockCCValues.schedule(selKind, userId, slot)
				.endpoint(this.endpoint.index),
		);
		if (cached == undefined || cached === false) return cached;

		switch (selKind) {
			case ScheduleEntryLockScheduleKind.WeekDay:
				return {
					kind: ScheduleKind.DailyRepeating,
					...selWeekDayToDailyRepeating(
						cached as ScheduleEntryLockWeekDaySchedule,
					),
				};
			case ScheduleEntryLockScheduleKind.YearDay:
				return {
					kind: ScheduleKind.YearDay,
					...selYearDayToUnified(
						cached as ScheduleEntryLockYearDaySchedule,
					),
				};
			case ScheduleEntryLockScheduleKind.DailyRepeating: {
				const schedule =
					cached as ScheduleEntryLockDailyRepeatingSchedule;
				return {
					kind: ScheduleKind.DailyRepeating,
					weekdays: schedule
						.weekdays as number[] as ScheduleWeekday[],
					timespan: {
						startHour: schedule.startHour,
						startMinute: schedule.startMinute,
						durationHour: schedule.durationHour,
						durationMinute: schedule.durationMinute,
					},
				};
			}
		}
	}

	/** Writes or erases a single Schedule Entry Lock slot, verifies the result and emits the corresponding events */
	async #setOrEraseScheduleSEL(
		target: ScheduleTarget,
		selKind: ScheduleEntryLockScheduleKind,
		slot: number,
		schedule: Schedule | undefined,
	): Promise<SetScheduleResult> {
		const api = this.#selAPI();
		const userId = target.userId;
		const slotId = { userId, slotId: slot };

		// Capture the prior state before the CC API updates the cache
		const prior = this.#getCachedSELSchedule(userId, selKind, slot);
		const enabledBefore = this.getValue<boolean>(
			ScheduleEntryLockCCValues.userEnabled(userId).endpoint(
				this.endpoint.index,
			),
		);

		let result;
		switch (selKind) {
			case ScheduleEntryLockScheduleKind.WeekDay:
				result = await api.setWeekDaySchedule(
					slotId,
					schedule && schedule.kind === ScheduleKind.DailyRepeating
						? dailyRepeatingToSELWeekDay(schedule)
						: undefined,
				);
				break;
			case ScheduleEntryLockScheduleKind.YearDay:
				result = await api.setYearDaySchedule(
					slotId,
					schedule && schedule.kind === ScheduleKind.YearDay
						? unifiedYearDayToSEL(schedule)
						: undefined,
				);
				break;
			case ScheduleEntryLockScheduleKind.DailyRepeating:
				result = await api.setDailyRepeatingSchedule(
					slotId,
					schedule && schedule.kind === ScheduleKind.DailyRepeating
						? {
							weekdays: schedule
								.weekdays as number[] as ScheduleEntryLockWeekday[],
							startHour: schedule.timespan.startHour,
							startMinute: schedule.timespan.startMinute,
							durationHour: schedule.timespan.durationHour,
							durationMinute: schedule.timespan.durationMinute,
						}
						: undefined,
				);
				break;
		}

		let succeeded: boolean;
		if (result != undefined && supervisedCommandSucceeded(result)) {
			succeeded = true;
		} else {
			// Unsupervised, or the device reported failure.
			// Read the slot back to determine the actual state. This also
			// corrects the optimistically updated cache.
			const verified = await this.#getScheduleSEL(userId, selKind, slot);
			succeeded = schedule
				? verified != undefined && scheduleEquals(schedule, verified)
				: verified == undefined;
		}

		if (succeeded) {
			const node = this.endpoint.tryGetNode();
			if (node) {
				if (schedule) {
					const data: ScheduleData = { target, slot, ...schedule };
					node.emit(
						prior ? "schedule modified" : "schedule added",
						this.endpoint as any,
						data,
					);
					// Setting a schedule automatically enables scheduling
					// for the target
					if (enabledBefore !== true) {
						node.emit(
							"schedule enabled changed",
							this.endpoint as any,
							{ target, enabled: true },
						);
					}
				} else if (prior) {
					node.emit("schedule deleted", this.endpoint as any, {
						target,
						kind: prior.kind,
						slot,
					});
				}
			}
		}

		return succeeded
			? SetScheduleResult.OK
			: SetScheduleResult.Error_Unknown;
	}

	// ==========================================================================
	// Validation
	// ==========================================================================

	#assertValidTarget(target: ScheduleTarget): void {
		const caps = this.getCapabilitiesCached().targets.get(target.type);
		if (!caps) {
			throw new ZWaveError(
				`Scheduling for ${
					getEnumMemberName(ScheduleTargetType, target.type)
				} targets is not supported by this node`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		// Allow calling the API anyways if the node's interview failed
		if (caps.numTargets === 0) return;
		if (target.userId < 1 || target.userId > caps.numTargets) {
			throw new ZWaveError(
				`User ID ${target.userId} is out of range`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}

	#assertValidSlot(
		kind: ScheduleKind,
		slot: number,
		numSlots: number,
	): void {
		// Allow calling the API anyways if the node's interview failed
		if (numSlots === 0 && slot >= 1) return;
		if (slot < 1 || slot > numSlots) {
			throw new ZWaveError(
				`Schedule slot ${slot} is out of range for schedule kind ${
					getEnumMemberName(ScheduleKind, kind)
				}`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}

	#assertValidSchedule(schedule: Schedule): void {
		const caps = this.getCapabilitiesCached().targets.get(
			ScheduleTargetType.User,
		);

		if (schedule.kind === ScheduleKind.YearDay) {
			if (!caps?.yearDay) {
				throw new ZWaveError(
					`This node does not support year day schedules`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			// Schedule Entry Lock is limited to 2-digit years
			const maxYear = this.#usesActiveScheduleCC ? 0xffff : 2099;
			assertValidDate(schedule.startDate, "start", 2000, maxYear);
			assertValidDate(schedule.stopDate, "stop", 2000, maxYear);
			const start = new Date(
				schedule.startDate.year,
				schedule.startDate.month - 1,
				schedule.startDate.day,
				schedule.startDate.hour,
				schedule.startDate.minute,
			);
			const stop = new Date(
				schedule.stopDate.year,
				schedule.stopDate.month - 1,
				schedule.stopDate.day,
				schedule.stopDate.hour,
				schedule.stopDate.minute,
			);
			if (stop <= start) {
				throw new ZWaveError(
					`The stop of the schedule must be after the start`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
		} else {
			const recurringCaps = caps?.dailyRepeating;
			if (!recurringCaps) {
				throw new ZWaveError(
					`This node does not support daily repeating schedules`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			const { timespan } = schedule;
			if (
				timespan.startHour < 0
				|| timespan.startHour > 23
				|| timespan.startMinute < 0
				|| timespan.startMinute > 59
				|| timespan.durationHour < 0
				|| timespan.durationHour > 23
				|| timespan.durationMinute < 0
				|| timespan.durationMinute > 59
			) {
				throw new ZWaveError(
					`The start time or duration of the schedule is invalid`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			if (
				timespan.durationHour === 0 && timespan.durationMinute === 0
			) {
				throw new ZWaveError(
					`The duration of the schedule must be at least 1 minute`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			const weekdays = schedule.weekdays;
			if (
				weekdays.length < 1
				|| new Set(weekdays).size !== weekdays.length
				|| weekdays.some(
					(day) =>
						day < ScheduleWeekday.Sunday
						|| day > ScheduleWeekday.Saturday,
				)
			) {
				throw new ZWaveError(
					`The weekdays of the schedule must be a non-empty set of valid weekdays`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			if (weekdays.length > recurringCaps.maxWeekdays) {
				throw new ZWaveError(
					`This node only supports ${recurringCaps.maxWeekdays} weekday(s) per daily repeating schedule`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			if (!recurringCaps.supportsWrapAround) {
				const stopMinute = timespan.startHour * 60
					+ timespan.startMinute
					+ timespan.durationHour * 60
					+ timespan.durationMinute;
				if (stopMinute >= 24 * 60) {
					throw new ZWaveError(
						`On this node, daily repeating schedules must not extend past midnight`,
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
			}
		}
	}

	/**
	 * Asserts that writing a schedule of the given Schedule Entry Lock kind
	 * does not conflict with existing schedules of another kind, since users
	 * can only use one kind of scheduling at a time.
	 */
	#assertNoKindConflictSEL(
		userId: number,
		selKind: ScheduleEntryLockScheduleKind,
	): void {
		const cachedKind = this.#getCachedSELKind(userId);
		if (cachedKind == undefined || cachedKind === selKind) return;

		// Only known schedules of the other kind block the switch
		const numSlots = this.#selNumSlots(cachedKind);
		for (let slot = 1; slot <= numSlots; slot++) {
			if (this.#getCachedSELSchedule(userId, cachedKind, slot)) {
				throw new ZWaveError(
					`This device only supports one schedule kind per user at a time. Delete the existing schedules for user ${userId} first, e.g. using deleteSchedules().`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
		}
	}
}
