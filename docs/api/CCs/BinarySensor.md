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
