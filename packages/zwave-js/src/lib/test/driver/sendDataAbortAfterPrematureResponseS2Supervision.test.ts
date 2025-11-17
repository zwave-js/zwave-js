import {
	BasicCCGet,
	BasicCCReport,
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
	"A premature S2 Nonce Report does not cause an error for a supervised transaction",
	{
		// Repro for #8406
		// debug: true,

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/s2AndSupervisionEncap",
		),

		nodeCapabilities: {
			// For now this is needed, because the security classes are not taken from the provisioning cache
			securityClasses: new Set([SecurityClass.S2_Unauthenticated]),
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

			// Just have the node respond to all Supervision Get positively
			const respondToSupervisionGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof SupervisionCCGet
					) {
						const cc = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.sessionId,
							moreUpdatesFollow: false,
							status: SupervisionStatus.Success,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToSupervisionGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Send a Basic CC Get to synchronize the SPAN state
			await node.commandClasses.Basic.get();

			// Disable automatic ACKs to simulate poor connectivity
			mockNode.autoAckControllerFrames = false;

			// Cause a de-sync
			mockNode.securityManagers.securityManager2?.deleteNonce(
				mockController.ownNodeId,
			);

			// Send a supervised command. The NonceReport should arrive before the transmit report.
			const result = await node.commandClasses.Basic.set(99);
			t.expect(isSupervisionResult(result)).toBe(true);
		},
	},
);
