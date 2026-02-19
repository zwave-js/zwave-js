# Scene Actuator Configuration CC

?> CommandClass ID: `0x2c`

## Scene Actuator Configuration CC methods

### `set`

```ts
async set(
	sceneId: number,
	dimmingDuration?: Duration | string,
	level?: number,
): Promise<SupervisionResult | undefined>;
```

### `getActive`

```ts
async getActive(): Promise<
	MaybeNotKnown<
		Pick<
			SceneActuatorConfigurationCCReport,
			"sceneId" | "level" | "dimmingDuration"
		>
	>
>;
```

### `get`

```ts
async get(
	sceneId: number,
): Promise<
	MaybeNotKnown<
		Pick<
			SceneActuatorConfigurationCCReport,
			"level" | "dimmingDuration"
		>
	>
>;
```
