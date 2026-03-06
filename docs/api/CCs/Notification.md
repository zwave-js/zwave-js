# Notification CC

?> CommandClass ID: `0x71`

## Notification CC methods

### `getInternal`

```ts
async getInternal(
	options: NotificationCCGetOptions,
): Promise<NotificationCCReport | undefined>;
```

.

### `sendReport`

```ts
async sendReport(
	options: NotificationCCReportOptions,
): Promise<SupervisionResult | undefined>;
```

### `get`

```ts
async get(options: NotificationCCGetOptions): Promise<Pick<NotificationCCReport, "notificationStatus" | "notificationEvent" | "alarmLevel" | "eventParameters" | "sequenceNumber"> | undefined>;
```

### `set`

```ts
async set(
	notificationType: number,
	notificationStatus: boolean,
): Promise<SupervisionResult | undefined>;
```

### `getSupported`

```ts
async getSupported(): Promise<Pick<NotificationCCSupportedReport, "supportsV1Alarm" | "supportedNotificationTypes"> | undefined>;
```

### `getSupportedEvents`

```ts
async getSupportedEvents(
	notificationType: number,
): Promise<MaybeNotKnown<readonly number[]>>;
```
