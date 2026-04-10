# User Code CC

?> CommandClass ID: `0x63`

## User Code CC methods

### `getUsersCount`

```ts
async getUsersCount(): Promise<MaybeNotKnown<number>>;
```

### `get`

```ts
async get(
	userId: number,
	multiple?: false,
): Promise<MaybeNotKnown<Pick<UserCode, "userIdStatus" | "userCode">>>;

async get(
	userId: number,
	multiple: true,
): Promise<
	MaybeNotKnown<{ userCodes: readonly UserCode[]; nextUserId: number }>
>;
```

### `set`

```ts
async set(
	userId: number,
	userIdStatus: Exclude<
		UserIDStatus,
		UserIDStatus.Available | UserIDStatus.StatusNotAvailable
	>,
	userCode: string | BytesView,
): Promise<SupervisionResult | undefined>;
```

Configures a single user code.

### `setMany`

```ts
async setMany(
	codes: UserCodeCCSetOptions[],
): Promise<SupervisionResult | undefined>;
```

Configures multiple user codes.

### `clear`

```ts
async clear(
	userId: number = 0,
): Promise<SupervisionResult | undefined>;
```

Clears one or all user code.

**Parameters:**

- `userId`: The user code to clear. If none or 0 is given, all codes are cleared

### `getCapabilities`

```ts
async getCapabilities(): Promise<Pick<UserCodeCCCapabilitiesReport, "supportsAdminCode" | "supportsAdminCodeDeactivation" | "supportsUserCodeChecksum" | "supportsMultipleUserCodeReport" | "supportsMultipleUserCodeSet" | "supportedUserIDStatuses" | "supportedKeypadModes" | "supportedASCIIChars"> | undefined>;
```

### `getKeypadMode`

```ts
async getKeypadMode(): Promise<MaybeNotKnown<KeypadMode>>;
```

### `setKeypadMode`

```ts
async setKeypadMode(
	keypadMode: KeypadMode,
): Promise<SupervisionResult | undefined>;
```

### `getAdminCode`

```ts
async getAdminCode(): Promise<MaybeNotKnown<string>>;
```

### `setAdminCode`

```ts
async setAdminCode(
	adminCode: string,
): Promise<SupervisionResult | undefined>;
```

### `getUserCodeChecksum`

```ts
async getUserCodeChecksum(): Promise<MaybeNotKnown<number>>;
```
