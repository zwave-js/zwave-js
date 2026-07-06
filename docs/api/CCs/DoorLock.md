# Door Lock CC

?> CommandClass ID: `0x62`

## Door Lock CC methods

### `getCapabilities`

```ts
async getCapabilities(): Promise<
	{
		autoRelockSupported: boolean;
		blockToBlockSupported: boolean;
		boltSupported: boolean;
		doorSupported: boolean;
		holdAndReleaseSupported: boolean;
		latchSupported: boolean;
		supportedDoorLockModes: readonly DoorLockMode[];
		supportedInsideHandles: DoorHandleStatus;
		supportedOperationTypes: readonly DoorLockOperationType[];
		supportedOutsideHandles: DoorHandleStatus;
		twistAssistSupported: boolean;
	} | undefined
>;
```

### `get`

```ts
async get(): Promise<
	{
		boltStatus?: "locked" | "unlocked";
		currentMode: DoorLockMode;
		doorStatus?: "open" | "closed";
		duration?: Duration;
		insideHandlesCanOpenDoor: DoorHandleStatus;
		latchStatus?: "open" | "closed";
		lockTimeout?: number;
		outsideHandlesCanOpenDoor: DoorHandleStatus;
		targetMode?: DoorLockMode;
	} | undefined
>;
```

### `set`

```ts
async set(
	mode: DoorLockMode,
): Promise<SupervisionResult | undefined>;
```

### `setConfiguration`

```ts
async setConfiguration(
	configuration: {
		operationType: DoorLockOperationType.Timed;
		lockTimeoutConfiguration: number;
		outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
		insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
		// V4+
		autoRelockTime?: number;
		holdAndReleaseTime?: number;
		twistAssist?: boolean;
		blockToBlock?: boolean;
	},
): Promise<SupervisionResult | undefined>;

async setConfiguration(
	configuration: {
		operationType: DoorLockOperationType.Constant;
		outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
		insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
		// V4+
		autoRelockTime?: number;
		holdAndReleaseTime?: number;
		twistAssist?: boolean;
		blockToBlock?: boolean;
	},
): Promise<SupervisionResult | undefined>;
```

### `getConfiguration`

```ts
async getConfiguration(): Promise<
	{
		autoRelockTime?: number;
		blockToBlock?: boolean;
		holdAndReleaseTime?: number;
		insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
		lockTimeoutConfiguration?: number;
		operationType: DoorLockOperationType;
		outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
		twistAssist?: boolean;
	} | undefined
>;
```

## Door Lock CC values

### `autoRelockTime`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "autoRelockTime",
}
```

- **label:** Duration in seconds until lock returns to secure state
- **min. CC version:** 4
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `blockToBlock`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "blockToBlock",
}
```

- **label:** Block-to-block functionality enabled
- **min. CC version:** 4
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `boltStatus`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "boltStatus",
}
```

- **label:** Current status of the bolt
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `currentMode`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "currentMode",
}
```

- **label:** Current lock mode
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `doorStatus`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "doorStatus",
}
```

- **label:** Current status of the door
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `duration`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "duration",
}
```

- **label:** Remaining duration until target lock mode
- **min. CC version:** 3
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"duration"`

### `holdAndReleaseTime`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "holdAndReleaseTime",
}
```

- **label:** Duration in seconds the latch stays retracted
- **min. CC version:** 4
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `insideHandlesCanOpenDoor`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "insideHandlesCanOpenDoor",
}
```

- **label:** Which inside handles can open the door (actual status)
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `insideHandlesCanOpenDoorConfiguration`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "insideHandlesCanOpenDoorConfiguration",
}
```

- **label:** Which inside handles can open the door (configuration)
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `latchStatus`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "latchStatus",
}
```

- **label:** Current status of the latch
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `lockTimeout`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "lockTimeout",
}
```

- **label:** Seconds until lock mode times out
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `lockTimeoutConfiguration`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "lockTimeoutConfiguration",
}
```

- **label:** Duration of timed mode in seconds
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `operationType`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "operationType",
}
```

- **label:** Lock operation type
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `outsideHandlesCanOpenDoor`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "outsideHandlesCanOpenDoor",
}
```

- **label:** Which outside handles can open the door (actual status)
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `outsideHandlesCanOpenDoorConfiguration`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "outsideHandlesCanOpenDoorConfiguration",
}
```

- **label:** Which outside handles can open the door (configuration)
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `targetMode`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "targetMode",
}
```

- **label:** Target lock mode
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `twistAssist`

```ts
{
	commandClass: CommandClasses["Door Lock"],
	endpoint: number,
	property: "twistAssist",
}
```

- **label:** Twist Assist enabled
- **min. CC version:** 4
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

## Related types

### `DoorHandleStatus`

```ts
type DoorHandleStatus = [boolean, boolean, boolean, boolean];
```

### `DoorLockMode`

```ts
enum DoorLockMode {
	Unsecured = 0x00,
	UnsecuredWithTimeout = 0x01,
	InsideUnsecured = 0x10,
	InsideUnsecuredWithTimeout = 0x11,
	OutsideUnsecured = 0x20,
	OutsideUnsecuredWithTimeout = 0x21,
	Unknown = 0xfe,
	Secured = 0xff,
}
```

### `DoorLockOperationType`

```ts
enum DoorLockOperationType {
	Constant = 0x01,
	Timed = 0x02,
}
```
