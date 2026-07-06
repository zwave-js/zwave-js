# Thermostat Fan State CC

?> CommandClass ID: `0x45`

## Thermostat Fan State CC methods

### `get`

```ts
async get(): Promise<ThermostatFanState | undefined>;
```

## Thermostat Fan State CC values

### `fanState`

```ts
{
	commandClass: CommandClasses["Thermostat Fan State"],
	endpoint: number,
	property: "state",
}
```

- **label:** Thermostat fan state
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

## Related types

### `ThermostatFanState`

```ts
enum ThermostatFanState {
	"Idle / off" = 0x00,
	"Running / running low" = 0x01,
	"Running high" = 0x02,
	"Running medium" = 0x03,
	"Circulation mode" = 0x04,
	"Humidity circulation mode" = 0x05,
	"Right - left circulation mode" = 0x06,
	"Up - down circulation mode" = 0x07,
	"Quiet circulation mode" = 0x08,
}
```
