# User Credential CC

?> CommandClass ID: `0x83`

## User Credential CC methods

### `getUserCapabilities`

```ts
async getUserCapabilities(): Promise<Pick<UserCredentialCCUserCapabilitiesReport, "numberOfSupportedUsers" | "supportedCredentialRules" | "maxUserNameLength" | "supportsUserSchedule" | "supportsAllUsersChecksum" | "supportsUserChecksum" | "supportedUserNameEncodings" | "supportedUserTypes"> | undefined>;
```

### `getCredentialCapabilities`

```ts
async getCredentialCapabilities(): Promise<Pick<UserCredentialCCCredentialCapabilitiesReport, "supportsCredentialChecksum" | "supportsAdminCode" | "supportsAdminCodeDeactivation" | "credentialTypes"> | undefined>;
```

### `getKeyLockerCapabilities`

```ts
async getKeyLockerCapabilities(): Promise<Map<UserCredentialKeyLockerEntryType, UserCredentialKeyLockerEntryCapability> | undefined>;
```

### `setUser`

```ts
async setUser(
	options: UserCredentialCCUserSetOptions,
): Promise<UserCredentialCCUserReport | undefined>;
```

Applications should not use this method directly. Prefer the
`endpoint.accessControl` API for managing users.

### `getUser`

```ts
async getUser(
	userId: number,
): Promise<UserCredentialCCUserReport | undefined>;
```

Applications should not use this method directly. Prefer the
`endpoint.accessControl` API for querying users.

### `setCredential`

```ts
async setCredential(
	options: UserCredentialCCCredentialSetOptions,
): Promise<UserCredentialCCCredentialReport | undefined>;
```

Applications should not use this method directly. Prefer the
`endpoint.accessControl` API for managing credentials.

### `getCredential`

```ts
async getCredential(
	userId: number,
	credentialType: UserCredentialType,
	credentialSlot: number,
): Promise<UserCredentialCCCredentialReport | undefined>;
```

Applications should not use this method directly. Prefer the
`endpoint.accessControl` API for querying credentials.

### `startCredentialLearn`

```ts
async startCredentialLearn(
	options: UserCredentialCCCredentialLearnStartOptions,
): Promise<SupervisionResult | undefined>;
```

### `cancelCredentialLearn`

```ts
async cancelCredentialLearn(): Promise<
	SupervisionResult | undefined
>;
```

### `setUserCredentialAssociation`

```ts
async setUserCredentialAssociation(
	options: UserCredentialCCAssociationSetOptions,
): Promise<UserCredentialCCAssociationReport | undefined>;
```

Applications should not use this method directly. Prefer the
`endpoint.accessControl` API for reassigning credentials between users.

### `getAllUsersChecksum`

```ts
async getAllUsersChecksum(): Promise<number | undefined>;
```

### `getUserChecksum`

```ts
async getUserChecksum(
	userId: number,
): Promise<number | undefined>;
```

### `getCredentialChecksum`

```ts
async getCredentialChecksum(
	credentialType: UserCredentialType,
): Promise<number | undefined>;
```

### `setAdminPinCode`

```ts
async setAdminPinCode(
	options: UserCredentialCCAdminPinCodeSetOptions,
): Promise<SupervisionResult | undefined>;
```

### `getAdminPinCode`

```ts
async getAdminPinCode(): Promise<string | undefined>;
```

### `setKeyLockerEntry`

```ts
async setKeyLockerEntry(
	options: UserCredentialCCKeyLockerEntrySetOptions,
): Promise<SupervisionResult | undefined>;
```

### `getKeyLockerEntry`

```ts
async getKeyLockerEntry(
	entryType: UserCredentialKeyLockerEntryType,
	entrySlot: number,
): Promise<Pick<UserCredentialCCKeyLockerEntryReport, "occupied" | "entryType" | "entrySlot"> | undefined>;
```

### `sendUserCapabilitiesReport`

```ts
async sendUserCapabilitiesReport(
	options: UserCredentialCCUserCapabilitiesReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialCapabilitiesReport`

```ts
async sendCredentialCapabilitiesReport(
	options: UserCredentialCCCredentialCapabilitiesReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendKeyLockerCapabilitiesReport`

```ts
async sendKeyLockerCapabilitiesReport(
	options: UserCredentialCCKeyLockerCapabilitiesReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendUserReport`

```ts
async sendUserReport(
	options: UserCredentialCCUserReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialReport`

```ts
async sendCredentialReport(
	options: UserCredentialCCCredentialReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialLearnReport`

```ts
async sendCredentialLearnReport(
	options: UserCredentialCCCredentialLearnReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendUserCredentialAssociationReport`

```ts
async sendUserCredentialAssociationReport(
	options: UserCredentialCCAssociationReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendAllUsersChecksumReport`

```ts
async sendAllUsersChecksumReport(
	options: UserCredentialCCAllUsersChecksumReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendUserChecksumReport`

```ts
async sendUserChecksumReport(
	options: UserCredentialCCUserChecksumReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialChecksumReport`

```ts
async sendCredentialChecksumReport(
	options: UserCredentialCCCredentialChecksumReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendAdminPinCodeReport`

```ts
async sendAdminPinCodeReport(
	options: UserCredentialCCAdminPinCodeReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `sendKeyLockerEntryReport`

```ts
async sendKeyLockerEntryReport(
	options: UserCredentialCCKeyLockerEntryReportOptions,
): Promise<SupervisionResult | undefined>;
```
