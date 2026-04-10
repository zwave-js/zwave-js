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
