import {
	type UserCredentialCapability,
	UserCredentialCredentialReportType,
	UserCredentialModifierType,
	UserCredentialOperationType,
	UserCredentialRule,
	UserCredentialType,
} from "@zwave-js/cc";
import {
	UserCredentialCCCredentialReport,
	UserCredentialCCCredentialSet,
} from "@zwave-js/cc/UserCredentialCC";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import {
	type MockNodeBehavior,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

// Regression test: a CredentialReport whose reportType is DuplicateCredential
// references the EXISTING duplicate's (userId, slot), not the requested one.
// The response matcher must accept such a report even though its slot differs
// from the CredentialSet's slot — otherwise the API call times out.
integrationTest(
	"CredentialSet accepts a DuplicateCredential report referencing a different user/slot",
	{
		nodeCapabilities: {
			commandClasses: [
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
						[
							UserCredentialType.PINCode,
							{
								numberOfCredentialSlots: 10,
								minCredentialLength: 4,
								maxCredentialLength: 10,
								maxCredentialHashLength: 0,
								supportsCredentialLearn: false,
							} satisfies UserCredentialCapability,
						],
					]),
				}),
			],
		},

		customSetup: async (_driver, _controller, mockNode) => {
			// Override the default CredentialSet handler so the reply points at
			// a DIFFERENT (userId, slot) than was requested — this is how real
			// locks report a DuplicateCredential.
			const duplicateResponder: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof UserCredentialCCCredentialSet
						&& receivedCC.operationType
							=== UserCredentialOperationType.Add
					) {
						const report = new UserCredentialCCCredentialReport({
							nodeId: controller.ownNodeId,
							reportType: UserCredentialCredentialReportType
								.DuplicateCredential,
							userId: 1,
							credentialType: receivedCC.credentialType,
							credentialSlot: 1,
							credentialReadBack: true,
							credentialData: Bytes.from("1234", "ascii"),
							modifierType: UserCredentialModifierType.ZWave,
							modifierNodeId: controller.ownNodeId,
						});
						await self.sendToController(
							createMockZWaveRequestFrame(report, {
								ackRequested: false,
							}),
						);
						return { action: "ok" };
					}
				},
			};
			mockNode.defineBehavior(duplicateResponder);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const api = node.commandClasses["User Credential"];

			// Without the matcher fix, this call would time out and resolve
			// to `undefined` because the response references a different slot.
			const result = await api.setCredential({
				userId: 2,
				credentialType: UserCredentialType.PINCode,
				credentialSlot: 2,
				operationType: UserCredentialOperationType.Add,
				credentialData: Bytes.from("1234", "ascii"),
			});

			t.expect(result).toBeDefined();
			t.expect(result!.reportType).toBe(
				UserCredentialCredentialReportType.DuplicateCredential,
			);
			t.expect(result!.userId).toBe(1);
			t.expect(result!.credentialSlot).toBe(1);
			t.expect(result!.credentialType).toBe(UserCredentialType.PINCode);
		},
	},
);
