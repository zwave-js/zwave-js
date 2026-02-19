# Scene Controller Configuration CC

?> CommandClass ID: `0x2d`

## Scene Controller Configuration CC methods

### `disable`

```ts
async disable(
	groupId: number,
): Promise<SupervisionResult | undefined>;
```

### `set`

```ts
async set(
	groupId: number,
	sceneId: number,
	dimmingDuration?: Duration | string,
): Promise<SupervisionResult | undefined>;
```

### `getLastActivated`

```ts
async getLastActivated(): Promise<
	MaybeNotKnown<
		Pick<
			SceneControllerConfigurationCCReport,
			"groupId" | "sceneId" | "dimmingDuration"
		>
	>
>;
```

### `get`

```ts
async get(
	groupId: number,
): Promise<
	MaybeNotKnown<
		Pick<
			SceneControllerConfigurationCCReport,
			"sceneId" | "dimmingDuration"
		>
	>
>;
```
