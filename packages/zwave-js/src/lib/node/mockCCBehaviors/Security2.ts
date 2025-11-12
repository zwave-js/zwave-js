import {
	CommandClass,
	InvalidCC,
	Security2CC,
	Security2CCCommandsSupportedGet,
	Security2CCCommandsSupportedReport,
	Security2CCMessageEncapsulation,
	Security2CCNonceGet,
	Security2CCNonceReport,
	Security2Command,
} from "@zwave-js/cc";
import { CommandClasses, EncapsulationFlags, ZWaveErrorCodes } from "@zwave-js/core";
import { type MockNodeBehavior } from "@zwave-js/testing";

// Respond to S2 Nonce Get
const respondToS2NonceGet: MockNodeBehavior = {
	async handleCC(controller, self, receivedCC) {
		const sm2Node = self.securityManagers.securityManager2;
		if (!sm2Node) return;

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

// Handle decode errors
const handleS2DecodeError: MockNodeBehavior = {
	async handleCC(controller, self, receivedCC) {
		const sm2Node = self.securityManagers.securityManager2;
		if (!sm2Node) return;

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

const respondToS2CommandsSupportedGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (
			receivedCC
				instanceof Security2CCCommandsSupportedGet
		) {
			const encapCC = receivedCC.getEncapsulatingCC(
				CommandClasses["Security 2"],
				Security2Command.MessageEncapsulation,
			) as Security2CCMessageEncapsulation | undefined;
			if (!encapCC) return;

			const isHighestGranted = encapCC.securityClass
				=== self.encodingContext.getHighestSecurityClass(
					self.id,
				);

			const cc = Security2CC.encapsulate(
				new Security2CCCommandsSupportedReport({
					nodeId: controller.ownNodeId,
					supportedCCs: isHighestGranted
						? [...self.implementedCCs.entries()]
							.filter(
								([ccId, info]) =>
									info.secure
									&& ccId
										!== CommandClasses[
											"Security 2"
										],
							)
							.map(([ccId]) => ccId)
						: [],
				}),
				self.id,
				self.securityManagers,
			);
			return { action: "sendCC", cc };
		}
	},
};

// Parse and unwrap Security2 CC commands.
const encapsulateS2CC: MockNodeBehavior = {
	async transformIncomingCC(controller, self, receivedCC) {
		if (
			receivedCC instanceof Security2CCMessageEncapsulation
			&& receivedCC.encapsulated
		) {
			receivedCC.encapsulated?.toggleEncapsulationFlag(EncapsulationFlags.Security, true);
			return receivedCC.encapsulated;
		}

		return receivedCC;
	},

	async transformResponse(controller, self, receivedCC, response) {
		// Ensure that responses to S2-encapsulated CCs are also S2-encapsulated
		if (
			response.action === "sendCC"
			&& receivedCC instanceof CommandClass
			&& receivedCC.isEncapsulatedWith(CommandClasses["Security 2"])
			&& !(response.cc instanceof Security2CCMessageEncapsulation)
		) {
			// Encapsulate the response
			const encapsulated = Security2CC.encapsulate(
				response.cc,
				self.id,
				self.securityManagers,
			);
			response.cc = encapsulated;
		}

		return response;
	},
};

export const Security2CCHooks = [
	encapsulateS2CC,
];

export const Security2CCBehaviors = [
	respondToS2NonceGet,
	handleS2DecodeError,
	respondToS2CommandsSupportedGet,
];
