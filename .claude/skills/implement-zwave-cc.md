# Implementing Z-Wave Command Classes

This skill guides the implementation of new Z-Wave Command Classes (CCs) in the zwave-js codebase.

## Overview

Command Classes are implemented in `packages/cc/src/cc/` as TypeScript files. Each CC file typically contains:
1. Helper functions for parsing/encoding (CC-specific)
2. CC Values definitions
3. API class (for controlling nodes)
4. Base CC class (with interview logic)
5. Individual command classes (Get, Set, Report for each command pair)

**Reference implementations:**
- Simple CC: `BinarySwitchCC.ts`
- Complex CC with many commands: `DoorLockCC.ts`
- CC with schedules/slots: `ScheduleEntryLockCC.ts`, `ActiveScheduleCC.ts`
- CC with versioning: `MultilevelSwitchCC.ts`

## Reading the Specification

Z-Wave CC specifications define:
- Command byte values and their encoding
- Field sizes (8-bit, 16-bit, bitmasks)
- Reserved bits and their handling
- Requirements (MUST/MAY/MUST NOT)

Key patterns in specs:
- `(MSB)/(LSB)` indicates 16-bit big-endian values
- `Reserved (N bits)` - set to 0 on send, ignore on receive
- Bitmasks show bit positions for flags
- Report Code/Reason fields indicate why a report was sent

## File Structure and Imports

```typescript
// Note: Import patterns may evolve. Reference recent CC implementations for current style.
import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import {
    CommandClasses,
    type EndpointId,
    type GetValueDB,
    type MaybeNotKnown,
    type MessageOrCCLogEntry,
    MessagePriority,
    type MessageRecord,
    type SupervisionResult,
    type WithAddress,
    ZWaveError,
    ZWaveErrorCodes,
    encodeBitMask,
    encodeCCId,
    isUnsupervisedOrSucceeded,
    parseBitMask,
    parseCCId,
    validatePayload,
} from "@zwave-js/core";
import {
    type AllOrNone,
    Bytes,
    type BytesView,
    getEnumMemberName,
    pick,
} from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import {
    type CCRaw,
    CommandClass,
    type InterviewContext,
    type RefreshValuesContext,
    type PersistValuesContext,
} from "../lib/CommandClass.js";
import {
    API,
    CCCommand,
    ccValueProperty,
    ccValues,
    commandClass,
    expectedCCResponse,
    implementedVersion,
    useSupervision,
} from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { /* Command enum and types from _Types.js */ } from "../lib/_Types.js";
```

## Types in _Types.ts

Add command enum and type definitions to `packages/cc/src/lib/_Types.ts`:

```typescript
export enum MyCommandClassCommand {
    CapabilitiesGet = 0x01,
    CapabilitiesReport = 0x02,
    Get = 0x03,
    Report = 0x04,
    Set = 0x05,
}

export enum MyReportReason {
    ResponseToGet = 0x00,
    ModifiedExternal = 0x01,
    ModifiedZWave = 0x02,
}

export interface MyScheduleData {
    startDate: ScheduleDate;
    stopDate: ScheduleDate;
    metadata?: BytesView;
}
```

## Helper Functions for Parsing/Encoding

### Pattern: Abstract repeated byte sequences into local helpers

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

## CC Values Definition

Values store CC state in the driver's value DB. There are two categories:

### Internal vs User-Facing Values

- **Capabilities** (number of slots, supported features, etc.) → `internal: true`
- **Device states** (current value, target value, enabled state, etc.) → exposed to users

When unclear, discuss with the developer on a case-by-case basis.

### Value Definition Patterns

```typescript
export const MyCommandClassCCValues = V.defineCCValues(
    CommandClasses["My Command Class"],
    {
        // Static property (single value per endpoint) - internal capability
        ...V.staticProperty("supportedFeatures", undefined, {
            internal: true,
        }),

        // Static property - user-facing state (V2+)
        ...V.staticProperty(
            "currentValue",
            {
                ...ValueMetadata.ReadOnlyBoolean,
                label: "Current value",
            } as const,
            { minVersion: 2 },
        ),

        // Dynamic property with single key
        ...V.dynamicPropertyAndKeyWithName(
            "itemState",
            "itemState",
            (itemId: number) => itemId,
            ({ property, propertyKey }) =>
                property === "itemState" && typeof propertyKey === "number",
            undefined,
            { internal: true },
        ),

        // Dynamic property with composite key
        ...V.dynamicPropertyAndKeyWithName(
            "schedule",
            "schedule",
            (targetCC: CommandClasses, targetId: number, slotId: number) =>
                (targetCC << 24) | (targetId << 8) | slotId,
            ({ property, propertyKey }) =>
                property === "schedule" && typeof propertyKey === "number",
            undefined,
            { internal: true },
        ),

        // Conditional value creation based on capabilities
        // Use when a capabilities command reports optional feature support
        ...V.staticProperty(
            "optionalFeatureValue",
            { /* metadata */ } as const,
            {
                minVersion: 4,
                autoCreate: shouldAutoCreateOptionalFeatureValue,
            } as const,
        ),
    },
);

// autoCreate function checks if feature was reported as supported
export function shouldAutoCreateOptionalFeatureValue(
    ctx: GetValueDB,
    endpoint: EndpointId,
): boolean {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB) return false;
    return !!valueDB.getValue(
        MyCommandClassCCValues.optionalFeatureSupported.endpoint(endpoint.index),
    );
}
```

**Reference:** See `DoorLockCC.ts` for comprehensive `autoCreate` examples.

## Version Handling

CCs evolve across versions. Always document version requirements:

### In @implementedVersion() Decorator

Set the latest implemented version in the base CC class decorator:

```typescript
@commandClass(CommandClasses["My Command Class"])
@implementedVersion(3)  // Latest version implemented
@ccValues(MyCommandClassCCValues)
export class MyCommandClassCC extends CommandClass {
```

### In supportsCommand()

```typescript
public supportsCommand(cmd: MyCommandClassCommand): MaybeNotKnown<boolean> {
    switch (cmd) {
        case MyCommandClassCommand.Get:
        case MyCommandClassCommand.Set:
            return true; // V1
        case MyCommandClassCommand.CapabilitiesGet:
            return this.version >= 2;
        case MyCommandClassCommand.ExtendedGet:
            return this.version >= 3 && this.isSinglecast();
    }
    return super.supportsCommand(cmd);
}
```

### In Value Definitions

Use `minVersion` to indicate when a value was introduced:

```typescript
...V.staticProperty("duration", {...}, { minVersion: 2 } as const)
```

### Conditional Parsing (for backwards-compatible extensions)

Newer CC versions often extend the binary format. Parse conditionally:

```typescript
public static from(raw: CCRaw, ctx: CCParsingContext): MyReport {
    // V1 fields
    validatePayload(raw.payload.length >= 2);
    const value1 = raw.payload[0];
    const value2 = raw.payload[1];

    // V2+ adds optional duration field
    let duration: Duration | undefined;
    if (raw.payload.length >= 3) {
        duration = Duration.parseReport(raw.payload[2]);
    }

    return new this({ nodeId: ctx.sourceNodeId, value1, value2, duration });
}
```

**Note:** Conditional *serialization* (omitting fields for older versions) is a workaround for buggy devices. Do not implement this by default.

## API Class

The API class provides methods for controlling nodes.

```typescript
@API(CommandClasses["My Command Class"])
export class MyCommandClassCCAPI extends CCAPI {
    public supportsCommand(cmd: MyCommandClassCommand): MaybeNotKnown<boolean> {
        switch (cmd) {
            case MyCommandClassCommand.Get:
            case MyCommandClassCommand.Set:
                return true; // V1
            case MyCommandClassCommand.CapabilitiesGet:
                return this.version >= 2;
        }
        return super.supportsCommand(cmd);
    }

    // GET method - returns parsed data or undefined
    public async getCapabilities(): Promise<MaybeNotKnown<CapabilitiesData>> {
        this.assertSupportsCommand(
            MyCommandClassCommand,
            MyCommandClassCommand.CapabilitiesGet,
        );

        const cc = new MyCommandClassCCCapabilitiesGet({
            nodeId: this.endpoint.nodeId,
            endpointIndex: this.endpoint.index,
        });

        const result = await this.host.sendCommand<MyCommandClassCCCapabilitiesReport>(
            cc,
            this.commandOptions,
        );

        if (result) {
            return pick(result, ["field1", "field2"]);
        }
    }

    // SET method with supervision support
    @validateArgs()
    public async setValue(
        target: TargetId,
        value: boolean,
    ): Promise<SupervisionResult | undefined> {
        this.assertSupportsCommand(
            MyCommandClassCommand,
            MyCommandClassCommand.Set,
        );

        const cc = new MyCommandClassCCSet({
            nodeId: this.endpoint.nodeId,
            endpointIndex: this.endpoint.index,
            ...target,
            value,
        });

        const result = await this.host.sendCommand(cc, this.commandOptions);

        // Optimistically update cache on success (singlecast only)
        if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
            const valueId = MyCommandClassCCValues.someValue(target.id);
            this.host
                .getValueDB(this.endpoint.nodeId)
                .setValue(valueId.endpoint(this.endpoint.index), value);
        }

        return result;
    }
}
```

### Multicast Handling for Target/Current Value CCs

CCs that split values into target and current (like switches) typically support multicast. Update all affected nodes:

```typescript
// In API SET method, after sending command:
if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
    this.tryGetValueDB()?.setValue(currentValueValueId, value);
} else if (this.isMulticast()) {
    const affectedNodes = this.endpoint.node.physicalNodes
        .filter((node) =>
            node.getEndpoint(this.endpoint.index)?.supportsCC(this.ccId)
        );
    for (const node of affectedNodes) {
        this.host.tryGetValueDB(node.id)?.setValue(currentValueValueId, value);
    }
}
```

**Reference:** See `BinarySwitchCC.ts` and `MultilevelSwitchCC.ts` for examples.

## Base CC Class

### Interview and RefreshValues

**Design decision:** Discuss with the developer whether `refreshValues()` should be exposed to users.

- `interview()` - Called once during node interview, discovers capabilities
- `refreshValues()` - Called to refresh current state, can be triggered by users

If `refreshValues()` is implemented, call it from `interview()` to avoid code duplication:

```typescript
@commandClass(CommandClasses["My Command Class"])
@implementedVersion(2)
@ccValues(MyCommandClassCCValues)
export class MyCommandClassCC extends CommandClass {
    declare ccCommand: MyCommandClassCommand;

    public async interview(ctx: InterviewContext): Promise<void> {
        const node = this.getNode(ctx)!;
        const endpoint = this.getEndpoint(ctx)!;
        const api = CCAPI.create(
            CommandClasses["My Command Class"],
            ctx,
            endpoint,
        ).withOptions({
            priority: MessagePriority.NodeQuery,
        });

        ctx.logNode(node.id, {
            endpoint: this.endpointIndex,
            message: `Interviewing ${this.ccName}...`,
            direction: "none",
        });

        // Query capabilities (interview-only, not in refreshValues)
        if (api.version >= 2) {
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "Querying capabilities...",
                direction: "outbound",
            });

            const caps = await api.getCapabilities();
            if (caps) {
                const logLines = ["Received capabilities:", `  feature1: ${caps.feature1}`];
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logLines.join("\n"),
                    direction: "inbound",
                });
            }
        }

        // Refresh current values (reuse refreshValues if defined)
        await this.refreshValues(ctx);

        this.setInterviewComplete(ctx, true);
    }

    public async refreshValues(ctx: RefreshValuesContext): Promise<void> {
        const node = this.getNode(ctx)!;
        const endpoint = this.getEndpoint(ctx)!;
        const api = CCAPI.create(
            CommandClasses["My Command Class"],
            ctx,
            endpoint,
        ).withOptions({
            priority: MessagePriority.NodeQuery,
        });

        ctx.logNode(node.id, {
            endpoint: this.endpointIndex,
            message: "Refreshing current values...",
            direction: "outbound",
        });

        await api.get();
    }

    // Static cached value getters
    public static getSomethingCached(
        ctx: GetValueDB,
        endpoint: EndpointId,
    ): MaybeNotKnown<SomeType> {
        return ctx
            .getValueDB(endpoint.nodeId)
            .getValue(
                MyCommandClassCCValues.something.endpoint(endpoint.index),
            );
    }
}
```

**Reference:** See `BinarySwitchCC.ts` for simple interview/refresh, `MultilevelSwitchCC.ts` for version-specific interview logic.

## Command Classes

### Report Class (received from device)

```typescript
// @publicAPI
export interface MyCommandClassCCReportOptions {
    targetId: number;
    reportReason: MyReportReason;
    value: boolean;
}

@CCCommand(MyCommandClassCommand.Report)
@ccValueProperty("value", MyCommandClassCCValues.value)
export class MyCommandClassCCReport extends MyCommandClassCC {
    public constructor(options: WithAddress<MyCommandClassCCReportOptions>) {
        super(options);
        this.targetId = options.targetId;
        this.reportReason = options.reportReason;
        this.value = options.value;
    }

    public static from(
        raw: CCRaw,
        ctx: CCParsingContext,
    ): MyCommandClassCCReport {
        // Minimal validation before self-validating functions
        validatePayload(raw.payload.length >= 1);

        // Parse variable-length CC ID (if applicable)
        const { ccId: targetCC, bytesRead } = parseCCId(raw.payload, 0);
        let offset = bytesRead;

        // Validate remaining required fields
        validatePayload(raw.payload.length >= offset + 3);

        const targetId = raw.payload.readUInt16BE(offset);
        offset += 2;

        // Use binary literals for bitmasks
        const flags = raw.payload[offset++];
        const value = !!(flags & 0b1);
        const reportReason = (flags >> 1) & 0b111;

        return new this({
            nodeId: ctx.sourceNodeId,
            targetCC,
            targetId,
            reportReason,
            value,
        });
    }

    public targetId: number;
    public reportReason: MyReportReason;
    public value: boolean;

    // Override persistValues for complex value storage
    public persistValues(ctx: PersistValuesContext): boolean {
        if (!super.persistValues(ctx)) return false;

        const valueId = MyCommandClassCCValues.complexValue(this.targetId);
        this.setValue(ctx, valueId, this.value);

        return true;
    }

    public serialize(ctx: CCEncodingContext): Promise<Bytes> {
        // Allocate max size, trim later
        this.payload = new Bytes(10);

        let offset = 0;
        offset += encodeCCId(this.targetCC, this.payload, offset);
        this.payload.writeUInt16BE(this.targetId, offset);
        offset += 2;
        this.payload[offset++] = ((this.reportReason & 0b111) << 1)
            | (this.value ? 0b1 : 0);

        // Trim to actual size
        this.payload = this.payload.subarray(0, offset);
        return super.serialize(ctx);
    }

    public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
        return {
            ...super.toLogEntry(ctx),
            message: {
                "target ID": this.targetId,
                "report reason": getEnumMemberName(MyReportReason, this.reportReason),
                value: this.value,
            },
        };
    }
}
```

### Get Class (simple, no payload)

```typescript
@CCCommand(MyCommandClassCommand.CapabilitiesGet)
@expectedCCResponse(MyCommandClassCCCapabilitiesReport)
export class MyCommandClassCCCapabilitiesGet extends MyCommandClassCC {}
```

### Get Class (with parameters)

```typescript
// @publicAPI
export type MyCommandClassCCGetOptions = {
    targetId: number;
};

@CCCommand(MyCommandClassCommand.Get)
@expectedCCResponse(MyCommandClassCCReport)
export class MyCommandClassCCGet extends MyCommandClassCC {
    public constructor(options: WithAddress<MyCommandClassCCGetOptions>) {
        super(options);
        this.targetId = options.targetId;
    }

    public static from(
        raw: CCRaw,
        ctx: CCParsingContext,
    ): MyCommandClassCCGet {
        validatePayload(raw.payload.length >= 2);
        const targetId = raw.payload.readUInt16BE(0);

        return new this({
            nodeId: ctx.sourceNodeId,
            targetId,
        });
    }

    public targetId: number;

    public serialize(ctx: CCEncodingContext): Promise<Bytes> {
        this.payload = new Bytes(2);
        this.payload.writeUInt16BE(this.targetId, 0);
        return super.serialize(ctx);
    }

    public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
        return {
            ...super.toLogEntry(ctx),
            message: {
                "target ID": this.targetId,
            },
        };
    }
}
```

### Set Class (with supervision)

```typescript
// @publicAPI
export interface MyCommandClassCCSetOptions {
    targetId: number;
    value: boolean;
}

@CCCommand(MyCommandClassCommand.Set)
@useSupervision()
export class MyCommandClassCCSet extends MyCommandClassCC {
    public constructor(options: WithAddress<MyCommandClassCCSetOptions>) {
        super(options);
        this.targetId = options.targetId;
        this.value = options.value;
    }

    public static from(
        raw: CCRaw,
        ctx: CCParsingContext,
    ): MyCommandClassCCSet {
        validatePayload(raw.payload.length >= 3);
        const targetId = raw.payload.readUInt16BE(0);
        const value = !!(raw.payload[2] & 0b1);

        return new this({
            nodeId: ctx.sourceNodeId,
            targetId,
            value,
        });
    }

    public targetId: number;
    public value: boolean;

    public serialize(ctx: CCEncodingContext): Promise<Bytes> {
        this.payload = new Bytes(3);
        this.payload.writeUInt16BE(this.targetId, 0);
        this.payload[2] = this.value ? 0x01 : 0x00;
        return super.serialize(ctx);
    }

    public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
        return {
            ...super.toLogEntry(ctx),
            message: {
                "target ID": this.targetId,
                value: this.value,
            },
        };
    }
}
```

### Discriminated Unions for Set Actions (Erase vs Modify)

When a Set command can either erase or modify data:

```typescript
/** @publicAPI */
export type MyScheduleSetOptions =
    & SlotId
    & (
        | { action: SetAction.Erase }
        | ({ action: SetAction.Modify } & ScheduleData)
    );

@CCCommand(MyCommandClassCommand.ScheduleSet)
@useSupervision()
export class MyCommandClassCCScheduleSet extends MyCommandClassCC {
    public constructor(options: WithAddress<MyScheduleSetOptions>) {
        super(options);
        this.slotId = options.slotId;
        this.action = options.action;
        if (options.action === SetAction.Modify) {
            this.startDate = options.startDate;
            this.stopDate = options.stopDate;
        }
    }

    // ... parsing and serialization handle both cases
}
```

## Error Handling

**Always use `ZWaveError` with appropriate error codes.** Never use standard `Error`.

```typescript
import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";

// In API methods - argument validation
if (options.slotId < 1) {
    throw new ZWaveError(
        "The slot ID must be greater than 0",
        ZWaveErrorCodes.Argument_Invalid,
    );
}

// In API methods - state validation
if (stopDate <= startDate) {
    throw new ZWaveError(
        "The stop date must be after the start date",
        ZWaveErrorCodes.Argument_Invalid,
    );
}

// In parsing - use validatePayload for payload structure
validatePayload(raw.payload.length >= 10);
validatePayload(
    action === SetAction.Modify || action === SetAction.Erase,
);
```

## Offset and Bitmask Patterns

### Offset Handling

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

### Binary Literals for Bitmasks

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

### Serialize Buffer Management

**Static payloads:** When all fields have fixed sizes, use `Bytes.from()` or `Bytes.concat()`:

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

**Dynamic payloads:** When fields have variable length (e.g., extended CC IDs, optional metadata), allocate max size, track offset, trim at end:

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

## Checklist for New CC Implementation

1. **Types** (`packages/cc/src/lib/_Types.ts`)
   - [ ] Add command enum
   - [ ] Add type interfaces for options and data structures
   - [ ] Add any needed enums (report reasons, actions, etc.)

2. **CC File** (`packages/cc/src/cc/MyCommandClassCC.ts`)
   - [ ] Helper functions for parsing/encoding (if needed)
   - [ ] CC Values definition with appropriate `internal`/`minVersion`/`autoCreate`
   - [ ] API class with `supportsCommand()` and all methods
   - [ ] Base CC class with `interview()` and optionally `refreshValues()`
   - [ ] All command classes (Get, Set, Report for each command pair)

3. **Generate Exports**
   - [ ] Run `yarn workspace @zwave-js/cc run codegen`

4. **Validation**
   - [ ] Run `yarn build @zwave-js/cc`
   - [ ] Run `yarn fmt`
   - [ ] Run `yarn lint:ts:fix`

## Questions to Ask the Developer

When implementing a new CC, clarify these decisions:

1. Should `refreshValues()` be available to users, or is interview-only sufficient?
2. Which values should be user-facing vs internal?
3. Are there optional features that need `autoCreate` based on capabilities?
4. What error messages are appropriate for validation failures?
