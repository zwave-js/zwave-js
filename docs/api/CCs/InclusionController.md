# Inclusion Controller CC

?> CommandClass ID: `0x74`

## Inclusion Controller CC methods

### `initiateStep`

```ts
async initiateStep(
	nodeId: number,
	step: InclusionControllerStep,
): Promise<void>;
```

Instruct the target to initiate the given inclusion step for the given node.

### `completeStep`

```ts
async completeStep(
	step: InclusionControllerStep,
	status: InclusionControllerStatus,
): Promise<void>;
```

Indicate to the other node that the given inclusion step has been completed.

## Related types

### `InclusionControllerStatus`

```ts
enum InclusionControllerStatus {
	OK = 0x01,
	UserRejected = 0x02,
	Failed = 0x03,
	NotSupported = 0x04,
}
```

### `InclusionControllerStep`

```ts
enum InclusionControllerStep {
	ProxyInclusion = 0x01,
	S0Inclusion = 0x02,
	ProxyInclusionReplace = 0x03,
}
```
