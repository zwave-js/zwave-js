# Central Scene CC

?> CommandClass ID: `0x5b`

## Central Scene CC methods

### `getSupported`

```ts
async getSupported(): Promise<
	{
		sceneCount: number;
		supportedKeyAttributes: ReadonlyMap<
			number,
			readonly CentralSceneKeys[]
		>;
		supportsSlowRefresh: MaybeNotKnown<boolean>;
	} | undefined
>;
```

### `getConfiguration`

```ts
async getConfiguration(): Promise<
	{
		slowRefresh: boolean;
	} | undefined
>;
```

### `setConfiguration`

```ts
async setConfiguration(
	slowRefresh: boolean,
): Promise<SupervisionResult | undefined>;
```

## Central Scene CC values

### `scene(sceneNumber: number)`

```ts
{
	commandClass: CommandClasses["Central Scene"],
	endpoint: number,
	property: "scene",
	propertyKey: string,
}
```

- **label:** `Scene ${string}`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** false
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `slowRefresh`

```ts
{
	commandClass: CommandClasses["Central Scene"],
	endpoint: number,
	property: "slowRefresh",
}
```

- **label:** Send held down notifications at a slow rate
- **description:** When this is true, KeyHeldDown notifications are sent every 55s. When this is false, the notifications are sent every 200ms.
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

## Related types

### `CentralSceneKeys`

```ts
enum CentralSceneKeys {
	KeyPressed = 0x00,
	KeyReleased = 0x01,
	KeyHeldDown = 0x02,
	KeyPressed2x = 0x03,
	KeyPressed3x = 0x04,
	KeyPressed4x = 0x05,
	KeyPressed5x = 0x06,
}
```
