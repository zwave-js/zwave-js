# Supervision CC

?> CommandClass ID: `0x6c`

## Supervision CC methods

### `sendReport`

```ts
async sendReport(
	options: {
		moreUpdatesFollow: boolean;
		requestWakeUpOnDemand?: boolean;
		sessionId: number;
		status: SupervisionStatus.Working;
		duration: Duration;
		encapsulationFlags?: EncapsulationFlags;
		lowPriority?: boolean;
	},
): Promise<void>;

async sendReport(
	options: {
		moreUpdatesFollow: boolean;
		requestWakeUpOnDemand?: boolean;
		sessionId: number;
		status:
			| SupervisionStatus.NoSupport
			| SupervisionStatus.Fail
			| SupervisionStatus.Success;
		encapsulationFlags?: EncapsulationFlags;
		lowPriority?: boolean;
	},
): Promise<void>;
```

## Related types

### `EncapsulationFlags`

```ts
enum EncapsulationFlags {
	None = 0,
	Supervision = 1 << 0,
	// Multi Channel is tracked through the endpoint index
	Security = 1 << 1,
	CRC16 = 1 << 2,
}
```
