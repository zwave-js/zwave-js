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
	UserCodeCCGet,
	UserCodeCCReport,
	UserCodeCCSet,
	UserCodeCCValues,
} from "@zwave-js/cc/UserCodeCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import type { MockNodeBehavior } from "@zwave-js/testing";
import {
	SetCredentialResult,
	SetUserResult,
} from "../../node/feature-apis/AccessControl.js";
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
			const userCaps = node.accessControl!.getUserCapabilitiesCached();
			t.expect(userCaps).toBeDefined();
			t.expect(userCaps.maxUsers).toBe(10);
			t.expect(userCaps.supportedUserTypes).toStrictEqual([
				UserCredentialUserType.General,
				UserCredentialUserType.NonAccess,
			]);
			t.expect(userCaps.maxUserNameLength).toBeUndefined();
			t.expect(userCaps.supportedCredentialRules).toStrictEqual([
				UserCredentialRule.Single,
			]);
			t.expect(userCaps.supportsUsersWithoutCredentials).toBe(false);

			// Credential capabilities
			const credCaps = node.accessControl!
				.getCredentialCapabilitiesCached();
			t.expect(credCaps).toBeDefined();
			t.expect(credCaps.supportsAdminCode).toBe(true);
			t.expect(credCaps.supportsAdminCodeDeactivation).toBe(true);
			t.expect(credCaps.supportedCredentialTypes.size).toBe(1);

			const pinCap = credCaps.supportedCredentialTypes.get(
				UserCredentialType.PINCode,
			);
			t.expect(pinCap).toBeDefined();
			t.expect(pinCap!.numberOfCredentialSlots).toBe(10);
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
			const caps = node.accessControl!.getUserCapabilitiesCached();
			t.expect(caps.supportedUserTypes).toStrictEqual([
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
			const user1 = node.accessControl!.getUserCached(1);
			t.expect(user1).toBeDefined();
			t.expect(user1!.active).toBe(true);
			t.expect(user1!.userType).toBe(UserCredentialUserType.General);

			// User 2: Disabled -> active: false, userType: General
			const user2 = node.accessControl!.getUserCached(2);
			t.expect(user2).toBeDefined();
			t.expect(user2!.active).toBe(false);
			t.expect(user2!.userType).toBe(UserCredentialUserType.General);

			// User 3: Messaging -> active: true, userType: NonAccess
			const user3 = node.accessControl!.getUserCached(3);
			t.expect(user3).toBeDefined();
			t.expect(user3!.active).toBe(true);
			t.expect(user3!.userType).toBe(UserCredentialUserType.NonAccess);

			// User 4: not set -> undefined
			t.expect(node.accessControl!.getUserCached(4)).toBeUndefined();

			// getUsers should return 3 users
			const users = node.accessControl!.getUsersCached();
			t.expect(users.length).toBe(3);
		},
	},
);

integrationTest(
	"getCredentialsForUserCached maps each User Code CC user to a single PINCode credential",
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
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(2).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(2).id, "5678");

			const creds = node.accessControl!.getCredentialsForUserCached(1);
			t.expect(creds.length).toBe(1);
			t.expect(creds[0].type).toBe(UserCredentialType.PINCode);
			t.expect(creds[0].slot).toBe(1);
			t.expect(creds[0].data).toBe("1234");

			t.expect(
				node.accessControl!.getCredentialCached(
					UserCredentialType.PINCode,
					2,
				),
			).toMatchObject({
				userId: 2,
				type: UserCredentialType.PINCode,
				slot: 2,
				data: "5678",
			});
			t.expect(
				node.accessControl!.getCredentialsForUserCached(2)[0].slot,
			).toBe(2);
			t.expect(
				node.accessControl!.getCredentialsByTypeCached(
					UserCredentialType.PINCode,
				).length,
			).toBe(2);
			t.expect(node.accessControl!.getAllCredentialsCached().length).toBe(
				2,
			);

			// Non-existent user has no credentials
			t.expect(node.accessControl!.getCredentialsForUserCached(3).length)
				.toBe(0);
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
			const credEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential added",
				(_node, args) => credEvent.resolve(args),
			);

			await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				2,
				"1234",
			);

			t.expect(await credEvent.promise).toMatchObject({
				userId: 2,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 2,
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
			// Pre-populate user 2
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(2).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(2).id, "1234");

			const credEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential modified",
				(_node, args) => credEvent.resolve(args),
			);

			await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				2,
				"5678",
			);

			t.expect(await credEvent.promise).toMatchObject({
				userId: 2,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 2,
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

			const userEvent = Promise.withResolvers<unknown>();
			const credEvent = Promise.withResolvers<unknown>();
			node.on("user deleted", (_node, args) => userEvent.resolve(args));
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);

			await node.accessControl!.deleteUser(1);

			t.expect(await userEvent.promise).toMatchObject({ userId: 1 });
			t.expect(await credEvent.promise).toMatchObject({
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
			await node.accessControl!.deleteUser(5);

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
			await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				2,
				"1234",
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0].userId === 2
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Enabled,
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet for userId 2 with Enabled status",
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
			await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				2,
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

			const userEvent = Promise.withResolvers<unknown>();
			node.on("user added", (_node, args) => userEvent.resolve(args));

			await node.accessControl!.setUser(1, {
				active: true,
				userType: UserCredentialUserType.General,
			});

			t.expect(await userEvent.promise).toMatchObject({
				userId: 1,
				active: true,
				userType: UserCredentialUserType.General,
			});
		},
	},
);

integrationTest(
	"deleteCredential emits credential deleted + user deleted events on UC (cross-deletion cascade)",
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
			// Pre-populate user 2
			node.valueDB.setValue(
				UserCodeCCValues.userIdStatus(2).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(2).id, "1234");

			const credEvent = Promise.withResolvers<unknown>();
			const userEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);
			node.on("user deleted", (_node, args) => userEvent.resolve(args));

			await node.accessControl!.deleteCredential(
				2,
				UserCredentialType.PINCode,
				2,
			);
			t.expect(
				node.accessControl!.getCredentialCached(
					UserCredentialType.PINCode,
					2,
				),
			).toBeUndefined();
			t.expect(node.accessControl!.getUserCached(2)).toBeUndefined();

			t.expect(await credEvent.promise).toMatchObject({
				userId: 2,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 2,
			});
			t.expect(await userEvent.promise).toMatchObject({ userId: 2 });
		},
	},
);

integrationTest(
	"deleteCredential(type, slot) overload on UC treats slot as the user identifier",
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
				UserCodeCCValues.userIdStatus(3).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(3).id, "9999");

			const credEvent = Promise.withResolvers<unknown>();
			const userEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);
			node.on("user deleted", (_node, args) => userEvent.resolve(args));

			await node.accessControl!.deleteCredential(
				UserCredentialType.PINCode,
				3,
			);

			t.expect(await credEvent.promise).toMatchObject({
				userId: 3,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 3,
			});
			t.expect(await userEvent.promise).toMatchObject({ userId: 3 });
		},
	},
);

integrationTest(
	"deleteCredentials for a single user emits credential deleted + user deleted events on UC",
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
				UserCodeCCValues.userIdStatus(4).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(4).id, "1111");

			const credEvent = Promise.withResolvers<unknown>();
			const userEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);
			node.on("user deleted", (_node, args) => userEvent.resolve(args));

			await node.accessControl!.deleteCredentials({ userId: 4 });
			t.expect(
				node.accessControl!.getCredentialCached(
					UserCredentialType.PINCode,
					4,
				),
			).toBeUndefined();
			t.expect(node.accessControl!.getUserCached(4)).toBeUndefined();

			t.expect(await credEvent.promise).toMatchObject({
				userId: 4,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 4,
			});
			t.expect(await userEvent.promise).toMatchObject({ userId: 4 });
		},
	},
);

integrationTest(
	"deleteCredentials throws on UC when credentialType is unsupported",
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
			await t.expect(
				node.accessControl!.deleteCredentials({
					userId: 1,
					credentialType: UserCredentialType.Password,
				}),
			).rejects.toThrow();
		},
	},
);

integrationTest(
	"deleteCredentials without filters emits wildcard credential deleted + user deleted events on UC",
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
			const credEvent = Promise.withResolvers<unknown>();
			const userEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);
			node.on("user deleted", (_node, args) => userEvent.resolve(args));

			await node.accessControl!.deleteCredentials();

			t.expect(await credEvent.promise).toMatchObject({
				userId: 0,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 0,
			});
			t.expect(await userEvent.promise).toMatchObject({ userId: 0 });

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
			await node.accessControl!.deleteAllUsers();

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
			await node.accessControl!.setAdminCode("9999");
			const code = await node.accessControl!.getAdminCode();
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

			await node.accessControl!.setUser(1, {
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

			await node.accessControl!.deleteCredential(
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
			await node.accessControl!.setAdminCode("9999");

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
			await node.accessControl!.getAdminCode();

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
			await node.accessControl!.deleteUser(1);

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

// =============================================================================
// Credential slot values other than the user ID are ignored
// =============================================================================

integrationTest(
	"setCredential ignores slot !== userId and emits event with slot = userId",
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
			const credEvent = Promise.withResolvers<unknown>();
			node.on(
				"credential added",
				(_node, args) => credEvent.resolve(args),
			);

			await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				99,
				"1234",
			);

			t.expect(await credEvent.promise).toMatchObject({
				userId: 2,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 2,
				data: "1234",
			});
		},
	},
);

// =============================================================================
// addUser
// =============================================================================

integrationTest(
	"addUser without credential throws on UC",
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
			await t.expect(
				node.accessControl!.addUser(1, {
					active: true,
					userType: UserCredentialUserType.General,
				}),
			).rejects.toThrow(/credential/i);
		},
	},
);

integrationTest(
	"addUser with credential.slot !== userId throws on UC",
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
			await t.expect(
				node.accessControl!.addUser(
					1,
					{
						active: true,
						userType: UserCredentialUserType.General,
					},
					{
						type: UserCredentialType.PINCode,
						slot: 99,
						data: "1234",
					},
				),
			).rejects.toThrow(/slot must equal the user ID/i);
		},
	},
);

integrationTest(
	"addUser with credential writes user+code in a single Set on UC and emits both events",
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
			const userEvent = createDeferredPromise<unknown>();
			const credEvent = createDeferredPromise<unknown>();
			node.on("user added", (_node, args) => userEvent.resolve(args));
			node.on(
				"credential added",
				(_node, args) => credEvent.resolve(args),
			);

			const result = await node.accessControl!.addUser(
				3,
				{
					active: true,
					userType: UserCredentialUserType.General,
				},
				{
					type: UserCredentialType.PINCode,
					slot: 3,
					data: "1234",
				},
			);

			t.expect(result).toEqual({
				user: SetUserResult.OK,
				credential: SetCredentialResult.OK,
			});

			t.expect(await userEvent).toMatchObject({
				userId: 3,
				active: true,
				userType: UserCredentialUserType.General,
			});
			t.expect(await credEvent).toMatchObject({
				userId: 3,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 3,
				data: "1234",
			});

			// A single ExtendedUserCodeSet writes both the user status and
			// the code together — verify that frame was sent.
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0].userId === 3
					&& frame.payload.userCodes[0].userIdStatus
						=== UserIDStatus.Enabled
					&& frame.payload.userCodes[0].userCode === "1234",
				{
					errorMessage:
						"Should have sent ExtendedUserCodeSet for userId 3 with code 1234",
				},
			);
		},
	},
);

integrationTest(
	"deleteCredential rejects with ModifyRejectedLocationEmpty when slot !== userId on UC",
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
				UserCodeCCValues.userIdStatus(2).id,
				UserIDStatus.Enabled,
			);
			node.valueDB.setValue(UserCodeCCValues.userCode(2).id, "1234");

			let emitted = false;
			node.on("credential deleted", () => {
				emitted = true;
			});

			const result = await node.accessControl!.deleteCredential(
				2,
				UserCredentialType.PINCode,
				99,
			);

			t.expect(result).toBe(
				SetCredentialResult.Error_ModifyRejectedLocationEmpty,
			);
			t.expect(emitted).toBe(false);
		},
	},
);

// =============================================================================
// Post-clear value DB state
//
// User Code CC reserves a permanent slot per user identifier, so a cleared
// slot must persist as `userIdStatus = Available` and `userCode = ""` rather
// than being removed from the value DB. This mirrors what `persistUserCode`
// would write after a Get → Report round-trip.
// =============================================================================

integrationTest(
	"deleteCredential persists cleared slot as Available + empty code on UC",
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
			const statusVid = UserCodeCCValues.userIdStatus(2).id;
			const codeVid = UserCodeCCValues.userCode(2).id;
			node.valueDB.setValue(statusVid, UserIDStatus.Enabled);
			node.valueDB.setValue(codeVid, "1234");

			await node.accessControl!.deleteCredential(
				2,
				UserCredentialType.PINCode,
				2,
			);

			t.expect(node.valueDB.getValue(statusVid)).toBe(
				UserIDStatus.Available,
			);
			t.expect(node.valueDB.getValue(codeVid)).toBe("");
		},
	},
);

integrationTest(
	"deleteUser persists cleared slot as Available + empty code on UC",
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
			const statusVid = UserCodeCCValues.userIdStatus(1).id;
			const codeVid = UserCodeCCValues.userCode(1).id;
			node.valueDB.setValue(statusVid, UserIDStatus.Enabled);
			node.valueDB.setValue(codeVid, "5678");

			await node.accessControl!.deleteUser(1);

			t.expect(node.valueDB.getValue(statusVid)).toBe(
				UserIDStatus.Available,
			);
			t.expect(node.valueDB.getValue(codeVid)).toBe("");
		},
	},
);

integrationTest(
	"deleteCredentials persists cleared slot as Available + empty code on UC",
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
			const statusVid = UserCodeCCValues.userIdStatus(4).id;
			const codeVid = UserCodeCCValues.userCode(4).id;
			node.valueDB.setValue(statusVid, UserIDStatus.Enabled);
			node.valueDB.setValue(codeVid, "1111");

			await node.accessControl!.deleteCredentials({ userId: 4 });

			t.expect(node.valueDB.getValue(statusVid)).toBe(
				UserIDStatus.Available,
			);
			t.expect(node.valueDB.getValue(codeVid)).toBe("");
		},
	},
);

integrationTest(
	"deleteAllUsers persists all cleared slots as Available + empty code on UC",
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
			const status1Vid = UserCodeCCValues.userIdStatus(1).id;
			const code1Vid = UserCodeCCValues.userCode(1).id;
			const status2Vid = UserCodeCCValues.userIdStatus(2).id;
			const code2Vid = UserCodeCCValues.userCode(2).id;
			node.valueDB.setValue(status1Vid, UserIDStatus.Enabled);
			node.valueDB.setValue(code1Vid, "1111");
			node.valueDB.setValue(status2Vid, UserIDStatus.Enabled);
			node.valueDB.setValue(code2Vid, "2222");

			await node.accessControl!.deleteAllUsers();

			t.expect(node.valueDB.getValue(status1Vid)).toBe(
				UserIDStatus.Available,
			);
			t.expect(node.valueDB.getValue(code1Vid)).toBe("");
			t.expect(node.valueDB.getValue(status2Vid)).toBe(
				UserIDStatus.Available,
			);
			t.expect(node.valueDB.getValue(code2Vid)).toBe("");
		},
	},
);

// =============================================================================
// Obfuscated user code read-back
//
// It has been found that some version 1 nodes wrongfully report obfuscated User
// Codes in the User Code Report (e.g. "******"), so a code that was set
// correctly cannot be read back.
// =============================================================================

/**
 * Returns a behavior that answers every User Code Get with the given obfuscated
 * code, while still reporting the slot as Enabled (these nodes obfuscate only
 * the code, not the status).
 */
function obfuscateUserCodeReadBack(obfuscatedCode: string): MockNodeBehavior {
	return {
		handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof UserCodeCCGet) {
				const cc = new UserCodeCCReport({
					nodeId: controller.ownNodeId,
					userId: receivedCC.userId,
					userIdStatus: UserIDStatus.Enabled,
					userCode: obfuscatedCode,
				});
				return { action: "sendCC", cc };
			}
		},
	};
}

integrationTest(
	"setCredential succeeds when a V1 node reports an obfuscated code (asterisks)",
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

		customSetup: async (driver, controller, mockNode) => {
			mockNode.defineBehavior(obfuscateUserCodeReadBack("******"));
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const result = await node.accessControl!.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"1234",
			);
			// CC:0063.01.00.32.002  A controlling node SHOULD understand that a
			// code has been set correctly but cannot be read back with such nodes.
			t.expect(result).toBe(SetCredentialResult.OK);
		},
	},
);

integrationTest(
	"setCredential succeeds when a V1 node reports obfuscated asterisks of differing length",
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

		customSetup: async (driver, controller, mockNode) => {
			// 6-digit code set, read back as 4 asterisks
			mockNode.defineBehavior(obfuscateUserCodeReadBack("****"));
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const result = await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				2,
				"123456",
			);
			// CC:0063.01.00.32.002  A controlling node SHOULD understand that a
			// code has been set correctly but cannot be read back with such nodes.
			t.expect(result).toBe(SetCredentialResult.OK);
		},
	},
);

integrationTest(
	"setCredential fails when a V1 node reports a different, non-obfuscated code",
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

		customSetup: async (driver, controller, mockNode) => {
			// A genuinely different code is not an obfuscation and must not be
			// treated as a successful set
			mockNode.defineBehavior(obfuscateUserCodeReadBack("9999"));
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const result = await node.accessControl!.setCredential(
				3,
				UserCredentialType.PINCode,
				3,
				"4321",
			);
			t.expect(result).toBe(SetCredentialResult.Error_Unknown);
		},
	},
);

integrationTest(
	"addUser succeeds when a V1 node reports an obfuscated code",
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

		customSetup: async (driver, controller, mockNode) => {
			mockNode.defineBehavior(obfuscateUserCodeReadBack("*****"));
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const result = await node.accessControl!.addUser(
				4,
				{
					active: true,
					userType: UserCredentialUserType.General,
				},
				{
					type: UserCredentialType.PINCode,
					slot: 4,
					data: "5678",
				},
			);
			// CC:0063.01.00.32.002  A controlling node SHOULD understand that a
			// code has been set correctly but cannot be read back with such nodes.
			t.expect(result).toEqual({
				user: SetUserResult.OK,
				credential: SetCredentialResult.OK,
			});
		},
	},
);

integrationTest(
	"setCredential fails when a V2 node reports an obfuscated code (leniency is V1-only)",
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

		customSetup: async (driver, controller, mockNode) => {
			mockNode.defineBehavior(obfuscateUserCodeReadBack("******"));
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const result = await node.accessControl!.setCredential(
				5,
				UserCredentialType.PINCode,
				5,
				"1234",
			);
			t.expect(result).toBe(SetCredentialResult.Error_Unknown);
		},
	},
);
