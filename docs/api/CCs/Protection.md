# Protection CC

?> CommandClass ID: `0x75`

## Protection CC methods

### `get`

```ts
async get(): Promise<Pick<ProtectionCCReport, "local" | "rf"> | undefined>;
```

### `set`

```ts
async set(
	local: LocalProtectionState,
	rf?: RFProtectionState,
): Promise<SupervisionResult | undefined>;
```

### `getSupported`

```ts
async getSupported(): Promise<Pick<ProtectionCCSupportedReport, "supportsExclusiveControl" | "supportsTimeout" | "supportedLocalStates" | "supportedRFStates"> | undefined>;
```

### `getExclusiveControl`

```ts
async getExclusiveControl(): Promise<MaybeNotKnown<number>>;
```

### `setExclusiveControl`

```ts
async setExclusiveControl(
	nodeId: number,
): Promise<SupervisionResult | undefined>;
```

### `getTimeout`

```ts
async getTimeout(): Promise<MaybeNotKnown<Timeout>>;
```

### `setTimeout`

```ts
async setTimeout(
	timeout: Timeout,
): Promise<SupervisionResult | undefined>;
```
