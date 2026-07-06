# Clock CC

?> CommandClass ID: `0x81`

## Clock CC methods

### `get`

```ts
async get(): Promise<
	{
		hour: number;
		minute: number;
		weekday: Weekday;
	} | undefined
>;
```

### `set`

```ts
async set(
	hour: number,
	minute: number,
	weekday?: Weekday,
): Promise<SupervisionResult | undefined>;
```

## Related types

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
