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
async get(parameter: WindowCoveringParameter): Promise<Pick<WindowCoveringCCReport, "currentValue" | "targetValue" | "duration"> | undefined>;
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
	direction: keyof typeof LevelChangeDirection,
	duration?: Duration | string,
): Promise<SupervisionResult | undefined>;
```

### `stopLevelChange`

```ts
async stopLevelChange(
	parameter: WindowCoveringParameter,
): Promise<SupervisionResult | undefined>;
```
