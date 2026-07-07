# Meter CC

?> CommandClass ID: `0x32`

## Meter CC methods

### `get`

```ts
async get(
	options?: {
		scale?: number;
		rateType?: RateType;
	},
): Promise<MeterReading | undefined>;
```

### `sendReport`

```ts
async sendReport(
	options: {
		type: number;
		scale: number;
		value: number;
		previousValue?: MaybeNotKnown<number>;
		rateType?: RateType;
		deltaTime?: MaybeUnknown<number>;
	},
): Promise<SupervisionResult | undefined>;
```

### `getAll`

```ts
async getAll(
	accumulatedOnly: boolean = false,
): Promise<MeterReading[]>;
```

### `getSupported`

```ts
async getSupported(): Promise<
	{
		supportedRateTypes: readonly RateType[];
		supportedScales: readonly number[];
		supportsReset: boolean;
		type: number;
	} | undefined
>;
```

### `sendSupportedReport`

```ts
async sendSupportedReport(
	options: {
		type: number;
		supportsReset: boolean;
		supportedScales: readonly number[];
		supportedRateTypes: readonly RateType[];
	},
): Promise<void>;
```

### `reset`

```ts
async reset(): Promise<SupervisionResult | undefined>;

async reset(options?: {
	type: number;
	scale: number;
	rateType: RateType;
	targetValue: number;
}): Promise<SupervisionResult | undefined>;
```

## Meter CC values

### `resetAll`

```ts
{
	commandClass: CommandClasses.Meter,
	endpoint: number,
	property: "reset",
}
```

- **label:** Reset accumulated values
- **min. CC version:** 1
- **readable:** false
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `resetSingle(meterType: number, rateType: RateType, scale: number)`

```ts
{
	commandClass: CommandClasses.Meter,
	endpoint: number,
	property: "reset",
	propertyKey: number,
}
```

- **label:** `Reset (Consumption, ${string})` | `Reset (Production, ${string})` | `Reset (${string})`
- **min. CC version:** 1
- **readable:** false
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `value(meterType: number, rateType: RateType, scale: number)`

```ts
{
	commandClass: CommandClasses.Meter,
	endpoint: number,
	property: "value",
	propertyKey: number,
}
```

- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`

## Related types

### `MeterReading`

```ts
interface MeterReading {
	rateType: RateType;
	value: number;
	previousValue: MaybeNotKnown<number>;
	deltaTime: MaybeUnknown<number>;
	type: number;
	scale: MeterScale;
}
```

### `MeterScale`

```ts
interface MeterScale {
	readonly label: string;
	readonly unit?: string;
	readonly key: number;
}
```

### `RateType`

```ts
enum RateType {
	Unspecified = 0x00,
	Consumed = 0x01,
	Produced = 0x02,
}
```
