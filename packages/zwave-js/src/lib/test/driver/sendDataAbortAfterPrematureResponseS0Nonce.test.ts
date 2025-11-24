import {
	BasicCCGet,
	BasicCCReport,
	BasicCCSet,
	BasicCCValues,
	SecurityCCCommandEncapsulation,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
	SetValueStatus,
	SupervisionCCGet,
	SupervisionCCReport,
} from "@zwave-js/cc";
import {
	SecurityClass,
	SupervisionStatus,
	TransmitStatus,
	isSupervisionResult,
} from "@zwave-js/core";
import {
	SendDataAbort,
	SendDataBridgeRequest,
	SendDataRequestTransmitReport,
} from "@zwave-js/serial";
import {
	type MockControllerBehavior,
	type MockNodeBehavior,
	MockZWaveFrameType,
	createMockZWaveAckFrame,
} from "@zwave-js/testing";
import path from "node:path";
import {
	MockControllerCommunicationState,
	MockControllerStateKeys,
} from "../../controller/MockControllerState.js";
import { integrationTest } from "../integrationTestSuite.js";

// For some reason the test runner throws an error after the test is done
// when this test is run in the same context as the test in
// sendDataAbortAfterPrematureResponse.test.ts
// Therefore this needs to be its own file.

integrationTest(
	"A premature S0 Nonce Report does not cause an error",
	{
		// Repro for #8406, part 2
		// debug: true,

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/s0Encapsulation",
		),

		nodeCapabilities: {
			// For now this is needed, because the security classes are not taken from the provisioning cache
			securityClasses: new Set([SecurityClass.S0_Legacy]),
		},

		async customSetup(driver, mockController, mockNode) {
			let lastCallbackId: number | undefined;
			const handleSendDataAbort: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SendDataBridgeRequest) {
						// Remember the last callback ID
						lastCallbackId = msg.callbackId;
						return false;
					}
					if (msg instanceof SendDataAbort && lastCallbackId) {
						// Finish the transmission by sending the callback
						const cb = new SendDataRequestTransmitReport({
							callbackId: lastCallbackId,
							transmitStatus: TransmitStatus.NoAck,
						});

						setTimeout(() => {
							controller.sendMessageToHost(cb);
						}, 100);

						// Put the controller into idle state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);

						// Return to normal operation
						mockNode.autoAckControllerFrames = true;

						return true;
					}
				},
			};
			mockController.defineBehavior(handleSendDataAbort);

			const respondToBasicGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 42,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicGet);

			// Respond to S0 Nonce Get
			const respondToS0NonceGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					const sm0Node = self.securityManagers.securityManager;
					if (!sm0Node) return;

					if (receivedCC instanceof SecurityCCNonceGet) {
						// Send a delayted ACK
						setTimeout(() => {
							self.sendToController(createMockZWaveAckFrame());
						}, 100);

						const nonce = sm0Node.generateNonce(
							controller.ownNodeId,
							8,
						);
						const cc = new SecurityCCNonceReport({
							nodeId: controller.ownNodeId,
							nonce,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToS0NonceGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Disable automatic ACKs to simulate poor connectivity
			mockNode.autoAckControllerFrames = false;

			// For this command, the NonceReport should arrive before the transmit report.
			const targetValue = BasicCCValues.targetValue.id;
			const result = await node.setValue(targetValue, 99);
			// We still expect to return a SetValueResult
			t.expect(result).toMatchObject({
				status: SetValueStatus.SuccessUnsupervised,
			});
			t.expect(
				mockNode.assertReceivedControllerFrame((frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof SecurityCCCommandEncapsulation
					&& frame.payload.encapsulated instanceof BasicCCSet
				),
			);
		},
	},
);
