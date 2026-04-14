import {
	SupervisionCommand,
	type UserCredentialCapability,
	UserCredentialCredentialReportType,
	UserCredentialModifierType,
	UserCredentialNameEncoding,
	UserCredentialOperationType,
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserReportType,
	UserCredentialUserType,
} from "@zwave-js/cc";
import {
	UserCredentialCCAdminPinCodeGet,
	UserCredentialCCAdminPinCodeSet,
	UserCredentialCCCredentialReport,
	UserCredentialCCCredentialSet,
	UserCredentialCCUserReport,
	UserCredentialCCUserSet,
} from "@zwave-js/cc/UserCredentialCC";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import {
	type MockNodeBehavior,
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { integrationTest } from "../integrationTestSuite.js";

const defaultPINCapability: UserCredentialCapability = {
	numberOfCredentialSlots: 10,
	minCredentialLength: 4,
	maxCredentialLength: 10,
	maxCredentialHashLength: 0,
	supportsCredentialLearn: false,
};

// =============================================================================
// Capabilities
// =============================================================================

integrationTest(
	"Capabilities are passed through correctly for User Credential CC",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 20,
					supportedCredentialRules: [
						UserCredentialRule.Single,
						UserCredentialRule.Dual,
					],
					maxUserNameLength: 64,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: true,
					supportsAdminCodeDeactivation: true,
					supportedUserTypes: [
						UserCredentialUserType.General,
						UserCredentialUserType.NonAccess,
						UserCredentialUserType.Expiring,
					],
					supportedCredentialTypes: new Map<
						UserCredentialType,
						UserCredentialCapability
					>([
						[UserCredentialType.PINCode, defaultPINCapability],
						[
							UserCredentialType.RFIDCode,
							{
								numberOfCredentialSlots: 5,
								minCredentialLength: 4,
								maxCredentialLength: 32,
								maxCredentialHashLength: 16,
								supportsCredentialLearn: true,
								credentialLearnRecommendedTimeout: 30,
								credentialLearnNumberOfSteps: 1,
							},
						],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// User capabilities
			const userCaps = node.accessControl.getUserCapabilitiesCached();
			t.expect(userCaps).toBeDefined();
			t.expect(userCaps!.maxUsers).toBe(20);
			t.expect(userCaps!.maxUserNameLength).toBe(64);
			t.expect(userCaps!.supportedUserTypes).toStrictEqual([
				UserCredentialUserType.General,
				UserCredentialUserType.NonAccess,
				UserCredentialUserType.Expiring,
			]);
			t.expect(userCaps!.supportedCredentialRules).toStrictEqual([
				UserCredentialRule.Single,
				UserCredentialRule.Dual,
			]);

			// Credential capabilities
			const credCaps = node.accessControl
				.getCredentialCapabilitiesCached();
			t.expect(credCaps).toBeDefined();
			t.expect(credCaps!.supportsAdminCode).toBe(true);
			t.expect(credCaps!.supportsAdminCodeDeactivation).toBe(true);
			t.expect(credCaps!.supportedCredentialTypes.size).toBe(2);
			t.expect(
				credCaps!.supportedCredentialTypes.has(
					UserCredentialType.PINCode,
				),
			).toBe(true);
			t.expect(
				credCaps!.supportedCredentialTypes.has(
					UserCredentialType.RFIDCode,
				),
			).toBe(true);

			const rfid = credCaps!.supportedCredentialTypes.get(
				UserCredentialType.RFIDCode,
			);
			t.expect(rfid!.supportsCredentialLearn).toBe(true);
			t.expect(rfid!.numberOfCredentialSlots).toBe(5);
		},
	},
);

// =============================================================================
// User reads after interview
// =============================================================================

integrationTest(
	"getUserCached and getCredentialsCached return data set via the unified API",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 32,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Create a user and credential via the unified API.
			// Wait for the unsolicited report events, which indicate
			// the mock's response has been processed and cached.
			const userCreated = createDeferredPromise<void>();
			node.once("user added", () => userCreated.resolve());
			await node.accessControl.setUser(1, {
				active: true,
				userType: UserCredentialUserType.General,
				userName: "Alice",
			});
			await userCreated;

			const credCreated = createDeferredPromise<void>();
			node.once("credential added", () => credCreated.resolve());
			await node.accessControl.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"1234",
			);
			await credCreated;

			// Now verify reads return the correct data
			const user = node.accessControl.getUserCached(1);
			t.expect(user).toBeDefined();
			t.expect(user!.active).toBe(true);
			t.expect(user!.userType).toBe(UserCredentialUserType.General);
			t.expect(user!.userName).toBe("Alice");

			t.expect(node.accessControl.getUserCached(2)).toBeUndefined();

			const users = node.accessControl.getUsersCached();
			t.expect(users.length).toBe(1);

			const creds = node.accessControl.getCredentialsCached(1);
			t.expect(creds.length).toBe(1);
			t.expect(creds[0].type).toBe(UserCredentialType.PINCode);
			t.expect(creds[0].slot).toBe(1);
		},
	},
);

// =============================================================================
// Events from unsolicited reports
// =============================================================================

integrationTest(
	"Unsolicited UserReport with UserAdded reportType emits user added event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 32,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const userEvent = createDeferredPromise<unknown>();
			node.on("user added", (_node, args) => userEvent.resolve(args));

			const cc = new UserCredentialCCUserReport({
				nodeId: mockController.ownNodeId,
				reportType: UserCredentialUserReportType.UserAdded,
				nextUserId: 0,
				modifierType: UserCredentialModifierType.Locally,
				modifierNodeId: 0,
				userId: 5,
				userType: UserCredentialUserType.General,
				active: true,
				credentialRule: UserCredentialRule.Single,
				expiringTimeoutMinutes: 0,
				nameEncoding: UserCredentialNameEncoding.ASCII,
				userName: "Bob",
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, { ackRequested: false }),
			);

			t.expect(await userEvent).toMatchObject({
				userId: 5,
				active: true,
				userType: UserCredentialUserType.General,
				userName: "Bob",
			});
		},
	},
);

integrationTest(
	"Unsolicited UserReport with UserModified reportType emits user modified event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 32,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const userEvent = createDeferredPromise<unknown>();
			node.on("user modified", (_node, args) => userEvent.resolve(args));

			const cc = new UserCredentialCCUserReport({
				nodeId: mockController.ownNodeId,
				reportType: UserCredentialUserReportType.UserModified,
				nextUserId: 0,
				modifierType: UserCredentialModifierType.ZWave,
				modifierNodeId: 1,
				userId: 2,
				userType: UserCredentialUserType.General,
				active: false,
				credentialRule: UserCredentialRule.Single,
				expiringTimeoutMinutes: 0,
				nameEncoding: UserCredentialNameEncoding.ASCII,
				userName: "Disabled User",
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, { ackRequested: false }),
			);

			t.expect(await userEvent).toMatchObject({
				userId: 2,
				active: false,
				userType: UserCredentialUserType.General,
				userName: "Disabled User",
			});
		},
	},
);

integrationTest(
	"Unsolicited UserReport with UserDeleted reportType emits user deleted event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const userEvent = createDeferredPromise<unknown>();
			node.on("user deleted", (_node, args) => userEvent.resolve(args));

			const cc = new UserCredentialCCUserReport({
				nodeId: mockController.ownNodeId,
				reportType: UserCredentialUserReportType.UserDeleted,
				nextUserId: 0,
				modifierType: UserCredentialModifierType.ZWave,
				modifierNodeId: 1,
				userId: 3,
				userType: UserCredentialUserType.General,
				active: false,
				credentialRule: UserCredentialRule.Single,
				expiringTimeoutMinutes: 0,
				nameEncoding: UserCredentialNameEncoding.ASCII,
				userName: "",
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, { ackRequested: false }),
			);

			t.expect(await userEvent).toMatchObject({
				userId: 3,
			});
		},
	},
);

integrationTest(
	"Unsolicited CredentialReport with CredentialAdded reportType emits credential added event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const credEvent = createDeferredPromise<unknown>();
			node.on(
				"credential added",
				(_node, args) => credEvent.resolve(args),
			);

			const cc = new UserCredentialCCCredentialReport({
				nodeId: mockController.ownNodeId,
				reportType: UserCredentialCredentialReportType.CredentialAdded,
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
				credentialReadBack: true,
				credentialLength: 4,
				credentialData: Bytes.from("9876", "ascii"),
				modifierType: UserCredentialModifierType.Locally,
				modifierNodeId: 0,
				nextCredentialType: UserCredentialType.None,
				nextCredentialSlot: 0,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, { ackRequested: false }),
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
	"Unsolicited CredentialReport with CredentialModified reportType emits credential modified event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const credEvent = createDeferredPromise<unknown>();
			node.on(
				"credential modified",
				(_node, args) => credEvent.resolve(args),
			);

			const cc = new UserCredentialCCCredentialReport({
				nodeId: mockController.ownNodeId,
				reportType:
					UserCredentialCredentialReportType.CredentialModified,
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
				credentialReadBack: true,
				credentialLength: 4,
				credentialData: Bytes.from("5555", "ascii"),
				modifierType: UserCredentialModifierType.Locally,
				modifierNodeId: 0,
				nextCredentialType: UserCredentialType.None,
				nextCredentialSlot: 0,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, { ackRequested: false }),
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
	"Unsolicited CredentialReport with CredentialDeleted reportType emits credential deleted event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const credEvent = createDeferredPromise<unknown>();
			node.on(
				"credential deleted",
				(_node, args) => credEvent.resolve(args),
			);

			const cc = new UserCredentialCCCredentialReport({
				nodeId: mockController.ownNodeId,
				reportType:
					UserCredentialCredentialReportType.CredentialDeleted,
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
				credentialReadBack: false,
				credentialLength: 0,
				credentialData: new Bytes(),
				modifierType: UserCredentialModifierType.ZWave,
				modifierNodeId: 1,
				nextCredentialType: UserCredentialType.None,
				nextCredentialSlot: 0,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, { ackRequested: false }),
			);

			t.expect(await credEvent).toMatchObject({
				userId: 1,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 1,
			});
		},
	},
);

// =============================================================================
// Set-type commands use correct CC commands
// =============================================================================

integrationTest(
	"setUser sends UserSet with Add operationType for new users",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 32,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.setUser(1, {
				active: true,
				userType: UserCredentialUserType.General,
				userName: "Charlie",
			});

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCUserSet
					&& frame.payload.operationType
						=== UserCredentialOperationType.Add
					&& frame.payload.userId === 1,
				{
					errorMessage: "Should have sent UserSet with Add operation",
				},
			);
		},
	},
);

integrationTest(
	"setCredential sends CredentialSet with Add operationType for new credentials",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.setCredential(
				1,
				UserCredentialType.PINCode,
				1,
				"4567",
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCCredentialSet
					&& frame.payload.operationType
						=== UserCredentialOperationType.Add
					&& frame.payload.userId === 1
					&& frame.payload.credentialType
						=== UserCredentialType.PINCode
					&& frame.payload.credentialSlot === 1,
				{
					errorMessage:
						"Should have sent CredentialSet with Add operation",
				},
			);
		},
	},
);

integrationTest(
	"deleteUser sends UserSet with Delete operationType",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.deleteUser(5);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCUserSet
					&& frame.payload.operationType
						=== UserCredentialOperationType.Delete
					&& frame.payload.userId === 5,
				{
					errorMessage:
						"Should have sent UserSet with Delete operation",
				},
			);
		},
	},
);

integrationTest(
	"deleteAllUsers sends UserSet with Delete operationType and userId 0",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.deleteAllUsers();

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCUserSet
					&& frame.payload.operationType
						=== UserCredentialOperationType.Delete
					&& frame.payload.userId === 0,
				{
					errorMessage:
						"Should have sent UserSet Delete with userId 0",
				},
			);
		},
	},
);

integrationTest(
	"deleteCredential sends CredentialSet with Delete operationType",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: false,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.deleteCredential(
				1,
				UserCredentialType.PINCode,
				1,
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCCredentialSet
					&& frame.payload.operationType
						=== UserCredentialOperationType.Delete
					&& frame.payload.userId === 1
					&& frame.payload.credentialType
						=== UserCredentialType.PINCode
					&& frame.payload.credentialSlot === 1,
				{
					errorMessage: "Should have sent CredentialSet Delete",
				},
			);
		},
	},
);

integrationTest(
	"setAdminCode sends AdminPinCodeSet",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: true,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.setAdminCode("9876");

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCAdminPinCodeSet,
				{
					errorMessage: "Should have sent AdminPinCodeSet",
				},
			);
		},
	},
);

integrationTest(
	"getAdminCode sends AdminPinCodeGet",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 10,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 0,
					supportsAllUsersChecksum: false,
					supportsUserChecksum: false,
					supportsAdminCode: true,
					supportedCredentialTypes: new Map([
						[UserCredentialType.PINCode, defaultPINCapability],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.accessControl.getAdminCode();

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCAdminPinCodeGet,
				{
					errorMessage: "Should have sent AdminPinCodeGet",
				},
			);
		},
	},
);

const defaultDeleteTestCaps = {
	ccId: CommandClasses["User Credential"],
	isSupported: true,
	version: 1,
	numberOfSupportedUsers: 10,
	supportedCredentialRules: [UserCredentialRule.Single],
	maxUserNameLength: 32,
	supportsAllUsersChecksum: false,
	supportsUserChecksum: false,
	supportsAdminCode: false,
	supportedCredentialTypes: new Map([
		[UserCredentialType.PINCode, defaultPINCapability],
	]),
};

/** Creates a user and credential via the API, waits for the reports to be cached */
async function populateUserAndCredential(
	node: Parameters<Parameters<typeof integrationTest>[1]["testBody"]>[2],
) {
	const userCreated = createDeferredPromise<void>();
	node.once("user added", () => userCreated.resolve());
	await node.accessControl.setUser(1, {
		active: true,
		userType: UserCredentialUserType.General,
		userName: "Test",
	});
	await userCreated;

	const credCreated = createDeferredPromise<void>();
	node.once("credential added", () => credCreated.resolve());
	await node.accessControl.setCredential(
		1,
		UserCredentialType.PINCode,
		1,
		"1234",
	);
	await credCreated;
}

integrationTest(
	"deleteUser purges cached credentials (unsupervised)",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps(defaultDeleteTestCaps),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await populateUserAndCredential(node);

			// Verify data is cached
			t.expect(node.accessControl.getUserCached(1)).toBeDefined();
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(1);

			const deleted = createDeferredPromise<void>();
			node.once("user deleted", () => deleted.resolve());
			await node.accessControl.deleteUser(1);
			await deleted;

			// User values are purged by the CC report handler,
			// credentials must be purged by the AccessControl mixin
			t.expect(node.accessControl.getUserCached(1)).toBeUndefined();
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(0);
		},
	},
);

integrationTest(
	"deleteUser does not purge cached credentials on supervised failure",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses.Supervision,
				ccCaps(defaultDeleteTestCaps),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Only reject supervised Delete operations
			const rejectSupervisedUserDelete: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof UserCredentialCCUserSet
						&& receivedCC.operationType
							=== UserCredentialOperationType.Delete
						&& receivedCC.isEncapsulatedWith(
							CommandClasses.Supervision,
							SupervisionCommand.Get,
						)
					) {
						return { action: "fail" };
					}
				},
			};
			mockNode.defineBehavior(rejectSupervisedUserDelete);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await populateUserAndCredential(node);

			t.expect(node.accessControl.getUserCached(1)).toBeDefined();
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(1);

			await node.accessControl.deleteUser(1);

			// Supervised command failed — cache must remain intact
			t.expect(node.accessControl.getUserCached(1)).toBeDefined();
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(1);
		},
	},
);

integrationTest(
	"deleteAllUsers purges all cached users and credentials (unsupervised)",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps(defaultDeleteTestCaps),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await populateUserAndCredential(node);

			t.expect(node.accessControl.getUsersCached().length).toBe(1);
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(1);

			// deleteAllUsers returns after the API call completes;
			// the purge happens synchronously before returning
			await node.accessControl.deleteAllUsers();

			t.expect(node.accessControl.getUsersCached().length).toBe(0);
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(0);
		},
	},
);

integrationTest(
	"deleteAllUsers does not purge on supervised failure",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses.Supervision,
				ccCaps(defaultDeleteTestCaps),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			const rejectSupervisedUserDelete: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof UserCredentialCCUserSet
						&& receivedCC.operationType
							=== UserCredentialOperationType.Delete
						&& receivedCC.isEncapsulatedWith(
							CommandClasses.Supervision,
							SupervisionCommand.Get,
						)
					) {
						return { action: "fail" };
					}
				},
			};
			mockNode.defineBehavior(rejectSupervisedUserDelete);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await populateUserAndCredential(node);

			t.expect(node.accessControl.getUsersCached().length).toBe(1);
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(1);

			await node.accessControl.deleteAllUsers();

			// Supervised command failed — cache must remain intact
			t.expect(node.accessControl.getUsersCached().length).toBe(1);
			t.expect(node.accessControl.getCredentialsCached(1).length).toBe(1);
		},
	},
);
