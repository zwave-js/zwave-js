# Command Class Patterns

Detailed patterns for implementing individual command classes (Report, Get, Set).

## Table of Contents

- [Report Class](#report-class-received-from-device)
- [Get Class (simple)](#get-class-simple-no-payload)
- [Get Class (with parameters)](#get-class-with-parameters)
- [Set Class](#set-class-with-supervision)
- [Discriminated Unions](#discriminated-unions-for-set-actions)

---

## Report Class (received from device)

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

---

## Get Class (simple, no payload)

```typescript
@CCCommand(MyCommandClassCommand.CapabilitiesGet)
@expectedCCResponse(MyCommandClassCCCapabilitiesReport)
export class MyCommandClassCCCapabilitiesGet extends MyCommandClassCC {}
```

---

## Get Class (with parameters)

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

---

## Set Class (with supervision)

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

---

## Discriminated Unions for Set Actions

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
