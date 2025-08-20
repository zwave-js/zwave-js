import {
	type CommandClass,
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
} from "@zwave-js/cc";
import {
	CommandClasses,
	SecurityClass,
	SecurityManager,
	SecurityManager2,
} from "@zwave-js/core";
import {
	type MockNodeBehavior,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

// Test case for the issue: Security (2) CC interview should not be skipped when Version CC is not supported

integrationTest(
	"Security CC interview should happen when Version CC is not supported",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				// Note: Version CC is NOT included
				CommandClasses["Manufacturer Specific"],
				CommandClasses["Z-Wave Plus Info"],
				CommandClasses.Security,
				CommandClasses["Security 2"],
				CommandClasses.Supervision,
				CommandClasses["Transport Service"],
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Create a security manager for the node
			const smNode = new SecurityManager2({
				ownNodeId: mockNode.id,
				networkKey: driver.options.securityKeys!.S2_Unauthenticated!,
				nonceTimeout: 100000,
			});
			mockNode.securityManagers.securityManager2 = smNode;

			// Create a security manager for the controller
			const smController = new SecurityManager2({
				ownNodeId: controller.ownNodeId,
				networkKey: driver.options.securityKeys!.S2_Unauthenticated!,
				nonceTimeout: 100000,
			});
			controller.securityManagers.securityManager2 = smController;

			// Security S0 manager
			const sm0Node = new SecurityManager({
				ownNodeId: mockNode.id,
				networkKey: driver.options.securityKeys!.S0_Legacy!,
				nonceTimeout: 100000,
			});
			mockNode.securityManagers.securityManager = sm0Node;

			const sm0Controller = new SecurityManager({
				ownNodeId: controller.ownNodeId,
				networkKey: driver.options.securityKeys!.S0_Legacy!,
				nonceTimeout: 100000,
			});
			controller.securityManagers.securityManager = sm0Controller;

			// Respond to S2 Nonce Get
			const respondToS2NonceGet: MockNodeBehavior = {
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
			mockNode.defineBehavior(respondToS2NonceGet);

			// Respond to S2 Commands Supported Get
			const respondToS2CommandsSupportedGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof Security2CCMessageEncapsulation
						&& receivedCC.encapsulated instanceof Security2CCCommandsSupportedGet
					) {
						let cc: CommandClass = new Security2CCCommandsSupportedReport({
							nodeId: controller.ownNodeId,
							supportedCCs: [
								// Report the node supports some CCs securely
								CommandClasses["Manufacturer Specific"],
								CommandClasses["Z-Wave Plus Info"],
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
			mockNode.defineBehavior(respondToS2CommandsSupportedGet);

			// Respond to S0 Nonce Get
			const respondToS0NonceGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof SecurityCCNonceGet) {
						const nonce = sm0Node.generateNonce(8);
						const cc = new SecurityCCNonceReport({
							nodeId: controller.ownNodeId,
							nonce,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToS0NonceGet);

			// Respond to S0 Commands Supported Get
			const respondToS0CommandsSupportedGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof SecurityCCCommandEncapsulation) {
						const encapsulated = receivedCC.encapsulated;
						if (encapsulated instanceof SecurityCCCommandsSupportedGet) {
							const receiverNonce = sm0Node.generateNonce(8);
							const response = new SecurityCCCommandsSupportedReport({
								nodeId: self.id,
								supportedCCs: [
									CommandClasses["Manufacturer Specific"],
									CommandClasses["Z-Wave Plus Info"],
								],
								controlledCCs: [],
								reportsToFollow: 0,
							});
							const cc = SecurityCC.encapsulate(
								self.id,
								self.securityManagers.securityManager!,
								response,
							);
							cc.nonce = receiverNonce;
							await self.sendToController(
								createMockZWaveRequestFrame(cc, {
									ackRequested: false,
								}),
							);

							return { action: "stop" };
						}
					}
				},
			};
			mockNode.defineBehavior(respondToS0CommandsSupportedGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Verify that the node correctly reports it doesn't support Version CC
			t.expect(node.supportsCC(CommandClasses.Version)).toBe(false);

			// But it should still support Security CCs
			t.expect(node.supportsCC(CommandClasses.Security)).toBe(true);
			t.expect(node.supportsCC(CommandClasses["Security 2"])).toBe(true);

			// Verify that Security CC interviews actually happened
			const securityInstance = node.createCCInstanceInternal(CommandClasses.Security)!;
			const security2Instance = node.createCCInstanceInternal(CommandClasses["Security 2"])!;

			t.expect(securityInstance.isInterviewComplete(driver)).toBe(true);
			t.expect(security2Instance.isInterviewComplete(driver)).toBe(true);

			// Verify that the node was granted security classes
			t.expect(node.hasSecurityClass(SecurityClass.S0_Legacy)).toBe(true);
			t.expect(node.hasSecurityClass(SecurityClass.S2_Unauthenticated)).toBe(true);
		},
	},
);