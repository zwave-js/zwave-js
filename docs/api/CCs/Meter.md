# Meter CC

?> CommandClass ID: `0x32`

## Meter CC methods

### `get`

```ts
async get(
	options?: MeterCCGetOptions,
): Promise<MeterReading | undefined>;
```

### `sendReport`

```ts
async sendReport(
	options: MeterCCReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `getAll`

```ts
async getAll(
	accumulatedOnly: boolean = false,
): Promise<MeterReading[]>;
```

### `getSupported`

```ts
async getSupported(): Promise<Pick<MeterCCSupportedReport, "type" | "supportsReset" | "supportedScales" | "supportedRateTypes"> | undefined>;
```

### `sendSupportedReport`

```ts
async sendSupportedReport(
	options: MeterCCSupportedReportOptions,
): Promise<void>;
```

### `reset`

```ts
async reset(
	options?: MeterCCResetOptions,
): Promise<SupervisionResult | undefined>;
```
