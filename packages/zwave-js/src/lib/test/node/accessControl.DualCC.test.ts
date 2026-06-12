import {
	type UserCredentialCapability,
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserType,
	UserIDStatus,
} from "@zwave-js/cc";
import {
	UserCodeCCSet,
	UserCodeCCUsersNumberGet,
} from "@zwave-js/cc/UserCodeCC";
import {
	UserCredentialCCCredentialCapabilitiesGet,
	UserCredentialCCCredentialSet,
	UserCredentialCCUserCapabilitiesGet,
	UserCredentialCCUserGet,
} from "@zwave-js/cc/UserCredentialCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

// These tests cover nodes that support BOTH User Code CC and User Credential
// CC, which the specification refers to as the "User Management Command
// Classes".

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
	"User Credential CC reports 0 users -> stop its interview, use User Code CC",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				userCodeCCCapabilities,
				ccCaps({
					ccId: CommandClasses["User Credential"],
					isSupported: true,
					version: 1,
					// Signals that the node operates in User Code CC mode
					numberOfSupportedUsers: 0,
					supportedCredentialRules: [UserCredentialRule.Single],
					maxUserNameLength: 16,
					supportedUserTypes: [UserCredentialUserType.General],
					supportedCredentialTypes: new Map(),
				}),
			],
		},

		// Keep the frames exchanged during the interview for the assertions
		clearMessageStatsBeforeTest: false,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// CL:0083.01.21.00.5: The interview for those Command Classes
			// MUST follow the interview process according to [the User
			// Management Interview flowcharts].
			// Here, the User Credential CC interview must stop after the
			// User Capabilities exchange:
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCUserCapabilitiesGet,
				{
					errorMessage:
						"User Credential CC user capabilities should have been queried",
				},
			);
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCCredentialCapabilitiesGet,
				{
					noMatch: true,
					errorMessage:
						"User Credential CC credential capabilities should NOT have been queried",
				},
			);
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCredentialCCUserGet,
				{
					noMatch: true,
					errorMessage:
						"User Credential CC users should NOT have been queried",
				},
			);

			// CL:0083.01.21.00.7: In this case, the node MUST continue to
			// interview the supporting node as follows in [the User
			// Management Interview (User Code) flowchart]
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCUsersNumberGet,
				{
					errorMessage: "User Code CC should have been interviewed",
				},
			);

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

			// CL:0083.01.21.00.4: The controlling node MUST use User
			// Credential Command Class to control a supporting node unless
			// the supporting node reports that (0) Users are supported.
			// Here, writes must go through User Code CC:
			mockNode.clearReceivedControllerFrames();
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
	"User Credential CC reports users -> never interview or use User Code CC",
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

		// Keep the frames exchanged during the interview for the assertions
		clearMessageStatsBeforeTest: false,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// CL:0083.01.21.00.6: A controlling node MUST NOT control the
			// User Code on a supporting node that otherwise supports User
			// Credential unless no Users are currently supported on the
			// supporting node.
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload.ccId === CommandClasses["User Code"],
				{
					noMatch: true,
					errorMessage:
						"User Code CC should NOT have been interviewed",
				},
			);

			// CL:0083.01.21.00.5: The interview for those Command Classes
			// MUST follow the interview process according to [the User
			// Management Interview flowcharts].
			// Here, the User Credential CC interview must continue past the
			// User Capabilities exchange:
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof UserCredentialCCCredentialCapabilitiesGet,
				{
					errorMessage:
						"User Credential CC credential capabilities should have been queried",
				},
			);

			// CL:0083.01.21.00.2: The controlling node MUST only use ONE of
			// the User Management Command Classes to control a supporting
			// node, and cache which User Management CC is used for each node.
			// Therefore, only User Credential CC values are exposed:
			const userCodeValueIDs = node
				.getDefinedValueIDs()
				.filter((v) => v.commandClass === CommandClasses["User Code"]);
			t.expect(userCodeValueIDs).toStrictEqual([]);

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

			// CL:0083.01.21.00.4: The controlling node MUST use User
			// Credential Command Class to control a supporting node unless
			// the supporting node reports that (0) Users are supported.
			// Here, writes must go through User Credential CC. The user must
			// exist first, since U3C does not auto-create users.
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
					&& frame.payload
						instanceof UserCredentialCCCredentialSet,
				{
					errorMessage: "Should have used User Credential Set",
				},
			);
		},
	},
);
