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
async getOverride(): Promise<{ type: ScheduleOverrideType; state: SetbackState; } | undefined>;
```

### `setOverride`

```ts
async setOverride(
	type: ScheduleOverrideType,
	state: SetbackState,
): Promise<SupervisionResult | undefined>;
```
