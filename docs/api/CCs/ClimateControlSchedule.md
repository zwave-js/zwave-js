# Climate Control Schedule CC

?> CommandClass ID: `0x46`

## Climate Control Schedule CC methods

### `set`

```ts
async set(
	weekday: Weekday,
	switchPoints: Switchpoint[],
): Promise<SupervisionResult | undefined>;
```

### `get`

```ts
async get(
	weekday: Weekday,
): Promise<MaybeNotKnown<readonly Switchpoint[]>>;
```

### `getChangeCounter`

```ts
async getChangeCounter(): Promise<MaybeNotKnown<number>>;
```

### `getOverride`

```ts
async getOverride(): Promise<
	{ type: ScheduleOverrideType; state: SetbackState } | undefined
>;
```

### `setOverride`

```ts
async setOverride(
	type: ScheduleOverrideType,
	state: SetbackState,
): Promise<SupervisionResult | undefined>;
```

## Climate Control Schedule CC values

### `overrideState`

```ts
{
	commandClass: CommandClasses["Climate Control Schedule"],
	endpoint: number,
	property: "overrideState",
}
```

- **label:** Override state
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** -12.8

### `overrideType`

```ts
{
	commandClass: CommandClasses["Climate Control Schedule"],
	endpoint: number,
	property: "overrideType",
}
```

- **label:** Override type
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`

### `schedule(weekday: Weekday)`

```ts
{
	commandClass: CommandClasses["Climate Control Schedule"],
	endpoint: number,
	property: "schedule",
	propertyKey: Weekday,
}
```

- **label:** `Schedule (${string})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

## Related types

### `ScheduleOverrideType`

```ts
enum ScheduleOverrideType {
	None = 0x00,
	Temporary = 0x01,
	Permanent = 0x02,
}
```

### `SetbackSpecialState`

```ts
type SetbackSpecialState =
	| "Frost Protection"
	| "Energy Saving"
	| "Unused";
```

### `SetbackState`

```ts
type SetbackState = number | SetbackSpecialState;
```

### `Switchpoint`

```ts
interface Switchpoint {
	hour: number;
	minute: number;
	state: SetbackState | undefined;
}
```

### `Weekday`

```ts
enum Weekday {
	Unknown = 0x00,
	Monday = 0x01,
	Tuesday = 0x02,
	Wednesday = 0x03,
	Thursday = 0x04,
	Friday = 0x05,
	Saturday = 0x06,
	Sunday = 0x07,
}
```
