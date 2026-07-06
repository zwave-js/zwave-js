# Thermostat Mode CC

?> CommandClass ID: `0x40`

## Thermostat Mode CC methods

### `get`

```ts
async get(): Promise<
	{
		manufacturerData?: BytesView;
		mode: ThermostatMode;
	} | undefined
>;
```

### `set`

```ts
async set(
	mode: Exclude<
		ThermostatMode,
		(typeof ThermostatMode)["Manufacturer specific"]
	>,
): Promise<SupervisionResult | undefined>;

async set(
	mode: (typeof ThermostatMode)["Manufacturer specific"],
	manufacturerData: BytesView | string,
): Promise<SupervisionResult | undefined>;
```

### `getSupportedModes`

```ts
async getSupportedModes(): Promise<
	MaybeNotKnown<readonly ThermostatMode[]>
>;
```

## Thermostat Mode CC values

### `manufacturerData`

```ts
{
	commandClass: CommandClasses["Thermostat Mode"],
	endpoint: number,
	property: "manufacturerData",
}
```

- **label:** Manufacturer data
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"buffer"`

### `thermostatMode`

```ts
{
	commandClass: CommandClasses["Thermostat Mode"],
	endpoint: number,
	property: "mode",
}
```

- **label:** Thermostat mode
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

## Related types

### `ThermostatMode`

```ts
enum ThermostatMode {
	"Off" = 0x00,
	"Heat" = 0x01,
	"Cool" = 0x02,
	"Auto" = 0x03,
	"Auxiliary" = 0x04,
	"Resume (on)" = 0x05,
	"Fan" = 0x06,
	"Furnace" = 0x07,
	"Dry" = 0x08,
	"Moist" = 0x09,
	"Auto changeover" = 0x0a,
	"Energy heat" = 0x0b,
	"Energy cool" = 0x0c,
	"Away" = 0x0d,
	"Full power" = 0x0f,
	"Manufacturer specific" = 0x1f,
}
```
