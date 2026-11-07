# Meter Table Monitor CC

?> CommandClass ID: `0x3d`

## Meter Table Monitor CC methods

### `getTablePointAdmNumber`

```ts
async getTablePointAdmNumber(): Promise<MaybeNotKnown<string>>;
```

### `getTableId`

```ts
async getTableId(): Promise<MaybeNotKnown<string>>;
```

### `getCapabilities`

```ts
async getCapabilities(): Promise<
	MaybeNotKnown<{
		meterType: number;
		payMeter: MeterTablePayMeter;
		rateType: MeterTableRateType;
		supportedDatasets: number;
		supportedHistoryData: number;
		supportedHistoryDatasets: number;
	}>
>;
```

### `getCurrentData`

```ts
async getCurrentData(
	datasets: number,
): Promise<MaybeNotKnown<readonly MeterTableReading[]>>;
```

Requests the current values of the given datasets (a bit mask). Each
reading has the scale of the meter type and the rate type it is
stored under. Readings that can't be assigned a rate type are left out.

## Meter Table Monitor CC values

### `meterId`

```ts
{
	commandClass: CommandClasses["Meter Table Monitor"],
	endpoint: number,
	property: "meterId",
}
```

- **label:** Meter ID
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"string"`

### `pointAdmNumber`

```ts
{
	commandClass: CommandClasses["Meter Table Monitor"],
	endpoint: number,
	property: "pointAdmNumber",
}
```

- **label:** Meter point administration number
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"string"`

### `value(meterType: number, rateType: MeterTableRateType, dataset: number)`

```ts
{
	commandClass: CommandClasses["Meter Table Monitor"],
	endpoint: number,
	property: "value",
	propertyKey: number,
}
```

- **label:** `Dataset ${number}`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`

## Related types

### `MeterTablePayMeter`

```ts
enum MeterTablePayMeter {
	"Credit meter" = 0x01,
	"Prepayment meter" = 0x02,
	"Prepayment meter debt" = 0x03,
}
```

### `MeterTableRateType`

```ts
enum MeterTableRateType {
	Unspecified = 0x00,
	Import = 0x01,
	Export = 0x02,
	/** Only in the capability report: the meter measures both directions */
	"Import and export" = 0x03,
}
```

### `MeterTableReading`

```ts
interface MeterTableReading {
	/** Bit number of the dataset this value belongs to */
	dataset: number;
	/**
	 * The rate type of the report this value came in. A meter that measures
	 * both directions can send import and export in one chain of reports.
	 */
	rateType: MeterTableRateType;
	scale: MeterTableScale;
	value: number;
}
```

### `MeterTableScale`

```ts
interface MeterTableScale {
	key: number;
	unit?: string;
	label: string;
}
```
