# Color Switch CC

?> CommandClass ID: `0x33`

## Color Switch CC methods

### `getSupported`

```ts
async getSupported(): Promise<
	MaybeNotKnown<readonly ColorComponent[]>
>;
```

### `get`

```ts
async get(component: ColorComponent): Promise<
	{
		currentValue: number;
		duration?: Duration;
		targetValue?: number;
	} | undefined
>;
```

### `set`

```ts
async set(
	options: ColorTable & {
		duration?: Duration | string;
	},
): Promise<SupervisionResult | undefined>;

async set(
	options: {
		hexColor: string;
		duration?: Duration | string;
	},
): Promise<SupervisionResult | undefined>;
```

### `startLevelChange`

```ts
async startLevelChange(
	options: {
		colorComponent: ColorComponent;
		direction: "up" | "down";
		ignoreStartLevel: true;
		startLevel?: number;
		// Version >= 3:
		duration?: Duration | string;
	},
): Promise<SupervisionResult | undefined>;

async startLevelChange(
	options: {
		colorComponent: ColorComponent;
		direction: "up" | "down";
		ignoreStartLevel: false;
		startLevel: number;
		// Version >= 3:
		duration?: Duration | string;
	},
): Promise<SupervisionResult | undefined>;
```

### `stopLevelChange`

```ts
async stopLevelChange(
	colorComponent: ColorComponent,
): Promise<SupervisionResult | undefined>;
```

## Color Switch CC values

### `currentColor`

```ts
{
	commandClass: CommandClasses["Color Switch"],
	endpoint: number,
	property: "currentColor",
}
```

- **label:** Current color
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `currentColorChannel(component: ColorComponent)`

```ts
{
	commandClass: CommandClasses["Color Switch"],
	endpoint: number,
	property: "currentColor",
	propertyKey: ColorComponent,
}
```

- **label:** `Current value (${string})`
- **description:** `The current value of the ${string} channel.`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `duration`

```ts
{
	commandClass: CommandClasses["Color Switch"],
	endpoint: number,
	property: "duration",
}
```

- **label:** Remaining duration
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"duration"`

### `hexColor`

```ts
{
	commandClass: CommandClasses["Color Switch"],
	endpoint: number,
	property: "hexColor",
}
```

- **label:** RGB Color
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"color"`
- **min. length:** 6
- **max. length:** 7

### `targetColor`

```ts
{
	commandClass: CommandClasses["Color Switch"],
	endpoint: number,
	property: "targetColor",
}
```

- **label:** Target color
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `targetColorChannel(component: ColorComponent)`

```ts
{
	commandClass: CommandClasses["Color Switch"],
	endpoint: number,
	property: "targetColor",
	propertyKey: ColorComponent,
}
```

- **label:** `Target value (${string})`
- **description:** `The target value of the ${string} channel.`
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

## Related types

### `ColorComponent`

```ts
enum ColorComponent {
	"Warm White" = 0,
	"Cold White",
	Red,
	Green,
	Blue,
	Amber,
	Cyan,
	Purple,
	Index,
}
```

### `ColorKey`

```ts
type ColorKey = keyof typeof ColorComponentMap;
```

### `ColorTable`

This type is used to accept both the kebabCase names and numeric components as table keys

```ts
type ColorTable =
	| Partial<Record<ColorKey, number>>
	| Partial<Record<ColorComponent, number>>;
```
