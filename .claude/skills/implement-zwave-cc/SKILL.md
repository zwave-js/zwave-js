---
name: Implement Z-Wave Command Class
description: Guide for implementing new Z-Wave Command Classes (CCs) in zwave-js
version: 1.0.0
---

# Implementing Z-Wave Command Classes

This skill guides the implementation of new Z-Wave Command Classes (CCs) in the zwave-js codebase.

## Reference Documents

- [Command Patterns](reference/command-patterns.md) - Report, Get, Set class implementations
- [Parsing & Serialization](reference/parsing-serialization.md) - Helper functions, offset handling, buffer management

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
	type SupervisionResult,
	type WithAddress,
	ZWaveError,
	ZWaveErrorCodes,
	encodeCCId,
	isUnsupervisedOrSucceeded,
	parseCCId,
	validatePayload,
} from "@zwave-js/core";
import {
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
	type PersistValuesContext,
	type RefreshValuesContext,
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
```

## Types in \_Types.ts

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
		// Static property - internal capability
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
		...V.staticProperty(
			"optionalFeatureValue",
			{
				/* metadata */
			} as const,
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
		MyCommandClassCCValues.optionalFeatureSupported.endpoint(
			endpoint.index,
		),
	);
}
```

**Reference:** See `DoorLockCC.ts` for comprehensive `autoCreate` examples.

## Version Handling

CCs evolve across versions. Always document version requirements:

### In @implementedVersion() Decorator

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
    }
    return super.supportsCommand(cmd);
}
```

### In Value Definitions

Use `minVersion` to indicate when a value was introduced:

```typescript
...V.staticProperty("duration", {...}, { minVersion: 2 } as const)
```

### Conditional Parsing

Newer CC versions often extend the binary format. Parse conditionally:

```typescript
public static from(raw: CCRaw, ctx: CCParsingContext): MyReport {
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

**Note:** Conditional _serialization_ (omitting fields for older versions) is a workaround for buggy devices. Do not implement this by default.

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

		const result =
			await this.host.sendCommand<MyCommandClassCCCapabilitiesReport>(
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

CCs that split values into target and current (like switches) typically support multicast:

```typescript
if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
	this.tryGetValueDB()?.setValue(currentValueValueId, value);
} else if (this.isMulticast()) {
	const affectedNodes = this.endpoint.node.physicalNodes.filter((node) =>
		node.getEndpoint(this.endpoint.index)?.supportsCC(this.ccId),
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

		// Query capabilities (interview-only)
		if (api.version >= 2) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: "Querying capabilities...",
				direction: "outbound",
			});

			const caps = await api.getCapabilities();
			if (caps) {
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: `Received: feature1=${caps.feature1}`,
					direction: "inbound",
				});
			}
		}

		// Refresh current values (reuse refreshValues if defined)
		await this.refreshValues(ctx);

		this.setInterviewComplete(ctx, true);
	}

	public async refreshValues(ctx: RefreshValuesContext): Promise<void> {
		// ... query current state
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

See [Command Patterns](reference/command-patterns.md) for detailed examples of:

- Report class (received from device)
- Get class (simple and with parameters)
- Set class (with supervision)
- Discriminated unions for Set actions (Erase vs Modify)

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

// In parsing - use validatePayload for payload structure
validatePayload(raw.payload.length >= 10);
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
