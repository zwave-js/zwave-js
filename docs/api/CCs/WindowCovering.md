# Window Covering CC

?> CommandClass ID: `0x6a`

## Window Covering CC methods

### `getSupported`

```ts
async getSupported(): Promise<
	MaybeNotKnown<readonly WindowCoveringParameter[]>
>;
```

### `get`

```ts
async get(parameter: WindowCoveringParameter): Promise<
	{
		currentValue: number;
		duration: Duration;
		targetValue: number;
	} | undefined
>;
```

### `set`

```ts
async set(
	targetValues: {
		parameter: WindowCoveringParameter;
		value: number;
	}[],
	duration?: Duration | string,
): Promise<SupervisionResult | undefined>;
```

### `startLevelChange`

```ts
async startLevelChange(
	parameter: WindowCoveringParameter,
	direction: "up" | "down",
	duration?: Duration | string,
): Promise<SupervisionResult | undefined>;
```

### `stopLevelChange`

```ts
async stopLevelChange(
	parameter: WindowCoveringParameter,
): Promise<SupervisionResult | undefined>;
```

## Window Covering CC values

### `currentValue(parameter: WindowCoveringParameter)`

```ts
{
	commandClass: CommandClasses["Window Covering"],
	endpoint: number,
	property: "currentValue",
	propertyKey: WindowCoveringParameter,
}
```

- **label:** `Current value - ${string}`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 99

### `duration(parameter: WindowCoveringParameter)`

```ts
{
	commandClass: CommandClasses["Window Covering"],
	endpoint: number,
	property: "duration",
	propertyKey: WindowCoveringParameter,
}
```

- **label:** `Remaining duration - ${string}`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"duration"`

### `levelChangeDown(parameter: WindowCoveringParameter)`

```ts
{
	commandClass: CommandClasses["Window Covering"],
	endpoint: number,
	property: "levelChangeDown",
	propertyKey: WindowCoveringParameter,
}
```

- **label:** `${string} - ${string}`
- **min. CC version:** 1
- **readable:** false
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `levelChangeUp(parameter: WindowCoveringParameter)`

```ts
{
	commandClass: CommandClasses["Window Covering"],
	endpoint: number,
	property: "levelChangeUp",
	propertyKey: WindowCoveringParameter,
}
```

- **label:** `${string} - ${string}`
- **min. CC version:** 1
- **readable:** false
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `targetValue(parameter: WindowCoveringParameter)`

```ts
{
	commandClass: CommandClasses["Window Covering"],
	endpoint: number,
	property: "targetValue",
	propertyKey: WindowCoveringParameter,
}
```

- **label:** `Target value - ${string}`
- **min. CC version:** 1
- **readable:** true
- **writeable:** boolean
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 99

## Related types

### `WindowCoveringParameter`

```ts
enum WindowCoveringParameter {
	"Outbound Left (no position)",
	"Outbound Left",
	"Outbound Right (no position)",
	"Outbound Right",
	"Inbound Left (no position)",
	"Inbound Left",
	"Inbound Right (no position)",
	"Inbound Right",
	"Inbound Left/Right (no position)",
	"Inbound Left/Right",
	"Vertical Slats Angle (no position)",
	"Vertical Slats Angle",
	"Outbound Bottom (no position)",
	"Outbound Bottom",
	"Outbound Top (no position)",
	"Outbound Top",
	"Inbound Bottom (no position)",
	"Inbound Bottom",
	"Inbound Top (no position)",
	"Inbound Top",
	"Inbound Top/Bottom (no position)",
	"Inbound Top/Bottom",
	"Horizontal Slats Angle (no position)",
	"Horizontal Slats Angle",
}
```
