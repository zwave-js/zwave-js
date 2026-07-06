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

## Thermostat Operating State CC values

### `operatingState`

```ts
{
	commandClass:
		CommandClasses["Thermostat Operating State"],
	endpoint: number,
	property: "state",
}
```

- **label:** Operating state
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

## Related types

### `ThermostatOperatingState`

```ts
enum ThermostatOperatingState {
	"Idle" = 0x00,
	"Heating" = 0x01,
	"Cooling" = 0x02,
	"Fan Only" = 0x03,
	"Pending Heat" = 0x04,
	"Pending Cool" = 0x05,
	"Vent/Economizer" = 0x06,
	"Aux Heating" = 0x07,
	"2nd Stage Heating" = 0x08,
	"2nd Stage Cooling" = 0x09,
	"2nd Stage Aux Heat" = 0x0a,
	"3rd Stage Aux Heat" = 0x0b,
}
```

### `ThermostatOperatingStateLoggingData`

```ts
interface ThermostatOperatingStateLoggingData {
	usageTodayHours: number;
	usageTodayMinutes: number;
	usageYesterdayHours: number;
	usageYesterdayMinutes: number;
}
```
