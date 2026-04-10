# Humidity Control Setpoint CC

?> CommandClass ID: `0x64`

## Humidity Control Setpoint CC methods

### `get`

```ts
async get(
	setpointType: HumidityControlSetpointType,
): Promise<MaybeNotKnown<HumidityControlSetpointValue>>;
```

### `set`

```ts
async set(
	setpointType: HumidityControlSetpointType,
	value: number,
	scale: number,
): Promise<SupervisionResult | undefined>;
```

### `getCapabilities`

```ts
async getCapabilities(
	setpointType: HumidityControlSetpointType,
): Promise<MaybeNotKnown<HumidityControlSetpointCapabilities>>;
```

### `getSupportedSetpointTypes`

```ts
async getSupportedSetpointTypes(): Promise<
	MaybeNotKnown<readonly HumidityControlSetpointType[]>
>;
```

### `getSupportedScales`

```ts
async getSupportedScales(
	setpointType: HumidityControlSetpointType,
): Promise<MaybeNotKnown<readonly Scale[]>>;
```
