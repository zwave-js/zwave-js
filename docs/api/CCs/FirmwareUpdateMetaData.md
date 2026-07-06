# Firmware Update Meta Data CC

?> CommandClass ID: `0x7a`

## Firmware Update Meta Data CC methods

### `getMetaData`

```ts
async getMetaData(): Promise<MaybeNotKnown<FirmwareUpdateMetaData>>;
```

Requests information about the current firmware on the device.

### `reportMetaData`

```ts
async reportMetaData(
	options: {
		manufacturerId: number;
		firmwareId?: number;
		checksum?: number;
		firmwareUpgradable: boolean;
		maxFragmentSize?: number;
		additionalFirmwareIDs?: readonly number[];
		hardwareVersion?: number;
		continuesToFunction?: MaybeNotKnown<boolean>;
		supportsActivation?: MaybeNotKnown<boolean>;
		supportsResuming?: MaybeNotKnown<boolean>;
		supportsNonSecureTransfer?: MaybeNotKnown<boolean>;
	},
): Promise<void>;
```

### `requestUpdate`

```ts
requestUpdate(
	options: {
		manufacturerId: number;
		firmwareId: number;
		checksum: number;
	},
): Promise<FirmwareUpdateMetaDataCCRequestReport | undefined>;

requestUpdate(
	options: {
		manufacturerId: number;
		firmwareId: number;
		checksum: number;
		// V3+
		firmwareTarget: number;
		fragmentSize: number;
		// V4+
		activation?: boolean;
		// V5+
		hardwareVersion?: number;
		// V8+
		resume?: boolean;
		nonSecureTransfer?: boolean;
	},
): Promise<FirmwareUpdateMetaDataCCRequestReport | undefined>;
```

Requests the device to start the firmware update process and waits for a response.
This response may time out on some devices, in which case the caller of this method
should wait manually.

### `respondToUpdateRequest`

```ts
async respondToUpdateRequest(
	options: {
		status: FirmwareUpdateRequestStatus;
		resume?: boolean;
		nonSecureTransfer?: boolean;
	},
): Promise<void>;
```

Responds to a firmware update request.

### `respondToDownloadRequest`

```ts
async respondToDownloadRequest(
	options: {
		status: FirmwareDownloadStatus;
		checksum: number;
	},
): Promise<void>;
```

Responds to a firmware download request.

### `sendFirmwareFragment`

```ts
async sendFirmwareFragment(
	fragmentNumber: number,
	isLastFragment: boolean,
	data: BytesView,
): Promise<void>;
```

Sends a fragment of the new firmware to the device.

### `activateFirmware`

```ts
async activateFirmware(
	options: {
		manufacturerId: number;
		firmwareId: number;
		checksum: number;
		firmwareTarget: number;
		// V5+
		hardwareVersion?: number;
	},
): Promise<MaybeNotKnown<FirmwareUpdateActivationStatus>>;
```

Activates a previously transferred firmware image.

## Related types

### `FirmwareDownloadStatus`

```ts
enum FirmwareDownloadStatus {
	Error_InvalidManufacturerOrFirmwareID = 0,
	Error_AuthenticationExpected = 1,
	Error_FragmentSizeTooLarge = 2,
	Error_NotDownloadable = 3,
	Error_InvalidHardwareVersion = 4,
	OK = 0xff,
}
```

### `FirmwareUpdateActivationStatus`

```ts
enum FirmwareUpdateActivationStatus {
	Error_InvalidFirmware = 0,
	Error_ActivationFailed = 1,
	OK = 0xff,
}
```

### `FirmwareUpdateMetaData`

```ts
interface FirmwareUpdateMetaData {
	manufacturerId: number;
	firmwareId: number;
	checksum: number;
	firmwareUpgradable: boolean;
	maxFragmentSize?: number;
	additionalFirmwareIDs: readonly number[];
	hardwareVersion?: number;
	continuesToFunction: MaybeNotKnown<boolean>;
	supportsActivation: MaybeNotKnown<boolean>;
	supportsResuming?: MaybeNotKnown<boolean>;
	supportsNonSecureTransfer?: MaybeNotKnown<boolean>;
}
```

### `FirmwareUpdateMetaDataCCRequestReport`

```ts
interface FirmwareUpdateMetaDataCCRequestReport {
	readonly status: FirmwareUpdateRequestStatus;
	resume?: boolean;
	nonSecureTransfer?: boolean;
}
```

### `FirmwareUpdateRequestStatus`

```ts
enum FirmwareUpdateRequestStatus {
	Error_InvalidManufacturerOrFirmwareID = 0,
	Error_AuthenticationExpected = 1,
	Error_FragmentSizeTooLarge = 2,
	Error_NotUpgradable = 3,
	Error_InvalidHardwareVersion = 4,
	Error_FirmwareUpgradeInProgress = 5,
	Error_BatteryLow = 6,
	OK = 0xff,
}
```
