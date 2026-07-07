# Entry Control CC

?> CommandClass ID: `0x6f`

## Entry Control CC methods

### `getSupportedKeys`

```ts
async getSupportedKeys(): Promise<readonly number[] | undefined>;
```

### `getEventCapabilities`

```ts
async getEventCapabilities(): Promise<
	{
		maxKeyCacheSize: number;
		maxKeyCacheTimeout: number;
		minKeyCacheSize: number;
		minKeyCacheTimeout: number;
		supportedDataTypes: readonly EntryControlDataTypes[];
		supportedEventTypes: readonly EntryControlEventTypes[];
	} | undefined
>;
```

### `getConfiguration`

```ts
async getConfiguration(): Promise<
	{
		keyCacheSize: number;
		keyCacheTimeout: number;
	} | undefined
>;
```

### `setConfiguration`

```ts
async setConfiguration(
	keyCacheSize: number,
	keyCacheTimeout: number,
): Promise<SupervisionResult | undefined>;
```

## Entry Control CC values

### `keyCacheSize`

```ts
{
	commandClass: CommandClasses["Entry Control"],
	endpoint: number,
	property: "keyCacheSize",
}
```

- **label:** Key cache size
- **description:** Number of character that must be stored before sending
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 1
- **max. value:** 32

### `keyCacheTimeout`

```ts
{
	commandClass: CommandClasses["Entry Control"],
	endpoint: number,
	property: "keyCacheTimeout",
}
```

- **label:** Key cache timeout
- **description:** How long the key cache must wait for additional characters
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 1
- **max. value:** 10

## Related types

### `EntryControlDataTypes`

```ts
enum EntryControlDataTypes {
	None = 0x00,
	Raw = 0x01,
	ASCII = 0x02,
	MD5 = 0x03,
}
```

### `EntryControlEventTypes`

```ts
enum EntryControlEventTypes {
	Caching = 0x00,
	CachedKeys = 0x01,
	Enter = 0x02,
	DisarmAll = 0x03,
	ArmAll = 0x04,
	ArmAway = 0x05,
	ArmHome = 0x06,
	ExitDelay = 0x07,
	Arm1 = 0x08,
	Arm2 = 0x09,
	Arm3 = 0x0a,
	Arm4 = 0x0b,
	Arm5 = 0x0c,
	Arm6 = 0x0d,
	Rfid = 0x0e,
	Bell = 0x0f,
	Fire = 0x10,
	Police = 0x11,
	AlertPanic = 0x12,
	AlertMedical = 0x13,
	GateOpen = 0x14,
	GateClose = 0x15,
	Lock = 0x16,
	Unlock = 0x17,
	Test = 0x18,
	Cancel = 0x19,
}
```
