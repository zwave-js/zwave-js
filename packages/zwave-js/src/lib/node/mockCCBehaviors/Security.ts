import {
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
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";

// Respond to Scheme Get with Scheme Report
const respondToSchemeGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof SecurityCCSchemeGet) {
			// This essentially means that the device is going to be bootstrapped
			// with Security S0. We need to set up the security manager accordingly
			// with the temporary key.
			const tempKey = new Uint8Array(16).fill(0x00);
			self.securityManagers.securityManager = new SecurityManager({
				ownNodeId: self.id,
				networkKey: tempKey,
				nonceTimeout: 100000,
			});

			// Now respond to the Scheme Get
			const cc = new SecurityCCSchemeReport({
				nodeId: controller.ownNodeId,
			});
			return { action: "sendCC", cc };
		}
	},
};

// Respond to S0 Nonce Get
const respondToS0NonceGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		const sm0Node = self.securityManagers.securityManager;
		if (!sm0Node) return;

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

// Respond to S0 Commands Supported Get
const respondToS0CommandsSupportedGet: MockNodeBehavior = {
	async handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof SecurityCCCommandsSupportedGet) {
			// Determine securely supported CCs from the mock node's implementedCCs
			const supportedCCs = [...self.implementedCCs.entries()]
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

// Parse and unwrap Security CC commands.
const encapsulateS0CC: MockNodeBehavior = {
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
				(
					resp,
				): resp is MockZWaveFrame & {
					type: MockZWaveFrameType.Request;
					payload: SecurityCCNonceReport;
				} => resp.type === MockZWaveFrameType.Request
					&& resp.payload instanceof SecurityCCNonceReport,
				{ timeout: 1000 },
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

export const SecurityCCHooks = [
	encapsulateS0CC,
];

export const SecurityCCBehaviors = [
	respondToSchemeGet,
	respondToS0NonceGet,
	respondToNetworkKeySet,
	respondToS0CommandsSupportedGet,
];
