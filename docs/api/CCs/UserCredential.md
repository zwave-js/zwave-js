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
): Promise<SupervisionResult | undefined>;
```

### `getUser`

```ts
async getUser(userId: number): Promise<Pick<UserCredentialCCUserReport, "nextUserId" | "modifierType" | "modifierNodeId" | "userId" | "userType" | "active" | "credentialRule" | "expiringTimeoutMinutes" | "nameEncoding" | "userName"> | undefined>;
```

### `setCredential`

```ts
async setCredential(
	options: UserCredentialCCCredentialSetOptions,
): Promise<SupervisionResult | undefined>;
```

### `getCredential`

```ts
async getCredential(
	userId: number,
	credentialType: UserCredentialType,
	credentialSlot: number,
): Promise<Pick<UserCredentialCCCredentialReport, "userId" | "credentialType" | "credentialSlot" | "credentialReadBack" | "credentialLength" | "credentialData" | "modifierType" | "modifierNodeId" | "nextCredentialType" | "nextCredentialSlot"> | undefined>;
```

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
	options: UserCredentialCCUserCredentialAssociationSetOptions,
): Promise<SupervisionResult | undefined>;
```

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
	options: UserCredentialCCUserCredentialAssociationReportOptions,
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

## User Credential CC values

### `adminPinCode`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "adminPinCode",
}
```

- **label:** Admin PIN Code
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** true
- **value type:** `"string"`

### `credential(userId: number, type: UserCredentialType, slot: number)`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "credential",
	propertyKey: number,
}
```

- **label:** `Credential (user ${number}, ${string}, slot ${number})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** true
- **value type:** `"buffer"`

### `credentialRule(userId: number)`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "credentialRule",
	propertyKey: number,
}
```

- **label:** `Credential rule (${number})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `expiringTimeoutMinutes(userId: number)`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "expiringTimeoutMinutes",
	propertyKey: number,
}
```

- **label:** `Expiring timeout minutes (${number})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `userActive(userId: number)`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "userActive",
	propertyKey: number,
}
```

- **label:** `Active (${number})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"boolean"`

### `userName(userId: number)`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "userName",
	propertyKey: number,
}
```

- **label:** `User name (${number})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"string"`

### `userType(userId: number)`

```ts
{
	commandClass: CommandClasses["User Credential"],
	endpoint: number,
	property: "userType",
	propertyKey: number,
}
```

- **label:** `User type (${number})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255
