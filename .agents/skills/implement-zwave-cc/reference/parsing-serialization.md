# Parsing and Serialization Patterns

Detailed patterns for parsing incoming payloads and serializing outgoing commands.

## Table of Contents

- [Helper Functions](#helper-functions-for-parsingencoding)
- [Offset Handling](#offset-handling)
- [Binary Literals for Bitmasks](#binary-literals-for-bitmasks)
- [Serialize Buffer Management](#serialize-buffer-management)
- [Validation Patterns](#validation-patterns)

---

## Helper Functions for Parsing/Encoding

Abstract repeated byte sequences into local helpers:

```typescript
/**
 * Parses a date from the given buffer at the given location.
 * @returns The date components and the number of bytes read.
 */
function parseDate(
	payload: BytesView,
	offset: number = 0,
): { date: ScheduleDate; bytesRead: number } {
	validatePayload(payload.length >= offset + 6);
	const view = Bytes.view(payload);
	return {
		date: {
			year: view.readUInt16BE(offset),
			month: view.readUInt8(offset + 2),
			day: view.readUInt8(offset + 3),
			hour: view.readUInt8(offset + 4),
			minute: view.readUInt8(offset + 5),
		},
		bytesRead: 6,
	};
}

/**
 * Writes a date into the given buffer at the given location.
 * @returns The number of bytes written.
 */
function encodeDate(
	date: ScheduleDate,
	payload: Bytes,
	offset: number = 0,
): number {
	payload.writeUInt16BE(date.year, offset);
	payload.writeUInt8(date.month, offset + 2);
	payload.writeUInt8(date.day, offset + 3);
	payload.writeUInt8(date.hour, offset + 4);
	payload.writeUInt8(date.minute, offset + 5);
	return 6;
}
```

**Key principles:**

- Parse functions return `{ value, bytesRead }` (following `parseCCId` convention)
- Encode functions return bytes written
- Move validation INTO parse functions - they validate payload length themselves
- Keep abstractions local to the CC file when CC-specific
- Use destructuring at call site: `const { date: startDate, bytesRead } = parseDate(...)`

---

## Offset Handling

Use `offset++` for cleaner code:

```typescript
// Good - increment as you go
const flags = raw.payload[offset++];
const nextByte = raw.payload[offset++];

// Avoid - hardcoded offsets
const flags = raw.payload[offset];
const nextByte = raw.payload[offset + 1];
offset += 2;
```

---

## Binary Literals for Bitmasks

Use binary literals for clarity:

```typescript
// Good
const enabled = !!(flags & 0b1);
const reason = (flags >> 1) & 0b111;
this.payload[offset++] = ((reason & 0b111) << 1) | (enabled ? 0b1 : 0);

// Avoid
const enabled = !!(flags & 0x01);
const reason = (flags >> 1) & 0x07;
```

---

## Serialize Buffer Management

### Static Payloads

When all fields have fixed sizes, use `Bytes.from()` or `Bytes.concat()`:

```typescript
public serialize(ctx: CCEncodingContext): Promise<Bytes> {
    this.payload = Bytes.from([
        this.weekday,
        this.startHour,
        this.startMinute,
        this.durationHour,
        this.durationMinute,
        0, // no metadata
    ]);
    return super.serialize(ctx);
}
```

Prefer `Bytes.from()` or `Bytes.concat()` over individually setting fields.

**Reference:** See `ColorSwitchCC.ts`, `MultilevelSensorCC.ts`, `ScheduleEntryLockCCDailyRepeatingScheduleSet` for static payload examples.

### Dynamic Payloads

When fields have variable length (e.g., extended CC IDs, optional metadata), allocate max size, track offset, trim at end:

```typescript
public serialize(ctx: CCEncodingContext): Promise<Bytes> {
    const metadataLength = this.metadata?.length ?? 0;
    // Allocate maximum possible size
    this.payload = new Bytes(20 + metadataLength);

    let offset = 0;
    this.payload[offset++] = this.action & 0b11;
    // Extended CC IDs can be 1 or 2 bytes
    offset += encodeCCId(this.targetCC, this.payload, offset);
    this.payload.writeUInt16BE(this.targetId, offset);
    offset += 2;

    if (this.action === SetAction.Modify) {
        offset += encodeDate(this.startDate!, this.payload, offset);
        // ... more fields
    }

    // Trim to actual size
    this.payload = this.payload.subarray(0, offset);
    return super.serialize(ctx);
}
```

---

## Validation Patterns

### Minimal Validation Before Self-Validating Functions

Don't over-validate. If calling a function like `parseCCId` that validates internally, only check bytes needed before that call:

```typescript
public static from(raw: CCRaw, ctx: CCParsingContext): MyReport {
    // Only check for the first byte we need
    validatePayload(raw.payload.length >= 1);
    const action = raw.payload[0] & 0b11;

    // parseCCId validates its own requirements
    const { ccId: targetCC, bytesRead: ccBytes } = parseCCId(raw.payload, 1);
    let offset = 1 + ccBytes;

    // Now validate remaining required fields
    validatePayload(raw.payload.length >= offset + 4);
    const targetId = raw.payload.readUInt16BE(offset);
    offset += 2;
    // ...
}
```

### Guard Variable-Length Fields

When a length field indicates N bytes follow, validate they exist:

```typescript
const metadataLength = raw.payload[offset++] & 0b111;
if (metadataLength > 0) {
	validatePayload(raw.payload.length >= offset + metadataLength);
	metadata = raw.payload.subarray(offset, offset + metadataLength);
	offset += metadataLength;
}
```
