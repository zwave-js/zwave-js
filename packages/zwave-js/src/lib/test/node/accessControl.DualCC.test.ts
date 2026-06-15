import {
	type UserCredentialCapability,
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserType,
	UserIDStatus,
} from "@zwave-js/cc";
import { UserCodeCCSet } from "@zwave-js/cc/UserCodeCC";
import { UserCredentialCCCredentialSet } from "@zwave-js/cc/UserCredentialCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

// These tests cover nodes that support BOTH User Code CC and
// User Credential CC. The User Credential CC is preferred, but only
// when its interview yielded usable capabilities. Otherwise the
// User Code CC is used as a fallback.

const userCodeCCCapabilities = ccCaps({
	ccId: CommandClasses["User Code"],
	version: 1,
	numUsers: 10,
	supportedASCIIChars: "0123456789",
	supportedUserIDStatuses: [
		UserIDStatus.Available,
		UserIDStatus.Enabled,
		UserIDStatus.Disabled,
	],
});

integrationTest(
	"Falls back to User Code CC when User Credential CC reports no users",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				userCodeCCCapabilities,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 0,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 16,
					supportedUserTypes: [UserCredentialUserType.General],
					supportedCredentialTypes: new Map(),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Capabilities must be derived from User Code CC
			const userCaps = node.accessControl!.getUserCapabilitiesCached();
			t.expect(userCaps.maxUsers).toBe(10);

			const credCaps = node.accessControl!
				.getCredentialCapabilitiesCached();
			const pinCap = credCaps.supportedCredentialTypes.get(
				UserCredentialType.PINCode,
			);
			t.expect(pinCap).toBeDefined();
			t.expect(pinCap!.numberOfCredentialSlots).toBe(10);

			// ...and writes must go through User Code CC
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
					errorMessage: "Should have used User Code Set",
				},
			);
		},
	},
);

integrationTest(
	"Falls back to User Code CC when User Credential CC reports no usable credential types",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				userCodeCCCapabilities,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 20,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 16,
					supportedUserTypes: [UserCredentialUserType.General],
					supportedCredentialTypes: new Map<
						UserCredentialType,
						UserCredentialCapability
					>([
						[UserCredentialType.PINCode, {
							numberOfCredentialSlots: 0,
							minCredentialLength: 4,
							maxCredentialLength: 10,
							maxCredentialHashLength: 0,
							supportsCredentialLearn: false,
						}],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Capabilities must be derived from User Code CC
			const userCaps = node.accessControl!.getUserCapabilitiesCached();
			t.expect(userCaps.maxUsers).toBe(10);

			const credCaps = node.accessControl!
				.getCredentialCapabilitiesCached();
			const pinCap = credCaps.supportedCredentialTypes.get(
				UserCredentialType.PINCode,
			);
			t.expect(pinCap).toBeDefined();
			t.expect(pinCap!.numberOfCredentialSlots).toBe(10);

			// ...and writes must go through User Code CC
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
					errorMessage: "Should have used User Code Set",
				},
			);
		},
	},
);

integrationTest(
	"Prefers User Credential CC when it reports usable capabilities",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				userCodeCCCapabilities,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					numberOfSupportedUsers: 20,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 16,
					supportedUserTypes: [UserCredentialUserType.General],
					supportedCredentialTypes: new Map<
						UserCredentialType,
						UserCredentialCapability
					>([
						[UserCredentialType.PINCode, {
							numberOfCredentialSlots: 5,
							minCredentialLength: 4,
							maxCredentialLength: 10,
							maxCredentialHashLength: 0,
							supportsCredentialLearn: false,
						}],
					]),
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Capabilities must be derived from User Credential CC
			const userCaps = node.accessControl!.getUserCapabilitiesCached();
			t.expect(userCaps.maxUsers).toBe(20);

			const credCaps = node.accessControl!
				.getCredentialCapabilitiesCached();
			const pinCap = credCaps.supportedCredentialTypes.get(
				UserCredentialType.PINCode,
			);
			t.expect(pinCap).toBeDefined();
			t.expect(pinCap!.numberOfCredentialSlots).toBe(5);

			// ...and writes must go through User Credential CC. The user
			// must exist first, since U3C does not auto-create users.
			await node.accessControl!.setUser(2, {});
			await node.accessControl!.setCredential(
				2,
				UserCredentialType.PINCode,
				2,
				"5678",
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCCredentialSet,
				{
					errorMessage: "Should have used User Credential Set",
				},
			);
		},
	},
);
