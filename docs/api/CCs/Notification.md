# Notification CC

?> CommandClass ID: `0x71`

## Notification CC methods

### `getInternal`

```ts
async getInternal(
	options: {
		alarmType: number;
	},
): Promise<NotificationCCReport | undefined>;

async getInternal(
	options: {
		notificationType: number;
		notificationEvent?: number;
	},
): Promise<NotificationCCReport | undefined>;
```

.

### `sendReport`

```ts
async sendReport(
	options: {
		alarmType?: number;
		alarmLevel?: number;
		notificationType?: number;
		notificationEvent?: number;
		notificationStatus?: number;
		eventParameters?: BytesView;
		sequenceNumber?: number;
	},
): Promise<SupervisionResult | undefined>;
```

### `get`

```ts
async get(options: {
	alarmType: number;
}): Promise<
	{
		alarmLevel?: number;
		eventParameters?:
			| number
			| BytesView
			| Duration
			| Record<string, number>;
		notificationEvent?: number;
		notificationStatus?: number | boolean;
		sequenceNumber?: number;
	} | undefined
>;

async get(options: {
	notificationType: number;
	notificationEvent?: number;
}): Promise<
	{
		alarmLevel?: number;
		eventParameters?:
			| number
			| BytesView
			| Duration
			| Record<string, number>;
		notificationEvent?: number;
		notificationStatus?: number | boolean;
		sequenceNumber?: number;
	} | undefined
>;
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
async getSupported(): Promise<
	{
		supportedNotificationTypes: number[];
		supportsV1Alarm: boolean;
	} | undefined
>;
```

### `getSupportedEvents`

```ts
async getSupportedEvents(
	notificationType: number,
): Promise<MaybeNotKnown<readonly number[]>>;
```

## Notification CC values

### `alarmLevel`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: "alarmLevel",
}
```

- **label:** Alarm Level
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `alarmType`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: "alarmType",
}
```

- **label:** Alarm Type
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `deprecated_doorStateSimple`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: "Access Control",
	propertyKey: "Door state (simple)",
}
```

- **label:** Door state (simple)
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `deprecated_doorTiltState`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: "Access Control",
	propertyKey: "Door tilt state",
}
```

- **label:** Door tilt state
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `notificationVariable(notificationName: string, variableName: string)`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: string,
	propertyKey: string,
}
```

- **min. CC version:** 1
- **readable:** true
- **writeable:** true
- **stateful:** true
- **secret:** false
- **value type:** `"any"`

### `openingState`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: "Access Control",
	propertyKey: "Opening state",
}
```

- **label:** Opening state
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `unknownNotificationType(notificationType: number)`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: string,
}
```

- **label:** `Unknown notification (${string})`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

### `unknownNotificationVariable(notificationType: number, notificationName: string)`

```ts
{
	commandClass: CommandClasses.Notification,
	endpoint: number,
	property: string,
	propertyKey: "unknown",
}
```

- **label:** `${string}: Unknown value`
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 255

## Related types

### `NotificationCCReport`

```ts
interface NotificationCCReport {
	alarmType: number | undefined;
	alarmLevel: number | undefined;
	notificationType: number | undefined;
	notificationStatus: number | boolean | undefined;
	notificationEvent: number | undefined;
	eventParameters: any;
	sequenceNumber: number | undefined;
}
```
