import {
	type CommandClass,
	InvalidCC,
	Security2CC,
	Security2CCCommandsSupportedGet,
	Security2CCCommandsSupportedReport,
	Security2CCMessageEncapsulation,
	Security2CCNonceGet,
	Security2CCNonceReport,
	SecurityCC,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SecurityCCCommandsSupportedReport,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
	VersionCCCommandClassGet,
	VersionCCCommandClassReport,
} from "@zwave-js/cc";
import {
	CommandClasses,
	SecurityClass,
	SecurityManager,
	SecurityManager2,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import {
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

// Repro for https://github.com/zwave-js/zwave-js/issues/6305

integrationTest(
	"CC Version 0 is ignored for known supported CCs: Security S2",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Security 2"],
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Create a security manager for the node
			const smNode = await SecurityManager2.create();
			// Copy keys from the driver
			await smNode.setKey(
				SecurityClass.S2_Unauthenticated,
				driver.options.securityKeys!.S2_Unauthenticated!,
			);
			mockNode.securityManagers.securityManager2 = smNode;
			mockNode.encodingContext.getHighestSecurityClass = () =>
				SecurityClass.S2_Unauthenticated;

			// Create a security manager for the controller
			const smCtrlr = await SecurityManager2.create();
			// Copy keys from the driver
			await smCtrlr.setKey(
				SecurityClass.S2_Unauthenticated,
				driver.options.securityKeys!.S2_Unauthenticated!,
			);
			controller.securityManagers.securityManager2 = smCtrlr;
			controller.encodingContext.getHighestSecurityClass = () =>
				SecurityClass.S2_Unauthenticated;

			// Respond to Nonce Get
			const respondToNonceGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof Security2CCNonceGet) {
						const nonce = await smNode.generateNonce(
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
			mockNode.defineBehavior(respondToNonceGet);

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
							const nonce = await smNode.generateNonce(
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

			const reportSecurelySupportedCCs: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC
							instanceof Security2CCMessageEncapsulation
						&& receivedCC.securityClass
							=== SecurityClass.S2_Unauthenticated
						&& receivedCC.encapsulated
							instanceof Security2CCCommandsSupportedGet
					) {
						let cc: CommandClass =
							new Security2CCCommandsSupportedReport({
								nodeId: controller.ownNodeId,
								supportedCCs: [
									// The node supports Version CC securely
									CommandClasses.Version,
								],
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
			mockNode.defineBehavior(reportSecurelySupportedCCs);

			const respondWithInvalidVersionReport: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC
							instanceof Security2CCMessageEncapsulation
						&& receivedCC.encapsulated
							instanceof VersionCCCommandClassGet
						&& receivedCC.encapsulated.requestedCC
							=== CommandClasses["Security 2"]
					) {
						let cc: CommandClass = new VersionCCCommandClassReport({
							nodeId: controller.ownNodeId,
							requestedCC: receivedCC.encapsulated.requestedCC,
							ccVersion: 0,
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
			mockNode.defineBehavior(respondWithInvalidVersionReport);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.supportsCC(CommandClasses["Security 2"])).toBe(true);
		},
	},
);

integrationTest(
	"CC Version 0 is ignored for known supported CCs: Security S0",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Security,
				{
					ccId: CommandClasses.Version,
					secure: true,
				},
			],
			securityClasses: new Set([SecurityClass.S0_Legacy]),
		},

		customSetup: async (driver, controller, mockNode) => {
			const respondWithInvalidVersionReport: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof VersionCCCommandClassGet
						&& receivedCC.requestedCC
							=== CommandClasses.Security
					) {
						await wait(100);

						const response = new VersionCCCommandClassReport({
							nodeId: controller.ownNodeId,
							requestedCC: receivedCC.requestedCC,
							ccVersion: 0,
						});

						return { action: "sendCC", cc: response };
					}
				},
			};
			mockNode.defineBehavior(respondWithInvalidVersionReport);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.supportsCC(CommandClasses["Security"])).toBe(true);
		},
	},
);
