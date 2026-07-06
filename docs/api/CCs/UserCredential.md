# User Credential CC

?> CommandClass ID: `0x83`

## User Credential CC methods

### `getUserCapabilities`

```ts
async getUserCapabilities(): Promise<
	{
		maxUserNameLength: number;
		numberOfSupportedUsers: number;
		supportedCredentialRules: UserCredentialRule[];
		supportedUserNameEncodings: UserCredentialNameEncoding[];
		supportedUserTypes: UserCredentialUserType[];
		supportsAllUsersChecksum: boolean;
		supportsUserChecksum: boolean;
		supportsUserSchedule: boolean;
	} | undefined
>;
```

### `getCredentialCapabilities`

```ts
async getCredentialCapabilities(): Promise<
	{
		credentialTypes: Map<UserCredentialType, UserCredentialCapability>;
		supportsAdminCode: boolean;
		supportsAdminCodeDeactivation: boolean;
		supportsCredentialChecksum: boolean;
	} | undefined
>;
```

### `getKeyLockerCapabilities`

```ts
async getKeyLockerCapabilities(): Promise<
	Map<
		UserCredentialKeyLockerEntryType,
		UserCredentialKeyLockerEntryCapability
	> | undefined
>;
```

### `setUser`

```ts
async setUser(
	options: {
		userId: number;
		operationType:
			| UserCredentialOperationType.Add
			| UserCredentialOperationType.Modify;
		active?: boolean;
		credentialRule?: UserCredentialRule;
		nameEncoding?: UserCredentialNameEncoding;
		userName?: string;
		userType: UserCredentialUserType.Expiring;
		expiringTimeoutMinutes: number;
	},
): Promise<UserCredentialCCUserReport | undefined>;

async setUser(
	options: {
		userId: number;
		operationType:
			| UserCredentialOperationType.Add
			| UserCredentialOperationType.Modify;
		active?: boolean;
		credentialRule?: UserCredentialRule;
		nameEncoding?: UserCredentialNameEncoding;
		userName?: string;
		userType?: Exclude<
			UserCredentialUserType,
			UserCredentialUserType.Expiring
		>;
	},
): Promise<UserCredentialCCUserReport | undefined>;

async setUser(
	options: {
		userId: number;
		operationType: UserCredentialOperationType.Delete;
	},
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
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		operationType:
			| UserCredentialOperationType.Add
			| UserCredentialOperationType.Modify;
		credentialData: Bytes;
	},
): Promise<UserCredentialCCCredentialReport | undefined>;

async setCredential(
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		operationType: UserCredentialOperationType.Delete;
	},
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
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		operationType: UserCredentialOperationType;
		learnTimeout: number;
	},
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
	options: {
		credentialType: UserCredentialType;
		credentialSlot: number;
		destinationUserId: number;
	},
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
	options: {
		pinCode: string;
	},
): Promise<SupervisionResult | undefined>;
```

### `getAdminPinCode`

```ts
async getAdminPinCode(): Promise<string | undefined>;
```

### `setKeyLockerEntry`

```ts
async setKeyLockerEntry(
	options: {
		entryType: UserCredentialKeyLockerEntryType;
		entrySlot: number;
		operationType:
			| UserCredentialOperationType.Add
			| UserCredentialOperationType.Modify;
		entryData: Bytes;
	},
): Promise<SupervisionResult | undefined>;

async setKeyLockerEntry(
	options: {
		entryType: UserCredentialKeyLockerEntryType;
		entrySlot: number;
		operationType: UserCredentialOperationType.Delete;
	},
): Promise<SupervisionResult | undefined>;
```

### `getKeyLockerEntry`

```ts
async getKeyLockerEntry(
	entryType: UserCredentialKeyLockerEntryType,
	entrySlot: number,
): Promise<
	{
		entrySlot: number;
		entryType: UserCredentialKeyLockerEntryType;
		occupied: boolean;
	} | undefined
>;
```

### `sendUserCapabilitiesReport`

```ts
async sendUserCapabilitiesReport(
	options: {
		numberOfSupportedUsers: number;
		supportedCredentialRules: UserCredentialRule[];
		maxUserNameLength: number;
		supportsUserSchedule: boolean;
		supportsAllUsersChecksum: boolean;
		supportsUserChecksum: boolean;
		supportedUserNameEncodings: UserCredentialNameEncoding[];
		supportedUserTypes: UserCredentialUserType[];
	},
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialCapabilitiesReport`

```ts
async sendCredentialCapabilitiesReport(
	options: {
		supportsCredentialChecksum: boolean;
		supportsAdminCode: boolean;
		supportsAdminCodeDeactivation: boolean;
		credentialTypes: Map<UserCredentialType, UserCredentialCapability>;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendKeyLockerCapabilitiesReport`

```ts
async sendKeyLockerCapabilitiesReport(
	options: {
		keyLockerCapabilities: Map<
			UserCredentialKeyLockerEntryType,
			UserCredentialKeyLockerEntryCapability
		>;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendUserReport`

```ts
async sendUserReport(
	options: {
		modifierType: UserCredentialModifierType;
		modifierNodeId: number;
		userId: number;
		userType: UserCredentialUserType;
		active: boolean;
		credentialRule: UserCredentialRule;
		expiringTimeoutMinutes: number;
		nameEncoding: UserCredentialNameEncoding;
		userName: string;
		reportType: UserCredentialUserReportType.ResponseToGet;
		nextUserId: number;
	},
): Promise<SupervisionResult | undefined>;

async sendUserReport(
	options: {
		modifierType: UserCredentialModifierType;
		modifierNodeId: number;
		userId: number;
		userType: UserCredentialUserType;
		active: boolean;
		credentialRule: UserCredentialRule;
		expiringTimeoutMinutes: number;
		nameEncoding: UserCredentialNameEncoding;
		userName: string;
		reportType: Exclude<
			UserCredentialUserReportType,
			UserCredentialUserReportType.ResponseToGet
		>;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialReport`

```ts
async sendCredentialReport(
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		modifierType: UserCredentialModifierType;
		modifierNodeId: number;
		credentialReadBack: true;
		credentialData: Bytes;
		reportType: UserCredentialCredentialReportType.ResponseToGet;
		nextCredentialType: UserCredentialType;
		nextCredentialSlot: number;
	},
): Promise<SupervisionResult | undefined>;

async sendCredentialReport(
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		modifierType: UserCredentialModifierType;
		modifierNodeId: number;
		credentialReadBack: true;
		credentialData: Bytes;
		reportType: Exclude<
			UserCredentialCredentialReportType,
			UserCredentialCredentialReportType.ResponseToGet
		>;
	},
): Promise<SupervisionResult | undefined>;

async sendCredentialReport(
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		modifierType: UserCredentialModifierType;
		modifierNodeId: number;
		credentialReadBack: false;
		reportType: UserCredentialCredentialReportType.ResponseToGet;
		nextCredentialType: UserCredentialType;
		nextCredentialSlot: number;
	},
): Promise<SupervisionResult | undefined>;

async sendCredentialReport(
	options: {
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		modifierType: UserCredentialModifierType;
		modifierNodeId: number;
		credentialReadBack: false;
		reportType: Exclude<
			UserCredentialCredentialReportType,
			UserCredentialCredentialReportType.ResponseToGet
		>;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialLearnReport`

```ts
async sendCredentialLearnReport(
	options: {
		learnStatus: UserCredentialLearnStatus;
		userId: number;
		credentialType: UserCredentialType;
		credentialSlot: number;
		stepsRemaining: number;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendUserCredentialAssociationReport`

```ts
async sendUserCredentialAssociationReport(
	options: {
		credentialType: UserCredentialType;
		credentialSlot: number;
		destinationUserId: number;
		status: number;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendAllUsersChecksumReport`

```ts
async sendAllUsersChecksumReport(
	options: {
		checksum: number;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendUserChecksumReport`

```ts
async sendUserChecksumReport(
	options: {
		userId: number;
		checksum: number;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendCredentialChecksumReport`

```ts
async sendCredentialChecksumReport(
	options: {
		credentialType: UserCredentialType;
		checksum: number;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendAdminPinCodeReport`

```ts
async sendAdminPinCodeReport(
	options: {
		operationResult: UserCredentialAdminCodeOperationResult;
		pinCode: string;
	},
): Promise<SupervisionResult | undefined>;
```

### `sendKeyLockerEntryReport`

```ts
async sendKeyLockerEntryReport(
	options: {
		occupied: boolean;
		entryType: UserCredentialKeyLockerEntryType;
		entrySlot: number;
	},
): Promise<SupervisionResult | undefined>;
```

## Related types

### `UserCredentialAdminCodeOperationResult`

```ts
enum UserCredentialAdminCodeOperationResult {
	Modified = 0x01,
	Unmodified = 0x03,
	ResponseToGet = 0x04,
	FailDuplicateCredential = 0x07,
	FailManufacturerSecurityRule = 0x08,
	ErrorNotSupported = 0x0d,
	ErrorDisablingNotSupported = 0x0e,
	UnspecifiedNodeError = 0x0f,
}
```

### `UserCredentialCapability`

```ts
type UserCredentialCapability =
	& {
		numberOfCredentialSlots: number;
		minCredentialLength: number;
		maxCredentialLength: number;
		maxCredentialHashLength: number;
	}
	& (
		{
			supportsCredentialLearn: true;
			credentialLearnRecommendedTimeout: number;
			credentialLearnNumberOfSteps: number;
		} | {
			supportsCredentialLearn: false;
			credentialLearnRecommendedTimeout?: undefined;
			credentialLearnNumberOfSteps?: undefined;
		}
	);
```

### `UserCredentialCCAssociationReport`

```ts
interface UserCredentialCCAssociationReport {
	readonly credentialType: UserCredentialType;
	readonly credentialSlot: number;
	readonly destinationUserId: number;
	readonly status: number;
}
```

### `UserCredentialCCCredentialReport`

```ts
interface UserCredentialCCCredentialReport {
	readonly reportType: UserCredentialCredentialReportType;
	readonly userId: number;
	readonly credentialType: UserCredentialType;
	readonly credentialSlot: number;
	readonly credentialReadBack: boolean;
	readonly credentialData?: any;
	readonly modifierType: UserCredentialModifierType;
	readonly modifierNodeId: number;
	readonly nextCredentialType?: any;
	readonly nextCredentialSlot?: number;
}
```

### `UserCredentialCCUserReport`

```ts
interface UserCredentialCCUserReport {
	readonly reportType: UserCredentialUserReportType;
	readonly nextUserId?: number;
	readonly modifierType: UserCredentialModifierType;
	readonly modifierNodeId: number;
	readonly userId: number;
	readonly userType: UserCredentialUserType;
	readonly active: boolean;
	readonly credentialRule: UserCredentialRule;
	readonly expiringTimeoutMinutes: number;
	readonly nameEncoding: UserCredentialNameEncoding;
	readonly userName: string;
}
```

### `UserCredentialCredentialReportType`

```ts
enum UserCredentialCredentialReportType {
	CredentialAdded = 0x00,
	CredentialModified = 0x01,
	CredentialDeleted = 0x02,
	CredentialUnchanged = 0x03,
	ResponseToGet = 0x04,
	CredentialAddRejectedLocationOccupied = 0x05,
	CredentialModifyRejectedLocationEmpty = 0x06,
	DuplicateCredential = 0x07,
	ManufacturerSecurityRules = 0x08,
	WrongUserUniqueIdentifier = 0x09,
	DuplicateAdminPINCode = 0x0a,
}
```

### `UserCredentialKeyLockerEntryCapability`

```ts
interface UserCredentialKeyLockerEntryCapability {
	numberOfEntrySlots: number;
	minEntryDataLength: number;
	maxEntryDataLength: number;
}
```

### `UserCredentialKeyLockerEntryType`

```ts
enum UserCredentialKeyLockerEntryType {
	DESFireApplicationIdAndKey = 0x01,
}
```

### `UserCredentialModifierType`

```ts
enum UserCredentialModifierType {
	DoesNotExist = 0x00,
	Unknown = 0x01,
	ZWave = 0x02,
	Locally = 0x03,
	Other = 0x04,
}
```

### `UserCredentialNameEncoding`

```ts
enum UserCredentialNameEncoding {
	ASCII = 0x00,
	ExtendedASCII = 0x01,
	UTF16BE = 0x02,
}
```

### `UserCredentialOperationType`

```ts
enum UserCredentialOperationType {
	Add = 0x00,
	Modify = 0x01,
	Delete = 0x02,
}
```

### `UserCredentialUserReportType`

```ts
enum UserCredentialUserReportType {
	UserAdded = 0x00,
	UserModified = 0x01,
	UserDeleted = 0x02,
	UserUnchanged = 0x03,
	ResponseToGet = 0x04,
	UserAddRejectedLocationOccupied = 0x05,
	UserModifyRejectedLocationEmpty = 0x06,
	ZeroExpiringMinutesInvalid = 0x07,
}
```
