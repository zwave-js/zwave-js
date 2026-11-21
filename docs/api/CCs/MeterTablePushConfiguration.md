# Meter Table Push Configuration CC

?> CommandClass ID: `0x3e`

## Meter Table Push Configuration CC methods

### `get`

```ts
async get(): Promise<MaybeNotKnown<MeterTablePushConfiguration>>;
```

### `set`

```ts
async set(
	config: MeterTablePushConfiguration,
): Promise<SupervisionResult | undefined>;
```

## Related types

### `MeterTablePushConfiguration`

```ts
interface MeterTablePushConfiguration {
	/** Which operating status changes are pushed (0-15) */
	operatingStatusPushMode: number;
	pushStatus: boolean;
	/** Bit mask of the datasets that are pushed */
	pushDataset: number;
	intervalMonths: number;
	intervalDays: number;
	intervalHours: number;
	intervalMinutes: number;
	pushNodeId: number;
}
```
