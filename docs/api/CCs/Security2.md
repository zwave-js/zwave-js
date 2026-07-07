# Security 2 CC

?> CommandClass ID: `0x9f`

## Security 2 CC methods

### `sendNonce`

```ts
async sendNonce(): Promise<boolean>;
```

Sends a nonce to the node, either in response to a NonceGet request or a message that failed to decrypt. The message is sent without any retransmission etc.
The return value indicates whether a nonce was successfully sent.

### `sendMOS`

```ts
async sendMOS(): Promise<boolean>;
```

Notifies the target node that the MPAN state is out of sync.

### `sendMPAN`

```ts
async sendMPAN(
	groupId: number,
	innerMPANState: BytesView,
): Promise<boolean>;
```

Sends the given MPAN to the node.

### `getSupportedCommands`

```ts
async getSupportedCommands(
	securityClass:
		| SecurityClass.S2_AccessControl
		| SecurityClass.S2_Authenticated
		| SecurityClass.S2_Unauthenticated,
): Promise<MaybeNotKnown<CommandClasses[]>>;
```

Queries the securely supported commands for the current security class.

**Parameters:**

- `securityClass`: Can be used to overwrite the security class to use. If this doesn't match the current one, new nonces will need to be exchanged.

### `reportSupportedCommands`

```ts
async reportSupportedCommands(
	supportedCCs: CommandClasses[],
): Promise<void>;
```

### `getKeyExchangeParameters`

```ts
async getKeyExchangeParameters(): Promise<
	{
		echo: boolean;
		requestCSA: boolean;
		requestedKeys: readonly SecurityClass[];
		supportedECDHProfiles: readonly ECDHProfiles[];
		supportedKEXSchemes: readonly KEXSchemes[];
	} | undefined
>;
```

### `requestKeys`

```ts
async requestKeys(
	params: {
		requestCSA: boolean;
		requestedKeys: SecurityClass[];
		supportedECDHProfiles: ECDHProfiles[];
		supportedKEXSchemes: KEXSchemes[];
	},
): Promise<void>;
```

Requests the given keys from an including node.

### `grantKeys`

```ts
async grantKeys(
	params: {
		grantedKeys: SecurityClass[];
		permitCSA: boolean;
		selectedECDHProfile: ECDHProfiles;
		selectedKEXScheme: KEXSchemes;
	},
): Promise<void>;
```

Grants the joining node the given keys.

### `confirmRequestedKeys`

```ts
async confirmRequestedKeys(
	params: {
		requestCSA: boolean;
		requestedKeys: SecurityClass[];
		supportedECDHProfiles: ECDHProfiles[];
		supportedKEXSchemes: KEXSchemes[];
	},
): Promise<void>;
```

Confirms the keys that were requested by a node.

### `confirmGrantedKeys`

```ts
async confirmGrantedKeys(
	params: {
		grantedKeys: SecurityClass[];
		permitCSA: boolean;
		selectedECDHProfile: ECDHProfiles;
		selectedKEXScheme: KEXSchemes;
	},
): Promise<Security2CCKEXReport | Security2CCKEXFail | undefined>;
```

Confirms the keys that were granted by the including node.

### `abortKeyExchange`

```ts
async abortKeyExchange(failType: KEXFailType): Promise<void>;
```

Notifies the other node that the ongoing key exchange was aborted.

### `sendPublicKey`

```ts
async sendPublicKey(
	publicKey: BytesView,
	includingNode: boolean = true,
): Promise<void>;
```

### `requestNetworkKey`

```ts
async requestNetworkKey(
	securityClass: SecurityClass,
): Promise<void>;
```

### `sendNetworkKey`

```ts
async sendNetworkKey(
	securityClass: SecurityClass,
	networkKey: BytesView,
): Promise<void>;
```

### `verifyNetworkKey`

```ts
async verifyNetworkKey(): Promise<void>;
```

### `confirmKeyVerification`

```ts
async confirmKeyVerification(): Promise<void>;
```

### `endKeyExchange`

```ts
async endKeyExchange(): Promise<void>;
```

## Related types

### `ECDHProfiles`

```ts
enum ECDHProfiles {
	Curve25519 = 0,
}
```

### `KEXFailType`

```ts
enum KEXFailType {
	NoKeyMatch = 0x01, // KEX_KEY
	NoSupportedScheme = 0x02, // KEX_SCHEME
	NoSupportedCurve = 0x03, // KEX_CURVES
	Decrypt = 0x05,
	BootstrappingCanceled = 0x06, // CANCEL
	WrongSecurityLevel = 0x07, // AUTH
	KeyNotGranted = 0x08, // GET
	NoVerify = 0x09, // VERIFY
	DifferentKey = 0x0a, // REPORT
}
```

### `KEXSchemes`

```ts
enum KEXSchemes {
	KEXScheme1 = 1,
}
```

### `Security2CCKEXFail`

```ts
interface Security2CCKEXFail {
	failType: KEXFailType;
}
```

### `Security2CCKEXReport`

```ts
interface Security2CCKEXReport {
	readonly requestCSA: boolean;
	readonly echo: boolean;
	readonly supportedKEXSchemes: readonly KEXSchemes[];
	readonly supportedECDHProfiles: readonly ECDHProfiles[];
	readonly requestedKeys: readonly SecurityClass[];
}
```
