---
name: integration-tests
description: Guide for writing integration tests that verify CC interview behavior and runtime functionality using mock nodes. Use when user asks for help writing tests for a specific CC or feature.
---

# Writing CC Integration Tests

This skill guides the creation of integration tests for Z-Wave Command Classes using the mock driver/controller/node infrastructure.

## Reference Documents

- [Test Patterns](reference/test-patterns.md) - Common assertion and setup patterns with examples

## Overview

Integration tests verify CC behavior with a real driver instance talking to mock Z-Wave devices. The framework provides:

- A real `Driver` instance connected to a mock serial port
- A `MockController` that simulates the Z-Wave controller
- One or more `MockNode` instances that simulate end devices
- Auto-registered behaviors for all implemented CCs (including interview responses)

**Test location:** `packages/zwave-js/src/lib/test/cc-specific/`

**Test runner:** `vitest` (run with `yarn test:ts <file>`)

**Reference tests:**

- Simple post-interview value check: `soundSwitchInterviewValueChangeOptions.test.ts`
- Post-interview API command verification: `userCodeCorrectCommandByVersion.test.ts`
- State pre-population + unsolicited report handling: `clearUserCodesOnNotification.test.ts`
- Interview frame verification: `secureNodeSecureEndpoint.test.ts` (in `test/compliance/`)

## Test Lifecycle

Understanding the lifecycle is critical for writing correct tests:

1. **Driver starts** and connects to the mock serial port
2. **Mock controller and node(s)** are created with specified capabilities
3. **`customSetup`** callback runs (if provided) — use this to add custom behaviors or pre-populate mock node state
4. **Driver discovers the node** and begins the full interview process
5. **Interview completes** — the node emits the `"ready"` event
6. **Recorded frames are cleared** (by default) — so `testBody` only sees post-interview frames
7. **`testBody`** runs with access to `(t, driver, node, mockController, mockNode)`
8. **Cleanup** — driver is destroyed, temp cache directory removed

**Key implication:** By default, you cannot assert on frames sent during the interview from `testBody`. To inspect interview frames, set `clearMessageStatsBeforeTest: false`.

## Single-Node Test Harness

Most tests use the single-node harness from `integrationTestSuite.ts`:

```typescript
import { CommandClasses } from "@zwave-js/core";
import { ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Description of what is being tested", {
	// debug: true,  // Uncomment for driver logs in temp dir

	nodeCapabilities: {
		commandClasses: [
			ccCaps({
				ccId: CommandClasses["My CC"],
				isSupported: true,
				version: 2,
				// CC-specific capabilities (type-checked via CCIdToCapabilities)
				someCapability: true,
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		// Test assertions go here
	},
});
```

### Options

| Option                        | Type                                                       | Default      | Description                                    |
| ----------------------------- | ---------------------------------------------------------- | ------------ | ---------------------------------------------- |
| `debug`                       | `boolean`                                                  | `false`      | Write driver logs, keep temp dir               |
| `provisioningDirectory`       | `string`                                                   | —            | Copy fixture files into cache dir before start |
| `clearMessageStatsBeforeTest` | `boolean`                                                  | `true`       | Clear recorded frames before `testBody`        |
| `controllerCapabilities`      | `MockControllerOptions["capabilities"]`                    | —            | Override controller capabilities               |
| `nodeCapabilities`            | `MockNodeOptions["capabilities"]`                          | —            | Define mock node's CCs and device info         |
| `customSetup`                 | `(driver, controller, node) => Promise<void>`              | —            | Pre-interview setup hook                       |
| `testBody`                    | `(t, driver, node, controller, mockNode) => Promise<void>` | **required** | Test assertions                                |
| `additionalDriverOptions`     | `PartialZWaveOptions`                                      | —            | Override driver config                         |

### Concurrency

Tests within a file run **concurrently** by default. Each test gets its own isolated in-memory mock port and cache directory, and concurrency simply overlaps the many waits for mock round-trips, so the whole suite finishes several times faster.

Opt a single test out with `integrationTest.sequential(...)` (also `.sequential.only` / `.sequential.skip`). Reserve this for tests that assert on absolute timing, retry counts, or message ordering — CPU contention from neighboring tests perturbs those and makes them flaky. Everything else should stay on the concurrent default.

```typescript
// Runs alone, not overlapped with the other tests in this file
integrationTest.sequential("retries SendData up to 3 times", {
	// ...
});
```

Both harnesses (`integrationTestSuite.ts` and `integrationTestSuiteMulti.ts`) share this behavior.

## Multi-Node Test Harness

For tests requiring multiple mock nodes, use `integrationTestSuiteMulti.ts`:

```typescript
import { integrationTest } from "../integrationTestSuiteMulti.js";

integrationTest("Multi-node test", {
	nodeCapabilities: [
		{ id: 2, capabilities: { commandClasses: [/* ... */] } },
		{ id: 3, capabilities: { commandClasses: [/* ... */] } },
	],

	testBody: async (t, driver, nodes, mockController, mockNodes) => {
		// nodes[0] = ZWaveNode for id 2, nodes[1] = ZWaveNode for id 3
		// mockNodes[0] = MockNode for id 2, etc.
	},
});
```

## Defining Node Capabilities

### Basic CC list

```typescript
nodeCapabilities: {
	commandClasses: [
		CommandClasses.Version,              // Just the CC ID (defaults)
		CommandClasses["Binary Switch"],      // Another basic CC
	],
}
```

### CC with specific capabilities using `ccCaps()`

The `ccCaps()` helper provides type-checked CC-specific capabilities:

```typescript
import { ccCaps } from "@zwave-js/testing";

nodeCapabilities: {
	commandClasses: [
		ccCaps({
			ccId: CommandClasses["User Credential"],
			isSupported: true,
			version: 1,
			// Fields from UserCredentialCCCapabilities:
			numberOfSupportedUsers: 10,
			supportedCredentialRules: [UserCredentialRule.Single],
			maxUserNameLength: 32,
			supportsAllUsersChecksum: true,
			supportsUserChecksum: true,
			supportsAdminCode: true,
			supportsAdminCodeDeactivation: true,
			supportedCredentialTypes: new Map([
				[UserCredentialType.PINCode, {
					numberOfCredentialSlots: 10,
					minCredentialLength: 4,
					maxCredentialLength: 10,
					maxCredentialHashLength: 0,
					supportsCredentialLearn: false,
				}],
			]),
		}),
	],
}
```

**Capability types** are defined in `packages/testing/src/CCSpecificCapabilities.ts`. Each CC maps its `CommandClasses` ID to a capabilities interface. Mock behaviors merge these with defaults at runtime.

### Endpoints

```typescript
nodeCapabilities: {
	commandClasses: [/* root CCs */],
	endpoints: [
		{
			commandClasses: [
				ccCaps({ ccId: CommandClasses["Binary Switch"], isSupported: true }),
			],
		},
	],
}
```

## Custom Device Config Files

Some behavior is driven by the device config file (`packages/config/config/devices/**`), not by the CCs alone — most importantly the `compat` flags (`commandClasses.add`/`remove`, `mapBasicSet`, `treatBasicSetAsEvent`, `alarmMapping`, …) and config-param metadata. To exercise that behavior in a test, ship a small fixture config file and point the driver at it. This is also the right tool when you want to reproduce a problem report against a specific device.

Three pieces have to line up:

1. **Give the mock node a fingerprint.** Set `manufacturerId`, `productType`, and `productId` in `nodeCapabilities`. These are what the driver looks up after the Manufacturer Specific + Version interviews.
2. **Write a fixture config** next to the test (e.g. `fixtures/<name>/deviceConfig.json`) whose `manufacturerId` / `devices[].productType` / `devices[].productId` match that fingerprint exactly.
3. **Load the fixture** via `additionalDriverOptions.storage.deviceConfigPriorityDir`, pointing at the fixture's directory. Files in this directory take priority over the bundled configs.

```typescript
import path from "node:path";

integrationTest("compat flag removes Window Covering CC", {
	nodeCapabilities: {
		manufacturerId: 0x1234,
		productType: 0x5678,
		productId: 0x9abc,
		commandClasses: [
			CommandClasses["Manufacturer Specific"],
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Window Covering"],
				isSupported: true,
			}),
		],
	},

	additionalDriverOptions: {
		storage: {
			deviceConfigPriorityDir: path.join(__dirname, "fixtures/myDevice"),
		},
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		// deviceConfig is now loaded and compat flags applied
		t.expect(node.deviceConfig?.label).toBe("Test Device");
	},
});
```

`fixtures/myDevice/deviceConfig.json`:

```json
{
	"manufacturer": "Test Manufacturer",
	"manufacturerId": "0x1234",
	"label": "Test Device",
	"description": "Device used by the integration test",
	"devices": [{ "productType": "0x5678", "productId": "0x9abc" }],
	"firmwareVersion": { "min": "0.0", "max": "255.255" },
	"compat": {
		"commandClasses": {
			"remove": { "0x6a": { "endpoints": "*" } }
		}
	}
}
```

**Gotchas:**

- **Firmware version must be in range.** The config only matches if the node's reported firmware version falls within `firmwareVersion.min`–`max`. The mock node reports `"1.0"` by default (override with the `firmwareVersion` capability). Use `"min": "0.0", "max": "255.255"` unless the test specifically needs a firmware-gated config. If the config doesn't load, the driver logs `No device config found`.
- **All three IDs must match**, and `productType`/`productId` are compared as 4-digit hex strings (`"0x0004"`), while the capability is a number (`0x0004`).
- The node must support Manufacturer Specific + Version CC so the driver can read the fingerprint; otherwise the config is never looked up.
- To assert the config loaded, check `node.deviceConfig` in the test body, or that a compat flag took effect (e.g. `node.getEndpoint(1)?.supportsCC(...)`).

See `packages/zwave-js/src/lib/test/compat/forceAddBasicCC.test.ts` and its fixture for a working example.

## Mock Node State and Behaviors

### Default Behaviors

`createDefaultMockNodeBehaviors()` is automatically called for every mock node. This registers handlers for all implemented CCs, including:

- Version CC queries
- All CC-specific Get → Report handlers
- Interview support (capabilities queries, user/credential enumeration, etc.)

Default behaviors are defined in `packages/zwave-js/src/lib/node/mockCCBehaviors/`. Each CC has its own file exporting an array of `MockNodeBehavior` objects.

### Pre-populating Mock Node State

Mock nodes use a `state` map (`MockNode.state`) to store runtime data. CC behaviors read/write this state. To pre-populate data before the interview, use `customSetup`:

```typescript
customSetup: async (driver, controller, mockNode) => {
	// Pre-populate a user on the mock node (UserCredential CC)
	mockNode.state.set("UserCredential_user_1", {
		userType: UserCredentialUserType.General,
		active: true,
		credentialRule: UserCredentialRule.Single,
		expiringTimeoutMinutes: 0,
		nameEncoding: UserCredentialNameEncoding.ASCII,
		userName: "Test User",
		modifierType: UserCredentialModifierType.Locally,
		modifierNodeId: 0,
	});

	// Pre-populate a credential
	mockNode.state.set("UserCredential_cred_1_1_1", {
		credentialData: Bytes.from("1234", "ascii"),
		modifierType: UserCredentialModifierType.Locally,
		modifierNodeId: 0,
	});
},
```

**State key format** varies by CC — check the mock behavior file for the `StateKeys` object or helper functions.

### Overriding Behaviors

Behaviors added via `mockNode.defineBehavior()` are prepended (higher priority):

```typescript
customSetup: async (driver, controller, mockNode) => {
	const customBehavior: MockNodeBehavior = {
		handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof SomeCCGet) {
				// Return a custom response
				const cc = new SomeCCReport({
					nodeId: controller.ownNodeId,
					value: 42,
				});
				return { action: "sendCC", cc };
			}
			// Return undefined to fall through to default behaviors
		},
	};
	mockNode.defineBehavior(customBehavior);
},
```

**Behavior return values:**

| Return                     | Effect                          |
| -------------------------- | ------------------------------- |
| `undefined`                | Fall through to next behavior   |
| `{ action: "sendCC", cc }` | Send a CC response              |
| `{ action: "stop" }`       | Consume the frame, send nothing |
| `{ action: "fail" }`       | Simulate a transmission failure |
| `{ action: "ack" }`        | Send just an ACK                |

## Assertion Patterns

### Verify Post-Interview Values

```typescript
testBody: async (t, driver, node, mockController, mockNode) => {
	// Check a specific value was stored
	const valueId = SomeCCValues.someValue.id;
	t.expect(node.getValue(valueId)).toBe(expectedValue);

	// Check value metadata
	const meta = node.getValueMetadata(valueId);
	t.expect(meta.label).toBe("Expected Label");

	// Check defined value IDs
	const defined = node.getDefinedValueIDs();
	const found = defined.find((v) => SomeCCValues.someValue.is(v));
	t.expect(found).toBeDefined();
},
```

### Verify Commands Sent During Interview

**IMPORTANT:** The `receivedControllerFrames` and `sentControllerFrames` arrays on `MockNode` are **private**. Do NOT access them directly. Always use the `assertReceivedControllerFrame()` / `assertSentControllerFrame()` methods instead.

Set `clearMessageStatsBeforeTest: false` to preserve interview frames:

```typescript
integrationTest("Interview sends the expected commands", {
	clearMessageStatsBeforeTest: false,
	nodeCapabilities: {/* ... */},

	testBody: async (t, driver, node, mockController, mockNode) => {
		// Assert a specific command WAS sent
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof UserCredentialCCUserCapabilitiesGet,
			{
				errorMessage: "Should have sent UserCapabilitiesGet",
			},
		);

		// Assert a specific command was NOT sent
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof SomeUnexpectedCommand,
			{
				noMatch: true,
				errorMessage: "Should NOT have sent this command",
			},
		);
	},
});
```

### Verify Post-Interview API Commands

With default `clearMessageStatsBeforeTest: true`, frames from the test body are recorded:

```typescript
testBody: async (t, driver, node, mockController, mockNode) => {
	const api = node.commandClasses["User Credential"];
	await api.someMethod(args);

	mockNode.assertReceivedControllerFrame(
		(frame) =>
			frame.type === MockZWaveFrameType.Request
			&& frame.payload instanceof ExpectedCCCommand,
		{
			errorMessage: "Expected command was not sent",
		},
	);
},
```

### Send Unsolicited Reports to the Driver

```typescript
import { createMockZWaveRequestFrame } from "@zwave-js/testing";

testBody: async (t, driver, node, mockController, mockNode) => {
	const cc = new NotificationCCReport({
		nodeId: mockNode.id,
		notificationType: 0x06,
		notificationEvent: 0x0b,
	});
	await mockNode.sendToController(createMockZWaveRequestFrame(cc));

	// Wait for processing
	await wait(100);

	// Assert effect of the report
	t.expect(node.getValue(someValueId)).toBe(expectedValue);
},
```

### Pre-populate the Driver's Value Cache

```typescript
testBody: async (t, driver, node, mockController, mockNode) => {
	// Manually seed the value DB (simulates prior interview state)
	const valueId = SomeCCValues.someValue(1).endpoint(0);
	node.valueDB.setValue(valueId, "some-value");

	// Verify it's stored
	t.expect(node.getValue(valueId)).toBe("some-value");
},
```

## Common Imports

```typescript
// Test harness
import { integrationTest } from "../integrationTestSuite.js";

// CC-specific classes and values
import { SomeCCValues } from "@zwave-js/cc/SomeCC";
import { SomeCCGet, SomeCCReport, SomeCCSet } from "@zwave-js/cc/SomeCC";

// Enums and types from the CC (re-exported through safe entrypoint)
import { AnotherEnum, SomeEnum } from "@zwave-js/cc";

// Core types
import { CommandClasses } from "@zwave-js/core";

// Testing utilities
import {
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import type { MockNodeBehavior } from "@zwave-js/testing";

// For buffer data
import { Bytes } from "@zwave-js/shared";

// For waiting
import { wait } from "alcalzone-shared/async";
```

**Import conventions:**

- CC class constructors (e.g. `UserCredentialCCUserGet`): import from `@zwave-js/cc/UserCredentialCC`
- CC Values (e.g. `UserCredentialCCValues`): import from `@zwave-js/cc/UserCredentialCC`
- Enums (e.g. `UserCredentialType`, `UserCredentialRule`): import from `@zwave-js/cc`
- `CommandClasses`, core types: import from `@zwave-js/core`
- `MockZWaveFrameType`, `ccCaps`, `createMockZWaveRequestFrame`, `MockNodeBehavior`: import from `@zwave-js/testing`

## File Naming

Test files go in `packages/zwave-js/src/lib/test/cc-specific/` and follow the pattern:

```
<descriptiveCamelCaseName>.test.ts
```

Examples:

- `userCredentialInterview.test.ts`
- `soundSwitchInterviewValueChangeOptions.test.ts`
- `clearUserCodesOnNotification.test.ts`

## Checklist for New Integration Test

1. **Determine what to test**
   - [ ] Interview behavior (commands sent, values stored)
   - [ ] Post-interview API behavior
   - [ ] Unsolicited report handling
   - [ ] Edge cases (timeouts, missing capabilities, version differences)

2. **Set up the test**
   - [ ] Choose single-node or multi-node harness
   - [ ] Define `nodeCapabilities` with `ccCaps()` for type safety
   - [ ] Add `customSetup` if mock node state needs pre-population
   - [ ] Set `clearMessageStatsBeforeTest: false` if verifying interview frames
   - [ ] Use `integrationTest.sequential(...)` only if the test asserts on timing, retry counts, or ordering

3. **Write assertions**
   - [ ] Use `node.getValue()` / `node.getValueMetadata()` for value checks
   - [ ] Use `mockNode.assertReceivedControllerFrame()` for command checks
   - [ ] Use `createMockZWaveRequestFrame()` + `mockNode.sendToController()` for unsolicited reports

4. **Run and validate**
   - [ ] `yarn test:ts <test-file-path>`
   - [ ] `yarn fmt`
