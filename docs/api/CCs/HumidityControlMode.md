# Humidity Control Mode CC

?> CommandClass ID: `0x6d`

## Humidity Control Mode CC methods

### `get`

```ts
async get(): Promise<MaybeNotKnown<HumidityControlMode>>;
```

### `set`

```ts
async set(
	mode: HumidityControlMode,
): Promise<SupervisionResult | undefined>;
```

### `getSupportedModes`

```ts
async getSupportedModes(): Promise<
	MaybeNotKnown<readonly HumidityControlMode[]>
>;
```
