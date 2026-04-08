import {
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserType,
	UserIDStatus,
} from "@zwave-js/cc";
import {
	UserCodeCCAdminCodeGet,
	UserCodeCCAdminCodeSet,
	UserCodeCCExtendedUserCodeSet,
	UserCodeCCSet,
	UserCodeCCValues,
} from "@zwave-js/cc/UserCodeCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { integrationTest } from "../integrationTestSuite.js";

// =============================================================================
// Capabilities
// =============================================================================

integrationTest(
	"Capabilities are translated correctly for User Code CC V2",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportedASCIIChars: "0123456789",
					supportsAdminCode: true,
					supportsAdminCodeDeactivation: true,
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
						UserIDStatus.Disabled,
						UserIDStatus.Messaging,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// User capabilities
			const userCaps = node.getUserCapabilitiesCached();
			t.expect(userCaps).toBeDefined();
			t.expect(userCaps!.maxUsers).toBe(10);
			t.expect(userCaps!.supportedUserTypes).toStrictEqual([
				UserCredentialUserType.General,
				UserCredentialUserType.NonAccess,
			]);
			t.expect(userCaps!.maxUserNameLength).toBeUndefined();
			t.expect(userCaps!.supportedCredentialRules).toStrictEqual([
				UserCredentialRule.Single,
			]);

			// Credential capabilities
			const credCaps = node.getCredentialCapabilitiesCached();
			t.expect(credCaps).toBeDefined();
			t.expect(credCaps!.supportsAdminCode).toBe(true);
			t.expect(credCaps!.supportsAdminCodeDeactivation).toBe(true);
			t.expect(credCaps!.supportedCredentialTypes.size).toBe(1);

			const pinCap = credCaps!.supportedCredentialTypes.get(
				UserCredentialType.PINCode,
			);
			t.expect(pinCap).toBeDefined();
			t.expect(pinCap!.numberOfCredentialSlots).toBe(1);
			t.expect(pinCap!.minCredentialLength).toBe(4);
			t.expect(pinCap!.maxCredentialLength).toBe(10);
			t.expect(pinCap!.supportsCredentialLearn).toBe(false);
		},
	},
);

integrationTest(
	"User Code CC without Messaging status does not advertise NonAccess user type",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 5,
					supportedASCIIChars: "0123456789",
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
						UserIDStatus.Disabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const caps = node.getUserCapabilitiesCached();
			t.expect(caps!.supportedUserTypes).toStrictEqual([
				UserCredentialUserType.General,
			]);
		},
	},
);

// =============================================================================
// User and credential reads after interview
// =============================================================================

integrationTest(
	"getUserCached maps UserIDStatus to active + userType correctly",
	{
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
						UserIDStatus.Disabled,
						UserIDStatus.Messaging,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Populate the value DB directly (interview doesn't query codes by default)
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(1).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(2).id,
				UserIDStatus.Disabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(2).id, "5678");
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(3).id,
				UserIDStatus.Messaging,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(3).id, "9999");

			// User 1: Enabled -> active: true, userType: General
			const user1 = node.getUserCached(1);
			t.expect(user1).toBeDefined();
			t.expect(user1!.active).toBe(true);
			t.expect(user1!.userType).toBe(UserCredentialUserType.General);

			// User 2: Disabled -> active: false, userType: General
			const user2 = node.getUserCached(2);
			t.expect(user2).toBeDefined();
			t.expect(user2!.active).toBe(false);
			t.expect(user2!.userType).toBe(UserCredentialUserType.General);

			// User 3: Messaging -> active: true, userType: NonAccess
			const user3 = node.getUserCached(3);
			t.expect(user3).toBeDefined();
			t.expect(user3!.active).toBe(true);
			t.expect(user3!.userType).toBe(UserCredentialUserType.NonAccess);

			// User 4: not set -> undefined
			t.expect(node.getUserCached(4)).toBeUndefined();

			// getUsers should return 3 users
			const users = node.getUsersCached();
			t.expect(users.length).toBe(3);
		},
	},
);

integrationTest(
	"getCredentialsCached maps each User Code CC user to a single PINCode credential",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 5,
					supportedASCIIChars: "0123456789",
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Populate value DB directly
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(1).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			const creds = node.getCredentialsCached(1);
			t.expect(creds.length).toBe(1);
			t.expect(creds[0].type).toBe(UserCredentialType.PINCode);
			t.expect(creds[0].slot).toBe(1);
			t.expect(creds[0].data).toBe("1234");

			// Non-existent user has no credentials
			t.expect(node.getCredentialsCached(2).length).toBe(0);
		},
	},
);

// =============================================================================
// Events from unsolicited reports
// =============================================================================

integrationTest(
	"setCredential emits credential added event for new credential",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const credEvent = createDeferredPromise<unknown>();
			node.on(
				"credential added",
				(_node, args) => credEvent.resolve(args),
			);

			await node.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"1234",
			);

			t.expect(await credEvent).toMatchObject({
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
				data: "1234",
			});
		},
	},
);

integrationTest(
	"setCredential emits credential modified event for existing credential",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pre-populate user 1
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(1).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			const credEvent = createDeferredPromise<unknown>();
			node.on(
				"credential modified",
				(_node, args) => credEvent.resolve(args),
			);

			await node.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"5678",
			);

			t.expect(await credEvent).toMatchObject({
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
				data: "5678",
			});
		},
	},
);

integrationTest(
	"deleteUser emits user deleted + credential deleted events for existing user",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pre-populate user 1
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(1).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			const userEvent = createDeferredPromise<unknown>();
			const credEvent = createDeferredPromise<unknown>();
			node.on("user deleted", (_node, args) => userEvent.resolve(args));
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);

			await node.deleteUser(1);

			t.expect(await userEvent).toMatchObject({ userId: 1 });
			t.expect(await credEvent).toMatchObject({
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
			});
		},
	},
);

integrationTest(
	"deleteUser does not emit events for non-existing user",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			let eventEmitted = false;
			node.on("user deleted", () => eventEmitted = true);
			node.on("credential deleted", () => eventEmitted = true);

			// User 5 is within range but was never set
			await node.deleteUser(5);

			// Give the driver time to process
			await new Promise((resolve) => setTimeout(resolve, 100));
			t.expect(eventEmitted).toBe(false);
		},
	},
);

// =============================================================================
// Set-type commands use correct CC commands
// =============================================================================

integrationTest(
	"setCredential uses Extended User Code Set on V2 nodes",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"1234",
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0].userId === 1
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Enabled,
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet for userId 1 with Enabled status",
				},
			);
		},
	},
);

integrationTest(
	"setCredential uses legacy User Code Set on V1 nodes",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
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
			await node.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"5678",
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCSet,
				{
					errorMessage: "Should have used legacy UserCodeSet",
				},
			);
		},
	},
);

integrationTest(
	"setUser emits user added event for new user",
	{
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
						UserIDStatus.Disabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pre-populate a credential so setUser has a code to send
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			const userEvent = createDeferredPromise<unknown>();
			node.on("user added", (_node, args) => userEvent.resolve(args));

			await node.setUser(1, {
				active: true,
				userType: UserCredentialUserType.General,
			});

			t.expect(await userEvent).toMatchObject({
				userId: 1,
				active: true,
				userType: UserCredentialUserType.General,
			});
		},
	},
);

integrationTest(
	"deleteCredential emits credential deleted event for existing credential",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pre-populate user 1
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(1).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			const credEvent = createDeferredPromise<unknown>();
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);

			await node.deleteCredential(
				1,
				UserCredentialType.PINCode,
				1,
			);

			t.expect(await credEvent).toMatchObject({
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
			});
		},
	},
);

integrationTest(
	"deleteAllUsers sends Extended User Code Set on V2 nodes",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.deleteAllUsers();

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes.length === 1
					&& frame.payload.userCodes[0].userId === 0
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Available,
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet with userId 0 and Available status",
				},
			);
		},
	},
);

integrationTest(
	"setAdminCode + getAdminCode round-trip returns the set value",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportedASCIIChars: "0123456789",
					supportsAdminCode: true,
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set admin code, then read it back
			await node.setAdminCode("9999");
			const code = await node.getAdminCode();
			t.expect(code).toBe("9999");
		},
	},
);

integrationTest(
	"setUser sends Extended User Code Set on V2 nodes",
	{
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
						UserIDStatus.Disabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			await node.setUser(1, {
				active: false,
				userType: UserCredentialUserType.General,
			});

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0].userId === 1
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Disabled,
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet for userId 1 with Disabled status",
				},
			);
		},
	},
);

integrationTest(
	"deleteCredential sends Extended User Code Set to clear on V2 nodes",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(1).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(1).id, "1234");

			await node.deleteCredential(
				1,
				UserCredentialType.PINCode,
				1,
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0].userId === 1
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Available,
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet for userId 1 with Available status",
				},
			);
		},
	},
);

integrationTest(
	"setAdminCode sends AdminCodeSet",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportedASCIIChars: "0123456789",
					supportsAdminCode: true,
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.setAdminCode("9999");

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCAdminCodeSet,
				{
					errorMessage: "Should have sent AdminCodeSet",
				},
			);
		},
	},
);

integrationTest(
	"getAdminCode sends AdminCodeGet",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportedASCIIChars: "0123456789",
					supportsAdminCode: true,
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.getAdminCode();

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCAdminCodeGet,
				{
					errorMessage: "Should have sent AdminCodeGet",
				},
			);
		},
	},
);

integrationTest(
	"deleteUser uses Extended User Code Set to clear on V2 nodes",
	{
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
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.deleteUser(1);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0].userId === 1
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Available,
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet for userId 1 with Available status",
				},
			);
		},
	},
);
