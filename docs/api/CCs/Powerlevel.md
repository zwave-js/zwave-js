# Powerlevel CC

?> CommandClass ID: `0x73`

## Powerlevel CC methods

### `setNormalPowerlevel`

```ts
async setNormalPowerlevel(): Promise<SupervisionResult | undefined>;
```

### `setCustomPowerlevel`

```ts
async setCustomPowerlevel(
	powerlevel: Powerlevel,
	timeout: number,
): Promise<SupervisionResult | undefined>;
```

### `getPowerlevel`

```ts
async getPowerlevel(): Promise<
	MaybeNotKnown<{
		powerlevel: Powerlevel;
		timeout?: number;
	}>
>;
```

### `reportPowerlevel`

```ts
async reportPowerlevel(
	options: {
		powerlevel: typeof Powerlevel["Normal Power"];
	},
): Promise<void>;

async reportPowerlevel(
	options: {
		powerlevel: Exclude<Powerlevel, typeof Powerlevel["Normal Power"]>;
		timeout: number;
	},
): Promise<void>;
```

### `startNodeTest`

```ts
async startNodeTest(
	testNodeId: number,
	powerlevel: Powerlevel,
	testFrameCount: number,
): Promise<SupervisionResult | undefined>;
```

### `getNodeTestStatus`

```ts
async getNodeTestStatus(): Promise<
	MaybeNotKnown<
		{
			acknowledgedFrames: number;
			status: PowerlevelTestStatus;
			testNodeId: number;
		}
	>
>;
```

### `sendNodeTestReport`

```ts
async sendNodeTestReport(
	options: {
		testNodeId: number;
		status: PowerlevelTestStatus;
		acknowledgedFrames: number;
	},
): Promise<void>;
```

## Related types

### `Powerlevel`

```ts
enum Powerlevel {
	"Normal Power" = 0x00,
	"-1 dBm" = 0x01,
	"-2 dBm" = 0x02,
	"-3 dBm" = 0x03,
	"-4 dBm" = 0x04,
	"-5 dBm" = 0x05,
	"-6 dBm" = 0x06,
	"-7 dBm" = 0x07,
	"-8 dBm" = 0x08,
	"-9 dBm" = 0x09,
}
```

### `PowerlevelTestStatus`

```ts
enum PowerlevelTestStatus {
	Failed = 0x00,
	Success = 0x01,
	"In Progress" = 0x02,
}
```
