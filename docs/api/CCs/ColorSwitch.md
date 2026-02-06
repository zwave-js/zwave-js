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
async get(component: ColorComponent): Promise<Pick<ColorSwitchCCReport, "currentValue" | "targetValue" | "duration"> | undefined>;
```

### `set`

```ts
async set(
	options: ColorSwitchCCSetOptions,
): Promise<SupervisionResult | undefined>;
```

### `startLevelChange`

```ts
async startLevelChange(
	options: ColorSwitchCCStartLevelChangeOptions,
): Promise<SupervisionResult | undefined>;
```

### `stopLevelChange`

```ts
async stopLevelChange(
	colorComponent: ColorComponent,
): Promise<SupervisionResult | undefined>;
```
