# Multilevel Sensor CC

?> CommandClass ID: `0x31`

## Multilevel Sensor CC methods

### `get`

```ts
async get(): Promise<
	MaybeNotKnown<MultilevelSensorValue & { type: number }>
>;

async get(
	sensorType: number,
): Promise<MaybeNotKnown<MultilevelSensorValue>>;

async get(
	sensorType: number,
	scale: number,
): Promise<MaybeNotKnown<number>>;
```

### `getSupportedSensorTypes`

```ts
async getSupportedSensorTypes(): Promise<
	MaybeNotKnown<readonly number[]>
>;
```

### `getSupportedScales`

```ts
async getSupportedScales(
	sensorType: number,
): Promise<MaybeNotKnown<readonly number[]>>;
```

### `sendReport`

```ts
async sendReport(
	sensorType: number,
	scale: number | Scale,
	value: number,
): Promise<SupervisionResult | undefined>;
```
