# Thermostat Fan Mode CC

?> CommandClass ID: `0x44`

## Thermostat Fan Mode CC methods

### `get`

```ts
async get(): Promise<
	{
		mode: ThermostatFanMode;
		off?: boolean;
	} | undefined
>;
```

### `set`

```ts
async set(
	mode: ThermostatFanMode,
	off?: boolean,
): Promise<SupervisionResult | undefined>;
```

### `getSupportedModes`

```ts
async getSupportedModes(): Promise<
	MaybeNotKnown<readonly ThermostatFanMode[]>
>;
```

## Thermostat Fan Mode CC values

### `fanMode`

```ts
{
	commandClass: CommandClasses["Thermostat Fan Mode"],
	endpoint: number,
	property: "mode",
}
```

- **label:** Thermostat fan mode
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `turnedOff`

```ts
{
	commandClass: CommandClasses["Thermostat Fan Mode"],
	endpoint: number,
	property: "off",
}
```

- **label:** Thermostat fan turned off
- **min. CC version:** 3
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

## Related types

### `ThermostatFanMode`

```ts
enum ThermostatFanMode {
	"Auto low" = 0x00,
	"Low" = 0x01,
	"Auto high" = 0x02,
	"High" = 0x03,
	"Auto medium" = 0x04,
	"Medium" = 0x05,
	"Circulation" = 0x06,
	"Humidity circulation" = 0x07,
	"Left and right" = 0x08,
	"Up and down" = 0x09,
	"Quiet" = 0x0a,
	"External circulation" = 0x0b,
}
```
