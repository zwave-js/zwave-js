# Time CC

?> CommandClass ID: `0x8a`

## Time CC methods

### `getTime`

```ts
async getTime(): Promise<
	{
		hour: number;
		minute: number;
		second: number;
	} | undefined
>;
```

### `reportTime`

```ts
async reportTime(
	hour: number,
	minute: number,
	second: number,
): Promise<SupervisionResult | undefined>;
```

### `getDate`

```ts
async getDate(): Promise<
	{
		day: number;
		month: number;
		year: number;
	} | undefined
>;
```

### `reportDate`

```ts
async reportDate(
	year: number,
	month: number,
	day: number,
): Promise<SupervisionResult | undefined>;
```

### `setTimezone`

```ts
async setTimezone(
	timezone: DSTInfo,
): Promise<SupervisionResult | undefined>;
```

### `getTimezone`

```ts
async getTimezone(): Promise<MaybeNotKnown<DSTInfo>>;
```

### `reportTimezone`

```ts
async reportTimezone(
	timezone: DSTInfo,
): Promise<SupervisionResult | undefined>;
```

## Related types

### `DSTInfo`

```ts
interface DSTInfo {
	startDate: Date;
	endDate: Date;
	standardOffset: number;
	dstOffset: number;
}
```
