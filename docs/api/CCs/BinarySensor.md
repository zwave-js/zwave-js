# Binary Sensor CC

?> CommandClass ID: `0x30`

## Binary Sensor CC methods

### `get`

```ts
async get(
	sensorType?: BinarySensorType,
): Promise<MaybeNotKnown<boolean>>;
```

Retrieves the current value from this sensor.

**Parameters:**

- `sensorType`: The (optional) sensor type to retrieve the value for

### `sendReport`

```ts
async sendReport(
	value: boolean,
	sensorType?: BinarySensorType,
): Promise<SupervisionResult | undefined>;
```

### `getSupportedSensorTypes`

```ts
async getSupportedSensorTypes(): Promise<
	readonly BinarySensorType[] | undefined
>;
```

### `reportSupportedSensorTypes`

```ts
async reportSupportedSensorTypes(
	supported: BinarySensorType[],
): Promise<SupervisionResult | undefined>;
```

## Binary Sensor CC values

### `state(sensorType: BinarySensorType)`

```ts
{
	commandClass: CommandClasses["Binary Sensor"],
	endpoint: number,
	property: string,
}
```

- **label:** `Sensor state (${string})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

## Related types

### `BinarySensorType`

```ts
enum BinarySensorType {
	"General Purpose" = 0x01,
	Smoke = 0x02,
	CO = 0x03,
	CO2 = 0x04,
	Heat = 0x05,
	Water = 0x06,
	Freeze = 0x07,
	Tamper = 0x08,
	Aux = 0x09,
	"Door/Window" = 0x0a,
	Tilt = 0x0b,
	Motion = 0x0c,
	"Glass Break" = 0x0d,
	Any = 0xff,
}
```
