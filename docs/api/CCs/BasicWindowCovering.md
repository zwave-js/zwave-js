# Basic Window Covering CC

?> CommandClass ID: `0x50`

## Basic Window Covering CC methods

### `startLevelChange`

```ts
async startLevelChange(
	direction: keyof typeof LevelChangeDirection,
): Promise<SupervisionResult | undefined>;
```

### `stopLevelChange`

```ts
async stopLevelChange(): Promise<SupervisionResult | undefined>;
```

## Basic Window Covering CC values

### `levelChangeDown`

```ts
{
	commandClass: CommandClasses["Basic Window Covering"],
	endpoint: number,
	property: "levelChangeDown",
}
```

- **label:** Close
- **min. CC version:** 1
- **readable:** false
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `levelChangeUp`

```ts
{
	commandClass: CommandClasses["Basic Window Covering"],
	endpoint: number,
	property: "levelChangeUp",
}
```

- **label:** Open
- **min. CC version:** 1
- **readable:** false
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`
