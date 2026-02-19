# Sound Switch CC

?> CommandClass ID: `0x79`

## Sound Switch CC methods

### `getToneCount`

```ts
async getToneCount(): Promise<MaybeNotKnown<number>>;
```

### `getToneInfo`

```ts
async getToneInfo(toneId: number): Promise<Pick<SoundSwitchCCToneInfoReport, "duration" | "name"> | undefined>;
```

### `setConfiguration`

```ts
async setConfiguration(
	defaultToneId: number,
	defaultVolume?: number,
): Promise<SupervisionResult | undefined>;

async setConfiguration(
	defaultToneId: number | undefined,
	defaultVolume: number,
): Promise<SupervisionResult | undefined>;
```

### `getConfiguration`

```ts
async getConfiguration(): Promise<Pick<SoundSwitchCCConfigurationReport, "defaultToneId" | "defaultVolume"> | undefined>;
```

### `play`

```ts
async play(
	toneId: number,
	volume?: number,
): Promise<SupervisionResult | undefined>;
```

### `stopPlaying`

```ts
async stopPlaying(): Promise<SupervisionResult | undefined>;
```

### `getPlaying`

```ts
async getPlaying(): Promise<Pick<SoundSwitchCCTonePlayReport, "toneId" | "volume"> | undefined>;
```
