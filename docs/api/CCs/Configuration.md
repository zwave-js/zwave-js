# Configuration CC

?> CommandClass ID: `0x70`

## Configuration CC methods

### `get`

```ts
async get(
	parameter: number,
	options?: {
		valueBitMask?: number;
		allowUnexpectedResponse?: boolean;
	},
): Promise<MaybeNotKnown<ConfigValue>>;
```

Requests the current value of a given config parameter from the device.
This may timeout and return `undefined` if the node does not respond.
If the node replied with a different parameter number, a `ConfigurationCCError`
is thrown with the `argument` property set to the reported parameter number.

### `getBulk`

```ts
async getBulk(
	options: {
		parameter: number;
		bitMask?: number;
	}[],
): Promise<
	{
		parameter: number;
		bitMask?: number;
		value: MaybeNotKnown<ConfigValue>;
	}[]
>;
```

Requests the current value of the config parameters from the device.
When the node does not respond due to a timeout, the `value` in the returned array will be `undefined`.

### `set`

```ts
// Variant 1: Normal parameter, defined in a config file
async set(
	options: {
		parameter: number;
		value: ConfigValue;
	},
): Promise<SupervisionResult | undefined>;

// Variant 2: Normal parameter, not defined in a config file
async set(
	options: {
		parameter: number;
		value: ConfigValue;
		valueSize: 1 | 2 | 4;
		valueFormat: ConfigValueFormat;
	},
): Promise<SupervisionResult | undefined>;

// Variant 3: Partial parameter, must be defined in a config file
async set(
	options: {
		parameter: number;
		bitMask: number;
		value: number;
	},
): Promise<SupervisionResult | undefined>;
```

Sets a new value for a given config parameter of the device.

### `setBulk`

```ts
async setBulk(
	values: ConfigurationCCAPISetOptions[],
): Promise<SupervisionResult | undefined>;
```

Sets new values for multiple config parameters of the device. Uses the `BulkSet` command if supported, otherwise falls back to individual `Set` commands.

### `reset`

```ts
async reset(
	parameter: number,
): Promise<SupervisionResult | undefined>;
```

Resets a configuration parameter to its default value.

WARNING: This will throw on legacy devices (ConfigurationCC v3 and below).

### `resetBulk`

```ts
async resetBulk(
	parameters: number[],
): Promise<SupervisionResult | undefined>;
```

Resets multiple configuration parameters to their default value. Uses BulkSet if supported, otherwise falls back to individual Set commands.

WARNING: This will throw on legacy devices (ConfigurationCC v3 and below).

### `resetAll`

```ts
async resetAll(): Promise<void>;
```

Resets all configuration parameters to their default value.

### `getProperties`

```ts
async getProperties(parameter: number): Promise<
	{
		altersCapabilities: MaybeNotKnown<boolean>;
		defaultValue: MaybeNotKnown<number>;
		isAdvanced: MaybeNotKnown<boolean>;
		isReadonly: MaybeNotKnown<boolean>;
		maxValue: MaybeNotKnown<number>;
		minValue: MaybeNotKnown<number>;
		nextParameter: number;
		noBulkSupport: MaybeNotKnown<boolean>;
		valueFormat: ConfigValueFormat;
		valueSize: number;
	} | undefined
>;
```

### `getName`

```ts
async getName(parameter: number): Promise<MaybeNotKnown<string>>;
```

Requests the name of a configuration parameter from the node.

### `getInfo`

```ts
async getInfo(parameter: number): Promise<MaybeNotKnown<string>>;
```

Requests usage info for a configuration parameter from the node.

### `scanParametersLegacy`

```ts
async scanParametersLegacy(): Promise<void>;
```

This scans the node for the existing parameters. Found parameters will be reported
through the `value added` and `value updated` events.

WARNING: This method throws for newer devices.

WARNING: On nodes implementing V1 and V2, this process may take
**up to an hour**, depending on the configured timeout.

WARNING: On nodes implementing V2, all parameters after 255 will be ignored.

## Configuration CC values

### `paramInformation(parameter: number, bitMask?: number)`

```ts
{
	commandClass: CommandClasses.Configuration,
	endpoint: number,
	property: number,
	propertyKey: number | undefined,
}
```

- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

## Related types

### `ConfigurationCCAPISetOptions`

```ts
type ConfigurationCCAPISetOptions =
	& {
		parameter: number;
	}
	& (
		| {
			// Variant 1: Normal parameter, defined in a config file
			bitMask?: undefined;
			value: ConfigValue;
		}
		| {
			// Variant 2: Normal parameter, not defined in a config file
			bitMask?: undefined;
			value: ConfigValue;
			valueSize: 1 | 2 | 4;
			valueFormat: ConfigValueFormat;
		}
		| {
			// Variant 3: Partial parameter, must be defined in a config file
			bitMask: number;
			value: number;
		}
	);
```

### `ConfigValue`

```ts
type ConfigValue = number;
```

### `ConfigValueFormat`

Defines how a configuration value is encoded

```ts
enum ConfigValueFormat {
	SignedInteger = 0x00,
	UnsignedInteger = 0x01,
	Enumerated = 0x02, // UnsignedInt, Radio Buttons
	BitField = 0x03, // Check Boxes
}
```
