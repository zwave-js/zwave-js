# Integration Test Patterns

Concrete examples of common integration test patterns.

## Table of Contents

- [Verify Interview Stored Correct Values](#verify-interview-stored-correct-values)
- [Verify Interview Sent Correct Commands](#verify-interview-sent-correct-commands)
- [Verify API Uses Correct Command Version](#verify-api-uses-correct-command-version)
- [Pre-populate Mock Node for Interview](#pre-populate-mock-node-for-interview)
- [Override Interview Behavior](#override-interview-behavior)
- [Handle Unsolicited Reports](#handle-unsolicited-reports)
- [Test with Multiple CCs](#test-with-multiple-ccs)

---

## Verify Interview Stored Correct Values

After interview, check that the driver's value DB contains expected data:

```typescript
import { SoundSwitchCCValues } from "@zwave-js/cc/SoundSwitchCC";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"SoundSwitch toneId value has correct change options after interview",
	{
		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["Sound Switch"],
					isSupported: true,
					defaultToneId: 1,
					defaultVolume: 0,
					tones: [{ duration: 20, name: "Test Tone 1" }],
				}),
			],
		},

		testBody: async (t, driver, node, _mockController, _mockNode) => {
			const toneIdValue = SoundSwitchCCValues.toneId;
			const meta = node.getValueMetadata(toneIdValue.id);
			t.expect(meta.valueChangeOptions).toStrictEqual(["volume"]);
		},
	},
);
```

---

## Verify Interview Sent Correct Commands

**IMPORTANT:** The `receivedControllerFrames` and `sentControllerFrames` arrays on `MockNode` are **private**. Do NOT access them directly. Always use the `assertReceivedControllerFrame()` / `assertSentControllerFrame()` methods instead.

Use `clearMessageStatsBeforeTest: false` to inspect interview frames:

```typescript
import {
	UserCredentialCCCredentialCapabilitiesGet,
	UserCredentialCCUserCapabilitiesGet,
} from "@zwave-js/cc/UserCredentialCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"User Credential CC interview queries capabilities in correct order",
	{
		clearMessageStatsBeforeTest: false,

		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					numberOfSupportedUsers: 1,
					supportedCredentialTypes: new Map([[1, {
						numberOfCredentialSlots: 1,
						minCredentialLength: 4,
						maxCredentialLength: 10,
						maxCredentialHashLength: 0,
						supportsCredentialLearn: false,
					}]]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCUserCapabilitiesGet,
				{
					errorMessage:
						"Should have sent UserCapabilitiesGet during interview",
				},
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCCredentialCapabilitiesGet,
				{
					errorMessage:
						"Should have sent CredentialCapabilitiesGet during interview",
				},
			);
		},
	},
);
```

---

## Verify API Uses Correct Command Version

Default behavior: frames are cleared after interview, so only API calls show up:

```typescript
import { UserCodeCCExtendedUserCodeSet, UserCodeCCSet } from "@zwave-js/cc";
import { UserIDStatus } from "@zwave-js/cc/safe";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"UserCodeCCAPI.set uses Extended User Code Set on V2 nodes",
	{
		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportedASCIIChars: "0123456789",
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const api = node.commandClasses["User Code"];
			await api.set(1, UserIDStatus.Enabled, "1234");

			// Should use the V2 command
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet,
				{
					errorMessage: "Should have used ExtendedUserCodeSet",
				},
			);

			// Should NOT use the V1 command
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCSet,
				{
					noMatch: true,
					errorMessage: "Should NOT have used legacy UserCodeCCSet",
				},
			);
		},
	},
);
```

---

## Pre-populate Mock Node for Interview

Use `customSetup` to seed mock node state before the interview discovers it:

```typescript
import {
	UserCredentialActiveState,
	UserCredentialModifierType,
	UserCredentialNameEncoding,
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserType,
} from "@zwave-js/cc";
import { UserCredentialCCValues } from "@zwave-js/cc/UserCredentialCC";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Interview discovers pre-existing users and credentials",
	{
		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					supportsAllUsersChecksum: false,
					supportsAdminCode: false,
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
		},

		customSetup: async (driver, controller, mockNode) => {
			// Pre-populate user 1
			mockNode.state.set("UserCredential_user_1", {
				userType: UserCredentialUserType.General,
				activeState: UserCredentialActiveState.OccupiedEnabled,
				credentialRule: UserCredentialRule.Single,
				expiringTimeoutMinutes: 0,
				nameEncoding: UserCredentialNameEncoding.ASCII,
				userName: "Test User",
				modifierType: UserCredentialModifierType.Locally,
				modifierNodeId: 0,
			});

			// Pre-populate a PIN code credential for user 1
			mockNode.state.set("UserCredential_cred_1_1_1", {
				credentialData: Bytes.from("1234", "ascii"),
				modifierType: UserCredentialModifierType.Locally,
				modifierNodeId: 0,
			});
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The interview should have discovered the user
			const userType = node.getValue(
				UserCredentialCCValues.userType(1).endpoint(0),
			);
			t.expect(userType).toBe(UserCredentialUserType.General);

			// And the credential
			const credential = node.getValue(
				UserCredentialCCValues.credential(
					1,
					UserCredentialType.PINCode,
					1,
				).endpoint(0),
			);
			t.expect(credential).toBeDefined();
		},
	},
);
```

**State key conventions** for UserCredential CC:

- Users: `UserCredential_user_<userId>`
- Credentials: `UserCredential_cred_<userId>_<credentialType>_<credentialSlot>`
- Admin PIN: `UserCredential_adminPinCode`
- Key locker entries: `UserCredential_keyLocker_<entryType>_<entrySlot>`

---

## Override Interview Behavior

Use `customSetup` with `defineBehavior()` to intercept or modify CC handling:

```typescript
import { VersionCCCommandClassGet } from "@zwave-js/cc";
import type { MockNodeBehavior } from "@zwave-js/testing";

customSetup: async (driver, controller, mockNode) => {
	// Suppress responses to version queries
	const suppressVersionQuery: MockNodeBehavior = {
		handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof VersionCCCommandClassGet) {
				return { action: "stop" };
			}
			// undefined = fall through to default behavior
		},
	};
	mockNode.defineBehavior(suppressVersionQuery);
},
```

---

## Handle Unsolicited Reports

Send a report from the mock node to the driver and verify the effect:

```typescript
import { NotificationCCReport } from "@zwave-js/cc/NotificationCC";
import { UserCodeCCValues } from "@zwave-js/cc";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";

testBody: async (t, driver, node, mockController, mockNode) => {
	// Seed values to verify they get cleared
	const valueId = UserCodeCCValues.userCode(1).endpoint(0);
	node.valueDB.setValue(valueId, "1234");

	// Send an unsolicited notification
	const cc = new NotificationCCReport({
		nodeId: mockNode.id,
		notificationType: 0x06, // Access Control
		notificationEvent: 0x0b, // All user codes deleted
	});
	await mockNode.sendToController(createMockZWaveRequestFrame(cc));

	// Allow processing time
	await wait(100);

	// Verify the effect
	t.expect(node.getValue(valueId)).toBeUndefined();
},
```

---

## Test with Multiple CCs

Some tests require multiple CCs on the same node:

```typescript
nodeCapabilities: {
	commandClasses: [
		CommandClasses.Version,
		ccCaps({
			ccId: CommandClasses["User Code"],
			version: 2,
			numUsers: 10,
			supportedASCIIChars: "0123456789",
			supportedUserIDStatuses: [
				UserIDStatus.Available,
				UserIDStatus.Enabled,
			],
		}),
		ccCaps({
			ccId: CommandClasses.Notification,
			isSupported: true,
			notificationTypesAndEvents: {
				[0x06]: [0x01, 0x02, 0x0b],
			},
		}),
	],
},
```
