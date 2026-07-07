# Schedule Entry Lock CC

?> CommandClass ID: `0x4e`

## Schedule Entry Lock CC methods

### `setEnabled`

```ts
async setEnabled(
	enabled: boolean,
	userId?: number,
): Promise<SupervisionResult | undefined>;
```

Enables or disables schedules. If a user ID is given, that user's
schedules will be enabled or disabled. If no user ID is given, all schedules
will be affected.

### `getNumSlots`

```ts
async getNumSlots(): Promise<
	{
		numDailyRepeatingSlots?: number;
		numWeekDaySlots: number;
		numYearDaySlots: number;
	} | undefined
>;
```

### `setWeekDaySchedule`

```ts
async setWeekDaySchedule(
	slot: ScheduleEntryLockSlotId,
	schedule?: ScheduleEntryLockWeekDaySchedule,
): Promise<SupervisionResult | undefined>;
```

### `getWeekDaySchedule`

```ts
async getWeekDaySchedule(
	slot: ScheduleEntryLockSlotId,
): Promise<MaybeNotKnown<ScheduleEntryLockWeekDaySchedule>>;
```

### `setYearDaySchedule`

```ts
async setYearDaySchedule(
	slot: ScheduleEntryLockSlotId,
	schedule?: ScheduleEntryLockYearDaySchedule,
): Promise<SupervisionResult | undefined>;
```

### `getYearDaySchedule`

```ts
async getYearDaySchedule(
	slot: ScheduleEntryLockSlotId,
): Promise<MaybeNotKnown<ScheduleEntryLockYearDaySchedule>>;
```

### `setDailyRepeatingSchedule`

```ts
async setDailyRepeatingSchedule(
	slot: ScheduleEntryLockSlotId,
	schedule?: ScheduleEntryLockDailyRepeatingSchedule,
): Promise<SupervisionResult | undefined>;
```

### `getDailyRepeatingSchedule`

```ts
async getDailyRepeatingSchedule(
	slot: ScheduleEntryLockSlotId,
): Promise<MaybeNotKnown<ScheduleEntryLockDailyRepeatingSchedule>>;
```

### `getTimezone`

```ts
async getTimezone(): Promise<MaybeNotKnown<Timezone>>;
```

### `setTimezone`

```ts
async setTimezone(
	timezone: Timezone,
): Promise<SupervisionResult | undefined>;
```

## Related types

### `ScheduleEntryLockDailyRepeatingSchedule`

```ts
interface ScheduleEntryLockDailyRepeatingSchedule {
	weekdays: ScheduleEntryLockWeekday[];
	startHour: number;
	startMinute: number;
	durationHour: number;
	durationMinute: number;
}
```

### `ScheduleEntryLockSlotId`

```ts
interface ScheduleEntryLockSlotId {
	userId: number;
	slotId: number;
}
```

### `ScheduleEntryLockWeekday`

```ts
enum ScheduleEntryLockWeekday {
	// Yay, consistency!
	Sunday = 0x00,
	Monday = 0x01,
	Tuesday = 0x02,
	Wednesday = 0x03,
	Thursday = 0x04,
	Friday = 0x05,
	Saturday = 0x06,
}
```

### `ScheduleEntryLockWeekDaySchedule`

```ts
interface ScheduleEntryLockWeekDaySchedule {
	weekday: ScheduleEntryLockWeekday;
	startHour: number;
	startMinute: number;
	stopHour: number;
	stopMinute: number;
}
```

### `ScheduleEntryLockYearDaySchedule`

```ts
interface ScheduleEntryLockYearDaySchedule {
	startYear: number;
	startMonth: number;
	startDay: number;
	startHour: number;
	startMinute: number;
	stopYear: number;
	stopMonth: number;
	stopDay: number;
	stopHour: number;
	stopMinute: number;
}
```

### `Timezone`

```ts
interface Timezone {
	standardOffset: number;
	dstOffset: number;
}
```
