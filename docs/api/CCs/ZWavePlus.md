# Z-Wave Plus Info CC

?> CommandClass ID: `0x5e`

## Z-Wave Plus Info CC methods

### `get`

```ts
async get(): Promise<
	{
		installerIcon: number;
		nodeType: ZWavePlusNodeType;
		roleType: ZWavePlusRoleType;
		userIcon: number;
		zwavePlusVersion: number;
	} | undefined
>;
```

### `sendReport`

```ts
async sendReport(options: {
	zwavePlusVersion: number;
	nodeType: ZWavePlusNodeType;
	roleType: ZWavePlusRoleType;
	installerIcon: number;
	userIcon: number;
}): Promise<void>;
```

## Related types

### `ZWavePlusNodeType`

```ts
enum ZWavePlusNodeType {
	Node = 0x00, // ZWave+ Node
	IPGateway = 0x02, // ZWave+ for IP Gateway
}
```

### `ZWavePlusRoleType`

```ts
enum ZWavePlusRoleType {
	CentralStaticController = 0x00,
	SubStaticController = 0x01,
	PortableController = 0x02,
	PortableReportingController = 0x03,
	PortableSlave = 0x04,
	AlwaysOnSlave = 0x05,
	SleepingReportingSlave = 0x06,
	SleepingListeningSlave = 0x07,
	NetworkAwareSlave = 0x08,
}
```
