# Thermostat Operating State CC

?> CommandClass ID: `0x42`

## Thermostat Operating State CC methods

### `get`

```ts
async get(): Promise<MaybeNotKnown<ThermostatOperatingState>>;
```

### `getSupportedLoggingTypes`

```ts
async getSupportedLoggingTypes(): Promise<
	MaybeNotKnown<readonly ThermostatOperatingState[]>
>;
```

### `getLogging`

```ts
async getLogging(
	states: ThermostatOperatingState[],
): Promise<
	MaybeNotKnown<
		ReadonlyMap<
			ThermostatOperatingState,
			ThermostatOperatingStateLoggingData
		>
	>
>;
```
