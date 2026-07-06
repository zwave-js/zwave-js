# Door Lock Logging CC

?> CommandClass ID: `0x4c`

## Door Lock Logging CC methods

### `getRecordsCount`

```ts
async getRecordsCount(): Promise<MaybeNotKnown<number>>;
```

### `getRecord`

```ts
async getRecord(
	recordNumber: number = LATEST_RECORD_NUMBER_KEY,
): Promise<MaybeNotKnown<DoorLockLoggingRecord>>;
```

Retrieves the specified audit record. Defaults to the latest one.

## Related types

### `DoorLockLoggingEventType`

```ts
enum DoorLockLoggingEventType {
	LockCode = 0x01,
	UnlockCode = 0x02,
	LockButton = 0x03,
	UnlockButton = 0x04,
	LockCodeOutOfSchedule = 0x05,
	UnlockCodeOutOfSchedule = 0x06,
	IllegalCode = 0x07,
	LockManual = 0x08,
	UnlockManual = 0x09,
	LockAuto = 0x0a,
	UnlockAuto = 0x0b,
	LockRemoteCode = 0x0c,
	UnlockRemoteCode = 0x0d,
	LockRemote = 0x0e,
	UnlockRemote = 0x0f,
	LockRemoteCodeOutOfSchedule = 0x10,
	UnlockRemoteCodeOutOfSchedule = 0x11,
	RemoteIllegalCode = 0x12,
	LockManual2 = 0x13,
	UnlockManual2 = 0x14,
	LockSecured = 0x15,
	LockUnsecured = 0x16,
	UserCodeAdded = 0x17,
	UserCodeDeleted = 0x18,
	AllUserCodesDeleted = 0x19,
	AdminCodeChanged = 0x1a,
	UserCodeChanged = 0x1b,
	LockReset = 0x1c,
	ConfigurationChanged = 0x1d,
	LowBattery = 0x1e,
	NewBattery = 0x1f,
	Unknown = 0x20,
}
```

### `DoorLockLoggingRecord`

```ts
interface DoorLockLoggingRecord {
	timestamp: string;
	eventType: DoorLockLoggingEventType;
	label: string;
	userId?: number;
	userCode?: string | BytesView;
}
```
