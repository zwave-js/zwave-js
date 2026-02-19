# Irrigation CC

?> CommandClass ID: `0x6b`

## Irrigation CC methods

### `getSystemInfo`

```ts
async getSystemInfo(): Promise<Pick<IrrigationCCSystemInfoReport, "numValves" | "numValveTables" | "supportsMasterValve" | "maxValveTableSize"> | undefined>;
```

### `getSystemStatus`

```ts
async getSystemStatus(): Promise<Pick<IrrigationCCSystemStatusReport, "systemVoltage" | "flowSensorActive" | "pressureSensorActive" | "rainSensorActive" | "moistureSensorActive" | "flow" | "pressure" | "shutoffDuration" | "errorNotProgrammed" | "errorEmergencyShutdown" | "errorHighPressure" | "errorLowPressure" | "errorValve" | "masterValveOpen" | "firstOpenZoneId"> | undefined>;
```

### `getSystemConfig`

```ts
async getSystemConfig(): Promise<Pick<IrrigationCCSystemConfigReport, "masterValveDelay" | "highPressureThreshold" | "lowPressureThreshold" | "rainSensorPolarity" | "moistureSensorPolarity"> | undefined>;
```

### `setSystemConfig`

```ts
async setSystemConfig(
	config: IrrigationCCSystemConfigSetOptions,
): Promise<SupervisionResult | undefined>;
```

### `getValveInfo`

```ts
async getValveInfo(valveId: ValveId): Promise<Pick<IrrigationCCValveInfoReport, "connected" | "nominalCurrent" | "errorShortCircuit" | "errorHighCurrent" | "errorLowCurrent" | "errorMaximumFlow" | "errorHighFlow" | "errorLowFlow"> | undefined>;
```

### `setValveConfig`

```ts
async setValveConfig(
	options: IrrigationCCValveConfigSetOptions,
): Promise<SupervisionResult | undefined>;
```

### `getValveConfig`

```ts
async getValveConfig(valveId: ValveId): Promise<Pick<IrrigationCCValveConfigReport, "nominalCurrentHighThreshold" | "nominalCurrentLowThreshold" | "maximumFlow" | "highFlowThreshold" | "lowFlowThreshold" | "useRainSensor" | "useMoistureSensor"> | undefined>;
```

### `runValve`

```ts
async runValve(
	valveId: ValveId,
	duration: number,
): Promise<SupervisionResult | undefined>;
```

### `shutoffValve`

```ts
shutoffValve(
	valveId: ValveId,
): Promise<SupervisionResult | undefined>;
```

### `setValveTable`

```ts
async setValveTable(
	tableId: number,
	entries: ValveTableEntry[],
): Promise<SupervisionResult | undefined>;
```

### `getValveTable`

```ts
async getValveTable(
	tableId: number,
): Promise<MaybeNotKnown<ValveTableEntry[]>>;
```

### `runTables`

```ts
async runTables(
	tableIDs: number[],
): Promise<SupervisionResult | undefined>;
```

### `shutoffSystem`

```ts
async shutoffSystem(
	duration: number,
): Promise<SupervisionResult | undefined>;
```

Shuts off the entire system for the given duration.

**Parameters:**

- `duration`: Shutoff duration in hours. A value of 255 will shut off the entire system permanently and prevents schedules from running.

### `shutoffSystemPermanently`

```ts
shutoffSystemPermanently(): Promise<SupervisionResult | undefined>;
```

Shuts off the entire system permanently and prevents schedules from running.
