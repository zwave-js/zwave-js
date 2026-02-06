# Version CC

?> CommandClass ID: `0x86`

## Version CC methods

### `get`

```ts
async get(): Promise<Pick<VersionCCReport, "libraryType" | "protocolVersion" | "firmwareVersions" | "hardwareVersion"> | undefined>;
```

### `sendReport`

```ts
async sendReport(options: VersionCCReportOptions): Promise<void>;
```

### `getCCVersion`

```ts
async getCCVersion(
	requestedCC: CommandClasses,
): Promise<MaybeNotKnown<number>>;
```

### `reportCCVersion`

```ts
async reportCCVersion(
	requestedCC: CommandClasses,
	version?: number,
): Promise<void>;
```

### `getCapabilities`

```ts
async getCapabilities(): Promise<Pick<VersionCCCapabilitiesReport, "supportsZWaveSoftwareGet"> | undefined>;
```

### `reportCapabilities`

```ts
async reportCapabilities(): Promise<void>;
```

### `getZWaveSoftware`

```ts
async getZWaveSoftware(): Promise<Pick<VersionCCZWaveSoftwareReport, "sdkVersion" | "applicationFrameworkAPIVersion" | "applicationFrameworkBuildNumber" | "hostInterfaceVersion" | "hostInterfaceBuildNumber" | "zWaveProtocolVersion" | "zWaveProtocolBuildNumber" | "applicationVersion" | "applicationBuildNumber"> | undefined>;
```
