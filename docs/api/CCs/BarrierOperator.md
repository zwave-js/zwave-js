# Barrier Operator CC

?> CommandClass ID: `0x66`

## Barrier Operator CC methods

### `get`

```ts
async get(): Promise<Pick<BarrierOperatorCCReport, "currentState" | "position"> | undefined>;
```

### `set`

```ts
async set(
	targetState: BarrierState.Open | BarrierState.Closed,
): Promise<SupervisionResult | undefined>;
```

### `getSignalingCapabilities`

```ts
async getSignalingCapabilities(): Promise<
	MaybeNotKnown<readonly SubsystemType[]>
>;
```

### `getEventSignaling`

```ts
async getEventSignaling(
	subsystemType: SubsystemType,
): Promise<MaybeNotKnown<SubsystemState>>;
```

### `setEventSignaling`

```ts
async setEventSignaling(
	subsystemType: SubsystemType,
	subsystemState: SubsystemState,
): Promise<SupervisionResult | undefined>;
```
