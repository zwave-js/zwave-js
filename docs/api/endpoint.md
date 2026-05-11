# Endpoint

An endpoint represents a physical endpoint of a Z-Wave node. This can either be the root device itself (index 0) or a more specific endpoint like a single plug. Each endpoint may have different capabilities (supported/controlled CCs).

## Endpoint methods

### `supportsCC`

```ts
supportsCC(cc: CommandClasses): boolean
```

This method tests if the current endpoint supports the given command class. It takes the command class ID as a single argument.

### `controlsCC`

```ts
controlsCC(cc: CommandClasses): boolean
```

This method tests if the current endpoint can control the given command class in other devices. It takes the command class ID as a single argument.

### `isCCSecure`

```ts
isCCSecure(cc: CommandClasses): boolean
```

Tests if this endpoint supports or controls the given CC only securely. It takes the command class ID as a single argument.

### `getCCVersion`

```ts
getCCVersion(cc: CommandClasses): number
```

Retrieves the version of the given command class this endpoint implements. Returns 0 if the CC is not supported.

### `createCCInstance`

```ts
createCCInstance<T>(cc: CommandClasses): T | undefined
```

Creates an instance of the given command class. The instance is linked to the current endpoint and node.
The method takes the command class ID as a single argument. You may optionally pass the expected return type as a type parameter.

> [!WARNING]
> You should make sure that the requested command class is implemented by the node. If it neither supported nor controlled, this method will throw.

### `createCCInstanceUnsafe`

```ts
createCCInstanceUnsafe<T>(cc: CommandClasses): T | undefined
```

Like [`createCCInstance`](#createCCInstance) but returns `undefined` instead of throwing when a CC is not supported.

### `tryGetNode`

```ts
tryGetNode(): ZWaveNode | undefined
```

Returns the node this endpoint belongs to (or undefined if the node doesn't exist).

### `invokeCCAPI`

```ts
invokeCCAPI(
	cc: CommandClasses,
	method: string, // any of the CC's methods
	...args: unknown[], // that method's arguments
): Promise<unknown> // that method's return type
```

Allows dynamically calling any CC API method on this endpoint by CC ID and method name. When the CC and/or method name is known this uses a bunch of type magic to show you the the correct arguments depending on the CC and method name you entered.

> [!NOTE] When dealing with statically known CCs, using the [`commandClasses` API](#commandClasses) is recommended instead.

### `supportsCCAPI`

```ts
supportsCCAPI(cc: CommandClasses): boolean
```

Allows checking whether a CC API is supported before calling it with [`invokeCCAPI`](#invokeCCAPI)

## Endpoint properties

### `nodeId`

```ts
readonly nodeId: number
```

The ID of the node this endpoint belongs to.

### `index`

```ts
readonly index: number
```

The index of this endpoint. 0 for the root device, 1+ otherwise.

### `endpointLabel`

```ts
readonly endpointLabel: string | undefined;
```

If the device config file contains a label for this endpoint, it is exposed here.

### `installerIcon`

```ts
readonly installerIcon: number | undefined
```

If the `Z-Wave+` Command Class is supported, this returns the icon to be used for management UIs.

### `userIcon`

```ts
readonly userIcon: number | undefined
```

If the `Z-Wave+` Command Class is supported, this returns the icon to be shown to end users.

### `commandClasses`

```ts
readonly commandClasses(): CCAPIs
```

This property provides access to simplified APIs that are tailored to specific CCs.

Make sure to check support of each API using `API.isSupported()` before using it, since all other API calls will throw if the API is not supported. Example:

```ts
const basicCCApi = endpoint.commandClasses.Basic;
if (basicCCApi.isSupported()) {
	await basicCCApi.set(99);
}
```

The property returns a dictionary of all implemented command class APIs, which basically looks like this:

<!-- TODO: Auto-Generate -->

```ts
interface CCAPIs {
	Basic: BasicCCAPI;
	Battery: BatteryCCAPI;
	"Binary Sensor": BinarySensorCCAPI;
	// ...
}
```

Furthermore, you can enumerate all implemented and supported CC APIs:

```ts
for (const cc of node.commandClasses) {
	// Do something with the API instance
}
```

All CC APIs share the same basic functionality, which is described below. For the description of each CC API, please refer to the [Command Classes documentation](api/CCs/index.md).

## CC API methods

### `isSupported`

```ts
isSupported(): boolean
```

This method determines if the current CC API may be used. If this method returns `false`, accessing CC specific properties and methods will throw an error.

### `setValue`

The `setValue` method is internally called by `Endpoint.setValue`. You shouldn't use this method yourself, and instead use the `setValue` on the `ZWaveNode` instance.

### `withOptions`

```ts
withOptions(options: SendCommandOptions): this
```

Returns an instance of this API which will use the given options for each sent command. Use cases are:

- changing the priority or transmit options of the sent commands
- expiring commands after a given amount of time in the queue
- getting notified of the command progress

#### Example

```ts
// Get the node
const node2 = driver.controller.nodes.getOrThrow(2);

// Create a Basic CC API with low priority whose commands expire 500ms
// after sending if not handled by then
const basicAPI = node2.commandClasses.Basic.withOptions({
	priority: MessagePriority.Poll,
	expire: 500,
});

// Get the current value
const result = await basicAPI.get();

console.log(result);
// { currentValue: 0 }
```

### `withTXReport`

```ts
withTXReport(): WithTXReport<this>
```

Creates an instance of this API which (if supported) will return TX reports along with the result. The CC-specific API methods of this instance like `get`, `set`, etc. will now return an object with the following shape instead of the original return value:

```ts
{
	result?: /* original return value, if any */,
	txReport?: TXReport,
}
```

#### Example

```ts
// Get the node
const node2 = driver.controller.nodes.getOrThrow(2);

// Create a Basic CC API with low priority and TX reports enabled
const basicAPI = node2.commandClasses.Basic.withOptions({
	priority: MessagePriority.Poll,
}).withTXReport();

// Get the current value
const { result, txReport } = await basicAPI.get();

console.log(result);
// { currentValue: 0 }
console.log(txReport);
// {
//   txTicks: 1,
//   numRepeaters: 0,
//   ackRSSI: -58,
//   ackRepeaterRSSI: [],
//   ackChannelNo: 0,
//   txChannelNo: 0,
//   routeSchemeState: 3,
//   repeaterNodeIds: [],
//   beam1000ms: false,
//   beam250ms: false,
//   routeSpeed: 3,
//   routingAttempts: 1,
//   failedRouteLastFunctionalNodeId: 0,
//   failedRouteFirstNonFunctionalNodeId: 0,
//   measuredNoiseFloor: 127,
//   destinationAckMeasuredRSSI: 127,
//   destinationAckMeasuredNoiseFloor: 127
// }
```

> [!NOTE] When a command requires multiple messages (e.g. S0-encapsulated commands), only the last TX report will be returned.

The returned API instance no longer includes the `withOptions` or the `withTXReport` method. To specify additional options, call `withOptions` before `withTXReport`.

> [!WARNING] This method is only supported for CC-specific API implementations. When called on an unspecified `CCAPI` class instance, this will throw. When accessing the CC APIs through the `commandClasses` property, this is not a problem though.

## CC API properties

### `ccId`

```ts
readonly ccId: CommandClasses
```

Returns the command class ID the current API belongs to.

### `version`

```ts
readonly version: number
```

Retrieves the version of the given CommandClass this endpoint implements.

## Credential management

Z-Wave JS provides a unified API for managing users and credentials on access control devices such as door locks. This API transparently supports both the **User Credential CC** and the legacy **User Code CC**, abstracting away the differences between the two.

The credential management API is accessed via the `accessControl` property on endpoints and nodes. The property is `undefined` when the endpoint does not support access control, so use it as the support check:

```ts
if (endpoint.accessControl) {
	const user = await endpoint.accessControl.getUser(1);
}
```

> [!NOTE] For nodes using the **User Code CC**, only a subset of the functionality is available. Each user maps to a single credential of the device's unified credential type, and the unified credential slot matches the user slot. User names and credential rules are not supported, and credential learning is unavailable.
>
> As a result, several of the below APIs have side effects on these devices:
>
> - Adding a credential implicitly creates a user.
> - Deleting one or more credentials implicitly deletes the owning users (and vice versa). Methods that delete users or credentials therefore emit both a `"credential deleted"` and a `"user deleted"` event.
> - `deleteCredentials` rejects when called with a `credentialType` the node does not support.
> - When `deleteCredential` is called without a `userId`, the `slot` is interpreted as the user identifier.

### Querying capabilities

#### `getUserCapabilitiesCached`

```ts
getUserCapabilitiesCached(): UserCapabilities
```

Returns user-related capabilities of the endpoint. This method uses cached information from the most recent interview.

<!-- #import UserCapabilities from "zwave-js" -->

```ts
interface UserCapabilities {
	maxUsers: number;
	supportedUserTypes: readonly UserCredentialUserType[];
	maxUserNameLength: number | undefined;
	supportedCredentialRules: readonly UserCredentialRule[];
}
```

#### `getCredentialCapabilitiesCached`

```ts
getCredentialCapabilitiesCached(): CredentialCapabilities
```

Returns credential-related capabilities of the endpoint. This method uses cached information from the most recent interview.

<!-- #import CredentialCapabilities from "zwave-js" -->

```ts
interface CredentialCapabilities {
	supportedCredentialTypes: ReadonlyMap<
		UserCredentialType,
		UserCredentialCapability
	>;
	supportsAdminCode: boolean;
	supportsAdminCodeDeactivation: boolean;
	/**
	 * Whether existing credentials can be reassigned between users via
	 * {@link AccessControlAPI.assignCredential} without re-enrolling them.
	 */
	supportsCredentialAssignment: boolean;
}
```

`supportsCredentialAssignment` is `true` if existing credentials can be re-assigned between users via [`assignCredential`](#assigncredential) without re-enrolling them. Only supported on nodes using the **User Credential CC**.

Each entry in `supportedCredentialTypes` maps a `UserCredentialType` to its capabilities:

<!-- #import UserCredentialCapability from "@zwave-js/cc" -->

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

### Managing users

#### `getUser`

```ts
getUser(userId: number): Promise<UserData | undefined>
```

Returns the data for the user with the given ID. Returns `undefined` if the user does not exist.

> [!NOTE] This communicates with the node to retrieve fresh information.

#### `getUserCached`

```ts
getUserCached(userId: number): UserData | undefined
```

Returns the data for the user with the given ID. Returns `undefined` if the user does not exist.

> [!NOTE] This method uses cached information from the most recent interview.

<!-- #import UserData from "zwave-js" -->

```ts
interface UserData {
	userId: number;
	active: boolean;
	userType: UserCredentialUserType;
	userName?: string;
	credentialRule?: UserCredentialRule;
	expiringTimeoutMinutes?: number;
}
```

#### `getUsers`

```ts
getUsers(): Promise<UserData[]>
```

Returns the data for all configured users.

> [!NOTE] This communicates with the node to retrieve fresh information.

#### `getUsersCached`

```ts
getUsersCached(): UserData[]
```

Returns the data for all configured users.

> [!NOTE] This method uses cached information from the most recent interview.

#### `setUser`

```ts
setUser(userId: number, options: SetUserOptions): Promise<SupervisionResult | undefined>
```

Creates or updates the user with the given ID. Whether a user is created or modified is determined automatically based on whether the user already exists.

<!-- #import SetUserOptions from "zwave-js" -->

```ts
interface SetUserOptions {
	active?: boolean;
	userType?: UserCredentialUserType;
	userName?: string;
	credentialRule?: UserCredentialRule;
	expiringTimeoutMinutes?: number;
}
```

#### `deleteUser`

```ts
deleteUser(userId: number): Promise<SupervisionResult | undefined>
```

Deletes the user with the given ID and all of their credentials.

#### `deleteAllUsers`

```ts
deleteAllUsers(): Promise<SupervisionResult | undefined>
```

Deletes all users and their credentials.

### Managing credentials

#### `getCredential`

```ts
getCredential(
	type: UserCredentialType,
	slot: number,
): Promise<CredentialData | undefined>
```

Returns the data for a specific credential identified by its type and slot. Returns `undefined` if the credential does not exist. Throws if the credential slot is out of range.

> [!NOTE] This communicates with the node to retrieve fresh information.

#### `getCredentialCached`

```ts
getCredentialCached(
	type: UserCredentialType,
	slot: number,
): CredentialData | undefined
```

Returns the data for a specific credential identified by its type and slot. Returns `undefined` if the credential does not exist. Throws if the credential slot is out of range.

> [!NOTE] This method uses cached information from the most recent interview.

<!-- #import CredentialData from "zwave-js" -->

```ts
interface CredentialData {
	userId: number;
	type: UserCredentialType;
	slot: number;
	data?: string | Uint8Array;
}
```

#### `getCredentialsForUser`

```ts
getCredentialsForUser(
	userId: number,
	type?: UserCredentialType,
): Promise<CredentialData[]>
```

Returns all credentials for the given user, optionally filtered to a specific type.

> [!NOTE] This communicates with the node to retrieve fresh information.

#### `getCredentialsForUserCached`

```ts
getCredentialsForUserCached(
	userId: number,
	type?: UserCredentialType,
): CredentialData[]
```

Returns all credentials for the given user, optionally filtered to a specific type.

> [!NOTE] This method uses cached information from the most recent interview.

#### `getCredentialsByType`

```ts
getCredentialsByType(type: UserCredentialType): Promise<CredentialData[]>
```

Returns all credentials of the given type, regardless of ownership.

> [!NOTE] This communicates with the node to retrieve fresh information.

#### `getCredentialsByTypeCached`

```ts
getCredentialsByTypeCached(type: UserCredentialType): CredentialData[]
```

Returns all credentials of the given type, regardless of ownership.

> [!NOTE] This method uses cached information from the most recent interview.

#### `getAllCredentials`

```ts
getAllCredentials(): Promise<CredentialData[]>
```

Returns all credentials, regardless of ownership or type.

> [!NOTE] This communicates with the node to retrieve fresh information.

#### `getAllCredentialsCached`

```ts
getAllCredentialsCached(): CredentialData[]
```

Returns all credentials, regardless of ownership or type.

> [!NOTE] This method uses cached information from the most recent interview.

#### `setCredential`

```ts
setCredential(
	userId: number,
	type: UserCredentialType,
	slot: number,
	data: string | Uint8Array,
): Promise<SupervisionResult | undefined>
```

Creates or updates a credential for the given user. Whether a credential is created or modified is determined automatically based on whether the credential already exists. Throws if the credential slot is out of range.

#### `deleteCredential`

```ts
deleteCredential(
	type: UserCredentialType,
	slot: number,
): Promise<SetCredentialResult>;
deleteCredential(
	userId: number | undefined,
	type: UserCredentialType,
	slot: number,
): Promise<SetCredentialResult>;
```

Deletes the given credential. Throws if the credential slot is out of range. When a `userId` is given, the credential is only deleted if it belongs to that user.

#### `deleteCredentials`

```ts
deleteCredentials(options?: DeleteCredentialsOptions): Promise<SetCredentialResult>
```

Deletes credentials matching the given filters:

<!-- #import DeleteCredentialsOptions from "zwave-js" without comments -->

```ts
interface DeleteCredentialsOptions {
	/**
	 * Only delete credentials owned by this user. When omitted or `0`, the
	 * filter is treated as a wildcard and credentials for all users are
	 * deleted.
	 */
	userId?: number;
	/**
	 * Only delete credentials of this type. When omitted or
	 * {@link UserCredentialType.None}, the filter is treated as a wildcard and
	 * credentials of all types are deleted.
	 */
	credentialType?: UserCredentialType;
}
```

- When `userId` is omitted or `0`, credentials for all users are deleted.
- When `credentialType` is omitted or `UserCredentialType.None`, credentials of all types are deleted.
- Calling without any filters deletes every credential on the node.

A single [`"credential deleted"`](#quotcredential-deletedquot) event is emitted whose payload echoes the request: omitted filters are reported as `0`.

#### `assignCredential`

```ts
assignCredential(
	type: UserCredentialType,
	slot: number,
	destinationUserId: number,
): Promise<AssignCredentialResult>
```

Re-assigns an existing credential to a different user without re-enrolling it. Useful for credentials that were added locally on the device (e.g. a biometric) and need to be attached to an existing user that already has other credentials.

Only supported on nodes using the **User Credential CC**. Check the `supportsCredentialAssignment` property of [`getCredentialCapabilitiesCached`](#getcredentialcapabilitiescached) before calling. Throws `CC_NotSupported` on nodes that do not support the User Credential CC.

On success, a [`"credential modified"`](#quotcredential-modifiedquot) event is emitted so UIs can stay in sync.

<!-- #import AssignCredentialResult from "zwave-js" -->

```ts
enum AssignCredentialResult {
	OK = 0,
	/** Spec statuses 0x01 / 0x02 / 0x03 — credential type / slot invalid or empty */
	Error_InvalidCredential = 1,
	/** Spec statuses 0x04 / 0x05 — destination user invalid or nonexistent */
	Error_InvalidUser = 2,
	Error_Unknown = 0xff,
}
```

### Credential learning

Some devices support learning credentials directly from user input (e.g. scanning a fingerprint on a biometric lock). This functionality is only available on nodes using the **User Credential CC** and will throw on other nodes.

Whether a credential type supports learning can be determined from the `supportsCredentialLearn` property of its `UserCredentialCapability`.

#### `startCredentialLearn`

```ts
startCredentialLearn(
	userId: number,
	type: UserCredentialType,
	slot: number,
	timeout?: number,
): Promise<SupervisionResult | undefined>
```

Starts a learn process for the given credential slot, allowing a user to input a credential directly on the device. The `timeout` parameter specifies how long (in seconds) the device should wait for the user to input the credential. If omitted, the device's recommended timeout for the credential type is used.

Progress and completion of the learn process are reported through the [`"credential learn progress"`](#quotcredential-learn-progressquot) and [`"credential learn completed"`](#quotcredential-learn-completedquot) events.

#### `cancelCredentialLearn`

```ts
cancelCredentialLearn(): Promise<SupervisionResult | undefined>
```

Cancels an ongoing credential learn process.

### Admin code

Devices that support an admin code allow configuring a code that can be used for administrative functions. Whether this is supported can be determined using `getCredentialCapabilitiesCached()`:

```ts
const caps = endpoint.accessControl.getCredentialCapabilitiesCached();
if (caps?.supportsAdminCode) {
	// Admin code is supported
}
```

#### `getAdminCode`

```ts
getAdminCode(): Promise<string | undefined>
```

Retrieves the admin code from the node.

#### `setAdminCode`

```ts
setAdminCode(code: string): Promise<SupervisionResult | undefined>
```

Sets the admin code on the node.

### Credential management events

The following events are emitted on the `ZWaveNode` instance when users or credentials are changed, either through Z-Wave JS or locally on the device.

#### `"user added"` / `"user modified"`

```ts
(endpoint: Endpoint, args: UserData) => void
```

A user was added or modified. The `args` object contains the user data after the change.

#### `"user deleted"`

```ts
(endpoint: Endpoint, args: UserDeletedArgs) => void
```

A user and all of their credentials were deleted.

<!-- #import UserDeletedArgs from "zwave-js" -->

```ts
interface UserDeletedArgs {
	userId: number;
}
```

#### `"credential added"` / `"credential modified"`

```ts
(endpoint: Endpoint, args: CredentialChangedArgs) => void
```

A credential was added or modified. The `args` object contains the credential data after the change. `"credential modified"` is also emitted when an existing credential is re-assigned to a different user via [`assignCredential`](#assigncredential); in that case `args.data` may be `undefined` because re-assignment does not carry the credential data.

<!-- #import CredentialChangedArgs from "zwave-js" -->

```ts
interface CredentialChangedArgs {
	userId: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	data?: string | Uint8Array;
}
```

#### `"credential deleted"`

```ts
(endpoint: Endpoint, args: CredentialDeletedArgs) => void
```

A credential was deleted.

<!-- #import CredentialDeletedArgs from "zwave-js" -->

```ts
interface CredentialDeletedArgs {
	userId: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
}
```

#### `"credential learn progress"`

```ts
(endpoint: Endpoint, args: CredentialLearnProgressArgs) => void
```

Progress was made during a credential learn process (e.g. one of several fingerprint scans was completed).

<!-- #import CredentialLearnProgressArgs from "zwave-js" -->

```ts
interface CredentialLearnProgressArgs {
	userId: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	stepsRemaining: number;
	status: UserCredentialLearnStatus;
}
```

Progress was made during a credential learn process (e.g. one of several fingerprint scans was completed).

#### `"credential learn completed"`

```ts
(endpoint: Endpoint, args: CredentialLearnCompletedArgs) => void
```

A credential learn process has finished. The `success` property indicates whether the learned credential was stored successfully.

<!-- #import CredentialLearnCompletedArgs from "zwave-js" -->

```ts
interface CredentialLearnCompletedArgs {
	userId: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	status: UserCredentialLearnStatus;
	success: boolean;
}
```

A credential learn process has finished. The `success` property indicates whether the learned credential was stored successfully.

### Credential management enums

#### `UserCredentialType`

<!-- #import UserCredentialType from "@zwave-js/cc" -->

```ts
enum UserCredentialType {
	None = 0x00,
	PINCode = 0x01,
	Password = 0x02,
	RFIDCode = 0x03,
	BLE = 0x04,
	NFC = 0x05,
	UWB = 0x06,
	EyeBiometric = 0x07,
	FaceBiometric = 0x08,
	FingerBiometric = 0x09,
	HandBiometric = 0x0a,
	UnspecifiedBiometric = 0x0b,
	DESFire = 0x0c,
}
```

#### `UserCredentialUserType`

<!-- #import UserCredentialUserType from "@zwave-js/cc" -->

```ts
enum UserCredentialUserType {
	General = 0x00,
	Programming = 0x03,
	NonAccess = 0x04,
	Duress = 0x05,
	Disposable = 0x06,
	Expiring = 0x07,
	RemoteOnly = 0x09,
}
```

#### `UserCredentialRule`

<!-- #import UserCredentialRule from "@zwave-js/cc" -->

```ts
enum UserCredentialRule {
	Single = 0x01,
	Dual = 0x02,
	Triple = 0x03,
}
```

#### `UserCredentialLearnStatus`

<!-- #import UserCredentialLearnStatus from "@zwave-js/cc" -->

```ts
enum UserCredentialLearnStatus {
	Started = 0x00,
	Success = 0x01,
	AlreadyInProgress = 0x02,
	EndedNotDueToTimeout = 0x03,
	Timeout = 0x04,
	StepRetry = 0x05,
	InvalidAddOperationType = 0xfe,
	InvalidModifyOperationType = 0xff,
}
```
