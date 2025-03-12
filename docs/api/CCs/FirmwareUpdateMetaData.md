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
	options: FirmwareUpdateMetaDataCCMetaDataReportOptions,
): Promise<void>;
```

### `requestUpdate`

```ts
requestUpdate(
	options: FirmwareUpdateMetaDataCCRequestGetOptions,
): Promise<FirmwareUpdateMetaDataCCRequestReport | undefined>;
```

Requests the device to start the firmware update process and waits for a response.
This response may time out on some devices, in which case the caller of this method
should wait manually.

### `respondToUpdateRequest`

```ts
async respondToUpdateRequest(
	options: FirmwareUpdateMetaDataCCRequestReportOptions,
): Promise<void>;
```

Responds to a firmware update request.

### `respondToDownloadRequest`

```ts
async respondToDownloadRequest(
	options: FirmwareUpdateMetaDataCCPrepareReportOptions,
): Promise<void>;
```

Responds to a firmware download request.

### `sendFirmwareFragment`

```ts
async sendFirmwareFragment(
	fragmentNumber: number,
	isLastFragment: boolean,
	data: Uint8Array,
): Promise<void>;
```

Sends a fragment of the new firmware to the device.

### `activateFirmware`

```ts
async activateFirmware(
	options: FirmwareUpdateMetaDataCCActivationSetOptions,
): Promise<MaybeNotKnown<FirmwareUpdateActivationStatus>>;
```

Activates a previously transferred firmware image.
