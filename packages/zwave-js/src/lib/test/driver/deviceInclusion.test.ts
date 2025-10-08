import {
	BinarySwitchCCValues,
	CommandClass,
	SecurityCC,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SecurityCCCommandsSupportedReport,
	SecurityCCNetworkKeySet,
	SecurityCCNetworkKeyVerify,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
	SecurityCCSchemeGet,
	SecurityCCSchemeReport,
} from "@zwave-js/cc";
import {
	CommandClasses,
	SecurityManager,
	isEncapsulationCC,
} from "@zwave-js/core";
import {
	type MockNode,
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { InclusionStrategy } from "../../controller/Inclusion.js";
import type { ZWaveNode } from "../../node/Node.js";
import { integrationTest } from "../integrationTestSuite.js";
import { integrationTest as integrationTestMulti } from "../integrationTestSuiteMulti.js";

integrationTest(
	"Device inclusion process should emit 'node added' event",
	{
		// debug: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set up a promise to wait for the "node added" event
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (addedNode, result) => {
					t.expect(addedNode.id).toBe(3);
					t.expect(result).toBeDefined();
					resolve();
				});
			});

			// Set up the node that will be included
			mockController.nodePendingInclusion = {
				id: 3,
				capabilities: {
					basicDeviceClass: 0x04,
					genericDeviceClass: 0x10,
					specificDeviceClass: 0x01,
					commandClasses: [
						CommandClasses["Z-Wave Plus Info"],
						CommandClasses["Manufacturer Specific"],
						CommandClasses["Device Reset Locally"],
						CommandClasses.Security,
						CommandClasses.Powerlevel,
						CommandClasses["Firmware Update Meta Data"],
					],
				},
			};

			// Start the inclusion process
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Default,
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Verify that the node was added to the controller's nodes map
			const addedNode = driver.controller.nodes.get(3);
			t.expect(addedNode).toBeDefined();
			t.expect(addedNode?.id).toBe(3);
		},
	},
);

function setupS0NodeBehaviorsForNewlyIncludedNode(
	mockNode: MockNode,
): void {
	// Create a security manager for the node with temporary key (all zeros)
	// The real network key will be set after receiving SecurityCCNetworkKeySet
	const temporaryKey = new Uint8Array(16).fill(0x00);
	const sm0Node = new SecurityManager({
		ownNodeId: mockNode.id,
		networkKey: temporaryKey,
		nonceTimeout: 100000,
	});
	mockNode.securityManagers.securityManager = sm0Node;

	// Respond to Scheme Get with Scheme Report
	const respondToSchemeGet: MockNodeBehavior = {
		handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof SecurityCCSchemeGet) {
				const cc = new SecurityCCSchemeReport({
					nodeId: controller.ownNodeId,
				});
				return { action: "sendCC", cc };
			}
		},
	};
	mockNode.defineBehavior(respondToSchemeGet);

	// Respond to S0 Nonce Get
	const respondToS0NonceGet: MockNodeBehavior = {
		handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof SecurityCCNonceGet) {
				const nonce = sm0Node.generateNonce(controller.ownNodeId, 8);
				const cc = new SecurityCCNonceReport({
					nodeId: controller.ownNodeId,
					nonce,
				});
				return { action: "sendCC", cc };
			}
		},
	};
	mockNode.defineBehavior(respondToS0NonceGet);

	// Respond to Network Key Set with Network Key Verify
	const respondToNetworkKeySet: MockNodeBehavior = {
		async handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof SecurityCCNetworkKeySet) {
				// Update the node's security manager to use the received network key
				const receivedKey = receivedCC.networkKey;
				self.securityManagers.securityManager!.networkKey = receivedKey;

				const response = new SecurityCCNetworkKeyVerify({
					nodeId: controller.ownNodeId,
				});

				return { action: "sendCC", cc: response };
			}
		},
	};
	mockNode.defineBehavior(respondToNetworkKeySet);

	// Respond to S0 Commands Supported Get
	const respondToS0CommandsSupportedGet: MockNodeBehavior = {
		async handleCC(controller, self, receivedCC) {
			if (receivedCC instanceof SecurityCCCommandsSupportedGet) {
				// Determine securely supported CCs from the mock node's implementedCCs
				const supportedCCs = [...mockNode.implementedCCs.entries()]
					.filter(
						([cc, info]) =>
							info.secure === true
							&& !isEncapsulationCC(cc),
					)
					.map(([cc]) => cc);

				const response = new SecurityCCCommandsSupportedReport({
					nodeId: controller.ownNodeId,
					supportedCCs,
					controlledCCs: [],
					reportsToFollow: 0,
				});

				return { action: "sendCC", cc: response };
			}
		},
	};
	mockNode.defineBehavior(respondToS0CommandsSupportedGet);

	// Parse and unwrap Security CC commands. This MUST be defined last, since defineBehavior will prepend it to the list
	const parseS0CC: MockNodeBehavior = {
		async transformIncomingCC(controller, self, receivedCC) {
			// We don't support sequenced commands here
			if (receivedCC instanceof SecurityCCCommandEncapsulation) {
				await receivedCC.mergePartialCCs([], {
					sourceNodeId: controller.ownNodeId,
					__internalIsMockNode: true,
					frameType: "singlecast",
					...self.encodingContext,
					...self.securityManagers,
				});
				// Return the unwrapped command
				if (receivedCC.encapsulated) {
					return receivedCC.encapsulated;
				}
			}
			return receivedCC;
		},

		async transformResponse(controller, self, receivedCC, response) {
			// Ensure that responses to S0-encapsulated CCs are also S0-encapsulated
			if (
				response.action === "sendCC"
				&& receivedCC instanceof CommandClass
				&& receivedCC.isEncapsulatedWith(CommandClasses.Security)
				&& !response.cc.isEncapsulatedWith(CommandClasses.Security)
			) {
				// The mock node does not have the magic for automatically
				// encapsulating commands, so we have to do it ourselves here.
				// This requires a nonce exchange.
				const nonceGet = new SecurityCCNonceGet({
					nodeId: controller.ownNodeId,
				});
				await self.sendToController(
					createMockZWaveRequestFrame(nonceGet, {
						ackRequested: false,
					}),
				);

				const nonceReport = await self.expectControllerFrame(
					1000,
					(
						resp,
					): resp is MockZWaveFrame & {
						type: MockZWaveFrameType.Request;
						payload: SecurityCCNonceReport;
					} => resp.type === MockZWaveFrameType.Request
						&& resp.payload instanceof SecurityCCNonceReport,
				);
				const receiverNonce = nonceReport.payload.nonce;

				// Encapsulate the response
				const encapsulated = SecurityCC.encapsulate(
					self.id,
					self.securityManagers.securityManager!,
					response.cc,
				);
				encapsulated.nonce = receiverNonce;

				response.cc = encapsulated;
			}

			return response;
		},
	};
	mockNode.defineBehavior(parseS0CC);
}

integrationTestMulti(
	"Inclusion with S0 should work",
	{
		// debug: true,

		async customSetup(driver, mockController, mockNodes) {
			// Create a security manager for the controller with the real network key
			const sm0Ctrlr = new SecurityManager({
				ownNodeId: mockController.ownNodeId,
				networkKey: driver.options.securityKeys!.S0_Legacy!,
				nonceTimeout: 100000,
			});
			mockController.securityManagers.securityManager = sm0Ctrlr;
		},

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			// Set up a promise to wait for the "node added" event
			let includedNode: ZWaveNode | undefined;
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (node) => {
					includedNode = node;
					resolve();
				});
			});

			// Set up the node that will be included
			mockController.nodePendingInclusion = {
				id: 3,
				capabilities: {
					basicDeviceClass: 0x04,
					genericDeviceClass: 0x10,
					specificDeviceClass: 0x01,
					commandClasses: [
						CommandClasses["Z-Wave Plus Info"],
						CommandClasses["Manufacturer Specific"],
						CommandClasses["Device Reset Locally"],
						CommandClasses.Security,
						CommandClasses.Powerlevel,
						CommandClasses["Firmware Update Meta Data"],
						ccCaps({
							ccId: CommandClasses["Binary Switch"],
							secure: true,
							defaultValue: false,
						}),
					],
				},
				setup: setupS0NodeBehaviorsForNewlyIncludedNode,
			};

			// Start the inclusion process with S0
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Security_S0,
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Wait for the interview to complete
			const interviewCompletePromise = new Promise<void>((resolve) => {
				includedNode!.once("interview completed", () => {
					resolve();
				});
			});
			await interviewCompletePromise;

			// Verify that the node was added to the controller's nodes map
			t.expect(includedNode).toBeDefined();
			t.expect(includedNode!.id).toBe(3);
			t.expect(includedNode!.isSecure).toBe(true);
			t.expect(includedNode!.supportsCC(CommandClasses.Security)).toBe(
				true,
			);

			// That Binary Switch CC is only supported securely
			t.expect(includedNode?.isCCSecure(CommandClasses["Binary Switch"]))
				.toBe(true);

			// And that we received a response when querying its value during the interview
			t.expect(
				includedNode?.getValue(BinarySwitchCCValues.currentValue.id),
			).toBe(false);
		},
	},
);
