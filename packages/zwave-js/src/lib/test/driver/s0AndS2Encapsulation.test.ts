import {
	type CommandClass,
	InvalidCC,
	Security2CC,
	Security2CCMessageEncapsulation,
	Security2CCNonceGet,
	Security2CCNonceReport,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SupervisionCCGet,
	SupervisionCCReport,
} from "@zwave-js/cc";
import {
	CommandClasses,
	SecurityClass,
	SecurityManager2,
	SupervisionStatus,
	ZWaveErrorCodes,
	securityClassOrder as allSecurityClasses,
} from "@zwave-js/core";
import { type MockNodeBehavior, MockZWaveFrameType } from "@zwave-js/testing";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("S0 commands are S0-encapsulated, even when S2 is supported", {
	// debug: true,

	// We need the cache to skip the CC interviews and mark S2 as supported
	provisioningDirectory: path.join(
		__dirname,
		"fixtures/s0AndS2Encapsulation",
	),

	nodeCapabilities: {
		commandClasses: [
			{ ccId: CommandClasses.Basic, secure: true },
			CommandClasses.Version,
			CommandClasses.Security,
			CommandClasses["Security 2"],
		],
		securityClasses: new Set(allSecurityClasses),
	},

	customSetup: async (driver, controller, mockNode) => {
		// Create a security manager for the node
		const sm2Node = await SecurityManager2.create();
		// Copy keys from the driver
		await sm2Node.setKey(
			SecurityClass.S2_AccessControl,
			driver.options.securityKeys!.S2_AccessControl!,
		);
		await sm2Node.setKey(
			SecurityClass.S2_Authenticated,
			driver.options.securityKeys!.S2_Authenticated!,
		);
		await sm2Node.setKey(
			SecurityClass.S2_Unauthenticated,
			driver.options.securityKeys!.S2_Unauthenticated!,
		);
		mockNode.securityManagers.securityManager2 = sm2Node;
		mockNode.encodingContext.getHighestSecurityClass = () =>
			SecurityClass.S2_Unauthenticated;

		// Create a security manager for the controller
		const smCtrlr = await SecurityManager2.create();
		// Copy keys from the driver
		await smCtrlr.setKey(
			SecurityClass.S2_AccessControl,
			driver.options.securityKeys!.S2_AccessControl!,
		);
		await smCtrlr.setKey(
			SecurityClass.S2_Authenticated,
			driver.options.securityKeys!.S2_Authenticated!,
		);
		await smCtrlr.setKey(
			SecurityClass.S2_Unauthenticated,
			driver.options.securityKeys!.S2_Unauthenticated!,
		);
		controller.securityManagers.securityManager2 = smCtrlr;
		controller.encodingContext.getHighestSecurityClass = () =>
			SecurityClass.S2_Unauthenticated;

		// Respond to S2 Nonce Get
		const respondToS2NonceGet: MockNodeBehavior = {
			async handleCC(controller, self, receivedCC) {
				if (receivedCC instanceof Security2CCNonceGet) {
					const nonce = await sm2Node.generateNonce(
						controller.ownNodeId,
					);
					const cc = new Security2CCNonceReport({
						nodeId: controller.ownNodeId,
						SOS: true,
						MOS: false,
						receiverEI: nonce,
					});
					return { action: "sendCC", cc };
				}
			},
		};
		mockNode.defineBehavior(respondToS2NonceGet);

		// Handle decode errors
		const handleInvalidCC: MockNodeBehavior = {
			async handleCC(controller, self, receivedCC) {
				if (receivedCC instanceof InvalidCC) {
					if (
						receivedCC.reason
							=== ZWaveErrorCodes.Security2CC_CannotDecode
						|| receivedCC.reason
							=== ZWaveErrorCodes.Security2CC_NoSPAN
					) {
						const nonce = await sm2Node.generateNonce(
							controller.ownNodeId,
						);
						const cc = new Security2CCNonceReport({
							nodeId: controller.ownNodeId,
							SOS: true,
							MOS: false,
							receiverEI: nonce,
						});
						return { action: "sendCC", cc };
					}
				}
			},
		};
		mockNode.defineBehavior(handleInvalidCC);

		// Just have the node respond to all Supervision Get positively
		const respondToSupervisionGet: MockNodeBehavior = {
			handleCC(controller, self, receivedCC) {
				if (
					receivedCC instanceof Security2CCMessageEncapsulation
					&& receivedCC.encapsulated instanceof SupervisionCCGet
				) {
					let cc: CommandClass = new SupervisionCCReport({
						nodeId: controller.ownNodeId,
						sessionId: receivedCC.encapsulated.sessionId,
						moreUpdatesFollow: false,
						status: SupervisionStatus.Success,
					});
					cc = Security2CC.encapsulate(
						cc,
						self.id,
						self.securityManagers,
					);
					return { action: "sendCC", cc };
				}
			},
		};
		mockNode.defineBehavior(respondToSupervisionGet);
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		await node.commandClasses.Security.getSupportedCommands();

		mockNode.assertReceivedControllerFrame(
			(f) =>
				f.type === MockZWaveFrameType.Request
				&& f.payload instanceof SecurityCCCommandEncapsulation
				&& f.payload.encapsulated
					instanceof SecurityCCCommandsSupportedGet,
		);
	},
});
